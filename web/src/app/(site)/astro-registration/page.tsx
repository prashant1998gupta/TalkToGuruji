import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, CalendarClock, Clock3, IndianRupee, Globe2, ShieldCheck } from 'lucide-react';
import { currentUser } from '@/lib/auth';
import { PageHero } from '@/components/ui/primitives';
import { ApplyForm } from '@/components/consult/ApplyForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Join As Astrologer', description: 'Join the Talk to Guruji astrologer panel. Consult seekers by chat, call and video, set your own per-minute price and get paid for every minute.' };

const PERKS = [
  { i: IndianRupee, t: 'Set your own price', d: 'Choose a per-minute rate for chat, call and video. Earnings are credited after every session.' },
  { i: CalendarClock, t: 'Work when you want', d: 'Go online from your phone or laptop whenever you are free — no fixed hours.' },
  { i: Globe2, t: 'Seekers across India & abroad', d: 'Reach people looking for guidance in your languages.' },
  { i: ShieldCheck, t: 'Private & secure', d: 'Your phone number is never shared. All consultations happen inside the platform.' },
];

export default async function AstroRegistration() {
  const u = await currentUser();
  const a = u?.astrologer;
  return (
    <>
      <PageHero eyebrow="Welcome to Talk to Guruji" title="Join as an astrologer" crumbs={[{ label: 'Join As Astrologer' }]} intro="Seekers come with questions about marriage, career and relationships. Share your knowledge of Jyotish, Tarot, Numerology or Vastu and guide them — on your own schedule." />
      <section className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {PERKS.map(({ i: I, t, d }) => (
            <div key={t} className="card flex gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-saffron-50 text-saffron-600"><I className="h-5 w-5" /></span>
              <div><p className="font-semibold">{t}</p><p className="mt-0.5 text-sm text-muted">{d}</p></div>
            </div>
          ))}
          <p className="text-xs text-muted">By applying you agree to the <Link href="/astrologer-terms-and-condition" className="font-semibold text-saffron-700 underline">Astrologer Terms & Conditions</Link>.</p>
        </div>
        <div>
          {!u ? (
            <div className="card p-8 text-center">
              <p className="font-display text-2xl font-semibold">Start with your mobile number</p>
              <p className="mt-2 text-sm text-muted">Log in with OTP, then fill in your profile. It takes about three minutes.</p>
              <Link href="/login?next=/astro-registration" className="btn-primary btn-lg mt-6">Login to apply</Link>
            </div>
          ) : a ? (
            <div className="card p-8 text-center">
              {a.status === 'APPROVED' ? <BadgeCheck className="mx-auto h-12 w-12 text-leaf" /> : <Clock3 className="mx-auto h-12 w-12 text-saffron-500" />}
              <p className="mt-4 font-display text-2xl font-semibold">{a.status === 'APPROVED' ? 'You are on the panel' : a.status === 'PENDING' ? 'Application under review' : 'Application status: ' + a.status.toLowerCase()}</p>
              <p className="mt-2 text-sm text-muted">{a.status === 'PENDING' ? 'We verify every astrologer before activation — usually within 48 hours. You will get a notification here.' : a.status === 'APPROVED' ? 'Open your dashboard to go online.' : 'Please write to info@Talktoguruji.com for details.'}</p>
              {a.status === 'APPROVED' && <Link href="/astrologer-panel" className="btn-primary mt-6">Open dashboard</Link>}
            </div>
          ) : u.role !== 'USER' ? (
            <div className="card p-8 text-center text-sm text-muted">This account already has a role on the platform.</div>
          ) : (
            <ApplyForm defaultName={u.name || ''} defaultEmail={u.email || ''} />
          )}
        </div>
      </section>
    </>
  );
}
