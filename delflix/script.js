const CONTENT = [];

function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let HERO_ITEMS = [];

let heroIndex = 0;
let heroTimer = null;
let currentFilter = "all";

function getGradientBg(item) {
  return item.color;
}

function buildHero() {
  if (HERO_ITEMS.length === 0) {
    showEmptyHero();
    return;
  }
  const indicators = document.getElementById("heroIndicators");
  indicators.innerHTML = '';
  HERO_ITEMS.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'indicator' + (i === 0 ? ' active' : '');
    dot.onclick = () => setHero(i);
    indicators.appendChild(dot);
  });
  setHero(0);
}

function showEmptyHero() {
  const heroBg = document.getElementById("heroBg");
  heroBg.style.background = "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0f0a2a 100%)";
  heroBg.style.backgroundImage = '';
  document.getElementById("heroTitle").textContent = "Welcome to Delflix";
  document.getElementById("heroDesc").textContent = "No content uploaded yet. Visit the Admin Panel to upload your first movie, series or anime.";
  document.getElementById("heroBadge").textContent = "START HERE";
  document.getElementById("heroMeta").innerHTML = '';
  document.getElementById("heroIndicators").innerHTML = '';
  document.getElementById("heroPlayBtn").onclick = () => {};
  document.getElementById("heroInfoBtn").onclick = () => window.location.href = '/admin';
  document.getElementById("heroInfoBtn").innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
    </svg>
    Go to Admin`;
}

function setHero(index) {
  heroIndex = index;
  const item = HERO_ITEMS[index];

  const heroBg = document.getElementById("heroBg");
  heroBg.style.background = item.color;
  const bgImg = item.bannerUrl || item.thumbnail || item.imageUrl;
  if (bgImg) {
    heroBg.style.backgroundImage = `url('${bgImg}')`;
    heroBg.style.backgroundSize = 'cover';
    heroBg.style.backgroundPosition = 'center top';
  } else {
    heroBg.style.backgroundImage = '';
  }

  document.getElementById("heroTitle").textContent = item.title;
  document.getElementById("heroDesc").textContent = item.desc;
  document.getElementById("heroBadge").textContent =
    item.type === 'series' ? 'WEB SERIES' : item.type.toUpperCase();

  const meta = document.getElementById("heroMeta");
  meta.innerHTML = '';

  const ratingSpan = document.createElement('span');
  ratingSpan.className = 'rating';
  ratingSpan.textContent = `★ ${item.rating || '—'}`;
  meta.appendChild(ratingSpan);

  const yearSpan = document.createElement('span');
  yearSpan.textContent = item.year || '';
  meta.appendChild(yearSpan);

  const genreSpan = document.createElement('span');
  genreSpan.className = 'genre-tag';
  genreSpan.textContent = (item.genre || '').split(',')[0].trim();
  meta.appendChild(genreSpan);

  (item.tags || []).forEach(t => {
    const tagSpan = document.createElement('span');
    tagSpan.className = 'genre-tag';
    tagSpan.textContent = t;
    meta.appendChild(tagSpan);
  });

  document.querySelectorAll('.indicator').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  document.getElementById("heroPlayBtn").onclick = () => openPlayer(item);
  const infoBtn = document.getElementById("heroInfoBtn");
  infoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z"/></svg> More Info`;
  infoBtn.onclick = () => openModal(item);

  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    setHero((heroIndex + 1) % HERO_ITEMS.length);
  }, 6000);
}

function buildCards(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map(item => createCardHTML(item)).join('');
  container.querySelectorAll('.card').forEach((el, i) => {
    el.addEventListener('click', () => openModal(items[i]));
  });
}

function createCardHTML(item) {
  const safeType = escapeHTML(item.type);
  const badgeClass = `badge-${safeType}`;
  const badgeLabel = item.type === 'series' ? 'SERIES' : safeType.toUpperCase();
  const safeId = parseInt(item.id, 10) || 0;
  const posterImg = item.thumbnail || item.imageUrl;
  const posterStyle = posterImg
    ? `background: ${item.color}; background-image: url('${posterImg}'); background-size: cover; background-position: center;`
    : `background: ${item.color};`;
  return `
    <div class="card">
      <div class="card-poster">
        <div class="card-poster-bg" style="${posterStyle}"></div>
        <div class="card-poster-overlay"></div>
        <span class="card-type-badge ${badgeClass}">${badgeLabel}</span>
        <span class="card-rating">★ ${escapeHTML(item.rating)}</span>
        <div class="card-hover-info">
          <div class="card-play-btn" onclick="event.stopPropagation();openPlayer(CONTENT.find(c=>c.id===${safeId}))">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${escapeHTML(item.title)}</div>
        <div class="card-sub">
          <span>${escapeHTML(item.year)}</span>
          <span>${escapeHTML(item.genre.split(',')[0].trim())}</span>
        </div>
      </div>
    </div>
  `;
}

