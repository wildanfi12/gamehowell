import { CONFIG } from "./config.js";

export const SKINS = {
  original: {
    id: "howell-original",
    name: "HOWELL ORIGINAL",
    shortName: "Original",
    assetKey: "bag",
    assetPath: "assets/player/howell-totebag.png",
    requiredScore: 0,
    defaultUnlocked: true,
    catchType: "bag",
    sprite: {
      width: 108,
      height: 144,
      base: 18,
    },
    opening: {
      openingY: 0.27,
      openingWidth: 0.88,
    },
    description: "Totebag autentik HOWELL INDOCOMTECH 2026.",
  },
  chomper: {
    id: "howell-chomper",
    name: "HOWELL CHOMPER",
    shortName: "Chomper",
    assetKey: "chomper",
    assetPath: "assets/skins/howell-chomper.png",
    requiredScore: 750,
    defaultUnlocked: false,
    catchType: "mouth",
    sprite: {
      width: 140,
      height: 140,
      base: 56, // Calibrated so mouth catch line matches totebag opening height (Y ≈ 587)
    },
    mouthHitbox: {
      centerX: 0.647,
      centerY: 0.609,
      width: 0.28,
      height: 0.18,
      openingY: 0.54,
      openingWidth: 0.92, // Generous, responsive catch mouth width (~100px)
    },
    description: "Karakter seru penangkap produk dengan mulut terbuka!",
  },
};

export const DEFAULT_SKIN_ID = "howell-original";

export function getSkin(skinId) {
  if (skinId === "howell-chomper" || skinId === "chomper") {
    return SKINS.chomper;
  }
  return SKINS.original;
}

export function getAllSkins() {
  return [SKINS.original, SKINS.chomper];
}
