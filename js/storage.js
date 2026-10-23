const KEY = "howell-catch-win-v1";
let memory = { scores: [], muted: false },
  loaded = false,
  sessionBest = 0;
const validScore = (value) => Number.isSafeInteger(value) && value >= 0;
export function read() {
  if (loaded) return memory;
  loaded = true;
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (data && Array.isArray(data.scores))
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
export function saveScore(name, score) {
  read();
  if (!validScore(score)) return false;
  memory.scores.push({
    name: name.trim().slice(0, 20) || "Pemain Howell",
    score,
    date: new Date().toISOString(),
  });
  memory.scores.sort((a, b) => b.score - a.score);
  memory.scores = memory.scores.slice(0, 50);
  return write();
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
