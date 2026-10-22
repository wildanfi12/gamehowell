/**
 * HOWELL CATCH & WIN - Asset Manager
 * Preloads, caches, and provides fallback generation for game images.
 */

import { CONFIG } from './config.js';

class AssetManager {
  constructor() {
    this.images = new Map();
    this.failedAssets = new Set();
    this.loadedCount = 0;
    this.totalCount = 0;
  }

  /**
   * Load all assets registered in CONFIG.
   * @param {Function} onProgress (loaded, total, percent)
   * @returns {Promise<void>}
   */
  async preloadAll(onProgress = null) {
    const assetList = [];

    // 1. Branding Logo
    assetList.push({ id: 'brand-logo', src: 'assets/branding/howell-logo.png' });
    assetList.push({ id: 'brand-logo-white', src: 'assets/branding/howell-logo-white.png' });

    // 2. Howell Totebag
    assetList.push({ id: 'howell-totebag', src: CONFIG.PLAYER.ASSET });

    // 3. Ten authentic Howell products
    CONFIG.PRODUCT_ASSETS.forEach(prod => {
      assetList.push({ id: prod.id, src: prod.image, fallbackName: prod.name });
    });

    // 4. Hazards
    assetList.push({ id: CONFIG.HAZARDS.BOMB.id, src: CONFIG.HAZARDS.BOMB.image });
    assetList.push({ id: CONFIG.HAZARDS.DAMAGED.id, src: CONFIG.HAZARDS.DAMAGED.image });

    // 5. Powerups
    Object.values(CONFIG.POWERUPS).forEach(pw => {
      assetList.push({ id: pw.id, src: pw.image });
    });

    this.totalCount = assetList.length;
    this.loadedCount = 0;

    const promises = assetList.map(item => this.loadImage(item, onProgress));
    await Promise.all(promises);
  }

  /**
   * Loads a single image with automatic graceful fallback generation if missing or errored.
   */
  loadImage(item, onProgress) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const handleDone = (loadedImg) => {
        this.images.set(item.id, loadedImg);
        this.loadedCount++;
        if (onProgress) {
          const percent = Math.min(100, Math.round((this.loadedCount / this.totalCount) * 100));
          onProgress(this.loadedCount, this.totalCount, percent);
        }
        resolve(loadedImg);
      };

      img.onload = () => {
        handleDone(img);
      };

      img.onerror = () => {
        console.warn(`Asset failed to load: ${item.src}. Generating graceful fallback for [${item.id}].`);
        this.failedAssets.add(item.id);
        const fallbackCanvas = this.createFallbackPlaceholder(item);
        const fallbackImg = new Image();
        fallbackImg.src = fallbackCanvas.toDataURL();
        fallbackImg.onload = () => handleDone(fallbackImg);
        fallbackImg.onerror = () => handleDone(img); // worst case fallback
      };

      img.src = item.src;
    });
  }

  /**
   * Retrieves an image by its unique ID.
   * If missing, returns a dynamic emergency placeholder to prevent crashes.
   */
  getImage(id) {
    if (this.images.has(id)) {
      return this.images.get(id);
    }
    console.warn(`Asset requested but not found in cache: ${id}`);
    const fallbackCanvas = this.createFallbackPlaceholder({ id, fallbackName: id });
    const fallbackImg = new Image();
    fallbackImg.src = fallbackCanvas.toDataURL();
    this.images.set(id, fallbackImg);
    return fallbackImg;
  }

  /**
   * Generates a clearly labeled placeholder image matching prompt rules.
   */
  createFallbackPlaceholder(item) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Rounded rectangle card
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    this.roundRect(ctx, 10, 10, 236, 236, 20);
    ctx.fill();
    ctx.stroke();

    // Howell Header
    ctx.fillStyle = '#ffb700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOWELL', 128, 48);

    // Placeholder Icon Box
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(50, 70, 156, 100);

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    const label = item.fallbackName || item.id.toUpperCase();
    ctx.fillText(label, 128, 125);

    // Notice
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('[PLACEHOLDER ASSET]', 128, 150);
    ctx.fillText('Ready for Official Asset', 128, 205);

    return canvas;
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export const Assets = new AssetManager();
