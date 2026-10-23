import test from "node:test";
import assert from "node:assert/strict";
import { loadAssets } from "../js/assets.js";
import { PRODUCTS, CONFIG } from "../js/config.js";
import { access } from "node:fs/promises";
test("All twelve asset files exist", async () => {
  await Promise.all(
    [...PRODUCTS.map((p) => p.image), CONFIG.bagImage, CONFIG.bombImage].map(
      (p) => access(new URL("../" + p, import.meta.url)),
    ),
  );
});
test("Missing images resolve safely and complete loading progress", async () => {
  const Original = global.Image;
  global.Image = class {
    set src(value) {
      queueMicrotask(() => this.onerror());
    }
  };
  try {
    const progress = [];
    const result = await loadAssets((v) => progress.push(v));
    assert.equal(result.missing.length, 12);
    assert.equal(result.images.size, 0);
    assert.equal(progress.at(-1), 1);
  } finally {
    global.Image = Original;
  }
});
