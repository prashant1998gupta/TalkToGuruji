/* eslint-disable @typescript-eslint/no-explicit-any -- importer reads untyped JSON captured from the old site */
/**
 * Imports the old talktoguruji.com content (captured in ../_source) into the local
 * database and creates demo accounts, astrologers and store data.
 * Run: npm run db:seed   (safe to re-run; it wipes and rebuilds)
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import sanitizeHtml from 'sanitize-html';

const db = new PrismaClient();
const SRC = path.resolve(__dirname, '../../_source');
const mediaMap: Record<string, string> = fs.existsSync(path.join(SRC, 'media-map.json'))
  ? JSON.parse(fs.readFileSync(path.join(SRC, 'media-map.json'), 'utf8'))
  : {};

function readApi<T = any>(name: string): T[] {
  const file = path.join(SRC, 'api', name + '.json');
  if (!fs.existsSync(file)) return [];
  const j = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  if (Array.isArray(j)) return j;
  if (Array.isArray(j.data)) return j.data;
  return (Object.values(j).find(Array.isArray) as T[]) || [];
}

function img(u?: string | null): string | null {
  if (!u) return null;
  if (mediaMap[u]) return mediaMap[u];
  const hit = Object.keys(mediaMap).find((k) => k.startsWith(u) || u.startsWith(k));
  return hit ? mediaMap[hit] : null;
}

function localizeUrls(html: string) {
  return html.replace(/https?:\/\/(?:www\.)?talktoguruji\.com\/upload\/[^"'<>]+?\.(?:png|jpe?g|webp|gif|svg|avif)/gi, (m) => mediaMap[m] || m)
    .replace(/https?:\/\/(?:www\.)?talktoguruji\.com\//gi, '/');
}

function clean(html?: string | null): string {
  if (!html) return '';
  const out = sanitizeHtml(localizeUrls(html), {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div', 'figure', 'figcaption', 'iframe'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'], iframe: ['src', 'allowfullscreen'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'] },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com'],
    transformTags: { h1: 'h2', b: 'strong', div: 'p' },
  });
  return out
    .replace(/<span>([\s\S]*?)<\/span>/g, '$1')
    .replace(/<(h[1-6]|p)>\s*(<br \/>|<br>)?\s*<\/\1>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/​/g, '')
    .trim();
}

const text = (html?: string | null, n = 220) => {
  // Prefer paragraph text so excerpts don't start with a run-on heading
  const paras = [...(html || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]).join(' ');
  const src = paras.replace(/<[^>]+>/g, '').trim().length > 40 ? paras : html || '';
  const t = src.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n).replace(/\s\S*$/, '') + '…' : t;
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const dateOf = (d: any, m: string, y: any) => {
  const mi = MONTHS.indexOf(String(m || '').toLowerCase());
  if (mi < 0 || !d || !y) return null;
  return new Date(Date.UTC(Number(y), mi, Number(d), 6));
};
const pub = (r: any) => r.status === undefined || r.status === 'publish' || r.status === 1 || r.status === '1';

// Rendered static page text -> clean HTML
function pageText(name: string) {
  const file = path.join(SRC, 'rendered', name + '.txt');
  if (!fs.existsSync(file)) return '';
  let t = fs.readFileSync(file, 'utf8');
  const start = t.indexOf('Planetary Transits\n');
  if (start >= 0) t = t.slice(start + 'Planetary Transits\n'.length);
  const end = t.search(/\n(Subscribe to our newsletter|SUBSCRIBE TO OUR NEWSLETTER)/i);
  if (end >= 0) t = t.slice(0, end);
  return t.trim();
}
function textToHtml(t: string) {
  const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push('<ul>' + list.map((l) => `<li>${esc(l)}</li>`).join('') + '</ul>'); list = []; } };
  for (const l of lines.slice(1)) {
    if (/^[•\-–●▪]\s*/.test(l)) { list.push(l.replace(/^[•\-–●▪]\s*/, '')); continue; }
    flush();
    const isHeading = l.length < 90 && !/[.,;]$/.test(l) && !/^[a-z]/.test(l) && l.split(' ').length <= 12;
    out.push(isHeading ? `<h2>${esc(l)}</h2>` : `<p>${esc(l)}</p>`);
  }
  flush();
  return out.join('\n');
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function main() {
  console.log('Resetting tables…');
  await db.$transaction([
    db.message.deleteMany(), db.review.deleteMany(), db.consultSession.deleteMany(), db.transaction.deleteMany(),
    db.paymentOrder.deleteMany(), db.notification.deleteMany(), db.kundli.deleteMany(), db.pujaBooking.deleteMany(),
    db.cartItem.deleteMany(), db.order.deleteMany(), db.astrologer.deleteMany(), db.user.deleteMany(), db.otpCode.deleteMany(),
    db.content.deleteMany(), db.page.deleteMany(), db.faq.deleteMany(), db.testimonial.deleteMany(), db.banner.deleteMany(),
    db.puja.deleteMany(), db.product.deleteMany(), db.productCategory.deleteMany(), db.dailyHoroscope.deleteMany(),
    db.rechargePack.deleteMany(), db.setting.deleteMany(),
  ]);

  // ---------- Content ----------
  const contents: any[] = [];
  const add = (c: any) => contents.push(c);

  for (const r of readApi('blog').filter(pub)) add({
    type: 'blog', slug: r.slug, title: r.title.trim(), author: r.sub_title || 'Guru Ji', category: r.category_name || 'Astrology',
    body: clean(r.description), excerpt: text(r.description), image: img(r.image) || img(r.thumbnail_img),
    metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const r of readApi('news').filter(pub)) add({
    type: 'news', slug: r.slug, title: r.title.trim(), author: r.user_name || 'Guru Ji', body: clean(r.description), excerpt: text(r.description),
    image: img(r.file_url) || img(r.img_url), metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const [kind, rows] of [['festival', readApi('festivals')], ['vrat', readApi('vrat')]] as const) for (const r of (rows as any[]).filter(pub)) add({
    type: kind, slug: r.slug || slugify(r.title), title: r.title.trim(), subtitle: r.thumbnail_title, body: clean(r.description), excerpt: text(r.description),
    image: img(r.img_url) || img(r.thumbnail_img), eventDate: dateOf(r.date, r.month, r.year),
    extra: JSON.stringify({ tithi: r.tithi || null, paksha: r.paksha || null }), metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const r of readApi('aarti').filter(pub)) add({
    type: r.a_type === 'bhajan' ? 'bhajan' : 'aarti', slug: r.slug, title: r.title.trim(), body: clean(r.description), excerpt: text(r.small_description || r.description),
    image: img(r.img_url) || img(r.thumbnail_img), metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const r of readApi('tarot').filter(pub)) add({
    type: 'tarot', slug: r.slug, title: r.title.trim(), body: clean(r.description), excerpt: text(r.description), image: img(r.img_url),
    extra: JSON.stringify({ table: clean(r.table_data) }), metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const r of readApi('numerology').filter(pub)) add({
    type: 'numerology', slug: r.slug, title: r.title.trim(), body: clean(r.description), excerpt: text(r.description), image: img(r.img_url) || img(r.thumbnail_img),
    metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const r of readApi('remedies').filter(pub)) add({
    type: 'remedy', slug: r.slug, title: r.title.trim(), subtitle: r.heading, body: clean(r.description), excerpt: text(r.sub_heading || r.description),
    image: img(r.img_url) || img(r.thumbnail_img), metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const r of readApi('vastu').filter(pub)) add({
    type: 'vastu', slug: r.slug.toLowerCase(), title: r.title.trim(), subtitle: r.thumbnail_title, body: clean(r.description), excerpt: text(r.description),
    image: img(r.img_url) || img(r.thumbnail_img), metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const r of readApi('video').filter(pub)) add({
    type: 'video', slug: slugify(r.slug), title: r.title.trim(), category: r.collection_name, body: clean(r.description), excerpt: text(r.description),
    image: img(r.thumbnail_img), extra: JSON.stringify({ videoUrl: r.video_url }), metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
  });
  for (const [kind, rows] of [['story', readApi('story')], ['gallery', readApi('gallery')]] as const) for (const r of (rows as any[]).filter(pub)) {
    const photos = (r.photos || []).sort((a: any, b: any) => a.input_order - b.input_order)
      .map((p: any) => ({ src: img(p.photo), title: (p.title || '').trim(), caption: text(p.description, 400) })).filter((p: any) => p.src);
    if (!photos.length) continue;
    add({
      type: kind, slug: slugify(r.slug), title: r.title.trim(), author: r.author || 'Guruji', body: clean(r.description), excerpt: text(r.description) || photos[0].caption,
      image: img(r.img_url) || photos[0].src, extra: JSON.stringify({ photos }), createdAt: new Date(r.created_at),
    });
  }
  for (const r of readApi('horoscope_data')) {
    const sign = String(r.zodiac_sign || '').trim().toLowerCase();
    if (!sign || !r.type) continue;
    add({
      type: 'horoscope', slug: slugify(`${r.type}-${sign}-${r.year || ''}-${r.month || r.start || r.id}`), title: `${r.zodiac_sign} ${r.type} horoscope`,
      category: r.type, body: clean(r.description), excerpt: text(r.description),
      extra: JSON.stringify({ sign, period: r.type, month: r.month || null, year: r.year || null, start: r.start || null, end: r.end || null }),
      metaTitle: r.meta_title, metaDesc: r.meta_description, createdAt: new Date(r.created_at),
    });
  }
  // de-dupe on (type, slug)
  const seen = new Set<string>();
  const unique = contents.filter((c) => { const k = c.type + '/' + c.slug; if (seen.has(k) || !c.slug) return false; seen.add(k); return true; });
  for (let i = 0; i < unique.length; i += 50) await db.content.createMany({ data: unique.slice(i, i + 50) });
  console.log('Content:', unique.length);

  // Daily horoscope (today's batch captured from the old site)
  for (const r of readApi('horoscope')) {
    const [d, m, y] = String(r.date).split('-');
    await db.dailyHoroscope.upsert({
      where: { date_sign: { date: `${y}-${m}-${d}`, sign: String(r.zodiac).toLowerCase() } },
      update: {},
      create: {
        date: `${y}-${m}-${d}`, sign: String(r.zodiac).toLowerCase(),
        data: JSON.stringify({ personal: r.personal, profession: r.profession, love: r.love, luck: r.luck, health: r.health, travel: r.travel, emotions: r.emotions }),
      },
    });
  }

  // ---------- Pages, FAQ, testimonials, banners ----------
  const pages: [string, string, string][] = [
    ['about-us', 'About Us', 'about-us'], ['terms-and-conditions', 'Terms & Conditions', 'terms-and-conditions'],
    ['privacy-policy', 'Privacy Policy', 'privacy-policy'], ['refund-policy', 'Refund Policy', 'refund-policy'],
    ['astrologer-terms', 'Astrologer Terms & Conditions', 'astrologer-terms-and-condition'],
  ];
  for (const [slug, title, file] of pages) {
    const t = pageText(file);
    if (t) await db.page.create({ data: { slug, title, body: textToHtml(t) } });
  }

  const home = fs.existsSync(path.join(SRC, 'rendered', '#home.txt')) ? fs.readFileSync(path.join(SRC, 'rendered', '#home.txt'), 'utf8') : '';
  const faqBlock = home.slice(home.indexOf('Frequently Asked Questions'), home.search(/SUBSCRIBE TO OUR NEWSLETTER/i));
  const faqs = [...faqBlock.matchAll(/Q(\d+)\.\s*([^\n]+)\n+([\s\S]*?)(?=\n\s*Q\d+\.|$)/g)];
  for (const f of faqs) await db.faq.create({ data: { sort: Number(f[1]), question: f[2].trim(), answer: f[3].trim() } });
  console.log('FAQs:', faqs.length);

  for (const r of readApi('testimonial')) await db.testimonial.create({ data: { name: r.name, profession: r.profession, body: text(r.description, 1000), createdAt: new Date(r.created_at) } });
  const banners = readApi('banners').filter(pub);
  for (const [i, r] of banners.entries()) {
    const image = img(r.img_url);
    if (image) await db.banner.create({ data: { image, link: r.page_url ? localizeUrls(r.page_url) : null, sort: i } });
  }

  // ---------- Pujas ----------
  for (const r of readApi('pooja_booking').filter(pub)) {
    const price = Number(r.price) || Number(r.total_amount) || 1100;
    const mrp = Math.max(Number(r.total_amount) || price, price);
    await db.puja.create({
      data: {
        slug: r.slug || slugify(r.pooja_name), name: r.pooja_name.trim(), image: img(r.img_url), price, mrp, tier: r.type === 'vip' ? 'vip' : 'standard',
        excerpt: text(r.small_description || r.description, 260), summary: clean(r.summary), body: clean(r.description),
        duration: r.duration && r.duration !== 'duration' ? r.duration : null, metaTitle: r.meta_title, metaDesc: r.meta_description,
      },
    }).catch(() => null);
  }

  // ---------- Astro Mart ----------
  const catIds: Record<string, string> = {};
  for (const r of readApi('product_category').filter(pub)) {
    const c = await db.productCategory.create({ data: { slug: r.slug || slugify(r.name), name: titleCase(r.name), image: img(r.image_url), description: text(r.description, 300) } });
    catIds[String(r.id)] = c.id;
    catIds[r.name.toLowerCase()] = c.id;
  }
  const ensureCat = async (slug: string, name: string) => catIds[slug] || (catIds[slug] = (await db.productCategory.create({ data: { slug, name } })).id);
  for (const r of readApi('products').filter(pub)) {
    const variants = (r.carat_prices || []).map((v: any) => ({ label: `${v.carat_value} carat`, price: v.total_price, mrp: Math.round(v.total_price / (1 - (Number(r.discount) || 0) / 100)) }));
    const photos = Object.values(r.photos || {}).map((u: any) => img(u)).filter(Boolean);
    const images = [...new Set([img(r.image_url), ...photos].filter(Boolean))];
    const price = variants[0]?.price || Number(r.price) || 999;
    await db.product.create({
      data: {
        slug: r.slug, name: r.product_name, categoryId: catIds[String(r.product_category_id)] || catIds[String(r.product_category_name).toLowerCase()] || (await ensureCat('gemstones', 'Gemstones')),
        images: JSON.stringify(images), excerpt: text(r.small_description, 260), summary: clean(r.summary), body: clean(r.description),
        price, mrp: variants[0]?.mrp || Math.round(price * 1.15), stock: Number(r.stock) || 50, origin: r.origin, variants: JSON.stringify(variants), featured: true,
      },
    });
  }
  // A few staple items so the store isn't empty (the old site only had two live products).
  const rudraksha = await ensureCat('rudraksha', 'Rudraksha');
  const yantra = await ensureCat('yantras', 'Yantras');
  const staples = [
    { slug: 'panchmukhi-rudraksha', name: 'Panchmukhi Rudraksha (5 Mukhi)', categoryId: rudraksha, price: 551, mrp: 799, excerpt: 'Ruled by Jupiter, the 5 Mukhi Rudraksha brings calm, focus and good health. Lab-certified and energised before dispatch.' },
    { slug: 'ek-mukhi-rudraksha', name: 'Ek Mukhi Rudraksha (1 Mukhi)', categoryId: rudraksha, price: 5100, mrp: 6500, excerpt: 'The rarest bead, associated with Lord Shiva and the Sun. Worn for clarity, leadership and spiritual growth.' },
    { slug: 'shri-yantra', name: 'Shri Yantra (Copper, 4 inch)', categoryId: yantra, price: 1100, mrp: 1500, excerpt: 'The yantra of Maa Lakshmi for prosperity and harmony at home or workplace. Energised with Shri Suktam.' },
    { slug: 'kuber-yantra', name: 'Kuber Yantra (Copper, 3 inch)', categoryId: yantra, price: 851, mrp: 1100, excerpt: 'Invites wealth and stability. Place it facing north in your locker or cash box.' },
    { slug: 'navgraha-yantra', name: 'Navgraha Yantra', categoryId: yantra, price: 1251, mrp: 1600, excerpt: 'Balances the nine planets in your chart and reduces malefic effects of weak grahas.' },
  ];
  for (const s of staples) await db.product.create({ data: { ...s, images: '[]', summary: '', body: `<p>${s.excerpt}</p>`, variants: '[]' } }).catch(() => null);

  // ---------- People ----------
  await db.rechargePack.createMany({
    data: [
      { amount: 50, bonus: 100, sort: 1 }, { amount: 100, bonus: 50, sort: 2 }, { amount: 200, bonus: 10, sort: 3 }, { amount: 500, bonus: 10, popular: true, sort: 4 },
      { amount: 1000, bonus: 15, sort: 5 }, { amount: 2000, bonus: 15, sort: 6 }, { amount: 3000, bonus: 20, sort: 7 }, { amount: 5000, bonus: 20, sort: 8 },
    ],
  });

  await db.user.create({ data: { phone: '9999999999', name: 'Admin', role: 'ADMIN', email: 'info@talktoguruji.com' } });
  const demo = await db.user.create({ data: { phone: '9876543210', name: 'Demo User', walletBalance: 50000, gender: 'Male', birthDate: '1995-08-15', birthTime: '06:30', birthPlace: 'New Delhi' } });
  await db.transaction.create({ data: { userId: demo.id, amount: 50000, type: 'BONUS', note: 'Welcome bonus', balanceAfter: 50000 } });

  const astros = [
    ['Acharya Raghav Shastri', 'Vedic, Prashna, Muhurta', 'Hindi, English, Sanskrit', 22, 'M', 'Varanasi', 32, 40, 50, true],
    ['Pt. Meera Joshi', 'Vedic, Vastu, Kundli Matching', 'Hindi, Marathi, English', 15, 'F', 'Pune', 25, 30, 38, true],
    ['Dr. Anand Iyer', 'KP System, Vedic, Numerology', 'Tamil, English', 18, 'M', 'Chennai', 28, 34, 42, false],
    ['Tarot Ishita', 'Tarot, Angel Reading, Psychic', 'English, Hindi', 8, 'F', 'Mumbai', 18, 22, 28, true],
    ['Guru Devendra Nath', 'Vedic, Remedies, Lal Kitab', 'Hindi, Punjabi', 26, 'M', 'Haridwar', 38, 45, 55, true],
    ['Astro Kavya Reddy', 'Nadi, Vedic, Face Reading', 'Telugu, English, Hindi', 11, 'F', 'Hyderabad', 22, 26, 32, false],
    ['Pt. Suresh Mishra', 'Vedic, Puja Vidhi, Muhurta', 'Hindi, Bhojpuri', 30, 'M', 'Prayagraj', 30, 36, 44, false],
    ['Numerologist Rohan Kapoor', 'Numerology, Name Correction, Vastu', 'Hindi, English', 9, 'M', 'Delhi', 16, 20, 25, false],
    ['Acharya Lakshmi Narayan', 'Palmistry, Vedic, Gemstones', 'Kannada, English, Hindi', 17, 'M', 'Bengaluru', 26, 30, 36, false],
    ['Sadhvi Anjali', 'Vedic, Spiritual Healing, Meditation', 'Hindi, English', 12, 'F', 'Rishikesh', 20, 24, 30, false],
    ['Jyotishi Bhaskar Das', 'Vedic, KP System, Career', 'Bengali, Hindi, English', 20, 'M', 'Kolkata', 27, 32, 40, false],
    ['Astro Neha Shah', 'Tarot, Numerology, Love & Relationship', 'Gujarati, Hindi, English', 7, 'F', 'Ahmedabad', 15, 18, 22, false],
  ] as const;
  const bios: Record<string, string> = {
    Vedic: 'Reads the birth chart in the classical Parashari tradition, with practical remedies for career, marriage and health.',
    Tarot: 'Uses the Rider–Waite deck to bring clarity to love, career and timing questions, with gentle, honest guidance.',
    Numerology: 'Works with Chaldean and Pythagorean systems for name correction, lucky numbers and business names.',
    'KP System': 'Specialises in Krishnamurti Paddhati for precise event timing and yes/no answers.',
    Nadi: 'Combines Nadi principles with Vedic analysis for detailed life-event predictions.',
    Palmistry: 'Reads palm lines and mounts alongside the kundli for a complete picture.',
  };
  const reviewLines = [
    'Very accurate reading, explained everything patiently.', 'Remedies were simple and practical. Feeling much better.',
    'Predicted my job change timing exactly right!', 'Calm and kind. Answered all my questions about marriage.',
    'Clear guidance without any fear-mongering. Highly recommended.', 'Second consultation, again spot on.',
  ];
  for (const [i, a] of astros.entries()) {
    const [name, skills, langs, exp, g, city, chat, call, video, featured] = a;
    const user = await db.user.create({ data: { phone: `90000000${String(i + 1).padStart(2, '0')}`, name, role: 'ASTROLOGER', gender: g === 'M' ? 'Male' : 'Female' } });
    const lead = skills.split(',')[0].trim();
    const astro = await db.astrologer.create({
      data: {
        userId: user.id, slug: slugify(name), displayName: name, gender: user.gender, city, skills, languages: langs, experience: exp,
        bio: `${name.split(' ').slice(-2).join(' ')} has ${exp}+ years of experience. ${bios[lead] || bios.Vedic} Consults from ${city}.`,
        qualification: exp > 15 ? 'Jyotish Acharya' : 'Jyotish Visharad', chatPrice: chat * 100, callPrice: call * 100, videoPrice: video * 100,
        freeMinutes: i % 3 === 0 ? 5 : 0, status: 'APPROVED', featured, isOnline: i < 7, totalMinutes: 4000 + exp * 900,
      },
    });
    let sum = 0;
    const n = 3 + (i % 4);
    for (let k = 0; k < n; k++) {
      const rating = k % 5 === 4 ? 4 : 5;
      sum += rating;
      await db.review.create({ data: { userId: demo.id, astrologerId: astro.id, rating, comment: reviewLines[(i + k) % reviewLines.length], createdAt: new Date(Date.now() - (k + 1) * 86400000 * (i + 2)) } });
    }
    await db.astrologer.update({ where: { id: astro.id }, data: { rating: Math.round((sum / n) * 10) / 10, ratingCount: n + 40 + i * 13 } });
  }
  // One pending application so the admin approval flow has something to show
  const pendingUser = await db.user.create({ data: { phone: '9000000099', name: 'Pt. Vivek Tiwari', role: 'USER' } });
  await db.astrologer.create({ data: { userId: pendingUser.id, slug: 'pt-vivek-tiwari', displayName: 'Pt. Vivek Tiwari', skills: 'Vedic, Vastu', languages: 'Hindi', experience: 6, city: 'Lucknow', bio: 'Applied via Join as Astrologer.', status: 'PENDING' } });

  await db.setting.createMany({
    data: [
      { key: 'contact_address', value: 'ALtF 142 NOIDA, Plot no. 21 and 21A. Sector 142, Maharishi Nagar, Noida, Gautam Buddha Nagar- 201304, Uttar Pradesh, India' },
      { key: 'contact_email', value: 'info@Talktoguruji.com' },
      { key: 'gst_percent', value: '18' },
      { key: 'social', value: JSON.stringify({ facebook: 'https://www.facebook.com/talktoguruji.live', x: 'https://x.com/talktoguruji', instagram: 'https://www.instagram.com/talktoguruji.live' }) },
    ],
  });

  const counts = await Promise.all([db.content.groupBy({ by: ['type'], _count: true }), db.puja.count(), db.product.count(), db.astrologer.count(), db.page.count()]);
  console.log(counts[0].map((c) => `${c.type}:${c._count}`).join(' '), '| pujas', counts[1], '| products', counts[2], '| astrologers', counts[3], '| pages', counts[4]);
}

function titleCase(s: string) { return s.replace(/\b\w/g, (c) => c.toUpperCase()); }

main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
