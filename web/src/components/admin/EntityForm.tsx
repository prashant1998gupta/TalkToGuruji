'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bold, Code2, Eye, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Plus, Quote, Trash2, Upload, X } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { ENTITIES, slugify, type Field } from './entities';
import { cx } from '@/lib/format';

type Vals = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function EntityForm({ entity, id, initial, options, hide = [], afterSave, deleteRedirect, compact }: {
  entity: string;
  id?: string;
  initial: Vals;
  options?: Record<string, { value: string; label: string }[]>;
  hide?: string[];
  /** path to go to after save ("{id}" is replaced), or a callback */
  afterSave?: string | ((id: string) => void);
  deleteRedirect?: string;
  compact?: boolean;
}) {
  const cfg = ENTITIES[entity];
  const { toast } = useApp();
  const router = useRouter();
  const [vals, setVals] = useState<Vals>(initial);
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const set = (k: string, v: unknown) => setVals((s) => {
    const n = { ...s, [k]: v };
    const slugField = cfg.fields.find((f) => f.type === 'slug' && f.from === k);
    if (slugField && !slugTouched) n[slugField.name] = slugify(String(v));
    return n;
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(cfg.fields.filter((f) => !hide.includes(f.name)).map((f) => [f.name, vals[f.name]]));
    const r = await fetch(id ? `/api/admin/crud/${entity}/${id}` : `/api/admin/crud/${entity}`, { method: id ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast(j.error || 'Could not save.', 'error');
    toast(`${cfg.label} saved`, 'success');
    if (typeof afterSave === 'function') afterSave(j.id);
    else if (afterSave) router.push(afterSave.replace('{id}', j.id));
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className={cx('grid gap-4', compact ? 'sm:grid-cols-2' : 'md:grid-cols-2')}>
        {cfg.fields.filter((f) => !hide.includes(f.name)).map((f) => (
          <div key={f.name} className={cx(f.wide && 'md:col-span-2 sm:col-span-2', f.type === 'bool' && 'self-end')}>
            {f.type !== 'bool' && (
              <label className="label" htmlFor={`f-${f.name}`}>
                {f.label}{f.required && <span className="text-rose"> *</span>}
              </label>
            )}
            <FieldInput f={f} value={vals[f.name]} onChange={(v) => { if (f.type === 'slug') setSlugTouched(true); set(f.name, v); }} options={options?.[f.name] || f.options} />
            {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-2 border-t border-line bg-white/95 px-1 py-3 backdrop-blur">
        <div>
          {id && deleteRedirect && (
            <DeleteButton entity={entity} id={id} redirect={deleteRedirect} label={cfg.label} />
          )}
        </div>
        <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : id ? 'Save changes' : `Create ${cfg.label.toLowerCase()}`}</button>
      </div>
    </form>
  );
}

function DeleteButton({ entity, id, redirect, label }: { entity: string; id: string; redirect: string; label: string }) {
  const router = useRouter();
  return <DeleteAndGo entity={entity} id={id} label={label} onDone={() => router.push(redirect)} />;
}

export function DeleteAndGo({ entity, id, label, onDone }: { entity: string; id: string; label: string; onDone?: () => void }) {
  const { toast } = useApp();
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const del = async () => {
    const r = await fetch(`/api/admin/crud/${entity}/${id}`, { method: 'DELETE' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return toast(j.error || 'Could not delete.', 'error');
    toast(`${label} deleted`, 'success');
    setAsk(false);
    onDone?.();
    router.refresh();
  };
  return (
    <>
      <button type="button" className="btn-ghost btn-sm !text-rose" onClick={() => setAsk(true)}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
      {ask && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-night-950/50 p-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <p className="font-display text-lg font-semibold">Delete this {label.toLowerCase()}?</p>
            <p className="mt-1 text-sm text-muted">This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setAsk(false)}>Cancel</button>
              <button type="button" className="btn btn-sm bg-rose text-white" onClick={del}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FieldInput({ f, value, onChange, options }: { f: Field; value: any; onChange: (v: unknown) => void; options?: { value: string; label: string }[] }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const id = `f-${f.name}`;
  switch (f.type) {
    case 'textarea':
      return <textarea id={id} className="input min-h-24" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={f.required} placeholder={f.placeholder} />;
    case 'int':
      return <input id={id} type="number" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={f.required} />;
    case 'bool':
      return (
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium">
          <input id={id} type="checkbox" className="h-4 w-4 accent-saffron-500" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {f.label}
        </label>
      );
    case 'select':
      return (
        <select id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={f.required}>
          <option value="">Select…</option>
          {(options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case 'date':
      return <input id={id} type="date" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'json':
      return <textarea id={id} className="input min-h-28 font-mono text-xs" value={value ?? ''} onChange={(e) => onChange(e.target.value)} spellCheck={false} placeholder={f.placeholder || '{ }'} />;
    case 'html':
      return <HtmlEditor value={value ?? ''} onChange={onChange} />;
    case 'image':
      return <ImageInput value={value ?? ''} onChange={onChange} />;
    case 'images':
      return <ImagesInput value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case 'variants':
      return <VariantsInput value={Array.isArray(value) ? value : []} onChange={onChange} />;
    default:
      return <input id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={f.required && f.type !== 'slug'} placeholder={f.placeholder} />;
  }
}

async function upload(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Upload failed');
  return j.url as string;
}

function useUpload(onUrl: (u: string) => void) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setBusy(true);
        try { onUrl(await upload(file)); toast('Image uploaded', 'success'); } catch (err) { toast((err as Error).message, 'error'); } finally { setBusy(false); }
      }}
    />
  );
  return { busy, pick: () => ref.current?.click(), input };
}

export function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const up = useUpload(onChange);
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-cream-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-muted" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/m/image.webp or upload" />
        <div className="flex gap-2">
          <button type="button" className="btn-ghost btn-sm" onClick={up.pick} disabled={up.busy}>
            {up.busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
          </button>
          {value && <button type="button" className="btn-ghost btn-sm" onClick={() => onChange('')}><X className="h-3.5 w-3.5" /> Remove</button>}
        </div>
        {up.input}
      </div>
    </div>
  );
}

function ImagesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const up = useUpload((u) => onChange([...value, u]));
  const [path, setPath] = useState('');
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div key={src + i} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-line bg-cream-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-rose shadow" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
            {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-night-900/80 text-center text-[10px] font-bold text-gold-300">COVER</span>}
          </div>
        ))}
        <button type="button" onClick={up.pick} disabled={up.busy} className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-line text-muted hover:border-saffron-300 hover:text-saffron-600" aria-label="Upload image">
          {up.busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <input className="input" value={path} onChange={(e) => setPath(e.target.value)} placeholder="or add an existing path, e.g. /m/emerald.webp" />
        <button type="button" className="btn-ghost btn-sm" onClick={() => { if (path.trim()) { onChange([...value, path.trim()]); setPath(''); } }}><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
      {up.input}
    </div>
  );
}

function VariantsInput({ value, onChange }: { value: { label: string; price: number; mrp: number }[]; onChange: (v: unknown) => void }) {
  const upd = (i: number, k: string, v: string) => onChange(value.map((x, j) => (j === i ? { ...x, [k]: k === 'label' ? v : Number(v) } : x)));
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="grid grid-cols-[1fr_110px_110px_36px] gap-2 text-[11px] font-bold uppercase tracking-wide text-muted">
          <span>Label</span><span>Price ₹</span><span>MRP ₹</span><span />
        </div>
      )}
      {value.map((v, i) => (
        <div key={i} className="grid grid-cols-[1fr_110px_110px_36px] gap-2">
          <input className="input" value={v.label} onChange={(e) => upd(i, 'label', e.target.value)} placeholder="e.g. 5.25 carat" aria-label="Variant label" />
          <input className="input" type="number" value={v.price} onChange={(e) => upd(i, 'price', e.target.value)} aria-label="Variant price" />
          <input className="input" type="number" value={v.mrp} onChange={(e) => upd(i, 'mrp', e.target.value)} aria-label="Variant MRP" />
          <button type="button" className="grid place-items-center rounded-xl text-rose hover:bg-rose/5" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove variant"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" className="btn-ghost btn-sm" onClick={() => onChange([...value, { label: '', price: 0, mrp: 0 }])}><Plus className="h-3.5 w-3.5" /> Add variant</button>
      <p className="text-xs text-muted">Leave empty for a single-price product. The first variant’s price is shown on listings.</p>
    </div>
  );
}

/** Lightweight rich-text editor: visual (contentEditable) or raw HTML, sanitized on the server. */
export function HtmlEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const ref = useRef<HTMLDivElement>(null);
  const initial = useRef(value);
  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML || '');
  };
  const tools: [React.ReactNode, string, () => void][] = [
    [<Heading2 key="h2" className="h-4 w-4" />, 'Heading', () => exec('formatBlock', 'h2')],
    [<Heading3 key="h3" className="h-4 w-4" />, 'Subheading', () => exec('formatBlock', 'h3')],
    [<Bold key="b" className="h-4 w-4" />, 'Bold', () => exec('bold')],
    [<Italic key="i" className="h-4 w-4" />, 'Italic', () => exec('italic')],
    [<List key="ul" className="h-4 w-4" />, 'Bullet list', () => exec('insertUnorderedList')],
    [<ListOrdered key="ol" className="h-4 w-4" />, 'Numbered list', () => exec('insertOrderedList')],
    [<Quote key="q" className="h-4 w-4" />, 'Quote', () => exec('formatBlock', 'blockquote')],
    [<Link2 key="a" className="h-4 w-4" />, 'Link', () => { const u = prompt('Link URL'); if (u) exec('createLink', u); }],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:border-saffron-400 focus-within:ring-4 focus-within:ring-saffron-100">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-cream-50 px-1.5 py-1">
        {mode === 'visual' && tools.map(([icon, label, fn]) => (
          <button key={label} type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={fn} className="grid h-8 w-8 place-items-center rounded-lg text-ink/70 hover:bg-white hover:text-ink">{icon}</button>
        ))}
        <div className="ml-auto flex rounded-lg bg-cream-200 p-0.5 text-xs font-semibold">
          <button type="button" onClick={() => setMode('visual')} className={cx('flex items-center gap-1 rounded-md px-2 py-1', mode === 'visual' && 'bg-white shadow-sm')}><Eye className="h-3.5 w-3.5" /> Visual</button>
          <button type="button" onClick={() => { setMode('html'); }} className={cx('flex items-center gap-1 rounded-md px-2 py-1', mode === 'html' && 'bg-white shadow-sm')}><Code2 className="h-3.5 w-3.5" /> HTML</button>
        </div>
      </div>
      {mode === 'visual' ? (
        <div
          key="visual"
          ref={(el) => { ref.current = el; if (el && el.innerHTML !== value && document.activeElement !== el) el.innerHTML = value || initial.current; }}
          contentEditable
          suppressContentEditableWarning
          className="prose-guru max-h-[520px] min-h-48 overflow-y-auto px-4 py-3 outline-none"
          onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        />
      ) : (
        <textarea className="block max-h-[520px] min-h-48 w-full resize-y px-4 py-3 font-mono text-xs outline-none" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      )}
    </div>
  );
}

