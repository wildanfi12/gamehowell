import { CONFIG, PRODUCTS } from "./config.js";

export function createState() {
  return {
    time: 0,
    score: 0,
    lives: CONFIG.lives,
    combo: 0,
    caught: 0,
    bestCombo: 0,
    effects: { double: 0, magnet: 0, slow: 0, totebag: 0 },
  };
}

export function difficulty(time) {
  return CONFIG.difficulty.filter((d) => time >= d.at).at(-1);
}

export function tick(s, dt) {
  const maxDur = s.duration || CONFIG.duration;
  s.time = Math.min(maxDur, s.time + dt);
  for (const key in s.effects)
    s.effects[key] = Math.max(0, s.effects[key] - dt);
}

export function reward(score) {
  return CONFIG.rewards.filter((r) => score >= r.min).at(-1);
}

export function pickProduct(random = Math.random) {
  let value = random() * PRODUCTS.reduce((n, p) => n + p.weight, 0);
  return PRODUCTS.find((p) => (value -= p.weight) < 0) || PRODUCTS.at(-1);
}

export function collect(s, item) {
  if (item.collected) return null;
  item.collected = true;
  if (item.kind === "product") {
    const points = item.product.points * (s.effects.double > 0 ? 2 : 1);
    s.score += points;
    s.combo++;
    s.caught++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    return {
      text: `+${points}`,
      tone: "catch",
      combo: { 3: "KEREN!", 5: "HEBAT!", 10: "MASTER HOWELL!" }[s.combo],
    };
  }
  if (item.kind === "bomb") {
    s.lives = Math.max(0, s.lives - 1);
    s.combo = 0;
    return { text: "−1 NYAWA", tone: "bomb", negative: true };
  }
  if (item.kind === "damaged") {
    s.score = Math.max(0, s.score - CONFIG.damage);
    s.combo = 0;
    return { text: `−${CONFIG.damage}`, tone: "damage", negative: true };
  }
  const id = item.bonus.id;
  if (id === "life") s.lives = Math.min(CONFIG.lives, s.lives + 1);
  else if (id === "points")
    s.score += CONFIG.bonusPoints * (s.effects.double > 0 ? 2 : 1);
  else if (id === "totebag")
    s.effects.totebag = CONFIG.toteBagExpansion.duration;
  else if (id === "time5") {
    s.duration = (s.duration || CONFIG.duration) + 5;
    const pts = 5 * (s.effects.double > 0 ? 2 : 1);
    s.score += pts;
    return {
      text: "+5 DETIK & +5 POIN!",
      tone: "time5",
      timeAdded: 5,
    };
  } else if (id === "time10") {
    s.duration = (s.duration || CONFIG.duration) + 10;
    const pts = 10 * (s.effects.double > 0 ? 2 : 1);
    s.score += pts;
    return {
      text: "+10 DETIK & +10 POIN!",
      tone: "time10",
      timeAdded: 10,
    };
  } else s.effects[id] = CONFIG.powerups[id];

  return {
    text:
      id === "points"
        ? `+${CONFIG.bonusPoints * (s.effects.double > 0 ? 2 : 1)}`
        : id === "totebag"
          ? "TOTEBAG +50%!"
          : item.bonus.label.toUpperCase(),
    tone: id,
  };
}

export function crossesOpening(item, previousY, opening) {
  return (
    previousY + item.size * 0.35 <= opening.y &&
    item.y + item.size * 0.35 >= opening.y &&
    Math.abs(item.x - opening.x) <= opening.width / 2
  );
}
