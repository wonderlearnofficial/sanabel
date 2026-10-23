import { beforeEach, describe, expect, it } from "vitest";
import {
  GUIDE_PROGRESS_RESUME_WINDOW_MS,
  clearGuideProgressFor,
  createProgressStore,
} from "../progressStore";

const position = {
  guideId: "solo-first-mission",
  version: 1,
  stepId: "s2",
  stepIndex: 1,
};

describe("resume behaviour", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("resumes within the same session", () => {
    const store = createProgressStore({ accountKey: "u7" });
    store.save(position, 3);
    expect(store.load()).toMatchObject(position);
  });

  it("resumes in a new session when the position is younger than 24 hours", () => {
    const savedAt = 1_000_000;
    const writer = createProgressStore({ accountKey: "u7", now: () => savedAt });
    writer.save(position, 3);
    sessionStorage.clear(); // new session, local storage survives

    const reader = createProgressStore({
      accountKey: "u7",
      now: () => savedAt + GUIDE_PROGRESS_RESUME_WINDOW_MS - 1,
    });
    expect(reader.load()).toMatchObject(position);
  });

  it("restarts once the position is 24 hours old", () => {
    const savedAt = 1_000_000;
    createProgressStore({ accountKey: "u7", now: () => savedAt }).save(position, 3);
    sessionStorage.clear();

    const reader = createProgressStore({
      accountKey: "u7",
      now: () => savedAt + GUIDE_PROGRESS_RESUME_WINDOW_MS,
    });
    expect(reader.load()).toBeNull();
    // The stale record is dropped rather than left to be re-read.
    expect(localStorage.getItem("guideProgress-u7")).toBeNull();
  });

  it("keeps no position for a single-step coachmark", () => {
    const store = createProgressStore({ accountKey: "u7" });
    store.save({ ...position, guideId: "solo-shop-intro", stepIndex: 0, stepId: "s1" }, 1);
    expect(store.load()).toBeNull();
  });

  it("clears the position when a guide completes", () => {
    const store = createProgressStore({ accountKey: "u7" });
    store.save(position, 3);
    store.clear();
    expect(store.load()).toBeNull();
  });

  it("writes nothing in a read-only session", () => {
    const store = createProgressStore({ accountKey: "u7", readOnly: true });
    store.save(position, 3);
    expect(store.load()).toBeNull();
    expect(localStorage.getItem("guideProgress-u7")).toBeNull();
  });

  it("does not leak one account's position to another on a shared device", () => {
    createProgressStore({ accountKey: "u7" }).save(position, 3);
    expect(createProgressStore({ accountKey: "u8" }).load()).toBeNull();
    expect(createProgressStore({ accountKey: "u7" }).load()).toMatchObject(position);
  });

  it("ignores a malformed stored record instead of throwing", () => {
    localStorage.setItem("guideProgress-u7", "{not json");
    sessionStorage.setItem("guideProgress-u7", '{"guideId":42}');
    expect(createProgressStore({ accountKey: "u7" }).load()).toBeNull();
  });

  it("clears on logout through the exported helper", () => {
    createProgressStore({ accountKey: "u7" }).save(position, 3);
    clearGuideProgressFor("u7");
    expect(createProgressStore({ accountKey: "u7" }).load()).toBeNull();
  });
});
