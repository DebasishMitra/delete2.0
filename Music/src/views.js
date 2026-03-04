import { state, isTrackLiked, isAlbumLiked, isRingtone } from './state.js';
import { albums, podcasts, getArtists, getTrackById, genreLyrics, getAlbumImage } from './data.js';
import { app } from './app.js';

export function renderMain() {
  switch (state.view) {
    case 'home': return renderHome();
    case 'now-playing': return renderNowPlaying();
    case 'album-detail': return renderAlbumDetail(albums.find(a => a.id === state.currentAlbumId));
    case 'liked': return renderLikedSongs();
    case 'albums': return renderAlbums();
    case 'artists': return renderArtists();
    case 'artist-detail': return renderArtistDetail();
    case 'playlists': return renderPlaylists();
    case 'playlist-detail': return renderPlaylistDetail();
    case 'ringtones': return renderRingtones();
    case 'podcasts': return renderPodcasts();
    case 'podcast-detail': return renderPodcastDetail();
    case 'p2p': return renderP2P();
    default: return renderHome();
  }
}

function renderHome() {
  const q = state.currentQuery.toLowerCase();

  const filteredAlbums = albums.filter(a =>
    !q || a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q) ||
    a.genre.toLowerCase().includes(q) || a.tracks.some(t => t.title.toLowerCase().includes(q))
  );

  const allTracks = [];
  for (const album of albums) {
    for (const track of album.tracks) {
      if (!q || track.title.toLowerCase().includes(q) || album.title.toLowerCase().includes(q) || album.artist.toLowerCase().includes(q)) {
        allTracks.push({ track, album });
      }
    }
  }

  const filteredPodcasts = podcasts.filter(p =>
    !q || p.title.toLowerCase().includes(q) || p.host.toLowerCase().includes(q)
  );

  const heading = q ? `Results for "${state.currentQuery}"` : null;

  return `
    <div class="home-matrix-grid"></div>
    ${heading ? `<div class="section-header"><h2 class="section-title matrix-title">${heading}</h2></div>` : ''}

    <div class="home-section">
      <div class="section-header">
        <h2 class="section-title matrix-title">Albums</h2>
        <span class="section-count matrix-count">${filteredAlbums.length} ALBUMS</span>
      </div>
      ${filteredAlbums.length === 0
        ? empty('No Albums', 'Drop MP3 files into /public/music/ to add music.')
        : `<div class="albums-grid">${filteredAlbums.map(renderAlbumCard).join('')}</div>`}
    </div>

    <div class="home-section">
      <div class="section-header">
        <h2 class="section-title matrix-title">All Songs</h2>
        <span class="section-count matrix-count">${allTracks.length} TRACKS</span>
      </div>
      ${allTracks.length === 0
        ? empty('No Tracks', 'No songs found.')
        : `<div class="track-list">
            <div class="track-list-header"><span>#</span><span>Title</span><span>Album</span><span class="track-actions-header"></span><span style="text-align:right">Duration</span></div>
            ${allTracks.map(({ track, album }, i) => {
              const playing = state.currentTrack?.id === track.id;
              return `<div class="track-item ${playing ? 'playing' : ''}" data-track-id="${track.id}" data-album-id="${album.id}">
                <span class="track-num">${playing ? '♫' : i + 1}</span>
                <span class="track-name">${track.title}</span>
                <span class="track-sub">${album.title}</span>
                <span class="track-actions">
                  ${heartBtn(isTrackLiked(track.id), track.id, 'track')}
                  ${bellBtn(isRingtone(track.id), track.id)}
                  ${addPlaylistBtn(track.id)}
                  ${downloadBtn(track.id, album.id)}
                  ${editBtn(track.id, album.id)}
                  ${infoBtn(track.id, album.id)}
                </span>
                <span class="track-duration">${track.duration}</span>
              </div>`;
            }).join('')}
          </div>`}
    </div>

    <div class="home-section">
      <div class="section-header">
        <h2 class="section-title matrix-title">Podcasts</h2>
        <span class="section-count matrix-count">${filteredPodcasts.length} SHOWS</span>
      </div>
      ${filteredPodcasts.length === 0
        ? empty('No Podcasts', 'No podcasts in the library yet.')
        : `<div class="podcasts-grid">${filteredPodcasts.map(renderPodcastCard).join('')}</div>`}
    </div>`;
}

