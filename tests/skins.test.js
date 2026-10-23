import test from "node:test";
import assert from "node:assert/strict";
import { SKINS, getSkin, getAllSkins } from "../js/skins.js";
import {
  getPlayerProfile,
  savePlayerProfile,
  getSelectedSkin,
  setSelectedSkin,
  unlockSkinIfEligible,
  markCelebrationShown,
} from "../js/storage.js";
import { Game } from "../js/game.js";
import { CONFIG } from "../js/config.js";
import { access } from "node:fs/promises";

test("Skin definitions are complete and correct", async () => {
  const all = getAllSkins();
  assert.equal(all.length, 2);

  const orig = getSkin("howell-original");
  assert.equal(orig.id, "howell-original");
  assert.equal(orig.requiredScore, 0);
  assert.equal(orig.defaultUnlocked, true);
  assert.equal(orig.catchType, "bag");

  const chomper = getSkin("howell-chomper");
  assert.equal(chomper.id, "howell-chomper");
  assert.equal(chomper.requiredScore, 750);
  assert.equal(chomper.defaultUnlocked, false);
  assert.equal(chomper.catchType, "mouth");
  assert.ok(chomper.mouthHitbox.centerX > 0.6 && chomper.mouthHitbox.centerX < 0.7);
  assert.ok(chomper.mouthHitbox.centerY > 0.55 && chomper.mouthHitbox.centerY < 0.65);

  // Asset file must exist on disk
  await access(new URL("../" + chomper.assetPath, import.meta.url));
  await access(new URL("../" + orig.assetPath, import.meta.url));
});

test("Skin unlock condition strictly enforces >= 750 points in a single session", () => {
  // Clear any existing profiles in mock storage
  const mockStorage = {};
  global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
  };

  const name = "TestPlayer750";

  // 1. Initial state: Chomper locked
  let prof = getPlayerProfile(name);
  assert.deepEqual(prof.unlockedSkins, ["howell-original"]);
  assert.equal(prof.selectedSkin, "howell-original");

  // 2. Score 500: remains locked
  let res = unlockSkinIfEligible(name, 500);
  assert.equal(res.unlocked, false);
  assert.equal(res.showCelebration, false);

  // 3. Score 749: remains locked (boundary test)
  res = unlockSkinIfEligible(name, 749);
  assert.equal(res.unlocked, false);
  assert.equal(res.showCelebration, false);

  // 4. Score 750: unlocked!
  res = unlockSkinIfEligible(name, 750);
  assert.equal(res.unlocked, true);
  assert.equal(res.isFirstTime, true);
  assert.equal(res.showCelebration, true);

  // 5. Check profile persistence
  prof = getPlayerProfile(name);
  assert.ok(prof.unlockedSkins.includes("howell-chomper"));

  // 6. Celebration marked as shown - should not trigger celebration again on subsequent 750+ score
  markCelebrationShown(name);
  res = unlockSkinIfEligible(name, 820);
  assert.equal(res.unlocked, true);
  assert.equal(res.isFirstTime, false);
  assert.equal(res.showCelebration, false);
});

test("Two separate sub-750 scores do not combine to unlock Chomper", () => {
  const mockStorage = {};
  global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
  };

  const name = "CumulativeTestPlayer";
  unlockSkinIfEligible(name, 400);
  unlockSkinIfEligible(name, 450);

  const prof = getPlayerProfile(name);
  assert.deepEqual(prof.unlockedSkins, ["howell-original"]);
  assert.equal(prof.unlockedSkins.includes("howell-chomper"), false);
});

test("Different nicknames maintain isolated skin unlocks and equipped selections", () => {
  const mockStorage = {};
  global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
  };

  // Player A unlocks and equips Chomper
  unlockSkinIfEligible("PlayerA", 780);
  setSelectedSkin("PlayerA", "howell-chomper");
  assert.equal(getSelectedSkin("PlayerA"), "howell-chomper");

  // Player B is brand new - should only have original skin
  const profB = getPlayerProfile("PlayerB");
  assert.deepEqual(profB.unlockedSkins, ["howell-original"]);
  assert.equal(getSelectedSkin("PlayerB"), "howell-original");

  // Player B cannot equip Chomper while locked
  const equipped = setSelectedSkin("PlayerB", "howell-chomper");
  assert.equal(equipped, false);
  assert.equal(getSelectedSkin("PlayerB"), "howell-original");
});

test("Chomper movement anchors mouth to player X and allows full reach to screen edges", () => {
  const g = Object.create(Game.prototype);
  Object.assign(g, {
    x: 200,
    target: 200,
    h: 710,
    bagScale: 1.0,
    currentBagWidth: CONFIG.bag.width,
    skin: getSkin("howell-chomper"),
  });

  const opening = g.opening();
  // Mouth center X must coincide with g.x
  assert.equal(opening.mouthX, g.x);

  // Clamping ensures mouth can reach left edge so items on the left are caught reliably
  const minX = g.clamp(-100);
  const maxX = g.clamp(1000);

  // Mouth left reach must reach <= 20px from screen edge
  const leftReach = minX - opening.width / 2;
  assert.ok(leftReach <= 20, `Chomper mouth left reach (${leftReach}px) must be able to reach <= 20px to catch left items`);
  assert.equal(minX, 64);
  assert.equal(maxX, 336);
});

test("Chomper catch width expands by +50% under totebag power-up without distorting base geometry", () => {
  const g = Object.create(Game.prototype);
  Object.assign(g, {
    x: 200,
    target: 200,
    h: 710,
    bagScale: 1.0,
    currentBagWidth: CONFIG.bag.width,
    skin: getSkin("howell-chomper"),
  });

  const normalOpening = g.opening();
  assert.ok(normalOpening.width > 80, "Base catch width must be comparable to totebag opening");

  // Apply +50% totebag powerup scale
  g.bagScale = 1.5;
  const expandedOpening = g.opening();
  assert.equal(Math.round(expandedOpening.width), Math.round(normalOpening.width * 1.5));

  // Sprite dimensions remain unaltered (1:1 ratio preserved, face not stretched)
  assert.equal(g.skin.sprite.width, 140);
  assert.equal(g.skin.sprite.height, 140);
});
