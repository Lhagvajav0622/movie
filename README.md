# Mhub — MVP

Mongolian movie and vertical-drama streaming platform. Next.js (App Router) + Postgres (Drizzle) + Better Auth + Bunny Stream.

Architecture proposal: see the "Mhub MVP — Архитектурын санал" doc.

## Run locally

```bash
cp .env.example .env.local   # fill DATABASE_URL and BETTER_AUTH_SECRET at least
npm install
npm run db:migrate           # create tables
npm run db:seed              # genres
npm run dev
```

In development, SMS codes are printed to the terminal (no SMS provider needed).

Make yourself admin after signing up once:

```bash
npm run db:seed -- --admin +976XXXXXXXX
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm test` | Unit tests (access rules) |
| `npm run db:generate` | New migration from `src/server/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed genres / promote admin |

## Layout

```
src/app/(main)      pages with header + bottom nav
src/app/api         route handlers (auth, later: play, orders, webhooks)
src/components      layout/, catalog/, player/, payment/
src/server          db, auth, access rules, sms, bunny
drizzle/            SQL migrations
scripts/seed.ts
```

## Business rules

- Each title has its own price (`price_mnt`, 0 = free); a purchase gives lifetime access.
- Unpaid viewers get `free_preview_sec` (default 300 s), counted from episode 1 for series.
- Payments: `PAYMENT_MODE=test` (default) uses a fake QPay/SocialPay provider; the buyer confirms with one click in the
  checkout modal and gets lifetime access (`orders` + `purchases` rows, flagged `is_test`). To go live, implement
  `src/server/payments/qpay.ts` / `socialpay.ts` (same `PaymentProvider` interface), add a callback route, then set
  `PAYMENT_MODE=live` (this also disables `/api/orders/:id/test-pay`).

## Video (Cloudflare R2 + Worker)

Videos are encoded to HLS on your computer, stored in R2 and served by the Worker in `worker/`,
which checks a signed, expiring URL and enforces the free preview (playlists cut, later segments refused).
Cloudflare has a PoP in Ulaanbaatar and R2 has no egress fees.

One-time setup:

1. Cloudflare dashboard → R2 → create bucket `mhub-videos`.
2. R2 → Manage API tokens → create token with *Object Read & Write* on that bucket.
   Put `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` in your local `.env`.
3. Deploy the Worker:
   ```bash
   cd worker
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put SIGNING_SECRET   # any long random string
   ```
4. In Vercel set `VIDEO_BASE_URL` (the workers.dev URL printed by deploy) and
   `VIDEO_SIGNING_SECRET` (same value as SIGNING_SECRET). Redeploy.

Upload episodes (title must exist in /admin first):

```bash
npm run video -- --title <slug> --dir "C:\videos\drama"            # ep1.mp4, ep2.mp4, ...
npm run video -- --title <slug> --episode 1 --file "C:\videos\film.mp4"
```

Local test without Cloudflare: `STORE=<folder> node worker/local-dev.mjs` serves a folder like R2.
