// Token helpers with no Next.js imports, so the Socket.io server can use them too.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'ttg_session';
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'local-dev-secret');

export async function signSession(userId: string) {
  return new SignJWT({ sub: userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(secret());
}

export async function verifySession(token?: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
