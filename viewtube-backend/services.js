// ============================================================
//  ViewTube DSA Backend — services.js
//  Business logic built entirely on our DSA layer
// ============================================================

const { MaxHeap, Trie, Graph, Queue, Stack, DisjointSet, LRUCache } = require('./data-structures');
const {
  mergeSort, quickSort, computeTrendingScore,
  buildTfIdfIndex, tokenize,
  collaborativeFilter, levenshtein, fuzzyMatch,
  dijkstra, slidingWindowMax, binarySearch
} = require('./algorithms');
const { db } = require('./db');

// ════════════════════════════════════════════════════════════
// SERVICE 1: SEARCH SERVICE
// Data Structure : Trie + HashTable + TF-IDF index
// Algorithms     : Trie prefix search, TF-IDF ranking, Levenshtein fuzzy match
// ════════════════════════════════════════════════════════════
class SearchService {
  constructor() {
    this.trie = new Trie();
    this.tfidf = null;
    this.queryLog = [];
    this._build();   // this will do all inserting
  }

  _build() {
    const videos = db.getAllVideos();

    // Insert every title word + all tags into Trie
    videos.forEach(v => {
      // Title words
      tokenize(v.title).forEach(word => this.trie.insert(word, v.id));
      // Full title as one phrase
      this.trie.insert(v.title.toLowerCase(), v.id);
      // Tags
      (v.tags || []).forEach(tag => this.trie.insert(tag, v.id));
      // Channel name
      tokenize(v.channel).forEach(word => this.trie.insert(word, v.id));
    });

    // Build TF-IDF index on titles + descriptions
    this.tfidf = buildTfIdfIndex(
      videos.map(v => ({
        id: v.id,
        text: `${v.title} ${v.description || ''} ${(v.tags || []).join(' ')} ${v.channel}`
      }))
    );
  }

  // Autocomplete suggestions as user types
  autocomplete(prefix, limit = 8) {
    if (!prefix || prefix.length < 1) return [];
    const suggestions = this.trie.search(prefix, limit);
    return suggestions.map(s => ({
      text: s.word,
      frequency: s.frequency,
      videoCount: s.videoIds.length
    }));
  }

