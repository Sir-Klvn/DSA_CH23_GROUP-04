// ============================================================
//  ViewTube DSA Backend — data-structures.js
//  All core data structures used across the platform
// ============================================================

// ─────────────────────────────────────────────────────────────
// 1. MAX-HEAP
//    Used for: Trending videos (O(log n) insert/extract-max)
//    Why: Efficiently maintain top-K trending videos at all times
// ─────────────────────────────────────────────────────────────
class MaxHeap {
  constructor(compareFn) {
    this.heap = [];
    this.compare = compareFn || ((a, b) => a.score - b.score);
  }

  size() { return this.heap.length; }
  isEmpty() { return this.heap.length === 0; }
  peek() { return this.heap[0] || null; }

  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i)   { return 2 * i + 1; }
  _right(i)  { return 2 * i + 2; }
  _swap(i, j) { [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]; }

  insert(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  extractMax() {
    if (this.isEmpty()) return null;
    const max = this.heap[0];
    const last = this.heap.pop();
    if (!this.isEmpty()) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return max;
  }

  // Update a node's priority (used when view count changes)
  updatePriority(predicate, newScore) {
    const idx = this.heap.findIndex(predicate);
    if (idx === -1) return false;
    this.heap[idx].score = newScore;
    this._bubbleUp(idx);
    this._sinkDown(idx);
    return true;
  }

  // Get top-K without destroying heap
  topK(k) {
    const result = [];
    const tempHeap = new MaxHeap(this.compare);
    tempHeap.heap = [...this.heap];
    const limit = Math.min(k, this.size());
    for (let i = 0; i < limit; i++) {
      result.push(tempHeap.extractMax());
    }
    return result;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const p = this._parent(i);
      if (this.compare(this.heap[i], this.heap[p]) > 0) {
        this._swap(i, p);
        i = p;
      } else break;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const l = this._left(i);
      const r = this._right(i);
      if (l < n && this.compare(this.heap[l], this.heap[largest]) > 0) largest = l;
      if (r < n && this.compare(this.heap[r], this.heap[largest]) > 0) largest = r;
      if (largest !== i) { this._swap(i, largest); i = largest; }
      else break;
    }
  }

  toSortedArray() {
    const arr = [];
    const clone = new MaxHeap(this.compare);
    clone.heap = [...this.heap];
    while (!clone.isEmpty()) arr.push(clone.extractMax());
    return arr;
  }
}


// ─────────────────────────────────────────────────────────────
// 2. HASH TABLE (with chaining for collision resolution)
//    Used for: O(1) video lookup, user sessions, watch history
//    Why: Fastest possible retrieval by key (id, username, etc.)
// ─────────────────────────────────────────────────────────────
class HashTable {
  constructor(size = 64) {
    this.size = size;
    this.buckets = new Array(size).fill(null).map(() => []);
    this.count = 0;
    this._LOAD_FACTOR = 0.75;
  }

  _hash(key) {
    const str = String(key);
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
      hash = hash & 0x7fffffff; // keep positive 32-bit
    }
    return hash % this.size;
  }

  set(key, value) {
    if (this.count / this.size > this._LOAD_FACTOR) this._resize();
    const idx = this._hash(key);
    const bucket = this.buckets[idx];
    const existing = bucket.find(([k]) => k === key);
    if (existing) { existing[1] = value; }
    else { bucket.push([key, value]); this.count++; }
  }

  get(key) {
    const idx = this._hash(key);
    const entry = this.buckets[idx].find(([k]) => k === key);
    return entry ? entry[1] : undefined;
  }

  has(key) { return this.get(key) !== undefined; }

  delete(key) {
    const idx = this._hash(key);
    const bucket = this.buckets[idx];
    const i = bucket.findIndex(([k]) => k === key);
    if (i !== -1) { bucket.splice(i, 1); this.count--; return true; }
    return false;
  }

  keys()   { return this.buckets.flat().map(([k]) => k); }
  values() { return this.buckets.flat().map(([, v]) => v); }
  entries(){ return this.buckets.flat(); }

  _resize() {
    const old = this.buckets.flat();
    this.size *= 2;
    this.buckets = new Array(this.size).fill(null).map(() => []);
    this.count = 0;
    old.forEach(([k, v]) => this.set(k, v));
  }
}


