import { CONFIG, BONUSES } from "./config.js";
import { loadAssets } from "./assets.js";
import { Audio } from "./audio.js";
import { Game } from "./game.js";
import {
  read,
  bestScore,
  saveScore,
  setMuted,
  saveBest,
  getLastPlayerName,
  saveLastPlayerName,
  validatePlayerName,
  registerPlayer,
  getPlayerBest,
  syncScores,
  fetchCloudScores,
} from "./storage.js";
import { reward, difficulty } from "./rules.js";
import { getAllSkins, getSkin } from "./skins.js";
import { getPlayerProfile, savePlayerProfile, getSelectedSkin, setSelectedSkin, unlockSkinIfEligible, markCelebrationShown } from "./storage.js";

const $ = (id) => document.getElementById(id);
let current = "loading",
  result = null,
  saved = false,
  scoreAnimation = 0,
  currentPlayerName = "",
  latestPlayedDate = null;

const audio = new Audio(read().muted);

function show(id) {
  cancelAnimationFrame(scoreAnimation);
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.toggle("hidden", s.id !== id));
  current = id;
  const name = currentPlayerName || getLastPlayerName();
  if (id === "home") {
    $("home-best").textContent = name ? getPlayerBest(name) : 0;
    renderHomeTopScores();
    const equipped = getSelectedSkin(name);
    game.setSkin(equipped);
  } else if (id === "skins") {
    renderSkinsUI();
  }
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

const initialPlayerName = getLastPlayerName();
const game = new Game($("game"), assets, audio, update, end, getSelectedSkin(initialPlayerName));
window.game = game;

// Pre-fetch live cloud scores on initial startup
fetchCloudScores().then(() => {
  renderHomeTopScores();
  if (current === "leaderboard") renderLeaderboardRows();
});

function start() {
  if (current === "home") {
    const inputEl = $("player-name-input");
    const errorEl = $("player-name-error");
    const val = validatePlayerName(inputEl ? inputEl.value : "");
    if (!val.valid) {
      if (errorEl) {
        errorEl.textContent = val.error;
        errorEl.classList.remove("hidden");
      }
      if (inputEl) inputEl.focus();
      return;
    }
    currentPlayerName = val.name;
    saveLastPlayerName(val.name);
    registerPlayer(val.name, getPlayerBest(val.name));
    if (errorEl) errorEl.classList.add("hidden");
  }

  result = null;
  saved = false;
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
    totalDuration = s.duration || CONFIG.duration,
    left = Math.ceil(totalDuration - s.time);
  $("score").textContent = s.score;
  $("timer").textContent = left;
  $("timer-wrap").classList.toggle("urgent", left <= 5);
  $("time-fill").style.width = `${Math.min(100, Math.max(0, (left / totalDuration) * 100))}%`;
  $("lives").textContent =
    "♥".repeat(s.lives) + "♡".repeat(CONFIG.lives - s.lives);
  $("lives").setAttribute("aria-label", `${s.lives} nyawa`);
  $("stage").textContent = difficulty(s.time).label;
  $("announcement").textContent = g.messageTime > 0 ? g.message : "";

  const effects = Object.entries(s.effects)
    .filter(([, t]) => t > 0)
    .map(([id, t]) => {
      const b = BONUSES.find((b) => b.id === id);
      return `${b ? b.label : id} ${Math.ceil(t)} dtk`;
    });

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
      `FPS ${Math.round(g.fps || 0)} | Item ${g.items.length}\nStatus ${g.mode} | BagScale ${g.bagScale.toFixed(2)}\nKecepatan ${difficulty(s.time).speed} | Waktu ${s.time.toFixed(1)}`;
  }
}

function end(state) {
  result = { ...state };
  saved = true;
  const player = currentPlayerName || getLastPlayerName() || "Pemain Howell";
  const prior = getPlayerBest(player),
    record = state.score > prior;

  audio.play(record ? "record" : "end");
  show("results");

  $("result-kicker").textContent = record
    ? "REKOR BARU!"
    : state.lives === 0
      ? "NYAWA HABIS!"
      : "WAKTU HABIS!";

  $("result-greeting").textContent = `Hebat, ${player}!`;
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

  latestPlayedDate = new Date().toISOString();
  saveScore(player, state.score);
  renderHomeTopScores();
  $("save-status").textContent = "★ Skor kamu tercatat di papan skor booth!";

  saveBest(state.score);

  const unlockInfo = unlockSkinIfEligible(player, state.score);
  if (unlockInfo.showCelebration) {
    setTimeout(() => {
      showSkinUnlockCelebration(player);
    }, 700);
  }
}


