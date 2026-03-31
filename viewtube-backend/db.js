// ============================================================
//  ViewTube DSA Backend — db.js
//  In-memory database powered entirely by our custom data structures
// ============================================================

const { HashTable, BST, LRUCache } = require('./data-structures');

// ── Raw video seed data ──────────────────────────────────────
const RAW_VIDEOS = [
  { id:'v1',  title:'Building a Full-Stack App with React & Node.js in 2024', channel:'CodeWithMe',        channelId:'ch1', views:1200000, likes:48200, comments:1240, shares:3200, category:'coding',  tags:['react','nodejs','fullstack','javascript','tutorial'], duration:2538, uploadedAt:'2024-01-20T10:00:00Z', description:'Learn to build a production-grade full-stack application from scratch.', thumbnail:'https://picsum.photos/320/180?random=1' },
  { id:'v2',  title:'10 JavaScript Tricks You Didn\'t Know Existed',           channel:'TechWorld',         channelId:'ch2', views:4700000, likes:182000,comments:5600, shares:28000,category:'coding',  tags:['javascript','tips','tricks','webdev','programming'],   duration:944,  uploadedAt:'2024-01-14T08:00:00Z', description:'Mind-blowing JavaScript features most developers never use.',           thumbnail:'https://picsum.photos/320/180?random=2' },
  { id:'v3',  title:'Lo-fi Hip Hop Radio – Beats to Study/Relax',              channel:'ChillVibes',        channelId:'ch3', views:12000000,likes:520000,comments:18000,shares:95000,category:'music',   tags:['lofi','music','study','relax','chill','beats'],        duration:null, uploadedAt:'2023-11-01T00:00:00Z', description:'24/7 lo-fi beats for focus and relaxation.',                           thumbnail:'https://picsum.photos/320/180?random=3', isLive:true },
  { id:'v4',  title:'The Most Beautiful Places on Earth 4K',                   channel:'NatureHub',         channelId:'ch4', views:8900000, likes:340000,comments:12000,shares:67000,category:'travel',  tags:['nature','4k','travel','earth','landscape','scenery'],  duration:1682, uploadedAt:'2023-08-10T12:00:00Z', description:'Journey through breathtaking landscapes in stunning 4K.',              thumbnail:'https://picsum.photos/320/180?random=4' },
  { id:'v5',  title:'Dark Souls III – Every Boss Ranked Worst to Best',        channel:'GamingLore',        channelId:'ch5', views:2100000, likes:89000, comments:9800, shares:12000,category:'gaming',  tags:['darksouls','gaming','ranked','bosses','fromsoftware'],  duration:3273, uploadedAt:'2024-01-08T15:00:00Z', description:'Definitive ranking of every DS3 boss with full analysis.',             thumbnail:'https://picsum.photos/320/180?random=5' },
  { id:'v6',  title:'How Black Holes Actually Work – A Deep Dive',             channel:'CosmosExplained',   channelId:'ch6', views:6300000, likes:275000,comments:8200, shares:41000,category:'science', tags:['blackhole','space','physics','science','nasa','cosmos'], duration:1331, uploadedAt:'2023-12-05T14:00:00Z', description:'The complete physics of black holes explained simply.',                thumbnail:'https://picsum.photos/320/180?random=6' },
  { id:'v7',  title:'Gordon Ramsay\'s Perfect Scrambled Eggs – Breakdown',     channel:'CookingPro',        channelId:'ch7', views:19000000,likes:890000,comments:32000,shares:180000,category:'cooking', tags:['cooking','eggs','gordonramsay','recipe','technique'],   duration:527,  uploadedAt:'2022-03-15T09:00:00Z', description:'The legendary scrambled egg technique broken down step by step.',     thumbnail:'https://picsum.photos/320/180?random=7' },
  { id:'v8',  title:'Champions League 2024 – Top 10 Goals of the Season',      channel:'FootballHighlights',channelId:'ch8', views:7500000, likes:310000,comments:14000,shares:88000,category:'sports',  tags:['football','soccer','ucl','goals','champions'],         duration:682,  uploadedAt:'2024-01-01T18:00:00Z', description:'The 10 most spectacular Champions League goals this season.',         thumbnail:'https://picsum.photos/320/180?random=8' },
  { id:'v9',  title:'Python in 2024 – Is It Still Worth Learning?',            channel:'TechWorld',         channelId:'ch2', views:890000,  likes:34000, comments:2800, shares:8900, category:'coding',  tags:['python','programming','2024','beginner','ai'],         duration:1085, uploadedAt:'2024-01-19T11:00:00Z', description:'Python pros, cons, and whether beginners should learn it in 2024.',   thumbnail:'https://picsum.photos/320/180?random=9' },
  { id:'v10', title:'Tokyo Travel Guide 2024 – The ULTIMATE 7-Day Itinerary',  channel:'NatureHub',         channelId:'ch4', views:3400000, likes:156000,comments:6700, shares:34000,category:'travel',  tags:['tokyo','japan','travel','itinerary','guide','2024'],   duration:2150, uploadedAt:'2023-07-22T08:00:00Z', description:'Everything you need for the perfect week in Tokyo.',                   thumbnail:'https://picsum.photos/320/180?random=10' },
  { id:'v11', title:'Elden Ring – Complete Lore Explained (All DLC)',           channel:'GamingLore',        channelId:'ch5', views:5100000, likes:234000,comments:15600,shares:52000,category:'gaming',  tags:['eldenring','lore','gaming','fromsoftware','dlc'],      duration:6322, uploadedAt:'2023-11-20T16:00:00Z', description:'Full Elden Ring lore including Shadow of the Erdtree DLC.',           thumbnail:'https://picsum.photos/320/180?random=11' },
  { id:'v12', title:'Breaking News: Major Climate Agreement Reached',           channel:'GlobalNews',        channelId:'ch9', views:420000,  likes:8900,  comments:3400, shares:28000,category:'news',    tags:['news','climate','un','environment','agreement'],       duration:750,  uploadedAt:'2024-01-23T06:00:00Z', description:'World leaders reach landmark climate deal at UN Summit.',             thumbnail:'https://picsum.photos/320/180?random=12' },
  { id:'v13', title:'Mastering CSS Grid in 20 Minutes',                        channel:'CodeWithMe',        channelId:'ch1', views:650000,  likes:28000, comments:980,  shares:4500, category:'coding',  tags:['css','grid','webdev','frontend','tutorial'],           duration:1200, uploadedAt:'2024-01-15T10:00:00Z', description:'Everything you need to know about CSS Grid layout.',                  thumbnail:'https://picsum.photos/320/180?random=13' },
  { id:'v14', title:'The Universe\'s Most Extreme Stars Explained',            channel:'CosmosExplained',   channelId:'ch6', views:2800000, likes:112000,comments:3900, shares:18000,category:'science', tags:['stars','space','neutron','pulsar','science','universe'],duration:1540, uploadedAt:'2023-10-30T12:00:00Z', description:'Neutron stars, pulsars, magnetars and more.',                          thumbnail:'https://picsum.photos/320/180?random=14' },
  { id:'v15', title:'Street Food Tour – Bangkok\'s Best Hidden Gems',          channel:'NatureHub',         channelId:'ch4', views:1900000, likes:78000, comments:4200, shares:22000,category:'travel',  tags:['bangkok','thailand','food','travel','streetfood'],     duration:1820, uploadedAt:'2023-09-14T07:00:00Z', description:'Finding the most authentic street food in Bangkok.',                  thumbnail:'https://picsum.photos/320/180?random=15' },
  { id:'v16', title:'React 18 New Features You Need to Know',                  channel:'CodeWithMe',        channelId:'ch1', views:950000,  likes:41000, comments:1200, shares:5800, category:'coding',  tags:['react','javascript','frontend','hooks','suspense'],       duration:1420, uploadedAt:'2024-02-10T14:00:00Z', description:'Complete guide to React 18 concurrent features and improvements.',     thumbnail:'https://picsum.photos/320/180?random=16' },
  { id:'v17', title:'Cyberpunk 2077 – Ultimate Graphics Settings Guide',       channel:'GamingLore',        channelId:'ch5', views:3200000, likes:145000,comments:8900, shares:25000,category:'gaming',  tags:['cyberpunk','gaming','graphics','settings','pc'],         duration:2150, uploadedAt:'2024-01-25T16:00:00Z', description:'Max out your graphics while maintaining 60+ FPS.',                  thumbnail:'https://picsum.photos/320/180?random=17' },
  { id:'v18', title:'Jazz Piano Covers – Relaxing Evening Music',              channel:'ChillVibes',        channelId:'ch3', views:8500000, likes:380000,comments:12500,shares:72000,category:'music',   tags:['jazz','piano','covers','relax','music'],                 duration:null, uploadedAt:'2023-12-15T20:00:00Z', description:'Smooth jazz piano covers of popular songs.',                        thumbnail:'https://picsum.photos/320/180?random=18', isLive:true },
  { id:'v19', title:'Northern Lights in Iceland – Aurora Photography',         channel:'NatureHub',         channelId:'ch4', views:4200000, likes:168000,comments:7800, shares:41000,category:'travel',  tags:['iceland','aurora','northernlights','photography','nature'],duration:1890, uploadedAt:'2023-11-08T22:00:00Z', description:'Capturing the magic of the northern lights.',                       thumbnail:'https://picsum.photos/320/180?random=19' },
  { id:'v20', title:'Machine Learning for Beginners – Neural Networks',        channel:'TechWorld',         channelId:'ch2', views:1800000, likes:72000, comments:3400, shares:12000,category:'coding',  tags:['machinelearning','ai','neuralnetworks','python','beginner'],duration:2680, uploadedAt:'2024-02-05T12:00:00Z', description:'Understanding the fundamentals of neural networks.',               thumbnail:'https://picsum.photos/320/180?random=20' },
  { id:'v21', title:'The Science of Cooking – Molecular Gastronomy',           channel:'CookingPro',        channelId:'ch7', views:5600000, likes:245000,comments:15600,shares:89000,category:'cooking', tags:['science','cooking','molecular','gastronomy','technique'], duration:1950, uploadedAt:'2023-10-12T11:00:00Z', description:'How science transforms cooking into art.',                          thumbnail:'https://picsum.photos/320/180?random=21' },
  { id:'v22', title:'Premier League 2024 – Best Goals Compilation',            channel:'FootballHighlights',channelId:'ch8', views:9200000, likes:420000,comments:18900,shares:112000,category:'sports',  tags:['football','premierleague','goals','highlights','soccer'],  duration:890,  uploadedAt:'2024-02-01T19:00:00Z', description:'The most incredible goals from the 2023-24 season.',              thumbnail:'https://picsum.photos/320/180?random=22' },
  { id:'v23', title:'SpaceX Starship – Mars Mission Update',                   channel:'CosmosExplained',   channelId:'ch6', views:7800000, likes:345000,comments:12400,shares:67000,category:'science', tags:['spacex','starship','mars','space','nasa'],               duration:1680, uploadedAt:'2024-01-30T13:00:00Z', description:'Latest developments in humanity\'s journey to Mars.',                thumbnail:'https://picsum.photos/320/180?random=23' },
  { id:'v24', title:'TypeScript Advanced Patterns and Tips',                   channel:'CodeWithMe',        channelId:'ch1', views:720000,  likes:31000, comments:850,  shares:3800, category:'coding',  tags:['typescript','javascript','advanced','patterns','tips'],    duration:1320, uploadedAt:'2024-02-08T10:00:00Z', description:'Master advanced TypeScript features and patterns.',                 thumbnail:'https://picsum.photos/320/180?random=24' },
  { id:'v25', title:'World Cup 2026 – Host Cities Announced',                  channel:'GlobalNews',        channelId:'ch9', views:680000,  likes:15200, comments:4200, shares:35000,category:'news',    tags:['worldcup','football','2026','fifa','sports'],             duration:620,  uploadedAt:'2024-02-12T08:00:00Z', description:'Official announcement of World Cup 2026 host cities.',               thumbnail:'https://picsum.photos/320/180?random=25' },
];

