import { describe, expect, it } from "vitest";
import { BOSS, POOLS, pickBoss, pickWord, tierForTime } from "../words";

describe("tierForTime", () => {
  it("maps elapsed time to word-pool tiers", () => {
    expect(tierForTime(0)).toBe(0);
    expect(tierForTime(24.9)).toBe(0);
    expect(tierForTime(25)).toBe(1);
    expect(tierForTime(59.9)).toBe(1);
    expect(tierForTime(60)).toBe(2);
    expect(tierForTime(114.9)).toBe(2);
    expect(tierForTime(115)).toBe(3);
    expect(tierForTime(5000)).toBe(3);
  });
});

describe("pickWord", () => {
  it("always returns a lowercase a-z word", () => {
    for (let i = 0; i < 40; i++) {
      const w = pickWord(i % 4, new Set(), Math.random);
      expect(w).toMatch(/^[a-z]{3,}$/);
    }
  });

  it("never returns a word that is on the recent list (when alternatives exist)", () => {
    const pool = POOLS[0];
    const last = pool[pool.length - 1];
    const recent = new Set(pool.filter((w) => w !== last));
    // rng lands on the last pool index → the only word not on the recent list
    const w = pickWord(0, recent, () => 0.99);
    expect(w).toBe(last);
  });

  it("stays within the requested tier", () => {
    const pool = POOLS[2];
    for (let i = 0; i < 20; i++) {
      expect(pool).toContain(pickWord(2, new Set(), Math.random));
    }
  });
});

describe("pickBoss", () => {
  it("always returns a boss word", () => {
    for (let i = 0; i < 20; i++) {
      expect(BOSS).toContain(pickBoss(Math.random));
    }
  });
});
