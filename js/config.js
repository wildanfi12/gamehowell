/**
 * HOWELL CATCH & WIN - Configuration Module
 * INDOCOMTECH 2026 Promotional Mobile Arcade Game
 * 
 * Centralized settings for game mechanics, assets, scoring, difficulty,
 * power-ups, reward tiers, and debug mode.
 */

export const CONFIG = {
  // Brand & Metadata
  BRAND: {
    NAME: "HOWELL",
    TITLE: "HOWELL CATCH & WIN",
    TAGLINE: "Catch More, Win More!",
    EVENT: "INDOCOMTECH 2026",
    BOOTH: "Main Hall - Booth HOWELL Indonesia",
    OFFICIAL_SITE: "https://wildanfi12.github.io/Howell/",
    PRIMARY_COLOR: "#0066ff",
    ACCENT_COLOR: "#ffb700",
    DARK_BG: "#0b111e",
    LIGHT_TEXT: "#ffffff"
  },

  // Environment
  ENV: {
    IS_DEMO: true, // Exhibition Demo Mode
    ENABLE_DEBUG: false, // Can be overridden via URL param `?debug=1`
    VERSION: "1.0.0"
  },

  // Game Loop & Timing
  GAME: {
    DURATION: 30, // seconds
    TARGET_FPS: 60,
    MAX_LIVES: 3,
    INITIAL_LIVES: 3,
    ASPECT_RATIO: 9 / 16,
    BASE_WIDTH: 450, // virtual canvas width for crisp scaling
    BASE_HEIGHT: 800  // virtual canvas height for crisp scaling
  },

  // Totebag Player
  PLAYER: {
    ASSET: "assets/player/howell-totebag.png",
    FALLBACK_ASSET: "assets/player/hd/howell-totebag.png",
    WIDTH_RATIO: 0.32, // 32% of canvas width for comfortable mobile catching
    ASPECT_RATIO: 1086 / 1448, // Authentic Howell totebag proportions
    BOTTOM_MARGIN_RATIO: 0.035, // Distance from canvas bottom
    // The bag opening is at ~25% to ~44% from top of the totebag image (below straps)
    CATCH_ZONE_TOP_RATIO: 0.25,
    CATCH_ZONE_BOTTOM_RATIO: 0.44,
    CATCH_ZONE_WIDTH_RATIO: 0.92, // 92% of bag width is the mouth
    SMOOTHING: 0.45, // Snappier touch interpolation
    MAX_TILT_DEG: 8 // Slight dynamic tilt when moving left/right
  },

  // Authentic HOWELL Product Assets (10 Products)
  PRODUCT_ASSETS: [
    {
      id: "tws",
      name: "TWS",
      image: "assets/products/tws.png",
      points: 20,
      weight: 12, // spawn weight
      scale: 0.17 // scale relative to canvas width
    },
    {
      id: "earphone",
      name: "Earphone",
      image: "assets/products/earphone.png",
      points: 15,
      weight: 14,
      scale: 0.17
    },
    {
      id: "audio-cable",
      name: "AUDIO CABLE",
      image: "assets/products/audio-cable.png",
      points: 10,
      weight: 16,
      scale: 0.18
    },
    {
      id: "power-cable",
      name: "POWER CABLE",
      image: "assets/products/power-cable.png",
      points: 10,
      weight: 16,
      scale: 0.18
    },
    {
      id: "adapter-hwc04",
      name: "Adapter HW-C04",
      image: "assets/products/adapter-hwc04.png",
      points: 20,
      weight: 12,
      scale: 0.17
    },
    {
      id: "tws-hw02",
      name: "TWS HW02",
      image: "assets/products/tws-hw02.png",
      points: 20,
      weight: 12,
      scale: 0.17
    },
    {
      id: "cat8-ftp",
      name: "CAT 8 FTP",
      image: "assets/products/cat8-ftp.png",
      points: 15,
      weight: 14,
      scale: 0.18
    },
    {
      id: "displayport-16k",
      name: "DisplayPort 16K",
      image: "assets/products/displayport-16k.png",
      points: 15,
      weight: 14,
      scale: 0.18
    },
    {
      id: "hdmi-16k",
      name: "HDMI 16K",
      image: "assets/products/hdmi-16k.png",
      points: 15,
      weight: 14,
      scale: 0.18
    },
    {
      id: "usb2-am-am",
      name: "USB 2.0 AM - AM",
      image: "assets/products/usb2-am-am.png",
      points: 10,
      weight: 16,
      scale: 0.18
    }
  ],

  // Hazards & Obstacles
  HAZARDS: {
    BOMB: {
      id: "bomb",
      name: "Bom Pajak",
      image: "assets/icons/bomb.png",
      penaltyLife: 1,
      scale: 0.20,
      shakeDuration: 350, // ms
      shakeIntensity: 15 // px
    },
    DAMAGED: {
      id: "damaged",
      name: "Produk Rusak",
      image: "assets/icons/damaged.svg",
      penaltyScore: 10,
      resetsCombo: true,
      scale: 0.17
    }
  },

  // Power-Ups
  POWERUPS: {
    DOUBLE: {
      id: "double",
      name: "Double Score (2X)",
      image: "assets/icons/powerup-2x.svg",
      duration: 5, // seconds
      multiplier: 2,
      scale: 0.16
    },
    MAGNET: {
      id: "magnet",
      name: "Magnet Produk",
      image: "assets/icons/powerup-magnet.svg",
      duration: 4, // seconds
      attractRadius: 260, // px
      attractSpeed: 420, // px/s
      scale: 0.16
    },
    SLOW: {
      id: "slow",
      name: "Slow Motion",
      image: "assets/icons/powerup-slow.svg",
      duration: 3, // seconds
      speedFactor: 0.45,
      scale: 0.16
    },
    HEART: {
      id: "heart",
      name: "Extra Life (+1)",
      image: "assets/icons/powerup-heart.svg",
      lifeAdd: 1,
      scale: 0.16
    },
    BONUS30: {
      id: "bonus30",
      name: "Bonus Poin (+30)",
      image: "assets/icons/powerup-bonus30.svg",
      bonusScore: 30,
      scale: 0.16
    }
  },

  // Spawning & Difficulty Progression (0-10s Easy, 10-20s Med, 20-30s Hard)
  DIFFICULTY: [
    {
      timeRange: [0, 10],
      name: "EASY",
      spawnInterval: 0.75, // spawn every 0.75s
      baseFallSpeed: 210, // px/sec
      speedVariation: 40,
      chances: {
        product: 0.82,
        bomb: 0.08,
        damaged: 0.05,
        powerup: 0.05
      }
    },
    {
      timeRange: [10, 20],
      name: "MEDIUM",
      spawnInterval: 0.58, // spawn every 0.58s
      baseFallSpeed: 280, // px/sec
      speedVariation: 60,
      chances: {
        product: 0.70,
        bomb: 0.13,
        damaged: 0.09,
        powerup: 0.08
      }
    },
    {
      timeRange: [20, 30],
      name: "HARD",
      spawnInterval: 0.44, // spawn every 0.44s
      baseFallSpeed: 360, // px/sec
      speedVariation: 80,
      chances: {
        product: 0.60,
        bomb: 0.18,
        damaged: 0.12,
        powerup: 0.10
      }
    }
  ],

  // Combo Streaks
  COMBOS: [
    { streak: 3, message: "NICE!", bonus: 5, color: "#00d2d3" },
    { streak: 5, message: "GREAT!", bonus: 10, color: "#ff9f43" },
    { streak: 10, message: "HOWELL MASTER!", bonus: 25, color: "#ff5252" }
  ],

  // Reward Tiers for Booth INDOCOMTECH 2026
  REWARDS: [
    {
      minScore: 0,
      maxScore: 80,
      tier: "Bronze",
      name: "Voucher Partisipasi",
      desc: "Diskon 10% untuk semua pembelian kabel & aksesoris di booth HOWELL.",
      badgeColor: "#cd7f32"
    },
    {
      minScore: 81,
      maxScore: 150,
      tier: "Silver",
      name: "Hadiah Kecil",
      desc: "Merchandise eksklusif HOWELL (Gantungan Kunci / Cable Strap).",
      badgeColor: "#a4b0be"
    },
    {
      minScore: 151,
      maxScore: 220,
      tier: "Gold",
      name: "Aksesori HOWELL",
      desc: "Kabel Original HOWELL High-Speed Audio / USB Cable pilihan.",
      badgeColor: "#ffa502"
    },
    {
      minScore: 221,
      maxScore: 99999,
      tier: "Diamond",
      name: "Hadiah Spesial",
      desc: "TWS Howell / Adapter GaN 65W Fast Charger resmi HOWELL!",
      badgeColor: "#00d2d3"
    }
  ],

  // Audio Settings
  AUDIO: {
    MASTER_VOLUME: 0.6,
    SFX_VOLUME: 0.8,
    BGM_VOLUME: 0.35,
    MUTED_DEFAULT: false,
    BGM_DEFAULT: false
  },

  // Storage Keys
  STORAGE_KEYS: {
    HIGH_SCORE: "howell_catch_highscore",
    LEADERBOARD: "howell_catch_leaderboard",
    SETTINGS: "howell_catch_settings",
    PLAYER_NAME: "howell_player_nickname"
  }
};
