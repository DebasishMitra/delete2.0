
const currentUserId = localStorage.getItem("currentUserId") || "default";
function uKey(key) {
  return `user_${currentUserId}_${key}`;
}

let audioContext;
let futuristicSoundPlayed = false;

function playFuturisticSound() {
  if (futuristicSoundPlayed) return;

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext
      .resume()
      .then(() => {
        if (!futuristicSoundPlayed) {
          futuristicSoundPlayed = true;
          scheduleFuturisticSounds();
        }
      })
      .catch(() => {
        console.log("Audio playback requires user interaction");
      });
  } else {
    futuristicSoundPlayed = true;
    scheduleFuturisticSounds();
  }

  function scheduleFuturisticSounds() {
    const now = audioContext.currentTime;

    // Ascending tone sweep
    const sweep1 = audioContext.createOscillator();
    const sweep1Gain = audioContext.createGain();
    sweep1.type = "sine";
    sweep1.frequency.setValueAtTime(200, now);
    sweep1.frequency.exponentialRampToValueAtTime(800, now + 0.8);
    sweep1Gain.gain.setValueAtTime(0.3, now);
    sweep1Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    sweep1.connect(sweep1Gain);
    sweep1Gain.connect(audioContext.destination);
    sweep1.start(now);
    sweep1.stop(now + 0.8);

    // Scanning beep pattern
    function createBeep(startTime, freq, duration) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    createBeep(now + 1, 1000, 0.3);
    createBeep(now + 1.4, 1200, 0.3);
    createBeep(now + 1.8, 1400, 0.3);

    // Power-up whoosh
    const whoosh = audioContext.createBufferSource();
    const whooshBuffer = audioContext.createBuffer(
      1,
      audioContext.sampleRate * 0.3,
      audioContext.sampleRate,
    );
    const whooshData = whooshBuffer.getChannelData(0);
    for (let i = 0; i < whooshBuffer.length; i++) {
      whooshData[i] = (Math.random() - 0.5) * 2;
    }
    whoosh.buffer = whooshBuffer;

    const whooshFilter = audioContext.createBiquadFilter();
    whooshFilter.type = "highpass";
    whooshFilter.frequency.setValueAtTime(200, now + 2.4);
    whooshFilter.frequency.exponentialRampToValueAtTime(6000, now + 2.7);

    const whooshGain = audioContext.createGain();
    whooshGain.gain.setValueAtTime(0.3, now + 2.4);
    whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);

    whoosh.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(audioContext.destination);
    whoosh.start(now + 2.4);
    whoosh.stop(now + 2.7);
  }
}

function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 6 + "s";
    particle.style.animationDuration = 4 + Math.random() * 4 + "s";
    container.appendChild(particle);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  createParticles();

  const enableAudio = () => {
    playFuturisticSound();
  };

  document.addEventListener("click", enableAudio, { once: true });
  document.addEventListener("touchstart", enableAudio, { once: true });
  document.addEventListener("keydown", enableAudio, { once: true });

  setTimeout(() => {
    const futuristicIntro = document.getElementById("futuristicIntro");
    if (futuristicIntro) {
      futuristicIntro.remove();
    }
  }, 4000);

  loadProfile();
});

const defaultBookmarks = [
  { id: "1", name: "Gmail", url: "https://mail.google.com", category: "mail" },
  {
    id: "2",
    name: "Outlook",
    url: "https://outlook.live.com",
    category: "mail",
  },
  { id: "3", name: "GitHub", url: "https://github.com", category: "tools" },
  { id: "4", name: "Replit", url: "https://replit.com", category: "tools" },
  {
    id: "5",
    name: "Google Drive",
    url: "https://drive.google.com",
    category: "drive",
  },
  {
    id: "6",
    name: "Dropbox",
    url: "https://www.dropbox.com",
    category: "drive",
  },
  {
    id: "7",
    name: "Google Account",
    url: "https://myaccount.google.com",
    category: "account",
  },
  { id: "8", name: "Twitter", url: "https://twitter.com", category: "account" },
];

const defaultCategories = {
  tools: { name: "Tools", icon: "🔧", color: "#667eea" },
  mail: { name: "Mail", icon: "✉️", color: "#f093fb" },
  account: { name: "Account", icon: "👤", color: "#4facfe" },
  drive: { name: "Drive", icon: "💾", color: "#43e97b" },
  music: { name: "Music", icon: "🎵", color: "#fa709a" },
  video: { name: "Video", icon: "🎬", color: "#fee140" },
  social: { name: "Social", icon: "💬", color: "#30cfd0" },
  shopping: { name: "Shopping", icon: "🛒", color: "#a8edea" },
};

let categories = { ...defaultCategories };

function loadCategories() {
  const saved = localStorage.getItem(uKey("bookmarkCategories"));
  if (saved) {
    categories = JSON.parse(saved);
  }
}

function saveCategories() {
  localStorage.setItem(uKey("bookmarkCategories"), JSON.stringify(categories));
}

let bookmarks = [];
let editingId = null;

let clockMode = localStorage.getItem(uKey("clockMode")) || "digital";

function updateTime() {
  const now = new Date();
  const use24h = localStorage.getItem(uKey("pref_24hour")) === "true";
  const showSecs = localStorage.getItem(uKey("pref_showSeconds")) !== "false";

  let h = now.getHours();
  let ampm = "";
  if (!use24h) {
    ampm = h >= 12 ? " PM" : " AM";
    h = h % 12 || 12;
  }
  const hours = h.toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const timeString = showSecs ? `${hours}:${minutes}:${seconds}${ampm}` : `${hours}:${minutes}${ampm}`;

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateString = now.toLocaleDateString("en-US", options);

  document.getElementById("time").textContent = timeString;
  document.getElementById("date").textContent = dateString;

  if (document.getElementById("analogDate")) {
    document.getElementById("analogDate").textContent = dateString;
  }

  if (document.getElementById("pixelTime")) {
    document.getElementById("pixelTime").textContent = timeString;
  }

  if (document.getElementById("pixelDate")) {
    document.getElementById("pixelDate").textContent = dateString;
  }

  const hoursNum = now.getHours() % 12;
  const minutesNum = now.getMinutes();
  const secondsNum = now.getSeconds();

  const hourDeg = hoursNum * 30 + minutesNum * 0.5;
  const minuteDeg = minutesNum * 6;
  const secondDeg = secondsNum * 6;

  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const secondHand = document.getElementById("secondHand");

  if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
  if (minuteHand) minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
  if (secondHand) secondHand.style.transform = `rotate(${secondDeg}deg)`;
}

function switchClockMode(mode) {
  clockMode = mode;
  localStorage.setItem(uKey("clockMode"), clockMode);

  const clockDigital = document.getElementById("clockDigital");
  const clockAnalog = document.getElementById("clockAnalog");
  const clockPixel = document.getElementById("clockPixel");

  clockDigital.style.display = "none";
  clockAnalog.style.display = "none";
  clockPixel.style.display = "none";

  if (mode === "digital") {
    clockDigital.style.display = "block";
  } else if (mode === "analog") {
    clockAnalog.style.display = "flex";
  } else if (mode === "pixel") {
    clockPixel.style.display = "flex";
  }

  updateTime();
}

document.getElementById("timeContainer").addEventListener("click", () => {
  if (clockMode === "digital") {
    switchClockMode("analog");
  } else if (clockMode === "analog") {
    switchClockMode("pixel");
  } else {
    switchClockMode("digital");
  }
});

switchClockMode(clockMode);
updateTime();
setInterval(updateTime, 1000);

let currentSearchEngine = localStorage.getItem(uKey("searchEngine")) || "google";

const searchEngines = {
  google: "https://www.google.com/search?q=",
  perplexity: "https://www.perplexity.ai/search?q=",
  phind: "https://www.phind.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  yahoo: "https://search.yahoo.com/search?p=",
  yandex: "https://yandex.com/search/?text=",
  chatgpt: "https://chatgpt.com/?q=",
  gemini: "https://gemini.google.com/app?q=",
  deepseek: "https://chat.deepseek.com/?q=",
  grok: "https://x.com/i/grok?q=",
  brave: "https://search.brave.com/search?q=",
  ecosia: "https://www.ecosia.org/search?q=",
  ask: "https://www.ask.com/web?q=",
  aol: "https://search.aol.com/aol/search?q=",
  baidu: "https://www.baidu.com/s?wd=",
  privacywall: "https://www.privacywall.org/search/secure/?q=",
  qwant: "https://www.qwant.com/?q=",
  mojeek: "https://www.mojeek.com/search?q=",
  karma: "https://en.karma-search.com/search?q=",
  yep: "https://yep.com/web?q=",
  startpage: "https://www.startpage.com/do/search?q=",
};

const engineIcons = document.querySelectorAll("#engineDropdown .engine-icon");
const engineTrigger = document.getElementById("engineSelector");
const engineDropdown = document.getElementById("engineDropdown");
const searchInput = document.getElementById("searchInput");

engineTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  const isActive = engineDropdown.classList.toggle("active");
  const searchBar = document.querySelector(".search-engines-bar");
  if (isActive) {
    searchBar.classList.add("active");
    // Ensure sufficient space for the dropdown
    searchBar.style.marginTop = "800px";
  } else {
    searchBar.classList.remove("active");
    searchBar.style.marginTop = "100px";
  }
});

