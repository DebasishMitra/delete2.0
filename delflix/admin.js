const BUILT_IN = [];

let _contentCache = [];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCustomContent() {
  return _contentCache;
}

function saveCustomContent(items) {
  _contentCache = [...items];
  fetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items)
  }).catch(err => console.error('Failed to persist content:', err));
}

async function loadContentFromServer() {
  try {
    const res = await fetch('/api/content');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData.length === 0) {
        const local = JSON.parse(localStorage.getItem('sv_custom_content') || '[]');
        if (local.length > 0) {
          _contentCache = local;
          saveCustomContent(local);
          return;
        }
      }
      _contentCache = serverData;
      return;
    }
  } catch (e) {}
  try { _contentCache = JSON.parse(localStorage.getItem('sv_custom_content') || '[]'); } catch {}
}

const DEFAULT_CATEGORIES = [
  { id: 1,  name: "Action",        icon: "💥", color: "#e50914", desc: "High-energy fight sequences and stunts" },
  { id: 2,  name: "Adventure",     icon: "🗺️", color: "#f97316", desc: "Journeys, exploration and quests" },
  { id: 3,  name: "Comedy",        icon: "😂", color: "#facc15", desc: "Humour, laughs and light-hearted fun" },
  { id: 4,  name: "Drama",         icon: "🎭", color: "#a855f7", desc: "Emotional storytelling and character depth" },
  { id: 5,  name: "Fantasy",       icon: "🧙", color: "#7c3aed", desc: "Magic, mythical worlds and creatures" },
  { id: 6,  name: "Horror",        icon: "👻", color: "#1f2937", desc: "Scares, dread and supernatural terror" },
  { id: 7,  name: "Sci-Fi",        icon: "🚀", color: "#4a90e2", desc: "Science, technology and the future" },
  { id: 8,  name: "Thriller",      icon: "🔪", color: "#dc2626", desc: "Suspense, tension and plot twists" },
  { id: 9,  name: "Western",       icon: "🤠", color: "#92400e", desc: "Cowboys, frontiers and the Wild West" },
  { id: 10, name: "Animation",     icon: "🎨", color: "#06b6d4", desc: "Animated films and series for all ages" },
  { id: 11, name: "Cartoon",       icon: "🐭", color: "#f59e0b", desc: "Classic and modern cartoon entertainment" },
  { id: 12, name: "Crime",         icon: "🕵️", color: "#374151", desc: "Heists, detectives and criminal minds" },
  { id: 13, name: "Documentary",   icon: "📽️", color: "#065f46", desc: "Real-world stories and factual content" },
  { id: 14, name: "Family & Kids", icon: "👨‍👩‍👧", color: "#10b981", desc: "Safe and fun content for the whole family" },
  { id: 15, name: "Historical",    icon: "🏛️", color: "#78350f", desc: "Stories set in past historical periods" },
  { id: 16, name: "Musical",       icon: "🎵", color: "#ec4899", desc: "Music-driven narratives and performances" },
  { id: 17, name: "Mystery",       icon: "🔍", color: "#1e3a5f", desc: "Puzzles, secrets and whodunits" },
  { id: 18, name: "Romance",       icon: "❤️", color: "#f43f5e", desc: "Love stories and relationships" },
  { id: 19, name: "War",           icon: "⚔️", color: "#4b5563", desc: "Battle, conflict and military stories" },
  { id: 20, name: "Experimental",  icon: "🧪", color: "#6d28d9", desc: "Avant-garde and unconventional formats" },
  { id: 21, name: "Indian",        icon: "🇮🇳", color: "#ff6700", desc: "Bollywood and Indian regional cinema" },
  { id: 22, name: "Biographical",  icon: "📖", color: "#0369a1", desc: "True stories based on real people's lives" },
  { id: 23, name: "LGBTQ+",        icon: "🏳️‍🌈", color: "#db2777", desc: "Stories celebrating LGBTQ+ experiences" },
  { id: 24, name: "Sports",        icon: "🏆", color: "#16a34a", desc: "Athletic competitions and sports dramas" },
  { id: 25, name: "18+",           icon: "🔞", color: "#7f1d1d", desc: "Mature content for adults only" },
];

