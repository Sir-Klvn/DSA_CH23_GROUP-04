// FIXED db.js - Backend Video Loading Ready
const { HashTable, BST, LRUCache } = require('./data-structures');

const RAW_VIDEOS = [
  { id:'v1', title:"Building a Full-Stack App with React & Node.js in 2024", channel:'CodeWithMe', channelId:'ch1', views:1200000, likes:48200, comments:1240, shares:3200, category:'coding', tags:['react','nodejs','fullstack','javascript','tutorial'], duration:2538, uploadedAt:'2024-01-20T10:00:00Z', description:'Learn to build a production-grade full-stack application from scratch.', thumbnail:'https://i.ytimg.com/vi/eIrMbAcyC2g/mqdefault.jpg', videoUrl: '/stream/v1_720p.mp4' },
  { id:'v2', title:"10 JavaScript Tricks You Didn't Know Existed", channel:'TechWorld', channelId:'ch2', views:4700000, likes:182000, comments:5600, shares:28000, category:'coding', tags:['javascript','tips','tricks','webdev','programming'], duration:944, uploadedAt:'2024-01-14T08:00:00Z', description:'Mind-blowing JavaScript features most developers never use.', thumbnail:'https://i.ytimg.com/vi/eIrMbAcyC2g/mqdefault.jpg', videoUrl: '/stream/v2_720p.mp4' },
  { id:'v3', title:'Lo-fi Hip Hop Radio – Beats to Study/Relax', channel:'ChillVibes', channelId:'ch3', views:12000000, likes:520000, comments:18000, shares:95000, category:'music', tags:['lofi','music','study','relax','chill','beats'], duration:null, uploadedAt:'2023-11-01T00:00:00Z', description:'24/7 lo-fi beats for focus and relaxation.', thumbnail:'https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg', videoUrl: '/stream/v3_720p.mp4', isLive:true },
  { id:'v4', title:'The Most Beautiful Places on Earth 4K', channel:'NatureHub', channelId:'ch4', views:8900000, likes:340000, comments:12000, shares:67000, category:'travel', tags:['nature','4k','travel','earth','landscape','scenery'], duration:1682, uploadedAt:'2023-08-10T12:00:00Z', description:'Journey through breathtaking landscapes in stunning 4K.', thumbnail:'https://i.ytimg.com/vi/VB1s_uMWXno/mqdefault.jpg', videoUrl: '/stream/v4_720p.mp4' },
  { id:'v5', title:"Dark Souls III All Bosses No Hit", channel:'GamingLore', channelId:'ch5', views:2100000, likes:89000, comments:9800, shares:12000, category:'gaming', tags:['darksouls','gaming','bossfight','speedrun'], duration:3273, uploadedAt:'2024-01-08T15:00:00Z', description:'Perfect boss runs.', thumbnail:'https://i.ytimg.com/vi/UBj24cc9NwE/mqdefault.jpg', videoUrl: '/stream/v5_720p.mp4' },
  { id:'v6', title:"Python for Data Science Complete Course", channel:'DataMasters', channelId:'ch6', views:3400000, likes:125000, comments:4500, shares:21000, category:'coding', tags:['python','datascience','pandas','numpy','tutorial'], duration:18920, uploadedAt:'2024-01-02T09:00:00Z', description:'10-hour deep dive.', thumbnail:'https://i.ytimg.com/vi/zKy91o-1D4U/mqdefault.jpg', videoUrl: '/stream/v6_720p.mp4' },
  { id:'v7', title:"8 Tips for Low-Latency Node.js Streaming", channel:'LatencyLab', channelId:'ch7', views:1450000, likes:24500, comments:4300, shares:6200, category:'coding', tags:['nodejs','performance','networking','streaming','tips'], duration:860, uploadedAt:'2024-03-15T09:30:00Z', description:'Learn how to optimize Node.js stream workflows for production traffic.', thumbnail:'https://i.ytimg.com/vi/H7yTUjYOcYg/mqdefault.jpg', videoUrl:'/stream/v7_720p.mp4' },
  { id:'v8', title:"5-Minute Guitar Practice Routine", channel:'ToneRight', channelId:'ch8', views:980000, likes:52000, comments:1800, shares:2300, category:'music', tags:['guitar','music','practice','lesson'], duration:300, uploadedAt:'2024-02-28T14:00:00Z', description:'Fast-lived guitar practice session to improve finger independence.', thumbnail:'https://i.ytimg.com/vi/8uY5pCNujt8/mqdefault.jpg', videoUrl:'/stream/v8_720p.mp4' },
  { id:'v9', title:"Travel Hacks for the First-Time Backpacker", channel:'GlobeTrotter', channelId:'ch9', views:1320000, likes:67000, comments:5200, shares:7600, category:'travel', tags:['travel','backpacking','hacks','budget'], duration:1200, uploadedAt:'2024-02-10T07:20:00Z', description:'Essential practical tips for backpacking safely and efficiently.', thumbnail:'https://i.ytimg.com/vi/_uQrJ0TkZlc/mqdefault.jpg', videoUrl:'/stream/v9_720p.mp4' },
  { id:'v10', title:"Microgarden Ideas for Small Apartments", channel:'GreenCorner', channelId:'ch10', views:540000, likes:32000, comments:2400, shares:2900, category:'lifestyle', tags:['gardening','urban','apartment','microgarden'], duration:980, uploadedAt:'2024-03-05T18:10:00Z', description:'Create a small indoor garden in limited space with easy-to-follow hacks.', thumbnail:'https://i.ytimg.com/vi/1Nrg1MH4L_g/mqdefault.jpg', videoUrl: '/stream/v10_720p.mp4' },
  { id:'v11', title:"Beginner Yoga Flow for Flexibility", channel:'ZenMoves', channelId:'ch11', views:755000, likes:40200, comments:3300, shares:4500, category:'fitness', tags:['yoga','flexibility','beginner','wellness'], duration:1100, uploadedAt:'2024-01-30T10:00:00Z', description:'A calm, guided flow designed to improve flexibility and reduce stiffness.', thumbnail:'https://i.ytimg.com/vi/5E2YIfWVk4E/mqdefault.jpg', videoUrl: '/stream/v11_720p.mp4' },
  { id:'v12', title:"The Future of AI in Everyday Apps", channel:'AIInsider', channelId:'ch12', views:2023000, likes:115000, comments:7200, shares:9000, category:'technology', tags:['ai','machinelearning','future','startup'], duration:1760, uploadedAt:'2024-03-08T12:45:00Z', description:'A concise overview of practical AI features coming to consumer applications.', thumbnail:'https://i.ytimg.com/vi/X33V9Nl_7GQ/mqdefault.jpg', videoUrl: '/stream/v12_720p.mp4' },
  { id:'v13', title:"Classic Rock Hits Playlist", channel:'MusicMasters', channelId:'ch13', views:3200000, likes:180000, comments:8500, shares:15000, category:'music', tags:['rock','classic','playlist','guitar'], duration:2400, uploadedAt:'2024-02-15T16:00:00Z', description:'A collection of the greatest rock songs of all time.', thumbnail:'https://i.ytimg.com/vi/4h8p6qM2iY0/mqdefault.jpg', videoUrl: '/stream/v13_720p.mp4' },
  { id:'v14', title:"Inception Movie Trailer", channel:'FilmTrailers', channelId:'ch14', views:15000000, likes:500000, comments:25000, shares:100000, category:'film', tags:['movie','trailer','sci-fi','thriller'], duration:148, uploadedAt:'2023-07-01T10:00:00Z', description:'Official trailer for the mind-bending sci-fi thriller Inception.', thumbnail:'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', videoUrl: '/stream/v14_720p.mp4' },
  { id:'v15', title:"Tom and Jerry Cartoon Compilation", channel:'CartoonClassics', channelId:'ch15', views:8500000, likes:300000, comments:12000, shares:25000, category:'cartoon', tags:['animation','funny','classic','cat','mouse'], duration:600, uploadedAt:'2023-12-01T12:00:00Z', description:'Hilarious compilation of Tom and Jerry adventures.', thumbnail:'https://i.ytimg.com/vi/5s9-vEjSvs8/mqdefault.jpg', videoUrl: '/stream/v15_720p.mp4' },
  { id:'v16', title:"Jazz Piano Improvisation", channel:'JazzLovers', channelId:'ch16', views:450000, likes:25000, comments:800, shares:1200, category:'music', tags:['jazz','piano','improvisation','instrumental'], duration:480, uploadedAt:'2024-03-20T20:00:00Z', description:'Beautiful jazz piano session with live improvisation.', thumbnail:'https://i.ytimg.com/vi/CZHVskdHuK4/mqdefault.jpg', videoUrl: '/stream/v16_720p.mp4' },
  { id:'v17', title:"The Dark Knight Rises Clip", channel:'MovieClips', channelId:'ch17', views:7200000, likes:280000, comments:15000, shares:35000, category:'film', tags:['batman','action','superhero','clip'], duration:300, uploadedAt:'2024-01-10T14:00:00Z', description:'Epic action scene from The Dark Knight Rises.', thumbnail:'https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg', videoUrl: '/stream/v17_720p.mp4' },
  { id:'v18', title:"Looney Tunes Best Moments", channel:'AnimationHub', channelId:'ch18', views:6200000, likes:220000, comments:9800, shares:18000, category:'cartoon', tags:['looney','tunes','bugs','bunny','fun'], duration:720, uploadedAt:'2023-11-15T11:00:00Z', description:'Greatest moments from classic Looney Tunes cartoons.', thumbnail:'https://i.ytimg.com/vi/TqL4-M3Djm8/mqdefault.jpg', videoUrl: '/stream/v18_720p.mp4' },
  { id:'v19', title:"Electronic Dance Music Mix", channel:'EDMBeats', channelId:'ch19', views:1800000, likes:95000, comments:4200, shares:8000, category:'music', tags:['edm','dance','electronic','mix'], duration:3600, uploadedAt:'2024-02-28T22:00:00Z', description:'High-energy EDM mix for the dance floor.', thumbnail:'https://i.ytimg.com/vi/3px_5z_1Jd4/mqdefault.jpg', videoUrl: '/stream/v19_720p.mp4' },
  { id:'v20', title:"Finding Nemo Underwater Scenes", channel:'PixarClips', channelId:'ch20', views:9500000, likes:350000, comments:18000, shares:40000, category:'cartoon', tags:['pixar','animation','ocean','adventure'], duration:420, uploadedAt:'2023-09-01T09:00:00Z', description:'Beautiful underwater animation from Finding Nemo.', thumbnail:'https://i.ytimg.com/vi/GiM5fjuI0LA/mqdefault.jpg', videoUrl: '/stream/v20_720p.mp4' }
  // Added more realistic videos for feature richness
];

