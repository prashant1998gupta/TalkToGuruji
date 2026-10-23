import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  displayName: z.string().trim().min(3).max(60),
  email: z.union([z.email(), z.literal('')]).optional(),
  gender: z.enum(['Male', 'Female', 'Other']),
  city: z.string().trim().min(2).max(60),
  experience: z.number().int().min(0).max(70),
  skills: z.array(z.string()).min(1).max(10),
  languages: z.array(z.string()).min(1).max(10),
  qualification: z.string().trim().max(100).optional(),
  bio: z.string().trim().min(30).max(1500),
  chatPrice: z.number().int().min(5).max(1000),
});

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "Join as Astrologer" application. Creates a PENDING profile that an admin approves. */
export async function POST(req: Request) {
  const u = await apiUser();
  if (u instanceof Response) return u;
  if (u.astrologer) return Response.json({ error: 'You have already applied. We will contact you after review.' }, { status: 409 });
  if (u.role !== 'USER') return Response.json({ error: 'This account already has a role on the platform.' }, { status: 400 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Please complete all required fields (bio needs at least 30 characters).' }, { status: 400 });
  const d = parsed.data;

  let slug = slugify(d.displayName) || 'astrologer';
  if (await db.astrologer.findUnique({ where: { slug } })) slug = `${slug}-${u.id.slice(-5)}`;
  await db.$transaction([
    db.astrologer.create({
      data: {
        userId: u.id, slug, displayName: d.displayName, gender: d.gender, city: d.city, experience: d.experience,
        skills: d.skills.join(', '), languages: d.languages.join(', '), qualification: d.qualification || null, bio: d.bio,
        chatPrice: d.chatPrice * 100, callPrice: Math.round(d.chatPrice * 1.25) * 100, videoPrice: Math.round(d.chatPrice * 1.5) * 100, status: 'PENDING',
      },
    }),
    db.user.update({ where: { id: u.id }, data: { name: u.name || d.displayName, email: d.email || u.email, gender: d.gender } }),
    db.notification.create({ data: { userId: u.id, title: 'Application received', body: 'Thank you for applying to Talk to Guruji. Our team will review your profile within 48 hours.', link: '/astro-registration' } }),
  ]);
  return Response.json({ ok: true });
}
