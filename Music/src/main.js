import './style.css';
import { state, toggleLikeTrack, toggleLikeAlbum, toggleRingtone, deletePlaylist, removeFromPlaylist, persist } from './state.js';
import { albums, podcasts } from './data.js';
import { app } from './app.js';
import { playTrack, togglePlayPause, playNext, playPrev, seekTo, formatTime, parseDuration } from './player.js';
import { renderSidebar } from './sidebar.js';
import { renderMain } from './views.js';
import { renderPlayerBar, bindPlayerEvents, renderMiniPlayer } from './player-bar.js';
import { openModal, closeModal } from './modals.js';
import { createSession, joinSession, leaveSession, broadcastPlayState } from './p2p.js';

window.__sv_state = { toggleLikeTrack };

function renderApp() {
  document.querySelector('#app').innerHTML = `
    <div class="app">
      ${renderHeader()}
      <div class="app-body">
        <div id="sidebar-root" class="sidebar-root ${state.sidebarOpen ? 'sidebar-open' : ''}">${renderSidebar()}</div>
        <div class="sidebar-backdrop ${state.sidebarOpen ? 'visible' : ''}" id="sidebar-backdrop"></div>
        <main class="main" id="main-content">${renderMain()}</main>
      </div>
      <div id="player-root">${renderPlayerBar()}</div>
      <div id="global-progress-line"><div id="player-line-progress" style="width:${state.progressPercent}%"></div></div>
    </div>`;
  bindGlobalEvents();
  bindPlayerEvents();
  bindMainEvents();
}

function renderHeader() {
  return `<header class="header">
    <button class="hamburger" id="hamburger-btn" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <div class="logo" data-nav="home">
      <div class="logo-icon">
        <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
          <polygon points="32,6 58,20 58,44 32,58 6,44 6,20" stroke="url(#hg)" stroke-width="2" fill="url(#hf)" fill-opacity="0.15"/>
          <polygon points="22,32 32,26 42,32 42,38 32,44 22,38" fill="url(#hg)"/>
          <defs>
            <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient>
            <linearGradient id="hf" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#ec4899"/></linearGradient>
          </defs>
        </svg>
      </div>
      <div class="logo-text">DELETE_<span>MUSIC_HUB</span></div>
    </div>
    <div class="search-bar">
      <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input id="search-input" type="text" placeholder="Search..." value="${state.currentQuery}"/>
    </div>
    <div class="header-right">
      ${state.p2pEnabled ? `<span class="p2p-header-badge"><span class="p2p-dot"></span> ${state.p2pSessionId}</span>` : ''}
      <span class="header-stats">${albums.length} ALBUMS</span>
    </div>
  </header>`;
}

function refreshMain() {
  const el = document.getElementById('main-content');
  if (el) { el.innerHTML = renderMain(); el.scrollTop = 0; bindMainEvents(); }
}
function refreshSidebar() {
  const el = document.getElementById('sidebar-root');
  if (el) { el.innerHTML = renderSidebar(); bindSidebarEvents(); }
}
function refreshPlayer() {
  const el = document.getElementById('player-root');
  if (el) { el.innerHTML = renderPlayerBar(); bindPlayerEvents(); }
}
function refreshFullscreen() { renderFullscreenOverlay(); }
function refreshMiniPlayer() { renderMiniPlayer(); }
function refreshHeader() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
}

function navigate(view, params = {}) {
  state.view = view;
  if (params.albumId !== undefined) state.currentAlbumId = params.albumId;
  if (params.artistId !== undefined) state.currentArtistId = params.artistId;
  if (params.playlistId !== undefined) state.currentPlaylistId = params.playlistId;
  if (params.podcastId !== undefined) state.currentPodcastId = params.podcastId;
  if (view === 'home') { state.currentQuery = ''; refreshHeader(); }
  closeSidebar();
  refreshMain(); refreshSidebar();
}

function closeSidebar() {
  state.sidebarOpen = false;
  document.getElementById('sidebar-root')?.classList.remove('sidebar-open');
  document.getElementById('sidebar-backdrop')?.classList.remove('visible');
}

