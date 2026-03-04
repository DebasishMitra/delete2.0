import { state } from './state.js';
import { app } from './app.js';

let channel = null;
let presenceInterval = null;

export function createSession() {
  const id = genId();
  state.p2pSessionId = id;
  state.p2pEnabled = true;
  state.p2pPeers = 1;
  openChannel(id);
  return id;
}

export function joinSession(id) {
  id = id.toUpperCase().trim();
  if (!id || id.length < 4) return false;
  state.p2pSessionId = id;
  state.p2pEnabled = true;
  openChannel(id);
  broadcast({ type: 'join' });
  return true;
}

export function leaveSession() {
  broadcast({ type: 'leave' });
  if (channel) { channel.close(); channel = null; }
  if (presenceInterval) { clearInterval(presenceInterval); presenceInterval = null; }
  state.p2pEnabled = false;
  state.p2pSessionId = null;
  state.p2pPeers = 0;
}

export function broadcast(data) {
  if (channel) {
    try { channel.postMessage({ ...data, from: state.p2pSessionId }); } catch {}
  }
}

export function broadcastPlayState() {
  if (!state.p2pEnabled || !state.currentTrack) return;
  broadcast({
    type: 'sync',
    trackId: state.currentTrack.id,
    albumId: state.currentTrackAlbumId,
    isPlaying: state.isPlaying,
    pct: state.progressPercent,
  });
}

function openChannel(id) {
  if (channel) { channel.close(); channel = null; }
  channel = new BroadcastChannel(`sv_${id}`);
  channel.onmessage = handleMessage;
  presenceInterval = setInterval(() => broadcast({ type: 'ping' }), 3000);
}

let peerTimeouts = {};

function handleMessage(e) {
  const { type } = e.data;
  if (type === 'ping' || type === 'join') {
    const peerId = e.data.from;
    if (!peerTimeouts[peerId]) state.p2pPeers = (state.p2pPeers || 1) + 1;
    clearTimeout(peerTimeouts[peerId]);
    peerTimeouts[peerId] = setTimeout(() => {
      delete peerTimeouts[peerId];
      state.p2pPeers = Math.max(1, (state.p2pPeers || 2) - 1);
      if (app.refreshPlayer) app.refreshPlayer();
    }, 9000);
    if (type === 'join') broadcast({ type: 'ping' });
    if (app.refreshPlayer) app.refreshPlayer();
  }
  if (type === 'leave') {
    state.p2pPeers = Math.max(1, (state.p2pPeers || 2) - 1);
    if (app.refreshPlayer) app.refreshPlayer();
  }
  if (type === 'sync' && state.p2pEnabled) {
    if (app.p2pSync) app.p2pSync(e.data);
  }
}

function genId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
