// ============================================================
//  ViewTube – app.js  (Home Page)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  const grid = document.getElementById('videoGrid');
  const menuBtn = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  const API_BASE = 'http://localhost:3000';

  // ── Render video grid ──────────────────────────────────
  function renderGrid(videos) {
    grid.innerHTML = '';

    if (!videos || videos.length === 0) {
      grid.innerHTML = `<p style="padding:20px;">No videos found</p>`;
      return;
    }

    videos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'video-card';

      const validThumbnail = typeof v.thumbnail === 'string' && /^(https?:\/\/|\/|data:image\/)\S+/.test(v.thumbnail);
      const thumbnailUrl = validThumbnail ? v.thumbnail : 'https://via.placeholder.com/320x180?text=Video';
      const thumbnailAlt = v.title ? `${v.title} thumbnail` : 'Video thumbnail';

      card.innerHTML = `
      <div class="thumbnail-wrap">
        <img src="${thumbnailUrl}" class="thumbnail" alt="${thumbnailAlt}" onerror="this.src='https://via.placeholder.com/320x180?text=Video';" />
        <div class="thumbnail-placeholder" style="display: none;">${v.icon || '🎬'}</div>
        <div class="hover-overlay">
          <span class="material-icons">play_arrow</span>
        </div>
      </div>
      <div class="card-info">
        <p>${v.title || 'Untitled'}</p>
        <p>${v.channel || 'Unknown channel'}</p>
      </div>`;

      card.addEventListener('click', () => {
        window.location.href = `watch.html?id=${encodeURIComponent(v.id)}`;
      });
      grid.appendChild(card);
    });
  }


  // ── Load Trending (SAFE VERSION) ───────────────────────
  async function loadTrending() {
    try {
      console.log("Fetching trending videos...");

      const res = await fetch(`${API_BASE}/trending`);
      if (!res.ok) {
        throw new Error(`Trending API returned ${res.status}`);
      }

      const data = await res.json();
      console.log("API response:", data);

      // Normalize a variety of response shapes
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      } else if (Array.isArray(data.videos)) {
        list = data.videos;
      } else if (Array.isArray(data.trending)) {
        list = data.trending;
      }

      if (!list.length && window.videosData && Array.isArray(window.videosData)) {
        console.warn('Falling back to local window.videosData');
        list = window.videosData;
      }

      const getThumbnail = raw => {
        if (typeof raw !== 'string') return 'https://via.placeholder.com/320x180?text=Video';
        return /^(https?:\/\/|\/|data:image\/)\S+/.test(raw)
          ? raw
          : 'https://via.placeholder.com/320x180?text=Video';
      };

      const normalizeId = raw => {
        if (raw == null) return 'unknown';
        const str = String(raw);
        const numeric = parseInt(str.replace(/\D/g, ''), 10);
        if (!Number.isNaN(numeric) && numeric > 0) return numeric;
        return str;
      };

      const videos = list.map(v => ({
        id: normalizeId(v.id || v.videoId || 'unknown'),
        title: v.title || 'No title',
        channel: v.channel || v.channelName || 'Unknown',
        views: v.views != null ? v.views : '0 views',
        thumbnail: getThumbnail(v.thumbnail || v.icon || v.avatar),
        date: v.date || 'Today',
        duration: v.duration || '00:00',
        isLive: !!v.isLive,
        icon: v.icon || '🎬',
        videoUrl: v.videoUrl || 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'
      }));

      renderGrid(videos);

    } catch (error) {
      console.error("ERROR:", error);
      grid.innerHTML = `<p style="color:red;">Failed to load videos</p>`;
    }
  }

  // ── Sidebar toggle ─────────────────────────────────────
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
      }
    });
  }

  const refreshBtn = document.getElementById('refreshBtn');

  //  Refresh button functionality 
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const iconEl = refreshBtn.querySelector('.material-icons');
      const textEl = refreshBtn.querySelector('span:last-child');
      const originalIcon = iconEl ? iconEl.textContent : 'refresh';
      const originalText = textEl ? textEl.textContent : 'Refresh';

      if (iconEl) {
        iconEl.textContent = 'refresh';
        iconEl.style.animation = 'spin 1s linear infinite';
      }
      if (textEl) textEl.textContent = 'Refreshing...';
      refreshBtn.disabled = true;

      try {
        await loadTrending();
        if (iconEl) {
          iconEl.textContent = 'check';
          iconEl.style.animation = '';
        }
        if (textEl) textEl.textContent = 'Updated!';
      } catch (error) {
        console.error('Refresh failed:', error);
        if (iconEl) {
          iconEl.textContent = 'error';
          iconEl.style.animation = '';
        }
        if (textEl) textEl.textContent = 'Failed';
      } finally {
        setTimeout(() => {
          if (iconEl) iconEl.textContent = originalIcon;
          if (textEl) textEl.textContent = originalText;
          refreshBtn.disabled = false;
        }, 1400);
      }
    });
  }

  //  Real-time trending updates
  // ── Real-time trending updates (every 5 minutes) ───────
  let trendingInterval;
  function startRealTimeUpdates() {
    // Clear any existing interval
    if (trendingInterval) clearInterval(trendingInterval);
    
    // Update every 5 minutes (300000 ms)
    trendingInterval = setInterval(async () => {
      try {
        console.log('Auto-refreshing trending videos...');
        await loadTrending();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 300000);
  }

  // ── Search (TEMP placeholder) ──────────────────────────
  function doSearch() {
    const q = searchInput.value.trim();
    console.log("Search clicked:", q);
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', doSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch();
    });
  }

  // ── INITIAL LOAD ───────────────────────────────────────
  loadTrending();
  startRealTimeUpdates();

});