function slide(rowId, dir) {
  const container = document.getElementById(rowId);
  if (!container) return;
  const scrollAmt = container.offsetWidth * 0.7;
  container.scrollBy({ left: dir * scrollAmt, behavior: 'smooth' });
}

let _currentModalItem = null;

function openModal(item) {
  _currentModalItem = item;
  const overlay = document.getElementById("modalOverlay");
  const modalBg = document.getElementById("modalBg");
  const posterImg = item.bannerUrl || item.thumbnail || item.imageUrl;
  if (posterImg) {
    modalBg.style.background = item.color;
    modalBg.style.backgroundImage = `url('${posterImg}')`;
    modalBg.style.backgroundSize = 'cover';
    modalBg.style.backgroundPosition = 'center top';
  } else {
    modalBg.style.background = item.color;
    modalBg.style.backgroundImage = '';
  }
  document.getElementById("modalTitle").textContent = item.title;

  const badge = document.getElementById("modalBadge");
  badge.textContent = item.type === 'series' ? 'WEB SERIES' : item.type.toUpperCase();
  badge.className = `modal-badge badge-${item.type}`;

  document.getElementById("modalMeta").innerHTML = `
    <span>★ ${item.rating}</span>
    <span>${item.year}</span>
    ${item.tags.map(t => `<span>${t}</span>`).join('')}
  `;
  document.getElementById("modalDesc").textContent = item.desc;
  document.getElementById("modalGenre").textContent = item.genre;
  document.getElementById("modalRating").textContent = `★ ${item.rating} / 10`;
  document.getElementById("modalYear").textContent = item.year;
  document.getElementById("modalType").textContent =
    item.type === 'movie' ? 'Movie' : item.type === 'series' ? 'Web Series' : 'Anime';

  document.getElementById('modalPlayBtn').onclick = () => openPlayer(item);

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById("modalOverlay").classList.add('hidden');
  document.body.style.overflow = '';
}

/* ===== VIDEO PLAYER ===== */
let _pVideo = null;
let _pGain  = null;
let _pAudioCtx = null;
let _pHideTimer = null;

function openPlayer(item, overrideUrl) {
  if (!item) return;

  const overlay   = document.getElementById('playerOverlay');
  const stage     = document.getElementById('playerStage');
  const videoUrl  = overrideUrl || item.videoUrl || '';
  const poster    = item.bannerUrl || item.thumbnail || item.imageUrl || '';
  const isTrailer = !!overrideUrl;

  document.getElementById('playerTitle').textContent =
    isTrailer ? item.title + ' — Trailer' : item.title;
  document.getElementById('playerBadge').textContent =
    isTrailer ? 'TRAILER' : (item.type === 'series' ? 'WEB SERIES' : item.type.toUpperCase());

  stage.innerHTML = '';
  _pVideo = null; _pGain = null; _pAudioCtx = null;

  if (videoUrl && /\.(mp4|mkv|mov|webm|avi|flv|wmv|m4v|mpg|mpeg|3gp|ts|ogg)(\?|$)/i.test(videoUrl)) {
    const vid = document.createElement('video');
    vid.src = videoUrl;
    if (poster) vid.poster = poster;
    vid.autoplay = true;
    stage.appendChild(vid);
    _pVideo = vid;
    _setupPlayerControls(vid);
  } else {
    stage.innerHTML = `
      <div class="player-no-video">
        ${poster ? `<div class="player-no-bg" style="background-image:url('${poster}')"></div>` : ''}
        <div class="player-no-content">
          <div class="player-no-icon">🎬</div>
          <div class="player-no-title">${item.title}</div>
          <div class="player-no-msg">No video file uploaded for this title yet.<br>Upload one via the Admin panel.</div>
        </div>
      </div>`;
    document.getElementById('playerControls').classList.add('hidden');
  }

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  _resetPlayerControls();
  _startHideTimer();
}

