/**
 * HOWELL CATCH & WIN - Items Module
 * Manages spawning, physics, magnetic attraction, and rendering of all falling objects.
 */

import { CONFIG } from './config.js';
import { Assets } from './assetManager.js';

export const ITEM_TYPES = {
  PRODUCT: 'product',
  BOMB: 'bomb',
  DAMAGED: 'damaged',
  POWERUP: 'powerup'
};

export class Item {
  constructor(options) {
    this.id = options.id;
    this.type = options.type;
    this.name = options.name;
    this.image = options.image;
    this.points = options.points || 0;
    this.penaltyLife = options.penaltyLife || 0;
    this.penaltyScore = options.penaltyScore || 0;
    this.powerupType = options.powerupType || null;

    // Position & dimensions
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;

    // Physics
    this.vy = options.vy;
    this.vx = 0;
    this.rotation = (Math.random() - 0.5) * 0.15; // subtle tilt in radians
    this.rotationSpeed = (Math.random() - 0.5) * 0.4; // gentle wobble
    this.maxWobble = 0.22; // max ~12 degrees

    // Lifecycle
    this.caught = false;
    this.isDead = false;

    // Magnet attraction flag
    this.isAttracted = false;

    // Animation timer
    this.lifeTime = Math.random() * 5;
  }

  update(dt, slowFactor = 1.0, magnetState = null, bagOpening = null) {
    if (this.caught) return;
    this.lifeTime += dt;

    // 1. Slow-motion modifier
    const effectiveVy = this.vy * slowFactor;

    // 2. Magnet attraction (ONLY applies to positive HOWELL products, never hazards)
    if (magnetState && magnetState.active && this.type === ITEM_TYPES.PRODUCT && bagOpening) {
      const dx = bagOpening.centerX - (this.x + this.width / 2);
      const dy = bagOpening.openingY - (this.y + this.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < magnetState.attractRadius && dy > -50) {
        this.isAttracted = true;
        const normX = dx / dist;
        const normY = dy / dist;
        const speed = magnetState.attractSpeed * (1 + (1 - dist / magnetState.attractRadius));
        this.vx += (normX * speed - this.vx) * 0.15;
        this.y += (normY * speed * 0.7) * dt;
      } else {
        this.isAttracted = false;
      }
    } else {
      this.isAttracted = false;
    }

    // Normal downward fall
    this.y += effectiveVy * dt;
    this.x += this.vx * dt;

    if (!this.isAttracted) {
      this.vx *= 0.92;
    }

    // Keep within horizontal bounds
    if (this.x < 5) { this.x = 5; this.vx = 0; }
    if (this.x > 450 - this.width - 5) { this.x = 450 - this.width - 5; this.vx = 0; }

    // Gentle rotation wobble
    this.rotation += this.rotationSpeed * dt;
    if (Math.abs(this.rotation) > this.maxWobble) {
      this.rotationSpeed = -this.rotationSpeed;
    }
  }

  render(ctx) {
    if (this.caught) return;

    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);

