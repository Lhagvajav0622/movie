# Starting a new site from this codebase

Goal: a second site that behaves exactly like this one (films, vertical series, admin, signed video,
QPay, categories). The owner then changes design, texts and features step by step in the new project.

For Claude: read `AGENTS.md` first (this Next.js version has breaking changes; read
`node_modules/next/dist/docs/` before writing code). Talk to the owner in simple Mongolian. The owner does
not want to run CLI commands: do them yourself, or give a short ready-to-paste prompt for the PC-side
Claude Code. **Never print, paste or commit secrets.** Secrets live only in Vercel / Cloudflare settings
and a git-ignored `.env`.

## 1. What the system is

| Part | Tech | Where |
|---|---|---|
| Website + admin | Next.js 16 App Router, Tailwind | Vercel (region sin1) |
| Database | Postgres via Drizzle | Neon |
| Login | Better Auth: phone OTP + password | in the app |
| Video | R2 bucket + Worker that checks signed URLs | Cloudflare |
| Payments | QPay V2 (`PAYMENT_MODE=test` or `live`) | `src/server/payments` |

Rules that matter: `src/server/access.ts` decides who can watch what. An episode with only a preview clip is a
free episode; with a full version it is clip-then-buy. Signed video URLs are made in `src/server/video.ts`
and checked by `worker/src/index.js` (same HMAC secret on both sides).

## 2. Create the new repo (no history, no secrets)

```
git clone --depth 1 https://github.com/Lhagvajav0622/movie new-site
cd new-site
rm -rf .git            # on Windows: rmdir /s /q .git
git init && git add -A && git commit -m "Initial copy"
```
Then create an empty GitHub repo and push. Never copy `.env`, `.env.local` or `.next`.

## 3. Rename what belongs to the old site

Do this before any user or video exists. Search with `git grep -n -i "mhub\|kinohorom\|movie-nu-brown"`:
- `package.json` name; `README.md` title.
- `worker/wrangler.toml`: `name` (new Worker name), `bucket_name`, `ALLOWED_ORIGINS`.
- `R2_BUCKET` fallback `"mhub-videos"` in `src/server/storage.ts`, `scripts/r2-cors.ts`, `scripts/lib/r2.ts`.
- `NEXT_PUBLIC_SITE_URL` in `.env.example`; the URL in `src/server/payments/qpay.test.ts`; URLs in `docs/LOCAL_SETUP.md`.
- `src/server/auth.ts`: `@phone.mhub.local` temporary e-mail domain (safe to rename only while the DB is empty).
- Brand: `src/app/layout.tsx` (title, siteName), `src/components/brand/*` (logo), `src/app/icon.svg`,
  `src/app/opengraph-image.tsx`, `public/brand/`.
- `drizzle/` migrations stay as they are.

## 4. New accounts and resources (never share them with the old site)

1. **Neon**: new project, region Singapore. Copy `DATABASE_URL` into Vercel (and local `.env`).
2. **Cloudflare R2**: new bucket (APAC). Create an API token with *Object Read & Write* for that bucket only.
   R2 is not public. CORS cannot be set by `npm run r2:cors` (token lacks Admin): in the Cloudflare dashboard,
   bucket → Settings → CORS Policy, allow the site origins (GET, PUT, HEAD) and headers.
3. **Worker**: from `worker/`: `npx wrangler login`, `npx wrangler deploy`. Make a new random secret
   (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`), then
   `npx wrangler secret put SIGNING_SECRET`. `<worker-url>/health` must say `ok`.
4. **Vercel**: import the new repo. Hobby is non-commercial; use Pro before charging customers.
5. **Domain**: add it in Vercel → Domains and follow the DNS values it shows. Datacom DNS quirks: TTL must be at
   least 7200; host `@` is the apex (A record), `www` is a CNAME; leave Datacom's own NS records alone.
6. **QPay**: the new business needs its own merchant username, password and invoice code. Start with `PAYMENT_MODE=test`.
7. **SMS**: see section 6.

## 5. Environment variables (Vercel → Settings → Environment Variables)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon. Needed at **build** time too: `npm run build` runs migrations and seed first. |
| `BETTER_AUTH_SECRET` | New random value, 32+ chars. Do not set `BETTER_AUTH_URL` (the origin comes from the request). |
| `VIDEO_BASE_URL` | Worker URL, no trailing slash. |
| `VIDEO_SIGNING_SECRET` | Must equal the Worker's `SIGNING_SECRET`. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Used by admin uploads (browser PUT to R2) and the upload scripts. |
| `NEXT_PUBLIC_SITE_URL` | The live https address (QPay callback). |
| `PAYMENT_MODE` | `test` until QPay works, then `live`. |
| `QPAY_BASE_URL`, `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE` | Mark username/password as Secret. |
| `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER`, `OTP_DEMO` | Section 6. |
| `ADMIN_PHONES` | Optional: phone numbers that become admins. |

**After any env change, Redeploy** (Deployments → latest → Redeploy), otherwise nothing changes.

First admin: sign up on the site once, then promote that phone with `npm run db:seed -- --admin +976XXXXXXXX`
(or list it in `ADMIN_PHONES`).

## 6. SMS / OTP: not finished in the old project either

`otpDemoMode()` in `src/server/auth.ts` is true when `SMS_API_URL` is empty and `OTP_DEMO` is not `"0"`. In
demo mode the API returns the code (`devCode`), so **anyone can sign in as any phone, admins included**.
Do not share the link publicly until a real SMS sender is wired in and demo mode is off. CallPro Text
(Bundle 2 includes "API Integration") was chosen but its API documentation had not arrived (support
ticket pending). SMS text must be short: Cyrillic is 70 characters per segment.

## 7. Verify

- `npm run lint`, `npx tsc --noEmit`, `npm test`, `npx next build` are all clean.
- Admin → create a title, upload a video (needs the R2 token and CORS), open it on a phone.
- A locked episode must show the purchase screen; a direct R2 URL must not work (only the Worker serves video).
- A real payment test in `live` mode before launch.

## 8. Where to change things afterwards

- Colors and fonts: `src/app/globals.css` (`@theme`). Logo: `src/components/brand/`.
- Home page and menus: `src/app/(main)`, `src/components/layout`, `src/components/catalog`.
- Categories (menu, filters): Admin → Ангилал; no code change needed.
- Placeholder catalog shown while empty: `src/lib/demo.ts`.
- Tests: `npm test` (42 at the time of writing). Do not run prettier over globs.
