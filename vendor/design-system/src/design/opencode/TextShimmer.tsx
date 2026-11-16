// React port of anomalyco/opencode packages/ui/src/typography/text-shimmer/text-shimmer.tsx
// (https://github.com/anomalyco/opencode). MIT License, Copyright (c) 2025 opencode.
// Full notice in app/ui/THIRD_PARTY_NOTICES.md. Changes: Solid's Dynamic and
// effects become a React element type and an effect; the CSS is ./micro.css.

import { createElement, useEffect, useState, type CSSProperties, type ElementType } from "react";

const swap = 220;

/** "Thinking…" text: a light sweeps across it while `active`, and fades out over 220ms when it stops. */
export function TextShimmer({
  text,
  className,
  as = "span",
  active = true,
  offset = 0,
}: {
  text: string;
  className?: string;
  as?: ElementType;
  active?: boolean;
  offset?: number;
}) {
  const [run, setRun] = useState(active);

  useEffect(() => {
    if (active) {
      setRun(true);
      return;
    }
    const timer = setTimeout(() => setRun(false), swap);
    return () => clearTimeout(timer);
  }, [active]);

  return createElement(
    as,
    {
      "data-component": "text-shimmer",
      "data-active": active ? "true" : "false",
      className,
      "aria-label": text,
      style: {
        "--text-shimmer-swap": `${swap}ms`,
        "--text-shimmer-index": `${offset}`,
      } as CSSProperties,
    },
    <span data-slot="text-shimmer-char">
      <span data-slot="text-shimmer-char-base" aria-hidden="true">
        {text}
      </span>
      <span data-slot="text-shimmer-char-shimmer" data-run={run ? "true" : "false"} aria-hidden="true">
        {text}
      </span>
    </span>,
  );
}
