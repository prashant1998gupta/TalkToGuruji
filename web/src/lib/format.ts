/** Money is stored in paise. */
export const rupees = (paise: number, opts: { decimals?: boolean } = {}) =>
  '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: opts.decimals ? 2 : 0, maximumFractionDigits: opts.decimals ? 2 : 0 });

/** Whole-rupee amounts (catalog prices). */
export const inr = (r: number) => '₹' + r.toLocaleString('en-IN');

export const fmtDate = (d: Date | string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(d).toLocaleDateString('en-IN', opts);

export const fmtDateTime = (d: Date | string) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const readingTime = (html: string) => Math.max(1, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 220));

export const splitList = (s?: string | null) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const json = <T>(s: string | null | undefined, fallback: T): T => {
  try { return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
};
