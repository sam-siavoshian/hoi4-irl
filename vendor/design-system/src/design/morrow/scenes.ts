// From sam-siavoshian/morrow web/src/components/sky/scenes.ts (the owner's own
// repo): the three skies and the paper each dissolves into. Changes: the
// storage key is Lanes' and "time" replaces Morrow's "system", because Lanes
// adds the clock. Morrow picks its sky from the system's light or dark; Lanes
// changes it with the hour of the day unless the person pins one (Settings),
// so the window is dawn in the morning, day at noon and night after dark.
// Morrow's plainSky (the WebGL shader's pictures) is left out: the app draws
// only the baked sky. public/theme-boot.js mirrors sceneForHour before first
// paint; ../theme-boot.test.ts holds the two together.

/** The three skies in ./sky, baked by Morrow's scripts/bake-sky.ts. */
export const SCENES = ["day", "dawn", "night"] as const;

export type Scene = (typeof SCENES)[number];

/** "time" follows the clock; a scene pins that sky. */
export type ScenePreference = Scene | "time";

export const SCENE_STORAGE_KEY = "lanes:sky";

export const SCENE_LABEL: Record<Scene, string> = {
  day: "Day",
  dawn: "Dawn",
  night: "Night",
};

/** Paper each sky dissolves into; mirrors `--sky-paper` in ./sky.css and the bake script. */
export const SCENE_PAPER: Record<Scene, readonly [number, number, number]> = {
  day: [247, 247, 248],
  dawn: [242, 240, 250],
  night: [26, 29, 37],
};

export const isScene = (value: unknown): value is Scene =>
  value === "day" || value === "dawn" || value === "night";

/**
 * When each sky starts, in local hours. Dawn's lavender holds both ends of the
 * light (first light and dusk), day covers the working day, and night the
 * rest. The same hours as the landing site's SCENE_HOURS
 * (site/components/sky/scenes.ts), so the landing page and the app show the
 * same sky at the same hour; change both together.
 */
export const SKY_HOURS: readonly { from: number; scene: Scene }[] = [
  { from: 5, scene: "dawn" },
  { from: 8, scene: "day" },
  { from: 17, scene: "dawn" },
  { from: 20, scene: "night" },
];

/** The sky for an hour of the local day, 0-23 (fractions and out-of-range hours wrap). */
export function sceneForHour(hour: number): Scene {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  let scene: Scene = "night";
  for (const band of SKY_HOURS) if (h >= band.from) scene = band.scene;
  return scene;
}

/** The sky right now, by the local clock. */
export function sceneForDate(date: Date): Scene {
  return sceneForHour(date.getHours());
}

/** Milliseconds from `date` until the sky next changes (at least one second). */
export function msUntilNextScene(date: Date): number {
  const now = sceneForDate(date);
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  for (let step = 0; step < 25; step += 1) {
    next.setHours(next.getHours() + 1);
    if (sceneForDate(next) !== now) break;
  }
  return Math.max(1000, next.getTime() - date.getTime());
}

/** The pinned sky, or the clock's when nothing (or nothing valid) is pinned. */
export function resolveScene(preference: string | null | undefined, date: Date): Scene {
  return isScene(preference) ? preference : sceneForDate(date);
}
