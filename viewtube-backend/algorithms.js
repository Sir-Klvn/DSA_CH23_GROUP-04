// ============================================================
//  ViewTube DSA Backend — algorithms.js
//  Sorting, searching, scoring, and ranking algorithms
// ============================================================

// ─────────────────────────────────────────────────────────────
// 1. MERGE SORT  O(n log n)
//    Used for: Sorting search results by relevance score
//    Why: Stable sort — preserves original order for equal scores
//         Best general-purpose comparison sort
// ─────────────────────────────────────────────────────────────
function mergeSort(arr, compareFn = (a, b) => a - b) {
  if (arr.length <= 1) return arr;
  const mid   = Math.floor(arr.length / 2);
  const left  = mergeSort(arr.slice(0, mid), compareFn);
  const right = mergeSort(arr.slice(mid), compareFn);
  return _merge(left, right, compareFn);
}

function _merge(left, right, compareFn) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}


// ─────────────────────────────────────────────────────────────
// 2. QUICK SORT  O(n log n) avg, O(n²) worst
//    Used for: Sorting large video lists by views/date
//    Why: Fastest in-place sort for large datasets (cache friendly)
//         Uses median-of-3 pivot to avoid worst case
// ─────────────────────────────────────────────────────────────
function quickSort(arr, compareFn = (a, b) => a - b, lo = 0, hi = arr.length - 1) {
  if (lo < hi) {
    // Use insertion sort for small subarrays (optimization)
    if (hi - lo < 10) {
      for (let i = lo + 1; i <= hi; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= lo && compareFn(arr[j], key) > 0) { arr[j + 1] = arr[j]; j--; }
        arr[j + 1] = key;
      }
      return arr;
    }
    const pivot = _partition(arr, compareFn, lo, hi);
    quickSort(arr, compareFn, lo, pivot - 1);
    quickSort(arr, compareFn, pivot + 1, hi);
  }
  return arr;
}

function _partition(arr, compareFn, lo, hi) {
  // Median-of-3 pivot selection — safe for all sizes >= 3
  const mid = Math.floor((lo + hi) / 2);
  if (compareFn(arr[lo], arr[mid]) > 0) [arr[lo], arr[mid]] = [arr[mid], arr[lo]];
  if (compareFn(arr[lo], arr[hi]) > 0) [arr[lo], arr[hi]] = [arr[hi], arr[lo]];
  if (compareFn(arr[mid], arr[hi]) > 0) [arr[mid], arr[hi]] = [arr[hi], arr[mid]];
  // pivot is now at arr[mid]; move to hi-1 only if there's room
  const pivot = arr[mid];
  if (hi - lo >= 2) {
    [arr[mid], arr[hi - 1]] = [arr[hi - 1], arr[mid]];
    let i = lo, j = hi - 1;
    while (true) {
      while (compareFn(arr[++i], pivot) < 0) {}
      while (j > lo && compareFn(arr[--j], pivot) > 0) {}
      if (i >= j) break;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    [arr[i], arr[hi - 1]] = [arr[hi - 1], arr[i]];
    return i;
  }
  // Only 2 elements — just swap if needed
  if (compareFn(arr[lo], arr[hi]) > 0) [arr[lo], arr[hi]] = [arr[hi], arr[lo]];
  return lo;
}


// ─────────────────────────────────────────────────────────────
// 3. COUNTING SORT  O(n + k)
//    Used for: Sorting videos by star rating (1–5), category buckets
//    Why: Linear time when range k is small — beats comparison sorts
// ─────────────────────────────────────────────────────────────
function countingSort(arr, keyFn = x => x, maxVal = 5) {
  const counts = new Array(maxVal + 1).fill(0);
  arr.forEach(item => counts[keyFn(item)]++);
  // Cumulative counts
  for (let i = 1; i <= maxVal; i++) counts[i] += counts[i - 1];
  const output = new Array(arr.length);
  for (let i = arr.length - 1; i >= 0; i--) {
    const k = keyFn(arr[i]);
    output[--counts[k]] = arr[i];
  }
  return output;
}


// ─────────────────────────────────────────────────────────────
// 4. BINARY SEARCH  O(log n)
//    Used for: Finding a video in sorted lists, date-range queries
//    Why: Eliminates half the search space each step
// ─────────────────────────────────────────────────────────────
function binarySearch(arr, target, compareFn = (a, b) => a - b) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cmp = compareFn(arr[mid], target);
    if      (cmp === 0) return { found: true, index: mid };
    else if (cmp < 0)   lo = mid + 1;
    else                hi = mid - 1;
  }
  return { found: false, index: lo }; // insertion point
}

