import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { V2_REGISTRY, registryTargetIds, validateRegistry } from "../registry";
import { predicateIds } from "../predicates";
import { GuideRegistryEntry } from "../types";
import { LEGACY_EQUIVALENTS, legacyGuideIds } from "../legacyGuideMap";

const srcDir = path.resolve(process.cwd(), "src");

const validEntry = (over: Partial<GuideRegistryEntry> = {}): GuideRegistryEntry => ({
  id: "fixture-guide",
  version: 1,
  bumpPolicy: "all",
  experiences: ["solo"],
  route: "/student/home",
  autoTrigger: { kind: "route-enter" },
  prerequisites: [],
  priority: "route-tour",
  steps: [{ id: "s1", titleKey: "عنوان" }],
  replayable: true,
  persistence: "seen-on-complete",
  helpTopicId: "missions",
  ...over,
});

describe("registry invariants", () => {
  it("accepts a well-formed entry", () => {
    expect(validateRegistry([validEntry()])).toEqual([]);
  });

  it("ships no unvalidated production content", () => {
    // Phase 1 ships the engine, not role content.
    expect(validateRegistry(V2_REGISTRY)).toEqual([]);
  });

  it("rejects duplicate ids", () => {
    const problems = validateRegistry([validEntry(), validEntry()]);
    expect(problems.some((p) => p.problem === "duplicate id")).toBe(true);
  });

  it("requires a positive integer version", () => {
    expect(
      validateRegistry([validEntry({ version: 0 })]).some((p) =>
        p.problem.includes("version"),
      ),
    ).toBe(true);
  });

  it("requires a bump policy", () => {
    expect(
      validateRegistry([
        validEntry({ bumpPolicy: undefined as unknown as "all" }),
      ]).some((p) => p.problem.includes("bumpPolicy")),
    ).toBe(true);
  });

  it("forces orientation and first-success guides to be new-users-only", () => {
    expect(
      validateRegistry([validEntry({ priority: "orientation", bumpPolicy: "all" })]).some(
        (p) => p.problem.includes("new-users-only"),
      ),
    ).toBe(true);
    expect(
      validateRegistry([
        validEntry({ priority: "first-success", bumpPolicy: "new-users-only" }),
      ]),
    ).toEqual([]);
  });

  it("rejects an unknown experience", () => {
    expect(
      validateRegistry([
        validEntry({ experiences: ["headmaster" as never] }),
      ]).some((p) => p.problem.includes("unknown experience")),
    ).toBe(true);
  });

  it("rejects a relative route", () => {
    expect(
      validateRegistry([validEntry({ route: "student/home" })]).some((p) =>
        p.problem.includes("absolute path"),
      ),
    ).toBe(true);
  });

  it("rejects an unregistered trigger predicate", () => {
    expect(
      validateRegistry([
        validEntry({ autoTrigger: { kind: "predicate", id: "vibes" } }),
      ]).some((p) => p.problem.includes("unknown trigger predicate")),
    ).toBe(true);
    expect(
      validateRegistry([
        validEntry({ autoTrigger: { kind: "predicate", id: "xpAboveZero" } }),
      ]),
    ).toEqual([]);
  });

  it("rejects an unregistered prerequisite predicate and a malformed target id", () => {
    expect(
      validateRegistry([
        validEntry({ prerequisites: [{ kind: "predicate", id: "nope" }] }),
      ]).some((p) => p.problem.includes("unknown prerequisite predicate")),
    ).toBe(true);
    expect(
      validateRegistry([
        validEntry({ prerequisites: [{ kind: "target", id: "Bad Target" }] }),
      ]).some((p) => p.problem.includes("invalid prerequisite target id")),
    ).toBe(true);
  });

  it("rejects an interaction step with no target", () => {
    expect(
      validateRegistry([
        validEntry({ steps: [{ id: "s1", titleKey: "ع", advanceOn: "interaction" }] }),
      ]).some((p) => p.problem.includes("advances on interaction")),
    ).toBe(true);
  });

  it("requires a view-scoped guide to declare how replay reaches that view", () => {
    expect(
      validateRegistry([
        validEntry({ route: "/student/progress", view: "student.progress.tree" }),
      ]).some((p) => p.problem.includes("explicit replayTarget")),
    ).toBe(true);
    expect(
      validateRegistry([
        validEntry({
          route: "/student/progress",
          view: "student.progress.tree",
          replayTarget: { route: "/student/progress", view: "student.progress.tree" },
        }),
      ]),
    ).toEqual([]);
  });

  it("rejects a replay target on a guide that cannot be replayed", () => {
    expect(
      validateRegistry([
        validEntry({ replayable: false, replayTarget: { route: "/student/home" } }),
      ]).some((p) => p.problem.includes("non-replayable")),
    ).toBe(true);
  });

  it("requires an acknowledged guide to record the acknowledgement", () => {
    expect(
      validateRegistry([
        validEntry({ requiresAcknowledgement: true, persistence: "never" }),
      ]).some((p) => p.problem.includes("acknowledged")),
    ).toBe(true);
  });

  it("rejects a handoff whose source is not registered", () => {
    expect(
      validateRegistry([
        validEntry({ autoTrigger: { kind: "handoff", from: "ghost-guide" } }),
      ]).some((p) => p.problem.includes("handoff source")),
    ).toBe(true);
    expect(
      validateRegistry([
        validEntry({ id: "first", bumpPolicy: "new-users-only", priority: "orientation" }),
        validEntry({
          id: "second",
          autoTrigger: { kind: "handoff", from: "first" },
          priority: "first-success",
          bumpPolicy: "new-users-only",
        }),
      ]),
    ).toEqual([]);
  });

  it("rejects duplicate step ids", () => {
    expect(
      validateRegistry([
        validEntry({
          steps: [
            { id: "s1", titleKey: "أ" },
            { id: "s1", titleKey: "ب" },
          ],
        }),
      ]).some((p) => p.problem.includes("duplicate step id")),
    ).toBe(true);
  });
});

