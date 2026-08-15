import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const audioMocks = vi.hoisted(() => ({
  muted: false,
  stopped: false,
  volume: 0,
}));

vi.mock("howler", () => {
  class MockHowl {
    private isPlaying = false;

    play() {
      this.isPlaying = true;
      return 1;
    }

    playing() {
      return this.isPlaying;
    }

    stop() {
      this.isPlaying = false;
      return this;
    }

    volume() {
      return this;
    }

    rate() {
      return this;
    }
  }

  return {
    Howl: MockHowl,
    Howler: {
      mute: (muted: boolean) => {
        audioMocks.muted = muted;
      },
      stop: () => {
        audioMocks.stopped = true;
      },
      volume: (volume: number) => {
        audioMocks.volume = volume;
      },
    },
  };
});

import {
  AudioManagerClass,
  SOUND_EFFECTS_STORAGE_KEY,
  SOUND_PROFILES,
} from "./AudioManager";

describe("AudioManager", () => {
  beforeEach(() => {
    localStorage.clear();
    audioMocks.muted = false;
    audioMocks.stopped = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("only references sound files that exist", () => {
    Object.values(SOUND_PROFILES).forEach(({ src }) => {
      expect(existsSync(resolve(process.cwd(), "public", src.slice(1)))).toBe(
        true,
      );
    });
  });

  it("suppresses repeated and lower-priority sounds", () => {
    const manager = new AudioManagerClass();

    expect(manager.play("reward")).toBe(true);
    expect(manager.play("tap")).toBe(false);
    expect(manager.play("reward")).toBe(false);
  });

  it("persists the user's sound preference", () => {
    const manager = new AudioManagerClass();

    manager.setEffectsEnabled(false);
    expect(manager.effectsEnabled).toBe(false);
    expect(manager.play("tap")).toBe(false);
    expect(localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY)).toBe("false");
    expect(audioMocks.muted).toBe(true);
    expect(audioMocks.stopped).toBe(true);
  });
});