function renderNowPlaying() {
  const track = state.currentTrack;
  if (!track) return empty('Nothing Playing', 'Select a track to start listening.');
  const ctx = getCtx();
  const color = ctx?.color || '#00eeff';
  const album = ctx?.album;
  const img = album ? getAlbumImage(album) : null;
  const barCount = 32;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const h = 20 + Math.sin(i * 0.7) * 15 + Math.random() * 25;
    return `<div class="vis-bar" style="height:${h}px;background:linear-gradient(to top,${color},${color}44);animation-delay:${i * 0.06}s"></div>`;
  }).join('');

  return `<div class="now-playing-view">
    <div class="np-cover-section">
      <div class="np-album-img-wrap ${state.isPlaying ? 'np-playing' : ''}" style="border-color:${color}44;box-shadow:0 0 40px ${color}22,0 0 80px rgba(0,0,0,0.8)">
        ${img
          ? `<img src="${img}" alt="${album?.title || ''}" class="np-album-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="np-album-fallback" style="background:linear-gradient(135deg,${color}22,${color}08);${img ? 'display:none' : ''}">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="${color}" stroke-width="1"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        ${state.isPlaying ? `<div class="np-playing-indicator">
          <div class="np-bar"></div><div class="np-bar"></div><div class="np-bar"></div><div class="np-bar"></div>
        </div>` : ''}
      </div>
      <div class="np-visualizer">${bars}</div>
    </div>
    <div class="np-details-section">
      <div class="np-genre-tag" style="color:${color};border-color:${color}33">${album?.genre || 'AUDIO'}</div>
      <h1 class="np-track-title">${track.title}</h1>
      <div class="np-track-artist">${ctx?.artist || ''}</div>
      ${album ? `<div class="np-album-info">${album.title} &middot; ${album.year}</div>` : ''}
      <div class="np-controls">
        <div class="np-progress-wrap">
          <div class="progress-row">
            <span class="time-label" id="np-time-current">0:00</span>
            <div class="progress-bar" data-np-seek style="cursor:pointer">
              <div class="progress-fill" id="np-progress-fill" style="width:${state.progressPercent}%"></div>
            </div>
            <span class="time-label">${track.duration || '—'}</span>
          </div>
        </div>
        <div class="np-buttons">
          <button class="ctrl-btn ${state.shuffleMode ? 'ctrl-active' : ''}" data-np-shuffle>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
          </button>
          <button class="ctrl-btn" data-np-prev><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2"/></svg></button>
          <button class="ctrl-btn play-pause" data-np-play>
            ${state.isPlaying
              ? `<svg width="18" height="18" fill="#000" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
              : `<svg width="18" height="18" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`}
          </button>
          <button class="ctrl-btn" data-np-next><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"/></svg></button>
          <button class="ctrl-btn ${state.repeatMode !== 'none' ? 'ctrl-active' : ''}" data-np-repeat>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            ${state.repeatMode === 'one' ? '<span class="repeat-one-badge">1</span>' : ''}
          </button>
        </div>
        <div class="np-actions">
          <button class="btn-secondary btn-sm" data-open-modal="lyrics">Lyrics</button>
          <button class="btn-secondary btn-sm" data-open-modal="equalizer">Equalizer</button>
          <button class="btn-secondary btn-sm" data-open-modal="music-info">Track Info</button>
          <button class="btn-primary btn-sm" data-np-fullscreen>Full Screen</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderAlbumCard(album) {
  const liked = isAlbumLiked(album.id);
  const img = getAlbumImage(album);
  return `<div class="album-card" data-album-id="${album.id}">
    <div class="album-cover">
      ${img
        ? `<img src="${img}" alt="${album.title}" class="album-cover-img" loading="lazy"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="album-cover-fallback" style="background:linear-gradient(135deg,${album.color}33,${album.color}11);display:none">`
        : `<div class="album-cover-fallback" style="background:linear-gradient(135deg,${album.color}44,${album.color}15);display:flex">`}
        <svg viewBox="0 0 24 24" fill="${album.color}" width="44" height="44" opacity="0.85">
          <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
        </svg>
      </div>
      <div class="album-cover-overlay" style="background:linear-gradient(to top,${album.color}88 0%,transparent 60%)"></div>
      <div class="album-hover-actions">
        ${heartBtn(liked, album.id, 'album')}
        <button class="album-play-btn" data-play-album="${album.id}" style="background:${album.color}">
          <svg width="14" height="14" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
        </button>
      </div>
    </div>
    <div class="album-info">
      <div class="album-title">${album.title}</div>
      <div class="album-artist">${album.artist}</div>
      <div class="album-meta"><span class="genre-tag" style="color:${album.color};border-color:${album.color}30">${album.genre}</span><span>${album.year}</span></div>
    </div>
  </div>`;
}

