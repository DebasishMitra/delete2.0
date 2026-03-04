import { scannedAlbums, scannedPodcasts } from 'virtual:music-library';

export const genres = [
  "All", "Pop", "Rock", "Hip-Hop", "Jazz", "Electronic", "Classical", "R&B", "Country", "Latin", "Bollywood"
];

const ALBUM_COLORS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#06b6d4', '#a855f7',
  '#f97316', '#84cc16',
];

export const albums = scannedAlbums.map((a, i) => ({
  id: a.id,
  title: a.albumName,
  artist: 'Unknown Artist',
  year: new Date().getFullYear(),
  genre: 'Music',
  color: ALBUM_COLORS[i % ALBUM_COLORS.length],
  image: a.cover,
  tracks: a.tracks.map(t => ({
    id: t.id,
    title: t.title,
    duration: t.duration,
    src: t.src,
    cover: t.cover,
  })),
}));

export const podcasts = scannedPodcasts.map(p => ({
  id: p.id,
  title: p.showTitle,
  host: 'Unknown Host',
  genre: 'Podcast',
  color: p.color,
  cover: p.cover,
  episodes: p.episodes.map(e => ({
    id: e.id,
    title: e.title,
    duration: e.duration,
    src: e.src,
    number: e.number,
  })),
}));

export const genreLyrics = {
  Pop: `[Chorus]\nThis is the moment I've been waiting for\nI don't need anything, not anything more\nYour love is the only song I know\nTake my hand and never let me go\n\n[Verse]\nDays turn to nights and the stars align\nEvery word you say sounds like a sign`,

  Rock: `[Chorus]\nWe burn, we bleed, we rise again\nThrough the fire, through the rain\nNothing breaks what can't be bent\nWe were forged in the cement`,

  "Hip-Hop": `[Hook]\nThis is my story, write it in the sky\nEvery late night, every alibi\nEvery closed door made me want it more\nI knew exactly what I came here for`,

  Jazz: `Blue notes falling through the evening air\nA saxophone whispers something rare\nTime slows down in this smoky room\nMidnight music chasing away the gloom`,

  Electronic: `[Drop]\nFrequency rising, frequency falling\nThis is the signal that keeps calling\nBinary dreams in an analog world\nWatchin' as the bass gets unfurled`,

  Classical: `Andante, andante, let the melody breathe\nSoft as autumn leaves that fall and weave\nThrough the cathedral of the morning air\nMusica eternally beyond compare`,

  "R&B": `[Chorus]\nI need you close, I need you near\nYou're the only thing I want to hear\nSlow it down and let me feel\nEvery moment make it real`,

  Country: `[Chorus]\nThese dusty roads, they know my name\nThe fields and rivers do the same\nNo matter where this road may lead\nHome is everything I'll ever need`,

  Latin: `[Coro]\nBaila, baila, baila conmigo\nEsta noche yo quiero ser contigo\nEl corazon no puede mentir\nSolo quiero verte sonreir`,

  Bollywood: `[Chorus]\nLondon thumakda, London thumakda\nLondon thumakda re mahi\nLondon thumakda, London thumakda\nLondon thumakda re mahi\n\n[Verse]\nNi saada dil vi thumakda\nSaada dil vi thumakda re mahi`,

  Music: `Melodies fill the air\nEvery note a step somewhere\nLet the rhythm take you there\nMusic everywhere`,
};

export function getArtists() {
  const map = new Map();
  albums.forEach(album => {
    if (!map.has(album.artist)) {
      map.set(album.artist, { name: album.artist, albums: [], color: album.color });
    }
    map.get(album.artist).albums.push(album);
  });
  return Array.from(map.values());
}

export function getTrackById(trackId) {
  for (const album of albums) {
    const track = album.tracks.find(t => t.id === trackId);
    if (track) return { track, album };
  }
  return null;
}

export function getAlbumForTrack(trackId) {
  return albums.find(a => a.tracks.some(t => t.id === trackId));
}

export function getAlbumImage(album) {
  return album.image || null;
}
