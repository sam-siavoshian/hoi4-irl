// Light/dark, the sky and motion, live. public/theme-boot.js sets all three
// on <html> before the first paint; this keeps them current afterwards (the
// clock passing into evening, another window changing the setting) and gives
// React a way to read and change them.
//
// The pattern is Morrow's (web/src/components/ui/theme.tsx, the owner's own
// repo): the attributes on <html> are the state, a MutationObserver is the
// subscription, and a change finishes the transitions it starts so nothing
// smears (as t3code's `.no-transitions` did, without its second restyle).
//
// Changes from Morrow: in Morrow the scene is the theme (data-theme="day" |
// "dawn" | "night"; night is the dark page, day and dawn light ones, and
// "system" means night when the OS is dark). Lanes keeps two settings, light
// or dark (`data-theme`) and the sky (`data-sky`, the clock's unless pinned,
// ./morrow/scenes.ts), and ties them the way Morrow does: on Auto the sky
// decides, so night is a dark page and dawn and day are light ones. A Light or
// Dark the owner picks wins, and the clock's sky keeps to that scheme (dark
// is night, light is never night), because each picture is baked into its own
// paper (--sky-paper): where the two disagree the horizon dissolves into the
// other scheme's paper as a smudge. Only a sky the owner pins against a theme
// they pinned shows the two apart.

import { useSyncExternalStore } from "react";

import {
  isScene,
  msUntilNextScene,
  SCENE_STORAGE_KEY,
  type Scene,
  sceneForDate,
  type ScenePreference,
} from "./morrow/scenes";

export type Appearance = "system" | "light" | "dark";
export type Theme = "light" | "dark";

export const APPEARANCE_STORAGE_KEY = "lanes:appearance";
export const MOTION_STORAGE_KEY = "lanes:motion";

export const isAppearance = (value: unknown): value is Appearance =>
  value === "system" || value === "light" || value === "dark";

/** The scheme a sky stands over: night is a dark page, dawn and day light ones (Morrow's scenes). */
export const themeForSky = (sky: Scene): Theme => (sky === "night" ? "dark" : "light");

/** The theme an appearance choice resolves to: on Auto, the sky's. */
export function resolveTheme(appearance: Appearance, sky: Scene): Theme {
  return appearance === "system" ? themeForSky(sky) : appearance;
}

/**
 * The sky shown: a pinned one as it is; otherwise the clock's, kept to the
 * theme's scheme when the owner picked one (dark is night, light is never
 * night), so the picture's paper is the page's.
 */
