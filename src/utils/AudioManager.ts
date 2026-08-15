import { Howl, Howler } from "howler";

export const SOUND_EFFECTS_STORAGE_KEY = "sanabel:sound-effects";

const SOUND_FILES = {
  click: "/sounds/click.mp3",
  success: "/sounds/success.mp3",
  error: "/sounds/error.mp3",
} as const;

// Keep sound names tied to meaning instead of individual files. The reward
// profile intentionally reuses the success jingle with a brighter treatment.
export const SOUND_PROFILES = {
  tap: {
    src: SOUND_FILES.click,
    volume: 0.22,
    rate: 1.08,
    cooldownMs: 240,
    maxDurationMs: 500,
    priority: 1,
  },
  success: {
    src: SOUND_FILES.success,
    volume: 0.38,
    rate: 1.05,
    cooldownMs: 800,
    maxDurationMs: 2000,
    priority: 2,
  },
  error: {
    src: SOUND_FILES.error,
    volume: 0.3,
    rate: 1,
    cooldownMs: 600,
    maxDurationMs: 300,
    priority: 3,
  },
  reward: {
    src: SOUND_FILES.success,
    volume: 0.5,
    rate: 1.12,
    cooldownMs: 1200,
    maxDurationMs: 1950,
    priority: 4,
  },
} as const;

export type SoundKey = keyof typeof SOUND_PROFILES;

type ActivePlayback = {
  id: number;
  key: SoundKey;
  priority: number;
  sound: Howl;
};

export class AudioManagerClass {
  private sounds = new Map<string, Howl>();
  private lastPlayed = new Map<SoundKey, number>();
  private activePlayback: ActivePlayback | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private _effectsEnabled: boolean;

  constructor() {
    this._effectsEnabled = this.readEffectsPreference();

    // Individual profiles control loudness. Keeping the global level below
    // full volume prevents short effects from feeling harsh on headphones.
    Howler.volume(0.8);
    Howler.mute(!this._effectsEnabled);
    this.preloadSounds();
  }

  private readEffectsPreference(): boolean {
    if (typeof window === "undefined") return true;

    try {
      return window.localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY) !== "false";
    } catch {
      return true;
    }
  }

  private saveEffectsPreference(enabled: boolean) {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        SOUND_EFFECTS_STORAGE_KEY,
        String(enabled),
      );
    } catch {
      // Sound should keep working even when storage is unavailable.
    }
  }

  private preloadSounds() {
    const uniqueSources = new Set(
      Object.values(SOUND_PROFILES).map((profile) => profile.src),
    );

    uniqueSources.forEach((source) => this.getOrCreateSound(source));
  }

  private getOrCreateSound(source: string): Howl {
    const existingSound = this.sounds.get(source);
    if (existingSound) return existingSound;

    const sound = new Howl({ src: [source], preload: true });
    this.sounds.set(source, sound);
    return sound;
  }

  private clearStopTimer() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  private stopActivePlayback() {
    this.clearStopTimer();

    if (this.activePlayback) {
      this.activePlayback.sound.stop(this.activePlayback.id);
      this.activePlayback = null;
    }
  }

  /** Plays one intentional sound cue. Returns false when it is suppressed. */
  public play(key: SoundKey, overrideCooldown = false): boolean {
    if (!this._effectsEnabled) return false;

    const profile = SOUND_PROFILES[key];
    const now = Date.now();
    const lastPlayedAt = this.lastPlayed.get(key) ?? 0;

    if (!overrideCooldown && now - lastPlayedAt < profile.cooldownMs) {
      return false;
    }

    if (
      this.activePlayback?.sound.playing(this.activePlayback.id) &&
      profile.priority < this.activePlayback.priority
    ) {
      return false;
    }

    this.stopActivePlayback();

    const sound = this.getOrCreateSound(profile.src);
    sound.volume(profile.volume);
    sound.rate(profile.rate);

    const id = sound.play();
    this.activePlayback = { id, key, priority: profile.priority, sound };
    this.lastPlayed.set(key, now);

    this.stopTimer = setTimeout(() => {
      if (sound.playing(id)) sound.stop(id);
      if (this.activePlayback?.id === id) this.activePlayback = null;
      this.stopTimer = null;
    }, profile.maxDurationMs);

    return true;
  }

  public get effectsEnabled(): boolean {
    return this._effectsEnabled;
  }

  public setEffectsEnabled(enabled: boolean) {
    this._effectsEnabled = enabled;
    this.saveEffectsPreference(enabled);
    Howler.mute(!enabled);

    if (!enabled) {
      this.stopActivePlayback();
      Howler.stop();
    }
  }
}

export const AudioManager = new AudioManagerClass();
