import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const VIRTUAL_ID = 'virtual:music-library';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const AUDIO_EXTS = ['.mp3', '.ogg', '.flac', '.m4a', '.wav', '.aac'];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.svg', '.webp'];

function toTitleCase(str) {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

function findCover(dir, urlBase, imageFiles) {
  const coverFile = imageFiles.find(f => f.toLowerCase().includes('cover'))
    || imageFiles.find(f => f.toLowerCase().includes('album'))
    || imageFiles.find(f => f.toLowerCase().includes('thumb'))
    || imageFiles[0]
    || null;
  return coverFile ? `${urlBase}/${coverFile}` : null;
}

function scanMusicDir(dir, urlBase) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir).sort();
  const audioFiles = entries.filter(e => AUDIO_EXTS.includes(path.extname(e).toLowerCase()));
  const imageFiles = entries.filter(e => IMAGE_EXTS.includes(path.extname(e).toLowerCase()));
  const subDirs = entries.filter(e => {
    try { return fs.statSync(path.join(dir, e)).isDirectory(); } catch { return false; }
  });

  const results = [];

  if (audioFiles.length > 0) {
    const folderName = path.basename(dir);
    const albumName = folderName === 'music' ? 'My Music' : toTitleCase(folderName);
    const coverUrl = findCover(dir, urlBase, imageFiles);

    const tracks = audioFiles.map(file => {
      const base = file.replace(/\.[^.]+$/, '');
      const trackImg = imageFiles.find(f => f.replace(/\.[^.]+$/, '') === base);
      return {
        title: toTitleCase(base),
        src: `${urlBase}/${file}`,
        cover: trackImg ? `${urlBase}/${trackImg}` : coverUrl,
        duration: '—',
      };
    });

    results.push({ folderName, albumName, cover: coverUrl, tracks });
  }

  for (const sub of subDirs) {
    results.push(...scanMusicDir(path.join(dir, sub), `${urlBase}/${sub}`));
  }

  return results;
}

function scanPodcastDir(dir, urlBase) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir).sort();
  const audioFiles = entries.filter(e => AUDIO_EXTS.includes(path.extname(e).toLowerCase()));
  const imageFiles = entries.filter(e => IMAGE_EXTS.includes(path.extname(e).toLowerCase()));
  const subDirs = entries.filter(e => {
    try { return fs.statSync(path.join(dir, e)).isDirectory(); } catch { return false; }
  });

  const results = [];

  if (audioFiles.length > 0) {
    const folderName = path.basename(dir);
    const showTitle = folderName === 'podcast' ? 'My Podcasts' : toTitleCase(folderName);
    const coverUrl = findCover(dir, urlBase, imageFiles);

    const episodes = audioFiles.map((file, i) => {
      const base = file.replace(/\.[^.]+$/, '');
      return {
        title: toTitleCase(base),
        src: `${urlBase}/${file}`,
        duration: '—',
        number: i + 1,
      };
    });

    results.push({ folderName, showTitle, cover: coverUrl, episodes });
  }

  for (const sub of subDirs) {
    results.push(...scanPodcastDir(path.join(dir, sub), `${urlBase}/${sub}`));
  }

  return results;
}

const PODCAST_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#ef4444', '#a855f7',
];

function musicPlugin() {
  return {
    name: 'vite-music-library',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;

      // ── Music albums ──────────────────────────────────────────────
      const musicFolders = scanMusicDir(path.resolve('public/music'), '/music');
      let trackId = 100;
      const albums = musicFolders.map((folder, i) => ({
        id: i + 1,
        albumName: folder.albumName,
        cover: folder.cover,
        folderName: folder.folderName,
        tracks: folder.tracks.map(t => ({ ...t, id: ++trackId })),
      }));

      // ── Podcasts ──────────────────────────────────────────────────
      const podcastFolders = scanPodcastDir(path.resolve('public/podcast'), '/podcast');
      let epId = 5000;
      const podcasts = podcastFolders.map((folder, i) => ({
        id: `p${i + 1}`,
        showTitle: folder.showTitle,
        cover: folder.cover,
        color: PODCAST_COLORS[i % PODCAST_COLORS.length],
        folderName: folder.folderName,
        episodes: folder.episodes.map(e => ({ ...e, id: `ep${++epId}` })),
      }));

      return [
        `export const scannedAlbums = ${JSON.stringify(albums, null, 2)};`,
        `export const scannedPodcasts = ${JSON.stringify(podcasts, null, 2)};`,
      ].join('\n');
    },
    handleHotUpdate({ file, server }) {
      const isMusic = file.includes(path.sep + 'public' + path.sep + 'music');
      const isPodcast = file.includes(path.sep + 'public' + path.sep + 'podcast');
      if (isMusic || isPodcast) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

export default defineConfig({
  plugins: [musicPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
});
