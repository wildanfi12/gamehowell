/**
 * HOWELL CATCH & WIN - Main Application Entry Point
 * Preloads assets and initiates the game lifecycle.
 */

import { Assets } from './assetManager.js';
import { Game } from './game.js';
import { Sound } from './audio.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('🎮 Initializing HOWELL CATCH & WIN...');

  const game = new Game();

  // Preload all assets with progress callback
  try {
    await Assets.preloadAll((loaded, total, percent) => {
      game.ui.updateLoading(loaded, total, percent);
    });

    // Asset preloading completed smoothly
    setTimeout(() => {
      game.state = 'home';
      game.player.image = Assets.getImage('howell-totebag');
      game.ui.showScreen('home');
      game.start();
    }, 400);

  } catch (err) {
    console.error('Asset preloading error:', err);
    // Proceed anyway using dynamic fallbacks
    game.state = 'home';
    game.ui.showScreen('home');
    game.start();
  }

  // Developer debug shortcut (Press 'D' on keyboard or triple-tap brand logo)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      game.debug = !game.debug;
      console.log('🛠️ Debug Mode:', game.debug ? 'ENABLED' : 'DISABLED');
    }
  });

  const logoEls = document.querySelectorAll('.debug-toggle-target');
  let tapCount = 0;
  let tapTimer = null;
  logoEls.forEach(logo => {
    logo.addEventListener('click', () => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 600);
      if (tapCount >= 3) {
        tapCount = 0;
        game.debug = !game.debug;
        alert(`Debug Mode: ${game.debug ? 'AKTIF (Hitboxes & Stats Muncul)' : 'NONAKTIF'}`);
      }
    });
  });

  // Global gesture to unlock Web Audio on mobile iOS/Android
  const unlockAudio = () => {
    Sound.ensureContext();
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  };
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
});