// ─────────────────────────────────────────────────────────────
// 3. TRIE (Prefix Tree)
//    Used for: Search autocomplete (O(L) where L = query length)
//    Why: Fastest prefix matching structure for type-ahead search
// ─────────────────────────────────────────────────────────────
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
    this.videoIds = [];  // which videos match this prefix
    this.frequency = 0; // how often this term was searched
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.totalSearches = 0;
  }

  insert(word, videoId = null) {
    let node = this.root;
    const w = word.toLowerCase().trim();
    for (const ch of w) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
      if (videoId && !node.videoIds.includes(videoId)) {
        node.videoIds.push(videoId);
      }
    }
    node.isEnd = true;
    node.frequency++;
    this.totalSearches++;
  }

  // Returns all words with given prefix + their frequencies
  search(prefix, limit = 8) {
    let node = this.root;
    const p = prefix.toLowerCase().trim();
    for (const ch of p) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }
    const results = [];
    this._dfs(node, p, results);
    // Sort by frequency descending
    results.sort((a, b) => b.frequency - a.frequency);
    return results.slice(0, limit);
  }

  _dfs(node, prefix, results) {
    if (node.isEnd) results.push({ word: prefix, frequency: node.frequency, videoIds: node.videoIds });
    for (const [ch, child] of Object.entries(node.children)) {
      this._dfs(child, prefix + ch, results);
    }
  }

  // Returns videoIds whose title/tags contain the prefix
  getVideoIds(prefix, limit = 20) {
    let node = this.root;
    const p = prefix.toLowerCase().trim();
    for (const ch of p) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }
    const ids = new Set();
    const collect = (n) => {
      n.videoIds.forEach(id => ids.add(id));
      for (const child of Object.values(n.children)) collect(child);
    };
    collect(node);
    return [...ids].slice(0, limit);
  }

  delete(word) {
    this._deleteHelper(this.root, word.toLowerCase(), 0);
  }

  _deleteHelper(node, word, depth) {
    if (!node) return false;
    if (depth === word.length) {
      if (!node.isEnd) return false;
      node.isEnd = false;
      return Object.keys(node.children).length === 0;
    }
    const ch = word[depth];
    if (!node.children[ch]) return false;
    const shouldDelete = this._deleteHelper(node.children[ch], word, depth + 1);
    if (shouldDelete) { delete node.children[ch]; return !node.isEnd && Object.keys(node.children).length === 0; }
    return false;
  }
}


// ─────────────────────────────────────────────────────────────
// 4. DOUBLY LINKED LIST
//    Used for: LRU Cache (combined with HashTable for O(1) ops)
//    Why: O(1) insert/delete at any position when node is known
// ─────────────────────────────────────────────────────────────
class DLLNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
    this.accessTime = Date.now();
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = new DLLNode('HEAD', null); // sentinel
    this.tail = new DLLNode('TAIL', null); // sentinel
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
  }

  addToFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
    this.size++;
  }

  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    this.size--;
    return node;
  }

  removeLast() {
    if (this.tail.prev === this.head) return null;
    return this.remove(this.tail.prev);
  }

  moveToFront(node) {
    this.remove(node);
    this.size++;
    this.addToFront(node);
    this.size--;
  }

  toArray() {
    const arr = [];
    let curr = this.head.next;
    while (curr !== this.tail) { arr.push({ key: curr.key, value: curr.value }); curr = curr.next; }
    return arr;
  }
}


// ─────────────────────────────────────────────────────────────
// 5. LRU CACHE (Doubly Linked List + Hash Table)
//    Used for: Video metadata cache, thumbnail cache
//    O(1) get and put — most recently used stays, old evicted
// ─────────────────────────────────────────────────────────────
class LRUCache {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.map = new HashTable(capacity * 2);
    this.list = new DoublyLinkedList();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const node = this.map.get(key);
    if (!node) { this.misses++; return null; }
    this.list.moveToFront(node);
    node.accessTime = Date.now();
    this.hits++;
    return node.value;
  }

  put(key, value) {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.list.moveToFront(existing);
      return;
    }
    if (this.list.size >= this.capacity) {
      const evicted = this.list.removeLast();
      if (evicted) this.map.delete(evicted.key);
    }
    const node = new DLLNode(key, value);
    this.list.addToFront(node);
    this.map.set(key, node);
  }

  has(key) { return this.map.has(key); }
  hitRate() { const t = this.hits + this.misses; return t ? ((this.hits / t) * 100).toFixed(1) + '%' : '0%'; }
  size() { return this.list.size; }

  stats() {
    return { size: this.size(), capacity: this.capacity, hits: this.hits, misses: this.misses, hitRate: this.hitRate() };
  }
}


