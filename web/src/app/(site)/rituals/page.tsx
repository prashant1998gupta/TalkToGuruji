import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight, Flame, Moon, Music, PartyPopper } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHero } from '@/components/ui/primitives';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Rituals — Vrats, Festivals, Aarti & Bhajan', description: 'Hindu vrats, festivals, aartis and bhajans with dates, significance and complete lyrics.' };

const KINDS = [
  { kind: 'vrats', type: 'vrat', label: 'Vrats', desc: 'Ekadashi, Pradosh, Purnima and other sacred fasts — dates, vidhi and significance.', icon: Moon },
  { kind: 'festivals', type: 'festival', label: 'Festivals', desc: 'Every major festival of the year with its story, rituals and astrological meaning.', icon: PartyPopper },
  { kind: 'aarti', type: 'aarti', label: 'Aarti', desc: 'Complete aarti lyrics for Ganesh ji, Shiv ji, Lakshmi ji, Hanuman ji and more.', icon: Flame },
  { kind: 'bhajan', type: 'bhajan', label: 'Bhajan', desc: 'Devotional bhajans to sing during puja and satsang.', icon: Music },
];

export default async function RitualsPage() {
  const counts = await db.content.groupBy({ by: ['type'], where: { type: { in: KINDS.map((k) => k.type) }, published: true }, _count: true });
  const covers = await Promise.all(KINDS.map((k) => db.content.findFirst({ where: { type: k.type, published: true, image: { not: null } }, orderBy: { createdAt: 'desc' }, select: { image: true } })));
  return (
    <>
      <PageHero eyebrow="Rituals" title="Vrats, festivals, aarti & bhajan" intro="Stay connected to the sacred rhythm of the year — know when to fast, how to celebrate and what to sing." crumbs={[{ label: 'Rituals' }]} />
      <section className="container-x grid gap-5 py-12 sm:grid-cols-2">
        {KINDS.map((k, i) => {
          const I = k.icon;
          const n = counts.find((c) => c.type === k.type)?._count ?? 0;
          return (
            <Link key={k.kind} href={`/rituals/${k.kind}`} className="card-hover group grid overflow-hidden sm:grid-cols-[1fr_1.1fr]">
              <div className="relative aspect-[16/10] bg-night-900 sm:aspect-auto">
                {covers[i]?.image && <Image src={covers[i]!.image!} alt="" fill sizes="(max-width:640px) 100vw, 25vw" className="object-cover opacity-90 transition duration-700 group-hover:scale-105" />}
              </div>
              <div className="flex flex-col p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-saffron-50 text-saffron-600"><I className="h-5 w-5" /></span>
                <h2 className="mt-4 font-display text-2xl font-semibold text-night-900">{k.label}</h2>
                <p className="mt-1.5 flex-1 text-sm text-muted">{k.desc}</p>
                <p className="mt-4 flex items-center gap-1 text-sm font-bold text-saffron-600">{n} {k.label.toLowerCase()} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></p>
              </div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
