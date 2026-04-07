// ============================================================
 //  ViewTube – Clean App.js (Home Grid) 
//  Minimal code: Local data + thumbs + grid render
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('videoGrid');
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const refreshBtn = document.getElementById('refreshBtn');

  // Sidebar toggle
  menuToggle?.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

  // Thumbs pool
const getThumb = (videoId, category = 'coding') => {
    if (!window.THUMBNAILS) return 'https://via.placeholder.com/320x180/333/fff?text=Video';
    return window.THUMBNAILS[videoId] || (window.THUMBNAILS[category] ? window.THUMBNAILS[category][Math.floor(Math.random() * window.THUMBNAILS[category].length)] : 'https://via.placeholder.com/320x180/333/fff?text=Video');
  };

  // Render grid
  const renderGrid = (videos) => {
    grid.innerHTML = '';
    if (!videos?.length) {
      grid.innerHTML = '<p style="padding:20px;color:var(--text-secondary);">Loading videos...</p>';
      return;
    }

    videos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.onclick = () => location.href = `watch.html?id=${v.id}`;
      card.style.cursor = 'pointer';

      card.innerHTML = `
        <div class="thumbnail-wrap">
          <img src="${getThumb(v.id, v.category)}" class="thumbnail" alt="${v.title}" onerror="this.style.background='linear-gradient(45deg, #ff6b6b, #4ecdc4); this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDljZGM0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VmlkZW88L3RleHQ+PC9zdmc%3D'; this.style.background='none'" />
          ${v.isLive ? '<span class="live-badge">LIVE</span>' : `<span class="duration-badge">${v.duration || '0:00'}</span>`}
          <div class="hover-overlay">
            <span class="material-icons">play_arrow</span>
          </div>
        </div>
        <div class="card-info">
          <p class="video-title">${v.title}</p>
          <p class="video-channel">${v.channel}</p>
          <p class="video-meta">${v.views} • ${v.date}</p>
        </div>`;
      grid.appendChild(card);
    });
  };

  // Load data
  const loadVideos = async () => {
    let videos = window.videosData || [];
    renderGrid(videos);
    
    // Optional API trending (no error block)
    try {
      const res = await fetch('http://localhost:3001/trending');
      if (res.ok) {
        const data = await res.json();
        const trending = Array.isArray(data.data) ? data.data : data;
        renderGrid(trending);
      }
    } catch {}
  };

  // Refresh btn
  refreshBtn?.addEventListener('click', () => {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<span class="material-icons">refresh</span> Refreshing...';
    setTimeout(loadVideos, 500);
    setTimeout(() => {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span class="material-icons">refresh</span> <span>Refresh</span>';
    }, 1500);
  });

  // Initial load
  loadVideos();
});
