'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

type Opt = { id: string; label: string; tz: string };

/** Accessible typeahead for birth place. Submits the city id via a hidden input named `name`. */
export function CityPicker({ name, defaultValue, required, dark }: { name: string; defaultValue?: Opt | null; required?: boolean; dark?: boolean }) {
  const [text, setText] = useState(defaultValue?.label || '');
  const [value, setValue] = useState<Opt | null>(defaultValue || null);
  const [opts, setOpts] = useState<Opt[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/cities?q=${encodeURIComponent(text === value?.label ? '' : text)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => { setOpts(j.cities); setActive(0); })
        .catch(() => {});
    }, 120);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [text, open, value?.label]);

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // block form submit when nothing valid is picked
  useEffect(() => {
    input.current?.setCustomValidity(required && !value ? 'Please choose a place from the list' : '');
  }, [value, required]);

  const pick = (o: Opt) => { setValue(o); setText(o.label); setOpen(false); };

  return (
    <div className="relative" ref={box}>
      <MapPin className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? 'text-gold-300' : 'text-muted'}`} />
      <input
        ref={input}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={`input pl-9 ${dark ? '!border-white/15 !bg-white/5 !text-white placeholder:!text-white/40' : ''}`}
        placeholder="Start typing a city…"
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setText(e.target.value); setValue(null); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(opts.length - 1, a + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === 'Enter' && open && opts[active]) { e.preventDefault(); pick(opts[active]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
        autoComplete="off"
      />
      <input type="hidden" name={name} value={value?.id || ''} />
      {open && opts.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-white p-1.5 text-ink shadow-lift">
          {opts.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${i === active ? 'bg-saffron-50 text-saffron-700' : ''}`}
            >
              <span className="truncate">{o.label}</span>
              {o.tz !== 'Asia/Kolkata' && <span className="shrink-0 text-[10px] text-muted">{o.tz.split('/').pop()?.replace('_', ' ')}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
