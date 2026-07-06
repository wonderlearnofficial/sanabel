import { Howl, Howler } from "howler";

// --- Configuration ---
// Map of all sound effects available in the app.
// Some are preloaded immediately, others are lazy-loaded on demand.
export const SOUNDS = {
  // Low Importance (UI)
  click: { src: ["/sounds/click.mp3"], preload: true },
  pop: { src: ["/sounds/pop.mp3"], preload: true },
  tick: { src: ["/sounds/tick.mp3"], preload: true },
  swoosh: { src: ["/sounds/swoosh.mp3"], preload: false },
  
  // Medium Importance (Missions & Auth)
  card_flip: { src: ["/sounds/card_flip.mp3"], preload: false },
  chime: { src: ["/sounds/chime.mp3"], preload: true },
  reward: { src: ["/sounds/reward.mp3"], preload: true },
  welcome: { src: ["/sounds/welcome.mp3"], preload: false },
  notification: { src: ["/sounds/notification.mp3"], preload: false },
  soft_confirm: { src: ["/sounds/soft_confirm.mp3"], preload: false },
  soft_warning: { src: ["/sounds/soft_warning.mp3"], preload: true },
  delete: { src: ["/sounds/delete.mp3"], preload: false },
  fade_out: { src: ["/sounds/fade_out.mp3"], preload: false },
  coin: { src: ["/sounds/coin.mp3"], preload: false },
  
  // High Importance (Gamification)
  success: { src: ["/sounds/success.mp3"], preload: true },
  sparkle: { src: ["/sounds/sparkle.mp3"], preload: false },
  nature_magic: { src: ["/sounds/nature_magic.mp3"], preload: false },
  upgrade: { src: ["/sounds/upgrade.mp3"], preload: false },
  celebration: { src: ["/sounds/celebration.mp3"], preload: false },
  trophy: { src: ["/sounds/trophy.mp3"], preload: false },
};

export type SoundKey = keyof typeof SOUNDS;

class AudioManagerClass {
  private sounds: Map<SoundKey, Howl> = new Map();
  private lastPlayed: Map<SoundKey, number> = new Map();
  
  // Default Debounce time to prevent overlapping identical sounds (ms)
  private debounceMs = 150; 
  
  // User Settings
  private _effectsEnabled: boolean;
  private _musicEnabled: boolean;
  private _masterVolume: number;

  constructor() {
    this._effectsEnabled = true;
    this._musicEnabled = true;
    this._masterVolume = 1.0;

    // Apply initial settings
    Howler.volume(this._masterVolume);
    Howler.mute(!this._effectsEnabled);

    // Preload critical sounds
    this.initPreloads();
  }

  private initPreloads() {
    for (const [key, config] of Object.entries(SOUNDS)) {
      if (config.preload) {
        this.getOrCreateSound(key as SoundKey);
      }
    }
  }

  private getOrCreateSound(key: SoundKey): Howl | null {
    if (!SOUNDS[key]) return null;

    if (!this.sounds.has(key)) {
      const config = SOUNDS[key];
      const howl = new Howl({
        src: config.src,
        preload: config.preload,
      });
      this.sounds.set(key, howl);
    }
    return this.sounds.get(key)!;
  }

  /**
   * Plays a specific sound effect.
   * @param key The sound to play.
   * @param overrideDebounce If true, ignores the debounce restriction.
   */
  public play(key: SoundKey, overrideDebounce = false) {
    if (!this._effectsEnabled) return;

    const now = Date.now();
    const last = this.lastPlayed.get(key) || 0;

    // Prevent identical sounds from playing too rapidly (overlapping)
    if (!overrideDebounce && now - last < this.debounceMs) {
      return;
    }

    const sound = this.getOrCreateSound(key);
    if (sound) {
      // Small variation in playback rate makes repetitive sounds feel less artificial
      if (key === "tick" || key === "pop") {
         sound.rate(0.95 + Math.random() * 0.1); 
      }
      sound.play();
      this.lastPlayed.set(key, now);
    }
  }

  /**
   * Gets current master volume.
   */
  public get volume(): number {
    return this._masterVolume;
  }

  /**
   * Sets the global master volume (0.0 to 1.0).
   */
  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this._masterVolume = clamped;
    Howler.volume(clamped);
  }

  /**
   * Gets if sound effects are enabled.
   */
  public get effectsEnabled(): boolean {
    return this._effectsEnabled;
  }

  /**
   * Toggles sound effects ON/OFF.
   */
  public setEffectsEnabled(enabled: boolean) {
    this._effectsEnabled = enabled;
    Howler.mute(!enabled);
  }

  /**
   * Gets if music is enabled.
   */
  public get musicEnabled(): boolean {
    return this._musicEnabled;
  }

  /**
   * Toggles music ON/OFF. (For future music support)
   */
  public setMusicEnabled(enabled: boolean) {
    this._musicEnabled = enabled;
    // Implementation for pausing/playing background music would go here.
  }
}

// Export singleton instance
export const AudioManager = new AudioManagerClass();
