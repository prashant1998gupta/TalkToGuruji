import { db } from '@/lib/db';
import { SIGNS } from '@/lib/zodiac';
import { json } from '@/lib/format';
import { PageHeader } from '@/components/admin/ui';
import { HoroscopeEditor } from '@/components/admin/HoroscopeEditor';

export const metadata = { title: 'Daily horoscope' };

export default async function HoroscopeAdmin({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const latest = await db.dailyHoroscope.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date || '') ? sp.date! : today;
  const [rows, dates] = await Promise.all([
    db.dailyHoroscope.findMany({ where: { date } }),
    db.dailyHoroscope.groupBy({ by: ['date'], _count: true, orderBy: { date: 'desc' }, take: 14 }),
  ]);
  const bySign = Object.fromEntries(rows.map((r) => [r.sign, json<Record<string, string>>(r.data, {})]));

  return (
    <>
      <PageHeader title="Daily horoscope" sub={<>Publish the rashifal for each sign. {latest ? <>Latest published date: <b>{latest.date}</b>.</> : 'Nothing published yet.'} The website shows the most recent date available.</>} />
      <HoroscopeEditor
        date={date}
        signs={SIGNS.map((s) => ({ slug: s.slug, name: s.name, glyph: s.glyph }))}
        data={bySign}
        recent={dates.map((d) => ({ date: d.date, count: d._count }))}
      />
    </>
  );
}