function updateSearchEngine(engine) {
  currentSearchEngine = engine;
  localStorage.setItem(uKey("searchEngine"), currentSearchEngine);

  const selectedEngine = Array.from(engineIcons).find(
    (icon) => icon.dataset.engine === engine,
  );
  if (selectedEngine) {
    engineTrigger.innerHTML = selectedEngine.querySelector("i").outerHTML;
  }

  engineIcons.forEach((icon) => {
    icon.classList.remove("active");
    if (icon.dataset.engine === engine) {
      icon.classList.add("active");
    }
  });

  const engineNames = {
    google: "Google",
    perplexity: "Perplexity",
    phind: "Phind",
    bing: "Bing",
    duckduckgo: "DuckDuckGo",
    yahoo: "Yahoo",
    yandex: "Yandex",
    chatgpt: "ChatGPT",
    gemini: "Gemini",
    deepseek: "DeepSeek",
    grok: "Grok",
    brave: "Brave",
    ecosia: "Ecosia",
    ask: "Ask",
    aol: "AOL",
    baidu: "Baidu",
    privacywall: "PrivacyWall",
    qwant: "Qwant",
    mojeek: "Mojeek",
    karma: "Karma",
    yep: "Yep",
    startpage: "Startpage",
  };

  searchInput.placeholder = `Search with ${engineNames[engine]}...`;

  const actionsRight = document.querySelector(".search-actions-right");
  if (actionsRight) {
    actionsRight.style.display = (engine === "google" || engine === "duckduckgo" || engine === "bing") ? "flex" : "none";
    
    const googleLensBtn = document.getElementById("googleLensBtn");
    if (googleLensBtn) googleLensBtn.style.display = (engine === "google") ? "flex" : "none";

    const bingLensBtn = document.getElementById("bingLensBtn");
    if (bingLensBtn) bingLensBtn.style.display = (engine === "bing") ? "flex" : "none";

    const googleAiBtn = document.getElementById("googleAiBtn");
    if (googleAiBtn) googleAiBtn.style.display = (engine === "google") ? "flex" : "none";

    const ddgAiBtn = document.getElementById("duckduckgoAiBtn");
    if (ddgAiBtn) {
      ddgAiBtn.style.display = (engine === "duckduckgo") ? "flex" : "none";
    }
  }

  const lp = document.getElementById("lensPanel");
  if (lp) lp.classList.remove("active");
  const blp = document.getElementById("bingLensPanel");
  if (blp) blp.classList.remove("active");

  // Explicitly ensure the dropdown closes when an engine is selected
  engineDropdown.classList.remove("active");
  const searchBar = document.querySelector(".search-engines-bar");
  if (searchBar) {
    searchBar.classList.remove("active");
    searchBar.style.marginTop = "100px";
  }
}

engineIcons.forEach((icon) => {
  icon.addEventListener("click", (e) => {
    e.stopPropagation();
    updateSearchEngine(icon.dataset.engine);
  });
});

updateSearchEngine(currentSearchEngine);

document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const query = searchInput.value.trim();

  if (query) {
    if (query.includes(".") && !query.includes(" ")) {
      let url = query;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      window.location.href = url;
    } else {
      const searchUrl =
        searchEngines[currentSearchEngine] + encodeURIComponent(query);
      window.location.href = searchUrl;
    }
  }
});

// DuckDuckGo AI Search
const ddgAiBtn = document.getElementById("duckduckgoAiBtn");
if (ddgAiBtn) {
  ddgAiBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=chat`;
    } else {
      window.location.href = "https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat";
    }
  });
}

// Lens Panels
const lensPanel = document.getElementById("lensPanel");
const lensDropZone = document.getElementById("lensDropZone");
const lensFileInput = document.getElementById("lensFileInput");
const lensUrlInput = document.getElementById("lensUrlInput");
const lensUrlBtn = document.getElementById("lensUrlBtn");
const lensPanelClose = document.getElementById("lensPanelClose");
const bingLensPanel = document.getElementById("bingLensPanel");
const bingLensDropZone = document.getElementById("bingLensDropZone");
const bingLensFileInput = document.getElementById("bingLensFileInput");
const bingLensUrlInput = document.getElementById("bingLensUrlInput");
const bingLensUrlBtn = document.getElementById("bingLensUrlBtn");
const bingLensPanelClose = document.getElementById("bingLensPanelClose");

document.getElementById("googleLensBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  bingLensPanel.classList.remove("active");
  lensPanel.classList.toggle("active");
});

lensPanelClose.addEventListener("click", () => {
  lensPanel.classList.remove("active");
});

document.addEventListener("click", (e) => {
  if (lensPanel.classList.contains("active") && !lensPanel.contains(e.target) && e.target.id !== "googleLensBtn") {
    lensPanel.classList.remove("active");
  }
});

function submitLensFile(file) {
  const form = document.createElement("form");
  form.method = "POST";
  form.enctype = "multipart/form-data";
  form.target = "_blank";
  form.style.display = "none";
  form.action = "https://lens.google.com/v3/upload";
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.name = "encoded_image";
  const dt = new DataTransfer();
  dt.items.add(file);
  fileInput.files = dt.files;
  form.appendChild(fileInput);
  document.body.appendChild(form);
  form.submit();
  setTimeout(() => { if (form.parentNode) document.body.removeChild(form); }, 3000);
  lensPanel.classList.remove("active");
}

lensDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  lensDropZone.classList.add("drag-over");
});

lensDropZone.addEventListener("dragleave", () => {
  lensDropZone.classList.remove("drag-over");
});

lensDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  lensDropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    submitLensFile(file);
  }
});

lensDropZone.addEventListener("click", () => {
  lensFileInput.click();
});

lensFileInput.addEventListener("change", () => {
  if (lensFileInput.files[0]) {
    submitLensFile(lensFileInput.files[0]);
    lensFileInput.value = "";
  }
});

lensUrlBtn.addEventListener("click", () => {
  const url = lensUrlInput.value.trim();
  if (url) {
    window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`, "_blank");
    lensPanel.classList.remove("active");
    lensUrlInput.value = "";
  }
});

lensUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    lensUrlBtn.click();
  }
});

