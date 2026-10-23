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
    openingWidth: 0.76,
  },
  itemSize: 64,
  difficulty: [
    {
      at: 0,
      speed: 150,
      interval: 0.72,
      bomb: 0.07,
      damaged: 0.03,
      bonus: 0.08,
      label: "PEMANASAN",
    },
    {
      at: 10,
      speed: 205,
      interval: 0.58,
      bomb: 0.1,
      damaged: 0.06,
      bonus: 0.12,
      label: "MAKIN SERU",
    },
    {
      at: 20,
      speed: 265,
      interval: 0.46,
      bomb: 0.14,
      damaged: 0.08,
      bonus: 0.12,
      label: "GAS TERUS!",
    },
  ],
  powerups: { double: 5, magnet: 4, slow: 3 },
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
];

function createState() {
  return {
    time: 0,
    score: 0,
    lives: CONFIG.lives,
    combo: 0,
    caught: 0,
    bestCombo: 0,
    effects: { double: 0, magnet: 0, slow: 0 },
  };
}
function difficulty(time) {
  return CONFIG.difficulty.filter((d) => time >= d.at).at(-1);
}
function tick(s, dt) {
  s.time = Math.min(CONFIG.duration, s.time + dt);
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
  else s.effects[id] = CONFIG.powerups[id];
  return {
    text:
      id === "points"
        ? `+${CONFIG.bonusPoints * (s.effects.double > 0 ? 2 : 1)}`
        : item.bonus.label.toUpperCase(),
    tone: id,
  };
}
function crossesOpening(item, previousY, opening) {
  return (
    previousY + item.size * 0.35 <= opening.y &&
    item.y + item.size * 0.35 >= opening.y &&
    Math.abs(item.x - opening.x) <= opening.width / 2
  );
}

const KEY = "howell-catch-win-v1";
let memory = { scores: [], muted: false },
  loaded = false,
  sessionBest = 0;