describe("anchors the registry may target", () => {
  const sourceFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
        ? [full]
        : [];
    });

  const anchors = (() => {
    const found = new Map<string, string[]>();
    sourceFiles(srcDir).forEach((file) => {
      const source = fs.readFileSync(file, "utf8");
      // Two declaration styles exist: the attribute itself, and a page that
      // keeps the id in its button data and spreads it onto the element
      // (`data-guide-id={button.guideId}` in TeacherHome/ParentHome).
      [
        ...source.matchAll(/data-guide-id="([^"]+)"/g),
        ...source.matchAll(/guideId:\s*"([^"]+)"/g),
        ...source.matchAll(/data-guide-id=\{[^\n]*?\?\s*"([a-z][a-z0-9-]*)"\s*:/g),
      ].forEach((match) => {
        const id = match[1];
        found.set(id, [...(found.get(id) ?? []), path.relative(srcDir, file)]);
      });
    });
    return found;
  })();

  // The anchors Tutorial V2 depends on. Removing one silently breaks a guide,
  // which is exactly how the Phase 0 guides rotted.
  const REQUIRED_ANCHORS = [
    // reused from Phase 0
    "daily-challenges",
    "mission-action",
    "notifications-bell",
    "teacher-students",
    "link-child",
    "approvals-card",
    // added for V2
    "student-xp-meter",
    "student-wallet",
    "shop-water",
    "shop-fertilizer",
    "shop-confirm",
    "tree-grow",
    "tree-canvas",
    "progress-tabs",
    "leaderboard-self-row",
    "leaderboard-search",
    "todo-pending-badge",
    "notif-decision",
    "teacher-student-checkbox",
    "teacher-selected-count",
    "teacher-action-mode",
    "teacher-confirm",
    "parent-invite-cta",
    "parent-child-switch",
  ];

  it("declares every anchor V2 needs", () => {
    const missing = REQUIRED_ANCHORS.filter((id) => !anchors.has(id));
    expect(missing).toEqual([]);
  });

  it("keeps single-element anchors unique in source", () => {
    // Two intentional exceptions:
    //   `mission-action`   one per mission row; the overlay resolves it with
    //                      `closest()`, so siblings sharing it is by design
    //   `approvals-card`   the same concept on the Teacher home and the Parent
    //                      home, which are different routes and never render
    //                      together
    const sharedAnchors = new Set(["mission-action", "approvals-card"]);
    const duplicated = [...new Set([...REQUIRED_ANCHORS, ...registryTargetIds(V2_REGISTRY)])].filter(
      (id) => !sharedAnchors.has(id) && (anchors.get(id)?.length ?? 0) > 1,
    );
    expect(duplicated).toEqual([]);
  });

  it("shares approvals-card only between the Teacher and Parent homes", () => {
    expect(new Set(anchors.get("approvals-card"))).toEqual(
      new Set([
        path.join("pages", "teacherorparent", "TeacherHome.tsx"),
        path.join("pages", "teacherorparent", "ParentHome.tsx"),
      ]),
    );
  });

  it("resolves every target the production registry references", () => {
    const unresolved = registryTargetIds(V2_REGISTRY).filter((id) => !anchors.has(id));
    expect(unresolved).toEqual([]);
  });
});

describe("predicate and legacy declarations", () => {
  it("registers the predicates later phases reference", () => {
    const ids = predicateIds();
    [
      "xpAboveZero",
      "canGrowTree",
      "hasPendingRequest",
      "hasDecidedRequest",
      "hasAssignedMission",
      "noLinkedChild",
      "hasLinkedChild",
      "multipleChildren",
      "assignmentFlowSeen",
      "completeModeSelected",
    ].forEach((id) => expect(ids).toContain(id));
  });

  it("maps only guide ids that actually exist in the Phase 0 source", () => {
    const existing = new Set(legacyGuideIds());
    const unknown = Object.values(LEGACY_EQUIVALENTS)
      .flat()
      .filter((id) => !existing.has(id));
    expect(unknown).toEqual([]);
  });
});