document.getElementById("googleAiBtn").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value.trim();
  if (query) {
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}&udm=14`;
  } else {
    window.location.href = "https://www.google.com/ai";
  }
});

// Bing Visual Search Panel
document.getElementById("bingLensBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  lensPanel.classList.remove("active");
  bingLensPanel.classList.toggle("active");
});

bingLensPanelClose.addEventListener("click", () => {
  bingLensPanel.classList.remove("active");
});

document.addEventListener("click", (e) => {
  if (bingLensPanel.classList.contains("active") && !bingLensPanel.contains(e.target) && e.target.id !== "bingLensBtn") {
    bingLensPanel.classList.remove("active");
  }
});

function submitBingLensFile(file) {
  const reader = new FileReader();
  reader.onload = function(ev) {
    const base64 = ev.target.result;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://www.bing.com/images/search?view=detailv2&iss=sbiupload";
    form.target = "_blank";
    form.style.display = "none";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "imageBin";
    input.value = base64.split(",")[1];
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => { if (form.parentNode) document.body.removeChild(form); }, 3000);
  };
  reader.readAsDataURL(file);
  bingLensPanel.classList.remove("active");
}

bingLensDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  bingLensDropZone.classList.add("drag-over");
});

bingLensDropZone.addEventListener("dragleave", () => {
  bingLensDropZone.classList.remove("drag-over");
});

bingLensDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  bingLensDropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    submitBingLensFile(file);
  }
});

bingLensDropZone.addEventListener("click", () => {
  bingLensFileInput.click();
});

bingLensFileInput.addEventListener("change", () => {
  if (bingLensFileInput.files[0]) {
    submitBingLensFile(bingLensFileInput.files[0]);
    bingLensFileInput.value = "";
  }
});

bingLensUrlBtn.addEventListener("click", () => {
  const url = bingLensUrlInput.value.trim();
  if (url) {
    window.open(`https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(url)}`, "_blank");
    bingLensPanel.classList.remove("active");
    bingLensUrlInput.value = "";
  }
});

bingLensUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    bingLensUrlBtn.click();
  }
});

// Upload image action
const imageFileInput = document.getElementById("imageFileInput");
const uploadImageItem = document.getElementById("uploadImageItem");

function submitImageToSearch(file) {
  const engine = currentSearchEngine;

  const form = document.createElement("form");
  form.method = "POST";
  form.enctype = "multipart/form-data";
  form.target = "_blank";
  form.style.display = "none";

  const fileInput = document.createElement("input");
  fileInput.type = "file";

  const dt = new DataTransfer();
  dt.items.add(file);
  fileInput.files = dt.files;

  if (engine === "bing") {
    form.action = "https://www.bing.com/images/search?view=detailv2&iss=sbiupload&FORM=SBIHMP";
    fileInput.name = "imageBin";
  } else if (engine === "yandex") {
    form.action = "https://yandex.com/images/search?rpt=imageview";
    fileInput.name = "upfile";
  } else {
    form.action = "https://lens.google.com/v3/upload";
    fileInput.name = "encoded_image";
  }

  form.appendChild(fileInput);
  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    if (form.parentNode) document.body.removeChild(form);
  }, 3000);
}

if (uploadImageItem && imageFileInput) {
  uploadImageItem.addEventListener("click", () => {
    imageFileInput.click();
    const uploadDropdown = document.getElementById("uploadDropdown");
    if (uploadDropdown) uploadDropdown.classList.remove("active");
  });

  imageFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    submitImageToSearch(file);
    imageFileInput.value = "";
  });
}

function loadBookmarks() {
  const saved = localStorage.getItem(uKey("bookmarks"));
  if (saved) {
    bookmarks = JSON.parse(saved);

    let migrated = false;
    bookmarks = bookmarks.map((bookmark) => {
      if (!bookmark.category) {
        migrated = true;
        return { ...bookmark, category: "tools" };
      }
      return bookmark;
    });

    if (migrated) {
      saveBookmarks();
    }
  } else {
    bookmarks = [...defaultBookmarks];
    saveBookmarks();
  }
  renderBookmarks();
  populateCategoryOptions();
}

function saveBookmarks() {
  localStorage.setItem(uKey("bookmarks"), JSON.stringify(bookmarks));
}

function populateCategoryOptions() {
  const select = document.getElementById("bookmarkCategory");
  select.innerHTML = "";

  Object.keys(categories).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = `${categories[key].icon} ${categories[key].name}`;
    select.appendChild(option);
  });
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    return "";
  }
}

function renderBookmarks() {
  const container = document.getElementById("linksContainer");
  if (!container) return;
  container.innerHTML = "";

  const renderedIds = new Set();

  // 1. Render known categories
  Object.keys(categories).forEach((categoryKey) => {
    const categoryBookmarks = bookmarks.filter(
      (b) => b.category === categoryKey,
    );

    // Render category even if empty to show all categories
    const categorySection = document.createElement("div");
    categorySection.className = "category-section";

    const categoryHeader = document.createElement("div");
    categoryHeader.className = "category-header";
    categoryHeader.innerHTML = `
      <span class="category-icon">${categories[categoryKey].icon || "📁"}</span>
      <span class="category-name">${categories[categoryKey].name}</span>
      <span class="category-count">${categoryBookmarks.length}</span>
    `;

    const categoryGrid = document.createElement("div");
    categoryGrid.className = "category-grid";

    categoryBookmarks.forEach((bookmark) => {
      renderedIds.add(bookmark.id);
      renderBookmarkCard(categoryGrid, bookmark);
    });

    categorySection.appendChild(categoryHeader);
    categorySection.appendChild(categoryGrid);
    container.appendChild(categorySection);
  });

  // 2. Render any orphaned bookmarks (categories that don't exist anymore)
  const orphanedBookmarks = bookmarks.filter(b => !renderedIds.has(b.id));
  if (orphanedBookmarks.length > 0) {
    const categorySection = document.createElement("div");
    categorySection.className = "category-section";

    const categoryHeader = document.createElement("div");
    categoryHeader.className = "category-header";
    categoryHeader.innerHTML = `
      <span class="category-icon">📂</span>
      <span class="category-name">Other / Uncategorized</span>
      <span class="category-count">${orphanedBookmarks.length}</span>
    `;

    const categoryGrid = document.createElement("div");
    categoryGrid.className = "category-grid";

    orphanedBookmarks.forEach((bookmark) => {
      renderBookmarkCard(categoryGrid, bookmark);
    });

    categorySection.appendChild(categoryHeader);
    categorySection.appendChild(categoryGrid);
    container.appendChild(categorySection);
  }
}

function renderBookmarkCard(grid, bookmark) {
  const wrapper = document.createElement("div");
  wrapper.className = "link-card-wrapper";

  const card = document.createElement("a");
  card.className = "link-card";
  card.href = bookmark.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const faviconUrl = getFaviconUrl(bookmark.url);
  card.innerHTML = `
    <div class="link-icon-wrapper">
      <img src="${faviconUrl}" alt="${bookmark.name}" class="link-favicon" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="link-icon-fallback" style="display: none;">${bookmark.name.charAt(0).toUpperCase()}</div>
    </div>
    <div class="link-name">${bookmark.name}</div>
  `;

  const actions = document.createElement("div");
  actions.className = "link-actions";
  actions.innerHTML = `
    <button class="icon-btn edit" aria-label="Edit ${bookmark.name}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    </button>
    <button class="icon-btn delete" aria-label="Delete ${bookmark.name}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>
  `;

  const editBtn = actions.querySelector(".edit");
  const deleteBtn = actions.querySelector(".delete");

  editBtn.addEventListener("click", (e) => editBookmark(e, bookmark.id));
  deleteBtn.addEventListener("click", (e) =>
    deleteBookmark(e, bookmark.id),
  );

  wrapper.appendChild(card);
  wrapper.appendChild(actions);
  grid.appendChild(wrapper);
}

function openModal(title = "Add Bookmark") {
  const modal = document.getElementById("bookmarkModal");
  const titleEl = document.getElementById("modalTitle");
  if (titleEl) titleEl.textContent = title;
  
  if (title === "Add Bookmark") {
    editingId = null;
    // Auto-reset disabled per user request
    // const form = document.getElementById("bookmarkForm");
    // if (form) form.reset();
    const newCategoryGroup = document.getElementById("newCategoryGroup");
    if (newCategoryGroup) newCategoryGroup.style.display = "none";
    const addCategoryBtn = document.getElementById("addCategoryBtn");
    if (addCategoryBtn) addCategoryBtn.innerHTML = '<i class="fas fa-plus"></i>';
  }
  
  if (modal) modal.classList.add("active");
}

function closeModal() {
  document.getElementById("bookmarkModal").classList.remove("active");
  document.getElementById("bookmarkForm").reset();
  editingId = null;
}

function editBookmark(event, id) {
  event.preventDefault();
  event.stopPropagation();

  const bookmark = bookmarks.find((b) => b.id === id);
  if (!bookmark) return;

  editingId = id;
  document.getElementById("bookmarkName").value = bookmark.name;
  document.getElementById("bookmarkUrl").value = bookmark.url;
  document.getElementById("bookmarkCategory").value =
    bookmark.category || "tools";

  openModal("Edit Bookmark");
}

function deleteBookmark(event, id) {
  event.preventDefault();
  event.stopPropagation();

  if (confirm("Are you sure you want to delete this bookmark?")) {
    bookmarks = bookmarks.filter((b) => b.id !== id);
    saveBookmarks();
    renderBookmarks();
  }
}

document.getElementById("addBookmarkBtn").addEventListener("click", () => {
  openModal("Add Bookmark");
});

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);

document.getElementById("bookmarkModal").addEventListener("click", (e) => {
  if (e.target.id === "bookmarkModal") {
    closeModal();
  }
});

// Bookmark Form Submission
document.getElementById("bookmarkForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("bookmarkName").value.trim();
  const url = document.getElementById("bookmarkUrl").value.trim();
  let category = document.getElementById("bookmarkCategory").value;
  const newCategoryGroup = document.getElementById("newCategoryGroup");

  if (!name || !url) return;

  if (newCategoryGroup && newCategoryGroup.style.display !== "none") {
    const newName = document.getElementById("newCategoryName").value.trim();
    const newIcon = document.getElementById("newCategoryIcon").value.trim() || "📁";
    
    if (newName) {
      const newId = newName.toLowerCase().replace(/\s+/g, "-");
      const existingKey = Object.keys(categories).find(
        k => categories[k].name.toLowerCase() === newName.toLowerCase()
      );
      if (!existingKey) {
        categories[newId] = {
          name: newName,
          icon: newIcon,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`
        };
        saveCategories();
        populateCategoryOptions();
        category = newId;
        
        newCategoryGroup.style.display = "none";
        document.getElementById("newCategoryName").value = "";
        document.getElementById("newCategoryIcon").value = "";
        const addBtn = document.getElementById("addCategoryBtn");
        if (addBtn) addBtn.innerHTML = '<i class="fas fa-plus"></i>';
      } else {
        category = existingKey;
      }
    }
  }

  if (editingId) {
    const index = bookmarks.findIndex((b) => b.id === editingId);
    if (index !== -1) {
      bookmarks[index] = { ...bookmarks[index], name, url, category };
    }
  } else {
    const newBookmark = {
      id: Date.now().toString(),
      name,
      url,
      category,
    };
    bookmarks.push(newBookmark);
  }

  saveBookmarks();
  renderBookmarks();
  closeModal();
});

// Add category button toggle
const addCategoryBtn = document.getElementById("addCategoryBtn");
if (addCategoryBtn) {
  addCategoryBtn.addEventListener("click", () => {
    const group = document.getElementById("newCategoryGroup");
    if (group) {
      const isHidden = group.style.display === "none";
      group.style.display = isHidden ? "block" : "none";
      addCategoryBtn.innerHTML = isHidden ? '<i class="fas fa-times"></i>' : '<i class="fas fa-plus"></i>';
      addCategoryBtn.title = isHidden ? "Cancel" : "Add New Category";
    }
  });
}

loadBookmarks();

