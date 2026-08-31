import { describe, expect, it } from "vitest";
import { gameplaySound, reconcileGameplay } from "./gameplay";

describe("authoritative gameplay reconciliation", () => {
  it("replaces yesterday's completion snapshot with the server's current day", () => {
    const next = reconcileGameplay({ id: 1, completedTasks: { date: "2026-08-30", taskIds: [1, 2] } }, {
      student: { id: 1, xp: 5, seeders: 3 }, completion: { date: "2026-08-31", taskId: 3 },
    });
    expect(next.completedTasks).toEqual({ date: "2026-08-31", taskIds: [3] });
  });
  it("does not duplicate completion IDs or merge another account's rewards", () => {
    const previous = { id: 1, completedTasks: { date: "today", taskIds: [1] } };
    expect(reconcileGameplay(previous, { student: { id: 1 }, completion: { date: "today", taskId: 1 } }).completedTasks?.taskIds).toEqual([1]);
    expect(() => reconcileGameplay(previous, { student: { id: 2 } })).toThrow();
  });
  it("chooses one cue from authoritative XP, not component mounts", () => {
    expect(gameplaySound("mission", 9, 10)).toBe("levelUp");
    expect(gameplaySound("mission", 1, 5)).toBe("reward");
    expect(gameplaySound("purchase", 10, 10)).toBe("success");
    expect(gameplaySound("purchase", 9, 10)).toBe("levelUp");
    expect(gameplaySound("tree", 10, 10)).toBe("reward");
  });
});
