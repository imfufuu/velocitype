import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addScore,
  getDifficulty,
  getScores,
  qualifies,
  setDifficulty,
} from "../storage";

const store = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
});

beforeEach(() => store.clear());

describe("getScores", () => {
  it("seeds the board with 5 rivals on first run", () => {
    const list = getScores();
    expect(list).toHaveLength(5);
    expect(list[0].name).toBe("AXIOM");
    expect(list[0].score).toBeGreaterThan(list[1].score);
  });

  it("returns stored scores on later reads", () => {
    getScores();
    const again = getScores();
    expect(again).toHaveLength(5);
    expect(again.map((s) => s.id)).toEqual(getScores().map((s) => s.id));
  });

  it("reseeds when stored data is corrupted", () => {
    store.set("velocitype.scores.v1", "{not json!");
    const list = getScores();
    expect(list).toHaveLength(5);
    expect(list[0].name).toBe("AXIOM");
  });
});

describe("addScore", () => {
  it("inserts a top score at the front and tags its difficulty", () => {
    const { list, entry } = addScore({
      name: "YOU",
      score: 99999,
      wpm: 120,
      acc: 99,
      words: 60,
      diff: "pro",
    });
    expect(list[0].id).toBe(entry.id);
    expect(list[0].name).toBe("YOU");
    expect(list[0].diff).toBe("pro");
  });

  it("keeps the list sorted and trimmed to 8 entries", () => {
    for (let i = 0; i < 6; i++) {
      addScore({
        name: `P${i}`,
        score: 1000 + i,
        wpm: 50,
        acc: 90,
        words: 10,
      });
    }
    const list = getScores();
    expect(list).toHaveLength(8);
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].score).toBeGreaterThanOrEqual(list[i].score);
    }
  });
});

describe("qualifies", () => {
  it("rejects zero scores", () => {
    expect(qualifies(0)).toBe(false);
  });

  it("accepts any score while the board is not full", () => {
    expect(qualifies(1)).toBe(true);
  });

  it("only accepts a top-8 score when the board is full", () => {
    getScores(); // 5 seeds
    const { list } = addScore({
      name: "TOP",
      score: 99999,
      wpm: 120,
      acc: 99,
      words: 60,
    });
    // fill to 8
    for (let i = 0; i < 2; i++) {
      addScore({
        name: `F${i}`,
        score: list[list.length - 1].score + 1000 * (i + 1),
        wpm: 50,
        acc: 90,
        words: 10,
      });
    }
    const full = getScores();
    expect(full).toHaveLength(8);
    expect(qualifies(full[full.length - 1].score + 1)).toBe(true);
    expect(qualifies(full[full.length - 1].score - 1)).toBe(false);
  });
});

describe("difficulty persistence", () => {
  it("defaults to arcade", () => {
    expect(getDifficulty()).toBe("arcade");
  });

  it("round-trips a stored choice", () => {
    setDifficulty("cruise");
    expect(getDifficulty()).toBe("cruise");
    setDifficulty("pro");
    expect(getDifficulty()).toBe("pro");
  });

  it("falls back to arcade on invalid stored value", () => {
    store.set("velocitype.difficulty.v1", "hardcore");
    expect(getDifficulty()).toBe("arcade");
  });
});