async function loadNetworkInfo() {
  try {
    const geoRes = await fetch("https://ipwho.is/");
    const data = await geoRes.json();
    const ip = data.ip || "Unavailable";

    const userAgent = navigator.userAgent;
    let browserName = "Unknown Browser";
    let osName = "Unknown OS";

    if (userAgent.indexOf("Win") != -1) osName = "Windows";
    else if (userAgent.indexOf("Mac") != -1) osName = "MacOS";
    else if (userAgent.indexOf("Linux") != -1) osName = "Linux";
    else if (userAgent.indexOf("Android") != -1) osName = "Android";
    else if (userAgent.indexOf("like Mac") != -1) osName = "iOS";

    if (userAgent.indexOf("Edg") != -1) browserName = "Edge";
    else if (userAgent.indexOf("Chrome") != -1) browserName = "Chrome";
    else if (userAgent.indexOf("Firefox") != -1) browserName = "Firefox";
    else if (userAgent.indexOf("Safari") != -1) browserName = "Safari";
    else if (userAgent.indexOf("Opera") != -1 || userAgent.indexOf("OPR") != -1) browserName = "Opera";

    const safeSetText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    safeSetText("ipInfo", ip || "Unavailable");
    safeSetText("countryInfo", data.country || "Unknown");
    safeSetText("cityInfo", data.city || "Unknown");
    safeSetText("stateInfo", data.region || "Unknown");
    safeSetText("timezoneInfo", `${data.timezone ? data.timezone.id : Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    safeSetText("dnsIpInfo", `${data.connection ? data.connection.org : "Unknown"}`);
    safeSetText("osInfo", `${osName}`);
    safeSetText("browserInfo", `${browserName}`);
  } catch (error) {
    console.error("Failed to load network info:", error);
    // Fallback display
    const safeSetText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    safeSetText("ipInfo", "Unavailable");
    safeSetText("countryInfo", "Unavailable");
    safeSetText("cityInfo", "Unavailable");
    safeSetText("stateInfo", "Unavailable");
  }
}

const weatherCodes = {
  0: { icon: "☀️", desc: "Clear sky" },
  1: { icon: "🌤️", desc: "Mainly clear" },
  2: { icon: "⛅", desc: "Partly cloudy" },
  3: { icon: "☁️", desc: "Overcast" },
  45: { icon: "🌫️", desc: "Fog" },
  48: { icon: "🌫️", desc: "Rime fog" },
  51: { icon: "🌦️", desc: "Light drizzle" },
  53: { icon: "🌦️", desc: "Drizzle" },
  55: { icon: "🌦️", desc: "Heavy drizzle" },
  56: { icon: "🌧️", desc: "Freezing drizzle" },
  57: { icon: "🌧️", desc: "Heavy freezing drizzle" },
  61: { icon: "🌧️", desc: "Light rain" },
  63: { icon: "🌧️", desc: "Rain" },
  65: { icon: "🌧️", desc: "Heavy rain" },
  66: { icon: "🌧️", desc: "Freezing rain" },
  67: { icon: "🌧️", desc: "Heavy freezing rain" },
  71: { icon: "🌨️", desc: "Light snow" },
  73: { icon: "🌨️", desc: "Snow" },
  75: { icon: "🌨️", desc: "Heavy snow" },
  77: { icon: "🌨️", desc: "Snow grains" },
  80: { icon: "🌦️", desc: "Light showers" },
  81: { icon: "🌧️", desc: "Showers" },
  82: { icon: "🌧️", desc: "Heavy showers" },
  85: { icon: "🌨️", desc: "Light snow showers" },
  86: { icon: "🌨️", desc: "Heavy snow showers" },
  95: { icon: "⛈️", desc: "Thunderstorm" },
  96: { icon: "⛈️", desc: "Thunderstorm with hail" },
  99: { icon: "⛈️", desc: "Severe thunderstorm" },
};

let weatherExpanded = false;

async function loadWeather(manualCity = null, useGeo = false) {
  const weatherWidget = document.getElementById("weatherWidget");
  const weatherControls = document.getElementById("weatherControls");
  const weatherDetails = document.getElementById("weatherDetails");
  if (!weatherWidget) return;

  weatherWidget.innerHTML = `<div class="weather-loading">Loading weather...</div>`;

  let lat, lon, cityName, countryName = "";

  async function getLocationByIP() {
    const apis = [
      {
        url: "https://ipwho.is/",
        parse: (d) => ({ lat: d.latitude, lon: d.longitude, city: d.city || "Unknown", country: d.country || "" })
      },
      {
        url: "https://ipapi.co/json/",
        parse: (d) => ({ lat: d.latitude, lon: d.longitude, city: d.city || "Unknown", country: d.country_name || "" })
      },
      {
        url: "https://freeipapi.com/api/json",
        parse: (d) => ({ lat: d.latitude, lon: d.longitude, city: d.cityName || "Unknown", country: d.countryName || "" })
      }
    ];
    for (const api of apis) {
      try {
        const res = await fetch(api.url);
        if (!res.ok) continue;
        const data = await res.json();
        const parsed = api.parse(data);
        if (parsed.lat && parsed.lon) return parsed;
      } catch (e) { continue; }
    }
    return null;
  }

  try {
    if (manualCity) {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualCity)}&count=1&language=en&format=json`,
      );
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        cityName = geoData.results[0].name;
        countryName = geoData.results[0].country || "";
        localStorage.setItem(uKey("weatherCity"), manualCity);
        localStorage.removeItem(uKey("weatherAutoGeo"));
      } else {
        throw new Error("City not found");
      }
    } else if (useGeo) {
      let gotGeo = false;
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000,
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        gotGeo = true;
      } catch (e) {}

      if (!gotGeo) {
        const ipLoc = await getLocationByIP();
        if (ipLoc) {
          lat = ipLoc.lat;
          lon = ipLoc.lon;
          cityName = ipLoc.city;
          countryName = ipLoc.country;
        } else {
          throw new Error("Could not determine location");
        }
      }

      if (!cityName) {
        const ipLoc = await getLocationByIP();
        if (ipLoc) {
          cityName = ipLoc.city;
          countryName = ipLoc.country;
        } else {
          cityName = "My Location";
        }
      }
      localStorage.setItem(uKey("weatherAutoGeo"), "true");
      localStorage.removeItem(uKey("weatherCity"));
    } else {
      const savedCity = localStorage.getItem(uKey("weatherCity"));
      const savedAutoGeo = localStorage.getItem(uKey("weatherAutoGeo"));

      if (savedCity) {
        return loadWeather(savedCity);
      }

      if (savedAutoGeo === "true") {
        return loadWeather(null, true);
      }

      let gotGeo = false;
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000,
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        gotGeo = true;
      } catch (e) {}

      if (!gotGeo) {
        const ipLoc = await getLocationByIP();
        if (ipLoc) {
          lat = ipLoc.lat;
          lon = ipLoc.lon;
          cityName = ipLoc.city;
          countryName = ipLoc.country;
        } else {
          throw new Error("Could not determine location");
        }
      }

      if (!cityName) {
        const ipLoc = await getLocationByIP();
        if (ipLoc) {
          cityName = ipLoc.city;
          countryName = ipLoc.country;
        } else {
          cityName = "My Location";
        }
      }
    }

    if (!lat || !lon) {
      lat = 40.7128;
      lon = -74.006;
      cityName = cityName || "New York";
      countryName = countryName || "United States";
    }

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto&forecast_days=5`,
    );
    if (!response.ok) throw new Error("Weather API error");
    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    const weatherInfo = weatherCodes[current.weather_code] || { icon: "🌤️", desc: "Unknown" };
    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const humidity = current.relative_humidity_2m;
    const windSpeed = Math.round(current.wind_speed_10m);
    const windDir = current.wind_direction_10m;
    const pressure = Math.round(current.surface_pressure);
    const uvIndex = current.uv_index !== undefined ? Math.round(current.uv_index) : "--";

    const windDirText = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][Math.round(windDir / 22.5) % 16];

    const locationText = countryName ? `${cityName}, ${countryName}` : cityName;

    weatherWidget.innerHTML = `
      <div class="weather-display">
        <span class="weather-icon">${weatherInfo.icon}</span>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span class="weather-temp">${temp}°C</span>
          <span style="font-size:11px;opacity:0.7;">Feels ${feelsLike}°C</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;margin-left:10px;">
          <span style="font-size:14px;font-weight:600;color:#00ffff;text-shadow:0 0 10px rgba(0,255,255,0.5);">${locationText}</span>
          <span style="font-size:11px;opacity:0.8;">${weatherInfo.desc}</span>
        </div>
        <span class="weather-expand-btn" style="margin-left:auto;cursor:pointer;font-size:12px;opacity:0.6;">▼</span>
      </div>
    `;

    if (weatherDetails) {
      let forecastHtml = "";
      if (daily && daily.time) {
        const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        for (let i = 1; i < Math.min(daily.time.length, 5); i++) {
          const d = new Date(daily.time[i]);
          const dayName = days[d.getDay()];
          const dayIcon = (weatherCodes[daily.weather_code[i]] || {icon:"🌤️"}).icon;
          const hi = Math.round(daily.temperature_2m_max[i]);
          const lo = Math.round(daily.temperature_2m_min[i]);
          const rain = daily.precipitation_probability_max[i] || 0;
          forecastHtml += `
            <div class="forecast-day">
              <span class="forecast-name">${dayName}</span>
              <span class="forecast-icon">${dayIcon}</span>
              <span class="forecast-temps">${hi}° / ${lo}°</span>
              <span class="forecast-rain">💧${rain}%</span>
            </div>
          `;
        }
      }

      let sunriseTime = "", sunsetTime = "";
      if (daily && daily.sunrise && daily.sunset) {
        sunriseTime = new Date(daily.sunrise[0]).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
        sunsetTime = new Date(daily.sunset[0]).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      }

      weatherDetails.innerHTML = `
        <div class="weather-extra-grid">
          <div class="weather-extra-item">
            <i class="fas fa-wind"></i>
            <span>${windSpeed} km/h ${windDirText}</span>
          </div>
          <div class="weather-extra-item">
            <i class="fas fa-tint"></i>
            <span>${humidity}%</span>
          </div>
          <div class="weather-extra-item">
            <i class="fas fa-compress-arrows-alt"></i>
            <span>${pressure} hPa</span>
          </div>
          <div class="weather-extra-item">
            <i class="fas fa-sun"></i>
            <span>UV ${uvIndex}</span>
          </div>
          ${sunriseTime ? `
          <div class="weather-extra-item">
            <i class="fas fa-sunrise" style="color:#ffa500;"></i>
            <span>${sunriseTime}</span>
          </div>
          <div class="weather-extra-item">
            <i class="fas fa-sunset" style="color:#ff6347;"></i>
            <span>${sunsetTime}</span>
          </div>
          ` : ""}
        </div>
        <div class="weather-forecast">
          ${forecastHtml}
        </div>
      `;
    }

    if (!weatherWidget.hasAttribute("data-listener")) {
      weatherWidget.addEventListener("click", (e) => {
        e.stopPropagation();
        weatherExpanded = !weatherExpanded;
        if (weatherDetails) {
          weatherDetails.style.display = weatherExpanded ? "block" : "none";
        }
        if (weatherControls) {
          weatherControls.style.display = weatherExpanded ? "flex" : "none";
        }
        const expandBtn = weatherWidget.querySelector(".weather-expand-btn");
        if (expandBtn) expandBtn.textContent = weatherExpanded ? "▲" : "▼";
      });
      weatherWidget.setAttribute("data-listener", "true");
    }

    const setBtn = document.getElementById("setManualLocation");
    if (setBtn && !setBtn.hasAttribute("data-listener")) {
      setBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cityInput = document.getElementById("manualLocation");
        const city = cityInput ? cityInput.value.trim() : "";
        if (city) loadWeather(city);
      });
      setBtn.setAttribute("data-listener", "true");
    }

    const autoBtn = document.getElementById("autoLocationBtn");
    if (autoBtn && !autoBtn.hasAttribute("data-listener")) {
      autoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        localStorage.removeItem(uKey("weatherCity"));
        loadWeather(null, true);
      });
      autoBtn.setAttribute("data-listener", "true");
    }
  } catch (error) {
    console.error("Weather error:", error);
    weatherWidget.innerHTML = `<div class="weather-error">🌤️ Weather unavailable — click to set city</div>`;
    if (weatherControls) {
      weatherControls.style.display = "flex";
    }
    weatherWidget.onclick = () => {
      weatherControls.style.display = weatherControls.style.display === "flex" ? "none" : "flex";
    };
    const setBtn = document.getElementById("setManualLocation");
    if (setBtn && !setBtn.hasAttribute("data-listener")) {
      setBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cityInput = document.getElementById("manualLocation");
        const city = cityInput ? cityInput.value.trim() : "";
        if (city) loadWeather(city);
      });
      setBtn.setAttribute("data-listener", "true");
    }
    const autoBtn = document.getElementById("autoLocationBtn");
    if (autoBtn && !autoBtn.hasAttribute("data-listener")) {
      autoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        localStorage.removeItem(uKey("weatherCity"));
        loadWeather(null, true);
      });
      autoBtn.setAttribute("data-listener", "true");
    }
  }
}

loadWeather();
setInterval(() => loadWeather(), 600000);
loadNetworkInfo();

function saveProfile() {
  const imageUrl = document.getElementById("profileImageUrl").value.trim();
  const name = document.getElementById("userName").value.trim();
  const wallpaperUrl = document.getElementById("customWallpaperUrl").value.trim();

  const profile = { imageUrl, name, wallpaperUrl };
  try {
    localStorage.setItem(uKey("profile"), JSON.stringify(profile));
  } catch (e) {
    alert("Image is too large to save. Please use a smaller image or a URL instead.");
    return;
  }

  loadProfile();
  closeProfileModal();
}

function loadProfile() {
  const saved = localStorage.getItem(uKey("profile"));
  const profilePhoto = document.getElementById("profilePhoto");
  const avatarPreview = document.getElementById("profileAvatarPreview");
  const bannerBg = document.getElementById("profileBannerBg");
  const bgOverlay = document.getElementById("backgroundOverlay");

  if (saved) {
    const profile = JSON.parse(saved);

    if (profile.imageUrl) {
      profilePhoto.innerHTML = `<img src="${profile.imageUrl}" alt="Profile">`;
      if (avatarPreview) avatarPreview.innerHTML = `<img src="${profile.imageUrl}" alt="Avatar">`;
    } else {
      profilePhoto.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
      if (avatarPreview) avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
    }

    if (profile.wallpaperUrl) {
      bgOverlay.style.backgroundImage = `url(${profile.wallpaperUrl})`;
      if (bannerBg) bannerBg.style.backgroundImage = `url(${profile.wallpaperUrl})`;
    } else {
      bgOverlay.style.backgroundImage = '';
      if (bannerBg) bannerBg.style.backgroundImage = '';
    }
  }
}

function updateProfileUrlPreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  const url = input.value.trim();
  if (url) {
    preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-unlink\\' style=\\'color:rgba(255,255,255,0.2);font-size:14px\\'></i>'">`;
  } else {
    preview.innerHTML = '';
  }
}