// Lower bound — first index where arr[i] >= target
function lowerBound(arr, target, keyFn = x => x) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keyFn(arr[mid]) < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Upper bound — first index where arr[i] > target
function upperBound(arr, target, keyFn = x => x) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keyFn(arr[mid]) <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}


// ─────────────────────────────────────────────────────────────
// 5. TRENDING SCORE ALGORITHM
//    Used for: Computing each video's trending rank
//    Why: Inspired by Reddit/HN algorithm — balances recency vs popularity
//         Gravity factor causes scores to decay over time
//
//    Formula:
//      score = (V + C*2 + L*0.5) / (H + 2)^G
//      V = views, C = comments, L = likes, H = hours since upload, G = gravity
// ─────────────────────────────────────────────────────────────
function computeTrendingScore(video, config = {}) {
  const {
    view_velocity = 0.35,
    watch_time = 0.25,
    engagement_rate = 0.20,
    ctr = 0.10,
    freshness_bonus = 0.10
  } = config;

  const V = video.views || 0;
  const C = video.comments || 0;
  const L = video.likes || 0;
  const D = video.dislikes || 0;
  const Sh = video.shares || 0;
  const WT = video.avgWatchTime || 0.3; // default 30%
  const CTR = video.clickThroughRate || 0.05;
  const uploadedAt = new Date(video.uploadedAt || Date.now());
  const ageHours = Math.max(0.1, (Date.now() - uploadedAt.getTime()) / 3_600_000);
  const viewVel = V / ageHours; // views per hour

  const likeRatio = L / Math.max(L + D, 1);
  const engagement = C * 2 + Sh * 3;
  const freshness = Math.max(0, 1 - (Math.log(ageHours + 1) / 10)); // 1 = brand new

  const geoBonus = video.regionConcentration || 0; // 0-1

  const score = viewVel * view_velocity +
                WT * watch_time +
                engagement_rate * (engagement / V || 0) +
                ctr * CTR +
                freshness_bonus * freshness * geoBonus;

  return Math.round(score * 100) / 100;
}


// ─────────────────────────────────────────────────────────────
// 6. TF-IDF SEARCH RELEVANCE  O(n * m)
//    Used for: Full-text search ranking of video titles/descriptions
//    Why: Industry-standard text relevance scoring algorithm
//         TF = how often term appears in doc
//         IDF = how rare the term is across all docs
// ─────────────────────────────────────────────────────────────
function buildTfIdfIndex(documents) {
  const N = documents.length;
  const df = {}; // document frequency per term

  // Step 1: tokenize and compute document frequency
  const tokenized = documents.map(doc => {
    const terms = tokenize(doc.text);
    terms.forEach(t => { df[t] = (df[t] || new Set()); df[t].add(doc.id); });
    return { id: doc.id, terms };
  });

  // Step 2: compute TF-IDF for each doc
  const index = {};
  tokenized.forEach(({ id, terms }) => {
    const tf = {};
    terms.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const maxTf = Math.max(...Object.values(tf));

    index[id] = {};
    Object.entries(tf).forEach(([term, freq]) => {
      const tfNorm  = freq / maxTf;
      const idf     = Math.log((N + 1) / (df[term].size + 1)) + 1;
      index[id][term] = tfNorm * idf;
    });
  });

  return {
    query(queryText, topK = 10) {
      const qTerms = tokenize(queryText);
      const scores = {};
      Object.entries(index).forEach(([docId, termWeights]) => {
        let score = 0;
        qTerms.forEach(term => { score += (termWeights[term] || 0); });
        if (score > 0) scores[docId] = score;
      });
      return Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, topK)
        .map(([id, score]) => ({ id, score: Math.round(score * 1000) / 1000 }));
    }
  };
}

function tokenize(text) {
  const STOP_WORDS = new Set(['a','an','the','in','on','at','to','for','of','and','or','but','is','are','was','were','with','by']);
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}


