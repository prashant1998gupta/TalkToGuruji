import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Breadcrumbs, type Crumb } from '@/components/ui/primitives';
import { NewsletterForm } from '@/components/layout/NewsletterForm';

type Related = { href: string; label: string; desc: string; icon: LucideIcon };

/** Elegant placeholder for features the client has announced but not launched yet. */
export function ComingSoon({ eyebrow, title, intro, crumbs, related, highlights }: { eyebrow: string; title: string; intro: string; crumbs: Crumb[]; related: Related[]; highlights?: string[] }) {
  return (
    <>
      <section className="night relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <svg className="pointer-events-none absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-20" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="96" fill="none" stroke="#f2c25b" strokeWidth=".4" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="#f2c25b" strokeWidth=".3" strokeDasharray="1.5 3" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#ff8f36" strokeWidth=".3" />
          {Array.from({ length: 36 }).map((_, i) => <line key={i} x1="100" y1="4" x2="100" y2={i % 3 ? 9 : 15} stroke="#f2c25b" strokeWidth=".4" transform={`rotate(${i * 10} 100 100)`} />)}
        </svg>
        <div className="container-x relative py-12 sm:py-20">
          <Breadcrumbs items={crumbs} dark />
          <div className="mx-auto mt-10 max-w-2xl text-center">
            <p className="eyebrow !text-gold-300">{eyebrow}</p>
            <h1 className="h-display mt-3 text-4xl leading-tight text-white sm:text-6xl">{title}</h1>
            <p className="mx-auto mt-4 max-w-xl text-white/65">{intro}</p>
            <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-sm font-semibold text-gold-300">
              <span className="h-2 w-2 animate-twinkle rounded-full bg-gold-300" /> Coming Soon — We are crafting something beautiful for you. Stay tuned!
            </div>
            {highlights && (
              <ul className="mx-auto mt-8 grid max-w-xl gap-2 text-left text-sm text-white/75 sm:grid-cols-2">
                {highlights.map((h) => <li key={h} className="flex items-start gap-2 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10"><span className="text-gold-300">✦</span>{h}</li>)}
              </ul>
            )}
            <div className="mx-auto mt-10 max-w-md text-left">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-white/50">Notify me at launch</p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>
      <section className="container-x py-12">
        <h2 className="h-display mb-6 text-2xl text-night-900">Meanwhile, you can</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {related.map(({ href, label, desc, icon: I }) => (
            <Link key={href} href={href} className="card-hover group flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-night-900 text-gold-300"><I className="h-5 w-5" /></span>
              <span className="flex-1"><span className="block font-semibold">{label}</span><span className="text-xs text-muted">{desc}</span></span>
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-1 group-hover:text-saffron-600" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
