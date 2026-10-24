(async()=>{
const PRODUCTS = [
  ["tws", "TWS", 20],
  ["earphone", "Earphone", 15],
  ["audio-cable", "AUDIO CABLE", 10],
  ["power-cable", "POWER CABLE", 10],
  ["adapter-hwc04", "Adapter HW-C04", 20],
  ["tws-hw02", "TWS HW02", 20],
  ["cat8-ftp", "CAT 8 FTP", 15],
  ["displayport-16k", "DisplayPort 16K", 15],
  ["hdmi-16k", "HDMI 16K", 15],
  ["usb2-am-am", "USB 2.0 AM - AM", 10],
].map(([id, name, points]) => ({
  id,
  name,
  points,
  weight: 1,
  image: `assets/products/${id}.png`,
}));

const CONFIG = {
  title: "HOWELL CATCH & WIN",
  mode: "demo",
  duration: 30,
  lives: 3,
  width: 400,
  height: 710,
  bag: {
    width: 108,
    height: 144,
    base: 18,
    openingY: 0.27,
    openingWidth: 0.88,
  },
  toteBagExpansion: {
    enabled: true,
    maxScale: 1.5,
    duration: 8,
    animationDuration: 0.25,
    spawnChance: 0.35,
    stackable: false,
    refreshOnCollect: true,
  },
  itemSize: 64,
  difficulty: [
    {
      at: 0,
      speed: 150,
      interval: 0.72,
      bomb: 0.07,
      damaged: 0.03,
      bonus: 0.12,
      label: "PEMANASAN",
    },
    {
      at: 10,
      speed: 205,
      interval: 0.58,
      bomb: 0.1,
      damaged: 0.06,
      bonus: 0.15,
      label: "MAKIN SERU",
    },
    {
      at: 20,
      speed: 265,
      interval: 0.46,
      bomb: 0.14,
      damaged: 0.08,
      bonus: 0.15,
      label: "GAS TERUS!",
    },
  ],
  powerups: { double: 5, magnet: 4, slow: 3, totebag: 8 },
  slowFactor: 0.55,
  magnetRange: 125,
  magnetSpeed: 210,
  damage: 10,
  bonusPoints: 30,
  volume: 0.12,
  maxDpr: 2,
  maxItems: 22,
  bagImage: "assets/player/howell-totebag.png",
  bombImage: "assets/products/bomb-pajak.png",
  bombSize: 82,
  bombAnimation: { sway: 0.075, pulse: 0.035, rate: 6 },
  debug: false,
  rewards: [
    { min: 0, name: "Voucher Partisipasi" },
    { min: 81, name: "Hadiah Kecil" },
    { min: 151, name: "Aksesori HOWELL" },
    { min: 221, name: "Hadiah Spesial" },
  ],
};

const BONUSES = [
  { id: "double", icon: "×2", label: "Poin ganda", color: "#f6c941" },
  { id: "magnet", icon: "∩", label: "Magnet", color: "#50b9ff" },
  { id: "slow", icon: "◷", label: "Gerak lambat", color: "#ad91ff" },
  { id: "life", icon: "♥", label: "Nyawa ekstra", color: "#f57b8b" },
  { id: "points", icon: "+30", label: "Bonus poin", color: "#63d6a0" },
  { id: "totebag", icon: "👜", label: "Totebag +50%", color: "#38bdf8" },
  { id: "time5", icon: "+5s", label: "+5 Detik", color: "#00f5d4" },
  { id: "time10", icon: "+10s", label: "+10 Detik", color: "#10b981" },
];


const SKINS = {
  original: {
    id: "howell-original",
    name: "HOWELL ORIGINAL",
    shortName: "Original",
    assetKey: "bag",
    assetPath: "assets/player/howell-totebag.png",
    requiredScore: 0,
    defaultUnlocked: true,
    catchType: "bag",
    sprite: {
      width: 108,
      height: 144,
      base: 18,
    },
    opening: {
      openingY: 0.27,
      openingWidth: 0.88,
    },
    description: "Totebag autentik HOWELL INDOCOMTECH 2026.",
  },
  chomper: {
    id: "howell-chomper",
    name: "HOWELL CHOMPER",
    shortName: "Chomper",
    assetKey: "chomper",
    assetPath: "assets/skins/howell-chomper.png",
    requiredScore: 750,
    defaultUnlocked: false,
    catchType: "mouth",
    sprite: {
      width: 140,
      height: 140,
      base: 56, // Calibrated so mouth catch line matches totebag opening height (Y ≈ 587)
    },
    mouthHitbox: {
      centerX: 0.647,
      centerY: 0.609,
      width: 0.28,
      height: 0.18,
      openingY: 0.54,
      openingWidth: 0.92, // Generous, responsive catch mouth width (~100px)
    },
    description: "Karakter seru penangkap produk dengan mulut terbuka!",
  },
};

const DEFAULT_SKIN_ID = "howell-original";

function getSkin(skinId) {
  if (skinId === "howell-chomper" || skinId === "chomper") {
    return SKINS.chomper;
  }
  return SKINS.original;
}

function getAllSkins() {
  return [SKINS.original, SKINS.chomper];
}


function createState() {
  return {
    time: 0,
    score: 0,
    lives: CONFIG.lives,
    combo: 0,
    caught: 0,
    bestCombo: 0,
    effects: { double: 0, magnet: 0, slow: 0, totebag: 0 },
  };
}

function difficulty(time) {
  return CONFIG.difficulty.filter((d) => time >= d.at).at(-1);
}

function tick(s, dt) {
  const maxDur = s.duration || CONFIG.duration;
  s.time = Math.min(maxDur, s.time + dt);
  for (const key in s.effects)
    s.effects[key] = Math.max(0, s.effects[key] - dt);
}

function reward(score) {
  return CONFIG.rewards.filter((r) => score >= r.min).at(-1);
}

function pickProduct(random = Math.random) {
  let value = random() * PRODUCTS.reduce((n, p) => n + p.weight, 0);
  return PRODUCTS.find((p) => (value -= p.weight) < 0) || PRODUCTS.at(-1);
}

function collect(s, item) {
  if (item.collected) return null;
  item.collected = true;
  if (item.kind === "product") {
    const points = item.product.points * (s.effects.double > 0 ? 2 : 1);
    s.score += points;
    s.combo++;
    s.caught++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    return {
      text: `+${points}`,
      tone: "catch",
      combo: { 3: "KEREN!", 5: "HEBAT!", 10: "MASTER HOWELL!" }[s.combo],
    };
  }
  if (item.kind === "bomb") {
    s.lives = Math.max(0, s.lives - 1);
    s.combo = 0;
    return { text: "−1 NYAWA", tone: "bomb", negative: true };
  }
  if (item.kind === "damaged") {
    s.score = Math.max(0, s.score - CONFIG.damage);
    s.combo = 0;
    return { text: `−${CONFIG.damage}`, tone: "damage", negative: true };
  }
  const id = item.bonus.id;
  if (id === "life") s.lives = Math.min(CONFIG.lives, s.lives + 1);
  else if (id === "points")
    s.score += CONFIG.bonusPoints * (s.effects.double > 0 ? 2 : 1);
  else if (id === "totebag")
    s.effects.totebag = CONFIG.toteBagExpansion.duration;
  else if (id === "time5") {
    s.duration = (s.duration || CONFIG.duration) + 5;
    const pts = 5 * (s.effects.double > 0 ? 2 : 1);
    s.score += pts;
    return {
      text: "+5 DETIK & +5 POIN!",
      tone: "time5",
      timeAdded: 5,
    };
  } else if (id === "time10") {
    s.duration = (s.duration || CONFIG.duration) + 10;
    const pts = 10 * (s.effects.double > 0 ? 2 : 1);
    s.score += pts;
    return {
      text: "+10 DETIK & +10 POIN!",
      tone: "time10",
      timeAdded: 10,
    };
  } else s.effects[id] = CONFIG.powerups[id];

  return {
    text:
      id === "points"
        ? `+${CONFIG.bonusPoints * (s.effects.double > 0 ? 2 : 1)}`
        : id === "totebag"
          ? "TOTEBAG +50%!"
          : item.bonus.label.toUpperCase(),
    tone: id,
  };
}

function crossesOpening(item, previousY, opening) {
  const itemRadius = item.size * 0.35;
  const prevBottom = previousY + itemRadius;
  const currentBottom = item.y + itemRadius;

  // Horizontal overlap check: item overlaps with bag opening
  const maxHorizDist = opening.width / 2 + item.size * 0.12;
  if (Math.abs(item.x - opening.x) > maxHorizDist) {
    return false;
  }

  // Vertical swept check: crossed opening plane from above
  return prevBottom <= opening.y + 10 && currentBottom >= opening.y;
}

const KEY = "howell-catch-win-v2";
const SYNC_URL = "https://ntfy.sh/howell_indocomtech_leaderboard_v2";

const DEFAULT_SCORES = [
  { name: "Andrey", score: 700, date: "2026-10-23T06:45:59.320Z" },
  { name: "rida dan faiz", score: 605, date: "2026-10-23T06:41:53.038Z" },
  { name: "rida", score: 515, date: "2026-10-23T04:32:00.000Z" },
  { name: "Bintang Howell", score: 475, date: "2026-10-23T04:47:15.225Z" },
  { name: "Obi", score: 430, date: "2026-10-23T06:57:28.642Z" },
  { name: "Pemain Howell", score: 400, date: "2026-10-23T04:25:28.263Z" },
  { name: "wil", score: 380, date: "2026-10-23T04:20:52.568Z" },
  { name: "Wildan Pratama", score: 350, date: "2026-10-23T04:08:21.558Z" },
  { name: "dadang", score: 350, date: "2026-10-23T04:09:29.930Z" },
  { name: "Wildan", score: 280, date: "2026-10-23T03:36:01.834Z" },
  { name: "Rizky", score: 240, date: "2026-10-23T03:46:01.834Z" },
  { name: "Budi", score: 195, date: "2026-10-23T03:56:01.834Z" },
  { name: "Sarah", score: 160, date: "2026-10-23T04:06:01.834Z" },
  { name: "Nick", score: 160, date: "2026-10-23T06:03:40.364Z" },
];

let memory = { scores: [], muted: false },
  loaded = false,
  sessionBest = 0,
  syncing = false;

const validScore = (value) => Number.isSafeInteger(value) && value >= 0;

function read(force = false) {
  if (loaded && !force) return memory;
  loaded = true;
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      const v1 = localStorage.getItem("howell-catch-win-v1");
      if (v1) {
        try {
          const parsedV1 = JSON.parse(v1);
          if (parsedV1 && typeof parsedV1.muted === "boolean") {
            memory.muted = parsedV1.muted;
          }
        } catch {}
      }
    }
    const data = raw ? JSON.parse(raw) : null;
    if (data && Array.isArray(data.scores)) {
      memory = {
        muted: !!data.muted,
        scores: data.scores
          .filter(
            (s) =>
              s &&
              typeof s.name === "string" &&
              validScore(s.score) &&
              Number.isFinite(Date.parse(s.date)),
          )
          .map((s) => ({
            name: s.name.slice(0, 20),
            score: s.score,
            date: s.date,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 50),
      };
    } else if (data && typeof data.muted === "boolean") {
      memory.muted = data.muted;
    }
  } catch {}

  // Seed default scores if database empty
  if (memory.scores.length === 0) {
    memory.scores = [...DEFAULT_SCORES];
    write();
  }

  return memory;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
    return true;
  } catch {
    return false;
  }
}

function validatePlayerName(name) {
  if (typeof name !== "string") {
    return { valid: false, error: "Masukkan nama minimal 2 karakter.", name: "" };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: "Masukkan nama minimal 2 karakter.", name: trimmed };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: "Nama maksimal 20 karakter.", name: trimmed.slice(0, 20) };
  }
  return { valid: true, error: "", name: trimmed };
}

