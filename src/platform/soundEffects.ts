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
const playerPools = new Map<SoundCue, HTMLAudioElement[]>();
const nextPlayer = new Map<SoundCue, number>();

function prepare() {
  if (
    typeof window === "undefined" ||
    typeof Audio === "undefined" ||
    playerPools.size
  ) {
    return;
  }
  for (const [cue, sound] of Object.entries(sources) as Array<
    [SoundCue, (typeof sources)[SoundCue]]
  >) {
    const pool = Array.from({ length: 2 }, () => {
      const audio = new Audio(sound.src);
      audio.preload = "auto";
      audio.volume = sound.volume;
      audio.load();
      return audio;
    });
    playerPools.set(cue, pool);
    nextPlayer.set(cue, 0);
  }
}

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
  prepare();
  const start = () => {
    const pool = playerPools.get(cue);
    if (!pool?.length) return;
    const index = nextPlayer.get(cue) ?? 0;
    const audio = pool[index];
    nextPlayer.set(cue, (index + 1) % pool.length);
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Browsers may decline audio before a user gesture. The action still works.
    });
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(start);
  } else {
    start();
  }
}

prepare();

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
  prepare,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
