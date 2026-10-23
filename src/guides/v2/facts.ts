import { PredicateFacts } from "./predicates";

// Gameplay/session facts the guide layer is allowed to read.
//
// The tutorial is an observer: it never fetches gameplay data of its own and
// never mutates anything. Screens that already hold a fact (pending approval
// count, assigned mission count) publish it here; predicates read the snapshot.

let facts: PredicateFacts = {};
const listeners = new Set<(next: PredicateFacts) => void>();

export const readGuideFacts = (): PredicateFacts => facts;

export const publishGuideFacts = (partial: PredicateFacts): void => {
  let changed = false;
  const next: PredicateFacts = { ...facts };
  (Object.keys(partial) as (keyof PredicateFacts)[]).forEach((key) => {
    const value = partial[key];
    if (next[key] !== value) {
      changed = true;
      // Assigning through a narrowed key keeps the union types intact.
      (next as Record<string, unknown>)[key as string] = value;
    }
  });
  if (!changed) return;
  facts = next;
  listeners.forEach((listener) => {
    try {
      listener(facts);
    } catch {
      // A subscriber must not break fact publication.
    }
  });
};

export const subscribeToGuideFacts = (
  listener: (next: PredicateFacts) => void,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const resetGuideFactsForTest = (): void => {
  facts = {};
};