function getLastPlayerName() {
  try {
    return localStorage.getItem("howell-player-name") || "";
  } catch {
    return "";
  }
}

function saveLastPlayerName(name) {
  try {
    const trimmed = (name || "").trim().slice(0, 20);
    if (trimmed) localStorage.setItem("howell-player-name", trimmed);
  } catch {}
}

function getPlayerBest(name) {
  read();
  const cleanName = (name || "").trim().toLowerCase();
  if (!cleanName) return 0;
  const existing = memory.scores.find(
    (s) => s.name.toLowerCase() === cleanName,
  );
  return existing ? existing.score : 0;
}

function registerPlayer(name, score = 0) {
  read();
  const cleanName = (name || "").trim().slice(0, 20);
  if (!cleanName || cleanName.length < 2) return;
  const existing = memory.scores.find(
    (s) => s.name.toLowerCase() === cleanName.toLowerCase(),
  );
  const now = new Date().toISOString();
  if (!existing) {
    // Only register brand new player with their own score (0 if new)
    const initialScore = Math.max(0, Number(score) || 0);
    memory.scores.push({
      name: cleanName,
      score: initialScore,
      date: now,
    });
    memory.scores.sort((a, b) => b.score - a.score);
    memory.scores = memory.scores.slice(0, 50);
    write();
    postScoreToCloud(cleanName, initialScore, now).catch(() => {});
  }
}

function saveScore(name, score) {
  read();
  if (!validScore(score)) return false;
  const cleanName = (name || "").trim().slice(0, 20) || "Pemain Howell";
  const now = new Date().toISOString();
  const existingIndex = memory.scores.findIndex(
    (s) => s.name.toLowerCase() === cleanName.toLowerCase(),
  );
  if (existingIndex >= 0) {
    // Update score if it exceeds previous score or if previous score was 0
    if (score >= memory.scores[existingIndex].score || memory.scores[existingIndex].score === 0) {
      memory.scores[existingIndex].score = score;
      memory.scores[existingIndex].date = now;
    }
  } else {
    memory.scores.push({
      name: cleanName,
      score,
      date: now,
    });
  }
  memory.scores.sort((a, b) => b.score - a.score);
  memory.scores = memory.scores.slice(0, 50);
  const ok = write();
  postScoreToCloud(cleanName, score, now).catch(() => {});
  return ok;
}

async function postScoreToCloud(name, score, date) {
  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
    await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ name, score, date: date || new Date().toISOString() }),
      signal: controller ? controller.signal : undefined,
    });
    if (timer) clearTimeout(timer);
  } catch {}
}

async function syncScores() {
  if (syncing) return memory.scores;
  syncing = true;
  read();

  try {
    let cloudScores = [];
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;
      const res = await fetch(`${SYNC_URL}/json?poll=1&since=all`, {
        cache: "no-store",
        signal: controller ? controller.signal : undefined,
      });
      if (timer) clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split("\n");
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.event === "message" && parsed.message) {
              const payload = JSON.parse(parsed.message);
              if (payload && payload.name && validScore(payload.score)) {
                cloudScores.push(payload);
              }
            }
          } catch {}
        }
      }
    } catch {}

    const map = new Map();

    const mergeItem = (item) => {
      if (!item || typeof item.name !== "string" || !validScore(item.score)) return;
      const name = item.name.trim().slice(0, 20);
      if (!name) return;
      const key = name.toLowerCase();
      const prev = map.get(key);
      if (!prev) {
        map.set(key, {
          name,
          score: item.score,
          date: item.date || new Date().toISOString(),
        });
      } else {
        if (item.score > prev.score) {
          prev.score = item.score;
          prev.name = name;
          prev.date = item.date || prev.date;
        } else if (item.score === prev.score) {
          if (item.date && prev.date && item.date > prev.date) {
            prev.date = item.date;
          }
        }
      }
    };

    DEFAULT_SCORES.forEach(mergeItem);
    cloudScores.forEach(mergeItem);
    memory.scores.forEach(mergeItem);

    const merged = Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    memory.scores = merged;
    write();
    return merged;
  } finally {
    syncing = false;
  }
}

async function fetchCloudScores() {
  return syncScores();
}

function setMuted(value) {
  read();
  memory.muted = !!value;
  write();
}

function bestScore() {
  let stored = 0;
  try {
    const value = Number(localStorage.getItem("howell-best"));
    if (validScore(value)) stored = value;
  } catch {}
  return Math.max(0, stored, sessionBest, ...read().scores.map((s) => s.score));
}

function saveBest(score) {
  if (!validScore(score)) return;
  sessionBest = Math.max(bestScore(), score);
  try {
    localStorage.setItem("howell-best", String(sessionBest));
  } catch {}
}

const PROFILES_KEY = "howell-player-profiles-v1";

function readProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeProfiles(map) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

