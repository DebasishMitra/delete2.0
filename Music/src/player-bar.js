import { state, persist, isTrackLiked, toggleLikeTrack } from './state.js';
import { getPlayerContext, togglePlayPause, playNext, playPrev, seekTo, updateProgressUI, formatTime, parseDuration } from './player.js';
import { openModal } from './modals.js';
import { seekAudio, setAudioVolume } from './audio.js';
import { app } from './app.js';

const repeatIcons = {
  none: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`,
  all: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`,
  one: `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`,
};

export function renderPlayerBar() {
  if (state.miniPlayer) return '';
  const ctx = getPlayerContext();
  const color = ctx?.color || 'var(--border)';
  const track = state.currentTrack;
  const liked = track ? isTrackLiked(track.id) : false;
  const sleepActive = !!state.sleepTimerEnd;

  const albumImg = ctx?.album?.image || null;
  const coverHtml = albumImg
    ? `<img class="player-cover-art ${state.isPlaying ? 'playing-art' : ''}" src="${albumImg}" alt="cover">`
    : `<div class="player-cover-icon ${state.isPlaying ? 'playing-icon' : ''}">
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
        </svg>
      </div>`;

  return `<div class="player">
    <div class="player-track">
      <div class="player-cover" style="background:${color}10;border-color:${color}30">${coverHtml}</div>
      <div class="player-info">
        <div class="player-track-name">${track ? track.title : 'No track playing'}</div>
        <div class="player-track-artist">${ctx?.artist || ''}</div>
      </div>
      ${track ? `<button class="player-like-btn ${liked ? 'liked' : ''}" data-player-like title="Like">
        <svg width="13" height="13" fill="${liked ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </button>` : ''}
    </div>

    <div class="player-controls">
      <div class="player-buttons">
        <button class="ctrl-btn ${state.shuffleMode ? 'ctrl-active' : ''}" id="shuffle-btn" title="Shuffle">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            <line x1="4" y1="4" x2="9" y2="9"/>
          </svg>
        </button>
        <button class="ctrl-btn" id="prev-btn" title="Previous">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2.5"/></svg>
        </button>
        <button class="ctrl-btn play-pause" id="play-pause-btn" ${!track ? 'disabled' : ''}>
          ${state.isPlaying
            ? `<svg width="13" height="13" fill="#000" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
            : `<svg width="13" height="13" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`}
        </button>
        <button class="ctrl-btn" id="next-btn" title="Next">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.5"/></svg>
        </button>
        <button class="ctrl-btn ${state.repeatMode !== 'none' ? 'ctrl-active' : ''}" id="repeat-btn" title="Repeat (${state.repeatMode})">
          ${repeatIcons[state.repeatMode]}
          ${state.repeatMode === 'one' ? '<span class="repeat-one-badge">1</span>' : ''}
        </button>
      </div>
      <div class="progress-row">
        <span class="time-label" id="time-current">0:00</span>
        <div class="progress-bar" id="progress-bar">
          <div class="progress-fill" id="progress-fill" style="width:${state.progressPercent}%"></div>
          <div class="progress-thumb" style="left:${state.progressPercent}%"></div>
        </div>
        <span class="time-label" id="time-total">${track ? track.duration : '—'}</span>
      </div>
    </div>

    <div class="player-extra">
      <button class="extra-btn" data-open-modal="lyrics" title="Lyrics" ${!track || state.isPodcastTrack ? 'disabled' : ''}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
      </button>
      <button class="extra-btn" data-open-modal="equalizer" title="Equalizer">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
      </button>
      <button class="extra-btn ${sleepActive ? 'ctrl-active' : ''}" data-open-modal="sleep-timer" title="Sleep Timer">
        ${sleepActive ? `<span id="sleep-countdown" class="sleep-pill">${state.sleepTimerRemaining || ''}</span>` : ''}
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      </button>
      <button class="extra-btn" data-open-modal="quality" title="Quality">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 000 7.07"/></svg>
      </button>
      <button class="extra-btn" id="fullscreen-btn" title="Full Screen">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
      </button>
      <button class="extra-btn" id="mini-player-btn" title="Mini Player">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="14" width="18" height="7" rx="1"/><path d="M3 3h7v7H3z"/></svg>
      </button>
      <div class="volume-group">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" stroke-width="2" style="flex-shrink:0">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/>
        </svg>
        <div class="volume-slider" id="volume-slider">
          <div class="volume-fill" id="volume-fill" style="width:${state.volume}%"></div>
        </div>
      </div>
    </div>
  </div>`;
}

export function bindPlayerEvents() {
  document.getElementById('play-pause-btn')?.addEventListener('click', () => togglePlayPause());
  document.getElementById('prev-btn')?.addEventListener('click', () => playPrev());
  document.getElementById('next-btn')?.addEventListener('click', () => playNext());

  document.getElementById('shuffle-btn')?.addEventListener('click', () => {
    state.shuffleMode = !state.shuffleMode; persist();
    if (app.refreshPlayer) app.refreshPlayer();
  });

  document.getElementById('repeat-btn')?.addEventListener('click', () => {
    const modes = ['none','all','one'];
    const i = modes.indexOf(state.repeatMode);
    state.repeatMode = modes[(i + 1) % modes.length];
    persist(); if (app.refreshPlayer) app.refreshPlayer();
  });

  document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
    state.fullscreen = true;
    if (app.refreshFullscreen) app.refreshFullscreen();
  });

  document.getElementById('mini-player-btn')?.addEventListener('click', () => {
    state.miniPlayer = true;
    if (app.refreshPlayer) app.refreshPlayer();
    if (app.refreshMiniPlayer) app.refreshMiniPlayer();
  });

  document.getElementById('progress-bar')?.addEventListener('click', e => {
    if (!state.currentTrack) return;
    const rect = document.getElementById('progress-bar').getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(pct);
  });

  document.getElementById('volume-slider')?.addEventListener('click', e => {
    const rect = document.getElementById('volume-slider').getBoundingClientRect();
    state.volume = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const fill = document.getElementById('volume-fill');
    if (fill) fill.style.width = `${state.volume}%`;
    setAudioVolume(state.volume);
    persist();
  });

  document.querySelector('[data-player-like]')?.addEventListener('click', () => {
    if (!state.currentTrack) return;
    toggleLikeTrack(state.currentTrack.id);
    if (app.refreshPlayer) app.refreshPlayer();
    if (app.refreshSidebar) app.refreshSidebar();
  });

  document.querySelectorAll('.extra-btn[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (!btn.disabled) openModal(btn.dataset.openModal);
    });
  });
}