// ─────────────────────────────────────────────────────────────
// 6. GRAPH (Adjacency List — Directed)
//    Used for: "Users who watched X also watched Y" recommendations
//    Why: Models relationships between videos/users naturally
// ─────────────────────────────────────────────────────────────
class Graph {
  constructor(directed = true) {
    this.adjacency = new HashTable();
    this.weights    = new HashTable();
    this.directed   = directed;
    this.nodeCount  = 0;
    this.edgeCount  = 0;
  }

  addNode(id, data = {}) {
    if (!this.adjacency.has(id)) {
      this.adjacency.set(id, []);
      this.weights.set(id, {});
      this.nodeCount++;
    }
    return this;
  }

  addEdge(from, to, weight = 1) {
    this.addNode(from); this.addNode(to);
    const neighbors = this.adjacency.get(from);
    if (!neighbors.includes(to)) { neighbors.push(to); this.edgeCount++; }
    const w = this.weights.get(from);
    w[to] = (w[to] || 0) + weight; // accumulate weight (co-watch count)
    if (!this.directed) {
      const back = this.adjacency.get(to);
      if (!back.includes(from)) back.push(from);
      const wb = this.weights.get(to);
      wb[from] = (wb[from] || 0) + weight;
    }
    return this;
  }

  getNeighbors(id) { return this.adjacency.get(id) || []; }
  getWeight(from, to) { const w = this.weights.get(from); return w ? (w[to] || 0) : 0; }
  hasEdge(from, to) { return this.getNeighbors(from).includes(to); }

