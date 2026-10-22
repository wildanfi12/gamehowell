/**
 * HOWELL CATCH & WIN - Player Module
 * Controls the authentic HOWELL Totebag catcher at the bottom of the screen.
 */

import { CONFIG } from './config.js';
import { Assets } from './assetManager.js';

export class Player {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Totebag sizing based on canvas width and authentic aspect ratio (1086 / 1448)
    this.width = canvasWidth * CONFIG.PLAYER.WIDTH_RATIO;
    this.height = this.width / CONFIG.PLAYER.ASPECT_RATIO;

    // Center horizontally near bottom
    this.x = (canvasWidth - this.width) / 2;
    this.y = canvasHeight - this.height - (canvasHeight * CONFIG.PLAYER.BOTTOM_MARGIN_RATIO);
    this.targetX = this.x;

    // Velocity & visual tilt for dynamic juice
    this.vx = 0;
    this.tiltAngle = 0;

    // Catch squash & bounce feedback
    this.squashX = 1;
    this.squashY = 1;

    // Items currently animating being swallowed into the bag
    this.swallowedItems = [];

    // Cached image
    this.image = Assets.getImage('howell-totebag');
  }

  resize(newWidth, newHeight) {
    const xRatio = this.x / this.canvasWidth;
    this.canvasWidth = newWidth;
    this.canvasHeight = newHeight;

    this.width = newWidth * CONFIG.PLAYER.WIDTH_RATIO;
    this.height = this.width / CONFIG.PLAYER.ASPECT_RATIO;

    this.x = xRatio * newWidth;
    this.targetX = this.x;
    this.y = newHeight - this.height - (newHeight * CONFIG.PLAYER.BOTTOM_MARGIN_RATIO);
    this.clamp();
  }

  moveTo(targetScreenX) {
    // targetScreenX is the center point
    this.targetX = targetScreenX - (this.width / 2);
    this.clampTarget();
  }

  clampTarget() {
    const minX = 0;
    const maxX = this.canvasWidth - this.width;
    if (this.targetX < minX) this.targetX = minX;
    if (this.targetX > maxX) this.targetX = maxX;
  }

  clamp() {
    const minX = 0;
    const maxX = this.canvasWidth - this.width;
    if (this.x < minX) this.x = minX;
    if (this.x > maxX) this.x = maxX;
  }

  /**
   * Returns the precise collision box for the totebag's mouth/opening.
   * Derived from pixel measurement of authentic Howell Totebag (opening below straps).
   */
  getCatchZone() {
    const bagCenterX = this.x + this.width / 2;
    const mouthWidth = this.width * CONFIG.PLAYER.CATCH_ZONE_WIDTH_RATIO;
    const topY = this.y + (this.height * CONFIG.PLAYER.CATCH_ZONE_TOP_RATIO);
    const bottomY = this.y + (this.height * CONFIG.PLAYER.CATCH_ZONE_BOTTOM_RATIO);

    return {
      x: bagCenterX - mouthWidth / 2,
      y: topY,
      width: mouthWidth,
      height: bottomY - topY,
      centerX: bagCenterX,
      openingY: (topY + bottomY) / 2
    };
  }

  /**
   * Triggers a bounce and swallow animation when an item is caught.
   */
  onCatch(item) {
    // Squash & stretch feedback
    this.squashX = 1.12;
    this.squashY = 0.88;

    // Add to swallowed items animation list
    this.swallowedItems.push({
      image: item.image,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      targetX: this.x + this.width / 2,
      targetY: this.y + this.height * 0.45,
      scale: 1,
      alpha: 1,
      progress: 0
    });
  }

  update(dt) {
    // Smooth interpolation to target position
    const prevX = this.x;
    this.x += (this.targetX - this.x) * (CONFIG.PLAYER.SMOOTHING * (dt * 60));
    this.clamp();

    // Calculate horizontal velocity for dynamic tilt
    this.vx = (this.x - prevX) / Math.max(0.001, dt);
    const targetTilt = Math.max(-CONFIG.PLAYER.MAX_TILT_DEG, 
      Math.min(CONFIG.PLAYER.MAX_TILT_DEG, (this.vx / 300) * CONFIG.PLAYER.MAX_TILT_DEG));
    this.tiltAngle += (targetTilt - this.tiltAngle) * 0.2;

    // Spring squash & stretch back to 1
    this.squashX += (1 - this.squashX) * 0.2;
    this.squashY += (1 - this.squashY) * 0.2;

    // Update swallowed items
    for (let i = this.swallowedItems.length - 1; i >= 0; i--) {
      const sw = this.swallowedItems[i];
      sw.progress += dt * 3.5; // ~0.3s duration

      // Move into bag mouth
      sw.x += (this.x + this.width / 2 - sw.x) * 0.25;
      sw.y += (this.y + this.height * 0.45 - sw.y) * 0.25;
      sw.scale = Math.max(0.1, 1 - sw.progress * 0.7);
      sw.alpha = Math.max(0, 1 - sw.progress);

      if (sw.progress >= 1 || sw.alpha <= 0.05) {
        this.swallowedItems.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((this.tiltAngle * Math.PI) / 180);
    ctx.scale(this.squashX, this.squashY);

    // 1. Render items that are dropping INTO the bag opening (drawn behind the front body)
    if (this.swallowedItems.length > 0) {
      this.swallowedItems.forEach(sw => {
        ctx.save();
        ctx.globalAlpha = sw.alpha;
        const localX = sw.x - centerX;
        const localY = sw.y - centerY;
        const drawW = sw.width * sw.scale;
        const drawH = sw.height * sw.scale;
        if (sw.image) {
          ctx.drawImage(sw.image, localX - drawW / 2, localY - drawH / 2, drawW, drawH);
        }
        ctx.restore();
      });
    }

    // 2. Render authentic Howell Totebag
    if (this.image) {
      // Soft ambient shadow underneath
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, this.height / 2 - 2, this.width * 0.44, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
    }

    // 3. Subtle bag mouth glow / rim highlight
    ctx.save();
    const mouthY = -this.height / 2 + (this.height * CONFIG.PLAYER.CATCH_ZONE_TOP_RATIO);
    const grad = ctx.createLinearGradient(0, mouthY, 0, mouthY + 12);
    grad.addColorStop(0, 'rgba(0, 198, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 198, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, mouthY, this.width * 0.36, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // Debug rendering
  renderDebug(ctx) {
    const zone = this.getCatchZone();
    ctx.save();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

    ctx.fillStyle = '#00ff88';
    ctx.font = '10px monospace';
    ctx.fillText('HOWELL TOTEBAG MOUTH', zone.x + 4, zone.y - 4);
    ctx.restore();
  }
}
