// The kit: every visual building block of the Lanes window, from one import.
//
//   import { Button, ListSection, ListRow, StatusLabel } from "./";
//
// What each one is, its variants, when to use it and where it was copied from:
// app/ui/COMPONENTS.md. Every one of them, in every variant, light and dark,
// on the sky and off it: the catalog (`npm --prefix app run dev`, then
// http://127.0.0.1:1420/kit.html). A screen that needs a look the kit lacks
// adds a variant here; it does not hand-roll markup, colours or arbitrary
// values (src/components/ui/kit.test.ts holds that line).
//
// Files inside components/ui import each other directly, never this barrel.
//
// @sam/design-system: this is the package's main entry (`import { Button } from "@sam/design-system"`).
// Changes from Lanes' barrel: the sky is not exported here but from "@sam/design-system/backdrops"
// (optional, so a project opts into it); the product pieces are not here: LiveView, SiteLogo
// and the pal (PalFace, PalPortrait) are in "@sam/design-system/patterns", and AgentTile,
// FrameStateChip, StateBadge, ChannelLogo and the agents' Face are left out (they read Lanes'
// agents store and its third-party logos). Everything else is exported exactly as in Lanes.

// --- Primitives: t3code's (pingdotgg/t3code apps/web/src/components/ui), copied
export * from "./alert";
export * from "./alert-dialog";
export * from "./autocomplete";
export * from "./badge";
export * from "./button";
export * from "./checkbox";
export * from "./collapsible";
export * from "./command";
export * from "./dialog";
export * from "./empty";
export * from "./input";
export * from "./input-group";
export * from "./kbd";
export * from "./label";
export * from "./menu";
export * from "./scroll-area";
export * from "./select";
export * from "./separator";
export * from "./sheet";
export * from "./sidebar";
export * from "./skeleton";
export * from "./spinner";
export * from "./switch";
export * from "./textarea";
export * from "./toast";
export * from "./tooltip";
export * from "./app-route-modal";
export * from "./morph-icon";
// --- Motion: the twenty rules as helpers (design/motion/README.md)
export * from "./motion";

// --- Controls built on them
export * from "./icon-button";
export * from "./shortcut-hint";
export * from "./segmented";
export * from "./choice-select";
export * from "./choice-cards";
export * from "./chip";
export * from "./field";
export * from "./file-picker";
export * from "./sort-button";
export * from "./number-stepper";
export * from "./slider";
export * from "./editable-text";

// --- Surfaces and the sky
export * from "./glass-panel";
export * from "./composer-surface";
export * from "./composer-banner";
export * from "./composer-prompt";
export * from "./floating-bar";
export * from "./logo-tile";
export * from "./suggestion-card";

// --- Working, state and numbers
export * from "./radar";
export * from "./shimmer";
export * from "./status-dot";
export * from "./progress-meter";
export * from "./step-trail";
export * from "./stat-tile";
export * from "./day-grid";
export * from "./count-up";
export { AnimatedNumber } from "./AnimatedNumber";

// --- Layout: headings, lists, people, agents
export * from "./section-header";
export * from "./list";
export * from "./avatar";
export * from "./person-row";
export * from "./account-picker";

// --- What a screen shows instead of content, and what it says after
export * from "./empty-state";
export * from "./loading-state";
export * from "./notice";
export * from "./problem";
export * from "./code-block";

// --- Guided flows (first run), and the sound they make
export * from "./step-shell";
export * from "./sound";
