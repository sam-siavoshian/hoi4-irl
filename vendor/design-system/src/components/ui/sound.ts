// The one sound Lanes makes: Zephium's intro (./assets/intro.m4a, Zephium
// `assets/sounds/intro.m4a`, MPL-2.0), as the name forms on the welcome.
// From sam-siavoshian/morrow web/src/components/onboarding/sound.ts (the
// owner's own repo), moved into the kit so any flow can play it. Changes,
// toward Zephium's own (desktop/src/intro_sound.rs, Onboarding.svelte): full
// volume, played once as the formation starts, and never muted for reduced
// motion (only the dots are skipped then). There is no switch: Zephium has
// none, so Morrow's stored on/off choice is gone.
//
// Zephium plays it natively. A browser plays sound only after the person has
// done something on the page (its autoplay policy), so `startIntro` tries at
// once and says when the browser refused: the welcome then asks for one click
// (Begin), and plays it on that click.

import introSound from "./assets/intro.m4a";

/** The file, bundled by Vite into app/dist/assets, so the CSP's default-src 'self' covers it. */
export const INTRO_SOUND_SRC: string = introSound;

/** Zephium plays it at the system's volume: NSSound's default, full. */
export const INTRO_VOLUME = 1;

/** How long to wait for the browser's answer before the name starts forming anyway. */
export const INTRO_GRACE_MS = 250;

/** What a media element needs to be the intro: an HTMLAudioElement, or a fake in a test. */
export type IntroPlayer = Pick<HTMLMediaElement, "play" | "pause" | "currentTime" | "volume" | "src" | "preload"> & {
  removeAttribute?: (name: string) => void;
  load?: () => void;
};

export interface IntroSound {
  /**
   * Play it from the start. "playing" once it does, "blocked" when the
   * browser wants a click first, "failed" for anything else (no output
   * device, a file it cannot decode): the name forms either way.
   */
  play(): Promise<IntroOutcome>;
  /** Stop it and let go of the file. */
  dispose(): void;
}

export type IntroOutcome = "playing" | "blocked" | "failed";

/** The intro, loading now, so it starts the moment the name does. */
export function createIntroSound(make: () => IntroPlayer = () => new Audio()): IntroSound {
  const player = make();
  player.preload = "auto";
  player.volume = INTRO_VOLUME;
  player.src = INTRO_SOUND_SRC;
  return {
    async play() {
      try {
        player.currentTime = 0;
        await player.play();
        return "playing";
      } catch (error) {
        return (error as { name?: string } | null)?.name === "NotAllowedError" ? "blocked" : "failed";
      }
    },
    dispose() {
      player.pause();
      player.removeAttribute?.("src");
      player.load?.();
    },
  };
}

/**
 * Try the intro without a click. "blocked" when the browser refuses it (it
 * says so at once), "started" otherwise: playing, or still loading after the
 * grace period, in which case it joins the formation when it can.
 */
export async function startIntro(sound: IntroSound, graceMs = INTRO_GRACE_MS): Promise<"started" | "blocked"> {
  const answer = await Promise.race([
    sound.play(),
    new Promise<"waiting">((resolve) => setTimeout(() => resolve("waiting"), graceMs)),
  ]);
  return answer === "blocked" ? "blocked" : "started";
}
