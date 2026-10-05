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
- Payment phase A: bank transfer with order code, admin approves. Phase B: QPay.
