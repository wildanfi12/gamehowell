import { CONFIG, BONUSES } from "./config.js";
import { loadAssets } from "./assets.js";
import { Audio } from "./audio.js";
import { Game } from "./game.js";
import { read, bestScore, saveScore, setMuted, saveBest } from "./storage.js";
import { reward, difficulty } from "./rules.js";
const $ = (id) => document.getElementById(id);
let current = "loading",
  result = null,
  saved = false,
  scoreAnimation = 0;
const audio = new Audio(read().muted);
function show(id) {
  cancelAnimationFrame(scoreAnimation);
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.toggle("hidden", s.id !== id));
  current = id;
  if (id === "home") $("home-best").textContent = bestScore();
  $("cabinet").scrollIntoView({ block: "start" });
}
function soundUI() {
  $("sound").textContent = audio.muted ? "♫̸" : "♪";
  $("sound").setAttribute(
    "aria-label",
    audio.muted ? "Aktifkan suara" : "Matikan suara",
  );
  $("sound").setAttribute("aria-pressed", String(!audio.muted));
}
soundUI();
$("sound").onclick = () => {
  audio.unlock();
  audio.muted = !audio.muted;
  setMuted(audio.muted);
  soundUI();
  audio.play();
};
const assets = await loadAssets((value) => ($("load-progress").value = value));
if (assets.missing.length) {
  $("asset-warning").textContent =
    `${assets.missing.length} aset belum tersedia; penanda sementara digunakan.`;
  $("asset-warning").classList.remove("hidden");
}
const game = new Game($("game"), assets, audio, update, end);
function start() {
  result = null;
  saved = false;
  $("score-form").reset();
  $("save-status").textContent = "";
  $("score-form").querySelector("button").disabled = false;
  $("pause-overlay").classList.add("hidden");
  show("play");
  game.start();
}
function pause() {
  if (game.mode === "running") {
    game.pause();
    $("pause-overlay").classList.remove("hidden");
    $("resume").focus();
  }
}
function update(g) {
  const s = g.state,
    left = Math.ceil(CONFIG.duration - s.time);
  $("score").textContent = s.score;
  $("timer").textContent = left;
  $("timer-wrap").classList.toggle("urgent", left <= 5);
  $("time-fill").style.width = `${(1 - s.time / CONFIG.duration) * 100}%`;
  $("lives").textContent =
    "♥".repeat(s.lives) + "♡".repeat(CONFIG.lives - s.lives);
  $("lives").setAttribute("aria-label", `${s.lives} nyawa`);
  $("stage").textContent = difficulty(s.time).label;
  $("announcement").textContent = g.messageTime > 0 ? g.message : "";
  const effects = Object.entries(s.effects)
    .filter(([, t]) => t > 0)
    .map(
      ([id, t]) =>
        `${BONUSES.find((b) => b.id === id).label} ${Math.ceil(t)} dtk`,
    );
  $("effects").replaceChildren(
    ...effects.map((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      return span;
    }),
  );
  if (CONFIG.debug) {
    $("debug").hidden = false;
    $("debug").textContent =
      `FPS ${Math.round(g.fps || 0)} | Item ${g.items.length}\nStatus ${g.mode} | Interval ${difficulty(s.time).interval}s\nKecepatan ${difficulty(s.time).speed} | waktu ${s.time.toFixed(1)}`;
  }
}
function end(state) {
  result = { ...state };
  saved = false;
  const prior = bestScore(),
    record = state.score > prior;
  audio.play(record ? "record" : "end");
  show("results");
  $("result-kicker").textContent = record
    ? "REKOR BARU!"
    : state.lives === 0
      ? "NYAWA HABIS!"
      : "WAKTU HABIS!";
  $("record-label").textContent = record
    ? "✦ Rekor terbaikmu sejauh ini"
    : "Terus latihan, terus melesat.";
  $("caught").textContent = state.caught;
  $("combo").textContent = state.bestCombo;
  $("best").textContent = Math.max(prior, state.score);
  $("reward-name").textContent = reward(state.score).name;
  const begin = performance.now();
  function count(now) {
    const t = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : Math.min(1, (now - begin) / 650);
    $("final-score").textContent = Math.round(state.score * (1 - (1 - t) ** 3));
    if (t < 1) scoreAnimation = requestAnimationFrame(count);
  }
  scoreAnimation = requestAnimationFrame(count);
  // Save the best immediately, even if the player skips entering a nickname.
  saveBest(state.score);
}
function leaderboard() {
  const scores = read().scores;
  const list = $("leaderboard-list");
  list.replaceChildren();
  if (!scores.length) {
    const p = document.createElement("p");
    p.className = "notice";
    p.textContent =
      "Belum ada skor tersimpan. Main, lalu simpan namamu setelah permainan!";
    list.append(p);
  }
  scores.slice(0, 20).forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "leader-row";
    const rank = document.createElement("span");
    rank.textContent = String(i + 1).padStart(2, "0");
    const details = document.createElement("div"),
      name = document.createElement("b"),
      date = document.createElement("small"),
      score = document.createElement("strong");
    name.textContent = s.name;
    date.textContent = new Date(s.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    score.textContent = s.score;
    details.append(name, date);
    row.append(rank, details, score);
    list.append(row);
  });
  show("leaderboard");
}
$("score-form").onsubmit = (e) => {
  e.preventDefault();
  if (!result || saved) return;
  saved = true;
  const persisted = saveScore($("nickname").value, result.score);
  $("save-status").textContent = persisted
    ? "Skor tersimpan di browser ini."
    : "Penyimpanan browser tidak tersedia; skor hanya tersimpan selama sesi.";
  $("score-form").querySelector("button").disabled = true;
};
document.querySelectorAll("[data-action],[data-screen]").forEach((button) =>
  button.addEventListener("click", () => {
    audio.unlock();
    audio.play();
    const action = button.dataset.action;
    if (action === "start") start();
    else if (action === "leaderboard") leaderboard();
    else if (action === "exit") {
      game.stop();
      $("pause-overlay").classList.add("hidden");
      show("home");
    } else show(button.dataset.screen);
  }),
);
$("pause").onclick = pause;
$("resume").onclick = () => {
  $("pause-overlay").classList.add("hidden");
  audio.unlock();
  game.resume();
};
$("brand").onclick = (e) => {
  e.preventDefault();
  if (current === "play") pause();
  else show("home");
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("blur", pause);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && current === "play") {
    if (game.mode === "running") pause();
    else if (game.mode === "paused") $("resume").click();
  }
});
CONFIG.rewards.forEach((r, i) => {
  const row = document.createElement("div");
  row.className = "prize-row";
  const range = document.createElement("span"),
    name = document.createElement("b");
  range.textContent =
    i === CONFIG.rewards.length - 1
      ? `${r.min}+`
      : `${r.min}–${CONFIG.rewards[i + 1].min - 1}`;
  name.textContent = r.name;
  row.append(range, name);
  $("prize-list").append(row);
});
show("home");
