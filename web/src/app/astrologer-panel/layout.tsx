import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock3, Home } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui/primitives';
import { PanelNav } from '@/components/consult/PanelNav';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { default: 'Astrologer dashboard', template: '%s | Astrologer dashboard' }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser(undefined, '/astrologer-panel');
  const a = u.astrologer;

  // Applicants (or anyone without an approved profile) see a status screen instead of the panel
  if (!a || a.status !== 'APPROVED' || u.role !== 'ASTROLOGER') {
    const title = !a ? 'No astrologer profile' : a.status === 'PENDING' ? 'Application under review' : a.status === 'REJECTED' ? 'Application not approved' : 'Account suspended';
    const text = !a
      ? 'This dashboard is for astrologers on the Talk to Guruji panel.'
      : a.status === 'PENDING'
        ? 'Thank you for applying. Our team verifies every astrologer’s experience before activating the profile — usually within 48 hours. You will get a notification once approved.'
        : 'Please contact info@Talktoguruji.com for details.';
    return (
      <div className="night grid min-h-dvh place-items-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center text-ink shadow-2xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-saffron-50 text-saffron-600"><Clock3 className="h-8 w-8" /></div>
          <h1 className="h-display mt-5 text-2xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">{text}</p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/" className="btn-ghost"><Home className="h-4 w-4" /> Home</Link>
            {!a && <Link href="/astro-registration" className="btn-primary">Join as astrologer</Link>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-cream-100 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="night flex flex-col gap-4 p-4 lg:sticky lg:top-0 lg:h-dvh lg:p-5">
        <div className="flex items-center justify-between lg:block"><Logo dark /></div>
        <div className="hidden items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 lg:flex">
          <Avatar name={a.displayName} src={a.avatar} size={42} />
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{a.displayName}</p><Link href={`/astrologer/${a.slug}`} className="text-xs text-gold-300 hover:underline">View public profile</Link></div>
        </div>
        <PanelNav />
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
