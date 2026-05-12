-- TheOutsideViewers: sentiment pipeline schema
-- v1: YouTube + Reddit ingestion, multi-run analysis support
-- Run against your Railway Postgres database.

CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw comments. Idempotent on (source, source_comment_id) so re-fetching is safe.
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('youtube', 'reddit')),
  source_comment_id TEXT NOT NULL,
  source_parent_id TEXT,          -- video_id (YT) or post_id (Reddit)
  source_parent_title TEXT,
  author TEXT,
  text TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source, source_comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_topic ON comments(topic_id);
CREATE INDEX IF NOT EXISTS idx_comments_published ON comments(published_at);

-- One row per analysis run. Multiple runs per topic enables opinion-shift tracking.
CREATE TABLE IF NOT EXISTS analyses (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  model_used TEXT,
  comment_count INTEGER,
  sentiment_distribution JSONB,   -- {positive: 0.34, negative: 0.41, mixed: 0.15, neutral: 0.10}
  themes JSONB,                   -- [{theme: "...", weight: 0.2, example_ids: [..]}, ...]
  key_quotes JSONB,               -- [{comment_id: 123, rationale: "..."}, ...]
  summary TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_analyses_topic ON analyses(topic_id);
CREATE INDEX IF NOT EXISTS idx_analyses_run_at ON analyses(run_at);

-- Per-comment per-run tagging. Lets you re-analyze the same comments with
-- different methodologies and keep historical results.
CREATE TABLE IF NOT EXISTS comment_analyses (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analyses(id) ON DELETE CASCADE,
  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  sentiment TEXT,                 -- 'positive' | 'negative' | 'mixed' | 'neutral'
  sentiment_score NUMERIC(3,2),   -- -1.00 to 1.00
  tags JSONB,                     -- array of theme tags this comment matches
  UNIQUE (analysis_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_ca_analysis ON comment_analyses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ca_comment ON comment_analyses(comment_id);
