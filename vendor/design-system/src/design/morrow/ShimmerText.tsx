/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Adapted from zephium-browser/website components/island/shimmer.tsx, by way of
 * sam-siavoshian/morrow web/src/components/ui/shimmer-text.tsx. Changes (here):
 * data attributes instead of a CSS module (`data-running` for Morrow's
 * `.running`, `data-shimmer-lit` for `.lit`); the styles are in
 * ./shimmer-text.css and the keyframes (Zephium's band and lit, the same steps
 * as Morrow's) in ../zephium/motion.css.
 */
import { cn } from "../../lib/utils";

type ShimmerTextProps = {
  children: string;
  /** Off: plain text, no band. */
  active?: boolean;
  className?: string;
};

/**
 * "Thinking…" text with a light band sliding across it. Transform only, so
 * it never repaints the words.
 */
export function ShimmerText({ children, active = true, className }: ShimmerTextProps) {
  return (
    <span data-shimmer="" data-running={active ? "" : undefined} className={cn(className)}>
      <span data-shimmer-words="">{children}</span>
      {active ? (
        <span data-shimmer-band="" aria-hidden="true">
          <span data-shimmer-lit="">{children}</span>
        </span>
      ) : null}
    </span>
  );
}
