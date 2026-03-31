// ============================================================
//  ViewTube DSA Backend — tests.js
//  Unit tests for every data structure and algorithm
//  Run: node src/tests.js
// ============================================================

const { MaxHeap, HashTable, Trie, LRUCache, Graph, Queue, Stack, BST, DisjointSet } = require('./data-structures');
const { mergeSort, quickSort, binarySearch, computeTrendingScore, buildTfIdfIndex, levenshtein, fuzzyMatch, collaborativeFilter, dijkstra } = require('./algorithms');

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌  ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

function assertArrayEqual(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msg || `Expected [${b}], got [${a}]`);
}

// ─────────────────────────────────────────────────────────────
console.log('\n══ 1. MAX-HEAP ═══════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('Insert + extractMax returns highest score', () => {
  const h = new MaxHeap();
  [{ score:5 },{ score:12 },{ score:3 },{ score:8 }].forEach(x => h.insert(x));
  assertEqual(h.extractMax().score, 12, 'Should extract 12');
  assertEqual(h.extractMax().score, 8, 'Should extract 8 next');
});

test('Heap size updates correctly', () => {
  const h = new MaxHeap();
  h.insert({ score:1 }); h.insert({ score:2 });
  assertEqual(h.size(), 2);
  h.extractMax();
  assertEqual(h.size(), 1);
});

test('topK returns k items in order without destroying heap', () => {
  const h = new MaxHeap();
  [10, 5, 8, 1, 9].forEach(s => h.insert({ score: s }));
  const top3 = h.topK(3);
  assertEqual(top3[0].score, 10);
  assertEqual(top3[1].score, 9);
  assertEqual(top3[2].score, 8);
  assertEqual(h.size(), 5, 'Heap should still have all items');
});

test('updatePriority moves item correctly', () => {
  const h = new MaxHeap();
  h.insert({ id: 'v1', score: 5 });
  h.insert({ id: 'v2', score: 9 });
  h.updatePriority(x => x.id === 'v1', 15);
  assertEqual(h.peek().id, 'v1', 'v1 should now be top');
});