// ── User seed data ───────────────────────────────────────────
const RAW_USERS = [
  { id:'u1', username:'alex_dev',   watchHistory:['v1','v2','v9','v13'], liked:['v2','v9'], subscriptions:['ch1','ch2'] },
  { id:'u2', username:'gamer_pro',  watchHistory:['v5','v11','v6'],      liked:['v5','v11'],subscriptions:['ch5','ch6'] },
  { id:'u3', username:'music_fan',  watchHistory:['v3','v4','v10'],      liked:['v3'],      subscriptions:['ch3','ch4'] },
  { id:'u4', username:'jane_doe',   watchHistory:['v1','v6','v7','v12'], liked:['v6','v7'], subscriptions:['ch1','ch6','ch7'] },
  { id:'u5', username:'bob_cooks',  watchHistory:['v7','v4','v15'],      liked:['v7'],      subscriptions:['ch7','ch4'] },
  { id:'u6', username:'news_watcher',watchHistory:['v12','v6','v8'],     liked:['v12'],     subscriptions:['ch9','ch6'] },
];

// ── In-memory DB class powered by our custom structures ──────
class ViewTubeDB {
  constructor() {
    // Primary stores
    this.videos   = new HashTable(64);  // O(1) video lookup by id
    this.users    = new HashTable(32);  // O(1) user lookup by id
    this.channels = new HashTable(32);  // O(1) channel lookup
    this.sessions = new HashTable(64);  // O(1) session lookup

    // BST index: sort videos by date O(log n) range queries
    this.videosByDate = new BST((a, b) => {
      const da = new Date(a), db = new Date(b);
      return da < db ? -1 : da > db ? 1 : 0;
    });

    // BST index: sort videos by view count
    this.videosByViews = new BST((a, b) => a - b);

    // LRU cache for frequently accessed video metadata
    this.videoCache = new LRUCache(50);

    this._seed();
  }

