// server.js — TheOutsideViewers sentiment pipeline
require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const { fetchYouTubeComments } = require('./fetchers/youtube');
const { runAnalysis } = require('./analysis/analyze');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Topics ---
app.get('/api/topics', async (req, res) => {
  try {
    res.json(await db.listTopics());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/topics', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    res.json(await db.createTopic(name, description));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Ingestion ---
app.post('/api/topics/:id/fetch-youtube', async (req, res) => {
  try {
    const { id } = req.params;
    const { videoId, maxComments = 1000 } = req.body;
    if (!videoId) return res.status(400).json({ error: 'videoId required' });
    res.json(await fetchYouTubeComments(id, videoId, maxComments));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// --- Comments ---
app.get('/api/topics/:id/comments', async (req, res) => {
  try {
    res.json(await db.listComments(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Analysis (Weekend 2 build) ---
app.post('/api/topics/:id/analyze', async (req, res) => {
  try {
    res.json(await runAnalysis(req.params.id));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/topics/:id/analyses', async (req, res) => {
  try {
    res.json(await db.listAnalyses(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TheOutsideViewers pipeline running on port ${PORT}`));