app.navigate = navigate;
app.refreshMain = refreshMain;
app.refreshSidebar = refreshSidebar;
app.refreshPlayer = refreshPlayer;
app.refreshFullscreen = refreshFullscreen;
app.refreshMiniPlayer = refreshMiniPlayer;
app.openModal = openModal;
app.closeModal = closeModal;

app.p2pSync = (data) => {
  if (!data || !state.p2pEnabled) return;
  if (data.type === 'sync' && data.trackId) {
    const album = albums.find(a => a.id === data.albumId);
    const track = album?.tracks.find(t => t.id === data.trackId);
    if (track && track.id !== state.currentTrack?.id) {
      playTrack(track, album.id); return;
    }
    if (typeof data.isPlaying === 'boolean' && data.isPlaying !== state.isPlaying) {
      togglePlayPause();
    }
  }
};

function bindGlobalEvents() {
  document.getElementById('search-input')?.addEventListener('input', e => {
    state.currentQuery = e.target.value;
    state.view = 'home'; refreshMain(); refreshSidebar();
  });
  document.getElementById('hamburger-btn')?.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen;
    document.getElementById('sidebar-root')?.classList.toggle('sidebar-open', state.sidebarOpen);
    document.getElementById('sidebar-backdrop')?.classList.toggle('visible', state.sidebarOpen);
  });
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);
  document.querySelector('.logo[data-nav]')?.addEventListener('click', () => navigate('home'));
  bindSidebarEvents();
}

function bindSidebarEvents() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
}

function bindMainEvents() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.removeEventListener('click', handleMainClick);
  main.addEventListener('click', handleMainClick);

  document.getElementById('p2p-create')?.addEventListener('click', () => {
    createSession(); refreshMain(); refreshSidebar();
  });
  document.getElementById('p2p-join')?.addEventListener('click', () => {
    const code = document.getElementById('p2p-code-input')?.value?.trim();
    if (code && joinSession(code)) { refreshMain(); refreshSidebar(); }
    else alert('Enter a valid session code.');
  });
  document.getElementById('p2p-broadcast')?.addEventListener('click', () => {
    broadcastPlayState();
    const btn = document.getElementById('p2p-broadcast');
    if (btn) { btn.textContent = 'Synced!'; setTimeout(() => btn.textContent = 'Sync Now', 2000); }
  });
  document.getElementById('p2p-leave')?.addEventListener('click', () => {
    leaveSession(); refreshMain(); refreshSidebar();
  });

  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (!btn.disabled) openModal(btn.dataset.openModal);
    });
  });
}