function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) { h = h * (maxWidth / w); w = maxWidth; }
        if (h > maxHeight) { w = w * (maxHeight / h); h = maxHeight; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

document.getElementById("profileImageUpload").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    const imageUrl = await compressImage(file, 256, 256, 0.8);
    const avatarPreview = document.getElementById("profileAvatarPreview");
    if (avatarPreview) avatarPreview.innerHTML = `<img src="${imageUrl}" alt="Preview">`;
    const profilePhoto = document.getElementById("profilePhoto");
    if (profilePhoto) profilePhoto.innerHTML = `<img src="${imageUrl}" alt="Profile">`;
    document.getElementById("profileImageUrl").value = imageUrl;
    updateProfileUrlPreview("profileImageUrl", "profileUrlPreview");
  }
});

const bannerImageUpload = document.getElementById("bannerImageUpload");
if (bannerImageUpload) {
  bannerImageUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = await compressImage(file, 1920, 1080, 0.7);
      const bannerBg = document.getElementById("profileBannerBg");
      if (bannerBg) bannerBg.style.backgroundImage = `url(${imageUrl})`;
      document.getElementById("customWallpaperUrl").value = imageUrl;
      updateProfileUrlPreview("customWallpaperUrl", "wallpaperMiniPreview");
      document.getElementById("backgroundOverlay").style.backgroundImage = `url(${imageUrl})`;
    }
  });
}

function closeProfileModal() {
  document.getElementById("profileModal").classList.remove("active");
}

function openProfileModal() {
  const saved = localStorage.getItem(uKey("profile"));
  if (saved) {
    const profile = JSON.parse(saved);
    document.getElementById("profileImageUrl").value = profile.imageUrl || "";
    document.getElementById("userName").value = profile.name || "";
    document.getElementById("customWallpaperUrl").value = profile.wallpaperUrl || "";

    const avatarPreview = document.getElementById("profileAvatarPreview");
    const bannerBg = document.getElementById("profileBannerBg");
    if (profile.imageUrl) {
      if (avatarPreview) avatarPreview.innerHTML = `<img src="${profile.imageUrl}" alt="Avatar">`;
    } else {
      if (avatarPreview) avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
    }
    if (profile.wallpaperUrl) {
      if (bannerBg) bannerBg.style.backgroundImage = `url(${profile.wallpaperUrl})`;
    } else {
      if (bannerBg) bannerBg.style.backgroundImage = '';
    }

    updateProfileUrlPreview("profileImageUrl", "profileUrlPreview");
    updateProfileUrlPreview("customWallpaperUrl", "wallpaperMiniPreview");
  } else {
    const avatarPreview = document.getElementById("profileAvatarPreview");
    if (avatarPreview) avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
    const bannerBg = document.getElementById("profileBannerBg");
    if (bannerBg) bannerBg.style.backgroundImage = '';
  }

  const tabs = document.querySelectorAll(".profile-tab");
  const contents = document.querySelectorAll(".profile-tab-content");
  tabs.forEach(t => t.classList.remove("active"));
  contents.forEach(c => c.classList.remove("active"));
  if (tabs[0]) tabs[0].classList.add("active");
  const firstTab = document.getElementById("tab-appearance");
  if (firstTab) firstTab.classList.add("active");

  updateSecurityTab();
  document.getElementById("profileModal").classList.add("active");
}

document.getElementById("profilePhoto").addEventListener("click", openProfileModal);

document.querySelectorAll(".profile-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".profile-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".profile-tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    const target = document.getElementById("tab-" + tab.dataset.tab);
    if (target) target.classList.add("active");
  });
});

