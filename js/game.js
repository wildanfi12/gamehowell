/**
 * HOWELL CATCH & WIN - Core Game Engine
 * Manages game loop, state transitions, rendering pipeline, input events, and debug HUD.
 */

import { CONFIG } from './config.js';
import { Sound } from './audio.js';
import { Player } from './player.js';
import { ItemManager, ITEM_TYPES } from './items.js';
import { CollisionSystem } from './collision.js';
import { ScoreManager } from './scoring.js';
import { PowerupManager } from './powerups.js';
import { UIManager } from './ui.js';

export const GAME_STATES = {
  LOADING: 'loading',
  HOME: 'home',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover'
};

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    // State
    this.state = GAME_STATES.LOADING;
    this.timeRemaining = CONFIG.GAME.DURATION;
    this.lives = CONFIG.GAME.INITIAL_LIVES;
    this.lastFrameTime = 0;
    this.lastCountdownBeepSecond = -1;

    // Subsystems
    this.scoreManager = new ScoreManager();
    this.powerupManager = new PowerupManager();
    this.player = new Player(CONFIG.GAME.BASE_WIDTH, CONFIG.GAME.BASE_HEIGHT);
    this.itemManager = new ItemManager(CONFIG.GAME.BASE_WIDTH, CONFIG.GAME.BASE_HEIGHT);
    this.ui = new UIManager(this);

    // Screen shake
    this.shakeTime = 0;
    this.shakeIntensity = 0;

    // Debugging
    this.debug = CONFIG.ENV.ENABLE_DEBUG || new URLSearchParams(window.location.search).get('debug') === 'true' || new URLSearchParams(window.location.search).get('debug') === '1';
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = 0;

    // Coordinate scaling
    this.scaleRatio = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.countdownInterval = null;
    this.initCanvas();
    this.initInputs();
    this.initVisibility();
  }

  resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    const scaleX = (rect.width * dpr) / CONFIG.GAME.BASE_WIDTH;
    const scaleY = (rect.height * dpr) / CONFIG.GAME.BASE_HEIGHT;
    this.scaleRatio = Math.min(scaleX, scaleY);

    this.offsetX = (this.canvas.width - CONFIG.GAME.BASE_WIDTH * this.scaleRatio) / 2;
    this.offsetY = (this.canvas.height - CONFIG.GAME.BASE_HEIGHT * this.scaleRatio) / 2;
  }

  initCanvas() {
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });
    this.resizeCanvas();
  }

  initInputs() {
    let isDragging = false;

    const handlePointerMove = (clientX) => {
      if (this.state !== GAME_STATES.PLAYING && this.state !== GAME_STATES.COUNTDOWN) return;

      const rect = this.canvas.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvasPx = relativeX * dpr;

      if (this.scaleRatio > 0) {
        const virtualX = (canvasPx - this.offsetX) / this.scaleRatio;
        this.player.moveTo(virtualX);
      }
    };

    const getClientX = (e) => {
      if (e.clientX !== undefined) return e.clientX;
      if (e.touches && e.touches[0]) return e.touches[0].clientX;
      if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientX;
      return this.canvas.getBoundingClientRect().left + this.canvas.clientWidth / 2;
    };

    const onPointerDown = (e) => {
      isDragging = true;
      Sound.ensureContext();
      handlePointerMove(getClientX(e));
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      handlePointerMove(getClientX(e));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const frame = document.getElementById('game-frame');
    frame.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });

    // Touch events explicitly
    frame.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    // Desktop Keyboard controls (Left/Right arrow keys and A/D keys)
    window.addEventListener('keydown', (e) => {
      if (this.state !== GAME_STATES.PLAYING) return;
      const step = 45;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.player.moveTo(this.player.x + this.player.width / 2 - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.player.moveTo(this.player.x + this.player.width / 2 + step);
      }
    });
  }

  initVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === GAME_STATES.PLAYING) {
        this.pause();
      }
    });
  }

  startCountdownAndPlay() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.scoreManager.reset();
    this.powerupManager.reset();
    this.itemManager.reset();
    this.timeRemaining = CONFIG.GAME.DURATION;
    this.lives = CONFIG.GAME.INITIAL_LIVES;
    this.lastCountdownBeepSecond = -1;

    // Refresh player totebag image from asset cache
    this.player.image = Assets.getImage('howell-totebag');

    // Reset player position to center
    this.player.x = (CONFIG.GAME.BASE_WIDTH - this.player.width) / 2;
    this.player.targetX = this.player.x;

    this.ui.showScreen('gameplay');
    this.resizeCanvas();
    this.ui.updateHUD(this.scoreManager.score, this.timeRemaining, this.lives, []);

    // 3.. 2.. 1.. GO overlay
    const overlay = document.getElementById('countdown-overlay');
    const numberEl = document.getElementById('countdown-number');
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    overlay.style.pointerEvents = 'none';

    this.state = GAME_STATES.COUNTDOWN;
    let count = 3;
    numberEl.textContent = count;
    numberEl.className = 'countdown-num pulse';
    Sound.playClick();

    this.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        numberEl.textContent = count;
        numberEl.className = 'countdown-num pulse';
        Sound.playClick();
      } else if (count === 0) {
        numberEl.textContent = 'MULAI!';
        numberEl.className = 'countdown-num go pulse';
        Sound.playBonus();

        // Start the game loop immediately!
        this.state = GAME_STATES.PLAYING;
        this.lastFrameTime = performance.now();

        // Ensure canvas scale is correct
        this.resizeCanvas();

        // Smoothly dismiss the countdown overlay
        setTimeout(() => {
          overlay.classList.add('hidden');
          overlay.style.display = 'none';
        }, 500);

        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }, 700);
  }

  pause() {
    if (this.state !== GAME_STATES.PLAYING) return;
    this.state = GAME_STATES.PAUSED;
    this.ui.showScreen('pause');
  }

  resume() {
    if (this.state !== GAME_STATES.PAUSED) return;
    this.state = GAME_STATES.PLAYING;
    this.lastFrameTime = performance.now();
    this.ui.showScreen('gameplay');
  }

  quitToHome() {
    this.state = GAME_STATES.HOME;
    this.ui.showScreen('home');
  }

  gameOver() {
    this.state = GAME_STATES.GAMEOVER;
    const finalScore = this.scoreManager.score;
    const isNewHigh = finalScore > Storage.getHighScore();

    if (isNewHigh) {
      Storage.setHighScore(finalScore);
      Sound.playHighScore();
    } else {
      Sound.playGameOver();
    }

    this.ui.showResults(finalScore, isNewHigh);
  }

  update(dt) {
    if (this.state !== GAME_STATES.PLAYING) return;

    // Safety check: ensure canvas scale is valid
    if (this.scaleRatio <= 0 || this.canvas.width === 0) {
      this.resizeCanvas();
    }

    // 1. Timer countdown
    this.timeRemaining -= dt;
    const remainingSeconds = Math.ceil(this.timeRemaining);

    // Audio warning on last 5 seconds (beep once per second)
    if (remainingSeconds <= 5 && remainingSeconds > 0 && remainingSeconds !== this.lastCountdownBeepSecond) {
      this.lastCountdownBeepSecond = remainingSeconds;
      Sound.playCountdownTick();
    }

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.gameOver();
      return;
    }

    // 2. Power-ups duration updates
    this.powerupManager.update(dt);
    const slowFactor = this.powerupManager.getSlowFactor();
    const magnetState = this.powerupManager.getMagnetState();

    // 3. Player update
    this.player.update(dt);

    // 4. Items update
    const bagZone = this.player.getCatchZone();
    const gameElapsed = CONFIG.GAME.DURATION - this.timeRemaining;
    this.itemManager.update(dt, gameElapsed, slowFactor, magnetState, bagZone);

    // 5. Collision checks
    this.checkCollisions(bagZone);

    // 6. Score & particle system update
    this.scoreManager.update(dt);

    // 7. Screen shake decay
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) {
        this.shakeIntensity = 0;
      }
    }

    // 8. Update HUD
    this.ui.updateHUD(
      this.scoreManager.score,
      this.timeRemaining,
      this.lives,
      this.powerupManager.getActiveList()
    );
  }

  checkCollisions(bagZone) {
    for (const item of this.itemManager.items) {
      if (item.caught || item.isDead) continue;

      if (CollisionSystem.checkCatch(item, bagZone)) {
        item.caught = true;
        item.isDead = true;

        const hitX = item.x + item.width / 2;
        const hitY = bagZone.openingY;

        // Handle collision based on item category
        if (item.type === ITEM_TYPES.PRODUCT) {
          // Positive Howell product!
          const mult = this.powerupManager.getScoreMultiplier();
          this.scoreManager.addScore(item.points, mult, hitX, hitY);
          this.player.onCatch(item);
          Sound.playCatch();
        } else if (item.type === ITEM_TYPES.BOMB) {
          // Bomb hazard
          this.lives -= item.penaltyLife;
          this.scoreManager.breakCombo(hitX, hitY);
          this.shake(CONFIG.HAZARDS.BOMB.shakeDuration / 1000, CONFIG.HAZARDS.BOMB.shakeIntensity);
          this.ui.triggerDamageFlash();
          Sound.playBomb();

          if (this.lives <= 0) {
            this.lives = 0;
            this.gameOver();
            return;
          }
        } else if (item.type === ITEM_TYPES.DAMAGED) {
          // Damaged product hazard
          this.scoreManager.deductScore(item.penaltyScore, hitX, hitY);
          Sound.playDamaged();
        } else if (item.type === ITEM_TYPES.POWERUP) {
          // Power-up collected!
          const activated = this.powerupManager.activate(item.powerupType);
          if (activated) {
            if (activated.type === 'heart') {
              this.lives = Math.min(CONFIG.GAME.MAX_LIVES, this.lives + activated.lifeAdd);
            } else if (activated.type === 'bonus30') {
              this.scoreManager.addScore(activated.bonusScore, 1, hitX, hitY, true);
            }
          }
          this.scoreManager.addFloatingLabel(item.name, hitX, hitY, '#ffd700', 18, true);
          this.player.onCatch(item);
          Sound.playBonus();
        }
      }
    }
  }

  shake(duration, intensity) {
    this.shakeTime = duration;
    this.shakeIntensity = intensity;
  }

  render() {
    const ctx = this.ctx;

    // Reset full canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b111e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply scale & offset to target virtual 450 x 800 space
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * this.scaleRatio;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * this.scaleRatio;
    }

    ctx.setTransform(
      this.scaleRatio, 0, 0, this.scaleRatio,
      this.offsetX + shakeX,
      this.offsetY + shakeY
    );

    // Draw tech background inside virtual canvas
    this.drawBackground(ctx);

    // Render items
    this.itemManager.render(ctx);

    // Render player (Howell Totebag)
    this.player.render(ctx);

    // Render floating labels & catch particles
    this.scoreManager.render(ctx);

    // Render debug overlays if enabled
    if (this.debug) {
      this.renderDebug(ctx);
    }
  }

  drawBackground(ctx) {
    // Futuristic tech grid & ambient glow
    const w = CONFIG.GAME.BASE_WIDTH;
    const h = CONFIG.GAME.BASE_HEIGHT;

    // Subtle dark gradient with high contrast for black products
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#15243f');
    grad.addColorStop(0.35, '#0e182b');
    grad.addColorStop(0.75, '#090e1a');
    grad.addColorStop(1, '#05070d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle electronic grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 45;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Bottom soft blue runway glow behind totebag
    const bottomGlow = ctx.createRadialGradient(w / 2, h - 40, 20, w / 2, h - 40, w * 0.6);
    bottomGlow.addColorStop(0, 'rgba(0, 102, 255, 0.16)');
    bottomGlow.addColorStop(1, 'rgba(0, 102, 255, 0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, h - 160, w, 160);

    ctx.restore();
  }

  renderDebug(ctx) {
    // Hitboxes
    this.itemManager.renderDebug(ctx);
    this.player.renderDebug(ctx);

    // HUD Text
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(10, 10, 190, 110);
    ctx.strokeStyle = '#00ff88';
    ctx.strokeRect(10, 10, 190, 110);

    ctx.fillStyle = '#00ff88';
    ctx.font = '11px monospace';
    const gameElapsed = CONFIG.GAME.DURATION - this.timeRemaining;
    const phase = this.itemManager.getCurrentDifficulty(gameElapsed);

    ctx.fillText(`FPS: ${this.fps}`, 16, 26);
    ctx.fillText(`State: ${this.state}`, 16, 42);
    ctx.fillText(`Active Items: ${this.itemManager.items.length}`, 16, 58);
    ctx.fillText(`Diff: ${phase.name} (${phase.baseFallSpeed} px/s)`, 16, 74);
    ctx.fillText(`Spawn: ${phase.spawnInterval}s`, 16, 90);
    ctx.fillText(`Scale: ${this.scaleRatio.toFixed(2)}x`, 16, 106);
    ctx.restore();
  }

  start() {
    this.lastFrameTime = performance.now();
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1); // clamp to max 100ms
      this.lastFrameTime = timestamp;

      // Calculate FPS
      this.frameCount++;
      this.fpsTimer += dt;
      if (this.fpsTimer >= 0.5) {
        this.fps = Math.round((this.frameCount / this.fpsTimer));
        this.frameCount = 0;
        this.fpsTimer = 0;
      }

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}