function getCategories() {
  try {
    const stored = localStorage.getItem('sv_categories');
    if (!stored || stored === '[]') {
      localStorage.setItem('sv_categories', JSON.stringify(DEFAULT_CATEGORIES));
      return [...DEFAULT_CATEGORIES];
    }
    return JSON.parse(stored);
  } catch { return [...DEFAULT_CATEGORIES]; }
}

function saveCategories(cats) {
  localStorage.setItem('sv_categories', JSON.stringify(cats));
}

function getFeatured() {
  try { return JSON.parse(localStorage.getItem('sv_featured') || 'null'); } catch { return null; }
}

function saveFeatured(ids) {
  localStorage.setItem('sv_featured', JSON.stringify(ids));
}

function getSettings() {
  try { return JSON.parse(localStorage.getItem('sv_settings') || '{}'); } catch { return {}; }
}

function saveSettingsData(s) {
  localStorage.setItem('sv_settings', JSON.stringify(s));
}

function allContent() {
  return [...BUILT_IN, ...getCustomContent()];
}

function nextId() {
  const all = allContent();
  return all.length ? Math.max(...all.map(c => c.id)) + 1 : 1;
}

let confirmCallback = null;

function showToast(msg, type = 'success') {
  const el = document.getElementById('adminToast');
  el.textContent = msg;
  el.className = `admin-toast show ${type}`;
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.classList.add('hidden'), 300); }, 2500);
}

function goTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navLink = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById(`page-${page}`);
  if (pg) pg.classList.add('active');

  const titles = { dashboard: 'Dashboard', upload: 'Upload Content', manage: 'Manage Content', categories: 'Categories', featured: 'Featured / Hero', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  if (page === 'dashboard') refreshDashboard();
  if (page === 'manage') renderManageTable();
  if (page === 'categories') renderCategories();
  if (page === 'featured') renderFeatured();
  if (page === 'settings') loadSettings();
}

function refreshDashboard() {
  const custom = getCustomContent();
  const all = allContent();
  document.getElementById('statTotal').textContent = all.length;
  document.getElementById('statMovies').textContent = all.filter(c => c.type === 'movie').length;
  document.getElementById('statSeries').textContent = all.filter(c => c.type === 'series').length;
  document.getElementById('statAnime').textContent = all.filter(c => c.type === 'anime').length;
  document.getElementById('statCustom').textContent = custom.length;
  document.getElementById('statCategories').textContent = getCategories().length;
  document.getElementById('contentCount').textContent = `${all.length} items`;

  const recent = [...custom].reverse().slice(0, 8);
  const tbody = document.getElementById('recentBody');
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📭</div><p>No custom content yet. Upload your first title!</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.title)}</strong></td>
      <td><span class="type-pill pill-${escapeHtml(item.type)}">${typeLbl(item.type)}</span></td>
      <td><span style="color:#f59e0b">★ ${escapeHtml(item.rating)}</span></td>
      <td>${escapeHtml(item.year)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit" title="Edit" onclick="editItem(${parseInt(item.id, 10)})">✏️</button>
          <button class="btn-icon delete" title="Delete" onclick="deleteItem(${parseInt(item.id, 10)})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function typeLbl(t) {
  return t === 'movie' ? 'Movie' : t === 'series' ? 'Series' : 'Anime';
}

