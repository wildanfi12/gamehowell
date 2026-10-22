/**
 * HOWELL CATCH & WIN - Scoring & Combo Module
 * Handles scores, multipliers, combos, floating labels, and particle bursts.
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.highScore = Storage.getHighScore();
    this.combo = 0;
    this.maxCombo = 0;
    this.catchesCount = 0;
    this.floatingLabels = [];
    this.particles = [];
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.catchesCount = 0;
    this.floatingLabels = [];
    this.particles = [];
    this.highScore = Storage.getHighScore();
  }

  /**
   * Adds positive score with multiplier and updates combo streak.
   */
  addScore(points, multiplier = 1, x = 0, y = 0, isBonus = false) {
    const finalPoints = points * multiplier;
    this.score += finalPoints;
    this.catchesCount++;

    if (!isBonus) {
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
    }

    // Check for combo milestones
    let comboMsg = null;
    let comboColor = '#00ffcc';
    if (!isBonus) {
      const milestone = CONFIG.COMBOS.slice().reverse().find(c => this.combo === c.streak);
      if (milestone) {
        comboMsg = milestone.message;
        comboColor = milestone.color;
        this.score += milestone.bonus;
      }
    }

    // Floating score label
    const text = multiplier > 1 ? `+${finalPoints} (2X)` : `+${finalPoints}`;
    this.addFloatingLabel(text, x, y, multiplier > 1 ? '#ffcc00' : '#00f2fe');

    if (comboMsg) {
      this.addFloatingLabel(comboMsg, x, y - 25, comboColor, 26, true);
      this.spawnParticleBurst(x, y, 20, comboColor);
    } else {
      this.spawnParticleBurst(x, y, 10, '#00e5ff');
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      Storage.setHighScore(this.highScore);
    }

    return {
      score: this.score,
      combo: this.combo,
      comboMilestone: comboMsg
    };
  }

  /**
   * Subtracts score for damaged product and resets combo.
   */
  deductScore(penalty, x = 0, y = 0) {
    this.score = Math.max(0, this.score - penalty);
    this.combo = 0;

    this.addFloatingLabel(`-${penalty}`, x, y, '#ff3b30', 22);
    this.spawnParticleBurst(x, y, 15, '#ff3b30');

    return {
      score: this.score,
      combo: 0
    };
  }

  /**
   * Resets combo streak on bomb explosion without points deduction (life is lost instead).
   */
  breakCombo(x = 0, y = 0) {
    this.combo = 0;
    this.addFloatingLabel('BOOM!', x, y, '#ff0055', 28, true);
    this.spawnParticleBurst(x, y, 35, '#ff4757');
  }

  addFloatingLabel(text, x, y, color = '#ffffff', fontSize = 20, isBold = false) {
    this.floatingLabels.push({
      text,
      x: x + (Math.random() - 0.5) * 16,
      y,
      color,
      fontSize,
      isBold,
      alpha: 1.0,
      scale: 0.6,
      vy: -60, // float upwards px/sec
      life: 0.85 // duration in seconds
    });
  }

  spawnParticleBurst(x, y, count = 12, color = '#00ffff') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        decay: 1.8 + Math.random() * 1.5
      });
    }
  }

  update(dt) {
    // Update floating score labels
    for (let i = this.floatingLabels.length - 1; i >= 0; i--) {
      const label = this.floatingLabels[i];
      label.y += label.vy * dt;
      label.scale = Math.min(1.2, label.scale + dt * 4);
      label.life -= dt;
      label.alpha = Math.max(0, label.life / 0.85);

      if (label.life <= 0) {
        this.floatingLabels.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt; // gravity
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // Render particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render floating labels
    for (const label of this.floatingLabels) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, label.alpha);
      ctx.translate(label.x, label.y);
      ctx.scale(label.scale, label.scale);

      ctx.font = `${label.isBold ? '900' : '700'} ${label.fontSize}px 'Montserrat', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeText(label.text, 0, 0);

      // Fill
      ctx.fillStyle = label.color;
      ctx.fillText(label.text, 0, 0);
      ctx.restore();
    }
  }
}