function handleMainClick(e) {
  if (e.target.closest('[data-open-customize]')) {
    const id = parseInt(e.target.closest('[data-open-customize]').dataset.openCustomize);
    openModal('customize-playlist', { playlistId: id }); return;
  }
  if (e.target.closest('[data-track-info]')) {
    const el = e.target.closest('[data-track-info]');
    openModal('music-info', { trackId: el.dataset.trackInfo, albumId: el.dataset.albumInfo }); return;
  }
  if (e.target.closest('[data-download-track]')) {
    e.stopPropagation();
    const el = e.target.closest('[data-download-track]');
    openModal('download', { trackId: el.dataset.downloadTrack, albumId: el.dataset.downloadAlbum }); return;
  }
  if (e.target.closest('[data-edit-track]')) {
    e.stopPropagation();
    const el = e.target.closest('[data-edit-track]');
    openModal('edit-track', { trackId: el.dataset.editTrack, albumId: el.dataset.editAlbum }); return;
  }
  if (e.target.closest('[data-download-playlist]')) {
    e.stopPropagation();
    const id = e.target.closest('[data-download-playlist]').dataset.downloadPlaylist;
    openModal('playlist-download', { playlistId: id }); return;
  }
  if (e.target.closest('[data-play-album]')) {
    e.stopPropagation();
    const id = parseInt(e.target.closest('[data-play-album]').dataset.playAlbum);
    const album = albums.find(a => a.id === id);
    if (album?.tracks?.length) playTrack(album.tracks[0], id);
    return;
  }
  if (e.target.closest('[data-shuffle-album]')) {
    const id = parseInt(e.target.closest('[data-shuffle-album]').dataset.shuffleAlbum);
    const album = albums.find(a => a.id === id);
    if (album?.tracks?.length) playTrack(album.tracks[Math.floor(Math.random() * album.tracks.length)], id);
    return;
  }
  if (e.target.closest('[data-play-playlist]')) {
    const pid = parseInt(e.target.closest('[data-play-playlist]').dataset.playPlaylist);
    const pl = state.playlists.find(p => p.id === pid);
    if (pl?.trackIds?.length) {
      for (const a of albums) { const t = a.tracks.find(t => t.id === pl.trackIds[0]); if (t) { playTrack(t, a.id); return; } }
    } return;
  }
  if (e.target.closest('.track-item') && !e.target.closest('[data-podcast-episode]')) {
    const item = e.target.closest('.track-item');
    if (e.target.closest('[data-like-track],[data-ringtone],[data-add-to-playlist],[data-remove-from-playlist],[data-track-info],[data-open-modal],[data-download-track],[data-edit-track]')) return;
    const trackId = parseInt(item.dataset.trackId);
    const albumId = parseInt(item.dataset.albumId);
    const album = albums.find(a => a.id === albumId);
    const track = album?.tracks.find(t => t.id === trackId);
    if (track) playTrack(track, albumId);
    return;
  }
  if (e.target.closest('[data-podcast-episode]')) {
    const item = e.target.closest('[data-podcast-episode]');
    const epId = item.dataset.podcastEpisode;
    const podcastId = item.dataset.podcastId;
    const podcast = podcasts.find(p => p.id === podcastId);
    const ep = podcast?.episodes.find(ep => ep.id === epId);
    if (ep) playTrack(ep, podcastId, true);
    return;
  }
  if (e.target.closest('[data-like-album]')) {
    const id = parseInt(e.target.closest('[data-like-album]').dataset.likeAlbum);
    toggleLikeAlbum(id); refreshMain(); refreshSidebar(); return;
  }
  if (e.target.closest('[data-like-track]')) {
    const id = parseInt(e.target.closest('[data-like-track]').dataset.likeTrack);
    toggleLikeTrack(id); refreshMain(); refreshSidebar(); refreshPlayer(); return;
  }
  if (e.target.closest('[data-ringtone]')) {
    const id = parseInt(e.target.closest('[data-ringtone]').dataset.ringtone);
    toggleRingtone(id); refreshMain(); return;
  }
  if (e.target.closest('[data-add-to-playlist]')) {
    const id = parseInt(e.target.closest('[data-add-to-playlist]').dataset.addToPlaylist);
    openModal('add-to-playlist', { trackId: id }); return;
  }
  if (e.target.closest('[data-remove-from-playlist]')) {
    const trackId = parseInt(e.target.closest('[data-remove-from-playlist]').dataset.removeFromPlaylist);
    if (state.currentPlaylistId) { removeFromPlaylist(state.currentPlaylistId, trackId); refreshMain(); }
    return;
  }
  if (e.target.closest('[data-delete-playlist]')) {
    const id = parseInt(e.target.closest('[data-delete-playlist]').dataset.deletePlaylist);
    if (confirm('Delete this playlist?')) { deletePlaylist(id); navigate('playlists'); refreshSidebar(); }
    return;
  }
  if (e.target.closest('.playlist-card') && !e.target.closest('[data-delete-playlist],[data-open-customize]')) {
    const id = parseInt(e.target.closest('.playlist-card').dataset.playlistId);
    navigate('playlist-detail', { playlistId: id }); return;
  }
  if (e.target.closest('.album-card') && !e.target.closest('[data-play-album],[data-like-album]')) {
    const id = parseInt(e.target.closest('.album-card').dataset.albumId);
    navigate('album-detail', { albumId: id }); return;
  }
  if (e.target.closest('[data-nav]')) {
    navigate(e.target.closest('[data-nav]').dataset.nav); return;
  }
  if (e.target.closest('.back-btn')) {
    const nav = e.target.closest('.back-btn').dataset.nav;
    if (nav) navigate(nav); return;
  }
  if (e.target.closest('[data-artist]')) {
    navigate('artist-detail', { artistId: e.target.closest('[data-artist]').dataset.artist }); return;
  }
  if (e.target.closest('.podcast-card')) {
    const id = e.target.closest('.podcast-card').dataset.podcastId;
    navigate('podcast-detail', { podcastId: id }); return;
  }
  if (e.target.closest('[data-np-play]')) { togglePlayPause(); return; }
  if (e.target.closest('[data-np-prev]')) { playPrev(); return; }
  if (e.target.closest('[data-np-next]')) { playNext(); return; }
  if (e.target.closest('[data-np-shuffle]')) {
    state.shuffleMode = !state.shuffleMode; persist(); refreshMain(); refreshPlayer(); return;
  }
  if (e.target.closest('[data-np-repeat]')) {
    const modes = ['none','all','one'];
    state.repeatMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
    persist(); refreshMain(); refreshPlayer(); return;
  }
  if (e.target.closest('[data-np-fullscreen]')) {
    state.fullscreen = true; renderFullscreenOverlay(); return;
  }
  if (e.target.closest('[data-np-seek]')) {
    const bar = e.target.closest('[data-np-seek]');
    const rect = bar.getBoundingClientRect();
    seekTo(((e.clientX - rect.left) / rect.width) * 100); return;
  }
}

