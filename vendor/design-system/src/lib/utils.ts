// From pingdotgg/t3code apps/web/src/lib/utils.ts (MIT, Copyright (c) T3 Tools Inc.).
// Changes: the t3code id helpers (ProjectId, ThreadId, effect's Hex) are left
// out; tailwind-merge also learns Zephium's role radii, elevations and curves
// (design/bridge.css), so `rounded-control` dedupes against `rounded-lg`, and
// Lanes' named type (design/lanes.css: text-hero, font-header).

import { type CxOptions, cx } from "class-variance-authority";
import { extendTailwindMerge } from "tailwind-merge";

// Register extra font sizes and background images so tailwind-merge does not
// treat text-2xs or bg-composer-seam-below as colors.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "2xs",
        "3xs",
        "4xs",
        "5xs",
        "caption",
        "label",
        "body",
        "title",
        "display",
        "headline",
        "reading",
        "hero",
        "lede",
        "figure",
      ],
      "font-weight": ["header"],
      tracking: ["header"],
      radius: [
        "swatch",
        "inset",
        "row",
        "control-compact",
        "control",
        "control-large",
        "card",
        "panel",
        "capsule",
      ],
      shadow: [
        "raised",
        "float",
        "overlay",
        "menu",
        "sheet",
        "badge",
        "control",
        "field-focus",
        "shine",
        "shine-top",
        "sky",
        "composer",
      ],
      ease: ["emphasized", "smooth", "press", "exit", "snap", "spring", "drawer"],
    },
    classGroups: { "bg-image": [{ bg: ["composer-seam-below", "composer-seam-above"] }] },
  },
});

export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs));
}

export function isMacPlatform(platform: string): boolean {
  return /mac|iphone|ipad|ipod/i.test(platform);
}

export function normalizeSearchText(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function randomUUID(): string {
  return globalThis.crypto.randomUUID();
}
