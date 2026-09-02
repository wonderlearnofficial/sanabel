import { describe, expect, it } from "vitest";
import ar from "./ar";
import en from "./en";

describe("translation catalog", () => {
  it("keeps Arabic and English key coverage identical", () => {
    const englishKeys = Object.keys(en.translation).sort();
    const arabicKeys = Object.keys(ar.translation).sort();

    expect(arabicKeys).toEqual(englishKeys);
  });

  it("provides non-empty values for every key in both languages", () => {
    for (const key of Object.keys(en.translation)) {
      expect(String(en.translation[key as keyof typeof en.translation]).trim()).not.toBe("");
      expect(String(ar.translation[key as keyof typeof ar.translation]).trim()).not.toBe("");
    }
  });
});
