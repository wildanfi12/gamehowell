/**
 * HOWELL CATCH & WIN - Leaderboard Module
 * Handles local demo leaderboard rankings and prepares interface for online APIs.
 */

import { Storage } from './storage.js';

export class LeaderboardManager {
  static getScores() {
    return Storage.getLeaderboard();
  }

  static addScore(nickname, score) {
    return Storage.saveScoreToLeaderboard(nickname, score);
  }

  static getPlayerName() {
    return Storage.getPlayerName();
  }

  static setPlayerName(name) {
    Storage.setPlayerName(name);
  }

  /**
   * Future Online Backend Hookup:
   * GET /api/v1/leaderboard
   * POST /api/v1/leaderboard/submit
   */
  static async fetchOnlineLeaderboard() {
    // Falls back to local storage in demo mode
    return this.getScores();
  }
}
