import { describe, expect, it, vi } from "vitest";
import { createSafeStorage } from "./safeStorage";

describe("safe storage", () => {
  it("falls back when Safari blocks storage access", () => {
    const storage = createSafeStorage(() => {
      throw new DOMException("Storage is unavailable", "SecurityError");
    });

    expect(storage.getItem("token")).toBeNull();
    expect(storage.setItem("token", "secret")).toBe(false);
    expect(storage.removeItem("token")).toBe(false);
  });

  it("removes only malformed JSON and returns the requested fallback", () => {
    const removeItem = vi.fn();
    const storage = createSafeStorage(() => ({
      getItem: () => "{broken",
      setItem: vi.fn(),
      removeItem,
    }));

    expect(storage.getJson("todos", [] as number[])).toEqual([]);
    expect(removeItem).toHaveBeenCalledWith("todos");
  });

  it("rejects a valid JSON value with the wrong persisted shape", () => {
    const removeItem = vi.fn();
    const storage = createSafeStorage(() => ({
      getItem: () => JSON.stringify({ unexpected: true }),
      setItem: vi.fn(),
      removeItem,
    }));

    const result = storage.getJson<string[]>(
      "seen-guides",
      [],
      (value): value is string[] =>
        Array.isArray(value) && value.every((item) => typeof item === "string"),
    );

    expect(result).toEqual([]);
    expect(removeItem).toHaveBeenCalledWith("seen-guides");
  });
});
