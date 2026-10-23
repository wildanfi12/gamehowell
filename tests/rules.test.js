import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG, PRODUCTS, BONUSES } from "../js/config.js";
import {
  createState,
  collect,
  tick,
  difficulty,
  reward,
  pickProduct,
  crossesOpening,
} from "../js/rules.js";
import { validatePlayerName } from "../js/storage.js";
import { Game } from "../js/game.js";

test("All ten products are selectable with configured points", () => {
  assert.equal(PRODUCTS.length, 10);
  PRODUCTS.forEach((p, i) => {
    assert.equal(pickProduct(() => (i + 0.5) / 10).id, p.id);
    const s = createState();
    collect(s, { kind: "product", product: p });
    assert.equal(s.score, p.points);
  });
});

test("A collision is scored once and combo thresholds fire once", () => {
  const s = createState(),
    item = { kind: "product", product: PRODUCTS[0] };
  collect(s, item);
  assert.equal(collect(s, item), null);
  assert.equal(s.score, 20);
  let result;
  for (let i = 1; i < 10; i++)
    result = collect(s, { kind: "product", product: PRODUCTS[0] });
  assert.equal(s.combo, 10);
  assert.equal(result.combo, "MASTER HOWELL!");
  assert.equal(s.bestCombo, 10);
});

test("Hazards remove lives, reset combo, and never make score negative", () => {
  const s = createState();
  collect(s, { kind: "product", product: PRODUCTS[0] });
  collect(s, { kind: "bomb" });
  assert.equal(s.lives, 2);
  assert.equal(s.combo, 0);
  for (let i = 0; i < 4; i++) collect(s, { kind: "damaged" });
  assert.equal(s.score, 0);
  for (let i = 0; i < 4; i++) collect(s, { kind: "bomb" });
  assert.equal(s.lives, 0);
});

test("All bonuses work and timed effects expire", () => {
  const s = createState();
  const bonus = (id) =>
    collect(s, { kind: "bonus", bonus: BONUSES.find((b) => b.id === id) });
  bonus("double");
  collect(s, { kind: "product", product: PRODUCTS[0] });
  assert.equal(s.score, 40);
  bonus("points");
  assert.equal(s.score, 100);
  s.lives = 2;
  bonus("life");
  bonus("life");
  assert.equal(s.lives, 3);
  bonus("magnet");
  bonus("slow");
  tick(s, 3);
  assert.equal(s.effects.slow, 0);
  assert.equal(s.effects.magnet, 1);
  assert.equal(s.effects.double, 2);
  tick(s, 3);
  assert.equal(s.effects.double, 0);
  assert.equal(s.effects.magnet, 0);
});

test("Totebag expansion bonus grants +50% width effect and refreshes duration without stacking", () => {
  const s = createState();
  const toteBonus = BONUSES.find((b) => b.id === "totebag");
  assert.ok(toteBonus, "Totebag bonus must be defined in BONUSES");
  const res = collect(s, { kind: "bonus", bonus: toteBonus });
  assert.equal(res.text, "TOTEBAG +50%!");
  assert.equal(res.tone, "totebag");
  assert.equal(s.effects.totebag, 8);

  tick(s, 3);
  assert.equal(s.effects.totebag, 5);

  // Collecting another refreshes duration to 8 without exceeding
  collect(s, { kind: "bonus", bonus: toteBonus });
  assert.equal(s.effects.totebag, 8);

  tick(s, 8);
  assert.equal(s.effects.totebag, 0);
});