const RAW_USERS = [
  { id:'u1', username:'alex_dev', watchHistory:['v1','v2','v9','v13'], liked:['v2','v9'], subscriptions:['ch1','ch2'] },
  { id:'u2', username:'gamer_pro', watchHistory:['v5','v10'], liked:['v5'], subscriptions:['ch5'] },
  { id:'u3', username:'music_lover', watchHistory:['v3'], liked:[], subscriptions:['ch3'] },
  { id:'u4', username:'traveler88', watchHistory:['v4'], liked:['v4'], subscriptions:['ch4'] }
];

class ViewTubeDB {
  constructor() {
    this.videos = new HashTable(64);
    this.users = new HashTable(32);
    this.cache = new LRUCache(50);
    this._seed();
  }

  _seed() {
    RAW_VIDEOS.forEach(v => this.videos.set(v.id, { ...v }));
    RAW_USERS.forEach(u => this.users.set(u.id, { ...u }));
  }

  getVideo(id) {
    let v = this.cache.get(`video:${id}`);
    if (!v) {
      v = this.videos.get(id);
      if (v) this.cache.put(`video:${id}`, v);
    }
    return v || null;
  }

  getAllVideos() { return this.videos.values(); }

  getUser(id) { return this.users.get(id) || null; }
  
  getUserByEmail(email) {
    return this.users.values().find(u => u.email === email) || null;
  }

  getAllUsers() { return this.users.values(); }

  updateVideo(id, updates) {
    const v = this.videos.get(id);
    if (v) {
      Object.assign(v, updates);
      this.cache.put(`video:${id}`, v);
      return v;
    }
    return null;
  }

  updateUser(id, updates) {
    const u = this.users.get(id);
    if (u) {
      Object.assign(u, updates);
      return u;
    }
    return null;
  }

  cacheStats() {
    return this.cache.stats();
  }
}

const db = new ViewTubeDB();
module.exports = { db, RAW_VIDEOS, RAW_USERS };