function renderAlbumDetail(album) {
  if (!album) return renderHome();
  const img = getAlbumImage(album);
  return `<button class="back-btn" data-nav="home">
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back
  </button>
  <div class="album-detail-header">
    <div class="album-detail-img-wrap" style="border-color:${album.color}44">
      <img src="${img}" alt="${album.title}" class="album-detail-img"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="album-detail-img-fallback" style="background:linear-gradient(135deg,${album.color}33,${album.color}10);display:none">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="${album.color}" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
      </div>
    </div>
    <div class="album-detail-info">
      <div class="album-detail-genre" style="color:${album.color}">${album.genre}</div>
      <h1 class="album-detail-title">${album.title}</h1>
      <div class="album-detail-artist">${album.artist}</div>
      <div class="album-detail-year">${album.year} &middot; ${album.tracks.length} tracks</div>
      <div class="album-detail-actions">
        <button class="btn-primary" data-play-album="${album.id}" style="background:${album.color}">
          <svg width="12" height="12" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg> Play All
        </button>
        <button class="btn-secondary" data-shuffle-album="${album.id}">Shuffle</button>
        ${heartBtn(isAlbumLiked(album.id), album.id, 'album')}
        <button class="btn-secondary btn-sm" data-open-modal="music-info">Info</button>
      </div>
    </div>
  </div>
  ${renderTrackList(album.tracks, album.id)}`;
}

function renderLikedSongs() {
  const items = [];
  for (const album of albums) {
    for (const track of album.tracks) {
      if (isTrackLiked(track.id)) items.push({ track, album });
    }
  }
  return `<div class="section-header">
    <h2 class="section-title" style="color:#ff4488">Liked Songs</h2>
    <span class="section-count">${items.length} TRACKS</span>
  </div>
  ${items.length === 0 ? empty('No liked songs', 'Heart any track to save it here.') :
    `<div class="track-list">${items.map(({ track, album }, i) => {
      const playing = state.currentTrack?.id === track.id;
      return `<div class="track-item ${playing ? 'playing' : ''}" data-track-id="${track.id}" data-album-id="${album.id}">
        <span class="track-num">${playing ? '♫' : i + 1}</span>
        <span class="track-name">${track.title}</span>
        <span class="track-sub">${album.title}</span>
        <span class="track-actions">${heartBtn(true, track.id, 'track')}${addPlaylistBtn(track.id)}${downloadBtn(track.id, album.id)}${editBtn(track.id, album.id)}${infoBtn(track.id, album.id)}</span>
        <span class="track-duration">${track.duration}</span>
      </div>`;
    }).join('')}</div>`}`;
}

function renderAlbums() {
  return `<div class="section-header"><h2 class="section-title">Albums</h2><span class="section-count">${albums.length} ALBUMS</span></div>
  ${albums.length === 0 ? empty('No Albums', 'The music library is empty.') :
    `<div class="albums-grid">${albums.map(renderAlbumCard).join('')}</div>`}`;
}

function renderArtists() {
  const artists = getArtists();
  return `<div class="section-header"><h2 class="section-title">Artists</h2><span class="section-count">${artists.length} ARTISTS</span></div>
  ${artists.length === 0 ? empty('No Artists', 'The music library is empty.') :
    `<div class="artists-grid">
    ${artists.map(a => `<div class="artist-card" data-artist="${encodeURIComponent(a.name)}">
      <div class="artist-avatar" style="background:radial-gradient(${a.color}22,${a.color}08);border-color:${a.color}33">
        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="${a.color}" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div class="artist-name">${a.name}</div>
      <div class="artist-meta">${a.albums.length} albums</div>
    </div>`).join('')}
  </div>`}`;
}

function renderArtistDetail() {
  const name = state.currentArtistId ? decodeURIComponent(state.currentArtistId) : '';
  const artistAlbums = albums.filter(a => a.artist === name);
  if (!artistAlbums.length) return renderArtists();
  const color = artistAlbums[0].color;
  return `<button class="back-btn" data-nav="artists">
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back
  </button>
  <div class="album-detail-header">
    <div class="artist-detail-avatar" style="background:radial-gradient(${color}33,${color}08);border-color:${color}44">
      <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="${color}" stroke-width="1.2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
    <div class="album-detail-info">
      <div class="album-detail-genre">Artist</div>
      <h1 class="album-detail-title">${name}</h1>
      <div class="album-detail-year">${artistAlbums.length} albums &middot; ${artistAlbums.reduce((s,a)=>s+a.tracks.length,0)} tracks</div>
    </div>
  </div>
  <div class="section-title" style="margin-bottom:14px">Albums</div>
  <div class="albums-grid">${artistAlbums.map(renderAlbumCard).join('')}</div>`;
}

