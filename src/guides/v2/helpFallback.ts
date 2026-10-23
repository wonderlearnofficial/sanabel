// Help Center hand-off point.
//
// The Help Center itself ships in a later phase, but the replay and
// missing-target paths need somewhere to send a user whose guide cannot run
// here. Phase 1 defines the interface and a safe default: report that no help
// surface is available, so callers keep their own explanation instead of
// pretending navigation happened.

export type HelpTopicOpener = (topicId: string) => boolean;

let opener: HelpTopicOpener | null = null;

export const registerHelpTopicOpener = (next: HelpTopicOpener | null): void => {
  opener = next;
};

/** Returns false when no Help surface is registered yet. */
export const openHelpTopic = (topicId: string | undefined): boolean => {
  if (!topicId || !opener) return false;
  try {
    return opener(topicId);
  } catch {
    return false;
  }
};

export const isHelpAvailable = (): boolean => opener !== null;
