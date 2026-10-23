import { cityById, DEFAULT_CITY } from '@/lib/astro/cities';
import { computePanchang } from '@/lib/astro/panchang';
import { todayIn } from '@/lib/astro/time';

/** GET /api/panchang?date=YYYY-MM-DD&city=<id from /api/cities> */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const city = cityById(sp.get('city')) ?? DEFAULT_CITY;
  const d = sp.get('date');
  const date = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : todayIn(city.tz);
  return Response.json({ city: { id: city.id, name: city.name, region: city.region, tz: city.tz }, panchang: computePanchang(date, city.lat, city.lon, city.tz) });
}
