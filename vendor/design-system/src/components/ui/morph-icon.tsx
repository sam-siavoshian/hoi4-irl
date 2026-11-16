// Copied from pingdotgg/t3code apps/web/src/components/MorphIcon.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: in the kit (t3code keeps it beside its components); reduced motion
// also follows this window's own setting (`data-motion="reduce"` on <html>,
// design/theme.ts), not only the system's, so a morph is an instant swap
// whenever the rest of the window stands still; the stroke defaults to 1.75,
// the weight every lucide icon here is drawn at (design/t3code/theme.css).
// The icons are vanilla `lucide` nodes (PanelLeft, Check), as t3code passes.

import { MorphIcon as BaseMorphIcon, type MorphIconProps } from "morphicons/react";

import { useTheme } from "../../design/theme";

export type { MorphIconProps };

export function MorphIcon({ reducedMotion, strokeWidth = 1.75, ...props }: MorphIconProps) {
  const { reducedMotion: windowStill } = useTheme();
  return (
    <BaseMorphIcon
      reducedMotion={reducedMotion ?? (windowStill ? "always" : "user")}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
