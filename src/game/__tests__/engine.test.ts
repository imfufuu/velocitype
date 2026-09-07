import { describe, expect, it } from "vitest";
import type { Sfx } from "../audio";
import { DIFFICULTIES, Game, type Phase, type RunStats } from "../engine";

const silent = {
  unlock() {},
  ui() {},
  key() {},
  fumble() {},
  lockOn() {},
  complete() {},
  crash() {},
  death() {},
  nitro() {},
  count() {},
  toast() {},
  engineStart() {},
  engineStop() {},
  engineLevel() {},
  destroy() {},
} as unknown as Sfx;

function makeGame() {
  const phases: Array<{ p: Phase; stats?: RunStats }> = [];
  const g = new Game(silent, (p, stats) => phases.push({ p, stats }));
  return { g, phases };
}

/** advance until the countdown ends and the run is live */
function toPlaying(g: Game): void {
  g.startRun();
  for (let i = 0; i < 80 && g.phase !== "playing"; i++) g.update(0.05);
  expect(g.phase).toBe("playing");
}

function spawnOne(g: Game, t: number): void {
  g.words = [];
  g.spawnWord(false, t);
}

describe("run lifecycle", () => {
  it("countdown ends in playing with three gimme words", () => {
    const { g } = makeGame();
    toPlaying(g);
    expect(g.words).toHaveLength(3);
    expect(g.shields).toBe(3); // arcade default
  });

  it("applies the selected difficulty preset", () => {
    for (const d of Object.keys(DIFFICULTIES) as Array<keyof typeof DIFFICULTIES>) {
      const { g } = makeGame();
      g.difficulty = d;
      toPlaying(g);
      expect(g.shields).toBe(DIFFICULTIES[d].hull);
    }
  });

  it("awards passive score while playing", () => {
    const { g } = makeGame();
    toPlaying(g);
    const before = g.score;
    g.words = [];
    g.update(1);
    expect(g.score).toBeGreaterThan(before);
  });
});

describe("typing", () => {
  it("completing a word scores, bumps combo, and removes the word", () => {
    const { g } = makeGame();
    toPlaying(g);
    spawnOne(g, 0.3);
    const w = g.words[0];
    for (const ch of w.text) g.inputChar(ch);
    expect(g.words).toHaveLength(0);
    expect(g.wordsTyped).toBe(1);
    expect(g.combo).toBe(1);
    expect(g.maxCombo).toBe(1);
    expect(g.score).toBeGreaterThan(0);
    expect(g.hits).toBe(w.text.length);
  });

  it("a wrong key on a locked word is a fumble", () => {
    const { g } = makeGame();
    toPlaying(g);
    spawnOne(g, 0.3);
    const w = g.words[0];
    g.inputChar(w.text[0]); // locks + types first char
    expect(w.locked).toBe(true);
    expect(w.progress).toBe(1);
    const wrong = w.text[1] === "a" ? "b" : "a";
    g.inputChar(wrong);
    expect(g.misses).toBe(1);
    expect(g.combo).toBe(0);
    expect(w.flash).toBeGreaterThan(0);
    expect(w.progress).toBe(1); // still on the same char
    g.inputChar(w.text[1]); // recover
    expect(w.progress).toBe(2);
  });

  it("keys are ignored outside of play", () => {
    const { g } = makeGame();
    g.inputChar("a"); // still in menu
    expect(g.hits).toBe(0);
    expect(g.misses).toBe(0);
  });
});

describe("crash and death", () => {
  it("a word crossing the impact line costs a hull charge", () => {
    const { g } = makeGame();
    toPlaying(g);
    spawnOne(g, 0.99);
    const w = g.words[0];
    g.update(0.2); // the spawned word crosses; the spawner may add a new one
    expect(g.words.find((x) => x.id === w.id)).toBeUndefined();
    expect(g.shields).toBe(2);
    expect(g.recovery).toBeGreaterThan(0);
    expect(g.combo).toBe(0);
  });

  it("losing the last hull charge runs dying → gameover with stats", () => {
    const { g, phases } = makeGame();
    toPlaying(g);
    g.shields = 1;
    spawnOne(g, 0.99);
    g.update(0.2);
    expect(g.phase).toBe("dying");
    for (let i = 0; i < 80 && g.phase !== "gameover"; i++) g.update(0.05);
    expect(g.phase).toBe("gameover");
    const last = phases[phases.length - 1];
    expect(last.p).toBe("gameover");
    expect(last.stats).toBeDefined();
    expect(last.stats!.score).toBeGreaterThanOrEqual(0);
    expect(last.stats!.timeMs).toBeGreaterThan(0);
  });
});

describe("nitro", () => {
  it("boosts when the bar is full and decays afterwards", () => {
    const { g } = makeGame();
    toPlaying(g);
    g.words = [];
    g.nitro = 100;
    expect(g.nitroReady).toBe(true);
    g.activateNitro();
    expect(g.boost).toBeGreaterThan(0);
    expect(g.nitroReady).toBe(false);
    for (let i = 0; i < 100; i++) g.update(0.05); // 5s > 3.4s boost
    expect(g.boost).toBe(0);
  });

  it("does nothing when the bar is not full", () => {
    const { g } = makeGame();
    toPlaying(g);
    g.nitro = 10;
    g.activateNitro();
    expect(g.boost).toBe(0);
  });
});

describe("pause", () => {
  it("pauses and resumes without losing run state", () => {
    const { g } = makeGame();
    toPlaying(g);
    g.words = [];
    const score = g.score;
    g.togglePause();
    expect(g.phase).toBe("paused");
    const frozen = g.elapsed;
    g.update(0.5); // paused: run clock must not move
    expect(g.elapsed).toBe(frozen);
    g.togglePause();
    expect(g.phase).toBe("playing");
    g.update(0.5);
    expect(g.score).toBeGreaterThan(score);
  });
});
