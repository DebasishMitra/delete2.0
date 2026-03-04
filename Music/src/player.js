import { state, persist } from './state.js';
import { albums, podcasts, getAlbumForTrack } from './data.js';
import { app } from './app.js';
import { pauseAudio, resumeAudio, stopAudio, playTrackFromURL, setAudioVolume, seekAudio } from './audio.js';
import { broadcastPlayState } from './p2p.js';

let progressInterval = null;
let sleepInterval = null;
let shuffleQueue = [];

export function playTrack(track, albumId, isPodcast = false) {
  if (state.currentTrack && state.currentTrack.id === track.id) {
    togglePlayPause(); return;
  }
  stopAudio();
  stopProgress();
  state.currentTrack = track;
  state.currentTrackAlbumId = albumId;
  state.isPodcastTrack = isPodcast;
  state.isPlaying = true;
  state.progressPercent = 0;
  if (track.src) {
    setAudioVolume(state.volume);
    playTrackFromURL(track);
  } else {
    startProgress();
  }
  if (app.refreshPlayer) app.refreshPlayer();
  if (app.refreshMain) app.refreshMain();
  if (app.refreshSidebar) app.refreshSidebar();
  if (app.refreshFullscreen) app.refreshFullscreen();
  if (app.refreshMiniPlayer) app.refreshMiniPlayer();
  broadcastPlayState();
}

export function togglePlayPause() {
  if (!state.currentTrack) return;
  state.isPlaying = !state.isPlaying;
  if (state.isPlaying) {
    resumeAudio();
    if (!state.currentTrack.src) startProgress();
  } else {
    pauseAudio();
    stopProgress();
  }
  if (app.refreshPlayer) app.refreshPlayer();
  if (app.refreshFullscreen) app.refreshFullscreen();
  if (app.refreshMiniPlayer) app.refreshMiniPlayer();
  broadcastPlayState();
}

export function playNext() {
  if (!state.currentTrack) return;
  if (state.repeatMode === 'one') {
    state.progressPercent = 0;
    if (state.currentTrack.src) { playTrackFromURL(state.currentTrack); }
    else { startProgress(); }
    if (app.refreshPlayer) app.refreshPlayer();
    return;
  }
  if (state.isPodcastTrack) {
    const podcast = podcasts.find(p => p.id === state.currentTrackAlbumId);
    if (!podcast) return;
    const idx = podcast.episodes.findIndex(e => e.id === state.currentTrack.id);
    playTrack(podcast.episodes[(idx + 1) % podcast.episodes.length], podcast.id, true); return;
  }
  const album = getAlbumForTrack(state.currentTrack.id);
  if (!album) return;
  if (state.shuffleMode) {
    if (!shuffleQueue.length) buildShuffleQueue(album);
    const curr = shuffleQueue.indexOf(state.currentTrack.id);
    const next = shuffleQueue[(curr + 1) % shuffleQueue.length];
    const track = album.tracks.find(t => t.id === next);
    if (track) playTrack(track, album.id); return;
  }
  const idx = album.tracks.findIndex(t => t.id === state.currentTrack.id);
  const nextIdx = idx + 1;
  if (nextIdx >= album.tracks.length && state.repeatMode === 'none') {
    state.isPlaying = false; stopProgress(); stopAudio();
    if (app.refreshPlayer) app.refreshPlayer(); return;
  }
  playTrack(album.tracks[nextIdx % album.tracks.length], album.id);
}

export function playPrev() {
  if (!state.currentTrack) return;
  if (state.isPodcastTrack) {
    const podcast = podcasts.find(p => p.id === state.currentTrackAlbumId);
    if (!podcast) return;
    const idx = podcast.episodes.findIndex(e => e.id === state.currentTrack.id);
    playTrack(podcast.episodes[(idx - 1 + podcast.episodes.length) % podcast.episodes.length], podcast.id, true); return;
  }
  const album = getAlbumForTrack(state.currentTrack.id);
  if (!album) return;
  const idx = album.tracks.findIndex(t => t.id === state.currentTrack.id);
  playTrack(album.tracks[(idx - 1 + album.tracks.length) % album.tracks.length], album.id);
}

export function startProgress() {
  stopProgress();
  progressInterval = setInterval(() => {
    if (!state.currentTrack || !state.isPlaying) return;
    const total = parseDuration(state.currentTrack.duration);
    state.progressPercent += (1 / total) * 100;
    if (state.progressPercent >= 100) { state.progressPercent = 0; playNext(); return; }
    updateProgressUI();
  }, 1000);
}

export function stopProgress() {
  if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
}

export function seekTo(pct) {
  state.progressPercent = Math.max(0, Math.min(100, pct));
  if (state.currentTrack?.src) seekAudio(pct);
  updateProgressUI();
}

export function setSleepTimer(minutes) {
  cancelSleepTimer();
  state.sleepTimerEnd = Date.now() + minutes * 60 * 1000;
  sleepInterval = setInterval(() => {
    const rem = state.sleepTimerEnd - Date.now();
    if (rem <= 0) {
      cancelSleepTimer(); state.isPlaying = false; stopProgress(); pauseAudio();
      if (app.refreshPlayer) app.refreshPlayer();
    } else {
      state.sleepTimerRemaining = formatTime(rem / 1000);
      const el = document.getElementById('sleep-countdown');
      if (el) el.textContent = state.sleepTimerRemaining;
    }
  }, 1000);
  state.sleepTimerRemaining = formatTime(minutes * 60);
  if (app.refreshPlayer) app.refreshPlayer();
}

export function cancelSleepTimer() {
  if (sleepInterval) { clearInterval(sleepInterval); sleepInterval = null; }
  state.sleepTimerEnd = null; state.sleepTimerRemaining = null;
}

export function updateProgressUI() {
  const cur = state.currentTrack ? (state.progressPercent / 100) * parseDuration(state.currentTrack.duration) : 0;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${state.progressPercent}%`;
  const npFill = document.getElementById('np-progress-fill');
  if (npFill) npFill.style.width = `${state.progressPercent}%`;
  const tc = document.getElementById('time-current');
  if (tc) tc.textContent = formatTime(cur);
  const npTc = document.getElementById('np-time-current');
  if (npTc) npTc.textContent = formatTime(cur);
  const globalLine = document.getElementById('player-line-progress');
  if (globalLine) globalLine.style.width = `${state.progressPercent}%`;
  const fsFill = document.getElementById('fs-fill');
  if (fsFill) fsFill.style.width = `${state.progressPercent}%`;
}

export function getPlayerContext() {
  if (!state.currentTrack) return null;
  if (state.isPodcastTrack) {
    const podcast = podcasts.find(p => p.id === state.currentTrackAlbumId);
    return { color: podcast?.color || '#8b5cf6', artist: podcast?.host || '', isAlbum: false };
  }
  const album = getAlbumForTrack(state.currentTrack.id);
  return { color: album?.color || '#8b5cf6', artist: album?.artist || '', isAlbum: true, album };
}

export function buildShuffleQueue(album) {
  shuffleQueue = [...album.tracks.map(t => t.id)].sort(() => Math.random() - 0.5);
}

export function parseDuration(str) {
  if (!str || str === '—') return 240;
  const parts = str.split(':').map(Number);
  return parts.length === 3 ? parts[0]*3600 + parts[1]*60 + parts[2] : parts[0]*60 + parts[1];
}

export function formatTime(secs) {
  secs = Math.floor(secs);
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}