function getPlayerProfile(name) {
  const cleanName = (name || "").trim().slice(0, 20) || "Pemain Howell";
  const key = cleanName.toLowerCase();
  const profiles = readProfiles();
  let profile = profiles[key];

  const currentBest = getPlayerBest(cleanName);

  if (!profile) {
    const alreadyQualified = currentBest >= 750;
    profile = {
      version: 1,
      nickname: cleanName,
      highScore: currentBest,
      unlockedSkins: alreadyQualified ? ["howell-original", "howell-chomper"] : ["howell-original"],
      selectedSkin: "howell-original",
      unlockCelebrationShown: alreadyQualified,
    };
    profiles[key] = profile;
    writeProfiles(profiles);
  } else {
    if (!Array.isArray(profile.unlockedSkins)) {
      profile.unlockedSkins = ["howell-original"];
    }
    if (!profile.unlockedSkins.includes("howell-original")) {
      profile.unlockedSkins.unshift("howell-original");
    }
    if (currentBest >= 750 && !profile.unlockedSkins.includes("howell-chomper")) {
      profile.unlockedSkins.push("howell-chomper");
    }
    profile.highScore = Math.max(profile.highScore || 0, currentBest);
    if (!profile.selectedSkin) profile.selectedSkin = "howell-original";
    if (typeof profile.unlockCelebrationShown !== "boolean") {
      profile.unlockCelebrationShown = profile.highScore >= 750;
    }
  }

  return profile;
}

function savePlayerProfile(profile) {
  if (!profile || !profile.nickname) return false;
  const key = profile.nickname.trim().toLowerCase();
  const profiles = readProfiles();
  profiles[key] = profile;
  return writeProfiles(profiles);
}

function getSelectedSkin(name) {
  const profile = getPlayerProfile(name);
  return profile.selectedSkin || "howell-original";
}

function setSelectedSkin(name, skinId) {
  const profile = getPlayerProfile(name);
  if (profile.unlockedSkins.includes(skinId)) {
    profile.selectedSkin = skinId;
    savePlayerProfile(profile);
    return true;
  }
  return false;
}

function unlockSkinIfEligible(name, finalScore) {
  const profile = getPlayerProfile(name);
  const score = Math.max(0, Number(finalScore) || 0);
  if (score >= 750) {
    const isFirstTime = !profile.unlockedSkins.includes("howell-chomper");
    if (isFirstTime) {
      profile.unlockedSkins.push("howell-chomper");
    }
    profile.highScore = Math.max(profile.highScore, score);
    savePlayerProfile(profile);
    return {
      unlocked: true,
      isFirstTime,
      showCelebration: isFirstTime && !profile.unlockCelebrationShown,
    };
  }
  return {
    unlocked: profile.unlockedSkins.includes("howell-chomper"),
    isFirstTime: false,
    showCelebration: false,
  };
}

function markCelebrationShown(name) {
  const profile = getPlayerProfile(name);
  profile.unlockCelebrationShown = true;
  savePlayerProfile(profile);
}


class Audio {
  constructor(muted) {
    this.muted = muted;
  }
  unlock() {
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      this.ctx.resume().catch(() => {});
    } catch {}
  }
  play(type = "button") {
    if (this.muted || !this.ctx) return;
    const notes = {
      button: [520],
      catch: [650, 920],
      chomp: [460, 360, 540],
      unlock: [523, 659, 784, 1046],
      combo: [660, 880, 1100],
      bomb: [120, 65],
      damage: [220, 160],
      double: [800, 1200],
      magnet: [420, 700, 950],
      slow: [600, 400, 300],
      life: [550, 750, 1000],
      points: [900, 1100, 1400],
      totebag: [580, 780, 980, 1280],
      time5: [720, 960, 1200],
      time10: [750, 1000, 1320, 1650],
      tick: [760],
      end: [500, 400, 300],
      record: [660, 880, 990, 1320],
    }[type] || [600];

    notes.forEach((f, i) => {
      const o = this.ctx.createOscillator(),
        g = this.ctx.createGain(),
        t = this.ctx.currentTime + i * 0.075;
      o.type = type === "bomb" ? "sawtooth" : "sine";
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(CONFIG.volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + 0.15);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    });
  }
}

async function loadAssets(progress) {
  const images = new Map(),
    missing = [];
  let count = 0;
  const entries = [
    ...PRODUCTS.map((p) => [p.id, p.image]),
    ["bag", CONFIG.bagImage],
    ["bomb", CONFIG.bombImage],
    ["chomper", "assets/skins/howell-chomper.png"],
  ];
  await Promise.all(
    entries.map(
      ([key, url]) =>
        new Promise((resolve) => {
          const img = new Image();
          const timer = setTimeout(() => finish(false), 12000);
          let done = false;
          function finish(ok) {
            if (done) return;
            done = true;
            clearTimeout(timer);
            if (ok) images.set(key, img);
            else missing.push(key);
            progress(++count / entries.length);
            resolve();
          }
          img.onload = () => finish(true);
          img.onerror = () => finish(false);
          img.src = url;
        }),
    ),
  );
  return { images, missing };
}
function fitImage(ctx, image, x, y, w, h) {
  if (!image) return;
  const scale = Math.min(w / image.width, h / image.height);
  ctx.drawImage(
    image,
    x + (w - image.width * scale) / 2,
    y + (h - image.height * scale) / 2,
    image.width * scale,
    image.height * scale,
  );
}


class Game {
  constructor(canvas, assets, audio, onUpdate, onEnd, skinId = "howell-original") {
    this.skin = getSkin(skinId);
    this.chompTimer = 0;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.assets = assets;
    this.audio = audio;
    this.onUpdate = onUpdate;
    this.onEnd = onEnd;
    this.state = createState();
    this.mode = "idle";
    this.items = [];
    this.entries = [];
    this.labels = [];
    this.particles = [];
    this.x = 200;
    this.target = 200;
    this.bagScale = 1.0;
    this.currentBagWidth = CONFIG.bag.width;
    this.totebagBonusSpawned = false;
    this.chompTimer = 0;
    this.prevX = CONFIG.width / 2;
    this.keys = new Set();
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.w = CONFIG.width;
      this.h = (this.w * r.height) / r.width;
      const dpr = Math.min(devicePixelRatio || 1, CONFIG.maxDpr);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      this.scale = canvas.width / this.w;
      this.target = this.clamp(this.target);
      this.x = this.clamp(this.x);
      this.render();
    };

    // Prevent browser scrolling/zooming on canvas touch
    if (canvas.style) {
      canvas.style.touchAction = "none";
      canvas.style.userSelect = "none";
      canvas.style.webkitUserSelect = "none";
    }

    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(canvas);

    // Cache bounding rect, refresh on resize/scroll
    this._cachedRect = null;
    this._rectDirty = true;
    const markRectDirty = () => { this._rectDirty = true; };
    window.addEventListener("scroll", markRectDirty, { passive: true });
    window.addEventListener("resize", markRectDirty, { passive: true });
    const origResize = this.resize;
    this.resize = () => { this._rectDirty = true; origResize(); };

    const getRect = () => {
      if (this._rectDirty || !this._cachedRect) {
        this._cachedRect = canvas.getBoundingClientRect();
        this._rectDirty = false;
      }
      return this._cachedRect;
    };

    const move = (e) => {
      if (this.mode !== "running") return;
      const r = getRect();
      // Directly set position (no interpolation target) while dragging
      const gameX = this.clamp(((e.clientX - r.left) / r.width) * this.w);
      this.target = gameX;
      // Snap bag directly to finger during active drag for zero-lag feel
      if (this.dragging) {
        this.x = gameX;
      }
    };

    canvas.addEventListener("pointerdown", (e) => {
      if (
        this.mode !== "running" ||
        this.activePointer != null ||
        e.isPrimary === false ||
        e.button > 0
      )
        return;
      e.preventDefault?.();
      this.activePointer = e.pointerId;
      this.dragging = true;
      canvas.setPointerCapture(e.pointerId);
      move(e);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (this.dragging && e.pointerId === this.activePointer) {
        e.preventDefault?.();
        move(e);
      }
    });

    const release = (e) => {
      if (e.pointerId === this.activePointer) {
        this.activePointer = null;
        this.dragging = false;
      }
    };

    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", release);