  // Full search with TF-IDF ranking + fuzzy fallback
  search(query, options = {}) {
    const { category, sortBy = 'relevance', limit = 20 } = options;
    const startTime = Date.now();

    if (!query || query.trim().length === 0) return { results: [], query, time: 0 };

    // Log search
    this.trie.insert(query.toLowerCase());
    this.queryLog.push({ query, timestamp: Date.now() });

    // Step 1: TF-IDF ranked results
    const ranked = this.tfidf.query(query, 50);

    // Step 2: Hydrate with full video data
    let results = ranked
      .map(({ id, score }) => {
        const v = db.getVideo(id);
        return v ? { ...v, relevanceScore: score } : null;
      })
      .filter(Boolean);

    // Step 3: Category filter
    if (category && category !== 'all') {
      results = results.filter(v => v.category === category);
    }

    // Step 4: Fuzzy fallback if no TF-IDF results
    if (results.length === 0) {
      const allTitles = db.getAllVideos().map(v => ({ id: v.id, title: v.title }));
      const fuzzy = fuzzyMatch(query, allTitles.map(v => v.title), 4, 5);
      results = fuzzy.map(f => {
        const match = allTitles.find(v => v.title === f.candidate);
        return match ? { ...db.getVideo(match.id), relevanceScore: 1 / (f.distance + 1), fuzzy: true } : null;
      }).filter(Boolean);
    }

    // Step 5: Secondary sort
    if (sortBy === 'views')    results = quickSort(results, (a, b) => b.views - a.views);
    else if (sortBy === 'date') results = quickSort(results, (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    else results = mergeSort(results, (a, b) => b.relevanceScore - a.relevanceScore);

    return {
      results: results.slice(0, limit),
      query,
      count: results.length,
      time: Date.now() - startTime,
      fuzzy: results.some(r => r.fuzzy)
    };
  }

  // Popular search terms from Trie
  popularSearches(limit = 10) {
    return this.trie.search('', limit)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  stats() {
    return {
      totalSearches: this.trie.totalSearches,
      uniqueTerms: this.queryLog.length,
      recentQueries: this.queryLog.slice(-10).map(q => q.query)
    };
  }
}


// ════════════════════════════════════════════════════════════
// SERVICE 2: TRENDING SERVICE
// Data Structure : MaxHeap
// Algorithm      : Trending Score (time-decay gravity formula)
// ════════════════════════════════════════════════════════════
class TrendingService {
  constructor() {
    this.heap        = new MaxHeap((a, b) => a.score - b.score);
    this.scores      = {};
    this._lastUpdate = 0;
    this._build();
  }

  _build() {
    db.getAllVideos().forEach(v => {
      const score = computeTrendingScore(v);
      this.scores[v.id] = score;
      this.heap.insert({ id: v.id, title: v.title, score, thumbnail: v.thumbnail, channel: v.channel, views: v.views });
    });
    this._lastUpdate = Date.now();
  }

  // Get top-N trending videos
  getTopTrending(n = 10) {
    return this.heap.topK(n).map((item, rank) => ({ ...item, rank: rank + 1 }));
  }

  // Recalculate score when engagement changes (O log n)
  refreshScore(videoId) {
    const v = db.getVideo(videoId);
    if (!v) return null;
    const newScore = computeTrendingScore(v);
    this.scores[videoId] = newScore;
    this.heap.updatePriority(item => item.id === videoId, newScore);
    return newScore;
  }

  // Refresh all scores (called periodically)
  refreshAll() {
    // Rebuild heap with fresh scores
    this.heap = new MaxHeap((a, b) => a.score - b.score);
    db.getAllVideos().forEach(v => {
      const score = computeTrendingScore(v);
      this.scores[v.id] = score;
      this.heap.insert({ id: v.id, title: v.title, score, thumbnail: v.thumbnail, channel: v.channel, views: v.views });
    });
    this._lastUpdate = Date.now();
  }

  getRank(videoId) {
    const sorted = this.heap.toSortedArray();
    return sorted.findIndex(item => item.id === videoId) + 1;
  }

  stats() {
    return {
      totalVideos: this.heap.size(),
      lastUpdated: new Date(this._lastUpdate).toISOString(),
      topVideo: this.heap.peek()
    };
  }
}


// ════════════════════════════════════════════════════════════
// SERVICE 3: RECOMMENDATION SERVICE
// Data Structure : Graph (directed, weighted) + DisjointSet
// Algorithms     : Collaborative filtering, Dijkstra, BFS/DFS
// ════════════════════════════════════════════════════════════
class RecommendationService {
  constructor() {
    this.coWatchGraph  = new Graph(false); // undirected co-watch graph
    this.userWatchMap  = {};               // userId → { videoId: watchCount }
    this.videoCluster  = new DisjointSet();
    this._build();
  }

  _build() {
    const users = db.getAllUsers();

    // Build co-watch graph: if user watched A and B, add edge A→B
    users.forEach(user => {
      const history = user.watchHistory || [];
      this.userWatchMap[user.id] = {};

      history.forEach((vid, i) => {
        this.coWatchGraph.addNode(vid);
        this.videoCluster.makeSet(vid);
        this.userWatchMap[user.id][vid] = (this.userWatchMap[user.id][vid] || 0) + 1;

        // Connect to all other videos this user watched (weighted by proximity)
        for (let j = i + 1; j < history.length; j++) {
          const weight = Math.max(1, history.length - Math.abs(i - j)); // closer = stronger
          this.coWatchGraph.addEdge(vid, history[j], weight);
          this.videoCluster.union(vid, history[j]);
        }
      });
    });

    // Add all videos as nodes (even unwatched ones)
    db.getAllVideos().forEach(v => {
      this.coWatchGraph.addNode(v.id);
      this.videoCluster.makeSet(v.id);
    });
  }

  // Recommend based on what similar users watched
  forUser(userId, limit = 8) {
    const user = db.getUser(userId);
    if (!user) return this.popular(limit);

    const collab = collaborativeFilter(userId, this.userWatchMap, limit * 2);
    const watchedSet = new Set(user.watchHistory || []);

    // Filter already watched, hydrate
    const results = collab
      .filter(({ videoId }) => !watchedSet.has(videoId))
      .map(({ videoId, score }) => {
        const v = db.getVideo(videoId);
        return v ? { ...v, recommendScore: score, reason: 'collaborative' } : null;
      })
      .filter(Boolean);

    // Pad with graph-based if not enough
    if (results.length < limit) {
      const graphBased = this._graphRecommend(user.watchHistory || [], watchedSet, limit - results.length);
      results.push(...graphBased);
    }

    return results.slice(0, limit);
  }

  // Find related videos using co-watch graph (BFS from video)
  relatedTo(videoId, limit = 8) {
    const related = this.coWatchGraph.getTopRelated(videoId, limit * 2);
    return related
      .map(({ id, weight }) => {
        const v = db.getVideo(id);
        return v ? { ...v, coWatchCount: weight, reason: 'co-watch' } : null;
      })
      .filter(Boolean)
      .slice(0, limit);
  }

  // DFS-based deep exploration for "rabbit hole" recommendations
  deepRecommend(videoId, depth = 3, limit = 6) {
    const order = this.coWatchGraph.dfs(videoId);
    return order
      .slice(1, limit + 1) // skip self
      .map(id => db.getVideo(id))
      .filter(Boolean)
      .map(v => ({ ...v, reason: 'deep-explore' }));
  }

  // Shortest path between two videos in recommendation graph
  pathBetween(fromId, toId) {
    const result = dijkstra(this.coWatchGraph, fromId);
    const path = result.pathTo(toId);
    return {
      path: path.map(id => db.getVideo(id)).filter(Boolean),
      length: path.length,
      found: path.length > 0
    };
  }

  // Videos in same cluster (DisjointSet)
  sameCluster(videoId, limit = 6) {
    const components = this.videoCluster.allComponents();
    const myCluster = components.find(c => c.includes(videoId)) || [];
    return myCluster
      .filter(id => id !== videoId)
      .slice(0, limit)
      .map(id => db.getVideo(id))
      .filter(Boolean);
  }

  _graphRecommend(history, watchedSet, limit) {
    const candidates = new Map(); // videoId → score
    history.slice(-5).forEach(vid => { // focus on recent
      this.coWatchGraph.getTopRelated(vid, 10).forEach(({ id, weight }) => {
        if (!watchedSet.has(id)) candidates.set(id, (candidates.get(id) || 0) + weight);
      });
    });
    return [...candidates.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => {
        const v = db.getVideo(id);
        return v ? { ...v, reason: 'graph-based' } : null;
      })
      .filter(Boolean);
  }

  popular(limit = 8) {
    return mergeSort(db.getAllVideos(), (a, b) => b.views - a.views).slice(0, limit);
  }

  stats() {
    return {
      nodes: this.coWatchGraph.nodeCount,
      edges: this.coWatchGraph.edgeCount,
      clusters: this.videoCluster.allComponents().length,
      users: Object.keys(this.userWatchMap).length
    };
  }
}


// ════════════════════════════════════════════════════════════
// SERVICE 4: VIDEO SERVICE
// Data Structure : HashTable (videos), BST (sorted indexes)
// Algorithms     : MergeSort, QuickSort, BinarySearch, CountingSort
// ════════════════════════════════════════════════════════════
class VideoService {
  constructor() {
    this._sortCache = new LRUCache(20); // cache sort results
  }

  getById(id) {
    return db.getVideo(id);
  }

  // Get all videos, sorted by field
  getAll(options = {}) {
    const { sortBy = 'trending', order = 'desc', category, limit = 50 } = options;
    const cacheKey = `${sortBy}:${order}:${category || 'all'}:${limit}`;
    const cached = this._sortCache.get(cacheKey);
    if (cached) return { ...cached, cached: true };

    let videos = db.getAllVideos();
    if (category && category !== 'all') videos = videos.filter(v => v.category === category);

    const dir = order === 'desc' ? -1 : 1;
    let sorted;

    switch (sortBy) {
      case 'views':
        // QuickSort for numeric fields on large lists
        sorted = quickSort([...videos], (a, b) => dir * (b.views - a.views));
        break;
      case 'date':
        sorted = quickSort([...videos], (a, b) => dir * (new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        break;
      case 'likes':
        sorted = quickSort([...videos], (a, b) => dir * (b.likes - a.likes));
        break;
      case 'title':
        // MergeSort for string comparison (stable sort preserves ties)
        sorted = mergeSort([...videos], (a, b) => dir * a.title.localeCompare(b.title));
        break;
      case 'trending':
      default:
        sorted = mergeSort([...videos], (a, b) => dir * (computeTrendingScore(b) - computeTrendingScore(a)));
    }

    const result = { videos: sorted.slice(0, limit), total: sorted.length, sortBy, order };
    this._sortCache.put(cacheKey, result);
    return result;
  }

  // Binary search in sorted-by-views list
  findByViewRange(minViews, maxViews) {
    const all = quickSort(db.getAllVideos(), (a, b) => a.views - b.views);
    const lo  = binarySearch(all, minViews, (v, target) => v.views - target).index;
    const hi  = binarySearch(all, maxViews, (v, target) => v.views - target).index;
    return all.slice(lo, hi + 1);
  }

  // Increment view count and update DB
  recordView(videoId, userId = null) {
    const v = db.getVideo(videoId);
    if (!v) return null;
    v.views++;
    db.updateVideo(videoId, { views: v.views });

    if (userId) {
      const user = db.getUser(userId);
      if (user && !user.watchHistory.includes(videoId)) {
        user.watchHistory.push(videoId);
      }
    }
    return v;
  }

  like(videoId, userId) {
    const v = db.getVideo(videoId);
    const u = db.getUser(userId);
    if (!v || !u) return null;
    if (!u.liked.includes(videoId)) {
      u.liked.push(videoId);
      v.likes++;
      db.updateVideo(videoId, { likes: v.likes });
    }
    return { likes: v.likes };
  }

  getByCategory(category, limit = 20) {
    const videos = db.getAllVideos().filter(v => v.category === category);
    return mergeSort(videos, (a, b) => b.views - a.views).slice(0, limit);
  }

  getCategories() {
    const cats = {};
    db.getAllVideos().forEach(v => { cats[v.category] = (cats[v.category] || 0) + 1; });
    return Object.entries(cats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Analytics: view distribution
  analytics(videoId) {
    const v = db.getVideo(videoId);
    if (!v) return null;
    // Simulate view timestamps
    const now = Date.now();
    const timestamps = Array.from({ length: Math.min(v.views, 1000) }, (_, i) =>
      now - Math.random() * 7 * 24 * 3_600_000
    );
    return {
      video: v,
      analytics: slidingWindowMax(timestamps, 3_600_000), // hourly windows
      engagement: {
        likeRatio: ((v.likes / Math.max(v.views, 1)) * 100).toFixed(2) + '%',
        commentRatio: ((v.comments / Math.max(v.views, 1)) * 100).toFixed(4) + '%'
      }
    };
  }
}


// ════════════════════════════════════════════════════════════
// SERVICE 5: USER / SESSION SERVICE
// Data Structure : Stack (navigation), Queue (notifications), HashTable (sessions)
// ════════════════════════════════════════════════════════════
class UserService {
  constructor() {
    this.navStacks    = {};  // userId → Stack (back/forward history)
    this.fwdStacks    = {};  // userId → Stack (forward stack)
    this.notifQueues  = {};  // userId → Queue
    this.sessions     = new LRUCache(200);
  }

  // Navigation — Stack (LIFO)
  navigate(userId, videoId) {
    if (!this.navStacks[userId]) {
      this.navStacks[userId] = new Stack();
      this.fwdStacks[userId] = new Stack();
    }
    this.navStacks[userId].push(videoId);
    this.fwdStacks[userId].clear(); // clear forward on new nav
    return { current: videoId, canGoBack: this.navStacks[userId].size() > 1 };
  }

  goBack(userId) {
    const nav = this.navStacks[userId];
    const fwd = this.fwdStacks[userId];
    if (!nav || nav.size() <= 1) return null;
    const current = nav.pop();
    fwd.push(current);
    return { previous: nav.peek(), forward: current };
  }

  goForward(userId) {
    const nav = this.navStacks[userId];
    const fwd = this.fwdStacks[userId];
    if (!fwd || fwd.isEmpty()) return null;
    const next = fwd.pop();
    nav.push(next);
    return { current: next };
  }

  getNavHistory(userId) {
    return this.navStacks[userId]?.toArray() || [];
  }

  // Notifications — Queue (FIFO)
  addNotification(userId, notification) {
    if (!this.notifQueues[userId]) this.notifQueues[userId] = new Queue(100);
    try {
      this.notifQueues[userId].enqueue({
        ...notification,
        id: `n_${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false
      });
    } catch { /* queue full — drop oldest, retry */
      this.notifQueues[userId].dequeue();
      this.notifQueues[userId].enqueue(notification);
    }
  }

  getNotifications(userId) {
    const q = this.notifQueues[userId];
    return q ? q.toArray() : [];
  }

  markNotifRead(userId) {
    const q = this.notifQueues[userId];
    return q ? q.dequeue() : null;
  }

  // Session management
  createSession(userId) {
    const token = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.sessions.put(token, { userId, createdAt: Date.now(), token });
    return token;
  }

  getSession(token) { return this.sessions.get(token); }

  // Seed some notifications
  seedNotifications() {
    const notifs = [
      { userId:'u1', message:'TechWorld uploaded a new video!', type:'upload',  videoId:'v2' },
      { userId:'u1', message:'GamingLore is live right now!',   type:'live',    videoId:'v5' },
      { userId:'u2', message:'CodeWithMe posted: React Hooks',   type:'upload',  videoId:'v1' },
      { userId:'u3', message:'ChillVibes started a live stream', type:'live',    videoId:'v3' },
    ];
    notifs.forEach(n => this.addNotification(n.userId, n));
  }
}


// ════════════════════════════════════════════════════════════
// SERVICE 6: UPLOAD QUEUE SERVICE
// Data Structure : Queue (circular buffer)
// Why: FIFO processing — videos uploaded first are processed first
// ════════════════════════════════════════════════════════════
class UploadQueueService {
  constructor() {
    this.queue      = new Queue(500);
    this.processing = new Queue(10);
    this.done       = [];
    this.failed     = [];
    this._jobId     = 1;
  }

  enqueue(upload) {
    const job = {
      jobId:     `job_${this._jobId++}`,
      videoId:   upload.videoId,
      filename:  upload.filename,
      fileSize:  upload.fileSize,
      userId:    upload.userId,
      status:    'queued',
      queuedAt:  new Date().toISOString(),
      position:  this.queue.size() + 1
    };
    this.queue.enqueue(job);
    return job;
  }

  // Process next item in queue
  processNext() {
    if (this.queue.isEmpty()) return null;
    const job = this.queue.dequeue();
    job.status = 'processing';
    job.startedAt = new Date().toISOString();
    this.processing.enqueue(job);
    return job;
  }

  completeJob(jobId, success = true) {
    const jobs = this.processing.toArray();
    const job  = jobs.find(j => j.jobId === jobId);
    if (!job) return null;
    job.status      = success ? 'done' : 'failed';
    job.completedAt = new Date().toISOString();
    if (success) this.done.push(job);
    else this.failed.push(job);
    // Drain processing queue up to this job
    while (!this.processing.isEmpty() && this.processing.peek().jobId !== jobId) {
      this.processing.dequeue();
    }
    if (!this.processing.isEmpty()) this.processing.dequeue();
    return job;
  }

  status() {
    return {
      queued:     this.queue.size(),
      processing: this.processing.size(),
      completed:  this.done.length,
      failed:     this.failed.length,
      queue:      this.queue.toArray()
    };
  }
}

module.exports = { SearchService, TrendingService, RecommendationService, VideoService, UserService, UploadQueueService };
