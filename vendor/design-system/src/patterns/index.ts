// @sam/design-system/patterns: kit pieces that were made for one Lanes screen and
// carry its shape. Each is the Lanes file, with any Lanes product data
// replaced by props (its header says what changed). Use them when a project
// has the same job; they are not part of the main entry.
//
//   LiveView   a live view of a page in a browser somewhere else (Lanes' sign-in
//              on the owner's cloud computer): frame, pointer and keys mapped.
//   SiteLogo   a site's mark: a project's own logo for it (`logos`), else its
//              favicon, else a globe.
//   PalFace, PalPortrait, faces   Lanes' mascot, the pal, drawn. Lanes' own
//              identity: use it only in a project that means to look like Lanes.

export * from "./live-view";
export * from "./site-logo";
export * from "./pal/pal-portrait";
export * from "./pal/faces";
// The pal's paints and inks (Lanes' design/agents.ts), for a swatch of its colours.
export { FACE_INK, FACE_PAINTS } from "../design/agents";

// The shell's page parts (Lanes' components/shell, t3code's): the band across the top of a
// section and the page column under it. layout-and-responsive.md shows the shell they make.
export * from "./shell/WorkspacePageContainer";
export * from "./shell/WorkspacePageHeader";
export * from "./shell/ScreenHeader";
