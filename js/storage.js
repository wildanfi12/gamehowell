const KEY = "howell-catch-win-v2";
const SYNC_URL = "https://ntfy.sh/howell_indocomtech_leaderboard_v2";

const DEFAULT_SCORES = [
  { name: "Andrey", score: 700, date: "2026-10-23T06:45:59.320Z" },
  { name: "rida dan faiz", score: 605, date: "2026-10-23T06:41:53.038Z" },
  { name: "rida", score: 515, date: "2026-10-23T04:32:00.000Z" },
  { name: "Bintang Howell", score: 475, date: "2026-10-23T04:47:15.225Z" },
  { name: "Obi", score: 430, date: "2026-10-23T06:57:28.642Z" },
  { name: "Pemain Howell", score: 400, date: "2026-10-23T04:25:28.263Z" },
  { name: "wil", score: 380, date: "2026-10-23T04:20:52.568Z" },
  { name: "Wildan Pratama", score: 350, date: "2026-10-23T04:08:21.558Z" },
  { name: "dadang", score: 350, date: "2026-10-23T04:09:29.930Z" },
  { name: "Wildan", score: 280, date: "2026-10-23T03:36:01.834Z" },
  { name: "Rizky", score: 240, date: "2026-10-23T03:46:01.834Z" },
  { name: "Budi", score: 195, date: "2026-10-23T03:56:01.834Z" },
  { name: "Sarah", score: 160, date: "2026-10-23T04:06:01.834Z" },
  { name: "Nick", score: 160, date: "2026-10-23T06:03:40.364Z" },
];

let memory = { scores: [], muted: false },
  loaded = false,
  sessionBest = 0,
  syncing = false;

const validScore = (value) => Number.isSafeInteger(value) && value >= 0;

export function read(force = false) {
  if (loaded && !force) return memory;
  loaded = true;
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      const v1 = localStorage.getItem("howell-catch-win-v1");
      if (v1) {
        try {
          const parsedV1 = JSON.parse(v1);
          if (parsedV1 && typeof parsedV1.muted === "boolean") {
            memory.muted = parsedV1.muted;
          }
        } catch {}
      }
    }
    const data = raw ? JSON.parse(raw) : null;
    if (data && Array.isArray(data.scores)) {
      memory = {
        muted: !!data.muted,
        scores: data.scores
          .filter(
            (s) =>
              s &&
              typeof s.name === "string" &&
              validScore(s.score) &&
              Number.isFinite(Date.parse(s.date)),
          )
          .map((s) => ({
            name: s.name.slice(0, 20),
            score: s.score,
            date: s.date,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 50),
      };
    } else if (data && typeof data.muted === "boolean") {
      memory.muted = data.muted;
    }
  } catch {}

  // Seed default scores if database empty
  if (memory.scores.length === 0) {
    memory.scores = [...DEFAULT_SCORES];
    write();
  }

  return memory;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
    return true;
  } catch {
    return false;
  }
}

export function validatePlayerName(name) {
  if (typeof name !== "string") {
    return { valid: false, error: "Masukkan nama minimal 2 karakter.", name: "" };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: "Masukkan nama minimal 2 karakter.", name: trimmed };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: "Nama maksimal 20 karakter.", name: trimmed.slice(0, 20) };
  }
  return { valid: true, error: "", name: trimmed };
}

export function getLastPlayerName() {
  try {
    return localStorage.getItem("howell-player-name") || "";
  } catch {
    return "";
  }
}

export function saveLastPlayerName(name) {
  try {
    const trimmed = (name || "").trim().slice(0, 20);
    if (trimmed) localStorage.setItem("howell-player-name", trimmed);
  } catch {}
}

export function getPlayerBest(name) {
  read();
  const cleanName = (name || "").trim().toLowerCase();
  if (!cleanName) return 0;
  const existing = memory.scores.find(
    (s) => s.name.toLowerCase() === cleanName,
  );
  return existing ? existing.score : 0;
}