function renderPlaylists() {
  return `<div class="section-header">
    <h2 class="section-title">Playlists</h2>
    <button class="btn-primary btn-sm" data-open-modal="create-playlist">
      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#000" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New
    </button>
  </div>
  ${state.playlists.length === 0 ? empty('No playlists', 'Create one to organize your tracks.') :
    `<div class="playlists-grid">${state.playlists.map(p => `
      <div class="playlist-card" data-playlist-id="${p.id}">
        <div class="playlist-cover" style="background:linear-gradient(135deg,${p.color||'var(--accent)'}22,${p.color||'var(--accent)'}08);border-color:${p.color||'var(--accent)'}33">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="${p.color||'var(--accent)'}" stroke-width="1.5">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          </svg>
        </div>
        <div class="playlist-info">
          <div class="playlist-name">${p.name}</div>
          <div class="playlist-meta">${p.trackIds.length} tracks &middot; ${p.createdAt}</div>
        </div>
        <div class="playlist-actions">
          <button class="icon-btn" data-open-customize="${p.id}" title="Customize">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
          </button>
          <button class="icon-btn icon-btn-danger" data-delete-playlist="${p.id}" title="Delete">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </div>`).join('')}</div>`}`;
}

function renderPlaylistDetail() {
  const playlist = state.playlists.find(p => p.id === state.currentPlaylistId);
  if (!playlist) return renderPlaylists();
  const items = playlist.trackIds.map(id => getTrackById(id)).filter(Boolean);
  const color = playlist.color || 'var(--accent)';
  return `<button class="back-btn" data-nav="playlists">
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back
  </button>
  <div class="album-detail-header">
    <div class="album-detail-cover" style="background:linear-gradient(135deg,${color}30,${color}08);border-color:${color}33">
      <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="${color}" stroke-width="1">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      </svg>
    </div>
    <div class="album-detail-info">
      <div class="album-detail-genre">Playlist</div>
      <h1 class="album-detail-title">${playlist.name}</h1>
      <div class="album-detail-year">${items.length} tracks &middot; ${playlist.createdAt}</div>
      <div class="album-detail-actions">
        ${items.length > 0 ? `<button class="btn-primary" data-play-playlist="${playlist.id}" style="background:${color}">
          <svg width="12" height="12" fill="#000" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg> Play All
        </button>` : ''}
        <button class="btn-secondary" data-open-customize="${playlist.id}">Customize</button>
        ${items.length > 0 ? `<button class="btn-secondary" data-download-playlist="${playlist.id}">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download All
        </button>` : ''}
      </div>
    </div>
  </div>
  ${items.length === 0 ? empty('Playlist is empty', 'Add tracks with the + icon.') :
    `<div class="track-list">${items.map(({ track, album }, i) => {
      const playing = state.currentTrack?.id === track.id;
      return `<div class="track-item ${playing ? 'playing' : ''}" data-track-id="${track.id}" data-album-id="${album.id}">
        <span class="track-num">${playing ? '♫' : i + 1}</span>
        <span class="track-name">${track.title}</span>
        <span class="track-sub">${album.title}</span>
        <span class="track-actions">
          ${heartBtn(isTrackLiked(track.id), track.id, 'track')}
          ${downloadBtn(track.id, album.id)}
          ${editBtn(track.id, album.id)}
          <button class="icon-btn icon-btn-danger" data-remove-from-playlist="${track.id}" title="Remove">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </span>
        <span class="track-duration">${track.duration}</span>
      </div>`;
    }).join('')}</div>`}`;
}