function _setupPlayerControls(vid) {
  const controls     = document.getElementById('playerControls');
  const progressFill = document.getElementById('progressFill');
  const progressThumb= document.getElementById('progressThumb');
  const progressBar  = document.getElementById('progressBar');
  const curTimeEl    = document.getElementById('pCurrentTime');
  const totTimeEl    = document.getElementById('pTotalTime');
  const playBtn      = document.getElementById('playPauseBtn');
  const playIcon     = document.getElementById('playIcon');
  const pauseIcon    = document.getElementById('pauseIcon');
  const muteBtn      = document.getElementById('muteBtn');
  const volIcon      = document.getElementById('volIcon');
  const muteIcon     = document.getElementById('muteIcon');
  const volumeBar    = document.getElementById('volumeBar');
  const volFill      = document.getElementById('volFill');
  const volLabel     = document.getElementById('volumeLabel');
  const brightBar    = document.getElementById('brightnessBar');
  const brightFill   = document.getElementById('brightFill');
  const brightLabel  = document.getElementById('brightnessLabel');
  const fsBtn        = document.getElementById('fullscreenBtn');
  const fsEnter      = document.getElementById('fsEnterIcon');
  const fsExit       = document.getElementById('fsExitIcon');
  const overlay      = document.getElementById('playerOverlay');

  controls.classList.remove('hidden');

  function fmtTime(s) {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  function updateProgress() {
    if (!vid.duration) return;
    const pct = (vid.currentTime / vid.duration) * 100;
    progressFill.style.width = pct + '%';
    progressThumb.style.left = pct + '%';
    progressBar.value = pct;
    curTimeEl.textContent = fmtTime(vid.currentTime);
  }

  vid.addEventListener('loadedmetadata', () => {
    totTimeEl.textContent = fmtTime(vid.duration);
  });
  vid.addEventListener('timeupdate', updateProgress);

  vid.addEventListener('play', () => {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  });
  vid.addEventListener('pause', () => {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  });

  playBtn.onclick = () => vid.paused ? vid.play() : vid.pause();

  progressBar.oninput = () => {
    if (vid.duration) vid.currentTime = (progressBar.value / 100) * vid.duration;
  };

  /* ---- Web Audio API for volume boost ---- */
  function _initAudio() {
    if (_pAudioCtx) return;
    try {
      _pAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = _pAudioCtx.createMediaElementSource(vid);
      _pGain = _pAudioCtx.createGain();
      src.connect(_pGain);
      _pGain.connect(_pAudioCtx.destination);
    } catch(e) { _pGain = null; }
  }

  function applyVolume(val) {
    const pct = parseInt(val);
    const ratio = pct / 100;
    volLabel.textContent = pct + '%';
    volFill.style.width = (pct / 2) + '%';
    volFill.classList.toggle('vol-boosted', pct > 100);
    if (pct > 100) {
      _initAudio();
      vid.volume = 1;
      if (_pGain) _pGain.gain.value = ratio;
    } else {
      if (_pGain) _pGain.gain.value = 1;
      vid.volume = ratio;
    }
  }

  volumeBar.oninput = () => applyVolume(volumeBar.value);
  applyVolume(100);

  muteBtn.onclick = () => {
    vid.muted = !vid.muted;
    volIcon.classList.toggle('hidden', vid.muted);
    muteIcon.classList.toggle('hidden', !vid.muted);
  };

  /* ---- Brightness via CSS filter ---- */
  function applyBrightness(val) {
    const pct = parseInt(val);
    brightLabel.textContent = pct + '%';
    brightFill.style.width = (pct / 2) + '%';
    vid.style.filter = `brightness(${pct / 100})`;
  }

  brightBar.oninput = () => applyBrightness(brightBar.value);
  applyBrightness(100);

  /* ---- Fullscreen ---- */
  function updateFsIcons() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    fsEnter.classList.toggle('hidden', isFs);
    fsExit.classList.toggle('hidden', !isFs);
  }
  document.addEventListener('fullscreenchange', updateFsIcons);
  document.addEventListener('webkitfullscreenchange', updateFsIcons);

  fsBtn.onclick = () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      (overlay.requestFullscreen || overlay.webkitRequestFullscreen).call(overlay);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    }
  };

  /* ---- Popup toggle utility ---- */
  const allPopups = ['speedPopup','subtitlePopup','audioPopup','qualityPopup'];
  const allPopupBtns = ['speedBtn','subtitleBtn','audioTrackBtn','qualityBtn'];

  function togglePopup(popupId, btnId) {
    const popup = document.getElementById(popupId);
    const btn   = document.getElementById(btnId);
    const isOpen = !popup.classList.contains('hidden');
    allPopups.forEach(id => document.getElementById(id).classList.add('hidden'));
    allPopupBtns.forEach(id => document.getElementById(id).classList.remove('popup-open'));
    if (!isOpen) {
      popup.classList.remove('hidden');
      btn.classList.add('popup-open');
    }
  }

  overlay.addEventListener('click', (e) => {
    const inPopup = e.target.closest('.pctrl-popup-wrap');
    if (!inPopup) {
      allPopups.forEach(id => document.getElementById(id).classList.add('hidden'));
      allPopupBtns.forEach(id => document.getElementById(id).classList.remove('popup-open'));
    }
  });

  /* ---- Playback Speed ---- */
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const speedOpts = document.getElementById('speedOptions');
  speedOpts.innerHTML = speeds.map(s =>
    `<div class="popup-option${s === 1 ? ' active' : ''}" data-speed="${s}">
      ${s}×
      ${s === 1 ? '<span class="popup-option-badge">Normal</span>' : ''}
    </div>`
  ).join('');

  speedOpts.addEventListener('click', (e) => {
    const opt = e.target.closest('.popup-option');
    if (!opt) return;
    const speed = parseFloat(opt.dataset.speed);
    vid.playbackRate = speed;
    document.getElementById('speedBtn').textContent = speed + '×';
    speedOpts.querySelectorAll('.popup-option').forEach(el => el.classList.toggle('active', el.dataset.speed == speed));
    document.getElementById('speedPopup').classList.add('hidden');
    document.getElementById('speedBtn').classList.remove('popup-open');
  });
  document.getElementById('speedBtn').onclick = () => togglePopup('speedPopup', 'speedBtn');

  /* ---- Subtitles / CC ---- */
  function refreshSubtitleOptions() {
    const opts = document.getElementById('subtitleOptions');
    const tracks = Array.from(vid.textTracks);
    let html = `<div class="popup-option active" data-sub="-1">Off</div>`;
    if (tracks.length === 0) {
      html += `<div class="popup-option" style="opacity:0.4;cursor:default;font-size:12px">No embedded tracks</div>`;
    } else {
      tracks.forEach((t, i) => {
        html += `<div class="popup-option" data-sub="${i}">${t.label || 'Track ' + (i+1)}${t.language ? ' (' + t.language + ')' : ''}</div>`;
      });
    }
    opts.innerHTML = html;

    opts.addEventListener('click', (e) => {
      const opt = e.target.closest('.popup-option[data-sub]');
      if (!opt) return;
      const idx = parseInt(opt.dataset.sub);
      Array.from(vid.textTracks).forEach((t, i) => {
        t.mode = (i === idx) ? 'showing' : 'disabled';
      });
      opts.querySelectorAll('.popup-option').forEach(el => el.classList.toggle('active', el.dataset.sub == idx));
      document.getElementById('subtitlePopup').classList.add('hidden');
      document.getElementById('subtitleBtn').classList.remove('popup-open');
    });
  }
  vid.addEventListener('loadedmetadata', refreshSubtitleOptions);
  refreshSubtitleOptions();

  document.getElementById('subtitleBtn').onclick = () => togglePopup('subtitlePopup', 'subtitleBtn');

  /* Load external .vtt / .srt subtitle file */
  document.getElementById('subtitleFileInput').onchange = function() {
    const file = this.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = file.name.replace(/\.[^.]+$/, '');
    track.src = url;
    track.default = true;
    vid.appendChild(track);
    setTimeout(() => {
      Array.from(vid.textTracks).forEach((t, i) => {
        t.mode = i === vid.textTracks.length - 1 ? 'showing' : 'disabled';
      });
      refreshSubtitleOptions();
    }, 100);
    showToast(`Subtitles loaded: ${track.label}`);
  };

  /* ---- Audio Track ---- */
  function refreshAudioOptions() {
    const opts = document.getElementById('audioOptions');
    const tracks = vid.audioTracks;
    if (!tracks || tracks.length === 0) {
      opts.innerHTML = `<div class="popup-option active">Track 1 (Default)</div>
        <div class="popup-option" style="opacity:0.4;cursor:default;font-size:12px">Multi-track not supported by browser for this format</div>`;
    } else {
      opts.innerHTML = Array.from(tracks).map((t, i) =>
        `<div class="popup-option${t.enabled ? ' active' : ''}" data-audio="${i}">
          ${t.label || 'Track ' + (i+1)}
          ${t.language ? '<span class="popup-option-badge">' + t.language.toUpperCase() + '</span>' : ''}
        </div>`
      ).join('');
      opts.addEventListener('click', (e) => {
        const opt = e.target.closest('.popup-option[data-audio]');
        if (!opt) return;
        const idx = parseInt(opt.dataset.audio);
        Array.from(tracks).forEach((t, i) => { t.enabled = (i === idx); });
        opts.querySelectorAll('.popup-option').forEach(el => el.classList.toggle('active', el.dataset.audio == idx));
        document.getElementById('audioPopup').classList.add('hidden');
        document.getElementById('audioTrackBtn').classList.remove('popup-open');
      });
    }
  }
  vid.addEventListener('loadedmetadata', refreshAudioOptions);
  refreshAudioOptions();
  document.getElementById('audioTrackBtn').onclick = () => togglePopup('audioPopup', 'audioTrackBtn');

  /* ---- Video Quality ---- */
  function refreshQualityOptions() {
    const opts = document.getElementById('qualityOptions');
    const qBtn = document.getElementById('qualityBtn');
    const w = vid.videoWidth, h = vid.videoHeight;
    let label = 'Auto';
    if (h >= 2160) label = '4K';
    else if (h >= 1440) label = '1440p';
    else if (h >= 1080) label = '1080p HD';
    else if (h >= 720) label = '720p HD';
    else if (h >= 480) label = '480p';
    else if (h >= 360) label = '360p';
    else if (h > 0) label = h + 'p';
    opts.innerHTML = `
      <div class="popup-option active">
        ${label}
        <span class="popup-option-badge">Auto</span>
      </div>
      ${w && h ? `<div class="popup-option" style="opacity:0.4;cursor:default;font-size:11px;padding:4px 16px">${w} × ${h} px</div>` : ''}
      <div class="popup-option" style="opacity:0.5;cursor:default;font-size:11px;padding:2px 16px 8px">Multi-quality requires HLS/DASH stream</div>`;
  }
  vid.addEventListener('loadedmetadata', refreshQualityOptions);
  refreshQualityOptions();
  document.getElementById('qualityBtn').onclick = () => togglePopup('qualityPopup', 'qualityBtn');

  /* ---- Picture-in-Picture ---- */
  const pipBtn = document.getElementById('pipBtn');
  if (document.pictureInPictureEnabled) {
    pipBtn.onclick = async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          pipBtn.classList.remove('pip-active');
        } else {
          await vid.requestPictureInPicture();
          pipBtn.classList.add('pip-active');
        }
      } catch (e) { showToast('PiP not available for this video'); }
    };
    vid.addEventListener('leavepictureinpicture', () => pipBtn.classList.remove('pip-active'));
  } else {
    pipBtn.style.opacity = '0.3';
    pipBtn.title = 'PiP not supported by this browser';
    pipBtn.disabled = true;
  }

  /* ---- Auto-hide controls ---- */
  overlay.onmousemove = _showControls;

  /* ---- Click stage to toggle play/pause ---- */
  document.getElementById('playerStage').addEventListener('click', (e) => {
    if (e.target === document.getElementById('playerStage') || e.target === vid) {
      vid.paused ? vid.play() : vid.pause();
    }
  });
}

