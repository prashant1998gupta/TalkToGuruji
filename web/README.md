# Talk to Guruji — rebuild (local)

A full rebuild of talktoguruji.com: same content, new design, working consultation platform.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + SQLite · Socket.io (chat, presence, billing, call signaling) · WebRTC (voice/video) · three.js / React Three Fiber (3D hero) · astronomy-engine (kundli, panchang).

Everything runs on your machine. Nothing is deployed or published.

## Run it

```bash
cd web
npm install
npm run setup      # creates prisma/dev.db and imports all content from ../_source
npm run dev        # http://localhost:3000
```

`npm run db:seed` resets the database to the clean imported state at any time.

## Demo logins (local mode)

Login is by mobile OTP. In local mode no SMS is sent — the OTP is shown on the login screen (and printed in the server console).

| Role | Mobile |
| --- | --- |
| User (₹500 wallet) | 9876543210 |
| Admin | 9999999999 |
| Astrologers | 9000000001 … 9000000012 |
| Pending astrologer application | 9000000099 |

To try a live consultation: open two browsers (or one normal + one private window), log in as an astrologer in one and go online in the astrologer dashboard, log in as the user in the other and start a chat / call / video.

## Payments

Local mode uses a built-in **test gateway** at `/pay/[id]` — no real money moves. Wallet recharges, puja bookings and Astro Mart orders all flow through `src/lib/payments.ts`. To go live, replace the `/pay/[id]` page with Razorpay Checkout and call `fulfillPayment()` from the verified Razorpay webhook.

## Going to production — checklist

- `APP_MODE=production` and a strong `JWT_SECRET` in `.env`
- Plug an SMS provider into `src/app/api/auth/otp/send/route.ts`
- Razorpay (see above)
- Switch `DATABASE_URL` to PostgreSQL (change `provider` in `prisma/schema.prisma`)
- A TURN server for WebRTC calls across strict NATs (STUN alone works on most home/mobile networks)

## Folders

- `_source/` (one level up) — content captured from the old site (public content only; sensitive fields stripped)
- `prisma/seed.ts` — imports that content
- `src/server/realtime.ts` — Socket.io: presence, consultation lifecycle, per-minute billing, WebRTC signaling
- `src/lib/astro/` — Vedic calculation engine
- `src/app/(site)` — public website · `src/app/consult` — consultation room · `src/app/astrologer-panel` · `src/app/admin`
