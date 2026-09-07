import type { Difficulty } from "./engine";

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  wpm: number;
  acc: number;
  words: number;
  date: number;
  seed?: boolean;
  /** difficulty the run was played on (absent on legacy entries) */
  diff?: Difficulty;
}

const KEY = "velocitype.scores.v1";
const DIFF_KEY = "velocitype.difficulty.v1";
const MAX_ENTRIES = 8;

const SEEDS: Omit<ScoreEntry, "id" | "date">[] = [
  { name: "AXIOM", score: 12400, wpm: 96, acc: 97, words: 58, seed: true },
  { name: "NYX", score: 8650, wpm: 84, acc: 95, words: 41, seed: true },
  { name: "VOLT", score: 5900, wpm: 72, acc: 93, words: 30, seed: true },
  { name: "KAI", score: 3400, wpm: 61, acc: 91, words: 19, seed: true },
  { name: "ECHO", score: 1750, wpm: 48, acc: 89, words: 11, seed: true },
];

export function getScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ScoreEntry[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* corrupted storage → reseed */
  }
  const seeded: ScoreEntry[] = SEEDS.map((s, i) => ({
    ...s,
    id: `seed-${i}`,
    date: Date.now() - (i + 1) * 86400000,
  }));
  saveScores(seeded);
  return seeded;
}

export function saveScores(list: ScoreEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch {
    /* private mode etc. */
  }
}

export function qualifies(score: number): boolean {
  if (score <= 0) return false;
  const list = getScores();
  if (list.length < MAX_ENTRIES) return true;
  return score > list[list.length - 1].score;
}

export function addScore(
  entry: Omit<ScoreEntry, "id" | "date">
): {
  list: ScoreEntry[];
  entry: ScoreEntry;
} {
  const list = getScores();
  const fresh: ScoreEntry = {
    ...entry,
    id: `you-${Date.now()}`,
    date: Date.now(),
  };
  list.push(fresh);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, MAX_ENTRIES);
  saveScores(trimmed);
  return { list: trimmed, entry: fresh };
}

/* ---------------- difficulty persistence ---------------- */

const DIFF_VALUES: Difficulty[] = ["cruise", "arcade", "pro"];

export function getDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(DIFF_KEY);
    if (v && (DIFF_VALUES as string[]).includes(v)) return v as Difficulty;
  } catch {
    /* ignore */
  }
  return "arcade";
}

export function setDifficulty(d: Difficulty): void {
  try {
    localStorage.setItem(DIFF_KEY, d);
  } catch {
    /* private mode etc. */
  }
}