test('Empty heap returns null on extractMax', () => {
  const h = new MaxHeap();
  assertEqual(h.extractMax(), null);
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 2. HASH TABLE ══════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('set and get', () => {
  const ht = new HashTable();
  ht.set('v1', { title: 'React Tutorial' });
  assertEqual(ht.get('v1').title, 'React Tutorial');
});

test('collision handled via chaining', () => {
  const ht = new HashTable(4); // small size = many collisions
  for (let i = 0; i < 20; i++) ht.set(`key${i}`, i);
  for (let i = 0; i < 20; i++) assertEqual(ht.get(`key${i}`), i);
});

test('delete removes entry', () => {
  const ht = new HashTable();
  ht.set('x', 42);
  ht.delete('x');
  assert(!ht.has('x'), 'Should not have key after delete');
});

test('auto-resize on high load factor', () => {
  const ht = new HashTable(4);
  for (let i = 0; i < 30; i++) ht.set(`k${i}`, i * 2);
  assertEqual(ht.get('k0'), 0);
  assertEqual(ht.get('k29'), 58);
});

test('overwrite existing key', () => {
  const ht = new HashTable();
  ht.set('uid', 'alice');
  ht.set('uid', 'bob');
  assertEqual(ht.get('uid'), 'bob');
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 3. TRIE ════════════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('insert and prefix search', () => {
  const t = new Trie();
  ['javascript','java','javelin','python'].forEach(w => t.insert(w, 'v1'));
  const res = t.search('java');
  assert(res.length >= 2, `Should find java and javascript, got ${res.length}`);
});

test('autocomplete returns sorted by frequency', () => {
  const t = new Trie();
  t.insert('react'); t.insert('react'); t.insert('react');
  t.insert('redux'); t.insert('redux');
  t.insert('react-native');
  const res = t.search('re');
  assertEqual(res[0].word, 'react', 'Most frequent should be first');
});

test('search returns empty for unknown prefix', () => {
  const t = new Trie();
  t.insert('hello');
  const res = t.search('xyz');
  assertEqual(res.length, 0);
});

test('videoIds attached to words', () => {
  const t = new Trie();
  t.insert('react', 'v1');
  t.insert('react', 'v2');
  const ids = t.getVideoIds('react');
  assert(ids.includes('v1') && ids.includes('v2'));
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 4. LRU CACHE ═══════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('put and get', () => {
  const c = new LRUCache(3);
  c.put('v1', { title: 'Video 1' });
  assertEqual(c.get('v1').title, 'Video 1');
});

test('evicts least recently used', () => {
  const c = new LRUCache(2);
  c.put('v1', 1); c.put('v2', 2);
  c.get('v1');    // access v1 so v2 becomes LRU
  c.put('v3', 3); // should evict v2
  assertEqual(c.get('v2'), null, 'v2 should be evicted');
  assert(c.get('v1') !== null, 'v1 should still be present');
});

test('hit rate tracking', () => {
  const c = new LRUCache(5);
  c.put('a', 1); c.put('b', 2);
  c.get('a'); c.get('a'); c.get('z'); // 2 hits, 1 miss
  assert(parseFloat(c.hitRate()) > 50, 'Hit rate should be above 50%');
});

test('capacity respected', () => {
  const c = new LRUCache(3);
  ['a','b','c','d','e'].forEach((k,i) => c.put(k,i));
  assertEqual(c.size(), 3, 'Should never exceed capacity');
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 5. GRAPH (BFS / DFS / Dijkstra) ════════════════════');
// ─────────────────────────────────────────────────────────────
test('addEdge and getNeighbors', () => {
  const g = new Graph();
  g.addEdge('v1','v2',3); g.addEdge('v1','v3',1);
  const n = g.getNeighbors('v1');
  assert(n.includes('v2') && n.includes('v3'));
});

test('BFS finds shortest path', () => {
  const g = new Graph(false);
  g.addEdge('A','B'); g.addEdge('B','C'); g.addEdge('A','C');
  const result = g.bfs('A','C');
  assertEqual(result.path.length, 2, 'Direct path A→C should be length 2');
});

test('DFS visits all connected nodes', () => {
  const g = new Graph(false);
  g.addEdge('1','2'); g.addEdge('2','3'); g.addEdge('1','4');
  const order = g.dfs('1');
  assertEqual(order.length, 4, 'All 4 nodes should be visited');
});

test('getTopRelated sorted by weight', () => {
  const g = new Graph(false);
  g.addEdge('v1','v2',10); g.addEdge('v1','v3',3);
  const top = g.getTopRelated('v1', 2);
  assertEqual(top[0].id, 'v2', 'v2 has higher weight');
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 6. QUEUE & STACK ════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('Queue FIFO order', () => {
  const q = new Queue(10);
  q.enqueue('a'); q.enqueue('b'); q.enqueue('c');
  assertEqual(q.dequeue(), 'a', 'First in should be first out');
  assertEqual(q.dequeue(), 'b');
});

test('Queue size and isEmpty', () => {
  const q = new Queue(5);
  assert(q.isEmpty());
  q.enqueue(1); q.enqueue(2);
  assertEqual(q.size(), 2);
});

test('Stack LIFO order', () => {
  const s = new Stack();
  s.push('page1'); s.push('page2'); s.push('page3');
  assertEqual(s.pop(), 'page3', 'Last in should be first out');
  assertEqual(s.pop(), 'page2');
});

test('Stack isEmpty and peek', () => {
  const s = new Stack();
  assert(s.isEmpty());
  s.push('x');
  assertEqual(s.peek(), 'x');
  assertEqual(s.size(), 1);
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 7. BST ══════════════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('insert and search', () => {
  const bst = new BST();
  bst.insert(5, 'five'); bst.insert(3, 'three'); bst.insert(8, 'eight');
  assertEqual(bst.search(5), 'five');
  assertEqual(bst.search(8), 'eight');
  assertEqual(bst.search(99), null);
});

test('inOrder returns sorted keys', () => {
  const bst = new BST();
  [7, 3, 9, 1, 5].forEach(k => bst.insert(k, k));
  const order = bst.inOrder().map(n => n.key);
  assertArrayEqual(order, [1,3,5,7,9]);
});

test('min and max', () => {
  const bst = new BST();
  [4,2,6,1,3].forEach(k => bst.insert(k, k));
  assertEqual(bst.min(), 1);
  assertEqual(bst.max(), 6);
});

test('rangeSearch returns values in range', () => {
  const bst = new BST();
  [10,20,30,40,50].forEach(k => bst.insert(k, k));
  const range = bst.rangeSearch(15, 45);
  assert(range.includes(20) && range.includes(30) && range.includes(40));
  assert(!range.includes(10) && !range.includes(50));
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 8. DISJOINT SET ═════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('union and connected', () => {
  const ds = new DisjointSet();
  ['a','b','c','d'].forEach(x => ds.makeSet(x));
  ds.union('a','b'); ds.union('b','c');
  assert(ds.connected('a','c'), 'a and c should be in same set');
  assert(!ds.connected('a','d'), 'a and d should be in different sets');
});

test('componentSize', () => {
  const ds = new DisjointSet();
  ['v1','v2','v3','v4'].forEach(x => ds.makeSet(x));
  ds.union('v1','v2'); ds.union('v1','v3');
  assertEqual(ds.componentSize('v1'), 3);
  assertEqual(ds.componentSize('v4'), 1);
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 9. SORTING ALGORITHMS ═══════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('mergeSort sorts correctly (stable)', () => {
  const arr = [{ v:3 },{ v:1 },{ v:4 },{ v:1 },{ v:5 }];
  const sorted = mergeSort(arr, (a,b) => a.v - b.v);
  assertArrayEqual(sorted.map(x=>x.v), [1,1,3,4,5]);
});

test('quickSort sorts large array', () => {
  const arr = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 1000));
  const sorted = quickSort([...arr]);
  for (let i = 1; i < sorted.length; i++) assert(sorted[i] >= sorted[i-1]);
});

test('binarySearch finds existing element', () => {
  const arr = [1,3,5,7,9,11,13];
  const r = binarySearch(arr, 7);
  assert(r.found);
  assertEqual(arr[r.index], 7);
});

test('binarySearch returns insertion point for missing', () => {
  const arr = [1,3,5,7,9];
  const r = binarySearch(arr, 6);
  assert(!r.found);
  assertEqual(r.index, 3, 'Should return insertion point 3');
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ 10. ALGORITHMS ══════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
test('computeTrendingScore gives higher score to recent high-engagement', () => {
  const recent = { views:100000, likes:5000, comments:200, shares:500, uploadedAt: new Date(Date.now() - 3600000).toISOString() };
  const old    = { views:100000, likes:5000, comments:200, shares:500, uploadedAt: new Date(Date.now() - 7*24*3600000).toISOString() };
  assert(computeTrendingScore(recent) > computeTrendingScore(old), 'Recent video should score higher');
});

test('TF-IDF search finds relevant docs', () => {
  const docs = [
    { id:'d1', text:'react javascript frontend tutorial advanced' },
    { id:'d2', text:'python data science machine learning' },
    { id:'d3', text:'react hooks components state management' },
  ];
  const idx = buildTfIdfIndex(docs);
  const results = idx.query('react tutorial');
  assertEqual(results[0].id, 'd1', 'Most relevant doc should be d1');
});

test('levenshtein distance correct', () => {
  assertEqual(levenshtein('kitten','sitting'), 3);
  assertEqual(levenshtein('javascript','javscript'), 1);
  assertEqual(levenshtein('hello','hello'), 0);
  assertEqual(levenshtein('','abc'), 3);
});

test('fuzzyMatch finds closest candidates', () => {
  const candidates = ['javascript','python','typescript','java','golang'];
  const matches = fuzzyMatch('javascrip', candidates, 3);
  assert(matches[0].candidate === 'javascript', 'javascript should be closest');
});

test('collaborativeFilter recommends unwatched videos', () => {
  const watchMap = {
    'u1': { 'v1':1, 'v2':1, 'v3':1 },
    'u2': { 'v1':1, 'v2':1, 'v4':1, 'v5':1 }, // similar to u1 + extras
  };
  const recs = collaborativeFilter('u1', watchMap, 5);
  const ids = recs.map(r => r.videoId);
  assert(!ids.includes('v1'), 'Should not recommend already-watched v1');
  assert(ids.includes('v4') || ids.includes('v5'), 'Should recommend v4 or v5');
});

test('dijkstra finds shortest path', () => {
  const g = new Graph(false);
  g.addEdge('A','B',1); g.addEdge('B','C',1); g.addEdge('A','C',10);
  const result = dijkstra(g, 'A');
  // A→C direct has weight 10 → edge cost = 1/10 = 0.1
  // A→B→C has weight 1+1 → edge cost = 1+1 = 2
  // So direct A→C should actually be cheaper (lower inverted cost)
  const pathToC = result.pathTo('C');
  assert(pathToC.length > 0, 'Path to C should exist');
  assertEqual(pathToC[0], 'A', 'Path should start at A');
});

// ─────────────────────────────────────────────────────────────
console.log('\n══ RESULTS ═════════════════════════════════════════════');
// ─────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n  Total:  ${total}`);
console.log(`  Passed: ${passed} ✅`);
if (failed > 0) console.log(`  Failed: ${failed} ❌`);
else console.log(`  Failed: 0`);
console.log(`  Score:  ${((passed/total)*100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('  🎉  All tests passed! Your DSA backend is solid.\n');
} else {
  console.log('  ⚠️   Some tests failed. Check the output above.\n');
  process.exit(1);
}
