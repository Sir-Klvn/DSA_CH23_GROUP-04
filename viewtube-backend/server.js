// ============================================================
 //  ViewTube DSA Backend — server.js
//  Express REST API — every endpoint powered by DSA
// ============================================================

const express = require('express');
const cors    = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const rangeParser = require('range-parser');

const {
  SearchService,
  TrendingService,
  RecommendationService,
  VideoService,
  UserService,
  UploadQueueService
} = require('./services');

// ── Boot all services ────────────────────────────────────────
console.log('\\n🔧  Initializing ViewTube DSA Backend...');
const search  = new SearchService();       console.log('  ✅  SearchService       (Trie + TF-IDF)');
const trending = new TrendingService();    console.log('  ✅  TrendingService      (MaxHeap)');
const recs    = new RecommendationService(); console.log('  ✅  RecommendationService (Graph + DisjointSet)');
const videos  = new VideoService();        console.log('  ✅  VideoService         (HashTable + BST + QuickSort)');
const users   = new UserService();         console.log('  ✅  UserService          (Stack + Queue)');
users.seedNotifications();
const uploads = new UploadQueueService();  console.log('  ✅  UploadQueueService   (Circular Queue)');

 // Seed some uploads
['v_new1','v_new2','v_new3'].forEach((id, i) =>
  uploads.enqueue({ videoId: id, filename: `video_${id}.mp4`, fileSize: 250_000_000 + i * 50_000_000, userId: 'u1' })
);
uploads.processNext();

console.log('\\n🚀  All services ready!\\n');

// ── Express App ──────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001; // Default backend API port

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  const ts = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`  [${ts}] ${req.method.padEnd(6)} ${req.path}`);
  next();
});

// Response envelope
const ok  = (res, data, meta = {}) => res.json({ success: true,  data, ...meta });
const err = (res, msg, status = 400) => res.status(status).json({ success: false, error: msg });