export function resolveSky(appearance: Appearance, pinned: string | null | undefined, date: Date): Scene {
  if (isScene(pinned)) return pinned;
  const clock = sceneForDate(date);
  if (appearance === "dark") return "night";
  if (appearance === "light" && clock === "night") return "day";
  return clock;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the choice lasts for this window.
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Repaint without transitions: every token flips at once instead of easing
 * through the frame. The change restyles the page once, and every
 * transition running then (the ones it started, and a chosen card's, now
 * easing to the other theme's colour) is finished on the spot. It used to
 * put t3code's `.no-transitions` on <html> and take it off two frames later,
 * and taking it off restyled the whole page a second time: another long
 * task, ~100ms at 6x CPU, in the middle of whatever was moving
 * (design/motion/QA.md, M21).
 */
function withoutTransitions(root: HTMLElement, change: () => void) {
  change();
  const doc = root.ownerDocument;
  if (typeof doc.getAnimations !== "function" || typeof CSSTransition === "undefined") return;
  // Asking for the animations brings the style up to date: the one restyle the change costs.
  for (const animation of doc.getAnimations()) {
    if (animation instanceof CSSTransition) animation.finish();
  }
}

/**
 * Run `apply` once the frame in hand has painted, so a choice shows as
 * chosen first and the whole-page restyle a theme costs comes after it
 * (Settings > Appearance; design/motion/QA.md, M21).
 */
export function afterPaint(apply: () => void): void {
  if (typeof requestAnimationFrame !== "function") {
    apply();
    return;
  }
  requestAnimationFrame(() => setTimeout(apply, 0));
}

/** Write the saved appearance, sky and motion onto <html>, as theme-boot.js does. */
export function applyThemeState(root: HTMLElement = document.documentElement, now = new Date()) {
  const saved = read(APPEARANCE_STORAGE_KEY);
  const appearance: Appearance = isAppearance(saved) ? saved : "system";
  const sky = resolveSky(appearance, read(SCENE_STORAGE_KEY), now);
  const theme = resolveTheme(appearance, sky);
  const reduce = prefersReducedMotion() || read(MOTION_STORAGE_KEY) === "reduce";
  const changed =
    root.dataset.theme !== theme || root.dataset.sky !== sky || root.dataset.appearance !== appearance;
  const apply = () => {
    root.dataset.appearance = appearance;
    root.dataset.theme = theme;
    root.dataset.sky = sky;
    root.dataset.motion = reduce ? "reduce" : "full";
    if (reduce) root.dataset.reduceMotion = "true";
    else delete root.dataset.reduceMotion;
  };
  if (changed) withoutTransitions(root, apply);
  else apply();
}

export function setAppearance(appearance: Appearance) {
  write(APPEARANCE_STORAGE_KEY, appearance === "system" ? null : appearance);
  applyThemeState();
}

/** Motion as the owner chose it here: the system's setting, or always reduced. */
export type MotionPreference = "system" | "reduce";

export function motionPreference(): MotionPreference {
  return read(MOTION_STORAGE_KEY) === "reduce" ? "reduce" : "system";
}

/** Reduce motion in this window whatever the system says, or follow the system again. */
export function setMotionPreference(preference: MotionPreference) {
  write(MOTION_STORAGE_KEY, preference === "reduce" ? "reduce" : null);
  applyThemeState();
}

/** Pin a sky, or "time" to follow the clock again. */
export function setSkyPreference(preference: ScenePreference) {
  write(SCENE_STORAGE_KEY, preference === "time" ? null : preference);
  applyThemeState();
}

const CYCLE: Appearance[] = ["system", "light", "dark"];

/** System, then light, then dark (t3code's appearance.cycle). */
export function cycleAppearance() {
  const saved = read(APPEARANCE_STORAGE_KEY);
  const current: Appearance = isAppearance(saved) ? saved : "system";
  setAppearance(CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length] ?? "system");
}

/**
 * Keep <html> current for the life of the window: the OS motion setting,
 * other windows' changes, and the sky (and on Auto the theme with it) at each
 * hour it turns. Returns the function that stops it.
 */
export function startThemeSync(): () => void {
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const update = () => applyThemeState();
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === APPEARANCE_STORAGE_KEY ||
      event.key === SCENE_STORAGE_KEY ||
      event.key === MOTION_STORAGE_KEY
    ) {
      update();
    }
  };
  still?.addEventListener("change", update);
  window.addEventListener("storage", onStorage);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const scheduleSky = () => {
    timer = setTimeout(() => {
      update();
      scheduleSky();
    }, msUntilNextScene(new Date()));
  };
  scheduleSky();
  // A laptop that slept through the change: check again when the window comes back.
  document.addEventListener("visibilitychange", update);

  return () => {
    still?.removeEventListener("change", update);
    window.removeEventListener("storage", onStorage);
    document.removeEventListener("visibilitychange", update);
    if (timer) clearTimeout(timer);
  };
}

export interface ThemeSnapshot {
  appearance: Appearance;
  theme: Theme;
  sky: Scene;
  skyPinned: boolean;
  reducedMotion: boolean;
}

let cachedKey = "";
let cached: ThemeSnapshot | null = null;

function snapshot(): ThemeSnapshot {
  const root = document.documentElement;
  const appearance = isAppearance(root.dataset.appearance) ? root.dataset.appearance : "system";
  const theme: Theme = root.dataset.theme === "dark" ? "dark" : "light";
  const sky: Scene = isScene(root.dataset.sky) ? root.dataset.sky : "day";
  const skyPinned = isScene(read(SCENE_STORAGE_KEY));
  const reducedMotion = root.dataset.motion === "reduce";
  const key = `${appearance}|${theme}|${sky}|${skyPinned}|${reducedMotion}`;
  if (key !== cachedKey || !cached) {
    cachedKey = key;
    cached = { appearance, theme, sky, skyPinned, reducedMotion };
  }
  return cached;
}

function subscribe(onChange: () => void) {
  const watch = new MutationObserver(onChange);
  watch.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-appearance", "data-sky", "data-motion"],
  });
  return () => watch.disconnect();
}

const SERVER: ThemeSnapshot = {
  appearance: "system",
  theme: "light",
  sky: "day",
  skyPinned: false,
  reducedMotion: false,
};

/** The window's appearance, sky and motion, followed live. */
export function useTheme(): ThemeSnapshot {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER);
}