  // BFS — finds shortest path between two videos
  bfs(start, target = null) {
    const visited = new Set();
    const queue = [[start, [start]]];
    const order = [];
    visited.add(start);
    while (queue.length) {
      const [node, path] = queue.shift();
      order.push(node);
      if (node === target) return { found: true, path, visited: order };
      for (const neighbor of this.getNeighbors(node)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
    return { found: false, path: [], visited: order };
  }

  // DFS — deep exploration of recommendation chains
  dfs(start, visited = new Set(), order = []) {
    visited.add(start);
    order.push(start);
    for (const neighbor of this.getNeighbors(start)) {
      if (!visited.has(neighbor)) this.dfs(neighbor, visited, order);
    }
    return order;
  }

  // Top-N similar videos by edge weight (co-watch frequency)
  getTopRelated(videoId, topN = 6) {
    const neighbors = this.getNeighbors(videoId);
    const w = this.weights.get(videoId) || {};
    return neighbors
      .map(n => ({ id: n, weight: w[n] || 0 }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, topN);
  }

  nodes() { return this.adjacency.keys(); }
}


// ─────────────────────────────────────────────────────────────
// 7. QUEUE (Circular Buffer — fixed capacity)
//    Used for: Video upload processing queue, notification queue
//    Why: FIFO — fair processing order, O(1) enqueue/dequeue
// ─────────────────────────────────────────────────────────────
class Queue {
  constructor(capacity = 1000) {
    this.buffer = new Array(capacity);
    this.capacity = capacity;
    this.front = 0;
    this.back  = 0;
    this.count = 0;
  }

  enqueue(item) {
    if (this.isFull()) throw new Error('Queue overflow');
    this.buffer[this.back] = item;
    this.back = (this.back + 1) % this.capacity;
    this.count++;
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const item = this.buffer[this.front];
    this.front = (this.front + 1) % this.capacity;
    this.count--;
    return item;
  }

  peek()    { return this.isEmpty() ? null : this.buffer[this.front]; }
  isEmpty() { return this.count === 0; }
  isFull()  { return this.count === this.capacity; }
  size()    { return this.count; }

  toArray() {
    const arr = [];
    for (let i = 0; i < this.count; i++) arr.push(this.buffer[(this.front + i) % this.capacity]);
    return arr;
  }
}


// ─────────────────────────────────────────────────────────────
// 8. STACK
//    Used for: Browser-like back/forward navigation history
//    Why: LIFO — last page visited is first to go back to
// ─────────────────────────────────────────────────────────────
class Stack {
  constructor() { this.items = []; }
  push(item)  { this.items.push(item); return this; }
  pop()       { return this.items.pop() || null; }
  peek()      { return this.items[this.items.length - 1] || null; }
  isEmpty()   { return this.items.length === 0; }
  size()      { return this.items.length; }
  toArray()   { return [...this.items].reverse(); }
  clear()     { this.items = []; }
}


// ─────────────────────────────────────────────────────────────
// 9. BINARY SEARCH TREE
//    Used for: Tag/category index, date-sorted video browsing
//    Why: O(log n) search, insert, and in-order traversal
// ─────────────────────────────────────────────────────────────
class BSTNode {
  constructor(key, value) {
    this.key   = key;
    this.value = value;
    this.left  = null;
    this.right = null;
    this.height = 1; // for AVL balancing
  }
}

class BST {
  constructor(compareFn) {
    this.root = null;
    this.size = 0;
    this.compare = compareFn || ((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  }

  insert(key, value) {
    this.root = this._insert(this.root, key, value);
    this.size++;
  }

  _insert(node, key, value) {
    if (!node) return new BSTNode(key, value);
    const cmp = this.compare(key, node.key);
    if      (cmp < 0) node.left  = this._insert(node.left,  key, value);
    else if (cmp > 0) node.right = this._insert(node.right, key, value);
    else { node.value = value; this.size--; } // update existing
    return node;
  }

  search(key) {
    let node = this.root;
    while (node) {
      const cmp = this.compare(key, node.key);
      if      (cmp < 0) node = node.left;
      else if (cmp > 0) node = node.right;
      else return node.value;
    }
    return null;
  }

  // Range query — all values between lo and hi keys
  rangeSearch(lo, hi) {
    const results = [];
    this._range(this.root, lo, hi, results);
    return results;
  }

  _range(node, lo, hi, results) {
    if (!node) return;
    if (this.compare(lo, node.key) < 0) this._range(node.left, lo, hi, results);
    if (this.compare(lo, node.key) <= 0 && this.compare(node.key, hi) <= 0) results.push(node.value);
    if (this.compare(hi, node.key) > 0) this._range(node.right, lo, hi, results);
  }

  // In-order traversal → sorted results
  inOrder() {
    const result = [];
    this._inOrder(this.root, result);
    return result;
  }
  _inOrder(node, result) {
    if (!node) return;
    this._inOrder(node.left, result);
    result.push({ key: node.key, value: node.value });
    this._inOrder(node.right, result);
  }

  min() {
    let node = this.root;
    while (node?.left) node = node.left;
    return node ? node.value : null;
  }

  max() {
    let node = this.root;
    while (node?.right) node = node.right;
    return node ? node.value : null;
  }
}


// ─────────────────────────────────────────────────────────────
// 10. DISJOINT SET (Union-Find)
//     Used for: Grouping related videos/channels into clusters
//     O(α(n)) ≈ O(1) amortized with path compression
// ─────────────────────────────────────────────────────────────
class DisjointSet {
  constructor() {
    this.parent = {};
    this.rank   = {};
    this.size_map = {};
  }

  makeSet(id) {
    if (!(id in this.parent)) {
      this.parent[id] = id;
      this.rank[id]   = 0;
      this.size_map[id] = 1;
    }
  }

  find(id) {
    if (this.parent[id] !== id) this.parent[id] = this.find(this.parent[id]); // path compression
    return this.parent[id];
  }

  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    // Union by rank
    if (this.rank[ra] < this.rank[rb]) { this.parent[ra] = rb; this.size_map[rb] += this.size_map[ra]; }
    else if (this.rank[ra] > this.rank[rb]) { this.parent[rb] = ra; this.size_map[ra] += this.size_map[rb]; }
    else { this.parent[rb] = ra; this.rank[ra]++; this.size_map[ra] += this.size_map[rb]; }
    return true;
  }

  connected(a, b) { return this.find(a) === this.find(b); }
  componentSize(id) { return this.size_map[this.find(id)] || 0; }

  allComponents() {
    const comps = {};
    for (const id of Object.keys(this.parent)) {
      const root = this.find(id);
      if (!comps[root]) comps[root] = [];
      comps[root].push(id);
    }
    return Object.values(comps);
  }
}

module.exports = { MaxHeap, HashTable, Trie, DoublyLinkedList, LRUCache, Graph, Queue, Stack, BST, DisjointSet };
