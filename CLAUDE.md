# Talk to Guruji — rebuild

Full rebuild of talktoguruji.com (client project): same content, new design, working astrology consultation platform (chat / voice / video with per-minute wallet billing), free astrology tools, puja booking, Astro Mart store, astrologer dashboard and admin panel. Runs entirely locally; nothing is deployed.

## First-time setup on a new computer

Requirements: **Node.js 20.11+** (developed on Node 24) and git. Nothing else — the database is SQLite, created by setup.

```bash
cd web
npm install
npm run setup     # creates .env from .env.example, builds prisma/dev.db, imports all content from ../_source
npm run dev       # http://localhost:3000
```

If the user asks you to "set up the project", run exactly the commands above and then open http://localhost:3000 (in the Claude desktop app use the `talktoguruji` config in `.claude/launch.json`). `npm run setup` is safe to re-run; `npm run db:seed` resets the database to the clean imported state (wipes users, sessions, orders created while testing).

### Demo logins (local mode — the OTP is shown on the login screen, no SMS)

| Role | Mobile |
| --- | --- |
| User (₹500 wallet) | 9876543210 |
| Admin | 9999999999 |
| Astrologers | 9000000001 … 9000000012 |
| Pending astrologer application | 9000000099 |

Live consultation test: two browser windows (normal + private). Astrologer logs in → dashboard → go online; user starts chat/call/video → astrologer accepts.

## Commands (run inside `web/`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (custom `server.ts`: Next.js + Socket.io on one port) |
| `npm run build` then `npm start` | Production build / server (use this for reliable end-to-end testing) |
| `npm run typecheck` / `npx eslint src` | Type check / lint — keep both clean |
| `npm run db:seed` | Reset DB and re-import content |
| `npm run test:smoke` | Requests every sitemap URL (+ a few app routes) against a running server, reports non-200 |
| `npm run test:e2e` | Two-browser Playwright test: login, chat + billing, recharge, video, voice call |
| `npm run test:astro` | Kundli / panchang / matching accuracy check |

Playwright scripts use the installed Microsoft Edge (`playwright-core`, no bundled browsers). On a machine without Edge set `BROWSER_CHANNEL=chrome`.

## Architecture

- `web/` — the app. Next.js 15 App Router, TypeScript, Tailwind CSS v4, Prisma + SQLite, Socket.io, WebRTC, three.js / React Three Fiber, astronomy-engine.
- `_source/` — public content captured from the old site (API JSON, rendered page text, `media-map.json`). Read only by `prisma/seed.ts`. Sensitive fields were stripped; never re-scrape astrologer/user endpoints.
- `web/server.ts` — custom server. `src/server/realtime.ts` holds all realtime logic: astrologer presence, consultation lifecycle (request → accept → active → end), per-minute billing timers, chat, WebRTC signaling (`rtc:signal`, self-healing `rtc:hello` → `rtc:ready`).
- `src/lib/` — `db.ts` (Prisma singleton), `auth.ts` / `auth-token.ts` (OTP + JWT cookie `ttg_session`), `wallet.ts` (`walletMove` — the only way to change balances; writes the ledger), `payments.ts` (`createPaymentOrder` / `fulfillPayment`; local test gateway at `/pay/[id]`), `settings.ts` (admin-editable contact info & GST), `realtime-bridge.ts` (route handlers emit socket events via `globalThis.__io`), `astro/` (Vedic calculation engine, cities), `nav.ts`, `zodiac.ts`, `format.ts`.
- `src/app/(site)/` — public website with header/footer. `src/app/consult/[id]` — consultation room. `src/app/astrologer-panel/` — astrologer dashboard. `src/app/admin/` — admin panel (every `/api/admin/*` route checks `apiUser(['ADMIN'])`). `src/app/pay/[id]` — test gateway.
- `src/components/` — `ui/` (primitives, ContentCard, Faq), `layout/`, `consult/`, `astro/`, `content/`, `commerce/`, `admin/`, `three/` (3D hero, lazy-loaded).

## Conventions & gotchas

- **Money**: wallet, sessions, transactions, orders and payment orders are in **paise** (integers). Puja and product catalog prices are whole **rupees**. Use `rupees()` / `inr()` from `lib/format.ts`.
- **Old URLs are preserved** (`/blogs/[slug]`, `/astrology-services/...`, `/horoscope/...`, `/rituals/...`) for SEO — don't rename routes.
- **Tailwind v4**: design tokens live in `src/app/globals.css` (`@theme`). Reusable classes (`btn-primary`, `card`, `input`, `night`, `container-x`, `h-display`, `prose-guru` …) are defined with `@utility` — custom classes can't be `@apply`-ed from `@layer`.
- **Changes to `server.ts` / `src/server/realtime.ts` / `next.config.ts` need a server restart** (not hot-reloaded).
- **Dev mode can be flaky under heavy parallel compiling** (half-written chunks, "Unexpected end of JSON input"). If tests fail with page errors in dev, rebuild and test against `npm run build && npm start` before debugging.
- Route handler files may only export HTTP methods / route config — put helpers in `src/lib`.
- Client components must not export functions that server components call (Next throws); shared helpers go in plain modules.
- `APP_MODE=local` returns the OTP to the browser and enables the test gateway. Never ship that to production.
- Daily horoscope data from the old site only covers 23 Oct 2026; admins add new days in Admin → Daily horoscope.

## Before going live (not done yet)

`APP_MODE=production` + strong `JWT_SECRET`; SMS provider in `src/app/api/auth/otp/send/route.ts`; Razorpay replacing `/pay/[id]` with `fulfillPayment()` called from the verified webhook; PostgreSQL (`provider` in `prisma/schema.prisma`); a TURN server for calls across strict NATs. See `web/README.md`.
