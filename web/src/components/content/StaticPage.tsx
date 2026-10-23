import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { PageHero } from '@/components/ui/primitives';
import { fmtDate } from '@/lib/format';
import { withHeadingIds } from './data';

/** Legal / company page stored in the Page table, with a sticky table of contents when long. */
export async function StaticPage({ slug, eyebrow, intro }: { slug: string; eyebrow?: string; intro?: string }) {
  const page = await db.page.findUnique({ where: { slug } });
  if (!page) notFound();
  // The imported copy repeats the title and "Last updated" line as headings — lift them out.
  const updated = page.body.match(/<h2>\s*(Last updated[^<]*)<\/h2>/i)?.[1];
  const body = page.body
    .replace(/<h2>\s*Last updated[^<]*<\/h2>/i, '')
    .replace(new RegExp(`^\\s*<h2>\\s*${page.title.replace(/[.*+?^${}()|[\]\\&]/g, '.')}\\s*</h2>`, 'i'), '');
  const { html, toc } = withHeadingIds(body);
  const long = toc.length >= 4;
  return (
    <>
      <PageHero eyebrow={eyebrow} title={page.title} intro={intro ?? updated ?? `Last updated ${fmtDate(page.updatedAt, { day: 'numeric', month: 'long', year: 'numeric' })}`} crumbs={[{ label: page.title }]} compact />
      <section className={`container-x grid gap-10 py-12 ${long ? 'lg:grid-cols-[260px_minmax(0,1fr)]' : ''}`}>
        {long && (
          <aside className="hidden lg:block">
            <nav className="sticky top-28 max-h-[75vh] overflow-y-auto rounded-2xl border border-line bg-white p-4" aria-label="Sections">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Sections</p>
              <ol className="space-y-0.5 text-sm">
                {toc.filter((t) => t.level === 2).map((t) => (
                  <li key={t.id}><a href={`#${t.id}`} className="block rounded-lg px-2 py-1.5 leading-snug text-ink/70 hover:bg-cream-100 hover:text-saffron-700">{t.text}</a></li>
                ))}
              </ol>
            </nav>
          </aside>
        )}
        <div className="card mx-auto w-full max-w-3xl p-6 sm:p-10">
          <div className="prose-guru" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>
    </>
  );
}
