// ============================================================
//  ViewTube – watch.js  (Watch / Player Page)
// ============================================================

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  // ── Get video id from URL ────────────────────────────────
  const params  = new URLSearchParams(window.location.search);
  const rawId   = params.get('id');

  const selectedVideoFromId = () => {
    if (!rawId || !window.videosData) {
      console.warn('No rawId or videosData available');
      return null;
    }
    console.log('Looking for video with rawId:', rawId);
    
    // Exact string match first (e.g. 'v1')
    let v = window.videosData.find(item => item.id === rawId);
    if (v) {
      console.log('Found exact match:', v.title);
      return v;
    }
    
    // Numeric parse fallback (strip non-digits)
    const parsedNum = parseInt(rawId.replace(/\D/g, ''), 10);
    if (!Number.isNaN(parsedNum)) {
      v = window.videosData.find(item => {
        const itemNum = parseInt(item.id.replace(/\D/g, ''), 10);
        return itemNum === parsedNum;
      });
      if (v) {
        console.log('Found numeric match:', v.title);
        return v;
      }
    }
    
    // Fallback to first video
    console.warn('No video found for ID:', rawId, '- using first video');
    return window.videosData[0];
  };  


  // Try to get video from API first, fallback to local data
  let video = null;

  loadVideo();

  function populateVideoInfo() {
    console.log('Populating video info for:', video ? video.title : 'null video');
    
    if (!video) {
      console.error('No video data available');
      return;
    }

    // ── DOM refs ─────────────────────────────────────────────
    const watchTitle       = document.getElementById('watchTitle');
    const watchViews       = document.getElementById('watchViews');
    const watchDate        = document.getElementById('watchDate');
    const likeCount        = document.getElementById('likeCount');
    const likeBtn          = document.getElementById('likeBtn');
    const dislikeBtn       = document.getElementById('dislikeBtn');
    const watchChannelName = document.getElementById('watchChannelName');
    const watchSubs        = document.getElementById('watchSubs');
    const channelAvatarBig = document.getElementById('channelAvatarBig');
    const videoDescription = document.getElementById('videoDescription');
    const playerTitle      = document.getElementById('playerTitle');
    const commentCount     = document.getElementById('commentCount');
    const commentsList     = document.getElementById('commentsList');
    const commentInput     = document.getElementById('commentInput');
    const commentSubmit    = document.getElementById('commentSubmit');
    const subscribeBtn     = document.getElementById('subscribeBtn');
    const showMoreBtn      = document.getElementById('showMoreBtn');
    const recommendedList  = document.getElementById('recommendedList');
    const playPauseBtn     = document.getElementById('playPauseBtn');
    const muteBtn          = document.getElementById('muteBtn');
    const progressFill     = document.getElementById('progressFill');
    const menuToggle       = document.getElementById('menuToggle');
    const sidebar          = document.getElementById('sidebar');

    // ── Populate video info ──────────────────────────────────
    document.title = `${video.title} – ViewTube`;
    watchTitle.textContent       = video.title;
    watchViews.textContent       = video.views;
    watchDate.textContent        = video.date || new Date(video.uploadedAt).toLocaleDateString();
    likeCount.textContent        = formatLikes(video.likes);
    watchChannelName.textContent = video.channel;
    watchSubs.textContent        = `${video.subs || '1M'} subscribers`;
    playerTitle.textContent      = video.title;
    channelAvatarBig.textContent = video.avatar || video.channel[0];
    channelAvatarBig.style.background = video.color || '#1565c0';

    // ── Video playback (actual stream)
    const videoPlayerContainer = document.getElementById('videoPlayer');
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    if (videoPlaceholder) videoPlaceholder.style.display = 'none';

    // Clear any existing video elements
    videoPlayerContainer.innerHTML = '';

    // Check for YouTube embed
    if (video.youtubeId) {
      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.src = video.videoUrl;
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.borderRadius = 'var(--radius-lg)';
      videoPlayerContainer.appendChild(iframe);
      console.log('YouTube player loaded:', video.title);
      return;
    }

    // Fallback HTML5 video
    const videoUrl = video.videoUrl || 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';
    const playerElement = document.createElement('video');
    playerElement.id = 'videoElement';
    playerElement.controls = true;
    playerElement.autoplay = true;
    playerElement.muted = true;
    playerElement.loop = false;
    playerElement.width = '100%';
    playerElement.height = '100%';
    playerElement.style.width = '100%';
    playerElement.style.height = '100%';
    playerElement.style.objectFit = 'contain';
    playerElement.src = videoUrl;
    playerElement.poster = video.thumbnail || '';
    playerElement.alt = video.title;
    playerElement.setAttribute('playsinline', '');
    playerElement.setAttribute('preload', 'metadata');
    playerElement.addEventListener('loadstart', () => console.log('Video loading:', video.title));
    playerElement.addEventListener('error', (e) => {
      console.error('Video load error:', e);
    });
    videoPlayerContainer.appendChild(playerElement);


    // Description
    const descFull  = (video.description || 'No description available.').trim();
    const descShort = descFull.length > 200 ? descFull.slice(0, 200) + '…' : descFull;
    let descOpen    = false;

    const updateDescription = (text) => {
      if (!videoDescription) return;
      videoDescription.style.whiteSpace = 'pre-line';
      videoDescription.textContent = text;
    };

    updateDescription(descShort);

    // Reset show more button state before assigning new event handler
    if (showMoreBtn) {
      showMoreBtn.style.display = 'none';
      showMoreBtn.textContent = 'Show more';
      showMoreBtn.onclick = null;
    }

    if (descFull.length > 200 && showMoreBtn) {
      showMoreBtn.style.display = 'block';
      showMoreBtn.onclick = () => {
        descOpen = !descOpen;
        updateDescription(descOpen ? descFull : descShort);
        showMoreBtn.textContent = descOpen ? 'Show less' : 'Show more';
      };
    } else {
      showMoreBtn.style.display = 'none';
    }

    // ── Like / Dislike ───────────────────────────────────────
    let liked    = false;
    let disliked = false;
    let likes    = video.likes;

    likeBtn.addEventListener('click', () => {
      liked = !liked;
      if (liked) { disliked = false; dislikeBtn.classList.remove('active'); likes++; }
      else { likes--; }
      likeCount.textContent = formatLikes(likes);
      likeBtn.classList.toggle('active', liked);
      showToast(liked ? '👍 You liked this video' : 'Like removed');
    });

    dislikeBtn.addEventListener('click', () => {
      disliked = !disliked;
      if (disliked) { liked = false; likeBtn.classList.remove('active'); likes = video.likes; likeCount.textContent = formatLikes(likes); }
      dislikeBtn.classList.toggle('active', disliked);
      showToast(disliked ? '👎 Disliked' : 'Dislike removed');
    });

    // ── Subscribe ────────────────────────────────────────────
    let subscribed = false;
    subscribeBtn.addEventListener('click', () => {
      subscribed = !subscribed;
      subscribeBtn.textContent = subscribed ? 'Subscribed ✓' : 'Subscribe';
      subscribeBtn.classList.toggle('subscribed', subscribed);
      showToast(subscribed ? `Subscribed to ${video.channel}!` : 'Unsubscribed');
    });

    // ── Share functionality ───────────────────────────────────
    const shareBtn = document.querySelector('[data-action="share"]');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const videoUrl = window.location.href;
        const videoTitle = video.title;
        
        if (navigator.share) {
          // Use Web Share API if available
          try {
            await navigator.share({
              title: videoTitle,
              text: `Check out this video: ${videoTitle}`,
              url: videoUrl
            });
            showToast('Shared successfully!');
          } catch (error) {
            if (error.name !== 'AbortError') {
              fallbackShare(videoUrl, videoTitle);
            }
          }
        } else {
          fallbackShare(videoUrl, videoTitle);
        }
      });
    }

    function fallbackShare(url, title) {
      // Copy to clipboard as fallback
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link copied to clipboard!');
        }).catch(() => {
          showToast('Share not supported on this device');
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          showToast('Link copied to clipboard!');
        } catch (error) {
          showToast('Share not supported on this device');
        }
        document.body.removeChild(textArea);
      }
    }

    // ── Save to playlist functionality ───────────────────────
    const saveBtn = document.querySelector('[data-action="save"]');
    if (saveBtn) {
      // Check if already saved
      const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
      const isAlreadySaved = savedVideos.some(v => v.id === video.id);
      if (isAlreadySaved) {
        saveBtn.querySelector('span:last-child').textContent = 'Saved';
      }
      
      saveBtn.addEventListener('click', () => {
        const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
        const isAlreadySaved = savedVideos.some(v => v.id === video.id);
        
        if (isAlreadySaved) {
          // Remove from saved
          const updated = savedVideos.filter(v => v.id !== video.id);
          localStorage.setItem('savedVideos', JSON.stringify(updated));
          showToast('Removed from Watch Later');
          saveBtn.querySelector('span:last-child').textContent = 'Save';
        } else {
          // Add to saved
          savedVideos.push({
            id: video.id,
            title: video.title,
            channel: video.channel,
            thumbnail: video.thumbnail,
            savedAt: new Date().toISOString()
          });
          localStorage.setItem('savedVideos', JSON.stringify(savedVideos));
          showToast('Added to Watch Later');
          saveBtn.querySelector('span:last-child').textContent = 'Saved';
        }
      });
    }

    // ── Comments ─────────────────────────────────────────────
    const comments = [...(video.comments || [])];

    function renderComments() {
      commentCount.textContent = comments.length;
      commentsList.innerHTML = comments.map((c, i) => `
        <div class="comment-item" id="cmt-${i}">
          <div class="avatar small" style="background:${randomColor(c.author)}">${c.author[0]}</div>
          <div class="comment-body">
            <p class="comment-author">${c.author} <span style="color:var(--text-secondary);font-weight:400;font-size:12px">${c.time}</span></p>
            <p class="comment-text">${c.text}</p>
            <div class="comment-actions">
              <button class="comment-action-btn" onclick="likeComment(${i})">
                <span class="material-icons">thumb_up</span> ${c.likes}
              </button>
              <button class="comment-action-btn">
                <span class="material-icons">thumb_down</span>
              </button>
              <button class="comment-action-btn">Reply</button>
            </div>
          </div>
        </div>`).join('');
    }
    renderComments();

    window.likeComment = (i) => {
      comments[i].likes++;
      renderComments();
    };

    // Show submit button when typing
    commentInput.addEventListener('input', () => {
      commentSubmit.classList.toggle('visible', commentInput.value.trim().length > 0);
    });

    commentSubmit.addEventListener('click', () => {
      const text = commentInput.value.trim();
      if (!text) return;
      comments.unshift({ author: 'You', text, likes: 0, time: 'Just now' });
      commentInput.value = '';
      commentSubmit.classList.remove('visible');
      renderComments();
      showToast('Comment posted!');
    });

    // ── Recommended Videos ───────────────────────────────────
    async function loadRecommended() {
      try {
        const res = await fetch(`${API_BASE}/recommendations/video/${rawId}?limit=10`);
        if (!res.ok) throw new Error(`Recommendations API returned ${res.status}`);
        const data = await res.json();
        const recs = Array.isArray(data) ? data : data.data || [];
        
        recommendedList.innerHTML = recs.map(v => {
          const validThumbnail = typeof v.thumbnail === 'string' && /^(https?:\/\/|\/|data:image\/)\S+/.test(v.thumbnail);
          const thumbnailUrl = validThumbnail ? v.thumbnail : 'https://via.placeholder.com/160x90?text=Video';
          const thumbnailAlt = v.title ? `${v.title} thumbnail` : 'Video thumbnail';
          return `
          <div class="rec-card" onclick="window.location.href='watch.html?id=${encodeURIComponent(v.id)}'">
            <div class="rec-thumb">
              <img src="${thumbnailUrl}" class="rec-thumbnail" alt="${thumbnailAlt}" onerror="this.src='https://via.placeholder.com/160x90?text=Video';" />
              ${v.isLive
                ? `<span class="live-badge" style="font-size:10px;padding:1px 5px">LIVE</span>`
                : `<span class="duration-badge" style="font-size:11px">${v.duration || '0:00'}</span>`}
            </div>
            <div class="rec-info">
              <p class="rec-title">${v.title || 'Untitled'}</p>
              <p class="rec-channel">${v.channel || 'Unknown'}</p>
              <p class="rec-stats">${v.views || '0 views'} • ${v.date || 'Unknown'}</p>
            </div>
          </div>`;
        }).join('');
      } catch (err) {
        console.error('Failed to load recommendations:', err);
        // Fallback to local data
        const others = window.videosData.filter(v => v.id !== rawId);
        recommendedList.innerHTML = others.slice(0, 10).map(v => {
          const validThumbnail = typeof v.thumbnail === 'string' && v.thumbnail;
          const thumbnailUrl = validThumbnail ? v.thumbnail : 'https://via.placeholder.com/160x90?text=Video';
          const thumbnailAlt = v.title ? `${v.title} thumbnail` : 'Video thumbnail';
          return `
          <div class="rec-card" onclick="window.location.href='watch.html?id=${encodeURIComponent(v.id)}'">
            <div class="rec-thumb">
              <img src="${thumbnailUrl}" class="rec-thumbnail" alt="${thumbnailAlt}" 
                   onerror="this.onerror=null; this.src='https://via.placeholder.com/160x90/333/fff?text=${encodeURIComponent(v.icon || 'V')}';" 
                   loading="lazy" />
              ${v.isLive
                ? `<span class="live-badge" style="font-size:10px;padding:1px 5px">LIVE</span>`
                : v.duration ? `<span class="duration-badge" style="font-size:11px">${v.duration}</span>` : ''}
            </div>
            <div class="rec-info">
              <p class="rec-title">${v.title}</p>
              <p class="rec-channel">${v.channel}</p>
              <p class="rec-stats">${v.views} • ${v.date}</p>
            </div>
          </div>`;
        }).join('');

      }
    }
    loadRecommended();

    // ── Fake player controls ─────────────────────────────────
    let playing = false;
    let muted   = false;
    let progress = 35;

    playPauseBtn.addEventListener('click', () => {
      playing = !playing;
      playPauseBtn.querySelector('.material-icons').textContent = playing ? 'pause' : 'play_arrow';
      if (playing) animateProgress();
    });

    function animateProgress() {
      if (!playing) return;
      progress = Math.min(progress + 0.1, 100);
      progressFill.style.width = progress + '%';
      if (progress < 100) requestAnimationFrame(animateProgress);
      else { playing = false; playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow'; }
    }

    muteBtn.addEventListener('click', () => {
      muted = !muted;
      muteBtn.querySelector('.material-icons').textContent = muted ? 'volume_off' : 'volume_up';
    });

    // ── Sidebar toggle ───────────────────────────────────────
    menuToggle.addEventListener('click', () => {
      if (window.innerWidth <= 768) sidebar.classList.toggle('mobile-open');
      else sidebar.classList.toggle('collapsed');
    });

    // ── Helpers ──────────────────────────────────────────────
    function formatLikes(n) {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
      return n.toString();
    }

    function randomColor(str) {
      const palette = ['#d32f2f','#1565c0','#2e7d32','#6a1b9a','#e65100','#00695c','#ad1457','#0277bd'];
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      return palette[Math.abs(hash) % palette.length];
    }

    // Toast
    let toastTimer;
    function showToast(msg) {
      let toast = document.querySelector('.toast');
      if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
    }
  }

  async function loadVideo() {
    video = null; // Reset video
    console.log('Loading video with ID:', rawId);
    
    // PRIORITIZE local data for reliability (fix description not changing)
    video = selectedVideoFromId();
    
    // Optional API try-after local
    try {
      const res = await fetch(`${API_BASE}/videos/${rawId}`);
      if (res.ok) {
        const data = await res.json();
        const apiVideo = data.data || data;
        if (apiVideo.title && apiVideo.description) {
          // Merge API data if richer
          video = { ...video, ...apiVideo };
          console.log('Merged API video:', video.title);
        }
      }
    } catch (err) {
      console.warn('API unavailable - using local data:', err.message);
    }
    
    if (!video) {
      video = window.videosData[0];
      console.warn('Ultimate fallback to first video');
    }
    
    console.log('Final video loaded:', video.title, 'Desc preview:', video.description?.slice(0, 50));
    populateVideoInfo();
  }

});