    window.addEventListener("keydown", (e) => {
      if (
        this.mode === "running" &&
        ["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)
      ) {
        e.preventDefault();
        this.keys.add(e.key);
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key));
    window.addEventListener("blur", () => this.keys.clear());
  }

  get activeSkin() {
    return this.skin || getSkin("howell-original");
  }

  setSkin(skinId) {
    this.skin = getSkin(skinId);
    this.x = this.clamp(this.x);
    this.target = this.clamp(this.target);
    this.render();
  }

  clamp(x) {
    const half = (this.currentBagWidth || CONFIG.bag.width) / 2;
    return Math.max(
      half + 10,
      Math.min(CONFIG.width - half - 10, x),
    );
  }

  opening() {
    const skin = this.activeSkin;
    const scale = this.bagScale || 1.0;

    if (skin.id === "howell-chomper") {
      const sprite = skin.sprite;
      const mouth = skin.mouthHitbox;
      const baseY = this.h - sprite.base - sprite.height;
      const mouthX = this.x;
      const mouthY = baseY + sprite.height * mouth.centerY;
      const openingY = baseY + sprite.height * mouth.openingY;
      const baseWidth = (this.currentBagWidth || CONFIG.bag.width) * CONFIG.bag.openingWidth;
      const width = baseWidth * scale;
      return {
        x: this.x,
        y: openingY,
        width,
        mouthX,
        mouthY,
        height: sprite.height * mouth.height * scale,
      };
    }

    const currentH = CONFIG.bag.height * scale;
    const width = (this.currentBagWidth || CONFIG.bag.width) * CONFIG.bag.openingWidth;
    const y =
      this.h -
      CONFIG.bag.base -
      currentH +
      currentH * CONFIG.bag.openingY;
    return {
      x: this.x,
      y,
      width,
      mouthX: this.x,
      mouthY: y + 25,
      height: 20,
    };
  }

  start() {
    this.stop();
    this.state = createState();
    this.items = [];
    this.entries = [];
    this.labels = [];
    this.particles = [];
    this.spawnTime = 0.3;
    this.bagScale = 1.0;
    this.currentBagWidth = CONFIG.bag.width;
    this.totebagBonusSpawned = false;
    this.x = this.target = CONFIG.width / 2;
    this.shake = 0;
    this.flash = 0;
    this.lastCountdown = 6;
    this.message = "";
    this.messageTime = 0;
    this.spawnLane = -1;
    this.mode = "running";
    this.resize();
    this.last = performance.now();
    this.uiTime = 0;
    this.frame = requestAnimationFrame((t) => this.loop(t));
    this.onUpdate(this);
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.keys.clear();
    this.dragging = false;
    this.activePointer = null;
    this.mode = "idle";
  }

  pause() {
    if (this.mode !== "running") return;
    this.mode = "paused";
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.keys.clear();
    this.dragging = false;
    this.activePointer = null;
  }

  resume() {
    if (this.mode !== "paused") return;
    this.mode = "running";
    this.last = performance.now();
    this.frame = requestAnimationFrame((t) => this.loop(t));
  }

  spawn() {
    if (this.items.length >= CONFIG.maxItems) return;
    const d = difficulty(this.state.time),
      r = Math.random();
    let item;

    // Guarantee that the special Howell Totebag Expansion bonus spawns early in every match (~3.5-5s)
    if (CONFIG.toteBagExpansion?.enabled && !this.totebagBonusSpawned && this.state.time >= 3.5) {
      this.totebagBonusSpawned = true;
      item = {
        kind: "bonus",
        bonus: BONUSES.find((b) => b.id === "totebag") || BONUSES[0],
      };
    } else if (r < d.bomb) {
      item = { kind: "bomb" };
    } else if (r < d.bomb + d.damaged) {
      item = { kind: "damaged" };
    } else if (r < d.bomb + d.damaged + d.bonus) {
      const isTotebag = CONFIG.toteBagExpansion?.enabled && Math.random() < (CONFIG.toteBagExpansion.spawnChance || 0.35);
      const remainingTime = Math.max(0, (this.state.duration || CONFIG.duration) - this.state.time);
      let chosenBonus;
      if (isTotebag) {
        chosenBonus = BONUSES.find((b) => b.id === "totebag") || BONUSES[0];
      } else {
        // Filter time bonuses out of the normal pool — they only appear via the rare clutch trigger below
        const otherBonuses = BONUSES.filter((b) => b.id !== "totebag" && b.id !== "time5" && b.id !== "time10");
        // Time bonuses are rare: only when under 10s remaining, 10% chance per eligible bonus spawn
        if (remainingTime <= 10 && Math.random() < 0.10) {
          chosenBonus = Math.random() < 0.7
            ? (BONUSES.find((b) => b.id === "time5") || otherBonuses[0])
            : (BONUSES.find((b) => b.id === "time10") || otherBonuses[0]);
        } else {
          chosenBonus = otherBonuses[Math.floor(Math.random() * otherBonuses.length)] || BONUSES[0];
        }
      }
      item = {
        kind: "bonus",
        bonus: chosenBonus,
      };
    } else {
      item = { kind: "product", product: pickProduct() };
    }

    let lane = Math.floor(Math.random() * 5);
    if (lane === this.spawnLane)
      lane = (lane + 1 + Math.floor(Math.random() * 4)) % 5;
    this.spawnLane = lane;

    Object.assign(item, {
      x: 42 + lane * 79 + (Math.random() - 0.5) * 12,
      y: -50,
      size: item.kind === "bomb" ? CONFIG.bombSize : CONFIG.itemSize,
      angle: (Math.random() - 0.5) * 0.3,
      speed: d.speed * (0.9 + Math.random() * 0.2),
      collected: false,
    });
    this.items.push(item);
  }

  loop(now) {
    if (this.mode !== "running") return;
    const elapsed = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    this.fps = 1 / Math.max(0.001, elapsed);
    const totalDuration = this.state.duration || CONFIG.duration;
    const remaining = Math.max(0, totalDuration - this.state.time);
    const delta = Math.min(elapsed, remaining),
      endTime = this.state.time + delta;

    let pending = delta;
    while (pending > 0 && this.state.lives > 0) {
      const step = Math.min(pending, 1 / 60);
      this.update(step);
      pending -= step;
    }
    if (this.state.lives > 0) this.state.time = endTime;
    this.render();

    this.uiTime -= elapsed;
    if (this.uiTime <= 0) {
      this.onUpdate(this);
      this.uiTime = 0.08;
    }

    if (this.state.lives === 0 || this.state.time >= totalDuration) {
      this.mode = "ended";
      this.frame = null;
      this.keys.clear();
      this.activePointer = null;
      this.dragging = false;
      this.onUpdate(this);
      this.onEnd(this.state);
      return;
    }
    this.frame = requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    tick(this.state, dt);

    // Totebag expansion smooth lerp (250ms)
    const targetScale = this.state.effects.totebag > 0 ? (CONFIG.toteBagExpansion?.maxScale || 1.5) : 1.0;
    const animDuration = CONFIG.toteBagExpansion?.animationDuration || 0.25;
    const animSpeed = ((CONFIG.toteBagExpansion?.maxScale || 1.5) - 1.0) / animDuration;

    if (this.bagScale < targetScale) {
      this.bagScale = Math.min(targetScale, this.bagScale + dt * animSpeed);
    } else if (this.bagScale > targetScale) {
      this.bagScale = Math.max(targetScale, this.bagScale - dt * animSpeed);
    }
    this.currentBagWidth = CONFIG.bag.width * this.bagScale;

    if (this.keys.has("ArrowLeft") || this.keys.has("a"))
      this.target = this.clamp(this.target - dt * 480);
    if (this.keys.has("ArrowRight") || this.keys.has("d"))
      this.target = this.clamp(this.target + dt * 480);

    this.target = this.clamp(this.target);
    const prevBagX = this.prevX != null ? this.prevX : this.x;
    // When dragging, bag already follows finger directly in the move handler.
    // When not dragging (keyboard or post-release), use fast smooth follow.
    if (this.dragging) {
      this.x = this.clamp(this.target);
    } else {
      this.x += (this.target - this.x) * (1 - Math.exp(-40 * dt));
      this.x = this.clamp(this.x);
    }

    this.spawnTime -= dt;
    if (this.spawnTime <= 0) {
      this.spawn();
      this.spawnTime = difficulty(this.state.time).interval;
    }

    const opening = this.opening();
    const currentH = CONFIG.bag.height * (this.bagScale || 1.0);
    const minBagX = Math.min(prevBagX, this.x);
    const maxBagX = Math.max(prevBagX, this.x);

    for (const item of this.items) {
      if (item.collected) continue;
      const previousY = item.y;

      if (
        item.kind === "product" &&
        this.state.effects.magnet > 0 &&
        Math.abs(item.x - this.x) < CONFIG.magnetRange &&
        item.y > opening.y - 230 &&
        item.y < opening.y
      ) {
        item.x +=
          Math.sign(this.x - item.x) *
          Math.min(Math.abs(this.x - item.x), dt * CONFIG.magnetSpeed);
      }

      item.y +=
        item.speed * dt * (this.state.effects.slow > 0 ? CONFIG.slowFactor : 1);

      // Robust, forgiving collision detection:
      // 1. Classical swept vertical crossing
      // 2. Horizontal bag sweep during fast drags
      // 3. Item inside upper catch mouth of bag
      const horizTol = opening.width / 2 + item.size * 0.18;
      const horizDirect = Math.abs(item.x - this.x) <= horizTol;
      const horizSwept = item.x >= minBagX - horizTol && item.x <= maxBagX + horizTol;

      const itemBottom = item.y + item.size * 0.35;
      const prevBottom = previousY + item.size * 0.35;
      const vertSwept = prevBottom <= opening.y + 16 && itemBottom >= opening.y - 12;
      const vertInsideMouth = itemBottom >= opening.y - 12 && item.y <= opening.y + currentH * 0.48;

      const isCaught =
        (horizDirect && (vertSwept || vertInsideMouth)) ||
        (horizSwept && (vertSwept || vertInsideMouth)) ||
        crossesOpening(item, previousY, opening);

      if (isCaught) {
        const result = collect(this.state, item);
        if (!result) continue;

        const isChomper = this.activeSkin.id === "howell-chomper";
        if (isChomper && !result.negative) {
          this.chompTimer = 0.18;
          this.audio.play("chomp");
        } else {
          this.audio.play(result.tone);
        }

        const isTotebag = item.bonus?.id === "totebag";
        if (isTotebag && this.activeSkin.id === "howell-chomper") {
          result.text = "CATCH AREA +50%!";
        }
        const isTime5 = item.bonus?.id === "time5";
        const isTime10 = item.bonus?.id === "time10";
        const isTime = isTime5 || isTime10;

        let labelColor = "#f6d343";
        if (result.negative) labelColor = "#ff7988";
        else if (isTotebag) labelColor = "#38bdf8";
        else if (isTime5) labelColor = "#00f5d4";
        else if (isTime10) labelColor = "#10b981";

        this.labels.push({
          text: result.text,
          x: this.x,
          y: opening.y - 30,
          life: 1.1,
          color: labelColor,
        });

        if (result.timeAdded) {
          this.message = result.text;
          this.messageTime = 1.3;
        }

        if (item.kind === "product")
          this.entries.push({
            ...item,
            life: 0.24,
            startX: item.x,
            startY: item.y,
          });

        if (result.negative) {
          this.shake = 0.2;
          this.flash = 0.18;
        }

        if (result.combo) {
          this.message = result.combo;
          this.messageTime = 1.4;
          this.audio.play("combo");
        }

        if (item.kind === "bonus" || item.kind === "bomb") {
          const count = isTotebag ? 24 : (isTime ? 20 : 14);
          for (let i = 0; i < count; i++)
            this.particles.push({
              x: this.x + (isTotebag ? (Math.random() - 0.5) * opening.width : 0),
              y: opening.y,
              vx: (Math.random() - 0.5) * (isTotebag ? 280 : (isTime ? 240 : 200)),
              vy: -Math.random() * (isTotebag ? 240 : (isTime ? 220 : 180)),
              life: isTotebag ? 0.7 : (isTime ? 0.65 : 0.55),
              color: result.negative
                ? "#ff7281"
                : (isTotebag
                    ? (i % 2 === 0 ? "#38bdf8" : "#f6d343")
                    : (isTime
                        ? (i % 2 === 0 ? item.bonus.color : "#ffffff")
                        : item.bonus.color)),
            });
        }

        if (this.state.lives === 0) break;
      }
    }

    this.prevX = this.x;
    this.items = this.items.filter((i) => !i.collected && i.y < this.h + 80);

    for (const i of this.entries) {
      i.life -= dt;
      const targetMouthY = opening.mouthY || (opening.y + 25);
      i.x += (opening.mouthX - i.x) * Math.min(1, dt * 25);
      i.y += (targetMouthY - i.y) * Math.min(1, dt * 25);
    }
    this.entries = this.entries.filter((i) => i.life > 0);

    for (const p of this.labels) {
      p.life -= dt;
      p.y -= dt * 35;
    }
    this.labels = this.labels.filter((p) => p.life > 0);

    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += dt * 320;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.messageTime = Math.max(0, this.messageTime - dt);
    if (this.chompTimer > 0) this.chompTimer = Math.max(0, this.chompTimer - dt);

    const remaining = Math.ceil(CONFIG.duration - this.state.time);
    if (remaining <= 5 && remaining > 0 && remaining !== this.lastCountdown) {
      this.lastCountdown = remaining;
      this.audio.play("tick");
    }
  }

  drawItem(item, alpha = 1, scale = 1) {
    const c = this.ctx,
      size = item.size * scale;
    c.save();
    c.globalAlpha = alpha;
    c.translate(item.x, item.y);
    c.rotate(item.angle || 0);

    if (item.kind === "product") {
      const g = c.createRadialGradient(0, 0, 2, 0, 0, size * 0.65);
      g.addColorStop(0, "#9bc4e44d");
      g.addColorStop(1, "#9bc4e400");
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, size * 0.65, 0, Math.PI * 2);
      c.fill();
      const image = this.assets.images.get(item.product.id);
      if (image) fitImage(c, image, -size / 2, -size / 2, size, size);
      else {
        c.fillStyle = "#315477";
        c.fillRect(-size / 2, -size / 3, size, size * 0.66);
        c.fillStyle = "#fff";
        c.font = "9px Arial";
        c.textAlign = "center";
        c.fillText(item.product.name, 0, 0, size - 5);
        c.font = "7px Arial";
        c.fillText("ASET BELUM TERSEDIA", 0, 13, size - 5);
      }
    } else if (item.kind === "bomb") {
      const bomb = this.assets.images.get("bomb");
      if (bomb) {
        const phase =
          this.state.time * CONFIG.bombAnimation.rate + item.x * 0.01;
        const pulse = this.reduced
          ? 1
          : 1 + Math.sin(phase * 1.4) * CONFIG.bombAnimation.pulse;
        if (!this.reduced)
          c.rotate(Math.sin(phase) * CONFIG.bombAnimation.sway);
        c.shadowColor = "#ffac32";
        c.shadowBlur = this.reduced ? 0 : 5 + 4 * (1 + Math.sin(phase * 1.4));
        fitImage(
          c,
          bomb,
          (-size * pulse) / 2,
          (-size * pulse) / 2,
          size * pulse,
          size * pulse,
        );
        c.restore();
        return;
      }
      c.strokeStyle = "#ffc94d";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(5, -20);
      c.quadraticCurveTo(7, -38, 21, -27);
      c.stroke();
      c.fillStyle = "#ffdc55";
      c.font = "20px Arial";
      c.fillText("✦", 15, -22);
      c.fillStyle = "#ed5465";
      c.beginPath();
      c.arc(0, 3, 23, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#222c3b";
      c.beginPath();
      c.arc(0, 1, 19, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "white";
      c.font = "bold 24px Arial";
      c.textAlign = "center";
      c.fillText("!", 0, 10);
    } else if (item.kind === "damaged") {
      c.fillStyle = "#b48965";
      c.fillRect(-23, -21, 46, 43);
      c.strokeStyle = "#624d40";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(0, -21);
      c.lineTo(-7, -7);
      c.lineTo(5, 2);
      c.lineTo(-3, 21);
      c.stroke();
      c.fillStyle = "#eb4355";
      c.beginPath();
      c.arc(20, -16, 12, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "white";
      c.font = "bold 18px Arial";
      c.textAlign = "center";
      c.fillText("!", 20, -10);
    } else if (item.bonus?.id === "totebag") {
      // Special falling HOWELL Totebag expansion collectible
      const pulse = 1 + (this.reduced ? 0 : Math.sin(this.state.time * 8 + item.x) * 0.1);
      c.shadowColor = "#38bdf8";
      c.shadowBlur = this.reduced ? 0 : 20;

      // Glowing outer halo
      c.fillStyle = "#0c4a6e";
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, 30 * pulse, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.shadowBlur = 0;

      // Mini Howell totebag inside
      const bag = this.assets.images.get("bag");
      if (bag) {
        fitImage(c, bag, -19 * pulse, -21 * pulse, 38 * pulse, 42 * pulse);
      } else {
        c.fillStyle = "#38bdf8";
        c.font = "24px Arial";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("👜", 0, -2);
      }

      // "+50%" tag badge at top
      c.fillStyle = "#0284c7";
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 1.5;
      c.beginPath();
      c.roundRect(4, -28, 30, 16, 4);
      c.fill();
      c.stroke();
      c.fillStyle = "#ffffff";
      c.font = "bold 9px Arial";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("+50%", 19, -20);
    } else if (item.bonus?.id === "time5" || item.bonus?.id === "time10") {
      const is10 = item.bonus.id === "time10";
      const glowColor = is10 ? "#10b981" : "#00f5d4";
      const pulse = 1 + (this.reduced ? 0 : Math.sin(this.state.time * 8 + item.x) * 0.08);

      c.shadowColor = glowColor;
      c.shadowBlur = this.reduced ? 0 : 16;

      c.fillStyle = is10 ? "#064e3b" : "#083344";
      c.strokeStyle = glowColor;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(0, 0, 24 * pulse, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.shadowBlur = 0;

      c.strokeStyle = glowColor;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-4 * pulse, -24 * pulse);
      c.lineTo(4 * pulse, -24 * pulse);
      c.stroke();

      c.fillStyle = "#ffffff";
      c.font = `bold ${is10 ? 14 : 15}px Arial, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(is10 ? "+10s" : "+5s", 0, -2);

      c.fillStyle = glowColor;
      c.font = "bold 9px Arial, sans-serif";
      c.fillText(is10 ? "+10 POIN" : "+5 POIN", 0, 10);
    } else {
      c.shadowColor = item.bonus.color;
      c.shadowBlur = this.reduced ? 0 : 15;
      c.fillStyle = "#192d3f";
      c.strokeStyle = item.bonus.color;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 24, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = item.bonus.color;
      c.font = "bold 23px Arial";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(item.bonus.icon, 0, 1);
    }
    c.restore();
  }

  render() {
    if (!this.scale) return;
    const c = this.ctx;
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    c.save();

    if (this.shake && !this.reduced)
      c.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);

    c.strokeStyle = "#43608016";
    c.lineWidth = 1;
    for (let y = 30; y < this.h; y += 46) {
      c.beginPath();
      c.moveTo(20, y);
      c.lineTo(this.w - 20, y);
      c.stroke();
    }
    for (let x = 32; x < this.w; x += 48) {
      c.beginPath();
      c.moveTo(x, 15);
      c.lineTo(x, this.h);
      c.stroke();
    }

    const opening = this.opening();
    const scale = this.bagScale || 1.0;
    const currentW = this.currentBagWidth || CONFIG.bag.width;
    const currentH = CONFIG.bag.height * scale;
    const baseY = this.h - CONFIG.bag.base - currentH;

    // Shadow on the ground under totebag
    c.fillStyle = "#0005";
    c.beginPath();
    c.ellipse(this.x, this.h - 18, currentW * 0.55, 9, 0, 0, Math.PI * 2);
    c.fill();

    if (this.state.effects.magnet > 0) {
      c.strokeStyle = "#50b9ff55";
      c.setLineDash([5, 6]);
      c.beginPath();
      c.arc(this.x, opening.y, CONFIG.magnetRange, Math.PI, 0);
      c.stroke();
      c.setLineDash([]);
    }

    for (const i of this.items) this.drawItem(i);
    for (const i of this.entries)
      this.drawItem(
        i,
        Math.max(0, i.life / 0.24),
        0.65 + (0.35 * i.life) / 0.24,
      );

    const skin = this.activeSkin;

    if (skin.id === "howell-chomper") {
      const chomperImg = this.assets.images.get("chomper");
      const sprite = skin.sprite;
      const mouthOffsetX = (skin.mouthHitbox.centerX - 0.5) * sprite.width;
      const spriteCenterLeft = this.x - mouthOffsetX;
      const spriteTop = this.h - sprite.base - sprite.height;

      // Subtle idle breathing & chomp bite pulse
      const idleBreathe = this.reduced ? 0 : Math.sin(this.state.time * 4) * 1.5;
      let chompScale = 1.0;
      if (this.chompTimer > 0) {
        const p = 1 - (this.chompTimer / 0.18);
        chompScale = 1 + Math.sin(p * Math.PI) * 0.08;
      }

      // Catch area +50% expansion aura around mouth
      if (this.state.effects.totebag > 0) {
        const auraPulse = 1 + (this.reduced ? 0 : Math.sin(this.state.time * 9) * 0.08);
        c.save();
        c.strokeStyle = "#38bdf8";
        c.lineWidth = 2.5;
        c.shadowColor = "#38bdf8";
        c.shadowBlur = 14;
        c.setLineDash([4, 4]);
        c.beginPath();
        c.ellipse(opening.mouthX, opening.mouthY, (opening.width / 2) * auraPulse, 18 * auraPulse, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }

      // Bite sparkle / feeding reaction at mouth center
      if (this.chompTimer > 0) {
        const cp = 1 - (this.chompTimer / 0.18);
        c.save();
        c.fillStyle = `rgba(246, 211, 67, ${(1 - cp) * 0.75})`;
        c.beginPath();
        c.arc(opening.mouthX, opening.mouthY, 18 * cp, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      // Render HOWELL Chomper face (1:1 ratio preserved, transparent background)
      if (chomperImg) {
        c.save();
        c.translate(spriteCenterLeft, spriteTop + sprite.height / 2 + idleBreathe);
        c.scale(chompScale, chompScale);
        fitImage(c, chomperImg, -sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);
        c.restore();
      } else {
        c.fillStyle = "#e07a5f";
        c.beginPath();
        c.arc(this.x, this.h - 80, 50, 0, Math.PI * 2);
        c.fill();
      }
    } else {
      const bag = this.assets.images.get("bag");
      if (bag) {
        fitImage(
          c,
          bag,
          this.x - currentW / 2,
          baseY,
          currentW,
          currentH,
        );
      } else {
        c.fillStyle = "#34506b";
        c.fillRect(this.x - currentW / 2, opening.y, currentW, this.h - opening.y - 18);
        c.fillStyle = "white";
        c.textAlign = "center";
        c.font = "10px Arial";
        c.fillText("TOTEBAG SEMENTARA", this.x, opening.y + 35);
      }
    }

    for (const p of this.particles) {
      c.globalAlpha = Math.max(0, p.life / 0.7);
      c.fillStyle = p.color;
      c.fillRect(p.x, p.y, 4, 4);
    }
    c.globalAlpha = 1;

    for (const p of this.labels) {
      c.globalAlpha = Math.min(1, p.life * 2);
      c.fillStyle = p.color;
      c.font = "bold 16px Arial";
      c.textAlign = "center";
      c.fillText(p.text, p.x, p.y);
    }
    c.globalAlpha = 1;

    if (CONFIG.debug) {
      c.strokeStyle = "#65ff8c";
      c.strokeRect(opening.x - opening.width / 2, opening.y, opening.width, 3);
      if (this.activeSkin.id === "howell-chomper") {
        c.strokeStyle = "#ff00ea";
        const sprite = this.activeSkin.sprite;
        const mouthOffsetX = (this.activeSkin.mouthHitbox.centerX - 0.5) * sprite.width;
        c.strokeRect(this.x - mouthOffsetX - sprite.width / 2, this.h - sprite.base - sprite.height, sprite.width, sprite.height);
        c.strokeStyle = "#ffff00";
        c.strokeRect(opening.mouthX - 18, opening.mouthY - 12, 36, 24);
      }
      for (const i of this.items)
        c.strokeRect(i.x - i.size / 2, i.y - i.size / 2, i.size, i.size);
    }

    if (this.flash) {
      c.fillStyle = `rgba(255,50,80,${this.flash * 0.7})`;
      c.fillRect(0, 0, this.w, this.h);
    }
    c.restore();
  }
}


const $ = (id) => document.getElementById(id);
let current = "loading",
  result = null,
  saved = false,
  scoreAnimation = 0,
  currentPlayerName = "",
  latestPlayedDate = null;

const audio = new Audio(read().muted);

function show(id) {
  cancelAnimationFrame(scoreAnimation);
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.toggle("hidden", s.id !== id));
  current = id;
  const name = currentPlayerName || getLastPlayerName();
  if (id === "home") {
    $("home-best").textContent = name ? getPlayerBest(name) : 0;
    renderHomeTopScores();
    const equipped = getSelectedSkin(name);
    game.setSkin(equipped);
  } else if (id === "skins") {
    renderSkinsUI();
  }
  $("cabinet").scrollIntoView({ block: "start" });
}

function soundUI() {
  $("sound").textContent = audio.muted ? "♫̸" : "♪";
  $("sound").setAttribute(
    "aria-label",
    audio.muted ? "Aktifkan suara" : "Matikan suara",
  );
  $("sound").setAttribute("aria-pressed", String(!audio.muted));
}
soundUI();

$("sound").onclick = () => {
  audio.unlock();
  audio.muted = !audio.muted;
  setMuted(audio.muted);
  soundUI();
  audio.play();
};

const assets = await loadAssets((value) => ($("load-progress").value = value));
if (assets.missing.length) {
  $("asset-warning").textContent =
    `${assets.missing.length} aset belum tersedia; penanda sementara digunakan.`;
  $("asset-warning").classList.remove("hidden");
}

const initialPlayerName = getLastPlayerName();
const game = new Game($("game"), assets, audio, update, end, getSelectedSkin(initialPlayerName));
window.game = game;

// Pre-fetch live cloud scores on initial startup
fetchCloudScores().then(() => {
  renderHomeTopScores();
  if (current === "leaderboard") renderLeaderboardRows();
});

function start() {
  if (current === "home") {
    const inputEl = $("player-name-input");
    const errorEl = $("player-name-error");
    const val = validatePlayerName(inputEl ? inputEl.value : "");
    if (!val.valid) {
      if (errorEl) {
        errorEl.textContent = val.error;
        errorEl.classList.remove("hidden");
      }
      if (inputEl) inputEl.focus();
      return;
    }
    currentPlayerName = val.name;
    saveLastPlayerName(val.name);
    registerPlayer(val.name, getPlayerBest(val.name));
    if (errorEl) errorEl.classList.add("hidden");
  }

  result = null;
  saved = false;
  $("pause-overlay").classList.add("hidden");
  show("play");
  game.start();
}

function pause() {
  if (game.mode === "running") {
    game.pause();
    $("pause-overlay").classList.remove("hidden");
    $("resume").focus();
  }
}

function update(g) {
  const s = g.state,
    totalDuration = s.duration || CONFIG.duration,
    left = Math.ceil(totalDuration - s.time);
  $("score").textContent = s.score;
  $("timer").textContent = left;
  $("timer-wrap").classList.toggle("urgent", left <= 5);
  $("time-fill").style.width = `${Math.min(100, Math.max(0, (left / totalDuration) * 100))}%`;
  $("lives").textContent =
    "♥".repeat(s.lives) + "♡".repeat(CONFIG.lives - s.lives);
  $("lives").setAttribute("aria-label", `${s.lives} nyawa`);
  $("stage").textContent = difficulty(s.time).label;
  $("announcement").textContent = g.messageTime > 0 ? g.message : "";

  const effects = Object.entries(s.effects)
    .filter(([, t]) => t > 0)
    .map(([id, t]) => {
      const b = BONUSES.find((b) => b.id === id);
      return `${b ? b.label : id} ${Math.ceil(t)} dtk`;
    });

  $("effects").replaceChildren(
    ...effects.map((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      return span;
    }),
  );

  if (CONFIG.debug) {
    $("debug").hidden = false;
    $("debug").textContent =
      `FPS ${Math.round(g.fps || 0)} | Item ${g.items.length}\nStatus ${g.mode} | BagScale ${g.bagScale.toFixed(2)}\nKecepatan ${difficulty(s.time).speed} | Waktu ${s.time.toFixed(1)}`;
  }
}

function end(state) {
  result = { ...state };
  saved = true;
  const player = currentPlayerName || getLastPlayerName() || "Pemain Howell";
  const prior = getPlayerBest(player),
    record = state.score > prior;

  audio.play(record ? "record" : "end");
  show("results");

  $("result-kicker").textContent = record
    ? "REKOR BARU!"
    : state.lives === 0
      ? "NYAWA HABIS!"
      : "WAKTU HABIS!";

  $("result-greeting").textContent = `Hebat, ${player}!`;
  $("record-label").textContent = record
    ? "✦ Rekor terbaikmu sejauh ini"
    : "Terus latihan, terus melesat.";
  $("caught").textContent = state.caught;
  $("combo").textContent = state.bestCombo;
  $("best").textContent = Math.max(prior, state.score);
  $("reward-name").textContent = reward(state.score).name;

  const begin = performance.now();
  function count(now) {
    const t = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : Math.min(1, (now - begin) / 650);
    $("final-score").textContent = Math.round(state.score * (1 - (1 - t) ** 3));
    if (t < 1) scoreAnimation = requestAnimationFrame(count);
  }
  scoreAnimation = requestAnimationFrame(count);

  latestPlayedDate = new Date().toISOString();
  saveScore(player, state.score);
  renderHomeTopScores();
  $("save-status").textContent = "★ Skor kamu tercatat di papan skor booth!";

  saveBest(state.score);

  const unlockInfo = unlockSkinIfEligible(player, state.score);
  if (unlockInfo.showCelebration) {
    setTimeout(() => {
      showSkinUnlockCelebration(player);
    }, 700);
  }
}


function showSkinUnlockCelebration(player) {
  const modal = $("skin-unlock-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  audio.play("unlock");

  $("btn-equip-now").onclick = () => {
    audio.unlock();
    audio.play();
    setSelectedSkin(player, "howell-chomper");
    game.setSkin("howell-chomper");
    markCelebrationShown(player);
    modal.classList.add("hidden");
    if (current === "skins") renderSkinsUI();
  };

  $("btn-equip-later").onclick = () => {
    audio.unlock();
    audio.play();
    markCelebrationShown(player);
    modal.classList.add("hidden");
  };
}

function renderHomeTopScores() {
  const list = $("home-top-scores-list");
  if (!list) return;
  const scores = read().scores.slice(0, 3);
  if (typeof list.replaceChildren === "function") {
    list.replaceChildren();
  } else {
    while (list.firstChild) list.removeChild(list.firstChild);
  }
  for (let i = 0; i < 3; i += 1) {
    const entry = scores[i];
    const row = document.createElement("li");
    const rank = document.createElement("span");
    const name = document.createElement("b");
    const score = document.createElement("strong");
    rank.textContent = i + 1;
    name.textContent = entry?.name || "Belum ada nama";
    score.textContent = entry ? entry.score : "—";
    row.append(rank, name, score);
    list.appendChild(row);
  }
}

function renderSkinsUI() {
  try {
    const player = currentPlayerName || getLastPlayerName() || "Pemain Howell";
    const profile = getPlayerProfile(player);
    const container = $("skins-grid") || $("skins-list") || document.querySelector(".skins-grid");
    if (!container) return;

    if (typeof container.replaceChildren === "function") {
      container.replaceChildren();
    } else {
      while (container.firstChild) container.removeChild(container.firstChild);
    }

    const allSkins = getAllSkins();
    const unlockedSkins = Array.isArray(profile?.unlockedSkins) ? profile.unlockedSkins : ["howell-original"];
    const highScore = profile?.highScore || 0;
    const selectedSkin = profile?.selectedSkin || "howell-original";

    allSkins.forEach((skin) => {
      const isChomper = skin.id === "howell-chomper";
      const isUnlocked = unlockedSkins.includes(skin.id) || (isChomper && highScore >= 750);
      const isEquipped = selectedSkin === skin.id;

      const card = document.createElement("div");
      card.className = "skin-card" + (isEquipped ? " equipped" : "") + (isUnlocked ? " unlocked" : " locked");

      const imgWrap = document.createElement("div");
      imgWrap.className = "skin-card-preview";

      const img = document.createElement("img");
      img.src = skin.assetPath || (isChomper ? "assets/skins/howell-chomper.png" : "assets/player/howell-totebag.png");
      img.alt = skin.name || "Skin";
      img.className = "skin-card-img" + (isChomper ? " chomper-preview" : "");
      imgWrap.appendChild(img);

      if (!isUnlocked) {
        const lockOverlay = document.createElement("div");
        lockOverlay.className = "skin-lock-overlay";
        lockOverlay.innerHTML = '<span class="lock-icon">🔒</span><b class="lock-label">BUKA DI 750 POIN</b>';
        imgWrap.appendChild(lockOverlay);
      }

      const info = document.createElement("div");
      info.className = "skin-card-info";

      const title = document.createElement("h3");
      title.textContent = skin.name || (isChomper ? "HOWELL CHOMPER" : "HOWELL ORIGINAL");

      const desc = document.createElement("p");
      desc.className = "skin-card-desc";
      desc.textContent = skin.description || "";

      info.appendChild(title);
      info.appendChild(desc);

      if (!isUnlocked) {
        const progressBox = document.createElement("div");
        progressBox.className = "skin-progress-box";
        const currentPts = highScore;
        const remaining = Math.max(0, 750 - currentPts);
        const pct = Math.min(100, Math.round((currentPts / 750) * 100));

        progressBox.innerHTML = `
          <div class="progress-labels">
            <span>REKOR: <b>${currentPts} / 750 POIN</b></span>
            <span>${remaining} poin lagi</span>
          </div>
          <div class="skin-progress-track">
            <div class="skin-progress-bar" style="width: ${pct}%"></div>
          </div>
        `;
        info.appendChild(progressBox);
      } else {
        const badge = document.createElement("div");
        badge.className = "skin-status-badge";
        badge.textContent = isEquipped ? "SEDANG DIGUNAKAN" : "TERBUKA ✓";
        info.appendChild(badge);
      }

      const btn = document.createElement("button");
      btn.className = "btn-skin-select " + (isEquipped ? "btn-active" : isUnlocked ? "btn-equip" : "btn-locked");
      if (isEquipped) {
        btn.textContent = "SEDANG DIGUNAKAN";
        btn.disabled = true;
      } else if (isUnlocked) {
        btn.textContent = "GUNAKAN";
        btn.onclick = () => {
          audio.unlock();
          audio.play();
          setSelectedSkin(player, skin.id);
          game.setSkin(skin.id);
          renderSkinsUI();
        };
      } else {
        btn.textContent = "TERKUNCI";
        btn.disabled = true;
      }

      card.appendChild(imgWrap);
      card.appendChild(info);
      card.appendChild(btn);
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error in renderSkinsUI:", err);
  }
}

function renderLeaderboardRows() {
  const scores = read().scores;
  const list = $("leaderboard-list");
  list.replaceChildren();

  const syncStatusEl = $("leaderboard-sync-status");
  if (syncStatusEl) {
    syncStatusEl.textContent = `✓ Terhubung · ${scores.length} pemain tercatat`;
  }

  const currentNameClean = (currentPlayerName || getLastPlayerName() || "").trim().toLowerCase();
  let playerRank = -1;
  let playerScore = 0;

  if (!scores.length) {
    const p = document.createElement("p");
    p.className = "notice";
    p.textContent =
      "Belum ada skor tersimpan. Masukkan namamu dan jadilah yang pertama di papan peringkat!";
    list.append(p);
  } else {
    scores.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "leader-row";
      const isSelf = currentNameClean && s.name.trim().toLowerCase() === currentNameClean;
      if (isSelf) {
        row.classList.add("highlight-self");
        if (playerRank === -1) {
          playerRank = i + 1;
          playerScore = s.score;
        }
      }

      const rank = document.createElement("span");
      rank.className = "rank-badge";
      if (i === 0) {
        rank.textContent = "🥇 1";
        rank.classList.add("gold");
      } else if (i === 1) {
        rank.textContent = "🥈 2";
        rank.classList.add("silver");
      } else if (i === 2) {
        rank.textContent = "🥉 3";
        rank.classList.add("bronze");
      } else {
        rank.textContent = String(i + 1).padStart(2, "0");
      }

      const details = document.createElement("div"),
        name = document.createElement("b"),
        date = document.createElement("small"),
        score = document.createElement("strong");

      name.textContent = s.name + (isSelf ? " (Kamu)" : "");
      date.textContent = new Date(s.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      score.textContent = s.score;

      details.append(name, date);
      row.append(rank, details, score);
      list.append(row);
    });
  }

  const myRankEl = $("leaderboard-my-rank");
  if (myRankEl) {
    if (playerRank > 0) {
      myRankEl.innerHTML = `📍 Peringkat Kamu: <b>#${playerRank}</b> · ${currentPlayerName || getLastPlayerName()} (<strong>${playerScore}</strong> poin)`;
      myRankEl.classList.remove("hidden");
    } else {
      myRankEl.classList.add("hidden");
    }
  }
}

async function leaderboard() {
  renderLeaderboardRows();
  show("leaderboard");
  const cloud = await syncScores();
  renderHomeTopScores();
  if (cloud) renderLeaderboardRows();
}

document.querySelectorAll("[data-action],[data-screen]").forEach((button) =>
  button.addEventListener("click", () => {
    audio.unlock();
    audio.play();
    const action = button.dataset.action;
    if (action === "start") {
      start();
    } else if (action === "leaderboard") {
      const nameInput = $("player-name-input");
      if (nameInput && nameInput.value.trim().length >= 2) {
        currentPlayerName = nameInput.value.trim();
        saveLastPlayerName(currentPlayerName);
        registerPlayer(currentPlayerName, getPlayerBest(currentPlayerName));
      }
      leaderboard();
    } else if (action === "exit") {
      if (game.state.score > 0) {
        saveScore(currentPlayerName || "Pemain Howell", game.state.score);
      }
      game.stop();
      $("pause-overlay").classList.add("hidden");
      show("home");
    } else {
      if (button.dataset.screen === "skins") {
        renderSkinsUI();
      }
      show(button.dataset.screen);
    }
  }),
);

$("btn-refresh-leaderboard")?.addEventListener("click", async () => {
  const btn = $("btn-refresh-leaderboard");
  if (btn) btn.textContent = "⏳ Memperbarui...";
  await syncScores(true);
  renderLeaderboardRows();
  if (btn) btn.textContent = "✓ Selesai";
  setTimeout(() => {
    if (btn) btn.textContent = "↻ Segarkan";
  }, 1200);
});

$("pause").onclick = pause;
$("resume").onclick = () => {
  $("pause-overlay").classList.add("hidden");
  audio.unlock();
  game.resume();
};

$("brand").onclick = (e) => {
  e.preventDefault();
  if (current === "play") pause();
  else show("home");
};

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("blur", pause);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && current === "play") {
    if (game.mode === "running") pause();
    else if (game.mode === "paused") $("resume").click();
  }
});

