'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CalendarDays, Clock, Loader2, MapPin, Mic, MicOff, MessageCircle, Orbit, PhoneOff, Send, Sparkles, Star, User, Video, VideoOff,
  Volume2, VolumeX, Wallet, X,
} from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { Avatar } from '@/components/ui/primitives';
import { useCall } from './useCall';
import type { SocketAck } from './types';
import { cx, rupees } from '@/lib/format';

type Msg = { id: string; senderId: string; body: string; kind: string; createdAt: string };
export type RoomSession = {
  id: string; type: 'CHAT' | 'CALL' | 'VIDEO'; status: string; ratePerMin: number; freeMinutes: number; billedMinutes: number; amount: number;
  startedAt: string | null; endedAt: string | null; endReason: string | null; intake: Record<string, string> | null;
  user?: { id: string; name: string }; astrologer?: { id: string; userId: string; name: string; slug: string; avatar: string | null };
};

const isClosed = (s: string) => ['ENDED', 'REJECTED', 'MISSED', 'CANCELLED'].includes(s);

export function ConsultRoom({ initial, role, meId, reviewed }: { initial: RoomSession; role: 'user' | 'astrologer'; meId: string; reviewed: boolean }) {
  const { getSocket, toast, setBalance } = useApp();
  const router = useRouter();
  const [session, setSession] = useState<RoomSession>(initial);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [balance, setBal] = useState<number | null>(null);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [lowBalance, setLowBalance] = useState(false);
  const [chatOpen, setChatOpen] = useState(initial.type === 'CHAT');
  const [unseen, setUnseen] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [ending, setEnding] = useState(false);
  const [details, setDetails] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  const isCall = session.type !== 'CHAT';
  const active = session.status === 'ACTIVE';
  const closed = isClosed(session.status);
  const other = role === 'user' ? { name: session.astrologer?.name || 'Astrologer', avatar: session.astrologer?.avatar } : { name: session.user?.name || 'User', avatar: null };

  // call hook is wired before we join the room so `rtc:ready` is never missed
  const call = useCall({ sessionId: session.id, video: session.type === 'VIDEO', isOfferer: role === 'user', enabled: isCall && !closed, getSocket });

  const join = useCallback(async () => {
    const s = await getSocket();
    s.emit('consult:join', { sessionId: initial.id }, (res: SocketAck) => {
      setLoading(false);
      if (res?.error || !res.session) { toast(res.error || 'Could not open this consultation.', 'error'); return; }
      setSession(res.session);
      setMessages(res.messages ?? []);
      if (typeof res.balance === 'number') { setBal(res.balance); setBalance(res.balance); }
      if (typeof res.minutesLeft === 'number') setMinutesLeft(res.minutesLeft);
    });
  }, [getSocket, initial.id, toast, setBalance]);

  useEffect(() => {
    let off = () => {};
    let alive = true;
    getSocket().then((s) => {
      if (!alive) return;
      const onMsg = (m: Msg) => {
        if ((m as Msg & { sessionId?: string }).sessionId && (m as Msg & { sessionId?: string }).sessionId !== initial.id) return;
        setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]));
        if (m.senderId !== meId) { setTyping(false); setUnseen((u) => u + 1); }
      };
      const onTyping = ({ userId }: { userId: string }) => {
        if (userId === meId) return;
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 3000);
      };
      const onTick = (t: { sessionId: string; billedMinutes: number; amount: number; minutesLeft: number }) => {
        if (t.sessionId !== initial.id) return;
        setSession((x) => ({ ...x, billedMinutes: t.billedMinutes, amount: t.amount }));
        setMinutesLeft(t.minutesLeft);
      };
      const onBal = ({ balance: b }: { balance: number }) => setBal(b);
      const onLow = (p: { sessionId: string }) => p.sessionId === initial.id && setLowBalance(true);
      const onStarted = (v: RoomSession) => v.id === initial.id && setSession(v);
      const onEnded = (v: RoomSession) => {
        if (v.id !== initial.id) return;
        setSession(v);
        call.hangup();
        if (role === 'user' && v.status === 'ENDED' && !reviewed) setTimeout(() => setShowReview(true), 900);
      };
      s.on('chat:message', onMsg);
      s.on('chat:typing', onTyping);
      s.on('consult:tick', onTick);
      s.on('wallet:balance', onBal);
      s.on('consult:low-balance', onLow);
      s.on('consult:started', onStarted);
      s.on('consult:ended', onEnded);
      s.on('connect', join); // (re)join whenever the socket (re)connects
      if (s.connected) join(); // otherwise the 'connect' handler joins — never both
      off = () => {
        s.off('chat:message', onMsg); s.off('chat:typing', onTyping); s.off('consult:tick', onTick); s.off('wallet:balance', onBal);
        s.off('consult:low-balance', onLow); s.off('consult:started', onStarted); s.off('consult:ended', onEnded); s.off('connect', join);
        s.emit('consult:leave', { sessionId: initial.id });
      };
    });
    return () => { alive = false; off(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, typing, chatOpen]);
  useEffect(() => { if (chatOpen) setUnseen(0); }, [chatOpen, messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !active) return;
    setText('');
    (await getSocket()).emit('chat:send', { sessionId: session.id, body }, (res: SocketAck) => res?.error && toast(res.error, 'error'));
  };
  const onType = async (v: string) => {
    setText(v);
    if (Date.now() - lastTypingSent.current > 1500) {
      lastTypingSent.current = Date.now();
      (await getSocket()).emit('chat:typing', { sessionId: session.id });
    }
  };
  const end = async () => {
    if (!confirm('End this consultation?')) return;
    setEnding(true);
    (await getSocket()).emit('consult:end', { sessionId: session.id }, () => setEnding(false));
  };
  const cancel = async () => {
    (await getSocket()).emit('consult:cancel', { sessionId: session.id });
    router.push('/astrology-services/live-astrologers');
  };

  const elapsed = useElapsed(session.startedAt, session.endedAt);
  const backHref = role === 'astrologer' ? '/astrologer-panel' : '/astrology-services/chat-with-astrologer';

  return (
    <div className="flex h-dvh flex-col bg-cream-100">
      {/* top bar */}
      <header className="night flex shrink-0 items-center gap-3 px-3 py-2.5 sm:px-5">
        <Link href={backHref} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <Avatar name={other.name} src={other.avatar} size={40} online={active} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{other.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-white/60">
            {active ? <><span className="h-1.5 w-1.5 rounded-full bg-leaf" /> {session.type === 'CHAT' ? 'Chat' : session.type === 'CALL' ? 'Voice call' : 'Video call'} · <span className="tabular-nums text-white">{elapsed}</span></>
              : session.status === 'REQUESTED' ? 'Waiting to connect…' : 'Consultation ended'}
          </p>
        </div>
        {role === 'user' && active && (
          <div className="hidden text-right text-xs sm:block">
            <p className="font-semibold text-gold-300">{balance != null ? rupees(balance) : '—'}</p>
            <p className="text-white/50">{minutesLeft != null ? `~${minutesLeft} min left` : `${rupees(session.ratePerMin)}/min`}</p>
          </div>
        )}
        {role === 'astrologer' && active && <p className="hidden text-xs text-white/60 sm:block">{rupees(session.ratePerMin)}/min · {session.billedMinutes} min billed</p>}
        {role === 'astrologer' && session.intake && (
          <button type="button" onClick={() => setDetails(true)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 lg:hidden" aria-label="Seeker details"><User className="h-4 w-4" /></button>
        )}
        {active && (
          <button type="button" onClick={end} disabled={ending} className="btn btn-sm bg-rose text-white hover:brightness-110">
            {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />} End
          </button>
        )}
      </header>

      {lowBalance && active && role === 'user' && (
        <div className="flex shrink-0 items-center gap-3 bg-saffron-500 px-4 py-2 text-sm font-medium text-white">
          <Wallet className="h-4 w-4 shrink-0" />
          <span className="flex-1">Low balance — about {minutesLeft ?? 1} minute left. Recharge to keep talking.</span>
          <a href="/wallet" target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-1 text-xs font-bold text-saffron-700">Recharge</a>
          <button type="button" onClick={() => setLowBalance(false)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* call stage */}
        {isCall && (
          <section className={cx('relative min-w-0 flex-1 overflow-hidden bg-night-950', chatOpen && 'hidden md:block')}>
            <CallStage type={session.type} call={call} other={other} active={active} elapsed={elapsed} />
            {active && (
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
                <RoundBtn onClick={call.toggleMute} active={call.muted} label={call.muted ? 'Unmute' : 'Mute'}>{call.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</RoundBtn>
                {session.type === 'VIDEO' && <RoundBtn onClick={call.toggleCamera} active={call.cameraOff} label={call.cameraOff ? 'Camera on' : 'Camera off'}>{call.cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}</RoundBtn>}
                <SpeakerBtn />
                <RoundBtn onClick={() => setChatOpen((c) => !c)} label="Chat">
                  <MessageCircle className="h-5 w-5" />
                  {unseen > 0 && !chatOpen && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold">{unseen}</span>}
                </RoundBtn>
                <button type="button" onClick={end} className="grid h-14 w-14 place-items-center rounded-full bg-rose text-white shadow-lg hover:brightness-110" aria-label="End call"><PhoneOff className="h-6 w-6" /></button>
              </div>
            )}
          </section>
        )}

        {/* chat panel */}
        {(!isCall || chatOpen) && (
          <section className={cx('flex min-w-0 flex-col bg-cream-50', isCall ? 'w-full border-l border-line md:w-[380px]' : 'flex-1')}>
            {isCall && (
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <p className="text-sm font-semibold">Chat</p>
                <button type="button" onClick={() => setChatOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-cream-200" aria-label="Close chat"><X className="h-4 w-4" /></button>
              </div>
            )}
            <div ref={scroller} className="flex-1 space-y-2.5 overflow-y-auto px-3 py-4 sm:px-6" aria-live="polite">
              {loading && <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-saffron-500" /></div>}
              <div className="mx-auto max-w-3xl space-y-2.5">
                {messages.map((m) =>
                  m.kind === 'SYSTEM' ? (
                    <p key={m.id} className="mx-auto w-fit max-w-[90%] rounded-full bg-cream-200 px-3 py-1 text-center text-[11.5px] font-medium text-ink/65">{m.body}</p>
                  ) : (
                    <div key={m.id} className={cx('flex', m.senderId === meId ? 'justify-end' : 'justify-start')}>
                      <div className={cx('max-w-[80%] rounded-2xl px-3.5 py-2 text-[14.5px] leading-relaxed shadow-soft', m.senderId === meId ? 'rounded-br-md bg-night-900 text-white' : 'rounded-bl-md bg-white text-ink ring-1 ring-line')}>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={cx('mt-0.5 text-right text-[10px]', m.senderId === meId ? 'text-white/50' : 'text-muted')}>{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ),
                )}
                {typing && (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="flex gap-1 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-line">
                      {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </span>
                    {other.name.split(' ')[0]} is typing…
                  </div>
                )}
              </div>
            </div>
            {active ? (
              <form onSubmit={send} className="shrink-0 border-t border-line bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                <div className="mx-auto flex max-w-3xl items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => onType(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as unknown as React.FormEvent); } }}
                    rows={1}
                    placeholder="Type your message…"
                    aria-label="Message"
                    className="input max-h-32 min-h-[46px] flex-1 resize-none !rounded-2xl"
                  />
                  <button className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-saffron-500 text-white transition hover:bg-saffron-600 disabled:opacity-40" disabled={!text.trim()} aria-label="Send">
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            ) : session.status === 'REQUESTED' && role === 'user' ? (
              <div className="shrink-0 border-t border-line bg-white p-4 text-center text-sm">
                <p className="text-muted">Waiting for {other.name} to accept your request…</p>
                <button type="button" onClick={cancel} className="btn-ghost btn-sm mt-2">Cancel request</button>
              </div>
            ) : null}
          </section>
        )}

        {/* astrologer intake side panel */}
        {role === 'astrologer' && session.intake && (
          <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-line bg-white p-5 lg:block">
            <IntakePanel intake={session.intake} userName={session.user?.name || ''} />
          </aside>
        )}
      </div>

      {details && session.intake && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Seeker details">
          <div className="absolute inset-0 bg-night-950/50" onClick={() => setDetails(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-5 pb-8">
            <button type="button" onClick={() => setDetails(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-cream-100" aria-label="Close"><X className="h-4 w-4" /></button>
            <IntakePanel intake={session.intake} userName={session.user?.name || ''} />
          </div>
        </div>
      )}

      {closed && <EndedSheet session={session} role={role} elapsed={elapsed} onReview={() => setShowReview(true)} reviewed={reviewed} />}
      {showReview && <ReviewModal sessionId={session.id} astroName={other.name} onClose={() => setShowReview(false)} onDone={() => { setShowReview(false); toast('Thank you for your review!', 'success'); router.refresh(); }} />}
    </div>
  );
}

function useElapsed(start: string | null, end: string | null) {
  // null until mounted so server and client render the same text (no hydration mismatch)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (!start || end) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [start, end]);
  if (!start || (!end && now == null)) return '00:00';
  const ms = Math.max(0, (end ? new Date(end).getTime() : now!) - new Date(start).getTime());
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function CallStage({ type, call, other, active, elapsed }: { type: string; call: ReturnType<typeof useCall>; other: { name: string; avatar?: string | null }; active: boolean; elapsed: string }) {
  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const v = remoteRef.current;
    if (!v) return;
    v.srcObject = call.remote;
    // after a page reload the browser may block unmuted autoplay until the user taps
    if (call.remote) v.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  }, [call.remote]);
  useEffect(() => { if (localRef.current) localRef.current.srcObject = call.local; }, [call.local]);
  const connected = call.state === 'connected';
  const label = !active ? 'Call ended' : connected ? elapsed : call.state === 'failed' ? 'Connection failed — reconnecting…' : 'Connecting…';
  const showRemoteVideo = type === 'VIDEO' && connected && !!call.remote?.getVideoTracks().length;

  return (
    <div className="relative h-full w-full">
      {/* remote media (audio always plays through this element) */}
      <video ref={remoteRef} autoPlay playsInline data-remote className={cx('absolute inset-0 h-full w-full object-cover', !showRemoteVideo && 'opacity-0')} />
      {!showRemoteVideo && (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgb(75_59_203/.45),transparent_60%)]">
          <div className="flex flex-col items-center text-center text-white">
            <div className="relative grid place-items-center">
              {connected && active && (
                <>
                  <span className="absolute h-44 w-44 animate-ping rounded-full bg-saffron-400/15 [animation-duration:2.4s]" />
                  <span className="absolute h-56 w-56 animate-ping rounded-full bg-gold-400/10 [animation-duration:3s]" />
                </>
              )}
              <Avatar name={other.name} src={other.avatar} size={132} />
            </div>
            <p className="mt-8 font-display text-2xl font-semibold">{other.name}</p>
            <p className="mt-1 text-sm tabular-nums text-white/65">{label}</p>
          </div>
        </div>
      )}
      {showRemoteVideo && <p className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">{label}</p>}
      {type === 'VIDEO' && call.local && (
        <video ref={localRef} autoPlay playsInline muted className={cx('absolute right-4 top-4 aspect-[3/4] w-28 rounded-2xl object-cover shadow-2xl ring-2 ring-white/30 sm:w-40 [transform:scaleX(-1)]', call.cameraOff && 'opacity-30')} />
      )}
      {call.mediaError && <p className="absolute inset-x-4 top-4 mx-auto max-w-md rounded-2xl bg-rose/90 px-4 py-3 text-center text-sm text-white">{call.mediaError}</p>}
      {blocked && active && (
        <button type="button" onClick={() => remoteRef.current?.play().then(() => setBlocked(false)).catch(() => {})} className="btn-gold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl">
          <Volume2 className="h-4 w-4" /> Tap to enable audio
        </button>
      )}
    </div>
  );
}

function RoundBtn({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={active} className={cx('relative grid h-14 w-14 place-items-center rounded-full backdrop-blur transition', active ? 'bg-white text-night-900' : 'bg-white/15 text-white hover:bg-white/25')}>
      {children}
    </button>
  );
}

function SpeakerBtn() {
  const [off, setOff] = useState(false);
  const toggle = () => {
    document.querySelectorAll<HTMLVideoElement>('video[data-remote]').forEach((v) => (v.muted = !off));
    setOff(!off);
  };
  return <RoundBtn onClick={toggle} active={off} label={off ? 'Speaker on' : 'Speaker off'}>{off ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</RoundBtn>;
}

function IntakePanel({ intake, userName }: { intake: Record<string, string>; userName: string }) {
  const q = new URLSearchParams({ name: intake.name || userName, gender: intake.gender || 'Male', date: intake.dob || '', time: intake.tob || '', place: intake.place || '' });
  const rows = [
    { i: User, k: 'Name', v: `${intake.name || userName}${intake.gender ? ` · ${intake.gender}` : ''}` },
    { i: CalendarDays, k: 'Date of birth', v: intake.dob ? new Date(intake.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
    { i: Clock, k: 'Time of birth', v: intake.tob || 'Not known' },
    { i: MapPin, k: 'Place of birth', v: intake.place || '—' },
    { i: Sparkles, k: 'Concern', v: intake.concern || '—' },
  ];
  return (
    <div>
      <p className="eyebrow">Seeker details</p>
      <dl className="mt-4 space-y-4">
        {rows.map(({ i: I, k, v }) => (
          <div key={k} className="flex gap-3">
            <I className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" />
            <div><dt className="text-xs text-muted">{k}</dt><dd className="text-sm font-semibold">{v}</dd></div>
          </div>
        ))}
      </dl>
      <a href={`/astrology-services/free-kundli?${q}`} target="_blank" rel="noreferrer" className="btn-dark mt-6 w-full"><Orbit className="h-4 w-4" /> Open their kundli</a>
    </div>
  );
}

function EndedSheet({ session, role, elapsed, onReview, reviewed }: { session: RoomSession; role: 'user' | 'astrologer'; elapsed: string; onReview: () => void; reviewed: boolean }) {
  const ended = session.status === 'ENDED';
  const title = ended ? 'Consultation complete' : session.status === 'MISSED' ? 'No response' : session.status === 'REJECTED' ? 'Request declined' : 'Request cancelled';
  const share = useMemo(() => session.amount, [session.amount]);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:bottom-6 sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:p-0">
      <div className="animate-fade-up rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-line">
        <p className="font-display text-xl font-semibold">{title}</p>
        {ended ? (
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[['Duration', elapsed], ['Billed', `${session.billedMinutes} min`], [role === 'user' ? 'Charged' : 'Billed amount', rupees(share)]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-cream-100 p-2.5"><dt className="text-[11px] text-muted">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>
            ))}
          </dl>
        ) : (
          <p className="mt-1 text-sm text-muted">No money was charged for this request.</p>
        )}
        <div className="mt-4 flex gap-2">
          {role === 'user' ? (
            <>
              {ended && !reviewed && <button type="button" onClick={onReview} className="btn-primary flex-1"><Star className="h-4 w-4" /> Rate</button>}
              <Link href="/astrology-services/live-astrologers" className="btn-ghost flex-1">Find astrologers</Link>
            </>
          ) : (
            <Link href="/astrologer-panel" className="btn-dark flex-1">Back to dashboard</Link>
          )}
          {ended && role === 'user' && <Link href={`/account/consultations/${session.id}`} className="btn-ghost">Transcript</Link>}
        </div>
      </div>
    </div>
  );
}

export function ReviewModal({ sessionId, astroName, onClose, onDone }: { sessionId: string; astroName: string; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    setBusy(true);
    const r = await fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, rating, comment }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    onDone();
  };
  const words = ['', 'Poor', 'Okay', 'Good', 'Very good', 'Excellent'];
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-night-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Rate consultation">
      <div className="w-full max-w-sm animate-fade-up rounded-3xl bg-white p-6 text-center shadow-2xl">
        <p className="font-display text-2xl font-semibold">How was {astroName.split(' ').slice(-1)[0]}?</p>
        <p className="mt-1 text-sm text-muted">Your review helps other seekers choose.</p>
        <div className="mt-5 flex justify-center gap-1.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} star${i > 1 ? 's' : ''}`}>
              <Star className={cx('h-9 w-9 transition', i <= (hover || rating) ? 'scale-110 fill-gold-400 text-gold-400' : 'text-cream-300')} />
            </button>
          ))}
        </div>
        <p className="mt-1 h-5 text-sm font-semibold text-saffron-600">{words[hover || rating]}</p>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={600} placeholder="Share a few words (optional)" className="input mt-3 resize-none" />
        {err && <p className="mt-2 text-sm text-rose">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Later</button>
          <button type="button" onClick={submit} disabled={!rating || busy} className="btn-primary flex-1">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
}
