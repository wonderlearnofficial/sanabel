import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { localStore } from "../../utils/safeStorage";
import { isCoveredByLegacy } from "./legacyGuideMap";
import { GuideBumpPolicy, GuideEndReason, GuidePersistence } from "./types";

// The one owner of guide seen-state. No component touches
// `localStorage["seenGuides-*"]` or the PATCH endpoint directly.
//
// Storage stays exactly what the server already has: `Users.seenGuides`, a JSON
// array of strings. V2 writes versioned entries, `"<guideId>:v<major>"`, next to
// whatever Phase 0 entries an account already carries. No migration, no
// backfill, no schema change.

export const versionedEntry = (guideId: string, version: number): string =>
  `${guideId}:v${version}`;

const legacyCacheKey = (accountKey: string) => `seenGuides-${accountKey}`;

export interface GuideStoreIdentity {
  /** Stable per-account key from the experience resolver. */
  accountKey: string;
  /** The cache key Phase 0 wrote under, so its cache is still readable. */
  legacyCacheKey?: string;
}

export interface GuideStoreOptions {
  identity: GuideStoreIdentity;
  /** Server truth, from `user.seenGuides`. */
  serverEntries: string[];
  /** Impersonation or preview: display only, never persist. */
  readOnly: boolean;
  /** Injected for tests; defaults to the real PATCH. */
  persist?: (guideId: string, version: number) => Promise<void>;
}

export interface SeenQuery {
  guideId: string;
  version: number;
  bumpPolicy: GuideBumpPolicy;
}

const anyVersionOf = (guideId: string, entries: Set<string>): boolean => {
  const prefix = `${guideId}:v`;
  for (const entry of entries) {
    if (entry === guideId || entry.startsWith(prefix)) return true;
  }
  return false;
};

const patchSeenGuide = async (guideId: string, version: number): Promise<void> => {
  const token = localStore.getItem("token");
  if (!token) return;
  await axios.patch(
    `${API_BASE_URL}/users/seen-guides`,
    { guideId: versionedEntry(guideId, version) },
    { headers: { Authorization: `Bearer ${token}` } },
  );
};

export class GuideStore {
  private entries: Set<string>;

  private readonly identity: GuideStoreIdentity;

  private readonly readOnly: boolean;

  private readonly persistFn: (guideId: string, version: number) => Promise<void>;

  constructor(options: GuideStoreOptions) {
    this.identity = options.identity;
    this.readOnly = options.readOnly;
    this.persistFn = options.persist ?? patchSeenGuide;
    this.entries = new Set<string>([
      ...this.readCache(),
      ...options.serverEntries.filter((entry) => typeof entry === "string"),
    ]);
  }

  private readCache(): string[] {
    const keys = [
      legacyCacheKey(this.identity.accountKey),
      ...(this.identity.legacyCacheKey ? [this.identity.legacyCacheKey] : []),
    ];
    return keys.flatMap((key) =>
      localStore.getJson<string[]>(
        key,
        [],
        (value): value is string[] =>
          Array.isArray(value) && value.every((item) => typeof item === "string"),
      ),
    );
  }

  private writeCache(): void {
    localStore.setItem(
      legacyCacheKey(this.identity.accountKey),
      JSON.stringify([...this.entries]),
    );
  }

  /** Everything known for this account: V2 entries plus Phase 0 entries. */
  knownEntries(): string[] {
    return [...this.entries];
  }

  isSeen({ guideId, version, bumpPolicy }: SeenQuery): boolean {
    if (this.entries.has(versionedEntry(guideId, version))) return true;
    // A Phase 0 entry for the predecessor counts as seen, so existing users are
    // not re-onboarded when V2 content lands.
    if (isCoveredByLegacy(guideId, this.entries)) return true;
    // "new-users-only": a bump must not reach anyone who saw an earlier
    // version. Only accounts with no prior version at all get the new one.
    if (bumpPolicy === "new-users-only" && anyVersionOf(guideId, this.entries)) {
      return true;
    }
    return false;
  }

  /**
   * Records a guide as seen when its persistence policy and the end reason
   * agree. Returns whether anything was recorded.
   *
   * Read-only sessions (impersonation, preview) and manual replay never write:
   * replaying is not "unseeing", and previewing is not "having seen".
   */
  markEnded({
    guideId,
    version,
    persistence,
    reason,
  }: {
    guideId: string;
    version: number;
    persistence: GuidePersistence;
    reason: GuideEndReason;
  }): boolean {
    if (this.readOnly) return false;
    if (persistence === "never") return false;
    if (reason === "replay-exit") return false;
    if (reason === "preempted" || reason === "target-missing") return false;
    if (persistence === "seen-on-complete" && reason !== "complete") return false;
    if (persistence === "seen-on-any-end" && reason === "defer") {
      // "Later" is not "understood".
      return false;
    }

    const entry = versionedEntry(guideId, version);
    if (this.entries.has(entry)) return true;
    this.entries.add(entry);
    this.writeCache();
    // Fire-and-forget: a failed PATCH costs at worst one extra replay next
    // session, and must never block or fail the UI.
    void this.persistFn(guideId, version).catch(() => undefined);
    return true;
  }
}

export const createGuideStore = (options: GuideStoreOptions): GuideStore =>
  new GuideStore(options);