function _resetPlayerControls() {
  const els = ['progressFill','progressThumb','progressBar','pCurrentTime','pTotalTime',
                'volFill','volumeLabel','brightFill','brightnessLabel'];
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressThumb').style.left = '0%';
  document.getElementById('progressBar').value = 0;
  document.getElementById('pCurrentTime').textContent = '0:00';
  document.getElementById('pTotalTime').textContent   = '0:00';
  document.getElementById('volumeBar').value = 100;
  document.getElementById('brightnessBar').value = 100;
  document.getElementById('playIcon').classList.remove('hidden');
  document.getElementById('pauseIcon').classList.add('hidden');
  document.getElementById('volIcon').classList.remove('hidden');
  document.getElementById('muteIcon').classList.add('hidden');
  document.getElementById('fsEnterIcon').classList.remove('hidden');
  document.getElementById('fsExitIcon').classList.add('hidden');
}

function _showControls() {
  const tb = document.getElementById('playerTopbar');
  const ctrl = document.getElementById('playerControls');
  tb.classList.remove('hide');
  ctrl.classList.remove('hide');
  clearTimeout(_pHideTimer);
  _startHideTimer();
}

function _startHideTimer() {
  _pHideTimer = setTimeout(() => {
    if (_pVideo && !_pVideo.paused) {
      document.getElementById('playerTopbar').classList.add('hide');
      document.getElementById('playerControls').classList.add('hide');
    }
  }, 3000);
}

