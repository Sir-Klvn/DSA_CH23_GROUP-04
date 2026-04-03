// FIXED db.js - Backend Video Loading Ready
// Copy this to db.js if needed

const { HashTable, BST, LRUCache } = require('./data-structures');

const RAW_VIDEOS = [
  { id:'v1',  title:"Building a Full-Stack App with React & Node.js in 2024", channel:'CodeWithMe', channelId:'ch1', views:1200000, likes:48200, comments:1240, shares:3200, category:'coding', tags:['react','nodejs','fullstack','javascript','tutorial'], duration:2538, uploadedAt:'2024-01-20T10:00:00Z', description:'Learn to build a production-grade full-stack application from scratch.', thumbnail:'https://picsum.photos/320/180?random=1', videoUrl: '/stream/v1_720p.mp4' },
  { id:'v2',  title:"10 JavaScript Tricks You Didn't Know Existed", channel:'TechWorld', channelId:'ch2', views:4700000, likes:182000, comments:5600, shares:28000, category:'coding', tags:['javascript','tips','tricks','webdev','programming'], duration:944, uploadedAt:'2024-01-14T08:00:00Z', description:'Mind-blowing JavaScript features most developers never use.', thumbnail:'https://picsum.photos/320/180?random=2', videoUrl: '/stream/v2_720p.mp4' },
  { id:'v3',  title:'Lo-fi Hip Hop Radio – Beats to Study/Relax', channel:'ChillVibes', channelId:'ch3', views:12000000, likes:520000, comments:18000, shares:95000, category:'music', tags:['lofi','music','study','relax','chill','beats'], duration:null, uploadedAt:'2023-11-01T00:00:00Z', description:'24/7 lo-fi beats for focus and relaxation.', thumbnail:'https://picsum.photos/320/180?random=3', videoUrl: '/stream/v3_720p.mp4', isLive:true },
  { id:'v4',  title:'The Most Beautiful Places on Earth 4K', channel:'NatureHub', channelId:'ch4', views:8900000, likes:340000, comments:12000, shares:67000, category:'travel', tags:['nature','4k','travel','earth','landscape','scenery'], duration:1682, uploadedAt:'2023-08-10T12:00:00Z', description:'Journey through breathtaking landscapes in stunning 4K.', thumbnail:'https://picsum.photos/320/180?random=4', videoUrl: '/stream/v4_720p.mp4' },
  // Add other videos similarly with proper spacing & single quotes
  // v5-v25 abbreviated for demo
];

const RAW_USERS = [
  { id:'u1', username:'alex_dev', watchHistory:['v1','v2','v9','v13'], liked:['v2','v9'], subscriptions:['ch1','ch2'] },
  // ... other users
];

class ViewTubeDB {
  constructor() {
    this.videos   = new HashTable(64);
  // ... rest of class as original
    this._seed();
  }

  _seed() {
    RAW_VIDEOS.forEach(v => this.videos.set(v.id, { ...v }));
    RAW_USERS.forEach(u => this.users.set(u.id, { ...u }));
  }

  getVideo(id) { return this.videos.get(id) || null; }
  getAllVideos() { return this.videos.values(); }
}

const db = new ViewTubeDB();
module.exports = { db, RAW_VIDEOS, RAW_USERS };

