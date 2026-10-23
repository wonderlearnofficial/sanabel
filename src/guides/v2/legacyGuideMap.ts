import { ALL_GUIDES } from "../guideConfigs";
import { studentXpGuide } from "../guideConfigs";

// Read-only bridge from the Phase 0 guide ids already sitting in
// `Users.seenGuides` to their V2 successors. Nothing is rewritten, nothing is
// backfilled: an existing user's array is interpreted, not migrated.
//
// Successor ids are the ones the design assigns (docs/TUTORIAL_V2_DESIGN.md §33
// and §46). They do not have to exist in the V2 registry yet — this map is what
// stops the later content phases from re-onboarding everybody on day one.

export const LEGACY_EQUIVALENTS: Record<string, string[]> = {
  "solo-orientation": ["student-home"],
  "school-orientation": ["student-home"],
  "solo-first-mission": ["student-home", "student-mission-personal"],
  "school-first-mission": ["student-home", "student-mission-school"],
  "school-approval-lifecycle": ["student-mission-school", "student-notifications"],
  "school-todo": ["student-mission-school"],
  "solo-reward-xp": ["student-xp"],
  "solo-shop-intro": ["student-shop"],
  "solo-tree-intro": ["student-tree"],
  "solo-tree-grow": ["student-tree"],
  "solo-medals": ["student-medal"],
  "solo-stats": ["student-stats"],
  "solo-trophies": ["student-trophies"],
  "solo-profile-link": ["student-profile"],
  "school-leaderboard": ["student-leaderboard"],
  "teacher-orientation": ["teacher-home"],
  "teacher-first-assignment": ["teacher-register"],
  "parent-orientation": ["parent-home"],
  "parent-orientation-empty": ["parent-home"],
  "parent-orientation-linked": ["parent-home"],
};

/** Every Phase 0 guide id that currently exists in source. */
export const legacyGuideIds = (): string[] => [
  ...ALL_GUIDES.map((guide) => guide.id),
  // Unregistered but still present in older accounts' arrays, so it must stay
  // interpretable (Phase 0 removed the dead auto-start registration only).
  studentXpGuide.id,
];

export const legacyIdsFor = (v2GuideId: string): string[] =>
  LEGACY_EQUIVALENTS[v2GuideId] ?? [];

/**
 * True when a stored Phase 0 entry already covers this V2 guide, so the user
 * has effectively seen it and must not be taught it again.
 */
export const isCoveredByLegacy = (
  v2GuideId: string,
  storedEntries: Iterable<string>,
): boolean => {
  const legacy = legacyIdsFor(v2GuideId);
  if (legacy.length === 0) return false;
  const stored = storedEntries instanceof Set ? storedEntries : new Set(storedEntries);
  return legacy.some((id) => stored.has(id));
};
