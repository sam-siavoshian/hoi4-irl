// The steps a campaign goes through, one under another: a mark for each (its
// icon in a round well), a few words, and a line under them, joined by a thin
// rule. Two uses:
//
//   - an explainer (no `state` on any step): every step in the same quiet
//     well, read top to bottom: "How Lanes works" on the sky, Settings' help;
//   - a live trail (`state` on each step): the steps done take a tick, the
//     step on now is lit (its well filled, a slow ring round it that stops
//     under reduced motion) and is `aria-current="step"`, the ones still to
//     come are faint. The chat's "What happens next" card under a deal line.
//
// `variant`: `page` on the page's own ground, `sky` on the sky's glass.
// `size`: `roomy` (32px wells, a line under every step), `compact` (20px,
// for a card in the chat). The rules are in ./step-trail.css.
//
// Ours (Lanes); nothing here is copied. Its rhythm follows the kit's
// StepList (./step-shell.tsx: rows arriving one after another).

import { CheckIcon } from "lucide-react";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "../../lib/utils";

import "./step-trail.css";

export type StepTrailState = "done" | "now" | "next";

export interface StepTrailStep {
  /** A stable key, also `data-step-trail` on its row. */
  id: string;
  /** A lucide icon element. A step done shows a tick in its place. */
  icon: ReactNode;
  title: ReactNode;
  /** One line under the title. */
  detail?: ReactNode;
  /** Live trails only: where the work is. Leave it out on every step for an explainer. */
  state?: StepTrailState;
}

export type StepTrailProps = Omit<ComponentProps<"ol">, "children"> & {
  steps: readonly StepTrailStep[];
  variant?: "page" | "sky";
  size?: "roomy" | "compact";
  /** Settle in one row after another. Off for a card that updates in place. */
  arrive?: boolean;
};

/** What a screen reader hears before a live step's title. */
const SPOKEN: Record<StepTrailState, string> = { done: "Done: ", now: "Now: ", next: "Next: " };

export function StepTrail({
  steps,
  variant = "page",
  size = "roomy",
  arrive = true,
  className,
  ...props
}: StepTrailProps) {
  return (
    <ol
      data-slot="step-trail"
      data-variant={variant}
      data-size={size}
      data-arrive={arrive ? "" : undefined}
      className={cn("step-trail", className)}
      {...props}
    >
      {steps.map((step, index) => (
        <li
          key={step.id}
          data-step-trail={step.id}
          data-state={step.state}
          aria-current={step.state === "now" ? "step" : undefined}
          className="step-trail-item"
          style={{ "--i": index } as CSSProperties}
        >
          <span aria-hidden className="step-trail-mark">
            {step.state === "done" ? <CheckIcon /> : step.icon}
          </span>
          <span className="step-trail-words">
            <span className="step-trail-title">
              {step.state ? <span className="sr-only">{SPOKEN[step.state]}</span> : null}
              {step.title}
            </span>
            {step.detail ? <span className="step-trail-detail">{step.detail}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