function closePlayer() {
  const overlay = document.getElementById('playerOverlay');
  overlay.classList.add('hidden');
  document.getElementById('playerStage').innerHTML = '';
  document.getElementById('playerControls').classList.remove('hidden','hide');
  document.getElementById('playerTopbar').classList.remove('hide');
  clearTimeout(_pHideTimer);
  if (_pAudioCtx) { _pAudioCtx.close(); _pAudioCtx = null; }
  _pVideo = null; _pGain = null;
  if (document.fullscreenElement) document.exitFullscreen();
  document.body.style.overflow = '';
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

function buildGrid(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map(item => createCardHTML(item)).join('');
  container.querySelectorAll('.card').forEach((el, i) => {
    el.addEventListener('click', () => openModal(items[i]));
  });
}

function showAllContent(filter, title) {
  const rows = document.querySelectorAll('.content-row, #searchResults');
  rows.forEach(r => r.classList.add('hidden'));
  document.getElementById("allContent").classList.remove('hidden');
  document.getElementById("allContentTitle").textContent = title;

  const items = filter === 'all' ? CONTENT : CONTENT.filter(c => c.type === filter);
  buildGrid('allGrid', items);

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navLink = document.querySelector(`.nav-link[data-filter="${filter}"]`);
  if (navLink) navLink.classList.add('active');
}

function showHomeRows() {
  document.getElementById("allContent").classList.add('hidden');
  document.getElementById("searchResults").classList.add('hidden');
  document.querySelectorAll('.content-row').forEach(r => r.classList.remove('hidden'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('.nav-link[data-filter="all"]').classList.add('active');

  const bar = document.getElementById('genreBar');
  if (bar) {
    bar.querySelectorAll('.genre-chip').forEach(c => {
      c.classList.remove('active');
      c.style.background = '';
      c.style.borderColor = '';
    });
    const allChip = bar.querySelector('[data-genre="all"]');
    if (allChip) {
      allChip.classList.add('active');
      allChip.style.background = 'var(--red)';
      allChip.style.borderColor = 'var(--red)';
    }
  }
}

function setupSearch() {
  const btn = document.getElementById("searchBtn");
  const input = document.getElementById("searchInput");

  btn.addEventListener('click', () => {
    input.classList.toggle('open');
    if (input.classList.contains('open')) {
      input.focus();
    } else {
      input.value = '';
      showHomeRows();
    }
  });

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      showHomeRows();
      return;
    }

    const results = CONTENT.filter(c =>
      c.title.toLowerCase().includes(query) ||
      c.genre.toLowerCase().includes(query) ||
      c.tags.some(t => t.toLowerCase().includes(query))
    );

    document.querySelectorAll('.content-row').forEach(r => r.classList.add('hidden'));
    document.getElementById("allContent").classList.add('hidden');
    const searchSection = document.getElementById("searchResults");
    searchSection.classList.remove('hidden');
    buildGrid('searchGrid', results);

    document.querySelector('.section-title', searchSection);
    const title = searchSection.querySelector('.section-title');
    if (title) title.textContent = `Results for "${input.value.trim()}" (${results.length})`;
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.classList.remove('open');
      input.value = '';
      showHomeRows();
    }
  });
}

