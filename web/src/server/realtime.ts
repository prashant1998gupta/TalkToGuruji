/**
 * Realtime layer (Socket.io): astrologer presence, consultation lifecycle,
 * chat, per-minute wallet billing and WebRTC signaling for calls.
 */
import type { Server, Socket } from 'socket.io';
import type { Astrologer, ConsultSession, User } from '@prisma/client';
import { db } from '../lib/db';
import { verifySession, SESSION_COOKIE } from '../lib/auth-token';
import { walletMove, InsufficientBalance } from '../lib/wallet';

const REQUEST_TIMEOUT_MS = 60_000;
const MIN_PREPAID_MINUTES = 5;
const OFFLINE_GRACE_MS = 45_000; // astrologer closed every tab → offline
const DROP_GRACE_MS = 90_000; // a participant vanished mid-session → end it so billing stops

type Ack = (res: Record<string, unknown>) => void;
const noop: Ack = () => {};

const billingTimers = new Map<string, NodeJS.Timeout>();
const requestTimers = new Map<string, NodeJS.Timeout>();
const offlineTimers = new Map<string, NodeJS.Timeout>();
const dropTimers = new Map<string, NodeJS.Timeout>(); // key: sessionId:userId
const connections = new Map<string, number>(); // userId -> open sockets

let io: Server;
export const getIO = () => io;

