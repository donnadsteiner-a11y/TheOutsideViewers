# TheOutsideViewers — Sentiment Intelligence Pipeline

A backend that harvests public comments on news topics from YouTube (and later Reddit), runs them through Claude for sentiment, themes, and representative quotes, and stores everything permanently so opinion shifts can be tracked over time.

This is the moat. Slop channels read news at you. This one tells you what the public actually thinks — at scale, with receipts.

---

## File layout

```
.
├── package.json
├── server.js              Express routes
├── db.js                  Postgres queries
├── schema.sql             4-table schema
├── .env.example           Copy to .env and fill in
├── fetchers/
│   └── youtube.js         YouTube Data API client (working)
├── analysis/
│   └── analyze.js         Claude two-pass analysis (Weekend 2 stub)
└── public/
    └── index.html         Minimal admin UI
```

Same three-file pattern as StretchMyPay (`index.html` / `server.js` / `db.js`), with fetchers and analysis broken out.

---

## Setup

### 1. Postgres
Run `schema.sql` against your Railway Postgres database. You can do this from the Railway dashboard query console or via `psql`.

### 2. YouTube Data API key
1. Go to https://console.cloud.google.com
2. Create a project (or pick an existing one)
3. APIs & Services → Library → search "YouTube Data API v3" → **Enable**
4. APIs & Services → Credentials → **Create Credentials → API key**
5. Restrict the key to YouTube Data API v3 only (security hygiene)
6. Copy the key into `.env` as `YOUTUBE_API_KEY=...`

**Quota:** Free tier is 10,000 units/day. Each `commentThreads.list` call = 1 unit and returns up to 100 comments. 5,000 comments per topic ≈ 50 units. You're nowhere near the limit.

### 3. Anthropic API key
Reuse your pAIgeBOTS key or create a new one at https://console.anthropic.com. Put it in `.env` as `ANTHROPIC_API_KEY=...`.

### 4. Install & run

```bash
cp .env.example .env       # then fill in the values
npm install
npm run dev
```

Open http://localhost:3000.

---

## Weekend 1 workflow (this skeleton does all of it)

1. Create a topic in the UI ("Fed rate decision May 2026")
2. Find a relevant YouTube video covering the topic
3. Grab the video ID from the URL (the `v=` part: `youtube.com/watch?v=ABC123` → `ABC123`)
4. Paste it into the topic row, click **Fetch YT Comments**
5. Click **View Comments** to confirm they're stored in Postgres

That's the full Weekend 1 loop. Verify it works end-to-end before moving on.

---

## Weekend 2 — Claude analysis layer

`analysis/analyze.js` has the architecture written out as comments. Two-pass design:

- **Haiku** (`claude-haiku-4-5`) — per-comment sentiment + tags, batched 50 at a time. Cheap and fast.
- **Sonnet** (`claude-sonnet-4-6`) — theme synthesis and representative-quote selection over the tagged set.

Cost: ~$3–8 per analysis run of 5,000 comments. Store everything in the `analyses` and `comment_analyses` tables so you can re-run with new methodology without re-fetching.

---

## Weekend 3 — UI, exports, Reddit

- Results dashboard: sentiment distribution chart, theme list, quote browser
- Export "video brief" — markdown with stats and quotable comments ready to drop into your script
- Reddit ingestion via the Reddit API (free, OAuth required). Add as `fetchers/reddit.js`.

---

## Design principles (Donna-flavored)

- Always grep before assuming
- `node --check` every JS file before deploying
- `str_replace` over full rewrites for changes
- Verify state with console queries before adding features
- Separate deploys per change, smoke test after each

Standard StretchMyPay discipline applies here.
