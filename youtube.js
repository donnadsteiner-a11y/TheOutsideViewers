// fetchers/youtube.js — YouTube Data API v3 comment fetcher
const db = require('../db');

const YT_KEY = process.env.YOUTUBE_API_KEY;
const BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetch up to `maxComments` top-level comments from a YouTube video and
 * store them under the given topicId. Idempotent: re-running won't duplicate.
 *
 * Quota cost: 1 unit per commentThreads.list call (100 comments per call).
 * Free daily quota is 10,000 units = ~1M comments/day. You're fine.
 */
async function fetchYouTubeComments(topicId, videoId, maxComments = 1000) {
  if (!YT_KEY) throw new Error('YOUTUBE_API_KEY not set in .env');

  // Get video title for context
  const videoRes = await fetch(`${BASE}/videos?part=snippet&id=${videoId}&key=${YT_KEY}`);
  if (!videoRes.ok) throw new Error(`YT video lookup failed: ${videoRes.status}`);
  const videoData = await videoRes.json();
  const videoTitle = videoData.items?.[0]?.snippet?.title || '(unknown video)';

  let pageToken = null;
  let fetched = 0;
  let inserted = 0;
  let pages = 0;

  do {
    const url = new URL(`${BASE}/commentThreads`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('videoId', videoId);
    url.searchParams.set('maxResults', '100');
    url.searchParams.set('order', 'relevance');
    url.searchParams.set('key', YT_KEY);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`YouTube API error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    pages++;

    for (const item of data.items || []) {
      const top = item.snippet.topLevelComment.snippet;
      const result = await db.insertComment({
        topic_id: topicId,
        source: 'youtube',
        source_comment_id: item.snippet.topLevelComment.id,
        source_parent_id: videoId,
        source_parent_title: videoTitle,
        author: top.authorDisplayName,
        text: top.textOriginal,
        like_count: top.likeCount,
        reply_count: item.snippet.totalReplyCount,
        published_at: top.publishedAt
      });
      if (result) inserted++;
      fetched++;
      if (fetched >= maxComments) break;
    }

    pageToken = data.nextPageToken;
  } while (pageToken && fetched < maxComments);

  return { videoTitle, pages, fetched, inserted, skipped_as_duplicates: fetched - inserted };
}

module.exports = { fetchYouTubeComments };
