import { CONFIG } from "./config.js";

export class Audio {
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
      totebag: [580, 780, 980, 1280],
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
