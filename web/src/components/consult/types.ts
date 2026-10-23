import type { RoomSession } from './ConsultRoom';

export type ChatMsg = { id: string; sessionId?: string; senderId: string; body: string; kind: string; createdAt: string };

/** Shape of every Socket.io acknowledgement sent by src/server/realtime.ts. */
export type SocketAck = {
  ok?: boolean;
  error?: string;
  sessionId?: string;
  needed?: number;
  balance?: number;
  rate?: number;
  timeoutMs?: number;
  online?: boolean;
  role?: 'user' | 'astrologer';
  session?: RoomSession;
  messages?: ChatMsg[];
  minutesLeft?: number;
};