function renderRingtones() {
  const items = [];
  for (const album of albums) for (const track of album.tracks) {
    if (isRingtone(track.id)) items.push({ track, album });
  }
  return `<div class="section-header"><h2 class="section-title">Ringtones</h2><span class="section-count">${items.length}</span></div>
  ${items.length === 0 ? empty('No ringtones set', 'Press the bell icon on any track.') :
    `<div class="track-list">${items.map(({ track, album }, i) => {
      const playing = state.currentTrack?.id === track.id;
      return `<div class="track-item ${playing ? 'playing' : ''}" data-track-id="${track.id}" data-album-id="${album.id}">
        <span class="track-num">${playing ? '♫' : i + 1}</span>
        <span class="track-name">${track.title}</span>
        <span class="track-sub">${album.title}</span>
        <span class="track-actions">
          <button class="icon-btn icon-btn-bell" data-ringtone="${track.id}" title="Remove ringtone">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          </button>
        </span>
        <span class="track-duration">${track.duration}</span>
      </div>`;
    }).join('')}</div>`}`;
}

function renderPodcasts() {
  return `<div class="section-header"><h2 class="section-title">Podcasts</h2><span class="section-count">${podcasts.length} SHOWS</span></div>
  ${podcasts.length === 0
    ? empty('No Podcasts', 'Drop audio files into /public/podcast/ to add podcasts.')
    : `<div class="podcasts-grid">${podcasts.map(renderPodcastCard).join('')}</div>`}`;
}