function updateSecurityTab() {
  const passkeyLinked = !!localStorage.getItem("passkeyRegistered");
  const accessIdLinked = !!localStorage.getItem("accessId");
  const usbKeyLinked = !!localStorage.getItem("usbKeyRegistered");

  function updateMethod(id, badgeId, statusId, btnId, isLinked) {
    const card = document.getElementById(id);
    const badge = document.getElementById(badgeId);
    const status = document.getElementById(statusId);
    const btn = document.getElementById(btnId);
    if (card) {
      card.classList.toggle("linked", isLinked);
    }
    if (badge) {
      badge.innerHTML = isLinked ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';
    }
    if (status) {
      status.textContent = isLinked ? "Linked" : "Not linked";
    }
    if (btn) {
      btn.textContent = isLinked ? "Unlink" : "Link";
    }
  }

  updateMethod("secPasskey", null, "secPasskeyStatus", "secPasskeyBtn", passkeyLinked);
  updateMethod("secAccessId", null, "secAccessIdStatus", "secAccessIdBtn", accessIdLinked);
  updateMethod("secUsbKey", null, "secUsbKeyStatus", "secUsbKeyBtn", false);

  const secEmailInput = document.getElementById("secEmail");
  if (secEmailInput) {
    const profileData = JSON.parse(localStorage.getItem("profileData") || "{}");
    secEmailInput.value = profileData.email || "";
  }
  const secCurrentPwd = document.getElementById("secCurrentPassword");
  const secNewPwd = document.getElementById("secNewPassword");
  const secConfirmPwd = document.getElementById("secConfirmPassword");
  if (secCurrentPwd) secCurrentPwd.value = "";
  if (secNewPwd) secNewPwd.value = "";
  if (secConfirmPwd) secConfirmPwd.value = "";
}

function setupPwdToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  if (btn && input) {
    btn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.querySelector("i").className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
    });
  }
}
setupPwdToggle("secCurrentPwdToggle", "secCurrentPassword");
setupPwdToggle("secNewPwdToggle", "secNewPassword");
setupPwdToggle("secConfirmPwdToggle", "secConfirmPassword");

document.querySelectorAll(".sec-nav-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    const targetId = pill.getAttribute("data-sec-target");
    const target = document.getElementById(targetId);
    const scrollArea = document.getElementById("secScrollArea");
    if (target && scrollArea) {
      document.querySelectorAll(".sec-nav-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      scrollArea.scrollTo({
        top: target.offsetTop - scrollArea.offsetTop,
        behavior: "smooth",
      });
    }
  });
});

const secScrollArea = document.getElementById("secScrollArea");
if (secScrollArea) {
  secScrollArea.addEventListener("scroll", () => {
    const cards = ["secCardCredentials", "secCardMethods", "secCardBackup"];
    const pills = document.querySelectorAll(".sec-nav-pill");
    let activeIdx = 0;
    cards.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && el.offsetTop - secScrollArea.offsetTop <= secScrollArea.scrollTop + 30) {
        activeIdx = i;
      }
    });
    pills.forEach((p, i) => p.classList.toggle("active", i === activeIdx));
  });
}

const secChangePwdBtn = document.getElementById("secChangePwdBtn");
if (secChangePwdBtn) {
  secChangePwdBtn.addEventListener("click", () => {
    const currentPwd = document.getElementById("secCurrentPassword").value;
    const newPwd = document.getElementById("secNewPassword").value;
    const confirmPwd = document.getElementById("secConfirmPassword").value;
    const savedPwd = localStorage.getItem("loginPassword");

    if (!currentPwd || !newPwd || !confirmPwd) {
      alert("Please fill in all password fields.");
      return;
    }
    if (currentPwd !== savedPwd) {
      alert("Current password is incorrect.");
      return;
    }
    if (newPwd.length < 4) {
      alert("New password must be at least 4 characters.");
      return;
    }
    if (newPwd === currentPwd) {
      alert("New password must be different from your current password.");
      return;
    }
    if (newPwd !== confirmPwd) {
      alert("New password and confirmation do not match.");
      return;
    }

    localStorage.setItem("loginPassword", newPwd);
    document.getElementById("secCurrentPassword").value = "";
    document.getElementById("secNewPassword").value = "";
    document.getElementById("secConfirmPassword").value = "";
    alert("Password changed successfully!");
  });
}

const secPasskeyBtn = document.getElementById("secPasskeyBtn");
if (secPasskeyBtn) {
  secPasskeyBtn.addEventListener("click", () => {
    alert("Error");
  });
}

const secAccessIdBtn = document.getElementById("secAccessIdBtn");
if (secAccessIdBtn) {
  secAccessIdBtn.addEventListener("click", () => {
    alert("Contact the administrator for Access ID");
  });
}

const secUsbKeyBtn = document.getElementById("secUsbKeyBtn");
if (secUsbKeyBtn) {
  secUsbKeyBtn.addEventListener("click", () => {
    alert("Not Detected");
  });
}

const backupUserIdEl = document.getElementById("backupUserId");
if (backupUserIdEl) {
  backupUserIdEl.textContent = currentUserId;
}

const backupExportBtn = document.getElementById("backupExportBtn");
if (backupExportBtn) {
  backupExportBtn.addEventListener("click", () => {
    const bookmarksData = JSON.parse(localStorage.getItem(uKey("bookmarks")) || "[]");
    const categoriesData = JSON.parse(localStorage.getItem(uKey("bookmarkCategories")) || "{}");
    const appListData = JSON.parse(localStorage.getItem(uKey("app_list")) || "[]");
    const engine = localStorage.getItem(uKey("searchEngine")) || "google";

    let htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and classified if you import it. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${Math.floor(Date.now()/1000)}" LAST_MODIFIED="${Math.floor(Date.now()/1000)}">Dashboard Settings</H3>
    <DL><p>
        <DT><A HREF="https://dashboard.config/app_list" ADD_DATE="${Math.floor(Date.now()/1000)}" DASHBOARD_DATA='${JSON.stringify(appListData)}'>App List Data</A>
        <DT><A HREF="https://dashboard.config/categories" ADD_DATE="${Math.floor(Date.now()/1000)}" DASHBOARD_DATA='${JSON.stringify(categoriesData)}'>Categories Data</A>
        <DT><A HREF="https://dashboard.config/engine" ADD_DATE="${Math.floor(Date.now()/1000)}" DASHBOARD_DATA="${engine}">Search Engine</A>
    </DL><p>
`;

    // Group bookmarks by category
    const grouped = {};
    bookmarksData.forEach(bm => {
      const cat = bm.category || "uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(bm);
    });

    for (const [catId, bms] of Object.entries(grouped)) {
      const catName = categoriesData[catId]?.name || catId;
      htmlContent += `    <DT><H3 ADD_DATE="${Math.floor(Date.now()/1000)}" LAST_MODIFIED="${Math.floor(Date.now()/1000)}">${catName}</H3>\n    <DL><p>\n`;
      bms.forEach(bm => {
        htmlContent += `        <DT><A HREF="${bm.url}" ADD_DATE="${Math.floor(Date.now()/1000)}">${bm.name}</A>\n`;
      });
      htmlContent += `    </DL><p>\n`;
    }

    htmlContent += `</DL><p>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_bookmarks_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

const backupImportFile = document.getElementById("backupImportFile");
if (backupImportFile) {
  backupImportFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(event.target.result, "text/html");
        const links = doc.querySelectorAll("a");
        
        let importedBookmarks = [];
        let importedCategories = {};
        let importedAppList = [];
        let importedEngine = "";

        links.forEach(link => {
          const href = link.getAttribute("href");
          const text = link.textContent;
          const dashboardData = link.getAttribute("DASHBOARD_DATA");

          if (href === "https://dashboard.config/app_list" && dashboardData) {
            importedAppList = JSON.parse(dashboardData);
          } else if (href === "https://dashboard.config/categories" && dashboardData) {
            importedCategories = JSON.parse(dashboardData);
          } else if (href === "https://dashboard.config/engine" && dashboardData) {
            importedEngine = dashboardData;
          } else if (href && !href.includes("dashboard.config")) {
            // It's a real bookmark. Find its category by looking at the closest H3
            let category = "uncategorized";
            let parentDL = link.closest("dl");
            if (parentDL) {
              let dt = parentDL.parentElement;
              if (dt && dt.tagName === "DT") {
                let h3 = dt.querySelector("h3");
                if (h3) {
                  // Try to find matching category ID by name
                  const catName = h3.textContent.trim();
                  const foundCat = Object.entries(importedCategories).find(([_, c]) => c.name === catName);
                  category = foundCat ? foundCat[0] : catName.toLowerCase().replace(/\s+/g, "_");
                }
              }
            }
            importedBookmarks.push({
              id: Date.now() + Math.random().toString(36).substr(2, 9),
              name: text,
              url: href,
              category: category
            });
          }
        });

        if (importedBookmarks.length > 0) {
          // Merge or overwrite bookmarks? Overwrite for now as per previous logic
          localStorage.setItem(uKey("bookmarks"), JSON.stringify(importedBookmarks));
        }
        
        // Always ensure categories are updated if we have them
        if (Object.keys(importedCategories).length > 0) {
          localStorage.setItem(uKey("bookmarkCategories"), JSON.stringify(importedCategories));
        } else {
          // If no categories metadata, we should at least extract the unique categories from bookmarks
          const existingCats = JSON.parse(localStorage.getItem(uKey("bookmarkCategories")) || "{}");
          const newCats = { ...existingCats };
          let changed = false;
          
          importedBookmarks.forEach(bm => {
            if (bm.category && bm.category !== "uncategorized" && !newCats[bm.category]) {
              newCats[bm.category] = { 
                name: bm.category.charAt(0).toUpperCase() + bm.category.slice(1), 
                icon: "📁", 
                color: "#667eea" 
              };
              changed = true;
            }
          });
          
          if (changed) {
            localStorage.setItem(uKey("bookmarkCategories"), JSON.stringify(newCats));
          }
        }
        if (importedAppList.length > 0) {
          localStorage.setItem(uKey("app_list"), JSON.stringify(importedAppList));
        }
        if (importedEngine) {
          localStorage.setItem(uKey("searchEngine"), importedEngine);
        }

        alert("Bookmarks and settings imported from HTML successfully! Reloading...");
        window.location.reload();
      } catch (err) {
        alert("Failed to read HTML backup. Make sure it's a valid Netscape Bookmark HTML file.");
      }
    };
    reader.readAsText(file);
    backupImportFile.value = "";
  });
}