function setupNavLinks() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = link.dataset.filter;
      if (filter === 'all') {
        showHomeRows();
      } else {
        const titles = { movie: '🎬 All Movies', series: '📺 All Web Series', anime: '⚡ All Anime' };
        showAllContent(filter, titles[filter]);
      }
    });
  });

  document.querySelectorAll('.see-all').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = link.dataset.filter;
      const titles = { movie: '🎬 All Movies', series: '📺 All Web Series', anime: '⚡ All Anime' };
      showAllContent(filter, titles[filter]);
    });
  });

  document.getElementById("backBtn").addEventListener('click', showHomeRows);
}

function setupModal() {
  document.getElementById("modalClose").addEventListener('click', closeModal);
  document.getElementById("modalOverlay").addEventListener('click', (e) => {
    if (e.target === document.getElementById("modalOverlay")) closeModal();
  });
  document.getElementById('playerClose').addEventListener('click', closePlayer);

  document.getElementById('modalTrailerBtn').addEventListener('click', () => {
    if (!_currentModalItem) return;
    if (!_currentModalItem.trailerUrl) {
      showToast('No trailer available for this title');
      return;
    }
    closeModal();
    openTrailer(_currentModalItem);
  });

  document.getElementById('trailerCloseBtn').addEventListener('click', closeTrailer);
  document.getElementById('trailerOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('trailerOverlay')) closeTrailer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!document.getElementById('trailerOverlay').classList.contains('hidden')) { closeTrailer(); return; }
      if (!document.getElementById('playerOverlay').classList.contains('hidden')) { closePlayer(); return; }
      closeModal();
    }
  });
}

