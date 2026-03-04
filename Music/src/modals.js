import { state, persist, createPlaylist, addToPlaylist, removeFromPlaylist } from './state.js';
import { albums, podcasts, genreLyrics, getAlbumForTrack } from './data.js';
import { setSleepTimer, cancelSleepTimer } from './player.js';
import { app } from './app.js';

const EQ_LABELS = ['32Hz','64Hz','125Hz','250Hz','500Hz','1kHz','4kHz','16kHz'];
const EQ_PRESETS = {
  normal:[0,0,0,0,0,0,0,0], bass_boost:[6,5,4,2,0,0,0,0], treble:[0,0,0,0,2,4,5,6],
  pop:[1,2,4,4,2,0,1,2], rock:[4,3,2,1,-1,2,3,4], jazz:[2,1,0,2,3,3,2,1],
  electronic:[4,3,0,-2,2,1,3,4], classical:[0,0,0,0,0,3,4,4], 'hip-hop':[5,4,1,3,-1,-1,2,1], vocal:[-1,0,3,4,4,3,2,0],
};
const QUALITIES = [
  { id:'low', label:'Low', kbps:'64 kbps', desc:'Saves data' },
  { id:'normal', label:'Normal', kbps:'128 kbps', desc:'Balanced' },
  { id:'high', label:'High', kbps:'256 kbps', desc:'High quality' },
  { id:'vhigh', label:'Very High', kbps:'320 kbps', desc:'Best quality' },
];
const TIMER_OPTIONS = [15,30,45,60,90];

export function openModal(type, data = null) {
  state.activeModal = type; state.modalData = data;
  renderOverlay();
}

export function closeModal() {
  state.activeModal = null; state.modalData = null;
  document.getElementById('modal-overlay')?.remove();
}

function renderOverlay() {
  document.getElementById('modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = buildModal();
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', escHandler);
  bindModalEvents();
}

function escHandler(e) { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escHandler); } }

function buildModal() {
  switch (state.activeModal) {
    case 'lyrics': return lyricsModal();
    case 'equalizer': return eqModal();
    case 'sleep-timer': return sleepModal();
    case 'quality': return qualityModal();
    case 'download': return downloadModal();
    case 'edit-track': return editTrackModal();
    case 'playlist-download': return playlistDownloadModal();
    case 'create-playlist': return createPlaylistModal();
    case 'add-to-playlist': return addToPlaylistModal();
    case 'music-info': return musicInfoModal();
    case 'customize-playlist': return customizePlaylistModal();
    default: return '';
  }
}

function shell(title, body, wide = false) {
  return `<div class="modal ${wide ? 'modal-wide' : ''}">
    <div class="modal-header">
      <span class="modal-title">${title}</span>
      <button class="modal-close" id="modal-close-btn">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">${body}</div>
  </div>`;
}

function lyricsModal() {
  const track = state.currentTrack;
  if (!track) return shell('Lyrics', '<p style="color:var(--text-muted)">No track playing.</p>');
  const album = getAlbumForTrack(track.id);
  const lyrics = genreLyrics[album?.genre] || genreLyrics['Pop'];
  const lines = lyrics.split('\n').map(line => {
    if (!line) return '<br>';
    if (line.startsWith('[')) return `<div class="lyrics-section">${line}</div>`;
    return `<div class="lyrics-line">${line}</div>`;
  }).join('');
  return shell(`Lyrics — ${track.title}`,
    `<div class="lyrics-track-info"><strong>${track.title}</strong><span>${album?.artist || ''} &middot; ${album?.title || ''}</span></div>
    <div class="lyrics-content">${lines}</div>`, true);
}