const profileImageUrlInput = document.getElementById("profileImageUrl");
if (profileImageUrlInput) {
  profileImageUrlInput.addEventListener("input", () => {
    updateProfileUrlPreview("profileImageUrl", "profileUrlPreview");
    const url = profileImageUrlInput.value.trim();
    const avatarPreview = document.getElementById("profileAvatarPreview");
    const profilePhoto = document.getElementById("profilePhoto");
    if (url) {
      if (avatarPreview) avatarPreview.innerHTML = `<img src="${url}" alt="Avatar" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`;
      if (profilePhoto) profilePhoto.innerHTML = `<img src="${url}" alt="Profile" onerror="this.parentElement.innerHTML='<svg width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><path d=\\'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\\'></path><circle cx=\\'12\\' cy=\\'7\\' r=\\'4\\'></circle></svg>'">`;
    } else {
      if (avatarPreview) avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
      if (profilePhoto) profilePhoto.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    }
  });
}

const wallpaperUrlInput = document.getElementById("customWallpaperUrl");
if (wallpaperUrlInput) {
  wallpaperUrlInput.addEventListener("input", () => {
    updateProfileUrlPreview("customWallpaperUrl", "wallpaperMiniPreview");
    const url = wallpaperUrlInput.value.trim();
    const bannerBg = document.getElementById("profileBannerBg");
    if (bannerBg) {
      bannerBg.style.backgroundImage = url ? `url(${url})` : '';
    }
  });
}

const resetProfileBtn = document.getElementById("resetProfileBtn");
if (resetProfileBtn) {
  resetProfileBtn.addEventListener("click", () => {
    if (confirm("Reset all profile settings to defaults?")) {
      localStorage.removeItem(uKey("profile"));
      document.getElementById("profileImageUrl").value = "";
      document.getElementById("userName").value = "";
      document.getElementById("customWallpaperUrl").value = "";
      const avatarPreview = document.getElementById("profileAvatarPreview");
      if (avatarPreview) avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
      const bannerBg = document.getElementById("profileBannerBg");
      if (bannerBg) bannerBg.style.backgroundImage = '';
      const profilePhoto = document.getElementById("profilePhoto");
      if (profilePhoto) profilePhoto.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
      document.getElementById("backgroundOverlay").style.backgroundImage = '';
      updateProfileUrlPreview("profileImageUrl", "profileUrlPreview");
      updateProfileUrlPreview("customWallpaperUrl", "wallpaperMiniPreview");
      closeProfileModal();
    }
  });
}

const closeProfileBtn = document.getElementById("closeProfileModal");
if (closeProfileBtn) {
  closeProfileBtn.addEventListener("click", closeProfileModal);
}
const saveProfileBtn = document.getElementById("saveProfileBtn");
if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", saveProfile);
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("lastLoginMethod");
    localStorage.removeItem("lastLoginEmail");
    localStorage.removeItem("loginPassword");
    localStorage.removeItem("profileData");
    localStorage.removeItem("accessId");
    localStorage.removeItem("passkeyRegistered");
    localStorage.removeItem("usbKeyRegistered");
    window.location.href = "index.html";
  });
}

const toggle24Hour = document.getElementById("toggle24Hour");
if (toggle24Hour) {
  toggle24Hour.checked = localStorage.getItem(uKey("pref_24hour")) === "true";
  toggle24Hour.addEventListener("change", () => {
    localStorage.setItem(uKey("pref_24hour"), toggle24Hour.checked);
    updateTime();
  });
}

const toggleSeconds = document.getElementById("toggleSeconds");
if (toggleSeconds) {
  toggleSeconds.checked = localStorage.getItem(uKey("pref_showSeconds")) !== "false";
  toggleSeconds.addEventListener("change", () => {
    localStorage.setItem(uKey("pref_showSeconds"), toggleSeconds.checked);
    updateTime();
  });
}

  // App list functionality handled below in consolidated handler

  const uploadBtn = document.getElementById("uploadBtn");
  const uploadDropdown = document.getElementById("uploadDropdown");

  if (uploadBtn) {
    uploadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      uploadDropdown.classList.toggle("active");
    });
  }

  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("uploadDropdown");
    if (dropdown && !dropdown.contains(e.target) && !e.target.closest("#uploadBtn")) {
      dropdown.classList.remove("active");
    }
    const engineDd = document.getElementById("engineDropdown");
    if (engineDd && !engineDd.contains(e.target) && !e.target.closest("#engineSelector")) {
      engineDd.classList.remove("active");
      const searchBar = document.querySelector(".search-engines-bar");
      if (searchBar) {
        searchBar.classList.remove("active");
        searchBar.style.marginTop = "100px";
      }
    }
  });

let apps = JSON.parse(localStorage.getItem(uKey("apps"))) || [
  {
    name: "Account",
    url: "https://myaccount.google.com",
    icon: "fas fa-user-circle",
  },
  {
    name: "Drive",
    url: "https://drive.google.com",
    icon: "fab fa-google-drive",
  },
  {
    name: "Business",
    url: "https://business.google.com",
    icon: "fas fa-briefcase",
  },
  { name: "Gmail", url: "https://mail.google.com", icon: "fas fa-envelope" },
  { name: "YouTube", url: "https://youtube.com", icon: "fab fa-youtube" },
  { name: "Gemini", url: "https://gemini.google.com", icon: "fas fa-sparkles" },
  {
    name: "Maps",
    url: "https://maps.google.com",
    icon: "fas fa-map-marker-alt",
  },
  { name: "Search", url: "https://google.com", icon: "fab fa-google" },
  {
    name: "Calendar",
    url: "https://calendar.google.com",
    icon: "fas fa-calendar-alt",
  },
  { name: "News", url: "https://news.google.com", icon: "fas fa-newspaper" },
  { name: "Photos", url: "https://photos.google.com", icon: "fas fa-images" },
  { name: "Meet", url: "https://meet.google.com", icon: "fas fa-video" },
];

function renderApps() {
  const grid = document.getElementById("appListGrid");
  if (!grid) return;
  grid.innerHTML = "";

  apps.forEach((app, index) => {
    const item = document.createElement("a");
    item.className = "app-item";
    item.href = app.url;
    item.target = "_blank";

    let iconHtml = "";
    if (app.icon.startsWith("http")) {
      iconHtml = `<img src="${app.icon}" alt="${app.name}">`;
    } else {
      iconHtml = `<i class="${app.icon}"></i>`;
    }

    item.innerHTML = `
      <div class="app-icon-container">${iconHtml}</div>
      <span class="app-name">${app.name}</span>
      <div class="app-item-actions">
        <button class="app-icon-btn app-edit-btn" data-index="${index}"><i class="fas fa-edit"></i></button>
        <button class="app-icon-btn app-delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
      </div>
    `;

    item.querySelector(".app-edit-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAppModal(index);
    });

    item.querySelector(".app-delete-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteApp(index);
    });

    grid.appendChild(item);
  });
}

function openAppModal(index = null) {
  const modal = document.getElementById("appModal");
  const form = document.getElementById("appForm");
  const title = document.getElementById("appModalTitle");

  if (!modal || !form) return;

  if (index !== null && apps[index]) {
    title.textContent = "Edit App";
    form.appName.value = apps[index].name;
    form.appUrl.value = apps[index].url;
    form.dataset.index = index;
  } else {
    title.textContent = "Add App";
    form.reset();
    delete form.dataset.index;
  }

  modal.classList.add("active");
  modal.style.display = "flex";
}

