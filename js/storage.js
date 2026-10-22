/**
 * HOWELL CATCH & WIN - Storage Module
 * LocalStorage wrapper with safe fallbacks and demo leaderboard seed data.
 */

import { CONFIG } from './config.js';

class StorageManager {
  constructor() {
    this.memoryStore = {};
    this.isAvailable = this.checkAvailability();
    this.initDefaultLeaderboard();
  }

  checkAvailability() {
    try {
      const testKey = '__howell_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('LocalStorage not accessible, falling back to in-memory store:', e);
      return false;
    }
  }

  getItem(key, defaultValue = null) {
    if (this.isAvailable) {
      try {
        const item = window.localStorage.getItem(key);
        return item !== null ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error('Error reading localStorage for key:', key, e);
        return defaultValue;
      }
    }
    return this.memoryStore[key] !== undefined ? this.memoryStore[key] : defaultValue;
  }

  setItem(key, value) {
    if (this.isAvailable) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Error writing localStorage for key:', key, e);
      }
    }
    this.memoryStore[key] = value;
    return true;
  }

  getHighScore() {
    return this.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, 0);
  }

  setHighScore(score) {
    const current = this.getHighScore();
    if (score > current) {
      this.setItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, score);
      return true;
    }
    return false;
  }

  getPlayerName() {
    return this.getItem(CONFIG.STORAGE_KEYS.PLAYER_NAME, "Pengunjung Howell");
  }

  setPlayerName(name) {
    if (name && name.trim()) {
      this.setItem(CONFIG.STORAGE_KEYS.PLAYER_NAME, name.trim().substring(0, 15));
    }
  }

  getLeaderboard() {
    return this.getItem(CONFIG.STORAGE_KEYS.LEADERBOARD, []);
  }

  saveScoreToLeaderboard(nickname, score) {
    const list = this.getLeaderboard();
    const entry = {
      name: (nickname || "Pengunjung").trim().substring(0, 14),
      score: score,
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short"
      }),
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    list.push(entry);
    // Sort descending by score
    list.sort((a, b) => b.score - a.score);
    // Keep top 10
    const top10 = list.slice(0, 10);
    this.setItem(CONFIG.STORAGE_KEYS.LEADERBOARD, top10);
    return {
      rank: top10.findIndex(item => item === entry) + 1,
      top10: top10
    };
  }

  initDefaultLeaderboard() {
    const existing = this.getItem(CONFIG.STORAGE_KEYS.LEADERBOARD, null);
    if (!existing || existing.length === 0) {
      const seeded = [
        { name: "Wildan Tech", score: 260, date: "22 Okt", time: "14:20" },
        { name: "Howell Master", score: 235, date: "22 Okt", time: "13:45" },
        { name: "Indocom Pro", score: 210, date: "22 Okt", time: "12:30" },
        { name: "Cable Lover", score: 185, date: "22 Okt", time: "11:15" },
        { name: "Rizky Audio", score: 160, date: "22 Okt", time: "10:50" },
        { name: "Budi 16K", score: 140, date: "22 Okt", time: "10:10" },
        { name: "Gamer Jkt", score: 125, date: "22 Okt", time: "09:40" },
        { name: "TWS Hunter", score: 110, date: "22 Okt", time: "09:15" }
      ];
      this.setItem(CONFIG.STORAGE_KEYS.LEADERBOARD, seeded);
    }
  }

  getSettings() {
    return this.getItem(CONFIG.STORAGE_KEYS.SETTINGS, {
      muted: CONFIG.AUDIO.MUTED_DEFAULT,
      bgm: CONFIG.AUDIO.BGM_DEFAULT
    });
  }

  saveSettings(settings) {
    this.setItem(CONFIG.STORAGE_KEYS.SETTINGS, settings);
  }
}

export const Storage = new StorageManager();
