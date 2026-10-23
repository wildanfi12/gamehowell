import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../js/game.js";
import { createState, tick } from "../js/rules.js";

test("A slow frame consumes elapsed time without skipping physics or extending the round", () => {
  let ended = 0,
    scheduled = 0;
  const steps = [];
  global.requestAnimationFrame = () => ++scheduled;
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    mode: "running",
    last: 0,
    state: createState(),
    keys: new Set(),
    uiTime: 0,
    render() {},
    onUpdate() {},
    onEnd() {
      ended++;
    },
    update(dt) {
      steps.push(dt);
      tick(this.state, dt);
    },
  });
  game.loop(800);
  assert.equal(game.state.time, 0.8);
  assert.ok(steps.every((dt) => dt <= 1 / 60));
  assert.equal(scheduled, 1);
  game.loop(31000);
  assert.equal(game.state.time, 30);
  assert.equal(ended, 1);
  assert.equal(game.mode, "ended");
  game.loop(32000);
  assert.equal(ended, 1);
});

test("A second pointer cannot move or release the active drag", () => {
  const events = {};
  global.matchMedia = () => ({ matches: false });
  global.ResizeObserver = class {
    observe() {}
  };
  global.window = { addEventListener() {} };
  const canvas = {
    getContext: () => ({}),
    getBoundingClientRect: () => ({ left: 0, width: 400, height: 710 }),
    addEventListener(name, fn) {
      events[name] = fn;
    },
    setPointerCapture() {},
  };
  const game = new Game(
    canvas,
    { images: new Map() },
    {},
    () => {},
    () => {},
  );
  game.mode = "running";
  game.w = 400;
  events.pointerdown({
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: 120,
  });
  events.pointerdown({
    pointerId: 2,
    isPrimary: false,
    button: 0,
    clientX: 300,
  });
  events.pointermove({ pointerId: 2, clientX: 340 });
  events.pointerup({ pointerId: 2 });
  assert.equal(game.target, 120);
  assert.equal(game.dragging, true);
  events.pointermove({ pointerId: 1, clientX: 200 });
  assert.equal(game.target, 200);
  events.lostpointercapture({ pointerId: 1 });
  assert.equal(game.dragging, false);
  assert.equal(game.activePointer, null);
});

test("Storage quota failure preserves session scores and ignores invalid saved best", async () => {
  global.localStorage = {
    getItem: (key) =>
      key === "howell-best"
        ? "Infinity"
        : JSON.stringify({
            scores: [{ name: "Old", score: 10, date: "2026-10-22" }],
          }),
    setItem() {
      throw Error("quota");
    },
  };
  const storage = await import("../js/storage.js?quota");
  assert.equal(storage.saveScore("New", 50), false);
  assert.equal(storage.read().scores[0].score, 50);
  assert.equal(storage.bestScore(), 50);
  storage.saveScore("Next", 70);
  assert.equal(storage.read().scores.length, 3);
  storage.saveBest(100);
  assert.equal(storage.bestScore(), 100);
});
