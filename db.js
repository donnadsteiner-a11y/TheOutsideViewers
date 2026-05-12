// db.js — Postgres pool + queries
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- Topics ---
async function createTopic(name, description) {
  const r = await pool.query(
    'INSERT INTO topics (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  return r.rows[0];
}

async function listTopics() {
  const r = await pool.query('SELECT * FROM topics ORDER BY created_at DESC');
  return r.rows;
}

async function getTopic(id) {
  const r = await pool.query('SELECT * FROM topics WHERE id = $1', [id]);
  return r.rows[0];
}

// --- Comments ---
async function insertComment(c) {
  const r = await pool.query(
    `INSERT INTO comments
       (topic_id, source, source_comment_id, source_parent_id, source_parent_title,
        author, text, like_count, reply_count, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (source, source_comment_id) DO NOTHING
     RETURNING *`,
    [c.topic_id, c.source, c.source_comment_id, c.source_parent_id, c.source_parent_title,
     c.author, c.text, c.like_count, c.reply_count, c.published_at]
  );
  return r.rows[0]; // undefined if conflict (already existed)
}

async function listComments(topicId, limit = 500) {
  const r = await pool.query(
    'SELECT * FROM comments WHERE topic_id = $1 ORDER BY like_count DESC NULLS LAST LIMIT $2',
    [topicId, limit]
  );
  return r.rows;
}

async function countComments(topicId) {
  const r = await pool.query('SELECT COUNT(*) FROM comments WHERE topic_id = $1', [topicId]);
  return parseInt(r.rows[0].count, 10);
}

// --- Analyses ---
async function createAnalysis(a) {
  const r = await pool.query(
    `INSERT INTO analyses
       (topic_id, model_used, comment_count, sentiment_distribution, themes, key_quotes, summary, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [a.topic_id, a.model_used, a.comment_count,
     JSON.stringify(a.sentiment_distribution || {}),
     JSON.stringify(a.themes || []),
     JSON.stringify(a.key_quotes || []),
     a.summary || null, a.notes || null]
  );
  return r.rows[0];
}

async function listAnalyses(topicId) {
  const r = await pool.query(
    'SELECT * FROM analyses WHERE topic_id = $1 ORDER BY run_at DESC',
    [topicId]
  );
  return r.rows;
}

async function insertCommentAnalysis(ca) {
  const r = await pool.query(
    `INSERT INTO comment_analyses (analysis_id, comment_id, sentiment, sentiment_score, tags)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (analysis_id, comment_id) DO NOTHING
     RETURNING *`,
    [ca.analysis_id, ca.comment_id, ca.sentiment, ca.sentiment_score, JSON.stringify(ca.tags || [])]
  );
  return r.rows[0];
}

module.exports = {
  pool,
  createTopic, listTopics, getTopic,
  insertComment, listComments, countComments,
  createAnalysis, listAnalyses,
  insertCommentAnalysis
};
