import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KundliReport } from '@/components/astro/KundliReport';
import { computeKundli } from '@/lib/astro/kundli';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'My Kundli', robots: { index: false } };

export default async function SavedKundliPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(undefined, `/kundli/${id}`);
  const row = await db.kundli.findFirst({ where: { id, userId: user.id } });
  if (!row) notFound();
  const k = computeKundli({ name: row.name, gender: row.gender, date: row.birthDate, time: row.birthTime, place: row.place, lat: row.lat, lon: row.lon, tz: row.tz });
  return <KundliReport k={k} savedAt={row.createdAt} />;
}
