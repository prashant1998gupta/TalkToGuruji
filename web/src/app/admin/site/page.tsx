import { db } from '@/lib/db';
import { CrudTable } from '@/components/admin/CrudTable';
import { PageHeader, Tabs } from '@/components/admin/ui';

export const metadata = { title: 'Pages & sections' };

const TABS = [
  { key: 'pages', label: 'Pages (About, Terms…)' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'banners', label: 'Banners' },
];

export default async function SitePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const want = (await searchParams).tab;
  const tab = TABS.some((t) => t.key === want) ? want! : 'pages';
  return (
    <>
      <PageHeader title="Pages & sections" sub="Legal pages, homepage FAQ, testimonials and promotional banners." />
      <Tabs active={tab} tabs={TABS.map((t) => ({ ...t, href: `/admin/site?tab=${t.key}` }))} />
      {tab === 'pages' && <CrudTable entity="page" rows={await db.page.findMany({ orderBy: { slug: 'asc' } })} />}
      {tab === 'faqs' && <CrudTable entity="faq" rows={await db.faq.findMany({ orderBy: { sort: 'asc' } })} newDefaults={{ sort: ((await db.faq.aggregate({ _max: { sort: true } }))._max.sort || 0) + 1 }} />}
      {tab === 'testimonials' && <CrudTable entity="testimonial" rows={await db.testimonial.findMany({ orderBy: { createdAt: 'asc' } })} newDefaults={{ rating: 5 }} />}
      {tab === 'banners' && <CrudTable entity="banner" rows={await db.banner.findMany({ orderBy: { sort: 'asc' } })} newDefaults={{ active: true, sort: 0 }} />}
    </>
  );
}