const nameInput = $("player-name-input");
if (nameInput) {
  const savedName = getLastPlayerName();
  if (savedName) {
    nameInput.value = savedName;
    currentPlayerName = savedName;
    $("home-best").textContent = getPlayerBest(savedName);
  }
  nameInput.addEventListener("input", () => {
    $("player-name-error")?.classList.add("hidden");
    const name = nameInput.value.trim();
    currentPlayerName = name;
    $("home-best").textContent = name ? getPlayerBest(name) : 0;
    if (name) {
      const prof = getPlayerProfile(name);
      game.setSkin(prof.selectedSkin);
    }
  });
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      start();
    }
  });
}

CONFIG.rewards.forEach((r, i) => {
  const row = document.createElement("div");
  row.className = "prize-row";
  const range = document.createElement("span"),
    name = document.createElement("b");
  range.textContent =
    i === CONFIG.rewards.length - 1
      ? `${r.min}+`
      : `${r.min}–${CONFIG.rewards[i + 1].min - 1}`;
  name.textContent = r.name;
  row.append(range, name);
  $("prize-list").append(row);
});

renderHomeTopScores();
renderSkinsUI();
show("home");

})().catch(error=>{const loading=document.getElementById('loading'); if(loading){loading.classList.remove('hidden');loading.innerHTML='<div class="center"><h2>Game belum dapat dimulai</h2><p>Coba buka file ini di Chrome atau Edge terbaru.</p><p id="load-error"></p></div>';document.getElementById('load-error').textContent=error.message;} console.error(error);});
