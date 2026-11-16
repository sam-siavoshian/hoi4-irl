// @sam/design-system/backdrops: the sky, OPTIONAL. Not part of the main entry, so a
// project paints Morrow's sky behind a screen only when it means to (and every
// project built on the kit does not end up looking like Lanes' chat).
//
//   import { SkyBackdrop } from "@sam/design-system/backdrops";
//   <div className="relative isolate"><SkyBackdrop placement="fill" /> ... </div>
//
// What it is: Lanes' components/ui/sky-backdrop.tsx (SkyBackdrop, BakedSky,
// Frost) over design/morrow/Sky.tsx and the scenes (design/morrow/scenes.ts:
// dawn, day, night, by the clock unless pinned). The pictures are baked files
// (design/morrow/sky/*.avif|jpg, frost-*.png), shipped with the package.
// skills/sam-design-system/references/backdrops.md says when to use it and how to
// make it a project's own.
//
// Some kit pieces draw the sky themselves when asked (Dialog's sky surface,
// StepShell's first-run screen, Card's `frost`): those import these same files.

export * from "../components/ui/sky-backdrop";
export * from "../design/morrow/scenes";
