// Lets Next.js route handlers push events through the Socket.io server that server.ts started.
// (Next bundles its own module copies, so the io instance is shared via globalThis.)
import type { Server } from 'socket.io';

const g = globalThis as unknown as { __io?: Server };

export const emitToUser = (userId: string, event: string, payload: unknown) => g.__io?.to(`user:${userId}`).emit(event, payload);
export const emitAll = (event: string, payload: unknown) => g.__io?.emit(event, payload);
