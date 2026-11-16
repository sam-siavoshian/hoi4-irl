// From sam-siavoshian/morrow web/src/components/sky/static-sky.tsx (the owner's
// own repo). Changes: a pinned scene is `data-sky` (Lanes keeps light/dark
// apart from the sky), the CSS is global (./sky.css) instead of a module, and
// the baked sky carries data-slot="sky" so tests can find it.

import type { CSSProperties } from "react";

import { cn } from "../../lib/utils";
import type { Scene } from "./scenes";

type SkyProps = {
  /** Which sky. Follows the nearest `data-sky` (on <html>, the clock's) when left out: pure CSS, no flash. */
  scene?: Scene;
  className?: string;
  style?: CSSProperties;
};

type BakedSkyProps = SkyProps & {
  /** Where the halftone horizon sits, as a percentage of the box's height. */
  horizon?: number;
  /** Fade in on mount. */
  arrive?: boolean;
};

/**
 * The sky as a still picture with the halftone dissolve printed into it. No
 * WebGL, no JavaScript: for sections that need the look without the cost.
 */
export function BakedSky({ scene, horizon, arrive, className, style }: BakedSkyProps) {
  const vars = { ...(horizon !== undefined && { "--horizon": horizon }), ...style } as CSSProperties;
  return (
    <div
      aria-hidden="true"
      data-arrive={arrive ? "" : undefined}
      // A pinned scene brings its own picture and the paper it dissolves into.
      data-sky={scene}
      data-slot="sky"
      className={cn("sky-baked", className)}
      style={vars}
    />
  );
}

/**
 * Frosted glass for free: the sky pre-blurred to 192x108 and stretched over the
 * box. Place it as the first child of a `relative isolate` panel.
 */
export function Frost({ scene, className, style }: SkyProps) {
  return <div aria-hidden="true" data-sky={scene} className={cn("sky-frost", className)} style={style} />;
}
