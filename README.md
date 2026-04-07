# 📺 ViewTube - DSA-Powered YouTube Clone

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/Sir-Klvn/DSA_CH23_GROUP-04)
[![DSA Project](https://img.shields.io/badge/DSA-Implementation-green)](https://github.com/Sir-Klvn/DSA_CH23_GROUP-04)
[![Node.js](https://img.shields.io/badge/Node.js-18+-blue)](https://nodejs.org/)

A comprehensive **Data Structures and Algorithms (DSA) demonstration project** that implements a YouTube-like video platform using **9 custom data structures** and **9 algorithms** from scratch. This project serves as both a functional video platform and an educational reference for DSA concepts in real-world applications.

## 🎯 Project Overview

ViewTube is a full-stack web application that demonstrates how fundamental DSA concepts power modern web platforms. Every feature - from video search to recommendations - is implemented using custom-built data structures and algorithms, providing O(1) to O(log n) performance characteristics.

### Key Features
- 🔍 **Intelligent Search** with autocomplete and fuzzy matching
- 📈 **Real-time Trending** videos using heap-based algorithms
- 🤝 **Smart Recommendations** powered by graph algorithms
- 💾 **Efficient Caching** with LRU cache implementation
- 📊 **Analytics & Metrics** using various sorting and search algorithms
- 🎬 **Video Management** with hash table lookups
- 👤 **User System** with stack-based navigation history

## 🏗️ Architecture & DSA Implementation

### Backend Architecture
```
ViewTube Backend (Node.js + Express)
├── 🎯 Services Layer (Business Logic)
│   ├── SearchService (Trie + TF-IDF)
│   ├── TrendingService (MaxHeap)
│   ├── RecommendationService (Graph + DisjointSet)
│   ├── VideoService (HashTable + BST + QuickSort)
│   ├── UserService (Stack + Queue)
│   └── UploadQueueService (Circular Queue)
├── 🏗️ Data Structures Layer
│   ├── MaxHeap (Trending videos)
│   ├── HashTable (O(1) lookups)
│   ├── Trie (Prefix search)
│   ├── Graph (Recommendations)
│   ├── LRUCache (Metadata caching)
│   ├── Queue & Stack (Navigation/User flow)
│   ├── BST (Range queries)
│   └── DisjointSet (Video clustering)
└── ⚡ Algorithms Layer
    ├── MergeSort & QuickSort (Sorting)
    ├── BinarySearch (Lookup)
    ├── TF-IDF (Text relevance)
    ├── Levenshtein (Fuzzy search)
    ├── Dijkstra (Shortest paths)
    ├── BFS/DFS (Graph traversal)
    └── Collaborative Filtering (Recommendations)
```

## 📊 Data Structures Implemented

### 1. **MaxHeap** - Trending Videos
- **Purpose**: Maintain top-K trending videos efficiently
- **Operations**: O(log n) insert/extract-max
- **Use Case**: Real-time trending algorithm updates
- **Implementation**: Complete binary tree with heap property

### 2. **HashTable** - Fast Lookups
- **Purpose**: O(1) video and user data retrieval
- **Features**: Chaining for collision resolution, auto-resize
- **Use Case**: Video metadata, user sessions, caching
- **Performance**: Average O(1) for get/set operations

### 3. **Trie (Prefix Tree)** - Search Autocomplete
- **Purpose**: Efficient prefix-based search and autocomplete
- **Operations**: O(L) prefix matching where L is string length
- **Use Case**: Search suggestions, word completion
- **Features**: Memory efficient for common prefixes

### 4. **Graph** - Video Recommendations
- **Purpose**: Model video relationships and user preferences
- **Algorithms**: BFS, DFS, Dijkstra for shortest paths
- **Use Case**: "Watch next" recommendations, related videos
- **Implementation**: Adjacency list with weighted edges

### 5. **LRU Cache** - Metadata Caching
- **Purpose**: Cache frequently accessed video metadata
- **Structure**: Doubly-linked list + HashTable
- **Operations**: O(1) get/set with automatic eviction
- **Use Case**: Video thumbnails, user preferences, search results

### 6. **Queue & Stack** - User Flow Management
- **Queue**: FIFO for upload processing, notifications
- **Stack**: LIFO for navigation history (back/forward)
- **Implementation**: Circular buffer for queue efficiency
- **Use Case**: Upload queue, browser navigation, undo operations

### 7. **Binary Search Tree (BST)** - Range Queries
- **Purpose**: Efficient range queries on sorted data
- **Operations**: O(log n) insert/search, O(k + log n) range queries
- **Use Case**: Date ranges, view count filters, sorted video lists
- **Balancing**: Self-balancing for optimal performance

### 8. **Disjoint Set (Union-Find)** - Video Clustering
- **Purpose**: Group related videos and detect clusters
- **Operations**: Near O(1) union/find with path compression
- **Use Case**: Video categorization, duplicate detection
- **Optimization**: Union by rank and path compression

## ⚡ Algorithms Implemented

### 1. **MergeSort & QuickSort** - Sorting Operations
- **MergeSort**: Stable O(n log n) for search result ranking
- **QuickSort**: In-place O(n log n) with median-of-3 pivot
- **Use Case**: Video sorting by relevance, date, views

### 2. **Binary Search** - Fast Lookup
- **Purpose**: O(log n) search in sorted arrays
- **Use Case**: Finding insertion points, range boundaries
- **Implementation**: Iterative with early termination

### 3. **TF-IDF (Term Frequency-Inverse Document Frequency)**
- **Purpose**: Text relevance scoring for search results
- **Formula**: `TF-IDF = TF × IDF × log(N/DF)`
- **Use Case**: Ranking search results by relevance
- **Features**: Stop word filtering, normalization

### 4. **Levenshtein Distance** - Fuzzy Search
- **Purpose**: Edit distance for "did you mean?" suggestions
- **Algorithm**: Dynamic programming O(m×n)
- **Use Case**: Typo correction, similar word suggestions
- **Optimization**: Early termination for performance

### 5. **Trending Score Algorithm** - Reddit-style Gravity
- **Formula**: `score = (views × engagement) / (time + 2)^1.8`
- **Purpose**: Time-decay ranking for trending content
- **Features**: Recent content gets higher scores
- **Use Case**: Trending videos, popular content ranking

### 6. **Collaborative Filtering** - User Recommendations
- **Method**: Cosine similarity between user preference vectors
- **Purpose**: "Users who liked X also liked Y"
- **Implementation**: Matrix-based similarity calculation
- **Use Case**: Personalized video recommendations

### 7. **Dijkstra's Algorithm** - Shortest Path Recommendations
- **Purpose**: Find optimal recommendation paths between videos
- **Use Case**: Multi-step video discovery journeys
- **Implementation**: Priority queue with decrease-key

## 🚀 API Endpoints

The backend provides RESTful APIs powered by the DSA implementations:

### Videos
- `GET /videos` - List all videos (HashTable lookup)
- `GET /videos/:id` - Get video details (O(1) HashTable)
- `GET /videos/category/:cat` - Filter by category (BST range query)
- `POST /videos/:id/view` - Increment view count
- `POST /videos/:id/like` - Like/dislike video
- `GET /videos/:id/analytics` - View analytics

### Search
- `GET /search?q=` - Full-text search (Trie + TF-IDF)
- `GET /search/autocomplete?q=` - Autocomplete suggestions
- `GET /search/popular` - Popular search terms

### Trending
- `GET /trending` - Top trending videos (MaxHeap extract)
- `GET /trending/score/:id` - Calculate trending score

### Recommendations
- `GET /recommendations/user/:id` - User-based recommendations
- `GET /recommendations/video/:id` - Related videos (Graph traversal)
- `GET /recommendations/video/:id/deep` - Deep recommendations (Dijkstra)
- `GET /recommendations/path/:from/:to` - Shortest path between videos

### Users
- `GET /users/:id` - User profile (HashTable lookup)
- `POST /users/:id/navigate` - Add to navigation history (Stack)
- `POST /users/:id/back` - Navigate back (Stack pop)
- `POST /users/:id/forward` - Navigate forward (Stack push)
- `GET /users/:id/notifications` - User notifications (Queue)

### System
- `GET /system/stats` - DSA performance metrics
- `GET /system/cache` - Cache hit/miss statistics
- `GET /system/dsa-demo` - Interactive DSA demonstrations

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** 18+ (https://nodejs.org/)
- **Git** (https://git-scm.com/)

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/Sir-Klvn/DSA_CH23_GROUP-04.git
cd DSA_CH23_GROUP-04/viewtube-backend

# Install dependencies
npm install

# Start the server
npm start
# Server runs on http://localhost:3000
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd ../viewtube-frontend

# Install VS Code Live Server extension
# Then right-click index.html → "Open with Live Server"
```

### Testing
```bash
# Run comprehensive DSA tests
cd viewtube-backend
npm test
# Expected: 42/42 tests passing ✅
```

## 📈 Performance Characteristics

| Operation | Data Structure | Time Complexity | Use Case |
|-----------|----------------|-----------------|----------|
| Video Lookup | HashTable | O(1) | Get video by ID |
| Search Query | Trie | O(L) | Autocomplete |
| Trending Update | MaxHeap | O(log n) | Add new trending video |
| Recommendations | Graph + BFS | O(V + E) | Find related videos |
| Cache Access | LRU Cache | O(1) | Get cached metadata |
| Range Query | BST | O(log n) | Filter by date range |
| Sort Results | QuickSort | O(n log n) | Order search results |
| Fuzzy Search | Levenshtein | O(m×n) | "Did you mean?" |

## 🎓 Educational Value

This project demonstrates:
- **Real-world DSA applications** in web development
- **Performance optimization** through algorithmic choices
- **Scalability considerations** for growing datasets
- **Trade-off analysis** between different data structures
- **Algorithm selection** based on use case requirements

### Learning Objectives
- Understand when to use each data structure
- Implement complex algorithms from scratch
- Analyze time/space complexity trade-offs
- Design efficient APIs using DSA principles
- Debug and optimize performance bottlenecks

## 🤝 Contributing

This is a DSA demonstration project for educational purposes. The codebase includes:
- Comprehensive comments explaining DSA concepts
- Unit tests for all data structures and algorithms
- Performance benchmarks and complexity analysis
- Real-world use case implementations

## 📄 License

This project is created for educational purposes in DSA coursework.

## 👥 Team

**Group 04 - DSA_CH23**
- Repository: https://github.com/Sir-Klvn/DSA_CH23_GROUP-04

---

*Built with ❤️ using pure JavaScript data structures and algorithms*</content>
<parameter name="filePath">c:\Users\user\Documents\viewtube\README.md#   D S A _ C H 2 3 _ G R O U P _ 0 4  
 