function showSkinUnlockCelebration(player) {
  const modal = $("skin-unlock-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  audio.play("unlock");

  $("btn-equip-now").onclick = () => {
    audio.unlock();
    audio.play();
    setSelectedSkin(player, "howell-chomper");
    game.setSkin("howell-chomper");
    markCelebrationShown(player);
    modal.classList.add("hidden");
    if (current === "skins") renderSkinsUI();
  };

  $("btn-equip-later").onclick = () => {
    audio.unlock();
    audio.play();
    markCelebrationShown(player);
    modal.classList.add("hidden");
  };
}

function renderHomeTopScores() {
  const list = $("home-top-scores-list");
  if (!list) return;
  const scores = read().scores.slice(0, 3);
  if (typeof list.replaceChildren === "function") {
    list.replaceChildren();
  } else {
    while (list.firstChild) list.removeChild(list.firstChild);
  }
  for (let i = 0; i < 3; i += 1) {
    const entry = scores[i];
    const row = document.createElement("li");
    const rank = document.createElement("span");
    const name = document.createElement("b");
    const score = document.createElement("strong");
    rank.textContent = i + 1;
    name.textContent = entry?.name || "Belum ada nama";
    score.textContent = entry ? entry.score : "—";
    row.append(rank, name, score);
    list.appendChild(row);
  }
}

function renderSkinsUI() {
  try {
    const player = currentPlayerName || getLastPlayerName() || "Pemain Howell";
    const profile = getPlayerProfile(player);
    const container = $("skins-grid") || $("skins-list") || document.querySelector(".skins-grid");
    if (!container) return;

    if (typeof container.replaceChildren === "function") {
      container.replaceChildren();
    } else {
      while (container.firstChild) container.removeChild(container.firstChild);
    }

    const allSkins = getAllSkins();
    const unlockedSkins = Array.isArray(profile?.unlockedSkins) ? profile.unlockedSkins : ["howell-original"];
    const highScore = profile?.highScore || 0;
    const selectedSkin = profile?.selectedSkin || "howell-original";

    allSkins.forEach((skin) => {
      const isChomper = skin.id === "howell-chomper";
      const isUnlocked = unlockedSkins.includes(skin.id) || (isChomper && highScore >= 750);
      const isEquipped = selectedSkin === skin.id;

      const card = document.createElement("div");
      card.className = "skin-card" + (isEquipped ? " equipped" : "") + (isUnlocked ? " unlocked" : " locked");

      const imgWrap = document.createElement("div");
      imgWrap.className = "skin-card-preview";

      const img = document.createElement("img");
      img.src = skin.assetPath || (isChomper ? "assets/skins/howell-chomper.png" : "assets/player/howell-totebag.png");
      img.alt = skin.name || "Skin";
      img.className = "skin-card-img" + (isChomper ? " chomper-preview" : "");
      imgWrap.appendChild(img);

      if (!isUnlocked) {
        const lockOverlay = document.createElement("div");
        lockOverlay.className = "skin-lock-overlay";
        lockOverlay.innerHTML = '<span class="lock-icon">🔒</span><b class="lock-label">BUKA DI 750 POIN</b>';
        imgWrap.appendChild(lockOverlay);
      }

      const info = document.createElement("div");
      info.className = "skin-card-info";

      const title = document.createElement("h3");
      title.textContent = skin.name || (isChomper ? "HOWELL CHOMPER" : "HOWELL ORIGINAL");

      const desc = document.createElement("p");
      desc.className = "skin-card-desc";
      desc.textContent = skin.description || "";

      info.appendChild(title);
      info.appendChild(desc);

      if (!isUnlocked) {
        const progressBox = document.createElement("div");
        progressBox.className = "skin-progress-box";
        const currentPts = highScore;
        const remaining = Math.max(0, 750 - currentPts);
        const pct = Math.min(100, Math.round((currentPts / 750) * 100));

        progressBox.innerHTML = `
          <div class="progress-labels">
            <span>REKOR: <b>${currentPts} / 750 POIN</b></span>
            <span>${remaining} poin lagi</span>
          </div>
          <div class="skin-progress-track">
            <div class="skin-progress-bar" style="width: ${pct}%"></div>
          </div>
        `;
        info.appendChild(progressBox);
      } else {
        const badge = document.createElement("div");
        badge.className = "skin-status-badge";
        badge.textContent = isEquipped ? "SEDANG DIGUNAKAN" : "TERBUKA ✓";
        info.appendChild(badge);
      }

      const btn = document.createElement("button");
      btn.className = "btn-skin-select " + (isEquipped ? "btn-active" : isUnlocked ? "btn-equip" : "btn-locked");
      if (isEquipped) {
        btn.textContent = "SEDANG DIGUNAKAN";
        btn.disabled = true;
      } else if (isUnlocked) {
        btn.textContent = "GUNAKAN";
        btn.onclick = () => {
          audio.unlock();
          audio.play();
          setSelectedSkin(player, skin.id);
          game.setSkin(skin.id);
          renderSkinsUI();
        };
      } else {
        btn.textContent = "TERKUNCI";
        btn.disabled = true;
      }

      card.appendChild(imgWrap);
      card.appendChild(info);
      card.appendChild(btn);
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error in renderSkinsUI:", err);
  }
}

function renderLeaderboardRows() {
  const scores = read().scores;
  const list = $("leaderboard-list");
  list.replaceChildren();

  const syncStatusEl = $("leaderboard-sync-status");
  if (syncStatusEl) {
    syncStatusEl.textContent = `✓ Terhubung · ${scores.length} pemain tercatat`;
  }

  const currentNameClean = (currentPlayerName || getLastPlayerName() || "").trim().toLowerCase();
  let playerRank = -1;
  let playerScore = 0;

  if (!scores.length) {
    const p = document.createElement("p");
    p.className = "notice";
    p.textContent =
      "Belum ada skor tersimpan. Masukkan namamu dan jadilah yang pertama di papan peringkat!";
    list.append(p);
  } else {
    scores.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "leader-row";
      const isSelf = currentNameClean && s.name.trim().toLowerCase() === currentNameClean;
      if (isSelf) {
        row.classList.add("highlight-self");
        if (playerRank === -1) {
          playerRank = i + 1;
          playerScore = s.score;
        }
      }

      const rank = document.createElement("span");
      rank.className = "rank-badge";
      if (i === 0) {
        rank.textContent = "🥇 1";
        rank.classList.add("gold");
      } else if (i === 1) {
        rank.textContent = "🥈 2";
        rank.classList.add("silver");
      } else if (i === 2) {
        rank.textContent = "🥉 3";
        rank.classList.add("bronze");
      } else {
        rank.textContent = String(i + 1).padStart(2, "0");
      }

      const details = document.createElement("div"),
        name = document.createElement("b"),
        date = document.createElement("small"),
        score = document.createElement("strong");

      name.textContent = s.name + (isSelf ? " (Kamu)" : "");
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
  }

  const myRankEl = $("leaderboard-my-rank");
  if (myRankEl) {
    if (playerRank > 0) {
      myRankEl.innerHTML = `📍 Peringkat Kamu: <b>#${playerRank}</b> · ${currentPlayerName || getLastPlayerName()} (<strong>${playerScore}</strong> poin)`;
      myRankEl.classList.remove("hidden");
    } else {
      myRankEl.classList.add("hidden");
    }
  }
}

async function leaderboard() {
  renderLeaderboardRows();
  show("leaderboard");
  const cloud = await syncScores();
  renderHomeTopScores();
  if (cloud) renderLeaderboardRows();
}

document.querySelectorAll("[data-action],[data-screen]").forEach((button) =>
  button.addEventListener("click", () => {
    audio.unlock();
    audio.play();
    const action = button.dataset.action;
    if (action === "start") {
      start();
    } else if (action === "leaderboard") {
      const nameInput = $("player-name-input");
      if (nameInput && nameInput.value.trim().length >= 2) {
        currentPlayerName = nameInput.value.trim();
        saveLastPlayerName(currentPlayerName);
        registerPlayer(currentPlayerName, getPlayerBest(currentPlayerName));
      }
      leaderboard();
    } else if (action === "exit") {
      if (game.state.score > 0) {
        saveScore(currentPlayerName || "Pemain Howell", game.state.score);
      }
      game.stop();
      $("pause-overlay").classList.add("hidden");
      show("home");
    } else {
      if (button.dataset.screen === "skins") {
        renderSkinsUI();
      }
      show(button.dataset.screen);
    }
  }),
);

$("btn-refresh-leaderboard")?.addEventListener("click", async () => {
  const btn = $("btn-refresh-leaderboard");
  if (btn) btn.textContent = "⏳ Memperbarui...";
  await syncScores(true);
  renderLeaderboardRows();
  if (btn) btn.textContent = "✓ Selesai";
  setTimeout(() => {
    if (btn) btn.textContent = "↻ Segarkan";
  }, 1200);
});

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

const nameInput = $("player-name-input");
if (nameInput) {
  const savedName = getLastPlayerName();
  if (savedName) {
    nameInput.value = savedName;
    currentPlayerName = savedName;
    $("home-best").textContent = getPlayerBest(savedName);
  }
  nameInput.addEventListener("input", () => {
    $("player-name-error")?.classList.add("hidden");
    const name = nameInput.value.trim();
    currentPlayerName = name;
    $("home-best").textContent = name ? getPlayerBest(name) : 0;
    if (name) {
      const prof = getPlayerProfile(name);
      game.setSkin(prof.selectedSkin);
    }
  });
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      start();
    }
  });
}

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

renderHomeTopScores();
renderSkinsUI();
show("home");
