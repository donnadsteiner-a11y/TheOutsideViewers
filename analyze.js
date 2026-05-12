// analysis/analyze.js
// Two-pass Claude analysis pipeline.
//   Pass 1: Haiku per-comment sentiment tagging (cheap, fast, in batches of ~50)
//   Pass 2: Sonnet theme synthesis + representative-quote selection over the tagged set
//
// WEEKEND 2 BUILD — this is a stub. Architecture is below.

const db = require('../db');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-6';

async function runAnalysis(topicId) {
  throw new Error('Not implemented yet — Weekend 2 build. See file for architecture.');

  /* ARCHITECTURE NOTES:

  1. Load comments
     const comments = await db.listComments(topicId, 5000);
     if (comments.length === 0) throw new Error('No comments to analyze');

  2. Create analysis row up front (so we can attach comment_analyses to it)
     const analysis = await db.createAnalysis({
       topic_id: topicId,
       model_used: `${HAIKU_MODEL}+${SONNET_MODEL}`,
       comment_count: comments.length
     });

  3. PASS 1 — Haiku per-comment sentiment, in batches of 50
     for each batch:
       call Claude API with system prompt:
         "For each comment, return JSON: {id, sentiment, score, tags}
          sentiment ∈ {positive, negative, mixed, neutral}
          score: -1.0 (most negative) to 1.0 (most positive)
          tags: 1-3 short theme labels"
       parse JSON response
       insertCommentAnalysis() for each row

  4. PASS 2 — Sonnet synthesis
     Aggregate sentiment distribution from comment_analyses
     Pull top-tagged comments + high-like comments as sample
     Call Sonnet with system prompt:
        "Given this sample of comments and sentiment distribution,
         identify 5-8 dominant themes. For each, give a label, a one-sentence
         summary, an estimated weight, and 2-3 example comment IDs.
         Then select 10-15 representative quotes that best capture the
         range of opinion — not just the loudest. Return structured JSON."

  5. Update analysis row with sentiment_distribution, themes, key_quotes, summary

  6. Return analysis row

  COST ESTIMATE:
    5,000 comments × ~50 tokens each = 250K input tokens to Haiku
    Plus Sonnet synthesis pass ~30K tokens in + 5K out
    ≈ $3-8 per run depending on token mix
  */
}

module.exports = { runAnalysis };
