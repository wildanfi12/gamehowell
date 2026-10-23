import { CONFIG, BONUSES } from "./config.js";
import {
  createState,
  difficulty,
  tick,
  pickProduct,
  collect,
  crossesOpening,
} from "./rules.js";
import { fitImage } from "./assets.js";

export class Game {
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
    this.bagScale = 1.0;
    this.currentBagWidth = CONFIG.bag.width;
    this.totebagBonusSpawned = false;
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

  clamp(x) {
    const half = (this.currentBagWidth || CONFIG.bag.width) / 2;
    return Math.max(
      half + 10,
      Math.min(CONFIG.width - half - 10, x),
    );
  }

  opening() {
    const scale = this.bagScale || 1.0;
    const currentH = CONFIG.bag.height * (1 + (scale - 1) * 0.2);
    const width = (this.currentBagWidth || CONFIG.bag.width) * CONFIG.bag.openingWidth;
    return {
      x: this.x,
      y:
        this.h -
        CONFIG.bag.base -
        currentH +
        currentH * CONFIG.bag.openingY,
      width,
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

        const isTotebag = item.bonus?.id === "totebag";
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
    const currentW = this.currentBagWidth || CONFIG.bag.width;
    const currentH = CONFIG.bag.height * (1 + ((this.bagScale || 1.0) - 1) * 0.2);
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

    const bag = this.assets.images.get("bag");

    // Totebag expansion visual aura & highlighted opening
    if (this.bagScale > 1.0) {
      c.save();
      c.shadowColor = "#38bdf8";
      c.shadowBlur = this.reduced ? 0 : 20;

      // Glowing expansion energy aura surrounding the enlarged bag
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 3;
      c.fillStyle = "#0284c718";
      c.beginPath();
      c.roundRect(this.x - currentW / 2 - 3, baseY - 3, currentW + 6, currentH + 6, 14);
      c.fill();
      c.stroke();

      // Glowing top opening rim matching opening.width exactly
      c.fillStyle = "#38bdf8";
      c.beginPath();
      c.roundRect(opening.x - opening.width / 2, opening.y - 2, opening.width, 5, 2.5);
      c.fill();

      c.restore();
    }

    // Authentic Howell Totebag rendered visibly at expanded size (150% width when active)
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