function parseCookie(header: string | undefined, name: string) {
  const m = (header || '').match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

type SessionRow = ConsultSession & { user?: User | null; astrologer?: Astrologer | null };
const sessionView = (s: SessionRow | null) => !s ? null : ({
  id: s.id, type: s.type, status: s.status, ratePerMin: s.ratePerMin, freeMinutes: s.freeMinutes, billedMinutes: s.billedMinutes,
  amount: s.amount, startedAt: s.startedAt, endedAt: s.endedAt, endReason: s.endReason, intake: s.intake ? JSON.parse(s.intake) : null,
  user: s.user ? { id: s.user.id, name: s.user.name || 'User', phone: s.user.phone.slice(0, 2) + '******' + s.user.phone.slice(-2) } : undefined,
  astrologer: s.astrologer ? { id: s.astrologer.id, userId: s.astrologer.userId, name: s.astrologer.displayName, slug: s.astrologer.slug, avatar: s.astrologer.avatar } : undefined,
});

const withPeople = { user: true, astrologer: true } as const;
const CLOSED = ['ENDED', 'REJECTED', 'MISSED', 'CANCELLED'];

export async function broadcastAstroStatus(astrologerId: string) {
  const a = await db.astrologer.findUnique({ where: { id: astrologerId }, select: { id: true, isOnline: true, isBusy: true } });
  if (a) io.emit('astro:status', a);
}

export function notifyUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

async function system(sessionId: string, body: string) {
  const m = await db.message.create({ data: { sessionId, senderId: 'system', body, kind: 'SYSTEM' } });
  io.to(`session:${sessionId}`).emit('chat:message', m);
}

const ENDED_TEXT: Record<string, string> = {
  USER_ENDED: 'ended by user', ASTROLOGER_ENDED: 'ended by astrologer', LOW_BALANCE: 'wallet balance exhausted',
  USER_DISCONNECTED: 'user disconnected', ASTROLOGER_DISCONNECTED: 'astrologer disconnected', SERVER_RESTART: 'server restarted',
  ADMIN_ENDED: 'ended by admin', CLOSED: 'closed',
};

/** Close a session, settle earnings, free the astrologer. Idempotent. */
export async function endSession(sessionId: string, reason: string) {
  clearInterval(billingTimers.get(sessionId));
  billingTimers.delete(sessionId);
  clearTimeout(requestTimers.get(sessionId));
  requestTimers.delete(sessionId);
  for (const [k, t] of dropTimers) if (k.startsWith(sessionId + ':')) { clearTimeout(t); dropTimers.delete(k); }

  const s = await db.consultSession.findUnique({ where: { id: sessionId }, include: { astrologer: true } });
  if (!s || CLOSED.includes(s.status)) return;

  const wasActive = s.status === 'ACTIVE';
  const status = wasActive ? 'ENDED' : reason === 'REJECTED' ? 'REJECTED' : reason === 'MISSED' ? 'MISSED' : 'CANCELLED';
  // claim the close so concurrent callers (timer + button) settle only once
  const claimed = await db.consultSession.updateMany({ where: { id: s.id, status: s.status }, data: { status, endedAt: new Date(), endReason: reason } });
  if (claimed.count === 0) return;
  const share = Math.floor((s.amount * (100 - s.astrologer.commission)) / 100);
  await db.astrologer.update({
    where: { id: s.astrologerId },
    data: wasActive ? { isBusy: false, earnings: { increment: share }, totalMinutes: { increment: s.billedMinutes } } : { isBusy: false },
  });
  if (wasActive) {
    await system(s.id, `Session ended (${ENDED_TEXT[reason] || reason.toLowerCase()}). ${s.billedMinutes} min · ₹${(s.amount / 100).toFixed(0)} charged.`);
    await db.notification.create({ data: { userId: s.userId, title: 'Consultation ended', body: `Your ${s.type.toLowerCase()} with ${s.astrologer.displayName} has ended. Leave a review!`, link: `/account/consultations/${s.id}` } });
  } else if (status === 'MISSED' || status === 'REJECTED') {
    await db.notification.create({ data: { userId: s.userId, title: status === 'MISSED' ? 'Astrologer didn’t respond' : 'Request declined', body: `${s.astrologer.displayName} couldn’t take your ${s.type.toLowerCase()} request. No money was charged.`, link: '/astrology-services/live-astrologers' } });
  }
  const full = await db.consultSession.findUnique({ where: { id: s.id }, include: withPeople });
  io.to(`user:${s.userId}`).to(`user:${s.astrologer.userId}`).to(`session:${s.id}`).emit('consult:ended', sessionView(full));
  await broadcastAstroStatus(s.astrologerId);
}

/** Charge one minute (or consume a free one). Ends the session if the wallet can't cover it. */
async function billMinute(sessionId: string) {
  const s = await db.consultSession.findUnique({ where: { id: sessionId } });
  if (!s || s.status !== 'ACTIVE') return endSession(sessionId, 'CLOSED');
  const minuteIndex = s.billedMinutes; // minutes already started
  const charge = minuteIndex < s.freeMinutes ? 0 : s.ratePerMin;
  try {
    let balance: number;
    if (charge > 0) balance = await walletMove(s.userId, -charge, 'CONSULT', `${s.type} minute ${minuteIndex + 1}`, s.id);
    else balance = (await db.user.findUniqueOrThrow({ where: { id: s.userId } })).walletBalance;
    const u = await db.consultSession.update({ where: { id: s.id }, data: { billedMinutes: { increment: 1 }, amount: { increment: charge } } });
    const freeLeft = Math.max(0, s.freeMinutes - u.billedMinutes);
    const minutesLeft = freeLeft + Math.floor(balance / s.ratePerMin);
    io.to(`session:${s.id}`).emit('consult:tick', { sessionId: s.id, billedMinutes: u.billedMinutes, amount: u.amount, minutesLeft });
    io.to(`user:${s.userId}`).emit('wallet:balance', { balance }); // balance only goes to the user, never the astrologer
    if (minutesLeft <= 1) io.to(`user:${s.userId}`).emit('consult:low-balance', { sessionId: s.id, minutesLeft, balance });
  } catch (e) {
    if (e instanceof InsufficientBalance) return endSession(sessionId, 'LOW_BALANCE');
    throw e;
  }
}

async function startSession(sessionId: string) {
  // only one accept can win (two astrologer tabs, double click)
  const claimed = await db.consultSession.updateMany({ where: { id: sessionId, status: 'REQUESTED' }, data: { status: 'ACTIVE', startedAt: new Date() } });
  if (claimed.count === 0) return false;
  clearTimeout(requestTimers.get(sessionId));
  requestTimers.delete(sessionId);
  const s = await db.consultSession.findUniqueOrThrow({ where: { id: sessionId }, include: withPeople });
  // tell both sides first so they navigate into the room, then bill the first minute up-front
  io.to(`user:${s.userId}`).to(`user:${s.astrologer.userId}`).emit('consult:started', sessionView(s));
  await system(s.id, `${s.astrologer.displayName} joined. Your ${s.type.toLowerCase()} consultation has started.`);
  billingTimers.set(s.id, setInterval(() => billMinute(s.id).catch(console.error), 60_000));
  await billMinute(s.id); // ends the session itself if even the first minute can't be paid
  return true;
}

async function isParticipant(sessionId: string, userId: string) {
  const s = await db.consultSession.findUnique({ where: { id: sessionId }, include: withPeople });
  if (!s) return null;
  if (s.userId !== userId && s.astrologer.userId !== userId) return null;
  return s;
}

/** When someone's last socket goes away during an active session, end it after a grace period. */
async function scheduleDropChecks(userId: string) {
  const active = await db.consultSession.findMany({ where: { status: 'ACTIVE', OR: [{ userId }, { astrologer: { userId } }] }, include: { astrologer: true } });
  for (const s of active) {
    const key = `${s.id}:${userId}`;
    clearTimeout(dropTimers.get(key));
    dropTimers.set(key, setTimeout(() => {
      dropTimers.delete(key);
      if ((connections.get(userId) || 0) > 0) return;
      endSession(s.id, s.userId === userId ? 'USER_DISCONNECTED' : 'ASTROLOGER_DISCONNECTED').catch(console.error);
    }, DROP_GRACE_MS));
  }
}

function readyIfBothPresent(sessionId: string, userId: string, astroUserId: string) {
  const room = io.sockets.adapter.rooms.get(`session:${sessionId}`) || new Set<string>();
  const people = new Set([...room].map((id) => io.sockets.sockets.get(id)?.data.userId));
  if (people.has(userId) && people.has(astroUserId)) io.to(`session:${sessionId}`).emit('rtc:ready', { sessionId });
}

export function attachRealtime(server: Server) {
  io = server;
  (globalThis as unknown as { __io?: Server }).__io = server;

  // Sessions left open by a previous server process can't be billed anymore — close them.
  (async () => {
    const stale = await db.consultSession.findMany({ where: { status: { in: ['ACTIVE', 'REQUESTED'] } } });
    for (const s of stale) await endSession(s.id, 'SERVER_RESTART');
    await db.astrologer.updateMany({ where: { isBusy: true }, data: { isBusy: false } });
  })().catch(console.error);

  // Resolve identity before 'connection' so handlers are attached synchronously
  // (events sent right after connect would otherwise be dropped).
  io.use(async (socket, next) => {
    try {
      const userId = await verifySession(parseCookie(socket.handshake.headers.cookie, SESSION_COOKIE));
      if (userId) {
        const user = await db.user.findUnique({ where: { id: userId }, include: { astrologer: true } });
        if (user && !user.blocked) {
          socket.data.userId = user.id;
          socket.data.astroId = user.astrologer?.status === 'APPROVED' ? user.astrologer.id : null;
        }
      }
      next(); // guests may connect to receive presence updates
    } catch (e) {
      next(e as Error);
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId: string | undefined = socket.data.userId;
    if (!userId) return; // guest: only receives broadcasts
    const astroId: string | null = socket.data.astroId;
    socket.join(`user:${userId}`);
    connections.set(userId, (connections.get(userId) || 0) + 1);
    for (const [k, t] of dropTimers) if (k.endsWith(':' + userId)) { clearTimeout(t); dropTimers.delete(k); }

    if (astroId) {
      clearTimeout(offlineTimers.get(astroId));
      // Re-deliver any pending request the astrologer may have missed while reconnecting
      db.consultSession.findMany({ where: { astrologerId: astroId, status: 'REQUESTED' }, include: withPeople })
        .then((pending) => pending.forEach((p) => socket.emit('consult:incoming', sessionView(p))))
        .catch(console.error);
    }

    socket.on('disconnect', () => {
      const n = Math.max(0, (connections.get(userId) || 1) - 1);
      connections.set(userId, n);
      if (n > 0) return;
      scheduleDropChecks(userId).catch(console.error);
      if (astroId) {
        offlineTimers.set(astroId, setTimeout(async () => {
          if ((connections.get(userId) || 0) > 0) return;
          await db.astrologer.update({ where: { id: astroId }, data: { isOnline: false } });
          await broadcastAstroStatus(astroId);
        }, OFFLINE_GRACE_MS));
      }
    });

    // ----- user asks for a consultation -----
    socket.on('consult:request', async ({ astrologerId, type, intake }: { astrologerId: string; type: 'CHAT' | 'CALL' | 'VIDEO'; intake?: Record<string, string> }, ack: Ack = noop) => {
      try {
        if (!['CHAT', 'CALL', 'VIDEO'].includes(type)) return ack({ error: 'Invalid consultation type.' });
        const a = await db.astrologer.findUnique({ where: { id: astrologerId } });
        if (!a || a.status !== 'APPROVED') return ack({ error: 'Astrologer not available.' });
        if (a.userId === userId) return ack({ error: 'You cannot consult yourself.' });
        if (!a.isOnline) return ack({ error: `${a.displayName} is offline right now.` });
        const enabled = type === 'CHAT' ? a.isChat : type === 'CALL' ? a.isCall : a.isVideo;
        if (!enabled) return ack({ error: `${type.toLowerCase()} is not offered by this astrologer.` });
        const open = await db.consultSession.findFirst({ where: { userId, status: { in: ['REQUESTED', 'ACTIVE'] } } });
        if (open) return ack({ error: 'You already have an ongoing consultation.', sessionId: open.status === 'ACTIVE' ? open.id : undefined });

        const rate = type === 'CHAT' ? a.chatPrice : type === 'CALL' ? a.callPrice : a.videoPrice;
        const hadSession = await db.consultSession.count({ where: { userId, status: 'ENDED' } });
        const freeMinutes = hadSession === 0 ? a.freeMinutes : 0;
        const me = await db.user.findUniqueOrThrow({ where: { id: userId } });
        const needed = freeMinutes > 0 ? 0 : rate * MIN_PREPAID_MINUTES;
        if (me.walletBalance < needed) return ack({ error: 'LOW_BALANCE', needed, balance: me.walletBalance, rate });

        // atomically reserve the astrologer — only one pending/active consultation at a time
        const reserved = await db.astrologer.updateMany({ where: { id: a.id, isBusy: false, isOnline: true }, data: { isBusy: true } });
        if (reserved.count === 0) return ack({ error: `${a.displayName} is busy in another consultation. Please try again in a few minutes.` });

        const s = await db.consultSession.create({
          data: { userId, astrologerId, type, ratePerMin: rate, freeMinutes, intake: intake ? JSON.stringify(intake).slice(0, 2000) : null },
          include: withPeople,
        });
        await broadcastAstroStatus(a.id);
        io.to(`user:${a.userId}`).emit('consult:incoming', sessionView(s));
        requestTimers.set(s.id, setTimeout(() => endSession(s.id, 'MISSED').catch(console.error), REQUEST_TIMEOUT_MS));
        ack({ ok: true, session: sessionView(s), timeoutMs: REQUEST_TIMEOUT_MS });
      } catch (e) { console.error(e); ack({ error: 'Something went wrong.' }); }
    });

    socket.on('consult:cancel', async ({ sessionId }, ack: Ack = noop) => {
      const s = await db.consultSession.findUnique({ where: { id: sessionId } });
      if (!s || s.userId !== userId || s.status !== 'REQUESTED') return ack({ error: 'Cannot cancel.' });
      await endSession(s.id, 'CANCELLED');
      ack({ ok: true });
    });

    // ----- astrologer answers -----
    socket.on('consult:accept', async ({ sessionId }, ack: Ack = noop) => {
      try {
        const s = await db.consultSession.findUnique({ where: { id: sessionId }, include: { astrologer: true } });
        if (!s || s.astrologer.userId !== userId) return ack({ error: 'Not your request.' });
        if (!(await startSession(s.id))) return ack({ error: 'This request is no longer waiting.' });
        ack({ ok: true });
      } catch (e) { console.error(e); ack({ error: 'Something went wrong.' }); }
    });

    socket.on('consult:reject', async ({ sessionId }, ack: Ack = noop) => {
      const s = await db.consultSession.findUnique({ where: { id: sessionId }, include: { astrologer: true } });
      if (!s || s.astrologer.userId !== userId || s.status !== 'REQUESTED') return ack({ error: 'Cannot reject.' });
      await endSession(s.id, 'REJECTED');
      ack({ ok: true });
    });

    // ----- inside a session -----
    socket.on('consult:join', async ({ sessionId }, ack: Ack = noop) => {
      const s = await isParticipant(sessionId, userId);
      if (!s) return ack({ error: 'Session not found.' });
      socket.join(`session:${sessionId}`);
      const messages = await db.message.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
      const me = await db.user.findUniqueOrThrow({ where: { id: userId } });
      const role = s.userId === userId ? 'user' : 'astrologer';
      const minutesLeft = role === 'user' && s.status === 'ACTIVE' ? Math.max(0, s.freeMinutes - s.billedMinutes) + Math.floor(me.walletBalance / s.ratePerMin) : undefined;
      ack({ ok: true, role, session: sessionView(s), messages, balance: role === 'user' ? me.walletBalance : undefined, minutesLeft });
      // both parties present → the user (offerer) may start WebRTC negotiation
      if (s.status === 'ACTIVE' && s.type !== 'CHAT') readyIfBothPresent(sessionId, s.userId, s.astrologer.userId);
    });

    // Call peers ping while not connected; answering with rtc:ready makes the handshake self-healing
    socket.on('rtc:hello', async ({ sessionId }) => {
      if (!socket.rooms.has(`session:${sessionId}`)) return;
      const s = await db.consultSession.findUnique({ where: { id: sessionId }, include: { astrologer: true } });
      if (s?.status === 'ACTIVE' && s.type !== 'CHAT') readyIfBothPresent(sessionId, s.userId, s.astrologer.userId);
    });

    socket.on('consult:leave', ({ sessionId }) => socket.leave(`session:${sessionId}`));

    socket.on('chat:send', async ({ sessionId, body }: { sessionId: string; body: string }, ack: Ack = noop) => {
      const text = String(body || '').trim().slice(0, 2000);
      if (!text) return ack({ error: 'Empty message.' });
      const s = await isParticipant(sessionId, userId);
      if (!s || s.status !== 'ACTIVE') return ack({ error: 'Session is not active.' });
      const m = await db.message.create({ data: { sessionId, senderId: userId, body: text } });
      io.to(`session:${sessionId}`).emit('chat:message', m);
      ack({ ok: true, message: m });
    });

    socket.on('chat:typing', ({ sessionId }) => {
      if (socket.rooms.has(`session:${sessionId}`)) socket.to(`session:${sessionId}`).emit('chat:typing', { userId });
    });

    socket.on('rtc:signal', ({ sessionId, data }) => {
      if (!socket.rooms.has(`session:${sessionId}`)) return;
      socket.to(`session:${sessionId}`).emit('rtc:signal', { from: userId, data });
    });

    socket.on('consult:end', async ({ sessionId }, ack: Ack = noop) => {
      const s = await isParticipant(sessionId, userId);
      if (!s) return ack({ error: 'Session not found.' });
      await endSession(sessionId, s.userId === userId ? 'USER_ENDED' : 'ASTROLOGER_ENDED');
      ack({ ok: true });
    });

    // ----- astrologer availability -----
    socket.on('astro:set-online', async ({ online }: { online: boolean }, ack: Ack = noop) => {
      if (!astroId) return ack({ error: 'Not an approved astrologer.' });
      await db.astrologer.update({ where: { id: astroId }, data: { isOnline: !!online } });
      await broadcastAstroStatus(astroId);
      ack({ ok: true, online: !!online });
    });
  });
}