// Video streaming middleware (Range requests for <video> seeking)
app.use('/stream', (req, res, next) => {
  // Normalize path, accounting for route prefix stripping in Express
  let relativePath = req.path;
  if (relativePath.startsWith('/stream/')) {
    relativePath = relativePath.slice('/stream/'.length);
  }
  relativePath = relativePath.replace(/^\/+/, '');

  const filePath = path.join(__dirname, 'uploads/stream', relativePath);
  if (!fs.existsSync(filePath)) return next();

  const fileStat = fs.statSync(filePath);
  if (!fileStat.isFile()) return next();

  if (!req.headers.range) return next();

  const ranges = rangeParser(fileStat.size, req.headers.range, {
    combine: true
  });

  if (ranges === -1) {
    res.status(416);
    res.set({
      'Content-Range': 'bytes */' + fileStat.size
    });
    return res.end();
  }

  if (ranges && ranges.length === 1) {
    const range = ranges[0];
    res.status(206);
    res.set({
      'Content-Range': `bytes ${range.start}-${range.end}/${fileStat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': range.end - range.start + 1,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath, {
      start: range.start,
      end: range.end
    });

    stream.pipe(res);
  } else {
    next();
  }

});

// Static video files
app.use('/stream', express.static(path.join(__dirname, 'uploads/stream')));

// Backward compat: support legacy /viewtube-frontend path and root path
app.use('/viewtube-frontend', express.static(path.join(__dirname, '../viewtube-frontend')));
app.use(express.static(path.join(__dirname, '../viewtube-frontend')));

// ════════════════════════════════════════════════════════════
// ROOT — DSA Architecture overview
// ════════════════════════════════════════════════════════════
app.get('/', (_req, res) => {
  res.json({
    project: 'ViewTube — DSA Demonstration Backend',
    version: '2.0.0',
    architecture: {
      dataStructures: {
        MaxHeap:      'Trending videos — O(log n) insert/extract',
        HashTable:    'O(1) video/user lookup with chaining',
        Trie:         'Search autocomplete — O(L) prefix matching',
        Graph:        'Co-watch recommendations — BFS/DFS/Dijkstra',
        LRUCache:     'Video metadata cache — DoublyLinkedList + HashTable',
        Queue:        'Upload processing — circular buffer FIFO',
        Stack:        'Navigation history — LIFO back/forward',
        BST:          'Date/view range queries — O(log n)',
        DisjointSet:  'Video clustering — Union-Find O(α n)'
      },
      algorithms: {
        MergeSort:    'Stable sort for search results by relevance',
        QuickSort:    'In-place sort for views/date (median-of-3)',
        BinarySearch: 'O(log n) lookup in sorted video lists',
        TF_IDF:       'Text relevance scoring for full-text search',
        Levenshtein:  'Edit distance for fuzzy \"did you mean?\" search',
        TrendingScore:'Time-decay gravity formula (Reddit-style)',
        CollabFilter: 'Cosine similarity — user-based recommendations',
        Dijkstra:     'Shortest recommendation path between videos',
        SlidingWindow:'Real-time view analytics — O(n)'
      }
    },
    endpoints: {
      videos:   ['GET /videos', 'GET /videos/:id', 'GET /videos/category/:cat', 'POST /videos/:id/view', 'POST /videos/:id/like', 'GET /videos/:id/analytics'],
      stream:   ['GET /stream/:videoId_720p.mp4'],
      search:   ['GET /search?q=', 'GET /search/autocomplete?q=', 'GET /search/popular'],
      trending: ['GET /trending', 'GET /trending/score/:id'],
      recs:     ['GET /recommendations/user/:id', 'GET /recommendations/video/:id'],
      users:    ['GET /users/:id', 'POST /users/:id/navigate', 'GET /users/:id/notifications'],
      uploads:  ['POST /upload', 'GET /upload/status'],
      system:   ['GET /system/stats', 'GET /system/dsa-demo']
    }
  });
});

// [All original video, search, trending, recs, users, uploads, system routes unchanged - omitted for brevity in this response but FULLY INCLUDED in actual file]

app.get('/videos', (req, res) => {
  const { sortBy, order, category, limit } = req.query;
  const result = videos.getAll({
    sortBy:   sortBy  || 'trending',
    order:    order   || 'desc',
    category: category || null,
    limit:    parseInt(limit) || 50
  });
  ok(res, result.videos, { total: result.total, sortBy: result.sortBy, cached: result.cached || false });
});

app.get('/videos/categories', (_req, res) => {
  ok(res, videos.getCategories());
});

app.get('/videos/range', (req, res) => {
  const { minViews = 0, maxViews = 100_000_000 } = req.query;
  const result = videos.findByViewRange(parseInt(minViews), parseInt(maxViews));
  ok(res, result, {
    dsa: 'BinarySearch O(log n) on QuickSort-ed array',
    count: result.length
  });
});

app.get('/videos/category/:cat', (req, res) => {
  const result = videos.getByCategory(req.params.cat, parseInt(req.query.limit) || 20);
  ok(res, result, { category: req.params.cat, count: result.length });
});

app.get('/videos/:id', (req, res) => {
  const v = videos.getById(req.params.id);
  if (!v) return err(res, `Video ${req.params.id} not found`, 404);
  ok(res, v, { dsa: 'HashTable O(1) lookup + LRU Cache' });
});

app.post('/videos/:id/view', (req, res) => {
  const updated = videos.recordView(req.params.id, req.body.userId);
  if (!updated) return err(res, 'Video not found', 404);
  trending.refreshScore(req.params.id); // O(log n) heap update
  ok(res, { views: updated.views, trendingScore: trending.scores[req.params.id] }, {
    dsa: 'HashTable update + MaxHeap bubbleUp O(log n)'
  });
});

app.post('/videos/:id/like', (req, res) => {
  const { userId } = req.body;
  if (!userId) return err(res, 'userId required');
  const result = videos.like(req.params.id, userId);
  if (!result) return err(res, 'Video or user not found', 404);
  ok(res, result, { dsa: 'HashTable O(1) set and get' });
});

app.get('/videos/:id/analytics', (req, res) => {
  const result = videos.analytics(req.params.id);
  if (!result) return err(res, 'Video not found', 404);
  ok(res, result, { dsa: 'SlidingWindow O(n) for hourly bucketing' });
});

app.get('/search', (req, res) => {
  const { q, category, sortBy, limit } = req.query;
  if (!q) return err(res, 'Query parameter q is required');
  const result = search.search(q, { category, sortBy, limit: parseInt(limit) || 20 });
  ok(res, result.results, {
    query:   result.query,
    count:   result.count,
    time:    `${result.time}ms`,
    fuzzy:   result.fuzzy,
    dsa:     'Trie prefix match → TF-IDF ranking → MergeSort → Levenshtein fallback'
  });
});

app.get('/search/autocomplete', (req, res) => {
  const { q } = req.query;
  if (!q) return ok(res, []);
  const suggestions = search.autocomplete(q, 8);
  ok(res, suggestions, { dsa: 'Trie O(L + K) where L=prefix length, K=results' });
});

app.get('/search/popular', (_req, res) => {
  const popular = search.popularSearches(10);
  ok(res, popular, { dsa: 'Trie DFS sorted by frequency' });
});

app.get('/search/stats', (_req, res) => {
  ok(res, search.stats());
});

app.get('/trending', (req, res) => {
  const n = parseInt(req.query.limit) || 10;
  const top = trending.getTopTrending(n);
  ok(res, top, {
    dsa:       'MaxHeap topK — O(K log N)',
    algorithm: 'score = (views + comments*2 + likes*1.5) / (hours+2)^1.8',
    stats:     trending.stats()
  });
});

app.get('/trending/score/:id', (req, res) => {
  const v = videos.getById(req.params.id);
  if (!v) return err(res, 'Video not found', 404);
  const score = trending.refreshScore(req.params.id);
  const rank  = trending.getRank(req.params.id);
  ok(res, { videoId: req.params.id, score, rank, video: v }, {
    dsa: 'MaxHeap updatePriority O(log n)'
  });
});

app.post('/trending/refresh', (_req, res) => {
  trending.refreshAll();
  ok(res, trending.getTopTrending(5), { message: 'Trending scores recalculated', dsa: 'O(N log N) heap rebuild' });
});

app.get('/recommendations/user/:id', (req, res) => {
  const recs_result = recs.forUser(req.params.id, parseInt(req.query.limit) || 8);
  ok(res, recs_result, {
    dsa:       'Collaborative Filtering (cosine similarity) + Graph BFS',
    algorithm: 'User-item matrix → cosine sim → top-K unseen videos'
  });
});

app.get('/recommendations/video/:id', (req, res) => {
  const related = recs.relatedTo(req.params.id, parseInt(req.query.limit) || 8);
  ok(res, related, {
    dsa:       'Graph adjacency list — getTopRelated O(E log E)',
    algorithm: 'Co-watch frequency weighted edges → sorted neighbors'
  });
});

app.get('/recommendations/video/:id/deep', (req, res) => {
  const depth = parseInt(req.query.depth) || 3;
  const deep  = recs.deepRecommend(req.params.id, depth, 6);
  ok(res, deep, { dsa: 'Graph DFS — deep exploration O(V+E)' });
});

app.get('/recommendations/path/:from/:to', (req, res) => {
  const result = recs.pathBetween(req.params.from, req.params.to);
  ok(res, result, {
    dsa:       'Dijkstra\'s Shortest Path O((V+E) log V)',
    note:      'Edge weight = inverse of co-watch frequency'
  });
});

app.get('/recommendations/cluster/:id', (req, res) => {
  const cluster = recs.sameCluster(req.params.id, 6);
  ok(res, cluster, { dsa: 'DisjointSet (Union-Find) O(α n) ≈ O(1)' });
});

app.get('/recommendations/stats', (_req, res) => {
  ok(res, recs.stats());
});

app.get('/users/:id', (req, res) => {
  const { db: database } = require('./db');
  const user = database.getUser(req.params.id);
  if (!user) return err(res, 'User not found', 404);
  ok(res, user);
});

app.post('/users/:id/navigate', (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return err(res, 'videoId required');
  const result = users.navigate(req.params.id, videoId);
  ok(res, result, { dsa: 'Stack push O(1)' });
});

app.post('/users/:id/back', (req, res) => {
  const result = users.goBack(req.params.id);
  if (!result) return err(res, 'Nothing to go back to');
  ok(res, result, { dsa: 'Stack pop O(1) — LIFO navigation' });
});

app.post('/users/:id/forward', (req, res) => {
  const result = users.goForward(req.params.id);
  if (!result) return err(res, 'Nothing to go forward to');
  ok(res, result, { dsa: 'Forward stack pop O(1)' });
});

app.get('/users/:id/history', (req, res) => {
  const history = users.getNavHistory(req.params.id);
  ok(res, history, { dsa: 'Stack toArray O(n)' });
});

app.get('/users/:id/notifications', (req, res) => {
  const notifs = users.getNotifications(req.params.id);
  ok(res, notifs, { count: notifs.length, dsa: 'Circular Queue O(1) per item' });
});

app.post('/users/:id/notifications/read', (req, res) => {
  const notif = users.markNotifRead(req.params.id);
  ok(res, notif, { dsa: 'Queue dequeue O(1) — FIFO' });
});

app.post('/upload', (req, res) => {
  const job = uploads.enqueue(req.body);
  ok(res, job, { dsa: 'Queue enqueue O(1) — Circular Buffer' });
});

app.get('/upload/status', (_req, res) => {
  ok(res, uploads.status(), { dsa: 'Queue size O(1)' });
});

app.post('/upload/process-next', (_req, res) => {
  const job = uploads.processNext();
  if (!job) return ok(res, null, { message: 'Queue is empty' });
  ok(res, job, { dsa: 'Queue dequeue O(1) — FIFO processing' });
});

app.post('/upload/:jobId/complete', (req, res) => {
  const success = req.body.success !== false;
  const result  = uploads.completeJob(req.params.jobId, success);
  if (!result) return err(res, 'Job not found');
  ok(res, result);
});

app.get('/system/stats', (_req, res) => {
  const { db: database } = require('./db');
  ok(res, {
    videos:          database.getAllVideos().length,
    users:           database.getAllUsers().length,
    cacheStats:      database.cacheStats(),
    searchStats:     search.stats(),
    trendingStats:   trending.stats(),
    recommendStats:  recs.stats(),
    uploadQueueStats:uploads.status()
  });
});

app.get('/system/cache', (_req, res) => {
  const { db: database } = require('./db');
  ok(res, database.cacheStats(), { dsa: 'LRU Cache — DoublyLinkedList + HashTable O(1) ops' });
});

app.get('/system/dsa-demo', (_req, res) => {
  const { mergeSort: ms, quickSort: qs, binarySearch: bs, levenshtein: lev, computeTrendingScore: cts } = require('./algorithms');
  const { db: database } = require('./db');
  const all = database.getAllVideos();
  const results = {};

  // 1. MergeSort demo
  let t = Date.now();
  const merged = ms([...all], (a, b) => b.views - a.views);
  results.mergeSort = { timeMs: Date.now() - t, top3: merged.slice(0,3).map(v => v.title) };

  // 2. QuickSort demo
  t = Date.now();
  const quicked = qs([...all], (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  results.quickSort = { timeMs: Date.now() - t, top3: quicked.slice(0,3).map(v => v.title) };

  // 3. BinarySearch demo
  t = Date.now();
  const sorted  = qs([...all], (a,b) => a.views - b.views);
  const bsResult= bs(sorted, 4700000, (v, target) => v.views - target);
  results.binarySearch = { timeMs: Date.now() - t, found: bsResult.found, index: bsResult.index };

  // 4. Trie autocomplete demo
  t = Date.now();
  const autoSugg = search.autocomplete('java', 5);
  results.trie = { timeMs: Date.now() - t, query: 'java', suggestions: autoSugg.map(s => s.text) };

  // 5. TF-IDF search demo
  t = Date.now();
  const tfResult = search.search('react javascript tutorial');
  results.tfidf  = { timeMs: tfResult.time, query: 'react javascript tutorial', count: tfResult.count, top3: tfResult.results.slice(0,3).map(v => v.title) };

  // 6. Trending score demo
  t = Date.now();
  const topTrending = trending.getTopTrending(3);
  results.maxHeap = { timeMs: Date.now() - t, top3: topTrending.map(v => ({ title: v.title, score: v.score })) };

  // 7. Levenshtein demo
  t = Date.now();
  const dist = lev('javascript', 'javscript');
  results.levenshtein = { timeMs: Date.now() - t, a: 'javascript', b: 'javscript', distance: dist };

  // 8. Graph recommendation demo
  t = Date.now();
  const graphRecs = recs.relatedTo('v1', 3);
  results.graph = { timeMs: Date.now() - t, for: 'v1', related: graphRecs.map(v => v.title) };

  // 9. Dijkstra demo
  t = Date.now();
  const path = recs.pathBetween('v1', 'v7');
  results.dijkstra = { timeMs: Date.now() - t, from:'v1', to:'v7', pathLength: path.length, path: path.path.map(v => v.title) };

  // 10. LRU Cache demo
  t = Date.now();
  database.getVideo('v1'); database.getVideo('v2'); database.getVideo('v1');
  results.lruCache = { timeMs: Date.now() - t, ...database.cacheStats() };

  ok(res, results, { message: 'All 10 DSA demonstrations completed', dsa: 'Full algorithm benchmark' });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => err(res, `Route ${req.method} ${req.path} not found`, 404));

// ── Start ─────────────────────────────────────────────────────
const requestedPort = Number.isFinite(Number(process.env.PORT)) ? Number(process.env.PORT) : 3001;
const fallbackPorts  = [requestedPort, 3002, 3003, 3004];

function startListening(index = 0) {
  if (index >= fallbackPorts.length) {
    console.error('❌  All ports in fallback list are occupied. Exiting.');
    process.exit(1);
  }

  const activePort = fallbackPorts[index];
  const server = app.listen(activePort, () => {
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║  ViewTube DSA Backend running        ║`);
    console.log(`  ║  http://localhost:${activePort}               ║`);
    console.log(`  ║  GET / for full API reference        ║`);
    console.log(`  ║  /videos/v1 now includes videoUrl!   ║`);
    console.log(`  ║  /stream/v1_720p.mp4 serves videos   ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${activePort} already in use. Trying next port...`);
      startListening(index + 1);
    } else {
      console.error('Unexpected server error:', err);
      process.exit(1);
    }
  });
}

startListening();

module.exports = app;

