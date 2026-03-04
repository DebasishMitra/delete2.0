import { state } from './state.js';

const navItems = [
  { view: 'home', icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`, label: 'Home' },
];
const libraryItems = [
  { view: 'liked', icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`, label: 'Liked Songs' },
  { view: 'albums', icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`, label: 'Albums' },
  { view: 'artists', icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`, label: 'Artists' },
  { view: 'playlists', icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>`, label: 'Playlists' },
  { view: 'ringtones', icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`, label: 'Ringtones' },
];

export function renderSidebar() {
  const likedCount = state.likedTracks.length;
  const playlistCount = state.playlists.length;
  const hasTrack = !!state.currentTrack;

  return `<aside class="sidebar">
    ${hasTrack ? `<button class="now-playing-btn ${state.view === 'now-playing' ? 'active' : ''}" data-nav="now-playing">
      <div class="np-music-icon ${state.isPlaying ? 'playing-icon' : ''}">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
        </svg>
      </div>
      <div class="np-info">
        <div class="np-label">NOW PLAYING</div>
        <div class="np-title">${state.currentTrack.title}</div>
      </div>
    </button>` : ''}

    <div class="sidebar-section">
      <div class="sidebar-title">Browse</div>
      ${navItems.map(item => navBtn(item)).join('')}
    </div>

    <div class="sidebar-section">
      <div class="sidebar-title">Your Library</div>
      ${libraryItems.map(item => {
        let badge = '';
        if (item.view === 'liked' && likedCount > 0) badge = `<span class="nav-badge">${likedCount}</span>`;
        if (item.view === 'playlists' && playlistCount > 0) badge = `<span class="nav-badge">${playlistCount}</span>`;
        return navBtn(item, badge);
      }).join('')}
    </div>

    <div class="sidebar-section">
      <div class="sidebar-title">Podcasts</div>
      <button class="nav-btn ${state.view === 'podcasts' ? 'active' : ''}" data-nav="podcasts">
        <span class="nav-icon"><svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="11" r="1"/><path d="M11 17.93A7.001 7.001 0 015 11a7 7 0 0114 0 7.001 7.001 0 01-6 6.93"/><circle cx="12" cy="11" r="4"/></svg></span>
        <span>Podcasts</span>
      </button>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-title">Session</div>
      <button class="nav-btn ${state.view === 'p2p' ? 'active' : ''}" data-nav="p2p">
        <span class="nav-icon"><svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></span>
        <span>P2P Listen Along</span>
        ${state.p2pEnabled ? `<span class="nav-badge p2p-badge">${state.p2pPeers}</span>` : ''}
      </button>
    </div>
  </aside>`;
}

function navBtn(item, badge = '') {
  return `<button class="nav-btn ${state.view === item.view ? 'active' : ''}" data-nav="${item.view}">
    <span class="nav-icon">${item.icon}</span>
    <span>${item.label}</span>
    ${badge}
  </button>`;
}
