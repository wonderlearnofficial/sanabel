import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGuideStore, versionedEntry } from "../guideStore";

const identity = { accountKey: "u7", legacyCacheKey: "seenGuides-student@example.com" };

const makeStore = (
  serverEntries: string[],
  { readOnly = false }: { readOnly?: boolean } = {},
) => {
  const persisted: { guideId: string; version: number }[] = [];
  const store = createGuideStore({
    identity,
    serverEntries,
    readOnly,
    persist: async (guideId, version) => {
      persisted.push({ guideId, version });
    },
  });
  return { store, persisted };
};

const query = (guideId: string, version: number, bumpPolicy: "all" | "new-users-only" = "all") => ({
  guideId,
  version,
  bumpPolicy,
});

describe("versioned seen state", () => {
  beforeEach(() => localStorage.clear());

  it("treats an unrecorded guide as unseen", () => {
    const { store } = makeStore([]);
    expect(store.isSeen(query("solo-shop-intro", 1))).toBe(false);
  });

  it("recognises its own versioned entry", () => {
    const { store } = makeStore([versionedEntry("solo-shop-intro", 1)]);
    expect(store.isSeen(query("solo-shop-intro", 1))).toBe(true);
  });

  it("treats a new major version as unseen when the bump applies to all", () => {
    const { store } = makeStore([versionedEntry("solo-shop-intro", 1)]);
    expect(store.isSeen(query("solo-shop-intro", 2, "all"))).toBe(false);
  });

  it("does not re-teach a bumped new-users-only guide to an existing user", () => {
    const { store } = makeStore([versionedEntry("solo-orientation", 1)]);
    expect(store.isSeen(query("solo-orientation", 2, "new-users-only"))).toBe(true);
  });

  it("still teaches a new-users-only guide to an account that saw nothing", () => {
    const { store } = makeStore([]);
    expect(store.isSeen(query("solo-orientation", 2, "new-users-only"))).toBe(false);
  });
});

describe("legacy dual-read", () => {
  beforeEach(() => localStorage.clear());

  it("suppresses a V2 successor for a user who saw the Phase 0 guide", () => {
    const { store } = makeStore(["student-home"]);
    expect(store.isSeen(query("solo-orientation", 1))).toBe(true);
    expect(store.isSeen(query("school-orientation", 1))).toBe(true);
    expect(store.isSeen(query("solo-first-mission", 1))).toBe(true);
  });

  it("leaves unrelated V2 guides available to that same user", () => {
    const { store } = makeStore(["student-home"]);
    expect(store.isSeen(query("solo-challenges", 1))).toBe(false);
  });

  it("maps each remaining Phase 0 id to its successor", () => {
    const cases: [string, string][] = [
      ["student-shop", "solo-shop-intro"],
      ["student-tree", "solo-tree-intro"],
      ["student-medal", "solo-medals"],
      ["student-stats", "solo-stats"],
      ["student-trophies", "solo-trophies"],
      ["student-profile", "solo-profile-link"],
      ["student-leaderboard", "school-leaderboard"],
      ["student-xp", "solo-reward-xp"],
      ["teacher-home", "teacher-orientation"],
      ["teacher-register", "teacher-first-assignment"],
      ["parent-home", "parent-orientation"],
      ["student-mission-school", "school-todo"],
    ];
    cases.forEach(([legacyId, v2Id]) => {
      const { store } = makeStore([legacyId]);
      expect(store.isSeen(query(v2Id, 1)), `${legacyId} -> ${v2Id}`).toBe(true);
    });
  });

  it("reads the Phase 0 local cache key as well as the server array", () => {
    localStorage.setItem(
      "seenGuides-student@example.com",
      JSON.stringify(["student-shop"]),
    );
    const { store } = makeStore([]);
    expect(store.isSeen(query("solo-shop-intro", 1))).toBe(true);
  });

  it("never rewrites the stored array just to interpret it", () => {
    const server = ["student-home"];
    const { store, persisted } = makeStore(server);
    store.isSeen(query("solo-orientation", 1));
    expect(persisted).toEqual([]);
    expect(server).toEqual(["student-home"]);
    expect(localStorage.getItem("seenGuides-u7")).toBeNull();
  });
});

describe("persistence policy", () => {
  beforeEach(() => localStorage.clear());

  it("records an ordinary completion locally and on the server", () => {
    const { store, persisted } = makeStore([]);
    const recorded = store.markEnded({
      guideId: "solo-shop-intro",
      version: 1,
      persistence: "seen-on-complete",
      reason: "complete",
    });
    expect(recorded).toBe(true);
    expect(persisted).toEqual([{ guideId: "solo-shop-intro", version: 1 }]);
    expect(localStorage.getItem("seenGuides-u7")).toContain("solo-shop-intro:v1");
    expect(store.isSeen(query("solo-shop-intro", 1))).toBe(true);
  });

  it("does not record a deferred guide", () => {
    const { store, persisted } = makeStore([]);
    expect(
      store.markEnded({
        guideId: "solo-first-mission",
        version: 1,
        persistence: "seen-on-complete",
        reason: "defer",
      }),
    ).toBe(false);
    expect(persisted).toEqual([]);
  });

  it("does not record a guide the user only replayed", () => {
    const { store, persisted } = makeStore([]);
    expect(
      store.markEnded({
        guideId: "solo-shop-intro",
        version: 1,
        persistence: "seen-on-complete",
        reason: "replay-exit",
      }),
    ).toBe(false);
    expect(persisted).toEqual([]);
  });

  it("does not record a guide a blocking overlay interrupted", () => {
    const { store, persisted } = makeStore([]);
    store.markEnded({
      guideId: "solo-first-mission",
      version: 1,
      persistence: "seen-on-any-end",
      reason: "preempted",
    });
    store.markEnded({
      guideId: "solo-first-mission",
      version: 1,
      persistence: "seen-on-any-end",
      reason: "target-missing",
    });
    expect(persisted).toEqual([]);
  });

  it("writes nothing at all in a read-only session (impersonation or preview)", () => {
    const { store, persisted } = makeStore([], { readOnly: true });
    expect(
      store.markEnded({
        guideId: "solo-shop-intro",
        version: 1,
        persistence: "seen-on-complete",
        reason: "complete",
      }),
    ).toBe(false);
    expect(persisted).toEqual([]);
    expect(localStorage.getItem("seenGuides-u7")).toBeNull();
  });

  it("honours a never-persist guide", () => {
    const { store, persisted } = makeStore([]);
    store.markEnded({
      guideId: "dev-probe",
      version: 1,
      persistence: "never",
      reason: "complete",
    });
    expect(persisted).toEqual([]);
  });

  it("keeps local state usable when the server write fails", async () => {
    const failure = vi.fn().mockRejectedValue(new Error("offline"));
    const store = createGuideStore({
      identity,
      serverEntries: [],
      readOnly: false,
      persist: failure,
    });
    expect(
      store.markEnded({
        guideId: "solo-shop-intro",
        version: 1,
        persistence: "seen-on-complete",
        reason: "complete",
      }),
    ).toBe(true);
    await Promise.resolve();
    expect(failure).toHaveBeenCalled();
    // The user is not shown the guide twice in this session, and the worst case
    // is one extra replay next session.
    expect(store.isSeen(query("solo-shop-intro", 1))).toBe(true);
  });
});
