import { state } from './state.js';
import { playNext } from './player.js';

let audioEl = null;

export function getAudioEl() {
  if (!audioEl) audioEl = document.getElementById('app-audio');
  return audioEl;
}

export function playTrackFromURL(track) {
  const el = getAudioEl();
  if (!el || !track.src) return;
  el.src = track.src;
  el.currentTime = 0;
  el.volume = Math.max(0, Math.min(1, state.volume / 100));
  const playPromise = el.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.warn('Audio play failed:', err.message);
    });
  }
  el.ontimeupdate = () => {
    if (el.duration > 0) {
      state.progressPercent = (el.currentTime / el.duration) * 100;
      const fill = document.getElementById('progress-fill');
      if (fill) fill.style.width = `${state.progressPercent}%`;
      const npFill = document.getElementById('np-progress-fill');
      if (npFill) npFill.style.width = `${state.progressPercent}%`;
      const lineFill = document.getElementById('player-line-progress');
      if (lineFill) lineFill.style.width = `${state.progressPercent}%`;
      const curEl = document.getElementById('time-current');
      if (curEl) curEl.textContent = fmtTime(el.currentTime);
      const npCur = document.getElementById('np-time-current');
      if (npCur) npCur.textContent = fmtTime(el.currentTime);
      const totEl = document.getElementById('time-total');
      if (totEl) totEl.textContent = fmtTime(el.duration);
    }
  };
  el.onended = () => {
    state.isPlaying = false;
    if (state.repeatMode === 'one') {
      playTrackFromURL(track);
      state.isPlaying = true;
      return;
    }
    playNext();
  };
}

export function pauseAudio() {
  const el = getAudioEl();
  if (el) el.pause();
}

export function resumeAudio() {
  const el = getAudioEl();
  if (!el) return;
  const playPromise = el.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.warn('Resume failed:', err.message);
    });
  }
}

export function seekAudio(pct) {
  const el = getAudioEl();
  if (el && el.duration) el.currentTime = (pct / 100) * el.duration;
}

export function stopAudio() {
  const el = getAudioEl();
  if (el) {
    el.pause();
    el.src = '';
    el.ontimeupdate = null;
    el.onended = null;
  }
}

export function setAudioVolume(vol) {
  const el = getAudioEl();
  if (el) el.volume = Math.max(0, Math.min(1, vol / 100));
}

function fmtTime(secs) {
  secs = Math.floor(secs || 0);
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
