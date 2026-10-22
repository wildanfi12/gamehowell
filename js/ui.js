/**
 * HOWELL CATCH & WIN - UI Module
 * Manages screen transitions, HUD displays, modals, and user input bindings.
 */

import { CONFIG } from './config.js';
import { Sound } from './audio.js';
import { Storage } from './storage.js';
import { RewardManager } from './rewards.js';
import { LeaderboardManager } from './leaderboard.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // Screen elements
    this.screens = {
      loading: document.getElementById('screen-loading'),
      home: document.getElementById('screen-home'),
      tutorial: document.getElementById('screen-tutorial'),
      gameplay: document.getElementById('screen-gameplay'),
      pause: document.getElementById('screen-pause'),
      results: document.getElementById('screen-results'),
      leaderboard: document.getElementById('screen-leaderboard'),
      rewardsModal: document.getElementById('modal-rewards')
    };

    // HUD Elements
    this.hud = {
      scoreText: document.getElementById('hud-score-val'),
      timerText: document.getElementById('hud-timer-val'),
      timerBox: document.getElementById('hud-timer-box'),
      livesContainer: document.getElementById('hud-lives-container'),
      powerupsContainer: document.getElementById('hud-powerups-container'),
      btnPause: document.getElementById('btn-hud-pause'),
      btnSound: document.getElementById('btn-hud-sound'),
      damageFlash: document.getElementById('damage-flash')
    };

    // Results screen elements
    this.results = {
      finalScore: document.getElementById('res-final-score'),
      bestScore: document.getElementById('res-best-score'),
      newRecordBadge: document.getElementById('res-new-record'),
      rewardBadge: document.getElementById('res-reward-badge'),
      rewardName: document.getElementById('res-reward-name'),
      rewardDesc: document.getElementById('res-reward-desc'),
      rewardCode: document.getElementById('res-reward-code'),
      inputName: document.getElementById('res-input-name'),
      btnSaveName: document.getElementById('res-btn-save')
    };

    // Leaderboard elements
    this.leaderboard = {
      list: document.getElementById('leaderboard-list'),
      btnClose: document.getElementById('btn-leaderboard-close')
    };

    // Loading bar elements
    this.loading = {
      bar: document.getElementById('loading-progress-bar'),
      text: document.getElementById('loading-progress-text')
    };

    this.bindEvents();
    this.updateSoundButtons();
  }

  bindEvents() {
    // Sound toggles across screens
    const soundButtons = document.querySelectorAll('.sound-toggle-btn');
    soundButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.ensureContext();
        const isMuted = Sound.toggleMute();
        this.updateSoundButtons(isMuted);
        Sound.playClick();
      });
    });

    // Home Screen buttons
    document.getElementById('btn-home-play')?.addEventListener('click', () => {
      Sound.playClick();
      this.game.startCountdownAndPlay();
    });

    document.getElementById('btn-home-tutorial')?.addEventListener('click', () => {
      Sound.playClick();
      this.showScreen('tutorial');
    });

    document.getElementById('btn-home-leaderboard')?.addEventListener('click', () => {
      Sound.playClick();
      this.renderLeaderboard();
      this.showScreen('leaderboard');
    });

    // Tutorial Screen
    document.getElementById('btn-tutorial-play')?.addEventListener('click', () => {
      Sound.playClick();
      this.game.startCountdownAndPlay();
    });

    document.getElementById('btn-tutorial-back')?.addEventListener('click', () => {
      Sound.playClick();
      this.showScreen('home');
    });

    // Gameplay HUD Pause
    this.hud.btnPause?.addEventListener('click', () => {
      Sound.playClick();
      this.game.pause();
    });

    // Pause Screen Buttons
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      Sound.playClick();
      this.game.resume();
    });

    document.getElementById('btn-pause-quit')?.addEventListener('click', () => {
      Sound.playClick();
      this.game.quitToHome();
    });

    // Results Screen Buttons
    document.getElementById('btn-result-replay')?.addEventListener('click', () => {
      Sound.playClick();
      this.game.startCountdownAndPlay();
    });

    document.getElementById('btn-result-rewards')?.addEventListener('click', () => {
      Sound.playClick();
      this.openRewardsModal();
    });

    document.getElementById('btn-result-leaderboard')?.addEventListener('click', () => {
      Sound.playClick();
      this.renderLeaderboard();
      this.showScreen('leaderboard');
    });

    document.getElementById('btn-result-home')?.addEventListener('click', () => {
      Sound.playClick();
      this.showScreen('home');
    });

    // Save Nickname in Results
    this.results.btnSaveName?.addEventListener('click', () => {
      const name = this.results.inputName.value.trim();
      if (name) {
        LeaderboardManager.setPlayerName(name);
        LeaderboardManager.addScore(name, this.game.scoreManager.score);
        this.results.btnSaveName.disabled = true;
        this.results.btnSaveName.textContent = '✓ Tersimpan';
        Sound.playBonus();
      }
    });

    // Leaderboard Screen Back
    this.leaderboard.btnClose?.addEventListener('click', () => {
      Sound.playClick();
      this.showScreen('home');
    });

    // Rewards Modal
    document.getElementById('btn-modal-rewards-close')?.addEventListener('click', () => {
      Sound.playClick();
      this.closeRewardsModal();
    });
  }

  showScreen(name) {
    for (const key in this.screens) {
      if (this.screens[key]) {
        if (key === name) {
          this.screens[key].classList.remove('hidden');
          this.screens[key].classList.add('active');
        } else if (key !== 'rewardsModal') {
          this.screens[key].classList.remove('active');
          this.screens[key].classList.add('hidden');
        }
      }
    }

    if (name === 'gameplay' && this.game) {
      requestAnimationFrame(() => {
        this.game.resizeCanvas();
      });
    }

    if (name === 'home') {
      const best = Storage.getHighScore();
      const el = document.getElementById('home-best-score');
      if (el) el.textContent = best;
    }
  }

  updateLoading(loaded, total, percent) {
    if (this.loading.bar) {
      this.loading.bar.style.width = `${percent}%`;
    }
    if (this.loading.text) {
      this.loading.text.textContent = `Memuat Aset Howell (${percent}%)`;
    }
  }

  updateSoundButtons(isMuted = Sound.isMuted) {
    const soundButtons = document.querySelectorAll('.sound-toggle-btn');
    soundButtons.forEach(btn => {
      const icon = btn.querySelector('.sound-icon');
      if (icon) {
        icon.textContent = isMuted ? '🔇' : '🔊';
      }
    });
  }

  updateHUD(score, timeRemaining, lives, activePowerups) {
    // Score
    if (this.hud.scoreText) {
      this.hud.scoreText.textContent = score;
    }

    // Timer
    const seconds = Math.max(0, Math.ceil(timeRemaining));
    if (this.hud.timerText) {
      this.hud.timerText.textContent = seconds < 10 ? `0${seconds}` : seconds;
    }

    // Urgent timer pulsing when time < 5
    if (this.hud.timerBox) {
      if (seconds <= 5 && seconds > 0) {
        this.hud.timerBox.classList.add('timer-urgent');
      } else {
        this.hud.timerBox.classList.remove('timer-urgent');
      }
    }

    // Lives
    if (this.hud.livesContainer) {
      this.hud.livesContainer.innerHTML = '';
      for (let i = 0; i < CONFIG.GAME.MAX_LIVES; i++) {
        const heart = document.createElement('span');
        heart.className = `hud-heart ${i < lives ? 'heart-full' : 'heart-empty'}`;
        heart.innerHTML = i < lives ? '❤️' : '🖤';
        this.hud.livesContainer.appendChild(heart);
      }
    }

    // Power-up pills
    if (this.hud.powerupsContainer) {
      this.hud.powerupsContainer.innerHTML = '';
      activePowerups.forEach(pw => {
        const pill = document.createElement('div');
        pill.className = `powerup-pill powerup-${pw.id}`;
        pill.innerHTML = `
          <img src="${pw.icon}" alt="${pw.name}" class="powerup-pill-icon" />
          <span class="powerup-pill-name">${pw.name}</span>
          <span class="powerup-pill-time">${pw.remaining}s</span>
        `;
        this.hud.powerupsContainer.appendChild(pill);
      });
    }
  }

  triggerDamageFlash() {
    if (this.hud.damageFlash) {
      this.hud.damageFlash.classList.add('active');
      setTimeout(() => {
        this.hud.damageFlash.classList.remove('active');
      }, 250);
    }
  }

  showResults(finalScore, isNewHighScore) {
    const bestScore = Storage.getHighScore();
    const reward = RewardManager.getRewardForScore(finalScore);

    if (this.results.finalScore) {
      // Animate score counter up
      this.animateCounter(this.results.finalScore, finalScore);
    }
    if (this.results.bestScore) {
      this.results.bestScore.textContent = bestScore;
    }
    if (this.results.newRecordBadge) {
      if (isNewHighScore) {
        this.results.newRecordBadge.classList.remove('hidden');
      } else {
        this.results.newRecordBadge.classList.add('hidden');
      }
    }

    // Populate reward banner
    if (this.results.rewardBadge) {
      this.results.rewardBadge.textContent = reward.tier;
      this.results.rewardBadge.style.backgroundColor = reward.badgeColor;
    }
    if (this.results.rewardName) {
      this.results.rewardName.textContent = reward.name;
    }
    if (this.results.rewardDesc) {
      this.results.rewardDesc.textContent = reward.desc;
    }
    if (this.results.rewardCode) {
      this.results.rewardCode.textContent = reward.claimCode;
    }

    // Nickname input setup
    if (this.results.inputName) {
      this.results.inputName.value = LeaderboardManager.getPlayerName();
    }
    if (this.results.btnSaveName) {
      this.results.btnSaveName.disabled = false;
      this.results.btnSaveName.textContent = 'Simpan ke Leaderboard';
    }

    this.showScreen('results');
  }

  animateCounter(el, targetVal, duration = 800) {
    const startVal = 0;
    const startTime = performance.now();

    const updateVal = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutQuad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(startVal + (targetVal - startVal) * eased);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(updateVal);
      } else {
        el.textContent = targetVal;
      }
    };

    requestAnimationFrame(updateVal);
  }

  renderLeaderboard() {
    if (!this.leaderboard.list) return;

    const list = LeaderboardManager.getScores();
    this.leaderboard.list.innerHTML = '';

    if (list.length === 0) {
      this.leaderboard.list.innerHTML = '<li class="leaderboard-empty">Belum ada skor tersimpan.</li>';
      return;
    }

    list.forEach((entry, idx) => {
      const rank = idx + 1;
      const item = document.createElement('li');
      item.className = `leaderboard-item rank-${rank}`;

      let medal = `#${rank}`;
      if (rank === 1) medal = '🥇';
      if (rank === 2) medal = '🥈';
      if (rank === 3) medal = '🥉';

      item.innerHTML = `
        <div class="leaderboard-rank">${medal}</div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">${entry.name}</div>
          <div class="leaderboard-meta">${entry.date || ''} ${entry.time || ''}</div>
        </div>
        <div class="leaderboard-score">${entry.score} pts</div>
      `;
      this.leaderboard.list.appendChild(item);
    });
  }

  openRewardsModal() {
    const tiers = RewardManager.getAllTiers();
    const container = document.getElementById('rewards-modal-tiers');
    if (container) {
      container.innerHTML = tiers.map(t => `
        <div class="reward-tier-card">
          <div class="reward-tier-header">
            <span class="reward-tier-badge" style="background-color: ${t.badgeColor}">${t.tier}</span>
            <span class="reward-tier-score">${t.minScore} - ${t.maxScore === 99999 ? 'MAX' : t.maxScore} Poin</span>
          </div>
          <h4 class="reward-tier-title">${t.name}</h4>
          <p class="reward-tier-desc">${t.desc}</p>
        </div>
      `).join('');
    }

    if (this.screens.rewardsModal) {
      this.screens.rewardsModal.style.display = 'flex';
      this.screens.rewardsModal.classList.remove('hidden');
      this.screens.rewardsModal.classList.add('active');
    }
  }

  closeRewardsModal() {
    if (this.screens.rewardsModal) {
      this.screens.rewardsModal.classList.remove('active');
      this.screens.rewardsModal.classList.add('hidden');
      this.screens.rewardsModal.style.display = 'none';
    }
  }
}