function renderFullscreenOverlay() {
  const overlay = document.getElementById('fullscreen-overlay');
  if (!overlay) return;
  if (!state.fullscreen || !state.currentTrack) {
    overlay.style.display = 'none'; overlay.innerHTML = ''; return;
  }
  const track = state.currentTrack;
  const color = getTrackColor();
  const album = getTrackAlbum();
  overlay.style.display = 'flex';
  const barCount = 48;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const h = 15 + Math.sin(i * 0.8) * 20 + Math.random() * 40;
    return `<div class="fs-bar" style="height:${h}px;background:linear-gradient(to top,${color},${color}33);animation-delay:${(i*0.07).toFixed(2)}s;animation-duration:${(0.8+Math.random()*0.6).toFixed(2)}s"></div>`;
  }).join('');
  overlay.innerHTML = `<div class="fs-overlay" style="--fs-color:${color}">
    <div class="fs-bg-blur" style="background:radial-gradient(ellipse at center,${color}15 0%,transparent 70%)"></div>
    <div class="fs-grid"></div>
    <button class="fs-close" id="fs-close">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="fs-content">
      <div class="fs-disc-wrap">
        <div class="fs-disc ${state.isPlaying ? 'spinning' : ''}" style="border-color:${color}44">
          <div class="fs-disc-ring" style="border-color:${color}22"></div>
          <div class="fs-disc-inner" style="background:radial-gradient(${color}22,${color}08)">
            <div class="fs-disc-hole" style="background:var(--bg);border:3px solid ${color}55"></div>
          </div>
          <div class="fs-disc-label">${album?.title || '—'}</div>
        </div>
        <div class="fs-visualizer">${bars}</div>
      </div>
      <div class="fs-info">
        ${album ? `<div class="fs-genre" style="color:${color}">${album.genre}</div>` : ''}
        <h1 class="fs-title">${track.title}</h1>
        <div class="fs-artist">${album?.artist || ''}</div>
        ${album ? `<div class="fs-album">${album.title} &middot; ${album.year}</div>` : ''}
        <div class="fs-progress">
          <span class="fs-time" id="fs-time-current">0:00</span>
          <div class="fs-bar-wrap" id="fs-progress-bar" style="background:${color}15;border:1px solid ${color}22">
            <div class="fs-progress-fill" id="fs-fill" style="width:${state.progressPercent}%;background:${color}"></div>
          </div>
          <span class="fs-time" id="fs-time-total">${track.duration||'—'}</span>
        </div>
        <div class="fs-controls">
          <button class="ctrl-btn ${state.shuffleMode ? 'ctrl-active' : ''}" id="fs-shuffle">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
          </button>
          <button class="ctrl-btn" id="fs-prev"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2"/></svg></button>
          <button class="ctrl-btn play-pause" id="fs-play" style="width:60px;height:60px;border-radius:12px">
            ${state.isPlaying
              ? `<svg width="22" height="22" fill="#000" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
              : `<svg width="22" height="22" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`}
          </button>
          <button class="ctrl-btn" id="fs-next"><svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"/></svg></button>
          <button class="ctrl-btn ${state.repeatMode!=='none'?'ctrl-active':''}" id="fs-repeat">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            ${state.repeatMode==='one'?'<span class="repeat-one-badge">1</span>':''}
          </button>
        </div>
      </div>
    </div>
  </div>`;
  document.getElementById('fs-close')?.addEventListener('click', () => { state.fullscreen = false; renderFullscreenOverlay(); });
  document.getElementById('fs-play')?.addEventListener('click', () => { togglePlayPause(); renderFullscreenOverlay(); });
  document.getElementById('fs-prev')?.addEventListener('click', () => { playPrev(); renderFullscreenOverlay(); });
  document.getElementById('fs-next')?.addEventListener('click', () => { playNext(); renderFullscreenOverlay(); });
  document.getElementById('fs-shuffle')?.addEventListener('click', () => { state.shuffleMode = !state.shuffleMode; persist(); renderFullscreenOverlay(); });
  document.getElementById('fs-repeat')?.addEventListener('click', () => {
    const modes = ['none','all','one'];
    state.repeatMode = modes[(modes.indexOf(state.repeatMode)+1)%modes.length];
    persist(); renderFullscreenOverlay();
  });
  document.getElementById('fs-progress-bar')?.addEventListener('click', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo(((e.clientX-rect.left)/rect.width)*100);
    const fsFill = document.getElementById('fs-fill');
    if (fsFill) fsFill.style.width = `${state.progressPercent}%`;
  });
  startFSProgressSync();
  document.addEventListener('keydown', fsBind);
}

let fsSyncInterval = null;
function startFSProgressSync() {
  if (fsSyncInterval) clearInterval(fsSyncInterval);
  fsSyncInterval = setInterval(() => {
    if (!state.fullscreen) { clearInterval(fsSyncInterval); return; }
    const fsFill = document.getElementById('fs-fill');
    if (fsFill) fsFill.style.width = `${state.progressPercent}%`;
    const curEl = document.getElementById('fs-time-current');
    if (curEl && state.currentTrack) {
      const dur = parseDuration(state.currentTrack.duration);
      curEl.textContent = formatTime((state.progressPercent/100)*dur);
    }
  }, 500);
}

function fsBind(e) {
  if (!state.fullscreen) { document.removeEventListener('keydown', fsBind); return; }
  if (e.key === 'Escape') { state.fullscreen = false; renderFullscreenOverlay(); document.removeEventListener('keydown', fsBind); }
  if (e.key === ' ') { e.preventDefault(); togglePlayPause(); renderFullscreenOverlay(); }
}

function getTrackColor() {
  if (state.isPodcastTrack) { const p = podcasts.find(p => p.id === state.currentTrackAlbumId); return p?.color || '#8b5cf6'; }
  const a = albums.find(a => a.id === state.currentTrackAlbumId);
  return a?.color || '#8b5cf6';
}

function getTrackAlbum() {
  if (state.isPodcastTrack) return null;
  return albums.find(a => a.id === state.currentTrackAlbumId);
}

function startLoadingScreen() {
  const statuses = ['INITIALIZING AUDIO CORE...','LOADING LIBRARY...','SYNCING DATA...','CALIBRATING EQUALIZER...','READY'];
  let i = 0;
  const el = document.getElementById('ls-status');
  const fill = document.querySelector('.ls-bar-fill');
  const iv = setInterval(() => {
    i++;
    if (el && statuses[i]) el.textContent = statuses[i];
    if (fill) fill.style.width = `${Math.min(100, i * 25)}%`;
    if (i >= statuses.length - 1) {
      clearInterval(iv);
      setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        if (ls) { ls.classList.add('ls-hidden'); setTimeout(() => ls.remove(), 800); }
      }, 300);
    }
  }, 350);
}

function applyOverrides() {
  const to = state.trackTitleOverrides || {};
  const ao = state.albumMetaOverrides || {};
  for (const album of albums) {
    const ov = ao[album.id];
    if (ov) {
      if (ov.artist) album.artist = ov.artist;
      if (ov.genre) album.genre = ov.genre;
      if (ov.year) album.year = ov.year;
    }
    for (const track of album.tracks) {
      if (to[track.id]) track.title = to[track.id];
    }
  }
}

function init() {
  state.sidebarOpen = false;
  applyOverrides();
  startLoadingScreen();
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) { ls.classList.add('ls-hidden'); setTimeout(() => ls.remove(), 500); }
    renderApp();
  }, 1800);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