export function renderMiniPlayer() {
  const root = document.getElementById('mini-player-root');
  if (!root) return;
  if (!state.miniPlayer || !state.currentTrack) { root.innerHTML = ''; return; }
  const ctx = getPlayerContext();
  const color = ctx?.color || '#00eeff';
  root.innerHTML = `<div class="mini-player">
    <div class="mini-player-icon ${state.isPlaying ? 'playing-icon' : ''}">
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
      </svg>
    </div>
    <div class="mini-player-info">
      <div class="mini-track-name">${state.currentTrack.title}</div>
      <div class="mini-track-artist">${ctx?.artist || ''}</div>
    </div>
    <div class="mini-controls">
      <button class="mini-ctrl" id="mini-play">
        ${state.isPlaying
          ? `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
          : `<svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`}
      </button>
      <button class="mini-ctrl mini-next" id="mini-next">
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"/></svg>
      </button>
      <button class="mini-ctrl mini-expand" id="mini-expand" title="Expand">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
      </button>
    </div>
  </div>`;
  document.getElementById('mini-play')?.addEventListener('click', () => { togglePlayPause(); renderMiniPlayer(); });
  document.getElementById('mini-next')?.addEventListener('click', () => { playNext(); renderMiniPlayer(); });
  document.getElementById('mini-expand')?.addEventListener('click', () => {
    state.miniPlayer = false;
    root.innerHTML = '';
    if (app.refreshPlayer) app.refreshPlayer();
  });
}
