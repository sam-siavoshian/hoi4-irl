// Copied from pingdotgg/t3code apps/web/src/components/ui/kbd.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: drawn as Zephium's keycap (zephium-browser/zephium
// frame/src/shared/ui/KeyHint/KeyHint.svelte, `.ui-keys kbd` in
// design/zephium/controls.css, MPL-2.0): 18px tall and at least 18px wide,
// 5px of padding, the inset radius, the control fill and the muted ink, the
// mono face at 11px/500 with tabular figures. t3code's was a 20px chip in the
// sans face on a 7% foreground wash. ShortcutHint (./shortcut-hint.tsx) dresses
// the same cap for a lit or sky control.

import type * as React from "react";

import { cn } from "../../lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-4.5 min-w-4.5 select-none items-center justify-center gap-1 rounded-inset bg-control px-[5px] font-medium font-mono text-caption text-muted-foreground tabular-nums [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn("inline-flex items-center gap-[3px]", className)}
      data-slot="kbd-group"
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
