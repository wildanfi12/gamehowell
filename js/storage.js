const KEY = "howell-catch-win-v1";
const CLOUD_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a166ed76586416";

let memory = { scores: [], muted: false },
  loaded = false,
  sessionBest = 0;

const validScore = (value) => Number.isSafeInteger(value) && value >= 0;

export function read(force = false) {
  if (loaded && !force) return memory;
  loaded = true;
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
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
    }
  } catch {}
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

export function registerPlayer(name, score = 0) {
  read();
  const cleanName = (name || "").trim().slice(0, 20);
  if (!cleanName) return;
  const existing = memory.scores.find(
    (s) => s.name.toLowerCase() === cleanName.toLowerCase(),
  );
  if (!existing) {
    memory.scores.push({
      name: cleanName,
      score: Math.max(0, score),
      date: new Date().toISOString(),
    });
    memory.scores.sort((a, b) => b.score - a.score);
    memory.scores = memory.scores.slice(0, 50);
    write();
    pushCloudScore(cleanName, Math.max(0, score)).catch(() => {});
  }
}

export function saveScore(name, score) {
  read();
  if (!validScore(score)) return false;
  const cleanName = (name || "").trim().slice(0, 20) || "Pemain Howell";
  const existingIndex = memory.scores.findIndex(
    (s) => s.name.toLowerCase() === cleanName.toLowerCase(),
  );
  if (existingIndex >= 0) {
    if (score >= memory.scores[existingIndex].score) {
      memory.scores[existingIndex].score = score;
      memory.scores[existingIndex].date = new Date().toISOString();
    }
  } else {
    memory.scores.push({
      name: cleanName,
      score,
      date: new Date().toISOString(),
    });
  }
  memory.scores.sort((a, b) => b.score - a.score);
  memory.scores = memory.scores.slice(0, 50);
  const ok = write();
  pushCloudScore(cleanName, score).catch(() => {});
  return ok;
}

export async function fetchCloudScores() {
  try {
    const res = await fetch(CLOUD_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.data?.scores && Array.isArray(json.data.scores)) {
      read();
      const local = memory.scores;
      const map = new Map();

      for (const s of local) {
        if (!s || !s.name || !validScore(s.score)) continue;
        const key = s.name.toLowerCase();
        if (!map.has(key) || map.get(key).score < s.score) {
          map.set(key, s);
        }
      }

      for (const s of json.data.scores) {
        if (!s || !s.name || !validScore(s.score)) continue;
        const key = s.name.toLowerCase();
        if (!map.has(key) || map.get(key).score < s.score) {
          map.set(key, {
            name: s.name.slice(0, 20),
            score: s.score,
            date: s.date || new Date().toISOString(),
          });
        }
      }

      const merged = Array.from(map.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

      memory.scores = merged;
      write();
      return merged;
    }
  } catch {}
  return null;
}

export async function pushCloudScore(name, score) {
  if (!validScore(score)) return;
  const cleanName = (name || "").trim().slice(0, 20) || "Pemain Howell";
  try {
    const res = await fetch(CLOUD_URL, { cache: "no-store" });
    let currentScores = [];
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.scores && Array.isArray(json.data.scores)) {
        currentScores = json.data.scores;
      }
    }

    const existingIndex = currentScores.findIndex(
      (s) => s.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (existingIndex >= 0) {
      if (score >= currentScores[existingIndex].score) {
        currentScores[existingIndex].score = score;
        currentScores[existingIndex].date = new Date().toISOString();
      }
    } else {
      currentScores.push({
        name: cleanName,
        score,
        date: new Date().toISOString(),
      });
    }

    currentScores.sort((a, b) => b.score - a.score);
    currentScores = currentScores.slice(0, 50);

    await fetch(CLOUD_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Howell Leaderboard",
        data: { scores: currentScores },
      }),
    });
  } catch {}
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