function renderPodcastDetail() {
  const podcast = podcasts.find(p => p.id === state.currentPodcastId);
  if (!podcast) return renderPodcasts();
  const coverEl = podcast.image
    ? `<img src="${podcast.image}" alt="${podcast.title}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r)">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${podcast.color}44,${podcast.color}14)">
        <svg width="50" height="50" fill="none" viewBox="0 0 24 24" stroke="${podcast.color}" stroke-width="1.2">
          <circle cx="12" cy="11" r="1"/><path d="M11 17.93A7.001 7.001 0 015 11a7 7 0 0114 0 7.001 7.001 0 01-6 6.93"/><circle cx="12" cy="11" r="4"/>
        </svg>
      </div>`;
  return `<button class="back-btn" data-nav="podcasts">
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back
  </button>
  <div class="album-detail-header">
    <div class="album-detail-cover" style="border-color:${podcast.color}44;padding:0;overflow:hidden">${coverEl}</div>
    <div class="album-detail-info">
      <div class="album-detail-genre" style="color:${podcast.color}">${podcast.genre || 'Podcast'}</div>
      <h1 class="album-detail-title">${podcast.title}</h1>
      <div class="album-detail-artist">${podcast.host}</div>
      <div class="album-detail-year">${podcast.episodes.length} episode${podcast.episodes.length !== 1 ? 's' : ''}</div>
    </div>
  </div>
  <div class="track-list">
    <div class="track-list-header"><span>#</span><span>Episode</span><span style="text-align:right">Duration</span></div>
    ${podcast.episodes.map((ep, i) => {
      const playing = state.currentTrack?.id === ep.id;
      return `<div class="track-item ${playing ? 'playing' : ''}" data-podcast-episode="${ep.id}" data-podcast-id="${podcast.id}">
        <span class="track-num">${playing ? '♫' : i + 1}</span>
        <span class="track-name">${ep.title}</span>
        <span class="track-duration">${ep.duration || '—'}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function renderP2P() {
  return `<div class="section-header">
    <h2 class="section-title">P2P Listen Along</h2>
    ${state.p2pEnabled ? `<span class="section-count" style="color:#00ff88">${state.p2pPeers} CONNECTED</span>` : ''}
  </div>
  <div class="p2p-panel">
    <div class="p2p-desc">
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      <div>
        <h3>Listen Along with Friends</h3>
        <p>Open Delete_Music_Hub in multiple browser tabs. Create a session and share the code to sync playback across tabs in real time.</p>
      </div>
    </div>
    ${state.p2pEnabled ? `
      <div class="p2p-active">
        <div class="p2p-session-info">
          <div class="p2p-session-label">Session Code</div>
          <div class="p2p-session-code">${state.p2pSessionId}</div>
          <div class="p2p-peers-count"><span class="p2p-dot"></span> ${state.p2pPeers} listener${state.p2pPeers !== 1 ? 's' : ''} connected</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
          <button class="btn-primary btn-sm" id="p2p-broadcast">Sync Now</button>
          <button class="btn-secondary btn-sm" id="p2p-leave">Leave Session</button>
        </div>
      </div>` : `
      <div class="p2p-actions">
        <div class="p2p-option">
          <h4>Host a Session</h4>
          <p>Create a new session and share the code with friends.</p>
          <button class="btn-primary" id="p2p-create">Create Session</button>
        </div>
        <div class="p2p-divider">OR</div>
        <div class="p2p-option">
          <h4>Join a Session</h4>
          <p>Enter a session code to listen along.</p>
          <div class="p2p-join-row">
            <input class="form-input p2p-code-input" id="p2p-code-input" type="text" placeholder="Enter code..." maxlength="10"/>
            <button class="btn-secondary" id="p2p-join">Join</button>
          </div>
        </div>
      </div>`}
  </div>`;
}

export function renderTrackList(tracks, albumId) {
  return `<div class="track-list">
    <div class="track-list-header"><span>#</span><span>Title</span><span class="track-actions-header"></span><span style="text-align:right">Duration</span></div>
    ${tracks.map((track, i) => {
      const playing = state.currentTrack?.id === track.id;
      return `<div class="track-item ${playing ? 'playing' : ''}" data-track-id="${track.id}" data-album-id="${albumId}">
        <span class="track-num">${playing ? '♫' : i + 1}</span>
        <span class="track-name">${track.title}</span>
        <span class="track-actions">
          ${heartBtn(isTrackLiked(track.id), track.id, 'track')}
          ${bellBtn(isRingtone(track.id), track.id)}
          ${addPlaylistBtn(track.id)}
          ${downloadBtn(track.id, albumId)}
          ${editBtn(track.id, albumId)}
          ${infoBtn(track.id, albumId)}
        </span>
        <span class="track-duration">${track.duration}</span>
      </div>`;
    }).join('')}
  </div>`;
}

function renderPodcastCard(p) {
  return `<div class="podcast-card" data-podcast-id="${p.id}">
    <div class="podcast-cover" style="background:linear-gradient(135deg,${p.color}40,${p.color}10)">
      ${p.cover
        ? `<img src="${p.cover}" alt="${p.title}" class="podcast-cover-img"
            onerror="this.style.display='none';this.nextElementSibling.style.display='block'">`
        : ''}
      <svg ${p.cover ? 'style="display:none"' : ''} width="38" height="38" fill="none" viewBox="0 0 24 24" stroke="${p.color}" stroke-width="1.5">
        <circle cx="12" cy="11" r="1"/><path d="M11 17.93A7.001 7.001 0 015 11a7 7 0 0114 0 7.001 7.001 0 01-6 6.93"/>
        <circle cx="12" cy="11" r="4"/>
      </svg>
    </div>
    <div class="podcast-info">
      <div class="podcast-title">${p.title}</div>
      <div class="podcast-host">${p.host}</div>
      <div class="podcast-eps">${p.episodes?.length || 0} episodes</div>
    </div>
  </div>`;
}

function heartBtn(filled, id, type) {
  return `<button class="icon-btn ${filled ? 'icon-btn-liked' : ''}" data-like-${type}="${id}" title="${filled ? 'Unlike' : 'Like'}">
    <svg width="13" height="13" fill="${filled ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
  </button>`;
}
function bellBtn(active, id) {
  return `<button class="icon-btn ${active ? 'icon-btn-bell' : ''}" data-ringtone="${id}" title="${active ? 'Remove ringtone' : 'Set ringtone'}">
    <svg width="12" height="12" fill="${active ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
  </button>`;
}
function addPlaylistBtn(id) {
  return `<button class="icon-btn" data-add-to-playlist="${id}" title="Add to playlist">
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  </button>`;
}
function infoBtn(trackId, albumId) {
  return `<button class="icon-btn" data-track-info="${trackId}" data-album-info="${albumId}" title="Track Info">
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  </button>`;
}
function downloadBtn(trackId, albumId) {
  return `<button class="icon-btn" data-download-track="${trackId}" data-download-album="${albumId}" title="Download">
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  </button>`;
}
function editBtn(trackId, albumId) {
  return `<button class="icon-btn" data-edit-track="${trackId}" data-edit-album="${albumId}" title="Edit Properties">
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  </button>`;
}
function empty(title, sub) {
  return `<div class="empty-state"><div class="empty-icon">♫</div><h3>${title}</h3><p>${sub}</p></div>`;
}

function getCtx() {
  if (!state.currentTrack) return null;
  if (state.isPodcastTrack) {
    const pod = podcasts.find(p => p.id === state.currentTrackAlbumId);
    return { color: pod?.color || '#7c5cfc', artist: pod?.host || '', isAlbum: false, album: null };
  }
  const album = albums.find(a => a.id === state.currentTrackAlbumId);
  return { color: album?.color || '#00eeff', artist: album?.artist || '', isAlbum: true, album };
}