// ─────────────────────────────────────────────────────────────
// 7. COLLABORATIVE FILTERING (User-Item Matrix)
//    Used for: "Recommended for you" based on similar users
//    Why: Classic recommendation system algorithm
//         Finds users with similar watch history → suggests their videos
// ─────────────────────────────────────────────────────────────
function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    const a = vecA[k] || 0, b = vecB[k] || 0;
    dot  += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function collaborativeFilter(targetUserId, userWatchMap, topK = 6) {
  const targetVec = userWatchMap[targetUserId];
  if (!targetVec) return [];

  // Find most similar users
  const similarities = Object.entries(userWatchMap)
    .filter(([uid]) => uid !== targetUserId)
    .map(([uid, vec]) => ({ uid, sim: cosineSimilarity(targetVec, vec) }))
    .filter(x => x.sim > 0)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 10); // top-10 similar users

  // Aggregate their unwatched videos weighted by similarity
  const scores = {};
  similarities.forEach(({ uid, sim }) => {
    Object.entries(userWatchMap[uid]).forEach(([videoId, rating]) => {
      if (!targetVec[videoId]) { // not yet watched by target
        scores[videoId] = (scores[videoId] || 0) + sim * rating;
      }
    });
  });

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topK)
    .map(([videoId, score]) => ({ videoId, score: Math.round(score * 100) / 100 }));
}


// ─────────────────────────────────────────────────────────────
// 8. LEVENSHTEIN DISTANCE  O(m*n)
//    Used for: Fuzzy search ("did you mean…?"), typo correction
//    Why: Measures edit distance between two strings
//         Finds closest match even with spelling errors
// ─────────────────────────────────────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(query, candidates, threshold = 3, limit = 5) {
  return candidates
    .map(c => ({ candidate: c, distance: levenshtein(query.toLowerCase(), c.toLowerCase()) }))
    .filter(x => x.distance <= threshold)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}


// ─────────────────────────────────────────────────────────────
// 9. DIJKSTRA'S SHORTEST PATH  O((V + E) log V)
//    Used for: Finding the shortest recommendation path between videos
//    Why: Weighted shortest path in the co-watch graph
//         Lower edge weight = stronger relationship between videos
// ─────────────────────────────────────────────────────────────
function dijkstra(graph, startId) {
  const dist = {};
  const prev = {};
  const visited = new Set();
  // MinHeap via sorted array (demo-friendly)
  const pq = [{ id: startId, cost: 0 }];

  for (const node of graph.nodes()) { dist[node] = Infinity; prev[node] = null; }
  dist[startId] = 0;

  while (pq.length) {
    pq.sort((a, b) => a.cost - b.cost);
    const { id: u, cost } = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);

    for (const v of graph.getNeighbors(u)) {
      const w = graph.getWeight(u, v);
      const edgeCost = w > 0 ? 1 / w : Infinity; // invert: higher co-watch = shorter path
      const alt = cost + edgeCost;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
        pq.push({ id: v, cost: alt });
      }
    }
  }

  return {
    distances: dist,
    pathTo(targetId) {
      const path = [];
      let curr = targetId;
      while (curr !== null) { path.unshift(curr); curr = prev[curr]; }
      return path[0] === startId ? path : [];
    }
  };
}


// ─────────────────────────────────────────────────────────────
// 10. SLIDING WINDOW ANALYTICS  O(n)
//     Used for: Real-time view count analytics, peak viewer detection
//     Why: Compute rolling statistics without reprocessing all data
// ─────────────────────────────────────────────────────────────
function slidingWindowMax(viewTimestamps, windowMs = 3_600_000) {
  const windows = {};
  viewTimestamps.forEach(ts => {
    const bucket = Math.floor(ts / windowMs) * windowMs;
    windows[bucket] = (windows[bucket] || 0) + 1;
  });

  const sorted = Object.entries(windows)
    .map(([ts, count]) => ({ timestamp: parseInt(ts), count }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const peak = sorted.reduce((max, w) => w.count > max.count ? w : max, { timestamp: 0, count: 0 });
  const total = sorted.reduce((s, w) => s + w.count, 0);
  const avg = sorted.length ? (total / sorted.length).toFixed(1) : 0;

  return { windows: sorted, peak, total, average: avg };
}

module.exports = {
  mergeSort, quickSort, countingSort,
  binarySearch, lowerBound, upperBound,
  computeTrendingScore,
  buildTfIdfIndex, tokenize,
  collaborativeFilter, cosineSimilarity,
  levenshtein, fuzzyMatch,
  dijkstra,
  slidingWindowMax
};