function extractYouTubeId(url) {
  const patterns = [
    /youtu\.be\/([^?&/#]+)/,
    /youtube\.com\/watch\?.*v=([^&]+)/,
    /youtube\.com\/embed\/([^?&/#]+)/,
    /youtube\.com\/shorts\/([^?&/#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function openTrailer(item) {
  const url = item.trailerUrl || '';
  const ytId = extractYouTubeId(url);
  document.getElementById('trailerLabel').textContent = item.title + ' — Official Trailer';
  if (ytId) {
    document.getElementById('trailerIframe').src =
      `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
    document.getElementById('trailerOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else if (url) {
    openPlayer(item, url);
  } else {
    showToast('No trailer available for this title');
  }
}

function closeTrailer() {
  document.getElementById('trailerOverlay').classList.add('hidden');
  document.getElementById('trailerIframe').src = '';
  document.body.style.overflow = '';
}

function setupHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', isOpen);
    btn.classList.toggle('open', !isOpen);
  });

  menu.querySelectorAll('.mobile-nav-link[data-filter]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = link.dataset.filter;
      menu.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.filter === filter);
      });
      if (filter === 'all') {
        showHomeRows();
      } else {
        const titles = { movie: '🎬 All Movies', series: '📺 All Web Series', anime: '⚡ All Anime' };
        showAllContent(filter, titles[filter]);
      }
      menu.classList.add('hidden');
      btn.classList.remove('open');
    });
  });
}

function setupScrollNavbar() {
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById("navbar");
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

const SITE_DEFAULT_CATEGORIES = [
  { id: 1,  name: "Action",        icon: "💥", color: "#e50914" },
  { id: 2,  name: "Adventure",     icon: "🗺️", color: "#f97316" },
  { id: 3,  name: "Comedy",        icon: "😂", color: "#facc15" },
  { id: 4,  name: "Drama",         icon: "🎭", color: "#a855f7" },
  { id: 5,  name: "Fantasy",       icon: "🧙", color: "#7c3aed" },
  { id: 6,  name: "Horror",        icon: "👻", color: "#1f2937" },
  { id: 7,  name: "Sci-Fi",        icon: "🚀", color: "#4a90e2" },
  { id: 8,  name: "Thriller",      icon: "🔪", color: "#dc2626" },
  { id: 9,  name: "Western",       icon: "🤠", color: "#92400e" },
  { id: 10, name: "Animation",     icon: "🎨", color: "#06b6d4" },
  { id: 11, name: "Cartoon",       icon: "🐭", color: "#f59e0b" },
  { id: 12, name: "Crime",         icon: "🕵️", color: "#374151" },
  { id: 13, name: "Documentary",   icon: "📽️", color: "#065f46" },
  { id: 14, name: "Family & Kids", icon: "👨‍👩‍👧", color: "#10b981" },
  { id: 15, name: "Historical",    icon: "🏛️", color: "#78350f" },
  { id: 16, name: "Musical",       icon: "🎵", color: "#ec4899" },
  { id: 17, name: "Mystery",       icon: "🔍", color: "#1e3a5f" },
  { id: 18, name: "Romance",       icon: "❤️", color: "#f43f5e" },
  { id: 19, name: "War",           icon: "⚔️", color: "#4b5563" },
  { id: 20, name: "Experimental",  icon: "🧪", color: "#6d28d9" },
  { id: 21, name: "Indian",        icon: "🇮🇳", color: "#ff6700" },
  { id: 22, name: "Biographical",  icon: "📖", color: "#0369a1" },
  { id: 23, name: "LGBTQ+",        icon: "🏳️‍🌈", color: "#db2777" },
  { id: 24, name: "Sports",        icon: "🏆", color: "#16a34a" },
  { id: 25, name: "18+",           icon: "🔞", color: "#7f1d1d" },
];

function loadCategories() {
  try {
    const stored = localStorage.getItem('sv_categories');
    if (!stored || stored === '[]') {
      localStorage.setItem('sv_categories', JSON.stringify(SITE_DEFAULT_CATEGORIES));
      return SITE_DEFAULT_CATEGORIES;
    }
    return JSON.parse(stored);
  } catch { return SITE_DEFAULT_CATEGORIES; }
}

function buildGenreBar() {
  const cats = loadCategories();
  const bar = document.getElementById('genreBar');
  if (!bar) return;

  const allChip = `<button class="genre-chip active" data-genre="all" style="background:var(--red);border-color:var(--red);">
    <span class="genre-chip-icon">🎬</span> All
  </button>`;

  const chips = cats.map(cat => `
    <button class="genre-chip" data-genre="${cat.name}" style="--chip-color:${cat.color}">
      <span class="genre-chip-icon">${cat.icon || '🎭'}</span>
      ${cat.name}
    </button>
  `).join('');

  bar.innerHTML = allChip + chips;

  bar.querySelectorAll('.genre-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      bar.querySelectorAll('.genre-chip').forEach(c => {
        c.classList.remove('active');
        c.style.background = '';
        c.style.borderColor = '';
        c.style.color = '';
      });
      chip.classList.add('active');
      chip.style.background = chip.dataset.genre === 'all' ? 'var(--red)' : 'var(--chip-color, var(--red))';
      chip.style.borderColor = chip.style.background;

      const genre = chip.dataset.genre;
      filterByGenre(genre);
    });
  });
}

function filterByGenre(genre) {
  if (genre === 'all') {
    showHomeRows();
    return;
  }

  const g = genre.toLowerCase();
  const matches = CONTENT.filter(c =>
    c.genre.toLowerCase().includes(g) ||
    (c.tags || []).some(t => t.toLowerCase().includes(g)) ||
    c.title.toLowerCase().includes(g)
  );

  document.querySelectorAll('.content-row').forEach(r => r.classList.add('hidden'));
  document.getElementById('allContent').classList.add('hidden');
  document.getElementById('searchResults').classList.remove('hidden');

  const searchSection = document.getElementById('searchResults');
  searchSection.querySelector('.section-title').textContent = `${genre} (${matches.length} titles)`;
  buildGrid('searchGrid', matches);

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
}

async function init() {
  try {
    const res = await fetch('/api/content');
    if (res.ok) {
      const custom = await res.json();
      CONTENT.push(...custom);
    }
  } catch (e) {
    try {
      const stored = JSON.parse(localStorage.getItem('sv_custom_content') || '[]');
      CONTENT.push(...stored);
    } catch {}
  }

  if (CONTENT.length > 0) {
    const shuffled = [...CONTENT].sort(() => Math.random() - 0.5);
    HERO_ITEMS.push(...shuffled.slice(0, Math.min(6, shuffled.length)));
  }

  buildHero();
  buildGenreBar();

  const trending = CONTENT.filter(c => c.trending);
  const movies = CONTENT.filter(c => c.type === 'movie');
  const series = CONTENT.filter(c => c.type === 'series');
  const anime = CONTENT.filter(c => c.type === 'anime');
  const newReleases = CONTENT.filter(c => c.newRelease);

  buildCards('trending', trending);
  buildCards('movies', movies);
  buildCards('series', series);
  buildCards('anime', anime);
  buildCards('new', newReleases);

  try {
    const orphanRes = await fetch('/api/orphans');
    if (orphanRes.ok) {
      const orphans = await orphanRes.json();
      if (orphans.length > 0) {
        buildCards('unknown', orphans);
        document.getElementById('unknownRow').classList.remove('hidden');
      }
    }
  } catch (e) {}

  setupSearch();
  setupNavLinks();
  setupModal();
  setupScrollNavbar();
  setupHamburger();
}

document.addEventListener('DOMContentLoaded', init);
