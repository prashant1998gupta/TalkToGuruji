'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { AstrologerCard, type AstroCardData } from './AstrologerCard';
import { useAstroStatuses, type AstroStatus } from './useAstroStatus';
import type { ConsultType } from './ConsultLauncher';
import { EmptyState } from '@/components/ui/primitives';
import { cx, splitList } from '@/lib/format';

type Sort = 'popularity' | 'experience' | 'price-low' | 'price-high' | 'rating';
type Card = AstroCardData & { gender?: string | null };

const SORTS: [Sort, string][] = [['popularity', 'Popularity'], ['rating', 'Rating'], ['experience', 'Experience'], ['price-low', 'Price: low to high'], ['price-high', 'Price: high to low']];
const PRICE_BANDS: [string, number, number][] = [['Any price', 0, Infinity], ['Under ₹20/min', 0, 2000], ['₹20 – ₹35/min', 2000, 3500], ['Above ₹35/min', 3500, Infinity]];

/** Searchable, filterable astrologer list with live presence. Mode decides which price/button is shown. */
export function AstrologerDirectory({ astrologers, statuses, mode, allModes, onlineFirstOnly }: { astrologers: Card[]; statuses: Record<string, AstroStatus>; mode: ConsultType; allModes?: boolean; onlineFirstOnly?: boolean }) {
  const live = useAstroStatuses(statuses);
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [lang, setLang] = useState('');
  const [gender, setGender] = useState('');
  const [band, setBand] = useState(0);
  const [onlineOnly, setOnlineOnly] = useState(!!onlineFirstOnly);
  const [sort, setSort] = useState<Sort>('popularity');
  const [panel, setPanel] = useState(false);
  const [activeMode, setActiveMode] = useState<ConsultType>(mode);

  const skills = useMemo(() => uniq(astrologers.flatMap((a) => splitList(a.skills))), [astrologers]);
  const langs = useMemo(() => uniq(astrologers.flatMap((a) => splitList(a.languages))), [astrologers]);
  const price = (a: Card) => (activeMode === 'CHAT' ? a.chatPrice : activeMode === 'CALL' ? a.callPrice : a.videoPrice);

  const list = useMemo(() => {
    const [, lo, hi] = PRICE_BANDS[band];
    const needle = q.trim().toLowerCase();
    const rows = astrologers.filter((a) => {
      const s = live[a.id];
      if (onlineOnly && !s?.isOnline) return false;
      if (needle && !`${a.displayName} ${a.skills} ${a.languages}`.toLowerCase().includes(needle)) return false;
      if (skill && !splitList(a.skills).includes(skill)) return false;
      if (lang && !splitList(a.languages).includes(lang)) return false;
      if (gender && a.gender !== gender) return false;
      const p = price(a);
      if (p < lo || p >= hi) return false;
      return activeMode === 'CHAT' ? a.isChat : activeMode === 'CALL' ? a.isCall : a.isVideo;
    });
    const avail = (a: Card) => (live[a.id]?.isOnline ? (live[a.id]?.isBusy ? 1 : 2) : 0);
    const by: Record<Sort, (a: Card, b: Card) => number> = {
      popularity: (a, b) => b.totalMinutes - a.totalMinutes,
      rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
      experience: (a, b) => b.experience - a.experience,
      'price-low': (a, b) => price(a) - price(b),
      'price-high': (a, b) => price(b) - price(a),
    };
    // available astrologers always float to the top, then the chosen order
    return rows.sort((a, b) => avail(b) - avail(a) || by[sort](a, b));
  }, [astrologers, live, q, skill, lang, gender, band, onlineOnly, sort, activeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterCount = [skill, lang, gender, band ? 'x' : '', onlineOnly ? 'x' : ''].filter(Boolean).length;
  const online = Object.values(live).filter((s) => s.isOnline).length;
  const reset = () => { setSkill(''); setLang(''); setGender(''); setBand(0); setOnlineOnly(false); setQ(''); };

  const filters = (
    <div className="space-y-5">
      <FilterGroup label="Speciality" value={skill} onChange={setSkill} options={skills} />
      <FilterGroup label="Language" value={lang} onChange={setLang} options={langs} />
      <FilterGroup label="Gender" value={gender} onChange={setGender} options={['Male', 'Female']} />
      <div>
        <p className="label">Price</p>
        <div className="flex flex-wrap gap-2">
          {PRICE_BANDS.map(([l], i) => <Pill key={l} active={band === i} onClick={() => setBand(i)}>{l}</Pill>)}
        </div>
      </div>
      <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-cream-100 px-4 py-3 text-sm font-semibold">
        Online now only
        <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="h-4 w-4 accent-saffron-500" />
      </label>
      {filterCount > 0 && <button type="button" onClick={reset} className="text-sm font-semibold text-saffron-600 hover:underline">Clear all filters</button>}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, skill or language" className="input !rounded-full !py-3 pl-10" aria-label="Search astrologers" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input !w-auto !rounded-full !py-3" aria-label="Sort by">
          {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
        </select>
        <button type="button" onClick={() => setPanel(true)} className="btn-ghost !py-3 lg:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filters{filterCount ? ` (${filterCount})` : ''}
        </button>
      </div>

      {allModes && (
        <div className="mt-4 inline-flex rounded-full bg-white p-1 ring-1 ring-line">
          {(['CHAT', 'CALL', 'VIDEO'] as ConsultType[]).map((m) => (
            <button key={m} type="button" onClick={() => setActiveMode(m)} className={cx('rounded-full px-4 py-1.5 text-sm font-semibold transition', activeMode === m ? 'bg-night-900 text-white' : 'text-muted hover:text-ink')}>
              {m === 'CHAT' ? 'Chat' : m === 'CALL' ? 'Call' : 'Video'}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-5">
            <p className="mb-4 flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4" /> Filters</p>
            {filters}
          </div>
        </aside>
        <div>
          <p className="mb-3 text-sm text-muted">
            Showing <b className="text-ink">{list.length}</b> astrologers · <span className="font-semibold text-leaf">{online} online</span>
          </p>
          {list.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((a) => <AstrologerCard key={a.id} a={a} status={live[a.id] || { isOnline: false, isBusy: false }} mode={activeMode} />)}
            </div>
          ) : (
            <EmptyState title="No astrologers match" text="Try removing a filter or searching for something else." action={<button type="button" className="btn-ghost" onClick={reset}>Reset filters</button>} />
          )}
        </div>
      </div>

      {panel && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-night-950/50" onClick={() => setPanel(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-xl font-semibold">Filters</p>
              <button type="button" onClick={() => setPanel(false)} className="grid h-9 w-9 place-items-center rounded-full bg-cream-100" aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>
            {filters}
            <button type="button" onClick={() => setPanel(false)} className="btn-primary mt-6 w-full">Show {list.length} astrologers</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2">
        <Pill active={!value} onClick={() => onChange('')}>All</Pill>
        {options.map((o) => <Pill key={o} active={value === o} onClick={() => onChange(value === o ? '' : o)}>{o}</Pill>)}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cx('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition', active ? 'bg-night-900 text-white ring-night-900' : 'bg-white text-ink/75 ring-line hover:ring-saffron-300')}>
      {children}
    </button>
  );
}

const uniq = (a: string[]) => [...new Set(a)].sort();
