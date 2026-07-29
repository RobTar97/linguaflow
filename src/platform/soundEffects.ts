import { browserStorage } from "./storage";

export type SoundCue = "question-step" | "action-success" | "sound-enabled";

const SOUND_ENABLED_KEY = "linguaflow-sound-effects-enabled";
const sources: Record<SoundCue, { src: string; volume: number }> = {
  "question-step": {
    src: "/audio/question-step.mp3",
    volume: 0.22,
  },
  "action-success": {
    src: "/audio/action-success.mp3",
    volume: 0.2,
  },
  "sound-enabled": {
    src: "/audio/sound-enabled.mp3",
    volume: 0.18,
  },
};

const listeners = new Set<() => void>();
let cachedEnabled: boolean | undefined;

function readEnabled() {
  if (cachedEnabled === undefined) {
    cachedEnabled =
      typeof window === "undefined"
        ? true
        : browserStorage.get(SOUND_ENABLED_KEY, true);
  }
  return cachedEnabled;
}

function setEnabled(enabled: boolean) {
  cachedEnabled = enabled;
  if (typeof window !== "undefined") {
    browserStorage.set(SOUND_ENABLED_KEY, enabled);
  }
  listeners.forEach((listener) => listener());
}

function play(cue: SoundCue, options?: { force?: boolean }) {
  if (
    typeof window === "undefined" ||
    typeof Audio === "undefined" ||
    document.visibilityState !== "visible" ||
    (!options?.force && !readEnabled())
  ) {
    return;
  }

  const sound = sources[cue];
  const audio = new Audio(sound.src);
  audio.preload = "auto";
  audio.volume = sound.volume;
  void audio.play().catch(() => {
    // Browsers may decline audio before a user gesture. The action still works.
  });
}

export const soundEffects = {
  isEnabled: readEnabled,
  setEnabled,
  toggle() {
    const enabled = !readEnabled();
    setEnabled(enabled);
    if (enabled) play("sound-enabled", { force: true });
    return enabled;
  },
  play,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
