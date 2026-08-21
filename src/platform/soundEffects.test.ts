import { afterEach, describe, expect, it, vi } from "vitest";

describe("soundEffects", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("preloads a small reusable pool and starts cues on the next paint", async () => {
    const players: MockAudio[] = [];
    class MockAudio {
      currentTime = 0;
      preload = "";
      volume = 1;
      load = vi.fn();
      pause = vi.fn();
      play = vi.fn().mockResolvedValue(undefined);

      constructor(public src: string) {
        players.push(this);
      }
    }

    const animationFrames: FrameRequestCallback[] = [];
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      },
    });
    vi.stubGlobal("document", { visibilityState: "visible" });
    vi.stubGlobal("Audio", MockAudio);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      animationFrames.push(callback);
      return animationFrames.length;
    });

    const { soundEffects } = await import("./soundEffects");
    expect(players).toHaveLength(6);
    expect(players.every((player) => player.preload === "auto")).toBe(true);

    soundEffects.play("question-step");
    expect(animationFrames).toHaveLength(1);
    expect(players[0].play).not.toHaveBeenCalled();

    animationFrames[0](0);
    expect(players[0].pause).toHaveBeenCalledOnce();
    expect(players[0].play).toHaveBeenCalledOnce();
  });
});
