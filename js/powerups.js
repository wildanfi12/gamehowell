/**
 * HOWELL CATCH & WIN - Power-ups Manager
 * Handles active duration timers, state multipliers, and visual power-up HUD callbacks.
 */

import { CONFIG } from './config.js';

export class PowerupManager {
  constructor() {
    this.activePowerups = {
      double: { active: false, timer: 0, maxDuration: CONFIG.POWERUPS.DOUBLE.duration },
      magnet: { active: false, timer: 0, maxDuration: CONFIG.POWERUPS.MAGNET.duration },
      slow: { active: false, timer: 0, maxDuration: CONFIG.POWERUPS.SLOW.duration }
    };
  }

  reset() {
    for (const key in this.activePowerups) {
      this.activePowerups[key].active = false;
      this.activePowerups[key].timer = 0;
    }
  }

  /**
   * Activates a power-up by its ID.
   * Instant power-ups (heart, bonus30) return immediate action data.
   */
  activate(typeId) {
    if (typeId === 'double') {
      this.activePowerups.double.active = true;
      this.activePowerups.double.timer = CONFIG.POWERUPS.DOUBLE.duration;
      return { type: 'double', instant: false, name: 'Double Score 2X!' };
    }

    if (typeId === 'magnet') {
      this.activePowerups.magnet.active = true;
      this.activePowerups.magnet.timer = CONFIG.POWERUPS.MAGNET.duration;
      return { type: 'magnet', instant: false, name: 'Magnet Aktif!' };
    }

    if (typeId === 'slow') {
      this.activePowerups.slow.active = true;
      this.activePowerups.slow.timer = CONFIG.POWERUPS.SLOW.duration;
      return { type: 'slow', instant: false, name: 'Slow Motion!' };
    }

    if (typeId === 'heart') {
      return { type: 'heart', instant: true, lifeAdd: 1, name: '+1 Nyawa Tambahan!' };
    }

    if (typeId === 'bonus30') {
      return { type: 'bonus30', instant: true, bonusScore: CONFIG.POWERUPS.BONUS30.bonusScore, name: '+30 Bonus Poin!' };
    }

    return null;
  }

  update(dt) {
    for (const key in this.activePowerups) {
      const pw = this.activePowerups[key];
      if (pw.active) {
        pw.timer -= dt;
        if (pw.timer <= 0) {
          pw.active = false;
          pw.timer = 0;
        }
      }
    }
  }

  getScoreMultiplier() {
    return this.activePowerups.double.active ? CONFIG.POWERUPS.DOUBLE.multiplier : 1;
  }

  getSlowFactor() {
    return this.activePowerups.slow.active ? CONFIG.POWERUPS.SLOW.speedFactor : 1.0;
  }

  getMagnetState() {
    return {
      active: this.activePowerups.magnet.active,
      attractRadius: CONFIG.POWERUPS.MAGNET.attractRadius,
      attractSpeed: CONFIG.POWERUPS.MAGNET.attractSpeed
    };
  }

  getActiveList() {
    const list = [];
    if (this.activePowerups.double.active) {
      list.push({
        id: 'double',
        name: '2X Score',
        icon: CONFIG.POWERUPS.DOUBLE.image,
        remaining: Math.ceil(this.activePowerups.double.timer),
        percent: (this.activePowerups.double.timer / this.activePowerups.double.maxDuration) * 100
      });
    }
    if (this.activePowerups.magnet.active) {
      list.push({
        id: 'magnet',
        name: 'Magnet',
        icon: CONFIG.POWERUPS.MAGNET.image,
        remaining: Math.ceil(this.activePowerups.magnet.timer),
        percent: (this.activePowerups.magnet.timer / this.activePowerups.magnet.maxDuration) * 100
      });
    }
    if (this.activePowerups.slow.active) {
      list.push({
        id: 'slow',
        name: 'Slow-Mo',
        icon: CONFIG.POWERUPS.SLOW.image,
        remaining: Math.ceil(this.activePowerups.slow.timer),
        percent: (this.activePowerups.slow.timer / this.activePowerups.slow.maxDuration) * 100
      });
    }
    return list;
  }
}
