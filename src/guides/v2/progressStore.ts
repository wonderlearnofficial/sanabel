import { localStore, sessionStore } from "../../utils/safeStorage";

// Resume state for multi-step first-success guides that span routes.
//
// Keyed by the resolver's account key (numeric user id where available), so a
// shared device cannot leak one learner's position into another's session.
// Session storage answers "same session"; local storage answers "came back
// today". Nothing here is gameplay state — losing it only costs a restart.

const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000;

const key = (accountKey: string) => `guideProgress-${accountKey}`;

export interface GuideProgress {
  guideId: string;
  version: number;
  stepId: string;
  stepIndex: number;
  updatedAt: number;
}

const isProgress = (value: unknown): value is GuideProgress => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GuideProgress>;
  return (
    typeof candidate.guideId === "string" &&
    typeof candidate.version === "number" &&
    typeof candidate.stepId === "string" &&
    typeof candidate.stepIndex === "number" &&
    typeof candidate.updatedAt === "number"
  );
};

export interface ProgressStoreOptions {
  accountKey: string;
  /** Impersonation or preview: never leave a trace. */
  readOnly?: boolean;
  now?: () => number;
}

export class ProgressStore {
  private readonly accountKey: string;

  private readonly readOnly: boolean;

  private readonly now: () => number;

  constructor({ accountKey, readOnly = false, now = Date.now }: ProgressStoreOptions) {
    this.accountKey = accountKey;
    this.readOnly = readOnly;
    this.now = now;
  }

  /**
   * Saves the position of a multi-step guide. Single-step guides carry no
   * progress: there is nothing to resume, and a stored row would only be a
   * chance to resume into a finished guide.
   */
  save(progress: Omit<GuideProgress, "updatedAt">, totalSteps: number): void {
    if (this.readOnly) return;
    if (totalSteps <= 1) return;
    const record: GuideProgress = { ...progress, updatedAt: this.now() };
    const serialized = JSON.stringify(record);
    sessionStore.setItem(key(this.accountKey), serialized);
    localStore.setItem(key(this.accountKey), serialized);
  }

  /**
   * Returns resumable progress, or null.
   *   same session                       → resume
   *   new session, younger than 24 hours → resume
   *   24 hours or older                  → discarded, the flow restarts
   */
  load(): GuideProgress | null {
    const fromSession = sessionStore.getJson<GuideProgress | null>(
      key(this.accountKey),
      null,
      (value): value is GuideProgress | null => value === null || isProgress(value),
    );
    if (fromSession && this.now() - fromSession.updatedAt < RESUME_WINDOW_MS) return fromSession;

    const stored = localStore.getJson<GuideProgress | null>(
      key(this.accountKey),
      null,
      (value): value is GuideProgress | null => value === null || isProgress(value),
    );
    if (!stored) return null;
    if (this.now() - stored.updatedAt >= RESUME_WINDOW_MS) {
      this.clear();
      return null;
    }
    return stored;
  }

  clear(): void {
    if (this.readOnly) return;
    sessionStore.removeItem(key(this.accountKey));
    localStore.removeItem(key(this.accountKey));
  }
}

export const createProgressStore = (options: ProgressStoreOptions): ProgressStore =>
  new ProgressStore(options);

/** Called on logout so ephemeral tutorial position does not outlive the session. */
export const clearGuideProgressFor = (accountKey: string): void => {
  sessionStore.removeItem(key(accountKey));
  localStore.removeItem(key(accountKey));
};

/**
 * Drops every account's stored position. Used by session cleanup, which runs
 * without knowing which account is signing out — a shared device must not carry
 * one learner's tutorial position into the next session. Server-side seen state
 * is untouched: that is durable account data, not ephemeral position.
 */
export const clearAllGuideProgress = (): void => {
  const prefix = "guideProgress-";
  [sessionStorage, localStorage].forEach((storage) => {
    try {
      const doomed: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const storedKey = storage.key(index);
        if (storedKey && storedKey.startsWith(prefix)) doomed.push(storedKey);
      }
      doomed.forEach((storedKey) => storage.removeItem(storedKey));
    } catch {
      // Private mode or blocked site data: nothing to clear, nothing to fail.
    }
  });
};

export const GUIDE_PROGRESS_RESUME_WINDOW_MS = RESUME_WINDOW_MS;
