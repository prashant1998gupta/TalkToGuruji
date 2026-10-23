import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Gem, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { NorthChart } from './NorthChart';
import { PlanetTable } from './PlanetTable';
import { PrintButton, SaveKundliButton } from './KundliActions';
import { Breadcrumbs } from '@/components/ui/primitives';
import { GRAHA_HI } from '@/lib/astro/constants';
import { fmtDeg } from '@/lib/astro/engine';
import type { Kundli } from '@/lib/astro/kundli';
import { fmtDateTz, formatOffset } from '@/lib/astro/time';

const fmtD = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export function KundliReport({ k, saveInput, savedAt }: { k: Kundli; saveInput?: { name: string; gender: string; date: string; time: string; city: string }; savedAt?: Date }) {
  const retro = k.planets.filter((p) => p.retro).map((p) => p.graha);
  const now = new Date();
  const { md, ad } = k.current;
  const [hh, mm] = k.input.time.split(':').map(Number);
  const timeLabel = new Date(2000, 0, 1, hh, mm).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <>
      <section className="night relative overflow-hidden print:bg-white print:text-ink">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:30px_30px] print:hidden" />
        <div className="container-x relative py-10 sm:py-14">
          <div className="print:hidden">
            <Breadcrumbs items={[{ label: 'Free Kundli', href: '/astrology-services/free-kundli' }, { label: k.input.name }]} dark />
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow !text-gold-300"><Sparkles className="h-3.5 w-3.5" /> Janam Kundli</p>
              <h1 className="h-display mt-2 text-4xl text-white sm:text-5xl">{k.input.name}</h1>
              <p className="mt-2 text-sm text-white/65">
                {k.input.gender} · {fmtDateTz(new Date(`${k.input.date}T00:00:00Z`), 'UTC', { day: 'numeric', month: 'long', year: 'numeric' })} · {timeLabel} · {k.input.place}
                <span className="text-white/40"> (UTC{formatOffset(k.tzOffset)})</span>
              </p>
              {savedAt && <p className="mt-1 text-xs text-white/40">Saved {fmtD(savedAt)}</p>}
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              {saveInput && <SaveKundliButton input={saveInput} />}
              <PrintButton />
            </div>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Lagna', `${k.avakhada.ascendant}`, `${fmtDeg(k.ascendant.degInSign)}`],
              ['Moon sign (Rashi)', k.avakhada.rashi, `Lord ${k.avakhada.rashiLord}`],
              ['Nakshatra', k.avakhada.nakshatra, `Lord ${k.avakhada.nakshatraLord}`],
              ['Running dasha', md ? `${md.lord} – ${ad?.lord ?? ''}` : '—', md ? `until ${fmtD(ad?.end ?? md.end)}` : ''],
            ].map(([label, v, sub]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gold-300/80">{label}</dt>
                <dd className="mt-1 font-display text-xl font-semibold text-white">{v}</dd>
                <dd className="text-xs text-white/50">{sub}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container-x space-y-12 py-12">
        {/* Charts */}
        <section className="grid gap-8 lg:grid-cols-[1fr_1fr_0.9fr]">
          <div className="card p-4 sm:p-6"><NorthChart houses={k.houses} title="Lagna chart (D1)" retro={retro} /></div>
          <div className="card p-4 sm:p-6"><NorthChart houses={k.navamsaHouses} title="Navamsa chart (D9)" retro={retro} /></div>
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-night-900">Avakhada details</h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {[
                ['Ascendant', `${k.avakhada.ascendant} (lord ${k.avakhada.ascendantLord})`],
                ['Rashi', k.avakhada.rashi],
                ['Sun sign', k.avakhada.sunSign],
                ['Nakshatra', k.avakhada.nakshatra],
                ['Varna', k.avakhada.varna],
                ['Vashya', k.avakhada.vashya],
                ['Yoni', k.avakhada.yoni],
                ['Gana', k.avakhada.gana],
                ['Nadi', k.avakhada.nadi],
                ['Tatva', k.avakhada.tatva],
                ['Name syllable', k.avakhada.nameSyllable],
              ].map(([a, b]) => (
                <div key={a} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted">{a}</dt>
                  <dd className="text-right font-semibold text-night-900">{b}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[11px] text-muted">* marks a retrograde planet. Lahiri ayanamsa, whole-sign houses.</p>
          </div>
        </section>

        {/* Planets */}
        <section>
          <h2 className="h-display mb-4 text-2xl text-night-900 sm:text-3xl">Planetary positions</h2>
          <PlanetTable rows={[{ graha: 'Ascendant' as const, signName: k.ascendant.signName, degInSign: k.ascendant.degInSign, nakshatraName: k.ascendant.nakshatraName, pada: k.ascendant.pada, nakLord: k.ascendant.nakLord, retro: false, house: 1 }, ...k.planets]} />
        </section>

        {/* Doshas */}
        <section>
          <h2 className="h-display mb-4 text-2xl text-night-900 sm:text-3xl">Dosha analysis</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: 'Mangal (Manglik) dosha', ok: !k.doshas.manglik.present, text: k.doshas.manglik.summary, tag: k.doshas.manglik.present ? (k.doshas.manglik.level === 'high' ? 'Present' : 'Mild') : 'Not present' },
              { t: 'Kaal Sarp dosha', ok: !k.doshas.kaalSarp.present, text: k.doshas.kaalSarp.summary, tag: k.doshas.kaalSarp.present ? 'Present' : 'Not present' },
              { t: 'Shani Sade Sati', ok: !k.doshas.sadeSati.present, text: k.doshas.sadeSati.summary, tag: k.doshas.sadeSati.present ? 'Running' : 'Not running' },
            ].map((d) => (
              <article key={d.t} className={`card p-5 ${d.ok ? '' : 'border-saffron-200 bg-saffron-50/40'}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-night-900">{d.t}</h3>
                  <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${d.ok ? 'bg-leaf/10 text-leaf' : 'bg-saffron-100 text-saffron-700'}`}>
                    {d.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />} {d.tag}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink/75">{d.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Dasha */}
        <section>
          <h2 className="h-display mb-1 text-2xl text-night-900 sm:text-3xl">Vimshottari dasha</h2>
          <p className="mb-4 text-sm text-muted">120-year cycle starting from your Moon nakshatra lord ({k.avakhada.nakshatraLord}). Tap a mahadasha to see its antardashas.</p>
          <div className="space-y-2">
            {k.dashas.map((d) => {
              const running = d.start <= now && now < d.end;
              return (
                <details key={d.lord + d.start.toISOString()} open={running} className={`group rounded-2xl border bg-white ${running ? 'border-saffron-300 shadow-soft' : 'border-line'}`}>
                  <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${running ? 'bg-saffron-500 text-white' : 'bg-night-900 text-gold-300'}`}>{d.lord.slice(0, 2)}</span>
                    <span className="flex-1">
                      <span className="block font-semibold text-night-900">{d.lord} Mahadasha <span className="text-xs font-normal text-muted">({GRAHA_HI[d.lord]})</span></span>
                      <span className="text-xs text-muted">{fmtD(d.start)} – {fmtD(d.end)}</span>
                    </span>
                    {running && <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-saffron-700">Running</span>}
                    <span className="text-muted transition group-open:rotate-90">›</span>
                  </summary>
                  <div className="grid gap-1.5 border-t border-line p-3 sm:grid-cols-3">
                    {d.sub!.map((s) => {
                      const r2 = s.start <= now && now < s.end;
                      return (
                        <div key={s.lord + s.start.toISOString()} className={`rounded-xl px-3 py-2 text-xs ${r2 ? 'bg-saffron-50 ring-1 ring-saffron-200' : 'bg-cream-100'}`}>
                          <span className="font-semibold text-night-900">{d.lord}–{s.lord}</span>
                          <span className="block text-muted">{fmtD(s.start)} – {fmtD(s.end)}</span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* Gemstones */}
        <section>
          <h2 className="h-display mb-4 text-2xl text-night-900 sm:text-3xl">Gemstone suggestions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {k.gemstones.map((g) => (
              <article key={g.role} className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-night-900 text-gold-300"><Gem className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-saffron-600">{g.role}</p>
                    <h3 className="font-display text-lg font-semibold text-night-900">{g.stone} <span className="text-sm font-normal text-muted">({g.hindi})</span></h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink/75">{g.why} is <b>{g.planet}</b>. Wear in {g.metal.toLowerCase()} on the {g.finger.toLowerCase()}, on a {g.day} morning.</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Gemstones are powerful — please confirm weight and suitability with an astrologer before wearing.</p>
        </section>

        {/* CTA */}
        <section className="night relative overflow-hidden rounded-[2rem] p-8 sm:p-10 print:hidden">
          <div className="relative grid items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow !text-gold-300">Go deeper</p>
              <h2 className="h-display mt-2 text-3xl text-white">Talk to an astrologer about this chart</h2>
              <p className="mt-2 text-white/65">Share this kundli with a verified Guruji for a personal reading on career, marriage, health and remedies.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/astrology-services/chat-with-astrologer" className="btn-gold btn-lg"><MessageCircle className="h-5 w-5" /> Chat now</Link>
              <Link href="/astrology-services/talk-to-astrologer" className="btn btn-lg border border-white/20 bg-white/5 text-white hover:bg-white/10"><Phone className="h-5 w-5" /> Call</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
