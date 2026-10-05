# Local setup task (for Claude Code running on the owner's Windows PC)

You are setting up the Mhub project on the owner's computer. Work step by step, explain each
step to the owner in Mongolian, and stop to ask whenever a sign-in or approval is needed in the browser.
Never print or commit secrets. Secrets go only into `.env` (git-ignored) or Vercel / Cloudflare settings.

## 0. Prerequisites
- Check `node -v` (need 20+) and `git --version`. If Node is missing, tell the owner to install
  the LTS from https://nodejs.org and reopen the session.

## 1. Get the code
```
git clone https://github.com/Lhagvajav0622/movie
cd movie
npm install
```

## 2. Cloudflare R2 (owner signs in)
1. Ask the owner to sign in at https://dash.cloudflare.com and open **R2 Object Storage**
   (enabling R2 asks for a card; free tier covers 10 GB).
2. Create bucket **mhub-videos**, location **Asia-Pacific (APAC)**.
3. R2 → **Manage R2 API Tokens** → Create token: permission *Object Read & Write*, bucket `mhub-videos`.
   The owner pastes the values; write them to `movie/.env`:
   ```
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET=mhub-videos
   ```

## 3. Deploy the video Worker
```
cd worker
npx wrangler login          # opens the browser; owner clicks Allow
npx wrangler deploy         # prints https://mhub-video.<subdomain>.workers.dev
```
Generate a signing secret (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`),
then `npx wrangler secret put SIGNING_SECRET` and paste it.
Check: open `<worker-url>/health` → `ok`.
Then set `ALLOWED_ORIGINS` in `worker/wrangler.toml` to `https://movie-nu-brown.vercel.app` and deploy again.

## 4. Connect the website (Vercel)
Ask the owner to add in Vercel → Project **movie** → Settings → Environment Variables:
- `VIDEO_BASE_URL` = the workers.dev URL (no trailing slash)
- `VIDEO_SIGNING_SECRET` = the same secret as SIGNING_SECRET
Then Deployments → latest → Redeploy.

Also add to local `movie/.env`:
```
DATABASE_URL=<same as Vercel, without &channel_binding=require>
VIDEO_BASE_URL=<worker url>
```
(The owner can copy DATABASE_URL from Vercel → Environment Variables.)

## 5. Upload a first test title
1. Owner creates the title in https://movie-nu-brown.vercel.app/admin/titles/new
   (vertical + series for Chinese dramas), status **Нийтлэх**. Note its URL slug.
2. Ask which folder holds the episode files. Then:
   ```
   npm run video -- --title <slug> --dir "C:\path\to\folder"
   ```
   Files are numbered from their names (ep1.mp4, ep2.mp4 …). One film:
   `npm run video -- --title <slug> --episode 1 --file "C:\path\film.mp4"`
3. Verify on the phone: open the title page, press Тоглуулах. Video should start, swipe works,
   locked episodes show the purchase screen after the free minutes.

## Notes
- Encoding is CPU-heavy: a 2-hour film can take 30–60 min. Short drama episodes take seconds.
- If something fails, show the exact error to the owner and stop; do not change application code
  unless it is a clear local-setup issue. Report back what was done.