    // Magnetic trail/glow if being pulled
    if (this.isAttracted) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 210, 211, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, this.width * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Power-up pulsing glow aura
    if (this.type === ITEM_TYPES.POWERUP) {
      ctx.save();
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.12;
      ctx.fillStyle = 'rgba(255, 235, 59, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, (this.width / 2) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Hazard subtle warning ring
    if (this.type === ITEM_TYPES.BOMB || this.type === ITEM_TYPES.DAMAGED) {
      ctx.save();
      const pulse = 1 + Math.sin(this.lifeTime * 8) * 0.1;
      ctx.fillStyle = this.type === ITEM_TYPES.BOMB ? 'rgba(255, 60, 0, 0.22)' : 'rgba(255, 59, 48, 0.15)';
      ctx.beginPath();
      ctx.arc(0, 0, (this.width / 2) * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Dynamic cartoon ticking pulse for PAJAK Bomb
    if (this.type === ITEM_TYPES.BOMB) {
      const breath = 1 + Math.sin(this.lifeTime * 9) * 0.04;
      ctx.scale(breath, breath);
    }

    // Draw item image
    if (this.image) {
      ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
    }

    // Live animated burning fuse flame and sparks for PAJAK bomb
    if (this.type === ITEM_TYPES.BOMB) {
      const sparkX = this.width * 0.311;
      const sparkY = -this.height * 0.319;
      const sparkR = this.width * 0.14;
      const sparkPulse = 1 + Math.sin(this.lifeTime * 22) * 0.25;

      // 1. Radial glow halo
      const glowGrad = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, sparkR * 1.8 * sparkPulse);
      glowGrad.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
      glowGrad.addColorStop(0.3, 'rgba(255, 170, 0, 0.7)');
      glowGrad.addColorStop(0.7, 'rgba(255, 50, 0, 0.3)');
      glowGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkR * 1.8 * sparkPulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Rotating starburst flame
      ctx.save();
      ctx.translate(sparkX, sparkY);
      ctx.rotate(this.lifeTime * 8);
      ctx.fillStyle = '#fff9d2';
      ctx.strokeStyle = '#ff7700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const points = 8;
      const rOuter = sparkR * 1.1 * sparkPulse;
      const rInner = sparkR * 0.45;
      for (let p = 0; p < points * 2; p++) {
        const radius = p % 2 === 0 ? rOuter : rInner;
        const angle = (p * Math.PI) / points;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 3. Floating spark embers drifting off fuse
      for (let e = 0; e < 3; e++) {
        const emberTime = (this.lifeTime * 2.2 + e * 0.33) % 1;
        const emberX = sparkX + Math.sin(this.lifeTime * 10 + e) * (this.width * 0.12) * emberTime;
        const emberY = sparkY - emberTime * (this.height * 0.25);
        const emberAlpha = Math.max(0, 1 - emberTime);
        ctx.fillStyle = `rgba(255, ${Math.floor(210 - emberTime * 160)}, 0, ${emberAlpha})`;
        ctx.beginPath();
        ctx.arc(emberX, emberY, 2.5 * (1 - emberTime * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  getHitbox() {
    // Precise circular / AABB hitbox for collision
    const insetX = this.width * 0.12;
    const insetY = this.height * 0.12;
    return {
      x: this.x + insetX,
      y: this.y + insetY,
      width: this.width - insetX * 2,
      height: this.height - insetY * 2,
      bottomY: this.y + this.height - insetY,
      centerX: this.x + this.width / 2
    };
  }

  renderDebug(ctx) {
    const box = this.getHitbox();
    ctx.save();
    ctx.strokeStyle = this.type === ITEM_TYPES.BOMB ? '#ff0055' : 
                      this.type === ITEM_TYPES.DAMAGED ? '#ff8800' :
                      this.type === ITEM_TYPES.POWERUP ? '#ffff00' : '#00ffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = '9px monospace';
    ctx.fillText(`${this.name} (${this.points > 0 ? '+' + this.points : this.points})`, box.x, box.y - 2);
    ctx.restore();
  }
}

export class ItemManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.items = [];
    this.spawnTimer = 0;
    this.lastSpawnX = -100;
  }

  resize(newWidth, newHeight) {
    this.canvasWidth = newWidth;
    this.canvasHeight = newHeight;
  }

  reset() {
    this.items = [];
    this.spawnTimer = 0;
  }

  update(dt, gameTime, slowFactor, magnetState, bagOpening) {
    // 1. Determine current difficulty based on elapsed gameTime (0-30s)
    const currentPhase = this.getCurrentDifficulty(gameTime);

    // 2. Handle item spawning
    this.spawnTimer += dt;
    if (this.spawnTimer >= currentPhase.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnItem(currentPhase);
    }

    // 3. Update existing items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update(dt, slowFactor, magnetState, bagOpening);

      // Clean up items that have fallen past bottom edge (no memory leak)
      if (item.y > this.canvasHeight + 40 || item.isDead) {
        this.items.splice(i, 1);
      }
    }
  }

  getCurrentDifficulty(gameTime) {
    const elapsed = Math.min(29.9, Math.max(0, gameTime));
    for (const phase of CONFIG.DIFFICULTY) {
      if (elapsed >= phase.timeRange[0] && elapsed < phase.timeRange[1]) {
        return phase;
      }
    }
    return CONFIG.DIFFICULTY[CONFIG.DIFFICULTY.length - 1];
  }

  spawnItem(phase) {
    const rand = Math.random();
    let chosenType = ITEM_TYPES.PRODUCT;
    let categoryData = null;

    if (rand < phase.chances.product) {
      chosenType = ITEM_TYPES.PRODUCT;
      categoryData = this.pickRandomProduct();
    } else if (rand < phase.chances.product + phase.chances.bomb) {
      chosenType = ITEM_TYPES.BOMB;
      categoryData = CONFIG.HAZARDS.BOMB;
    } else if (rand < phase.chances.product + phase.chances.bomb + phase.chances.damaged) {
      chosenType = ITEM_TYPES.DAMAGED;
      categoryData = CONFIG.HAZARDS.DAMAGED;
    } else {
      chosenType = ITEM_TYPES.POWERUP;
      categoryData = this.pickRandomPowerup();
    }

    // Determine scale and dimensions
    const scaleRatio = categoryData.scale || 0.17;
    const itemWidth = this.canvasWidth * scaleRatio;
    const itemHeight = itemWidth; // square bounding box preserving aspect inside

    // Randomize horizontal spawn position, avoiding exact same spot as previous item
    const margin = 20;
    const minX = margin;
    const maxX = this.canvasWidth - itemWidth - margin;
    let spawnX = minX + Math.random() * (maxX - minX);

    if (Math.abs(spawnX - this.lastSpawnX) < itemWidth * 0.8) {
      spawnX = (spawnX + this.canvasWidth * 0.4) % (maxX - minX) + minX;
    }
    this.lastSpawnX = spawnX;

    // Fall speed with random variance
    const speed = phase.baseFallSpeed + (Math.random() - 0.5) * phase.speedVariation;

    const newItem = new Item({
      id: categoryData.id,
      type: chosenType,
      name: categoryData.name,
      image: Assets.getImage(categoryData.id),
      points: categoryData.points || 0,
      penaltyLife: categoryData.penaltyLife || 0,
      penaltyScore: categoryData.penaltyScore || 0,
      powerupType: chosenType === ITEM_TYPES.POWERUP ? categoryData.id : null,
      x: spawnX,
      y: -itemHeight - 10,
      width: itemWidth,
      height: itemHeight,
      vy: speed
    });

    this.items.push(newItem);
  }

  pickRandomProduct() {
    // Weighted selection
    const totalWeight = CONFIG.PRODUCT_ASSETS.reduce((sum, p) => sum + p.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const prod of CONFIG.PRODUCT_ASSETS) {
      if (rand < prod.weight) {
        return prod;
      }
      rand -= prod.weight;
    }
    return CONFIG.PRODUCT_ASSETS[0];
  }

  pickRandomPowerup() {
    const list = Object.values(CONFIG.POWERUPS);
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  render(ctx) {
    for (const item of this.items) {
      item.render(ctx);
    }
  }

  renderDebug(ctx) {
    for (const item of this.items) {
      item.renderDebug(ctx);
    }
  }
}