test("Totebag opening and clamping accurately expand to 150% and stay within boundaries", () => {
  const g = Object.create(Game.prototype);
  Object.assign(g, {
    x: 200,
    target: 200,
    h: 710,
    bagScale: 1.0,
    currentBagWidth: CONFIG.bag.width,
  });

  const normalOpening = g.opening();
  assert.equal(normalOpening.width, CONFIG.bag.width * CONFIG.bag.openingWidth);

  // Expand to 150% (max scale 1.5)
  g.bagScale = 1.5;
  g.currentBagWidth = CONFIG.bag.width * 1.5;
  const expandedOpening = g.opening();
  assert.equal(expandedOpening.width, normalOpening.width * 1.5);

  // Clamping keeps expanded bag on-screen
  const leftClamp = g.clamp(0);
  assert.equal(leftClamp, (CONFIG.bag.width * 1.5) / 2 + 10);
  const rightClamp = g.clamp(CONFIG.width);
  assert.equal(rightClamp, CONFIG.width - (CONFIG.bag.width * 1.5) / 2 - 10);
});

test("Player name validation handles edge cases safely", () => {
  assert.equal(validatePlayerName("").valid, false);
  assert.equal(validatePlayerName("   ").valid, false);
  assert.equal(validatePlayerName("A").valid, false);
  assert.equal(validatePlayerName("Andrey").valid, true);
  assert.equal(validatePlayerName("  Wildan  ").valid, true);
  assert.equal(validatePlayerName("  Wildan  ").name, "Wildan");
  assert.equal(validatePlayerName(123).valid, false);
});

test("Difficulty transitions, timer clamp and fresh restart state", () => {
  assert.equal(difficulty(9.99).at, 0);
  assert.equal(difficulty(10).at, 10);
  assert.equal(difficulty(20).at, 20);
  const s = createState();
  tick(s, 99);
  assert.equal(s.time, 30);
  assert.deepEqual(createState(), {
    time: 0,
    score: 0,
    lives: 3,
    combo: 0,
    caught: 0,
    bestCombo: 0,
    effects: { double: 0, magnet: 0, slow: 0, totebag: 0 },
  });
});

test("Swept opening collision catches crossing, rejects sides and below", () => {
  const opening = { x: 200, y: 500, width: 80 };
  assert.ok(crossesOpening({ x: 200, y: 510, size: 60 }, 460, opening));
  assert.ok(!crossesOpening({ x: 250, y: 510, size: 60 }, 460, opening));
  assert.ok(!crossesOpening({ x: 200, y: 540, size: 60 }, 510, opening));
});

test("Reward boundaries", () => {
  assert.equal(reward(80).min, 0);
  assert.equal(reward(81).min, 81);
  assert.equal(reward(150).min, 81);
  assert.equal(reward(151).min, 151);
  assert.equal(reward(220).min, 151);
  assert.equal(reward(221).min, 221);
});

test("Pause/resume prevents overlapping loops", () => {
  let calls = 0,
    cancels = 0;
  global.requestAnimationFrame = () => ++calls;
  global.cancelAnimationFrame = () => cancels++;
  const g = Object.create(Game.prototype);
  g.mode = "running";
  g.frame = 10;
  g.keys = new Set();
  g.pause();
  g.pause();
  assert.equal(cancels, 1);
  assert.equal(g.mode, "paused");
  g.resume();
  g.resume();
  assert.equal(calls, 1);
  assert.equal(g.mode, "running");
  g.stop();
  assert.equal(g.mode, "idle");
});

test("Magnet only moves positive products", () => {
  const g = Object.create(Game.prototype);
  Object.assign(g, {
    state: createState(),
    keys: new Set(),
    x: 200,
    target: 200,
    h: 710,
    bagScale: 1.0,
    currentBagWidth: CONFIG.bag.width,
    spawnTime: 10,
    items: [
      {
        kind: "product",
        product: PRODUCTS[0],
        x: 250,
        y: 400,
        size: 64,
        speed: 100,
      },
      { kind: "bomb", x: 250, y: 400, size: 64, speed: 100 },
      { kind: "damaged", x: 250, y: 400, size: 64, speed: 100 },
    ],
    entries: [],
    labels: [],
    particles: [],
    shake: 0,
    flash: 0,
    messageTime: 0,
    lastCountdown: 6,
  });
  g.state.effects.magnet = 4;
  g.update(0.1);
  assert.ok(g.items[0].x < 250);
  assert.equal(g.items[1].x, 250);
  assert.equal(g.items[2].x, 250);
});
