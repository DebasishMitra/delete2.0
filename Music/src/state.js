function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export const state = {
  view: 'home',
  currentGenre: 'All',
  currentQuery: '',
  currentAlbumId: null,
  currentArtistId: null,
  currentPlaylistId: null,
  currentPodcastId: null,
  currentTrack: null,
  currentTrackAlbumId: null,
  isPodcastTrack: false,
  isPlaying: false,
  progressPercent: 0,
  volume: load('sv_volume', 70),
  repeatMode: load('sv_repeat', 'none'),
  shuffleMode: load('sv_shuffle', false),
  miniPlayer: false,
  fullscreen: false,
  likedTracks: load('sv_likedTracks', []),
  likedAlbums: load('sv_likedAlbums', []),
  ringtones: load('sv_ringtones', []),
  playlists: load('sv_playlists', []),
  streamingQuality: load('sv_quality', 'high'),
  eqPreset: load('sv_eqPreset', 'normal'),
  eqBands: load('sv_eqBands', [0, 0, 0, 0, 0, 0, 0, 0]),
  sleepTimerEnd: null,
  sleepTimerRemaining: null,
  activeModal: null,
  modalData: null,
  p2pEnabled: false,
  p2pSessionId: null,
  p2pPeers: 0,
  trackTitleOverrides: load('sv_trackTitles', {}),
  albumMetaOverrides: load('sv_albumMeta', {}),
};

export function persist() {
  save('sv_volume', state.volume);
  save('sv_trackTitles', state.trackTitleOverrides);
  save('sv_albumMeta', state.albumMetaOverrides);
  save('sv_likedTracks', state.likedTracks);
  save('sv_likedAlbums', state.likedAlbums);
  save('sv_ringtones', state.ringtones);
  save('sv_playlists', state.playlists);
  save('sv_quality', state.streamingQuality);
  save('sv_eqPreset', state.eqPreset);
  save('sv_eqBands', state.eqBands);
  save('sv_repeat', state.repeatMode);
  save('sv_shuffle', state.shuffleMode);
}

export function isTrackLiked(id) { return state.likedTracks.includes(id); }
export function toggleLikeTrack(id) {
  const i = state.likedTracks.indexOf(id);
  if (i === -1) state.likedTracks.push(id); else state.likedTracks.splice(i, 1);
  persist();
}
export function isAlbumLiked(id) { return state.likedAlbums.includes(id); }
export function toggleLikeAlbum(id) {
  const i = state.likedAlbums.indexOf(id);
  if (i === -1) state.likedAlbums.push(id); else state.likedAlbums.splice(i, 1);
  persist();
}
export function isRingtone(id) { return state.ringtones.includes(id); }
export function toggleRingtone(id) {
  const i = state.ringtones.indexOf(id);
  if (i === -1) state.ringtones.push(id); else state.ringtones.splice(i, 1);
  persist();
}
export function createPlaylist(name) {
  const p = { id: Date.now(), name, trackIds: [], createdAt: new Date().toLocaleDateString(), color: randomColor() };
  state.playlists.push(p); persist(); return p;
}
export function deletePlaylist(id) {
  state.playlists = state.playlists.filter(p => p.id !== id); persist();
}
export function addToPlaylist(playlistId, trackId) {
  const p = state.playlists.find(p => p.id === playlistId);
  if (p && !p.trackIds.includes(trackId)) { p.trackIds.push(trackId); persist(); }
}
export function removeFromPlaylist(playlistId, trackId) {
  const p = state.playlists.find(p => p.id === playlistId);
  if (p) { p.trackIds = p.trackIds.filter(id => id !== trackId); persist(); }
}
function randomColor() {
  const colors = ['#00eeff', '#ff00aa', '#7700ff', '#ff6600', '#00ff88', '#ff4488'];
  return colors[Math.floor(Math.random() * colors.length)];
}
