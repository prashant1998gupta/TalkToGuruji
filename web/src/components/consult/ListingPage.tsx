import { BadgeCheck, Lock, Wallet } from 'lucide-react';
import { db } from '@/lib/db';
import { astroCardSelect } from '@/lib/queries';
import { PageHero } from '@/components/ui/primitives';
import { AstrologerDirectory } from './AstrologerDirectory';
import type { ConsultType } from './ConsultLauncher';

type Props = { mode: ConsultType; title: string; intro: string; crumb: string; eyebrow: string; allModes?: boolean; onlineOnly?: boolean; seo?: React.ReactNode };

/** Shared server shell for the chat / call / video / live astrologer listings. */
export async function ListingPage({ mode, title, intro, crumb, eyebrow, allModes, onlineOnly, seo }: Props) {
  const rows = await db.astrologer.findMany({ where: { status: 'APPROVED' }, select: { ...astroCardSelect, gender: true } });
  const statuses = Object.fromEntries(rows.map((r) => [r.id, { isOnline: r.isOnline, isBusy: r.isBusy }]));
  const cards = rows.map(({ isOnline, isBusy, ...r }) => r); // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} crumbs={[{ label: 'Astrology Services', href: '/astrology-services' }, { label: crumb }]} compact>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
          <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-gold-400" /> Verified astrologers</span>
          <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-gold-400" /> Pay per minute from wallet</span>
          <span className="flex items-center gap-2"><Lock className="h-4 w-4 text-gold-400" /> 100% private</span>
        </div>
      </PageHero>
      <section className="container-x py-8 sm:py-10">
        <AstrologerDirectory astrologers={cards} statuses={statuses} mode={mode} allModes={allModes} onlineFirstOnly={onlineOnly} />
      </section>
      {seo && <section className="container-x pb-6"><div className="card prose-guru max-w-none p-6 sm:p-10">{seo}</div></section>}
    </>
  );
}

/** SEO copy carried over from the old talktoguruji.com astrologer pages. */
export function KundliSeoCopy() {
  return (
    <>
      <h2>Enjoy the Kundali Making Service by Talk to Guruji</h2>
      <p>
        Each house in the free online kundali reveals different areas of life such as the occupational, affiliative, physical, and spiritual. The sign position of the
        planet and the aspects between them make up the foundation of the interpretation of the astrological houses. The free online kundali tool has come out as one of
        the best tools for getting Vedic insights. The free online janam kundali can later be shared with astrologers operating on Talk to Guruji to get a detailed
        analysis of your life through the online kundali free.
      </p>
      <p>
        The modern free online Kundali tool holds significant importance in society because people who are interested in astrology often require free tools initially
        to gain a preliminary perception of their astrological profile. They may contain simple facts about zodiacs, planets, and the kind of character expected in a
        given placement. A detailed analysis can be acquired through this free janam kundali by consulting with one of the many astrologers on Talk to Guruji.
      </p>
    </>
  );
}
