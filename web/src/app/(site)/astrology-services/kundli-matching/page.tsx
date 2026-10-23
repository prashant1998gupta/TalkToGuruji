import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Heart, MessageCircle, RotateCcw } from 'lucide-react';
import { Breadcrumbs, PageHero } from '@/components/ui/primitives';
import { BirthFields } from '@/components/astro/BirthFields';
import { ScoreRing } from '@/components/astro/ScoreRing';
import { birthFromParams, cityOption } from '@/lib/astro/input';
import { matchCharts } from '@/lib/astro/matching';
import { MATCHING_COPY } from '@/lib/astro/seo-copy';

export const metadata: Metadata = {
  title: 'Kundli Matching – Free Gun Milan (36 Guna) for Marriage',
  description: MATCHING_COPY.intro,
};

type SP = Promise<Record<string, string | string[] | undefined>>;
const s = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

export default async function KundliMatchingPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const boy = birthFromParams(sp, 'b_');
  const girl = birthFromParams(sp, 'g_');
  const attempted = Object.keys(sp).length > 0;

  if (boy && girl) {
    const m = matchCharts({ ...boy, gender: 'Male' }, { ...girl, gender: 'Female' });
    const tone = m.verdict.tone === 'green' ? 'text-leaf' : m.verdict.tone === 'saffron' ? 'text-saffron-300' : 'text-rose';
    return (
      <>
        <section className="night relative overflow-hidden">
          <div className="container-x relative py-10 sm:py-14">
            <Breadcrumbs items={[{ label: 'Kundli Matching', href: '/astrology-services/kundli-matching' }, { label: `${m.boy.name} & ${m.girl.name}` }]} dark />
            <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
              <Person p={m.boy} side="Boy" />
              <div className="flex flex-col items-center text-white">
                <ScoreRing value={m.total} max={36} />
                <p className={`mt-2 font-display text-2xl font-semibold ${tone}`}>{m.verdict.label}</p>
                <p className="mt-1 max-w-xs text-center text-sm text-white/60">{m.verdict.text}</p>
              </div>
              <Person p={m.girl} side="Girl" />
            </div>
          </div>
        </section>

        <div className="container-x space-y-10 py-12">
          <section>
            <h2 className="h-display mb-4 text-2xl text-night-900 sm:text-3xl">Ashtakoot guna milan</h2>
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[680px] whitespace-nowrap text-sm">
                <thead>
                  <tr className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3">Koota</th><th className="px-4 py-3">Boy</th><th className="px-4 py-3">Girl</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Area of life</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {m.kootas.map((k) => (
                    <tr key={k.name}>
                      <td className="px-4 py-3 font-semibold text-night-900">{k.name}</td>
                      <td className="px-4 py-3">{k.boy}</td>
                      <td className="px-4 py-3">{k.girl}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-12 font-bold tabular-nums">{k.score}/{k.max}</span>
                          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-cream-200">
                            <span className={`block h-full rounded-full ${k.score / k.max >= 0.5 ? 'bg-leaf' : k.score > 0 ? 'bg-saffron-500' : 'bg-rose'}`} style={{ width: `${(k.score / k.max) * 100}%` }} />
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{k.meaning}</td>
                    </tr>
                  ))}
                  <tr className="bg-night-900 text-white">
                    <td className="px-4 py-3 font-semibold" colSpan={3}>Total</td>
                    <td className="px-4 py-3 font-bold tabular-nums" colSpan={2}>{m.total} / 36</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Flag ok={!m.nadiDosha} title="Nadi dosha" text={m.nadiDosha ? 'Both share the same nadi — traditionally linked to health and progeny concerns. Nadi Dosha Nivaran puja is advised.' : 'Different nadis — no Nadi dosha.'} />
            <Flag ok={!m.bhakootDosha} title="Bhakoot dosha" text={m.bhakootDosha ? 'The moon signs form a 2/12, 5/9 or 6/8 relationship — Bhakoot dosha is present.' : 'Moon signs are well placed to each other — no Bhakoot dosha.'} />
            <Flag ok={!(m.boy.manglik.present !== m.girl.manglik.present)} title="Manglik compatibility" text={m.manglikNote} />
          </section>

          <section className="night flex flex-wrap items-center justify-between gap-6 rounded-[2rem] p-8">
            <div>
              <h2 className="h-display text-2xl text-white sm:text-3xl">Want a detailed marriage reading?</h2>
              <p className="mt-1 text-white/65">Gun Milan is only the first step. A Guruji can study both full charts, dashas and remedies.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/astrology-services/chat-with-astrologer" className="btn-gold btn-lg"><MessageCircle className="h-5 w-5" /> Ask an astrologer</Link>
              <Link href="/astrology-services/kundli-matching" className="btn btn-lg border border-white/20 bg-white/5 text-white hover:bg-white/10"><RotateCcw className="h-4 w-4" /> New match</Link>
            </div>
          </section>
        </div>
      </>
    );
  }

  const def = (p: string) => ({ name: s(sp[`${p}name`]), date: s(sp[`${p}date`]), time: s(sp[`${p}time`]), city: cityOption(s(sp[`${p}city`])) });

  return (
    <>
      <PageHero
        eyebrow="Kundli Milan"
        title={<>Kundli matchmaking: your path to a <span className="italic text-gold-300">perfect union</span></>}
        intro={MATCHING_COPY.intro}
        crumbs={[{ label: 'Astrology Services', href: '/astrology-services' }, { label: 'Kundli Matching' }]}
      />
      <form method="get" action="/astrology-services/kundli-matching" className="container-x relative z-10 -mt-6">
        <div className="card overflow-hidden">
          {attempted && <p className="m-5 mb-0 rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">Please complete both forms and pick birth places from the list.</p>}
          <div className="grid lg:grid-cols-2">
            <fieldset className="p-5 sm:p-8">
              <legend className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-night-900"><span className="grid h-8 w-8 place-items-center rounded-full bg-night-900 text-sm text-gold-300">♂</span> Boy’s details</legend>
              <BirthFields prefix="b_" showGender={false} defaults={def('b_')} />
            </fieldset>
            <fieldset className="border-t border-line bg-cream-50 p-5 sm:p-8 lg:border-l lg:border-t-0">
              <legend className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-night-900"><span className="grid h-8 w-8 place-items-center rounded-full bg-rose text-sm text-white">♀</span> Girl’s details</legend>
              <BirthFields prefix="g_" showGender={false} defaults={def('g_')} />
            </fieldset>
          </div>
          <div className="flex justify-center border-t border-line p-5">
            <button className="btn-primary btn-lg"><Heart className="h-4 w-4" /> Match horoscope <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </form>
      <section className="container-x py-12">
        <div className="max-w-3xl">
          <h2 className="h-display text-2xl text-night-900 sm:text-3xl">{MATCHING_COPY.title}</h2>
          <div className="prose-guru mt-3">{MATCHING_COPY.body.map((p, i) => <p key={i}>{p}</p>)}</div>
          <h3 className="mt-8 font-display text-xl font-semibold text-night-900">How the 36 gunas are counted</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[['Varna', 1], ['Vashya', 2], ['Tara', 3], ['Yoni', 4], ['Graha Maitri', 5], ['Gana', 6], ['Bhakoot', 7], ['Nadi', 8]].map(([n, p]) => (
              <div key={n} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-line">
                <span className="font-semibold text-night-900">{n}</span><span className="text-sm text-muted">{p} {p === 1 ? 'point' : 'points'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Person({ p, side }: { p: { name: string; rashi: string; nakshatra: string; ascendant: string; manglik: { present: boolean } }; side: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 text-white">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gold-300/80">{side}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{p.name}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-white/45 text-xs">Rashi</dt><dd>{p.rashi}</dd></div>
        <div><dt className="text-white/45 text-xs">Nakshatra</dt><dd>{p.nakshatra}</dd></div>
        <div><dt className="text-white/45 text-xs">Lagna</dt><dd>{p.ascendant}</dd></div>
        <div><dt className="text-white/45 text-xs">Manglik</dt><dd>{p.manglik.present ? 'Yes' : 'No'}</dd></div>
      </dl>
    </div>
  );
}

function Flag({ ok, title, text }: { ok: boolean; title: string; text: string }) {
  return (
    <article className={`card p-5 ${ok ? '' : 'border-saffron-200 bg-saffron-50/40'}`}>
      <h3 className="flex items-center gap-2 font-semibold text-night-900">
        {ok ? <CheckCircle2 className="h-5 w-5 text-leaf" /> : <AlertTriangle className="h-5 w-5 text-saffron-600" />} {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/75">{text}</p>
    </article>
  );
}