function eqSVG(bands) {
  const w = 400, h = 100, n = bands.length;
  const xs = bands.map((_, i) => (i / (n - 1)) * w);
  const ys = bands.map(b => h / 2 - (b / 12) * (h / 2 - 10));
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < n; i++) {
    const cx = (xs[i-1] + xs[i]) / 2;
    d += ` C ${cx} ${ys[i-1]}, ${cx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" class="eq-svg" preserveAspectRatio="none">
    <defs><linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity="0.5"/><stop offset="100%" stop-color="var(--accent2)" stop-opacity="0.05"/></linearGradient></defs>
    <path d="${d} L ${xs[n-1]} ${h} L ${xs[0]} ${h} Z" fill="url(#eqG)"/>
    <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    ${xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="4" fill="var(--accent)" style="filter:drop-shadow(0 0 4px var(--accent))"/>`).join('')}
    <line x1="0" y1="${h/2}" x2="${w}" y2="${h/2}" stroke="rgba(0,238,255,0.2)" stroke-width="1" stroke-dasharray="3"/>
  </svg>`;
}

function eqModal() {
  return shell('Equalizer',
    `<div class="eq-presets">${Object.keys(EQ_PRESETS).map(k => `
      <button class="eq-preset-btn ${state.eqPreset===k?'active':''}" data-eq-preset="${k}">
        ${k.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
      </button>`).join('')}</div>
    <div class="eq-chart">${eqSVG(state.eqBands)}</div>
    <div class="eq-sliders">${state.eqBands.map((val, i) => `
      <div class="eq-band">
        <span class="eq-val" id="eq-val-${i}">${val > 0 ? '+' : ''}${val}</span>
        <div class="eq-slider-wrap"><input type="range" class="eq-slider" min="-12" max="12" step="1" value="${val}" data-eq-band="${i}"></div>
        <span class="eq-label">${EQ_LABELS[i]}</span>
      </div>`).join('')}</div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
      <button class="btn-secondary" data-eq-reset>Reset</button>
      <button class="btn-primary" id="eq-apply-btn">Apply</button>
    </div>`, true);
}

function sleepModal() {
  const active = !!state.sleepTimerEnd;
  return shell('Sleep Timer',
    `<p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Pause playback automatically after a set time.</p>
    ${active ? `<div class="sleep-active-banner">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      Active — <strong id="modal-sleep-countdown">${state.sleepTimerRemaining||''}</strong>
      <button class="btn-secondary btn-sm" style="margin-left:auto" data-cancel-timer>Cancel</button>
    </div>` : ''}
    <div class="timer-options">${TIMER_OPTIONS.map(m => `
      <button class="timer-btn" data-set-timer="${m}">
        <span class="timer-btn-val">${m}</span><span class="timer-btn-unit">min</span>
      </button>`).join('')}</div>
    <div class="custom-timer-row">
      <input type="number" id="custom-timer-input" min="1" max="360" placeholder="Custom (min)" class="custom-timer-input"/>
      <button class="btn-primary" id="custom-timer-btn">Set</button>
    </div>`);
}

function qualityModal() {
  return shell('Streaming Quality',
    `<p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">Select audio quality for streaming.</p>
    <div class="quality-options">${QUALITIES.map(q => `
      <button class="quality-btn ${state.streamingQuality===q.id?'active':''}" data-set-quality="${q.id}">
        <div class="quality-btn-left"><div class="quality-label">${q.label}</div><div class="quality-desc">${q.desc}</div></div>
        <div class="quality-kbps">${q.kbps}</div>
        ${state.streamingQuality===q.id?`<svg width="14" height="14" fill="var(--accent)" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`:''}
      </button>`).join('')}</div>`);
}

function downloadModal() {
  const data = state.modalData;
  let track = null, album = null;
  if (data?.trackId) {
    album = albums.find(a => a.id === parseInt(data.albumId));
    track = album?.tracks.find(t => t.id === parseInt(data.trackId));
  }
  if (!track && state.currentTrack && !state.isPodcastTrack) {
    track = state.currentTrack;
    album = getAlbumForTrack(track.id);
  }
  const hasSrc = !!track?.src;
  const filename = track ? `${track.title}.mp3` : 'track.mp3';
  return shell('Download',
    `${track ? `<div class="download-track-info">
      <div class="download-cover" style="background:${album?.color || 'var(--accent)'}22">&#9835;</div>
      <div>
        <div style="font-weight:600;font-size:13px">${track.title}</div>
        <div style="color:var(--text-muted);font-size:12px">${album?.artist || ''} &middot; ${track.duration || ''}</div>
      </div>
    </div>` : ''}
    ${hasSrc
      ? `<button class="btn-primary" style="width:100%;margin-top:12px;justify-content:center;gap:8px"
           data-do-download data-src="${track.src}" data-filename="${filename}">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download File
        </button>`
      : `<p style="color:var(--text-muted);font-size:13px;margin-top:12px;text-align:center">
          No file available for download. Add audio files to /public/music/ to enable downloads.
        </p>`}
    <div id="download-status" style="display:none;margin-top:10px;text-align:center;color:var(--accent);font-size:13px"></div>`);
}

function editTrackModal() {
  const data = state.modalData;
  if (!data) return shell('Edit Track', '<p style="color:var(--text-muted)">No track selected.</p>');
  const album = albums.find(a => a.id === parseInt(data.albumId));
  const track = album?.tracks.find(t => t.id === parseInt(data.trackId));
  if (!track || !album) return shell('Edit Track', '<p style="color:var(--text-muted)">Track not found.</p>');
  const titleOv = state.trackTitleOverrides[track.id] || '';
  const albumOv = state.albumMetaOverrides[album.id] || {};
  return shell('Edit Track Properties',
    `<div class="edit-track-cover" style="background:linear-gradient(135deg,${album.color}30,${album.color}08)">
      <span style="font-size:28px;color:${album.color}">&#9835;</span>
    </div>
    <div class="form-group">
      <label class="form-label">Track Title</label>
      <input class="form-input" id="edit-title" type="text" value="${titleOv || track.title}" maxlength="120"/>
    </div>
    <div class="form-group">
      <label class="form-label">Artist <span style="font-size:10px;color:var(--text-muted)">(applies to whole album)</span></label>
      <input class="form-input" id="edit-artist" type="text" value="${albumOv.artist || album.artist}" maxlength="100"/>
    </div>
    <div class="form-group">
      <label class="form-label">Genre <span style="font-size:10px;color:var(--text-muted)">(applies to whole album)</span></label>
      <input class="form-input" id="edit-genre" type="text" value="${albumOv.genre || album.genre}" maxlength="60"/>
    </div>
    <div class="form-group">
      <label class="form-label">Year <span style="font-size:10px;color:var(--text-muted)">(applies to whole album)</span></label>
      <input class="form-input" id="edit-year" type="number" value="${albumOv.year || album.year}" min="1900" max="2100" style="max-width:120px"/>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">
      <button class="btn-secondary" id="modal-close-btn2">Cancel</button>
      <button class="btn-primary" id="edit-track-save"
        data-track-id="${track.id}" data-album-id="${album.id}">Save Changes</button>
    </div>`);
}

function playlistDownloadModal() {
  const data = state.modalData;
  const playlist = state.playlists.find(p => p.id === parseInt(data?.playlistId));
  if (!playlist) return shell('Download Playlist', '<p style="color:var(--text-muted)">Playlist not found.</p>');
  const items = playlist.trackIds.map(id => {
    for (const a of albums) {
      const t = a.tracks.find(t => t.id === id);
      if (t) return { track: t, album: a };
    }
    return null;
  }).filter(Boolean);
  const downloadable = items.filter(it => !!it.track.src);
  return shell(`Download — ${playlist.name}`,
    `<p style="color:var(--text-muted);font-size:12px;margin-bottom:14px">${downloadable.length} of ${items.length} tracks available for download</p>
    ${downloadable.length > 1 ? `<button class="btn-primary" style="width:100%;justify-content:center;gap:8px;margin-bottom:14px" id="download-all-btn">
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download All (${downloadable.length} files)
    </button>` : ''}
    <div class="pl-download-list">
      ${items.map(({ track, album }) => `
        <div class="pl-download-item">
          <div class="pl-download-info">
            <span class="pl-download-title">${track.title}</span>
            <span class="pl-download-artist">${album.artist}</span>
          </div>
          ${track.src
            ? `<button class="icon-btn" data-do-download data-src="${track.src}" data-filename="${track.title}.mp3" title="Download">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>`
            : `<span style="font-size:11px;color:var(--text-muted)">N/A</span>`}
        </div>`).join('')}
    </div>`, true);
}

function createPlaylistModal() {
  return shell('New Playlist',
    `<div class="form-group">
      <label class="form-label">Playlist Name</label>
      <input class="form-input" id="playlist-name-input" type="text" placeholder="My Playlist" maxlength="50" autofocus/>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <button class="btn-secondary" id="modal-close-btn2">Cancel</button>
      <button class="btn-primary" id="create-playlist-submit">Create</button>
    </div>`);
}

function addToPlaylistModal() {
  const { playlists } = state;
  return shell('Add to Playlist',
    `${playlists.length === 0
      ? `<p style="color:var(--text-muted);font-size:13px">No playlists yet.</p>
         <button class="btn-primary" style="margin-top:10px" data-open-modal="create-playlist">Create Playlist</button>`
      : `<div class="add-playlist-list">${playlists.map(p => `
        <button class="add-playlist-item" data-add-track-to-playlist="${p.id}">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="1.5">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          </svg>
          <div><div style="font-weight:600;font-size:13px">${p.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${p.trackIds.length} tracks</div></div>
        </button>`).join('')}</div>`}`);
}

function musicInfoModal() {
  const data = state.modalData;
  if (!data) {
    const track = state.currentTrack;
    const album = track ? getAlbumForTrack(track.id) : null;
    if (!track || !album) return shell('Track Info', '<p style="color:var(--text-muted)">No track selected.</p>');
    const idx = album.tracks.findIndex(t => t.id === track.id);
    return shell('Track Info', infoContent(track, album, idx + 1));
  }
  const album = albums.find(a => a.id === parseInt(data.albumId));
  const track = album?.tracks.find(t => t.id === parseInt(data.trackId));
  if (!track || !album) return shell('Track Info', '<p style="color:var(--text-muted)">Track not found.</p>');
  const idx = album.tracks.findIndex(t => t.id === track.id);
  return shell('Track Info', infoContent(track, album, idx + 1));
}

function infoContent(track, album, trackNum) {
  const rows = [
    { label: 'Title', value: track.title },
    { label: 'Artist', value: album.artist },
    { label: 'Album', value: album.title },
    { label: 'Genre', value: album.genre },
    { label: 'Year', value: album.year },
    { label: 'Track', value: `${trackNum} of ${album.tracks.length}` },
    { label: 'Duration', value: track.duration },
    { label: 'Quality', value: { low:'64kbps', normal:'128kbps', high:'256kbps', vhigh:'320kbps' }[state.streamingQuality] },
  ];
  return `<div class="music-info-cover" style="background:linear-gradient(135deg,${album.color}30,${album.color}10);border-color:${album.color}44">
    <div style="font-size:36px;color:${album.color}">&#9835;</div>
    <div style="font-size:13px;font-weight:700;font-family:var(--font-mono);color:${album.color};letter-spacing:0.05em">${album.genre.toUpperCase()}</div>
  </div>
  <div class="music-info-rows">${rows.map(r => `
    <div class="music-info-row">
      <span class="music-info-label">${r.label}</span>
      <span class="music-info-value">${r.value}</span>
    </div>`).join('')}</div>`;
}

function customizePlaylistModal() {
  const playlistId = state.modalData?.playlistId;
  const playlist = state.playlists.find(p => p.id === parseInt(playlistId));
  if (!playlist) return shell('Customize Playlist', '<p>Playlist not found.</p>');
  const colors = ['#00eeff', '#ff00aa', '#7700ff', '#ff6600', '#00ff88', '#ff4488', '#ffcc00', '#44aaff'];
  return shell('Customize Playlist',
    `<div class="form-group" style="margin-bottom:14px">
      <label class="form-label">Playlist Name</label>
      <input class="form-input" id="pl-name-input" type="text" value="${playlist.name}" maxlength="50"/>
    </div>
    <div class="form-group" style="margin-bottom:16px">
      <label class="form-label">Color</label>
      <div class="color-picker">${colors.map(c => `
        <button class="color-swatch ${playlist.color === c ? 'selected' : ''}" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
    </div>
    ${playlist.trackIds.length > 0 ? `<div class="form-group" style="margin-bottom:16px">
      <label class="form-label">Track Order</label>
      <div class="pl-track-order" id="pl-track-order">
        ${playlist.trackIds.map((id, i) => {
          const { track } = (getTrackByIdFull(id) || {});
          if (!track) return '';
          return `<div class="pl-track-row" data-idx="${i}">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <span class="pl-track-title">${track.title}</span>
            <div class="pl-track-btns">
              ${i > 0 ? `<button class="icon-btn" data-move-up="${i}">&#8593;</button>` : ''}
              ${i < playlist.trackIds.length - 1 ? `<button class="icon-btn" data-move-down="${i}">&#8595;</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button class="btn-secondary" id="modal-close-btn2">Cancel</button>
      <button class="btn-primary" id="pl-save-btn" data-pl-id="${playlist.id}">Save</button>
    </div>`, true);
}

function getTrackByIdFull(id) {
  for (const album of albums) {
    const track = album.tracks.find(t => t.id === id);
    if (track) return { track, album };
  }
  return null;
}

export function bindModalEvents() {
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-close-btn2')?.addEventListener('click', closeModal);

  document.querySelectorAll('[data-eq-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.eqPreset = btn.dataset.eqPreset;
      state.eqBands = [...EQ_PRESETS[state.eqPreset]];
      persist(); renderOverlay();
    });
  });
  document.querySelectorAll('.eq-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const i = parseInt(slider.dataset.eqBand);
      state.eqBands[i] = parseInt(slider.value);
      const v = document.getElementById(`eq-val-${i}`);
      if (v) v.textContent = (state.eqBands[i] > 0 ? '+' : '') + state.eqBands[i];
      const chart = document.querySelector('.eq-chart');
      if (chart) chart.innerHTML = eqSVG(state.eqBands);
    });
  });
  document.querySelector('[data-eq-reset]')?.addEventListener('click', () => {
    state.eqPreset = 'normal'; state.eqBands = [...EQ_PRESETS.normal]; persist(); renderOverlay();
  });
  document.getElementById('eq-apply-btn')?.addEventListener('click', () => { persist(); closeModal(); });

  document.querySelectorAll('[data-set-timer]').forEach(btn => {
    btn.addEventListener('click', () => { setSleepTimer(parseInt(btn.dataset.setTimer)); closeModal(); if (app.refreshPlayer) app.refreshPlayer(); });
  });
  document.getElementById('custom-timer-btn')?.addEventListener('click', () => {
    const val = parseInt(document.getElementById('custom-timer-input')?.value);
    if (val > 0 && val <= 360) { setSleepTimer(val); closeModal(); if (app.refreshPlayer) app.refreshPlayer(); }
  });
  document.querySelector('[data-cancel-timer]')?.addEventListener('click', () => {
    cancelSleepTimer(); closeModal(); if (app.refreshPlayer) app.refreshPlayer();
  });
  document.querySelectorAll('[data-set-quality]').forEach(btn => {
    btn.addEventListener('click', () => { state.streamingQuality = btn.dataset.setQuality; persist(); renderOverlay(); });
  });
  document.querySelectorAll('[data-do-download]').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src;
      const filename = btn.dataset.filename || 'track.mp3';
      if (!src) return;
      const a = document.createElement('a');
      a.href = src;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      const status = document.getElementById('download-status');
      if (status) {
        status.style.display = 'block';
        status.textContent = `Downloading "${filename}"...`;
        setTimeout(() => { status.textContent = 'Download started!'; }, 800);
      }
    });
  });
  document.getElementById('download-all-btn')?.addEventListener('click', () => {
    const btns = document.querySelectorAll('[data-do-download]');
    let i = 0;
    function downloadNext() {
      if (i >= btns.length) return;
      const b = btns[i++];
      const a = document.createElement('a');
      a.href = b.dataset.src;
      a.download = b.dataset.filename || 'track.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(downloadNext, 800);
    }
    downloadNext();
  });
  document.getElementById('edit-track-save')?.addEventListener('click', () => {
    const btn = document.getElementById('edit-track-save');
    const trackId = parseInt(btn.dataset.trackId);
    const albumId = parseInt(btn.dataset.albumId);
    const album = albums.find(a => a.id === albumId);
    const track = album?.tracks.find(t => t.id === trackId);
    if (!track || !album) { closeModal(); return; }
    const newTitle = document.getElementById('edit-title')?.value.trim();
    const newArtist = document.getElementById('edit-artist')?.value.trim();
    const newGenre = document.getElementById('edit-genre')?.value.trim();
    const newYear = parseInt(document.getElementById('edit-year')?.value);
    if (newTitle && newTitle !== track.title) {
      state.trackTitleOverrides[trackId] = newTitle;
      track.title = newTitle;
    } else if (!newTitle || newTitle === track.title) {
      delete state.trackTitleOverrides[trackId];
    }
    const albumOv = {};
    if (newArtist) { albumOv.artist = newArtist; album.artist = newArtist; }
    if (newGenre) { albumOv.genre = newGenre; album.genre = newGenre; }
    if (!isNaN(newYear)) { albumOv.year = newYear; album.year = newYear; }
    if (Object.keys(albumOv).length > 0) {
      state.albumMetaOverrides[albumId] = { ...(state.albumMetaOverrides[albumId] || {}), ...albumOv };
    }
    persist();
    closeModal();
    if (app.refreshMain) app.refreshMain();
    if (app.refreshPlayer) app.refreshPlayer();
  });
  document.getElementById('create-playlist-submit')?.addEventListener('click', () => {
    const name = document.getElementById('playlist-name-input')?.value.trim();
    if (name) {
      const trackId = state.modalData?.trackId;
      const p = createPlaylist(name);
      if (trackId) addToPlaylist(p.id, trackId);
      closeModal(); if (app.refreshMain) app.refreshMain(); if (app.refreshSidebar) app.refreshSidebar();
    }
  });
  document.getElementById('playlist-name-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('create-playlist-submit')?.click();
  });
  document.querySelectorAll('[data-add-track-to-playlist]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = parseInt(btn.dataset.addTrackToPlaylist);
      const tid = state.modalData?.trackId;
      if (tid) addToPlaylist(pid, tid);
      closeModal(); if (app.refreshMain) app.refreshMain();
    });
  });
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => { closeModal(); setTimeout(() => openModal(btn.dataset.openModal), 50); });
  });

  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  document.getElementById('pl-save-btn')?.addEventListener('click', () => {
    const plId = parseInt(document.getElementById('pl-save-btn')?.dataset.plId);
    const pl = state.playlists.find(p => p.id === plId);
    if (!pl) { closeModal(); return; }
    const name = document.getElementById('pl-name-input')?.value.trim();
    if (name) pl.name = name;
    const sel = document.querySelector('.color-swatch.selected');
    if (sel) pl.color = sel.dataset.color;
    persist(); closeModal(); if (app.refreshMain) app.refreshMain(); if (app.refreshSidebar) app.refreshSidebar();
  });

  document.querySelectorAll('[data-move-up]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const plId = parseInt(document.getElementById('pl-save-btn')?.dataset.plId);
      const pl = state.playlists.find(p => p.id === plId);
      if (!pl) return;
      const i = parseInt(btn.dataset.moveUp);
      [pl.trackIds[i], pl.trackIds[i-1]] = [pl.trackIds[i-1], pl.trackIds[i]];
      persist(); renderOverlay();
    });
  });
  document.querySelectorAll('[data-move-down]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const plId = parseInt(document.getElementById('pl-save-btn')?.dataset.plId);
      const pl = state.playlists.find(p => p.id === plId);
      if (!pl) return;
      const i = parseInt(btn.dataset.moveDown);
      [pl.trackIds[i], pl.trackIds[i+1]] = [pl.trackIds[i+1], pl.trackIds[i]];
      persist(); renderOverlay();
    });
  });
}