function closeAppModal() {
  const modal = document.getElementById("appModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

function deleteApp(index) {
  if (confirm("Delete this app?")) {
    apps.splice(index, 1);
    localStorage.setItem(uKey("apps"), JSON.stringify(apps));
    renderApps();
  }
}

document.getElementById("appForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = e.target.appName.value;
  const url = e.target.appUrl.value;
  const index = e.target.dataset.index;

  const newApp = {
    name,
    url,
    icon: `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`,
  };

  if (index !== undefined) {
    apps[index] = newApp;
  } else {
    apps.push(newApp);
  }

  localStorage.setItem(uKey("apps"), JSON.stringify(apps));
  renderApps();
  closeAppModal();
});

  const editAppsFooterBtn = document.getElementById("editAppsFooterBtn");
  if (editAppsFooterBtn) {
    editAppsFooterBtn.addEventListener("click", () => {
      const grid = document.getElementById("appListGrid");
      grid.classList.toggle("edit-mode");
      grid.classList.remove("arrange-mode");
    });
  }

  const editAppsBtnTop = document.getElementById("editAppsBtnTop");
  if (editAppsBtnTop) {
    editAppsBtnTop.addEventListener("click", () => {
      const grid = document.getElementById("appListGrid");
      if (grid) {
        grid.classList.toggle("edit-mode");
        grid.classList.remove("arrange-mode");
      }
    });
  }

  const arrangeAppsBtn = document.getElementById("arrangeAppsBtn");
  if (arrangeAppsBtn) {
    arrangeAppsBtn.addEventListener("click", () => {
      const grid = document.getElementById("appListGrid");
      if (grid) {
        grid.classList.toggle("arrange-mode");
        grid.classList.remove("edit-mode");
      }
    });
  }

  const addAppBtnElement = document.getElementById("addAppBtn");
  if (addAppBtnElement) {
    addAppBtnElement.addEventListener("click", () => openAppModal());
  }

  const appListTriggerElement = document.getElementById("appListTrigger");
  const appListDropdownElement = document.getElementById("appListDropdown");
  if (appListTriggerElement && appListDropdownElement) {
    const toggleAppList = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("App list toggle triggered");
      
      // Move to body to avoid overflow issues
      if (appListDropdownElement.parentElement !== document.body) {
        document.body.appendChild(appListDropdownElement);
      }
      
      const isActive = appListDropdownElement.classList.contains("active");
      
      if (isActive) {
        appListDropdownElement.classList.remove("active");
        appListDropdownElement.style.setProperty("display", "none", "important");
      } else {
        // Close other dropdowns
        const uploadDropdown = document.getElementById("uploadDropdown");
        if (uploadDropdown) uploadDropdown.classList.remove("active");
        
        appListDropdownElement.classList.add("active");
        appListDropdownElement.style.setProperty("display", "flex", "important");
        appListDropdownElement.style.setProperty("z-index", "2147483647", "important");
        appListDropdownElement.style.setProperty("position", "fixed", "important");
        appListDropdownElement.style.setProperty("top", "70px", "important");
        appListDropdownElement.style.setProperty("right", "20px", "important");
        appListDropdownElement.style.setProperty("opacity", "1", "important");
        appListDropdownElement.style.setProperty("pointer-events", "auto", "important");
        
        renderApps();
      }
    };
    
    // Direct assignment to the element to override any other listeners
    appListTriggerElement.onclick = toggleAppList;
    appListTriggerElement.style.cursor = "pointer";
    appListTriggerElement.style.pointerEvents = "auto";
  }

  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("appListDropdown");
    const trigger = document.getElementById("appListTrigger");
    
    if (
      dropdown &&
      dropdown.classList.contains("active") &&
      !dropdown.contains(e.target) &&
      (!trigger || !trigger.contains(e.target))
    ) {
      console.log("Closing app list from outside click");
      dropdown.classList.remove("active");
      dropdown.style.setProperty("display", "none", "important");
    }
  });

  const closeAppModalBtn = document.getElementById("closeAppModal");
  if (closeAppModalBtn) {
    closeAppModalBtn.addEventListener("click", closeAppModal);
  }
  const cancelAppBtnElement = document.getElementById("cancelAppBtn");
  if (cancelAppBtnElement) {
    cancelAppBtnElement.addEventListener("click", closeAppModal);
  }

  renderApps();


// Background wallpaper loading commented out due to CORS restrictions
// async function loadBackgroundWallpaper() {
//   try {
//     const response = await fetch('https://source.unsplash.com/random/1920x1080/?nature,landscape');
//     const imageUrl = response.url;
//
//     const overlay = document.getElementById('backgroundOverlay');
//     overlay.style.backgroundImage = `url(${imageUrl})`;
//
//     localStorage.setItem('lastWallpaper', imageUrl);
//   } catch (error) {
//     console.error('Failed to load wallpaper:', error);
//   }
// }

// const savedWallpaper = localStorage.getItem('lastWallpaper');
// if (savedWallpaper) {
//   document.getElementById('backgroundOverlay').style.backgroundImage = `url(${savedWallpaper})`;
// } else {
//   loadBackgroundWallpaper();
// }

function renderApps() {
  const grid = document.getElementById("appListGrid");
  if (!grid) return;
  grid.innerHTML = "";

  apps.forEach((app, index) => {
    const item = document.createElement("a");
    item.className = "app-item";
    item.href = app.url;
    item.target = "_blank";

    let iconHtml = "";
    if (app.icon && app.icon.startsWith("http")) {
      iconHtml = `<img src="${app.icon}" alt="${app.name}">`;
    } else {
      iconHtml = `<i class="${app.icon || "fas fa-external-link-alt"}"></i>`;
    }

    item.innerHTML = `
      <div class="app-icon-container">${iconHtml}</div>
      <span class="app-name">${app.name}</span>
      <div class="app-item-actions">
        <button class="app-icon-btn app-edit-btn" data-index="${index}" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="app-icon-btn app-delete-btn" data-index="${index}" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `;

    item.querySelector(".app-edit-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAppModal(index);
    });

    item.querySelector(".app-delete-btn").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteApp(index);
    });

    grid.appendChild(item);
  });
}

const addAppBtnTop = document.getElementById("addAppBtnTop");
if (addAppBtnTop) {
  addAppBtnTop.addEventListener("click", () => openAppModal());
}

let isTesting = false;

async function measurePing() {
  const pingUrl = "https://www.cloudflare.com/cdn-cgi/trace";
  const iterations = 5;
  let totalPing = 0;

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    await fetch(pingUrl, {
      method: "GET",
      cache: "no-store",
      mode: "cors",
    });
    const endTime = performance.now();
    totalPing += endTime - startTime;
  }

  return (totalPing / iterations).toFixed(1);
}

async function measureDownload() {
  const downloadUrl =
    "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js";
  const iterations = 3;
  let totalSpeed = 0;

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const response = await fetch(downloadUrl + "?t=" + Date.now(), {
      cache: "no-store",
      mode: "cors",
    });
    const blob = await response.blob();
    const endTime = performance.now();

    const durationInSeconds = (endTime - startTime) / 1000;
    const bitsLoaded = blob.size * 8;
    const speedBps = bitsLoaded / durationInSeconds;
    const speedMbps = speedBps / (1024 * 1024);

    totalSpeed += speedMbps;
  }

  return (totalSpeed / iterations).toFixed(2);
}

async function measureUpload() {
  const uploadUrl = "https://httpbin.org/post";
  const uploadSize = 500 * 1024;
  const iterations = 2;
  let totalSpeed = 0;

  const data = new ArrayBuffer(uploadSize);
  const blob = new Blob([data]);

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    try {
      await fetch(uploadUrl, {
        method: "POST",
        body: blob,
        cache: "no-store",
        mode: "cors",
      });
      const endTime = performance.now();

      const durationInSeconds = (endTime - startTime) / 1000;
      const bitsUploaded = uploadSize * 8;
      const speedBps = bitsUploaded / durationInSeconds;
      const speedMbps = speedBps / (1024 * 1024);

      totalSpeed += speedMbps;
    } catch (error) {
      console.error("Upload test error:", error);
      return 0;
    }
  }

  return (totalSpeed / iterations).toFixed(2);
}


async function runSpeedTest() {
  if (isTesting) return;

  isTesting = true;
  const pingValue = document.getElementById("pingValue");
  const downloadValue = document.getElementById("downloadValue");
  const uploadValue = document.getElementById("uploadValue");
  const downloadGauge = document.getElementById("downloadGauge");
  const uploadGauge = document.getElementById("uploadGauge");
  const speedStatus = document.getElementById("speedStatus");
  const speedBtn = document.getElementById("speedTestBtn");
  const circumference = 2 * Math.PI * 52;

  function setGauge(el, pct) {
    if (!el) return;
    const offset = circumference - (pct / 100) * circumference;
    el.style.strokeDashoffset = offset;
  }

  speedBtn.disabled = true;
  speedBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i><span>Testing...</span>';

  pingValue.textContent = "--";
  downloadValue.textContent = "--";
  uploadValue.textContent = "--";
  setGauge(downloadGauge, 0);
  setGauge(uploadGauge, 0);

  try {
    speedStatus.textContent = "Measuring ping...";
    const ping = await measurePing();
    pingValue.textContent = ping;

    speedStatus.textContent = "Measuring download speed...";
    const download = await measureDownload();
    downloadValue.textContent = download;
    const downloadPct = Math.min((parseFloat(download) / 100) * 100, 100);
    setGauge(downloadGauge, downloadPct);

    speedStatus.textContent = "Measuring upload speed...";
    const upload = await measureUpload();
    uploadValue.textContent = upload;
    const uploadPct = Math.min((parseFloat(upload) / 50) * 100, 100);
    setGauge(uploadGauge, uploadPct);

    speedStatus.textContent = "Test completed successfully!";
  } catch (error) {
    pingValue.textContent = "--";
    downloadValue.textContent = "--";
    uploadValue.textContent = "--";
    setGauge(downloadGauge, 0);
    setGauge(uploadGauge, 0);
    speedStatus.textContent = "Test failed. Please try again.";
    console.error("Speed test error:", error);
  } finally {
    isTesting = false;
    speedBtn.disabled = false;
    speedBtn.innerHTML = '<i class="fas fa-redo"></i><span>Run Again</span>';
  }
}

document.getElementById("speedTestBtn").addEventListener("click", runSpeedTest);