  _seed() {
    RAW_VIDEOS.forEach(v => {
      this.videos.set(v.id, { ...v });
      this.videosByDate.insert(v.uploadedAt, v.id);
      this.videosByViews.insert(v.views, v.id);
    });
    RAW_USERS.forEach(u => this.users.set(u.id, { ...u }));
  }

  // O(1) with cache
  getVideo(id) {
    const cached = this.videoCache.get(id);
    if (cached) return cached;
    const video = this.videos.get(id);
    if (video) this.videoCache.put(id, video);
    return video || null;
  }

  getAllVideos() { return this.videos.values(); }
  getUser(id)   { return this.users.get(id) || null; }
  getAllUsers()  { return this.users.values(); }

  updateVideo(id, changes) {
    const video = this.videos.get(id);
    if (!video) return null;
    Object.assign(video, changes);
    this.videos.set(id, video);
    this.videoCache.put(id, video); // keep cache fresh
    return video;
  }

  addVideo(video) {
    this.videos.set(video.id, video);
    this.videosByDate.insert(video.uploadedAt, video.id);
    this.videosByViews.insert(video.views, video.id);
    return video;
  }

  cacheStats() { return this.videoCache.stats(); }
}

const db = new ViewTubeDB();
module.exports = { db, RAW_VIDEOS, RAW_USERS };
