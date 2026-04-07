// ============================================================
 //  ViewTube – Clean Watch.js (Video Player)
 //  Minimal: Load video, play, controls
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = 'http://localhost:3001'; // Fixed
  const params = new URLSearchParams(location.search);
  const videoId = params.get('id') || 'v1';

  // DOM
  const title = document.getElementById('watchTitle');
  const playerContainer = document.getElementById('videoPlayer');
  const channelName = document.getElementById('watchChannelName');
  const views = document.getElementById('watchViews');
  const date = document.getElementById('watchDate');

  // Load video data
  let video = window.videosData?.find(v => v.id === videoId) || window.videosData[0];
  
  // Fallback API if local missing
  try {
    const res = await fetch(`${API_BASE}/videos/${videoId}`);
    if (res.ok) {
      const apiVideo = await res.json();
      video = { ...video, ...apiVideo.data };
    }
  } catch {}

  // Populate
  document.title = `${video.title} – ViewTube`;
  title.textContent = video.title;
  channelName.textContent = video.channel;
  views.textContent = video.views;
  date.textContent = video.date || new Date().toLocaleDateString();

  // Player
  playerContainer.innerHTML = '';
  const videoEl = document.createElement('video');
  videoEl.controls = true;
  videoEl.autoplay = false;
  videoEl.src = `${API_BASE}${video.videoUrl}`;
  videoEl.poster = video.thumbnail || '';
  videoEl.style.width = '100%';
  videoEl.style.height = '100%';
  videoEl.style.objectFit = 'contain';
  videoEl.style.background = '#000';
  playerContainer.appendChild(videoEl);

  videoEl.addEventListener('error', e => {
    console.error('Video error:', e);
    playerContainer.innerHTML = '<p style="color:red;">Video failed to load. Check console.</p>';
  });

  console.log('Video loaded:', video.title, 'URL:', videoEl.src);
});
