// React port of anomalyco/opencode packages/ui/src/components/spinner.tsx
// (https://github.com/anomalyco/opencode). MIT License, Copyright (c) 2025 opencode.
// Full notice in app/ui/THIRD_PARTY_NOTICES.md. Changes: Solid's <For> and
// splitProps become JSX; the class prop is React's className (Solid's
// classList has no React counterpart); a `size` prop in px for a radar drawn
// large; the keyframes are added from a helper that does nothing without a
// document (Vitest's node environment).

import type { ComponentProps, CSSProperties } from "react";

import { radarDots, radarKeyframes, radarLoop } from "./radar";
import { syncSpinPhase } from "./spin-phase";

// Every AI activity spinner (busy session tabs, the activity chip, subagents, tool cards) shows Soft Radar. Non-AI
// loading uses Loader.

const keyframes = "spinner-radar";

const dots = radarDots();

// The keyframes are added to the document once, the first time a spinner renders.
let added = false;

function addKeyframes() {
  if (added || typeof document === "undefined") return;
  added = true;
  const style = document.createElement("style");
  style.textContent = radarKeyframes(keyframes);
  document.head.append(style);
}

export function RadarSpinner({
  className,
  size,
  style,
  "data-component": component,
  ...rest
}: ComponentProps<"svg"> & {
  "data-component"?: string;
  /** Its side in px, for a radar bigger than an icon (the company read's). Wins over a size class. */
  size?: number;
}) {
  addKeyframes();

  return (
    <svg
      {...rest}
      ref={syncSpinPhase}
      viewBox="0 0 16 16"
      data-component={component ?? "spinner"}
      data-slot="spinner-dots"
      className={className}
      style={size ? { width: size, height: size, ...style } : style}
      fill="currentColor"
    >
      {dots.map((dot, index) => (
        <rect
          key={index}
          x={dot.x}
          y={dot.y}
          width={dot.size}
          height={dot.size}
          rx={dot.size * 0.24}
          style={
            {
              "--still": dot.still,
              animation: dot.steady
                ? undefined
                : `${keyframes}-${dot.shape} calc(${radarLoop}s * var(--spinner-time, 1)) linear calc(${-radarLoop * (1 - dot.at)}s * var(--spinner-time, 1)) infinite`,
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
