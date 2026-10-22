/**
 * HOWELL CATCH & WIN - Rewards & Prize Tier Module
 * INDOCOMTECH 2026 Exhibition Demo & Production Architecture Readiness.
 */

import { CONFIG } from './config.js';

export class RewardManager {
  /**
   * Calculates the earned reward tier based on final score.
   */
  static getRewardForScore(score) {
    const s = Math.max(0, score);
    for (const tier of CONFIG.REWARDS) {
      if (s >= tier.minScore && s <= tier.maxScore) {
        return {
          ...tier,
          score: s,
          isDemo: CONFIG.ENV.IS_DEMO,
          claimCode: this.generateDemoClaimCode(tier.tier, s),
          instructions: "Tunjukkan layar ini kepada staf di Booth HOWELL INDOCOMTECH 2026 untuk klaim hadiah sesuai ketersediaan."
        };
      }
    }
    return CONFIG.REWARDS[0];
  }

  /**
   * Generates a sample formatted demo claim voucher code for visual booth showcase.
   */
  static generateDemoClaimCode(tier, score) {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HOWELL-DEMO-${tier.toUpperCase()}-${score}-${randomSuffix}`;
  }

  /**
   * Returns all reward tiers for the info screen.
   */
  static getAllTiers() {
    return CONFIG.REWARDS;
  }

  /**
   * Production Backend Integration Architecture (Ready for API hookup)
   * 
   * When connecting to a real enterprise backend (e.g. Firebase, Supabase, Cloud Functions):
   * 1. Send encrypted game session payload (score, timestamps, input trace hash).
   * 2. Server validates time elapsed (30s) and score plausibility.
   * 3. Server generates cryptographically signed single-use claim token / code.
   * 4. Booth staff validates token with Howell Staff Portal to burn token and check real-time stock.
   */
  static async verifyWithProductionBackend(sessionData) {
    if (CONFIG.ENV.IS_DEMO) {
      return {
        success: true,
        mode: "DEMO_SIMULATION",
        message: "Sistem berjalan dalam mode simulasi booth pameran."
      };
    }

    // Example production endpoint schema:
    /*
    const response = await fetch('/api/v1/rewards/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    return await response.json();
    */
    return { success: false, error: "Backend server not configured." };
  }
}