export function registerPlayer(name, score = 0) {
  read();
  const cleanName = (name || "").trim().slice(0, 20);
  if (!cleanName || cleanName.length < 2) return;
  const existing = memory.scores.find(
    (s) => s.name.toLowerCase() === cleanName.toLowerCase(),
  );
  const now = new Date().toISOString();
  if (!existing) {
    // Only register brand new player with their own score (0 if new)
    const initialScore = Math.max(0, Number(score) || 0);
    memory.scores.push({
      name: cleanName,
      score: initialScore,
      date: now,
    });
    memory.scores.sort((a, b) => b.score - a.score);
    memory.scores = memory.scores.slice(0, 50);
    write();
    postScoreToCloud(cleanName, initialScore, now).catch(() => {});
  }
}

export function saveScore(name, score) {
  read();
  if (!validScore(score)) return false;
  const cleanName = (name || "").trim().slice(0, 20) || "Pemain Howell";
  const now = new Date().toISOString();
  const existingIndex = memory.scores.findIndex(
    (s) => s.name.toLowerCase() === cleanName.toLowerCase(),
  );
  if (existingIndex >= 0) {
    // Update score if it exceeds previous score or if previous score was 0
    if (score >= memory.scores[existingIndex].score || memory.scores[existingIndex].score === 0) {
      memory.scores[existingIndex].score = score;
      memory.scores[existingIndex].date = now;
    }
  } else {
    memory.scores.push({
      name: cleanName,
      score,
      date: now,
    });
  }
  memory.scores.sort((a, b) => b.score - a.score);
  memory.scores = memory.scores.slice(0, 50);
  const ok = write();
  postScoreToCloud(cleanName, score, now).catch(() => {});
  return ok;
}

async function postScoreToCloud(name, score, date) {
  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
    await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ name, score, date: date || new Date().toISOString() }),
      signal: controller ? controller.signal : undefined,
    });
    if (timer) clearTimeout(timer);
  } catch {}
}

export async function syncScores() {
  if (syncing) return memory.scores;
  syncing = true;
  read();

  try {
    let cloudScores = [];
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;
      const res = await fetch(`${SYNC_URL}/json?poll=1&since=all`, {
        cache: "no-store",
        signal: controller ? controller.signal : undefined,
      });
      if (timer) clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split("\n");
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.event === "message" && parsed.message) {
              const payload = JSON.parse(parsed.message);
              if (payload && payload.name && validScore(payload.score)) {
                cloudScores.push(payload);
              }
            }
          } catch {}
        }
      }
    } catch {}

    const map = new Map();

    const mergeItem = (item) => {
      if (!item || typeof item.name !== "string" || !validScore(item.score)) return;
      const name = item.name.trim().slice(0, 20);
      if (!name) return;
      const key = name.toLowerCase();
      const prev = map.get(key);
      if (!prev) {
        map.set(key, {
          name,
          score: item.score,
          date: item.date || new Date().toISOString(),
        });
      } else {
        if (item.score > prev.score) {
          prev.score = item.score;
          prev.name = name;
          prev.date = item.date || prev.date;
        } else if (item.score === prev.score) {
          if (item.date && prev.date && item.date > prev.date) {
            prev.date = item.date;
          }
        }
      }
    };

    DEFAULT_SCORES.forEach(mergeItem);
    cloudScores.forEach(mergeItem);
    memory.scores.forEach(mergeItem);

    const merged = Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    memory.scores = merged;
    write();
    return merged;
  } finally {
    syncing = false;
  }
}

export async function fetchCloudScores() {
  return syncScores();
}

export function setMuted(value) {
  read();
  memory.muted = !!value;
  write();
}

export function bestScore() {
  let stored = 0;
  try {
    const value = Number(localStorage.getItem("howell-best"));
    if (validScore(value)) stored = value;
  } catch {}
  return Math.max(0, stored, sessionBest, ...read().scores.map((s) => s.score));
}

export function saveBest(score) {
  if (!validScore(score)) return;
  sessionBest = Math.max(bestScore(), score);
  try {
    localStorage.setItem("howell-best", String(sessionBest));
  } catch {}
}