const validScore = (value) => Number.isSafeInteger(value) && value >= 0;
function read() {
  if (loaded) return memory;
  loaded = true;
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data && Array.isArray(data.scores))
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
  } catch {}
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
function saveScore(name, score) {
  read();
  if (!validScore(score)) return false;
  memory.scores.push({
    name: name.trim().slice(0, 20) || "Pemain Howell",
    score,
    date: new Date().toISOString(),
  });
  memory.scores.sort((a, b) => b.score - a.score);
  memory.scores = memory.scores.slice(0, 50);
  return write();
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
function renderHomeTopScores() {
  const list = $("home-top-scores-list");
  if (!list) return;
  const scores = read().scores.slice(0, 3);
  list.innerHTML = "";
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
function saveBest(score) {
  if (!validScore(score)) return;
  sessionBest = Math.max(bestScore(), score);
  try {
    localStorage.setItem("howell-best", String(sessionBest));
  } catch {}
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
      combo: [660, 880, 1100],
      bomb: [120, 65],
      damage: [220, 160],
      double: [800, 1200],
      magnet: [420, 700, 950],
      slow: [600, 400, 300],
      life: [550, 750, 1000],
      points: [900, 1100, 1400],
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
  constructor(canvas, assets, audio, onUpdate, onEnd) {
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
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(canvas);
    const move = (e) => {
      if (this.mode !== "running") return;
      const r = canvas.getBoundingClientRect();
      this.target = this.clamp(((e.clientX - r.left) / r.width) * this.w);
    };
    canvas.addEventListener("pointerdown", (e) => {
      if (
        this.mode !== "running" ||
        this.activePointer != null ||
        e.isPrimary === false ||
        e.button > 0
      )
        return;
      this.activePointer = e.pointerId;
      this.dragging = true;
      canvas.setPointerCapture(e.pointerId);
      move(e);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (this.dragging && e.pointerId === this.activePointer) move(e);
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
  clamp(x) {
    return Math.max(
      CONFIG.bag.width / 2 + 10,
      Math.min(CONFIG.width - CONFIG.bag.width / 2 - 10, x),
    );
  }
  opening() {
    return {
      x: this.x,
      y:
        this.h -
        CONFIG.bag.base -
        CONFIG.bag.height +
        CONFIG.bag.height * CONFIG.bag.openingY,
      width: CONFIG.bag.width * CONFIG.bag.openingWidth,
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
    let item = { kind: "product", product: pickProduct() };
    if (r < d.bomb) item = { kind: "bomb" };
    else if (r < d.bomb + d.damaged) item = { kind: "damaged" };
    else if (r < d.bomb + d.damaged + d.bonus)
      item = {
        kind: "bonus",
        bonus: BONUSES[Math.floor(Math.random() * BONUSES.length)],
      };
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
    const remaining = Math.max(0, CONFIG.duration - this.state.time);
    const delta = Math.min(elapsed, remaining),
      endTime = this.state.time + delta;
    // Consume real active time in small physics steps instead of dropping slow frames.
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
    if (this.state.lives === 0 || this.state.time >= CONFIG.duration) {
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
    if (this.keys.has("ArrowLeft") || this.keys.has("a"))
      this.target = this.clamp(this.target - dt * 480);
    if (this.keys.has("ArrowRight") || this.keys.has("d"))
      this.target = this.clamp(this.target + dt * 480);
    this.x += (this.target - this.x) * (1 - Math.exp(-25 * dt));
    this.spawnTime -= dt;
    if (this.spawnTime <= 0) {
      this.spawn();
      this.spawnTime = difficulty(this.state.time).interval;
    }
    const opening = this.opening();
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
      if (crossesOpening(item, previousY, opening)) {
        const result = collect(this.state, item);
        if (!result) continue;
        this.audio.play(result.tone);
        this.labels.push({
          text: result.text,
          x: this.x,
          y: opening.y - 25,
          life: 1,
          color: result.negative ? "#ff7988" : "#f6d343",
        });
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
        if (item.kind === "bonus" || item.kind === "bomb")
          for (let i = 0; i < 14; i++)
            this.particles.push({
              x: this.x,
              y: opening.y,
              vx: (Math.random() - 0.5) * 200,
              vy: -Math.random() * 180,
              life: 0.55,
              color: result.negative ? "#ff7281" : item.bonus.color,
            });
        if (this.state.lives === 0) break;
      }
    }
    this.items = this.items.filter((i) => !i.collected && i.y < this.h + 80);
    for (const i of this.entries) {
      i.life -= dt;
      i.x += (this.x - i.x) * Math.min(1, dt * 20);
      i.y += dt * 160;
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
        // Animate the entire original bitmap; never redraw or replace its PAJAK lettering.
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
      // Safe fallback only when the supplied image cannot load.

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
    c.fillStyle = "#0005";
    c.beginPath();
    c.ellipse(this.x, this.h - 18, 63, 9, 0, 0, Math.PI * 2);
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
    const bag = this.assets.images.get("bag");
    if (bag)
      fitImage(
        c,
        bag,
        this.x - CONFIG.bag.width / 2,
        this.h - CONFIG.bag.base - CONFIG.bag.height,
        CONFIG.bag.width,
        CONFIG.bag.height,
      );
    else {
      c.fillStyle = "#34506b";
      c.fillRect(this.x - 54, opening.y, 108, this.h - opening.y - 18);
      c.fillStyle = "white";
      c.textAlign = "center";
      c.font = "10px Arial";
      c.fillText("TOTEBAG SEMENTARA", this.x, opening.y + 35);
    }
    for (const p of this.particles) {
      c.globalAlpha = Math.max(0, p.life / 0.55);
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
  scoreAnimation = 0;
const audio = new Audio(read().muted);
function show(id) {
  cancelAnimationFrame(scoreAnimation);
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.toggle("hidden", s.id !== id));
  current = id;
  if (id === "home") {
    $("home-best").textContent = bestScore();
    renderHomeTopScores();
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
const game = new Game($("game"), assets, audio, update, end);
function start() {
  result = null;
  saved = false;
  const nameInput = $("player-name-input");
  if (nameInput) $("player-name-error")?.classList.add("hidden");
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
    left = Math.ceil(CONFIG.duration - s.time);
  $("score").textContent = s.score;
  $("timer").textContent = left;
  $("timer-wrap").classList.toggle("urgent", left <= 5);
  $("time-fill").style.width = `${(1 - s.time / CONFIG.duration) * 100}%`;
  $("lives").textContent =
    "♥".repeat(s.lives) + "♡".repeat(CONFIG.lives - s.lives);
  $("lives").setAttribute("aria-label", `${s.lives} nyawa`);
  $("stage").textContent = difficulty(s.time).label;
  $("announcement").textContent = g.messageTime > 0 ? g.message : "";
  const effects = Object.entries(s.effects)
    .filter(([, t]) => t > 0)
    .map(
      ([id, t]) =>
        `${BONUSES.find((b) => b.id === id).label} ${Math.ceil(t)} dtk`,
    );
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
      `FPS ${Math.round(g.fps || 0)} | Item ${g.items.length}\nStatus ${g.mode} | Interval ${difficulty(s.time).interval}s\nKecepatan ${difficulty(s.time).speed} | waktu ${s.time.toFixed(1)}`;
  }
}
function end(state) {
  result = { ...state };
  saved = false;
  const prior = bestScore(),
    record = state.score > prior;
  audio.play(record ? "record" : "end");
  show("results");
  $("result-kicker").textContent = record
    ? "REKOR BARU!"
    : state.lives === 0
      ? "NYAWA HABIS!"
      : "WAKTU HABIS!";
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
  // Save the best immediately, even if the player skips entering a nickname.
  saveBest(state.score);
  const nameInput = $("player-name-input");
  if (!saved) {
    saved = true;
    saveScore(nameInput?.value || "Pemain Howell", state.score);
  }
}
function leaderboard() {
  const scores = read().scores;
  const list = $("leaderboard-list");
  list.replaceChildren();
  if (!scores.length) {
    const p = document.createElement("p");
    p.className = "notice";
    p.textContent =
      "Belum ada skor tersimpan. Main, lalu simpan namamu setelah permainan!";
    list.append(p);
  }
  scores.slice(0, 20).forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "leader-row";
    const rank = document.createElement("span");
    rank.textContent = String(i + 1).padStart(2, "0");
    const details = document.createElement("div"),
      name = document.createElement("b"),
      date = document.createElement("small"),
      score = document.createElement("strong");
    name.textContent = s.name;
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
  show("leaderboard");
}
document.querySelectorAll("[data-action],[data-screen]").forEach((button) =>
  button.addEventListener("click", () => {
    audio.unlock();
    audio.play();
    const action = button.dataset.action;
    if (action === "start") start();
    else if (action === "leaderboard") leaderboard();
    else if (action === "exit") {
      game.stop();
      $("pause-overlay").classList.add("hidden");
      show("home");
    } else show(button.dataset.screen);
  }),
);
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
show("home");

})().catch(error=>{const loading=document.getElementById('loading'); if(loading){loading.classList.remove('hidden');loading.innerHTML='<div class="center"><h2>Game belum dapat dimulai</h2><p>Coba buka file ini di Chrome atau Edge terbaru.</p><p id="load-error"></p></div>';document.getElementById('load-error').textContent=error.message;} console.error(error);});
