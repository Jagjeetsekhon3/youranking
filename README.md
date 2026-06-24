# YouRanking

A YouTube growth tool built for a creator, by a creator. Find winning ideas, package them to win.

This is the **v1 foundation**: the web app that holds all the logic. Two features are
fully live and prove the whole architecture end to end; the rest are scaffolded.

---

## What's live right now

- **Title Lab** — type a topic, get 10 scored + ranked titles. Routed to **Claude**. Save winners to the Idea Bank.
- **Thumbnail A/B Reader** — drop 2–3 thumbnails, get a side-by-side read and a winner. Routed to **Gemini** (vision). Nothing stored.
- **Idea Bank** — your swipe file, backed by Supabase.
- **Outlier Finder** — scan a niche for videos beating their channel's sub count. YouTube Data API + ratio scoring. Save outliers straight to the Idea Bank.
- **SEO Audit** — paste a URL; Gemini watches the video and scores title, hook, thumbnail-promise, description, chapters with specific fixes. Falls back to metadata-only if the video can't be ingested.
- **Niche Finder** — real 50-video scan → demand, beatable competition, momentum, RPM estimate, and 3-4 sub-niche entry points. Region + format filters.

**v1 is feature-complete.** All six features are live.

---

## The keystone: the model router

Features never name a model. They call `run("title.generate", {...})`. The router
(`src/lib/ai/router.ts`) decides Claude vs Gemini and which tier. Change cost, swap a
model, or rebalance — in one file, never in feature code.

- **Gemini = eyes + volume** (video, images, bulk cheap work)
- **Claude = craft + judgment** (titles, hooks, scripts, polished reasoning)

---

## Run it locally

```bash
npm install
cp .env.local.example .env.local   # then fill in your keys
npm run dev                        # http://localhost:3000
```

Title Lab needs `ANTHROPIC_API_KEY`. Thumbnail Reader needs `GEMINI_API_KEY`.
Idea Bank needs Supabase — create a project, run `supabase/schema.sql` in the SQL
editor, and paste `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`.

Outlier Finder needs `YOUTUBE_API_KEY` — in Google Cloud Console, enable **YouTube
Data API v3** and create an API key. Free tier = 10,000 units/day; one scan ≈ 102 units
(~95 scans/day). `search.list` is the expensive call (100u); everything else batches at
1u. Cache by video id before going public — that's the scaling move.

> Model ids live in `router.ts` (`MODELS`). Gemini ids shift often — verify against
> current Google docs if a call 404s.

---

## Locking the app (do this before sharing the URL)

The app is gated by a single password via middleware — it protects **every page
AND every API route**, so no one can burn your API quota by hitting `/api/titles`
directly. Set one env var:

```
APP_PASSWORD=your-strong-password
```

Set it in Vercel env and redeploy. Visiting any page redirects to `/login`; API calls
without a session return 401. The session is an httpOnly HMAC cookie (the password is
never stored in the cookie). Log out from the sidebar. **If APP_PASSWORD is unset, the
app stays open** — so don't forget it.

For going public later this becomes real per-user accounts (Supabase Auth); the single
password is the right size while it's just you.

## Settings page — managing keys

A **Settings page** (`/settings`) manages your provider keys without touching Vercel
env vars each time. Keys (Claude, Gemini, YouTube) save into the Supabase `settings`
table; the app reads them there first, env as fallback. The page only ever shows the
last 4 chars, and each key has a **Test** button that pings the provider live.

Bootstrap order: set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in env first (the DB
creds can't live in the DB), run the schema, then add the rest in Settings.

## Build order (don't skip)

1. **Web app first** — it holds all the logic. ← you are here
2. **Chrome extension second** — a thin layer over the same API routes (Bearer auth travels cleanly). Add once routes are stable.
3. **Billing / multi-tenant last** — only when going public. Then: add `user_id` to tables, enable RLS, wire Razorpay/Stripe.

## Next features to wire

- **Outlier Finder** — YouTube Data API (safe) or scrape (fragile); score = `run("niche.score")`.
- **SEO Audit** — pass the URL to Gemini for real video analysis; `run("seo.audit")`.
- **Niche Finder** — YouTube view data (size) + Google Trends via SerpApi on the *YouTube property* (direction).

## Data-source caveats

- YouTube Data API has daily quotas; scraping is cheaper but against ToS at scale.
- Google Trends official API is still limited alpha — use SerpApi/Apify and always the **YouTube property** (it's relative interest, not volume).
- Avoid "Tube"/"YouTube"/their logo in public branding.