function renderManageTable(filter = 'all', source = 'all', query = '') {
  let items = allContent();

  if (filter !== 'all') items = items.filter(c => c.type === filter);
  if (source === 'custom') items = items.filter(c => c._custom);
  if (source === 'built-in') items = items.filter(c => !c._custom);
  if (query) {
    const q = query.toLowerCase();
    items = items.filter(c => c.title.toLowerCase().includes(q) || c.genre.toLowerCase().includes(q));
  }

  const tbody = document.getElementById('manageBody');

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">🔍</div><p>No content matches your filter.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isCustom = !!item._custom;
    const flags = [
      item.trending ? `<span class="flag-badge flag-trending">Trending</span>` : '',
      item.newRelease ? `<span class="flag-badge flag-new">New</span>` : '',
    ].join('');

    const posterStyle = item.thumbnail
      ? `background-image: url('${escapeHtml(item.thumbnail)}'); background-size:cover; background-position:center;`
      : `background: ${escapeHtml(item.color)};`;

    return `
      <tr>
        <td><div class="mini-poster" style="${posterStyle}"></div></td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td><span class="type-pill pill-${escapeHtml(item.type)}">${typeLbl(item.type)}</span></td>
        <td style="color:var(--text-muted);font-size:12px">${escapeHtml(item.genre)}</td>
        <td><span style="color:#f59e0b">★ ${escapeHtml(item.rating)}</span></td>
        <td>${escapeHtml(item.year)}</td>
        <td>${flags || '<span style="color:var(--text-dim);font-size:11px">—</span>'}</td>
        <td><span class="source-pill ${isCustom ? 'pill-custom' : 'pill-builtin'}">${isCustom ? 'Custom' : 'Built-in'}</span></td>
        <td>
          <div class="action-btns">
            ${isCustom ? `<button class="btn-icon edit" title="Edit" onclick="editItem(${parseInt(item.id, 10)})">✏️</button>` : ''}
            ${isCustom ? `<button class="btn-icon delete" title="Delete" onclick="deleteItem(${parseInt(item.id, 10)})">🗑️</button>` : ''}
            ${!isCustom ? `<span style="color:var(--text-dim);font-size:11px">Built-in</span>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupManageFilters() {
  const search = document.getElementById('manageSearch');
  const filter = document.getElementById('manageFilter');
  const source = document.getElementById('manageSource');

  const update = () => renderManageTable(filter.value, source.value, search.value.trim());
  search.addEventListener('input', update);
  filter.addEventListener('change', update);
  source.addEventListener('change', update);
}

function editItem(id) {
  const item = allContent().find(c => c.id === id);
  if (!item) return;
  if (!item._custom) { showToast('Built-in content cannot be edited', 'error'); return; }

  goTo('upload');
  document.getElementById('formHeading').textContent = 'Edit Content';
  document.getElementById('submitBtn').innerHTML = '<span>💾</span> Update Content';

  document.getElementById('editId').value = id;
  document.getElementById('fTitle').value = item.title;
  document.getElementById('fType').value = item.type;
  document.getElementById('fRating').value = item.rating;
  document.getElementById('fYear').value = item.year;
  document.getElementById('fGenre').value = item.genre;
  document.getElementById('fTags').value = (item.tags || []).join(', ');
  document.getElementById('fDesc').value = item.desc;
  document.getElementById('fTrending').checked = !!item.trending;
  document.getElementById('fNewRelease').checked = !!item.newRelease;
  document.getElementById('fColor').value = item.color;
  document.getElementById('fAccent').value = item.accent || '#4a90e2';
  if (item.imageUrl) document.getElementById('fImageUrl').value = item.imageUrl;
  if (item.bannerUrl) {
    window._bannerData = item.bannerUrl;
    const bannerPreview = document.getElementById('bannerPreview');
    bannerPreview.textContent = '';
    const bannerImg = document.createElement('img');
    bannerImg.src = item.bannerUrl;
    bannerImg.alt = 'banner';
    const bannerLabel = document.createElement('div');
    bannerLabel.className = 'upload-text';
    bannerLabel.style.fontSize = '11px';
    bannerLabel.textContent = '✓ Banner loaded';
    bannerPreview.appendChild(bannerImg);
    bannerPreview.appendChild(bannerLabel);
    document.getElementById('bannerZone').classList.add('has-file');
  }
  if (item.thumbnail) {
    window._thumbData = item.thumbnail;
    const thumbPreview = document.getElementById('thumbPreview');
    thumbPreview.textContent = '';
    const thumbImg = document.createElement('img');
    thumbImg.src = item.thumbnail;
    thumbImg.alt = 'thumb';
    const thumbLabel = document.createElement('div');
    thumbLabel.className = 'upload-text';
    thumbLabel.style.fontSize = '11px';
    thumbLabel.textContent = '✓ Poster loaded';
    thumbPreview.appendChild(thumbImg);
    thumbPreview.appendChild(thumbLabel);
    document.getElementById('cpPoster').style.backgroundImage = `url('${item.thumbnail}')`;
    document.getElementById('cpPoster').style.backgroundSize = 'cover';
    document.getElementById('cpPoster').style.backgroundPosition = 'center';
  }
  if (item.trailerUrl) document.getElementById('fTrailerUrl').value = item.trailerUrl;

  document.querySelectorAll('.color-preset').forEach(p => {
    p.classList.toggle('active', p.dataset.color === item.color);
  });

  updatePreview();
}

function deleteItem(id) {
  showConfirm('Delete Content?', 'This will permanently delete the content and all its uploaded files (video, images, trailer) from the server.', '🗑️', async () => {
    try {
      const res = await fetch(`/api/content/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        _contentCache = _contentCache.filter(c => c.id !== id);
        const deleted = data.deleted_files || [];
        showToast(`Deleted successfully${deleted.length ? ` — ${deleted.length} file(s) removed` : ''}`);
      } else {
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
    renderManageTable(
      document.getElementById('manageFilter').value,
      document.getElementById('manageSource').value,
      document.getElementById('manageSearch').value
    );
    refreshDashboard();
  });
}

function showConfirm(title, msg, icon = '🗑️', cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = msg;
  document.getElementById('confirmIcon').textContent = icon;
  document.getElementById('confirmModal').classList.remove('hidden');
  confirmCallback = cb;
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.add('hidden');
  confirmCallback = null;
}

function confirmClearAll() {
  showConfirm('Clear All Custom Content?', 'This will permanently delete all content you have uploaded. Built-in content will remain.', '⚠️', () => {
    saveCustomContent([]);
    showToast('All custom content cleared');
    refreshDashboard();
    renderManageTable();
  });
}

function resetForm() {
  document.getElementById('contentForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('fColor').value = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)';
  document.getElementById('fAccent').value = '#4a90e2';
  document.querySelectorAll('.color-preset').forEach((p, i) => p.classList.toggle('active', i === 0));
  document.getElementById('videoFilename').textContent = '';
  document.getElementById('videoZone').classList.remove('has-file');
  document.getElementById('trailerFilename').textContent = '';
  document.getElementById('trailerZone').classList.remove('has-file');
  document.getElementById('thumbPreview').innerHTML = `<div class="upload-icon">🖼️</div><div class="upload-text">Click to upload poster</div><div class="upload-hint">JPG, PNG, WEBP · portrait ratio</div>`;
  document.getElementById('bannerPreview').innerHTML = `<div class="upload-icon">🌅</div><div class="upload-text">Click to upload banner</div><div class="upload-hint">JPG, PNG, WEBP · wide/landscape</div>`;
  document.getElementById('bannerZone').classList.remove('has-file');
  window._bannerData = null;
  document.getElementById('formHeading').textContent = 'Upload New Content';
  document.getElementById('submitBtn').innerHTML = '<span>💾</span> Save Content';
  updatePreview();
}

function updatePreview() {
  const title = document.getElementById('fTitle').value || 'Title Preview';
  const type = document.getElementById('fType').value || 'movie';
  const rating = document.getElementById('fRating').value || '8.5';
  const year = document.getElementById('fYear').value || '2024';
  const genre = document.getElementById('fGenre').value.split(',')[0].trim() || 'Genre';
  const color = document.getElementById('fColor').value;
  const imageUrl = document.getElementById('fImageUrl').value;

  document.getElementById('cpTitle').textContent = title;
  document.getElementById('cpSub').textContent = `${year} · ${genre}`;
  document.getElementById('cpRating').textContent = `★ ${rating}`;
  document.getElementById('cpBadge').textContent = type === 'series' ? 'SERIES' : type.toUpperCase();

  const poster = document.getElementById('cpPoster');
  if (imageUrl) {
    poster.style.background = color;
    poster.style.backgroundImage = `url('${imageUrl}')`;
    poster.style.backgroundSize = 'cover';
    poster.style.backgroundPosition = 'center';
  } else {
    poster.style.background = color;
    poster.style.backgroundImage = '';
  }

  const badgeEl = document.getElementById('cpBadge');
  const colors = { movie: '#e50914', series: '#4a90e2', anime: '#7c3aed' };
  badgeEl.style.background = colors[type] || '#e50914';
}

function setupColorPresets() {
  document.querySelectorAll('.color-preset').forEach(preset => {
    preset.addEventListener('click', () => {
      document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
      preset.classList.add('active');
      document.getElementById('fColor').value = preset.dataset.color;
      updatePreview();
    });
  });
}

async function uploadImageFile(file, imageType) {
  const title = document.getElementById('fTitle').value.trim() || 'image';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('imageType', imageType);
  const res = await fetch('/upload/image', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.success) return data.path;
  throw new Error(data.error || 'Image upload failed');
}

function setupFormListeners() {
  ['fTitle', 'fType', 'fRating', 'fYear', 'fGenre', 'fImageUrl'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
  });

  document.getElementById('fVideo').addEventListener('change', function () {
    if (this.files[0]) {
      const name = this.files[0].name;
      const size = (this.files[0].size / (1024 * 1024)).toFixed(1);
      document.getElementById('videoFilename').textContent = `✓ ${name} (${size} MB)`;
      document.getElementById('videoZone').classList.add('has-file');
    }
  });

  document.getElementById('fTrailerFile').addEventListener('change', function () {
    if (this.files[0]) {
      const name = this.files[0].name;
      const size = (this.files[0].size / (1024 * 1024)).toFixed(1);
      document.getElementById('trailerFilename').textContent = `✓ ${name} (${size} MB)`;
      document.getElementById('trailerZone').classList.add('has-file');
    }
  });

  document.getElementById('fBannerFile').addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    const zone = document.getElementById('bannerZone');
    const preview = document.getElementById('bannerPreview');
    preview.innerHTML = `<div class="upload-icon">⏳</div><div class="upload-text">Uploading banner...</div>`;
    zone.classList.add('has-file');
    try {
      const path = await uploadImageFile(file, 'banner');
      window._bannerData = path;
      const img = document.createElement('img');
      img.src = path;
      img.alt = 'banner';
      const savedText = document.createElement('div');
      savedText.className = 'upload-text';
      savedText.style.fontSize = '11px';
      savedText.textContent = '✓ Saved to server';
      preview.replaceChildren(img, savedText);
    } catch (err) {
      const icon = document.createElement('div');
      icon.className = 'upload-icon';
      icon.textContent = '❌';
      const errText = document.createElement('div');
      errText.className = 'upload-text';
      errText.textContent = err.message;
      preview.replaceChildren(icon, errText);
      zone.classList.remove('has-file');
    }
  });

  document.getElementById('fThumb').addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    const preview = document.getElementById('thumbPreview');
    preview.innerHTML = `<div class="upload-icon">⏳</div><div class="upload-text">Uploading poster...</div>`;
    try {
      const path = await uploadImageFile(file, 'thumbnail');
      window._thumbData = path;
      const img = document.createElement('img');
      img.src = path;
      img.alt = 'thumb';
      const savedText = document.createElement('div');
      savedText.className = 'upload-text';
      savedText.style.fontSize = '11px';
      savedText.textContent = '✓ Saved to server';
      preview.replaceChildren(img, savedText);
      document.getElementById('cpPoster').style.backgroundImage = `url('${path}')`;
      document.getElementById('cpPoster').style.backgroundSize = 'cover';
      document.getElementById('cpPoster').style.backgroundPosition = 'center';
    } catch (err) {
      const icon = document.createElement('div');
      icon.className = 'upload-icon';
      icon.textContent = '❌';
      const errText = document.createElement('div');
      errText.className = 'upload-text';
      errText.textContent = err.message;
      preview.replaceChildren(icon, errText);
    }
  });

  document.getElementById('contentForm').addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('editId').value;
  const title = document.getElementById('fTitle').value.trim();
  const type = document.getElementById('fType').value;
  const rating = document.getElementById('fRating').value;
  const year = document.getElementById('fYear').value;
  const genre = document.getElementById('fGenre').value.trim();
  const tagsRaw = document.getElementById('fTags').value.trim();
  const desc = document.getElementById('fDesc').value.trim();
  const trending = document.getElementById('fTrending').checked;
  const newRelease = document.getElementById('fNewRelease').checked;
  const color = document.getElementById('fColor').value;
  const accent = document.getElementById('fAccent').value;
  const imageUrl = document.getElementById('fImageUrl').value.trim();
  let trailerUrl = document.getElementById('fTrailerUrl').value.trim();
  const thumbnail = window._thumbData || '';
  const bannerUrl = document.getElementById('fBannerUrl').value.trim() || window._bannerData || '';
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  let videoUrl = '';

  const videoFile = document.getElementById('fVideo').files[0];

  if (videoFile) {
    const zone = document.getElementById('videoZone');
    const filenameEl = document.getElementById('videoFilename');
    const submitBtn = document.querySelector('#contentForm button[type="submit"]');

    zone.classList.add('uploading');
    filenameEl.textContent = '⏳ Uploading…';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Uploading…'; }

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('title', title || 'Untitled');
      formData.append('type', type);

      const res = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        videoUrl = data.path;
        filenameEl.textContent = `✓ Saved to ${data.folder}`;
        showToast(`📁 Saved: ${data.folder}/${data.filename}`);
      } else {
        filenameEl.textContent = `✗ Upload failed: ${data.error}`;
        showToast(`Upload failed: ${data.error}`, 'error');
      }
    } catch (err) {
      filenameEl.textContent = '✗ Upload error';
      showToast('Upload error: ' + err.message, 'error');
    } finally {
      zone.classList.remove('uploading');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Content'; }
    }
  }

  const trailerFile = document.getElementById('fTrailerFile').files[0];
  if (trailerFile) {
    const tZone = document.getElementById('trailerZone');
    const tFilename = document.getElementById('trailerFilename');
    const submitBtn = document.querySelector('#contentForm button[type="submit"]');
    tZone.classList.add('uploading');
    tFilename.textContent = '⏳ Uploading trailer…';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Uploading…'; }
    try {
      const fd = new FormData();
      fd.append('file', trailerFile);
      fd.append('title', (title || 'Untitled') + '_trailer');
      fd.append('type', 'trailer');
      const res = await fetch('/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        trailerUrl = data.path;
        tFilename.textContent = `✓ Trailer saved`;
        showToast(`🎞️ Trailer saved: ${data.filename}`);
      } else {
        tFilename.textContent = `✗ Trailer upload failed`;
        showToast(`Trailer upload failed: ${data.error}`, 'error');
      }
    } catch (err) {
      tFilename.textContent = '✗ Trailer upload error';
      showToast('Trailer upload error: ' + err.message, 'error');
    } finally {
      tZone.classList.remove('uploading');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Content'; }
    }
  }

  const item = { title, type, desc, genre, rating, year, color, accent, trending, newRelease, tags, _custom: true, imageUrl, bannerUrl: bannerUrl || '', trailerUrl: trailerUrl || '', videoUrl: videoUrl || '', thumbnail };

  let custom = getCustomContent();

  if (editId) {
    const idx = custom.findIndex(c => c.id === parseInt(editId));
    if (idx !== -1) {
      item.id = parseInt(editId);
      custom[idx] = item;
      showToast(`"${title}" updated successfully`);
    }
  } else {
    item.id = nextId();
    custom.push(item);
    showToast(`"${title}" saved successfully`);
  }

  saveCustomContent(custom);
  resetForm();
  window._thumbData = null;
  window._bannerData = null;
  refreshDashboard();
}

function populateCategoryDropdown() {
  const cats = getCategories();
  const sel = document.getElementById('fCategory');
  const current = sel.value;
  sel.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Select category';
  sel.appendChild(defaultOpt);
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.selected = current === String(c.id);
    opt.textContent = `${c.icon || ''} ${c.name}`;
    sel.appendChild(opt);
  });
}

function renderCategories() {
  const cats = getCategories();
  document.getElementById('catCount').textContent = cats.length;
  populateCategoryDropdown();

  const list = document.getElementById('catList');
  if (cats.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📂</div><p>No categories yet. Create your first one.</p></div>`;
    return;
  }

  list.innerHTML = cats.map(cat => {
    const id = parseInt(cat.id, 10);
    const color = /^#[0-9a-fA-F]{3,8}$/.test(cat.color) ? cat.color : '#cccccc';
    const icon = escapeHtml(cat.icon) || '📁';
    const name = escapeHtml(cat.name);
    const desc = cat.desc ? `<div class="cat-desc-text">${escapeHtml(cat.desc)}</div>` : '';
    return `
    <div class="cat-item">
      <div class="cat-color-dot" style="background:${color}"></div>
      <span class="cat-icon">${icon}</span>
      <div style="flex:1">
        <div class="cat-name">${name}</div>
        ${desc}
      </div>
      <div class="cat-actions">
        <button class="btn-icon edit" onclick="editCategory(${id})">✏️</button>
        <button class="btn-icon delete" onclick="deleteCategory(${id})">🗑️</button>
      </div>
    </div>
  `;
  }).join('');
}

function editCategory(id) {
  const cats = getCategories();
  const cat = cats.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('catEditId').value = id;
  document.getElementById('catName').value = cat.name;
  document.getElementById('catDesc').value = cat.desc || '';
  document.getElementById('catIcon').value = cat.icon || '';
  document.getElementById('catColor').value = cat.color || '#e50914';
}

function deleteCategory(id) {
  showConfirm('Delete Category?', 'This will remove the category. Content assigned to it will remain.', '🗑️', () => {
    const cats = getCategories().filter(c => c.id !== id);
    saveCategories(cats);
    renderCategories();
    showToast('Category deleted');
  });
}

function resetCatForm() {
  document.getElementById('categoryForm').reset();
  document.getElementById('catEditId').value = '';
  document.getElementById('catColor').value = '#e50914';
}

function resetToDefaultCategories() {
  showConfirm(
    'Reset to Default Categories?',
    'This will replace all current categories with the 25 built-in defaults. Any custom categories you added will be removed.',
    '↺',
    () => {
      saveCategories([...DEFAULT_CATEGORIES]);
      renderCategories();
      showToast('Categories reset to defaults');
    }
  );
}

function setupCategoryForm() {
  document.getElementById('categoryForm').addEventListener('submit', e => {
    e.preventDefault();
    const editId = document.getElementById('catEditId').value;
    const name = document.getElementById('catName').value.trim();
    const desc = document.getElementById('catDesc').value.trim();
    const icon = document.getElementById('catIcon').value.trim();
    const color = document.getElementById('catColor').value;

    if (!name) return;

    let cats = getCategories();

    if (editId) {
      const idx = cats.findIndex(c => c.id === parseInt(editId));
      if (idx !== -1) { cats[idx] = { ...cats[idx], name, desc, icon, color }; showToast(`Category "${name}" updated`); }
    } else {
      const maxId = cats.length ? Math.max(...cats.map(c => c.id)) : 0;
      cats.push({ id: maxId + 1, name, desc, icon, color });
      showToast(`Category "${name}" created`);
    }

    saveCategories(cats);
    resetCatForm();
    renderCategories();
  });
}

function renderFeatured() {
  const all = allContent();
  const saved = getFeatured() || [];
  const featuredItems = saved.map(id => all.find(c => c.id === id)).filter(Boolean);

  const selEl = document.getElementById('featuredSelected');
  selEl.innerHTML = '';

  if (featuredItems.length) {
    featuredItems.forEach((item, i) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'feat-selected-item';

      const numDiv = document.createElement('div');
      numDiv.className = 'feat-num';
      numDiv.textContent = i + 1;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'feat-info';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'feat-title';
      titleDiv.textContent = item.title;

      const typeDiv = document.createElement('div');
      typeDiv.className = 'feat-type';
      typeDiv.textContent = typeLbl(item.type);

      const btn = document.createElement('button');
      btn.className = 'btn-icon delete';
      btn.textContent = '✕';
      btn.addEventListener('click', () => removeFeatured(parseInt(item.id, 10)));

      infoDiv.appendChild(titleDiv);
      infoDiv.appendChild(typeDiv);
      itemDiv.appendChild(numDiv);
      itemDiv.appendChild(infoDiv);
      itemDiv.appendChild(btn);
      selEl.appendChild(itemDiv);
    });
  } else {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    const p = document.createElement('p');
    p.textContent = 'No featured items selected';
    emptyDiv.appendChild(p);
    selEl.appendChild(emptyDiv);
  }

  renderFeaturedList('', saved);

  document.getElementById('featSearch').addEventListener('input', function () {
    renderFeaturedList(this.value, saved);
  });
}

function renderFeaturedList(query, currentFeatured) {
  const all = allContent();
  let items = all;
  if (query) {
    const q = query.toLowerCase();
    items = all.filter(c => c.title.toLowerCase().includes(q) || c.type.includes(q));
  } else {
    items = all.slice(0, 30);
  }

  const list = document.getElementById('featList');
  list.innerHTML = items.map(item => {
    const isSelected = currentFeatured.includes(item.id);
    const posterStyle = item.thumbnail ? `background-image:url('${escapeHtml(item.thumbnail)}');background-size:cover;background-position:center;` : `background:${escapeHtml(item.color)};`;
    return `
      <div class="feat-list-item ${isSelected ? 'selected' : ''}">
        <div class="feat-list-poster" style="${posterStyle}"></div>
        <div class="feat-list-info">
          <div class="feat-list-title">${escapeHtml(item.title)}</div>
          <div class="feat-list-sub">${typeLbl(item.type)} · ${escapeHtml(item.year)}</div>
        </div>
        <button class="feat-add-btn ${isSelected ? 'active' : ''}" onclick="toggleFeatured(${parseInt(item.id, 10)})">
          ${isSelected ? '✓ Featured' : '+ Feature'}
        </button>
      </div>
    `;
  }).join('');
}

function toggleFeatured(id) {
  let saved = getFeatured() || [];
  if (saved.includes(id)) {
    saved = saved.filter(x => x !== id);
    showToast('Removed from featured');
  } else {
    if (saved.length >= 5) { showToast('Maximum 5 featured items allowed', 'error'); return; }
    saved.push(id);
    showToast('Added to featured');
  }
  saveFeatured(saved);
  renderFeatured();
}

function removeFeatured(id) {
  let saved = getFeatured() || [];
  saved = saved.filter(x => x !== id);
  saveFeatured(saved);
  showToast('Removed from featured');
  renderFeatured();
}

function loadSettings() {
  const s = getSettings();
  if (s.siteName) document.getElementById('setSiteName').value = s.siteName;
  if (s.tagline) document.getElementById('setTagline').value = s.tagline;
  if (s.heroSpeed) document.getElementById('setHeroSpeed').value = s.heroSpeed;

  const custom = getCustomContent();
  document.getElementById('aboutCustom').textContent = `${custom.length} items`;
  document.getElementById('aboutStorage').textContent = getStorageSize();
}

function saveSettings() {
  const s = {
    siteName: document.getElementById('setSiteName').value,
    tagline: document.getElementById('setTagline').value,
    heroSpeed: document.getElementById('setHeroSpeed').value,
  };
  saveSettingsData(s);
  showToast('Settings saved');
}

function getStorageSize() {
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sv_')) total += (localStorage.getItem(key) || '').length;
  }
  return total > 1024 ? `${(total / 1024).toFixed(1)} KB` : `${total} B`;
}

function exportData() {
  const data = { custom: getCustomContent(), categories: getCategories(), featured: getFeatured(), settings: getSettings() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `streamvault-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully');
}

function setupImport() {
  document.getElementById('importFile').addEventListener('change', function () {
    if (!this.files[0]) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.custom) saveCustomContent(data.custom);
        if (data.categories) saveCategories(data.categories);
        if (data.featured) saveFeatured(data.featured);
        if (data.settings) saveSettingsData(data.settings);
        showToast('Data imported successfully');
        refreshDashboard();
      } catch {
        showToast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(this.files[0]);
    this.value = '';
  });
}

function setupNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      goTo(item.dataset.page);
    });
  });
}

function setupConfirmModal() {
  document.getElementById('confirmBtn').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });
  document.getElementById('confirmModal').addEventListener('click', e => {
    if (e.target === document.getElementById('confirmModal')) closeConfirm();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadContentFromServer();
  setupNavigation();
  setupColorPresets();
  setupFormListeners();
  setupCategoryForm();
  setupManageFilters();
  setupConfirmModal();
  setupImport();
  updatePreview();
  populateCategoryDropdown();
  refreshDashboard();
});
