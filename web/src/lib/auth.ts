import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { SESSION_COOKIE, signSession, verifySession } from './auth-token';

export { SESSION_COOKIE, signSession, verifySession };

export type Role = 'USER' | 'ASTROLOGER' | 'ADMIN';

export async function setSessionCookie(userId: string) {
  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === 'production' });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentUser() {
  const id = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id }, include: { astrologer: true } });
  if (!user || user.blocked) return null;
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** For server components/pages: redirect to login when signed out or lacking role. */
export async function requireUser(roles?: Role[], next = '/') {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.role as Role)) redirect('/');
  return user;
}

/** For route handlers: returns user or a 401/403 Response. */
export async function apiUser(roles?: Role[]): Promise<CurrentUser | Response> {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Please log in to continue.' }, { status: 401 });
  if (roles && !roles.includes(user.role as Role)) return Response.json({ error: 'Not allowed.' }, { status: 403 });
  return user;
}
