/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * Adapted from github.com/zephium-browser/Zephium (frame/src/features/onboarding/components/Onboarding.svelte:
 * the stage, the welcome, the head, the scene and the bar; frame/src/shared/ui/Button/Button.svelte: the controls). */
// By way of sam-siavoshian/morrow web/src/components/onboarding/step-chrome.tsx
// and onboarding-wizard.tsx (the owner's React port), as first run carried
// them (screens/onboarding/StepChrome.tsx, IntroStep.tsx, OnboardingScreen.tsx).
// What is Zephium's, exactly (the values are in ./step-shell.css and
// design/zephium/controls.css):
//
//   - the controls are Zephium's Button: `.ui-button .ui-control`, 34px large
//     capsules, 13px at 500, a flat lit fill, pending dots, the ↵ keycap;
//   - the head is 40px at 500, arriving at 250ms, its line at 360ms and the
//     scene at 420ms;
//   - the bar runs the stage's width: Back as a word, the dashes, one primary;
//   - the welcome's name forms where it will stand, then its words arrive.
//
// Lanes' own, kept by the owner's choice: the whole window stays on the sky
// (Morrow's SkyStage) and every step's scene stands in a frosted panel
// (`sky-glass`), where Zephium pulls back onto the window's ground. No step
// machine here (the bar takes `at` and `of`), so any guided flow can use it.
//
//   StepStage           the window on the sky: the top row, the scroll, the bar
//   StepWelcome         the door: the name, its words and its one action
//   StepShell           the heading on the sky, the step's scene in glass under it
//   StepShellFeatures   the last step's line of what is already on
//   StepShellBar        Back, where you are (the dashes, or a notice), the actions
//   StepActionSlot,     where a step puts its actions: the bar, from anywhere in the step
//   StepActions
//   StepButton          Zephium's control: primary, ghost or secondary; large; capsule; `tone="sky"`
//   StepPrimaryAction   the step's one primary, which Enter presses
//   StepSecondaryAction a second action, as a plain word
//   StepTopAction       a quiet word in the top row ("Skip setup")
//   StepList,           a step's list of things: an account, a limit, what is set up
//   StepListRow         (Zephium's Essentials rows: arriving one after another)

import { CheckIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type CSSProperties,
  type ReactNode,
  type Ref,
  useContext,
  useId,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils";
import { ShortcutHint } from "./shortcut-hint";
import { SkyBackdrop } from "./sky-backdrop";

import "./step-shell.css";

// ------------------------------------------------------------ the controls

type StepButtonProps = Omit<ComponentProps<"button">, "type"> & {
  type?: "button" | "submit";
  /** Primary is the lit fill; ghost is a plain word; secondary is Zephium's shine plate. */
  variant?: "primary" | "ghost" | "secondary";
  /** Large is a page's call to action (34px); regular is the one control size. */
  size?: "large" | "regular";
  shape?: "capsule" | "rounded";
  /** `sky`: standing on the sky, the lit fill is the sky's own white (the welcome). */
  tone?: "default" | "sky";
  /** Three pulsing dots before the label, and no presses (Button.svelte `pending`). */
  pending?: boolean;
  /** The key that presses it, as a keycap after the label ("enter" is ↵). */
  kbd?: string;
};

/** Zephium's Button: the same markup Button.svelte renders, on design/zephium/controls.css. */
export function StepButton({
  variant = "secondary",
  size = "large",
  shape = "capsule",
  tone = "default",
  pending = false,
  kbd,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: StepButtonProps) {
  return (
    <button
      type={type}
      {...props}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      data-slot="step-button"
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      data-tone={tone === "sky" ? "sky" : undefined}
      className={cn("ui-button ui-control", variant === "secondary" && "ui-shine ui-shine-press", className)}
    >
      {pending ? (
        <span className="ui-button-pending" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      ) : null}
      {children}
      {kbd ? (
        <ShortcutHint
          keys={kbd}
          tone={variant === "primary" ? "lit" : "plain"}
          data-slot="step-button-key"
        />
      ) : null}
    </button>
  );
}

type ActionProps = Omit<StepButtonProps, "variant" | "size" | "shape" | "kbd">;

/** The step's one primary action. Enter presses it (`data-step-primary`), so it carries the ↵ keycap. */
export function StepPrimaryAction({
  loading = false,
  pending = false,
  ...props
}: ActionProps & {
  /** Same as `pending`. */
  loading?: boolean;
}) {
  return <StepButton variant="primary" kbd="enter" data-step-primary="" pending={loading || pending} {...props} />;
}

/** A second action beside the primary: a plain word (Zephium's ghost capsule, as Back is). */
export function StepSecondaryAction(props: ActionProps) {
  return <StepButton variant="ghost" {...props} />;
}

/** A quiet word in the top row, standing on the sky (Onboarding.svelte `.skip`). */
export function StepTopAction({ className, type = "button", ...props }: Omit<ComponentProps<"button">, "type"> & { type?: "button" }) {
  return <button type={type} data-slot="step-top-action" className={className} {...props} />;
}

// ------------------------------------------------------------ the stage

type StepStageProps = Omit<ComponentProps<"div">, "children"> & {
  /** The step on show, as `data-step`. */
  step: string;
  /** Where the sky's horizon sits, as a percentage of the window's height. */
  horizon: number;
  /** The words leave first (`data-leaving`), then the bar. */
  leaving?: boolean;
  /** The top row, right-aligned: StepTopAction. */
  top?: ReactNode;
  /** StepShellBar; none on the welcome. */
  bar?: ReactNode;
  children: ReactNode;
};

/**
 * The whole window, on the sky: Morrow's SkyStage on Zephium's stage. The sky
 * stays put; the steps scroll above the bar, which stands at the foot with
 * nothing behind it. A region of its own rather than Zephium's
 * role="dialog", so a flow's keys leave real dialogs their own.
 */
export function StepStage({ step, horizon, leaving = false, top, bar, children, className, ...props }: StepStageProps) {
  return (
    <div
      role="region"
      {...props}
      data-slot="step-stage"
      data-step={step}
      data-leaving={leaving || undefined}
      data-bar={bar ? "" : undefined}
      className={className}
    >
      <SkyBackdrop placement="screen" horizon={horizon} arrive />
      <div data-slot="step-stage-top">{top}</div>
      <main data-slot="step-stage-scroll">{children}</main>
      {bar}
    </div>
  );
}

// ------------------------------------------------------------ the welcome

type StepWelcomeProps = Omit<ComponentProps<"section">, "children"> & {
  /** The word the dots form: "Lanes", or the person's name. */
  name: string;
  nameRef?: Ref<HTMLHeadingElement>;
  /** The canvas the dots gather on. */
  airRef?: Ref<HTMLCanvasElement>;
  /** Where it is: the name hidden while `waiting` and `forming`, its words arriving once `formed`. */
  phase: "waiting" | "forming" | "formed";
  tagline: ReactNode;
  /** Stands where the name will, until it forms: a Begin, when the browser wants a click first. */
  gate?: ReactNode;
  /** Under the words once the name stands: Get started. */
  action?: ReactNode;
};

/**
 * The door (Onboarding.svelte, welcome): the name formed out of the sky's
 * halftone at Zephium's size and weight, then the tagline and the one action
 * rising in under it. The formation itself is the flow's (it owns the dots).
 */
export function StepWelcome({ name, nameRef, airRef, phase, tagline, gate, action, className, ...props }: StepWelcomeProps) {
  const id = useId();
  return (
    <section aria-labelledby={`${id}-name`} {...props} data-slot="step-welcome" data-phase={phase} className={className}>
      <canvas ref={airRef} aria-hidden="true" data-slot="step-welcome-air" />
      <div data-slot="step-welcome-stand">
        <h1 ref={nameRef} id={`${id}-name`} data-slot="step-welcome-name" data-glass-text="">
          {name}
        </h1>
        {gate}
      </div>
      <div data-slot="step-welcome-words" data-glass-text="">
        <p>{tagline}</p>
        <div data-slot="step-welcome-action">{action}</div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ a step

type StepShellProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Under the heading, on the sky: StepShellFeatures. */
  aside?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
  /** The step's name, as `data-step`. */
  step?: string;
  /**
   * `wide` for a scene that lays things side by side (the writing style's cards): 1080px, not 600px.
   * `medium` (800px) for a grid of three short answers a row, each on one line (About you).
   */
  width?: "default" | "medium" | "wide";
  /**
   * `glass` (default): the scene in one frosted panel. `none`: the scene stands on the sky as it
   * is, for cards that are glass themselves (first run's "Here’s what Lanes does").
   */
  surface?: "glass" | "none";
  className?: string;
  children: ReactNode;
};

/** Heading on the sky, the step's scene in frosted glass under it. Both rise in when the step arrives. */
export function StepShell({
  title,
  description,
  aside,
  headingRef,
  step,
  width = "default",
  surface = "glass",
  className,
  children,
}: StepShellProps) {
  const id = useId();
  return (
    <section
      data-slot="step-shell"
      data-step={step}
      data-width={width}
      aria-labelledby={`${id}-title`}
      className={className}
    >
      <header data-slot="step-shell-head" data-glass-text="">
        <h1 ref={headingRef} id={`${id}-title`} tabIndex={-1}>
          {title}
        </h1>
        {description ? <p>{description}</p> : null}
        {aside}
      </header>
      <div data-slot="step-shell-glass" data-surface={surface} className={surface === "glass" ? "sky-glass" : undefined}>
        {children}
      </div>
    </section>
  );
}

/** The ready step's line of what is already on (Onboarding.svelte `.features`). */
export function StepShellFeatures({
  items,
  label = "What Lanes does",
}: {
  items: readonly { icon: ReactNode; label: string }[];
  label?: string;
}) {
  return (
    <ul data-slot="step-shell-features" aria-label={label}>
      {items.map((item, index) => (
        <li key={item.label} style={{ "--i": index } as CSSProperties}>
          {item.icon}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------ the bar

type StepShellBarProps = {
  /** Where you are: step `at` of `of` (1-based). */
  at: number;
  of: number;
  onBack?: (() => void) | undefined;
  /** A passing failure, said where the dashes are until it clears (Zephium's `notice`). */
  notice?: string | null | undefined;
  /** The step's actions, on the right. */
  actions?: ReactNode;
  /** Or a node the actions are portalled into (StepActionSlot). */
  slotRef?: Ref<HTMLDivElement>;
  label?: string;
  className?: string;
};

/**
 * One quiet row for the whole journey, the stage's width at its foot: Back as
 * a word, where you are, and the step's own actions. Nothing behind it, and
 * nothing floats over the scene it steers (Onboarding.svelte `.bar`).
 */
export function StepShellBar({ at, of, onBack, notice, actions, slotRef, label = "Setup", className }: StepShellBarProps) {
  return (
    <nav aria-label={label} data-slot="step-shell-bar" data-glass-text="" className={className}>
      <span data-slot="step-shell-back">
        {onBack ? (
          <StepButton variant="ghost" data-step-back="" onClick={onBack}>
            Back
          </StepButton>
        ) : null}
      </span>
      <span data-slot="step-shell-middle">
        {notice ? (
          <span data-slot="step-shell-notice" role="status">
            {notice}
          </span>
        ) : (
          <StepProgress at={at} of={of} />
        )}
      </span>
      <div ref={slotRef} data-slot="step-shell-actions">
        {actions}
      </div>
    </nav>
  );
}

/** Zephium's dashes: done ones dim, the current one long and lit. */
export function StepProgress({ at, of }: { at: number; of: number }) {
  return (
    <ol aria-label={`Step ${at} of ${of}`} data-slot="step-shell-progress">
      {Array.from({ length: of }, (_, index) => {
        const state = index + 1 < at ? "done" : index + 1 === at ? "now" : "next";
        return (
          <li key={index} aria-current={state === "now" ? "step" : undefined} data-state={state} data-slot="step-shell-dash" />
        );
      })}
    </ol>
  );
}

const ActionSlot = createContext<HTMLElement | null>(null);

/** Names the bar's action node (StepShellBar `slotRef`) for every StepActions under it. */
export const StepActionSlot = ActionSlot.Provider;

/** Renders a step's actions into the bar, so every step steers from the same place. */
export function StepActions({ children }: { children: ReactNode }) {
  const slot = useContext(ActionSlot);
  return slot ? createPortal(children, slot) : null;
}

// ------------------------------------------------------------ a step's list

/** A step's list of things, divided by hairlines, the rows arriving one after another. */
export function StepList({ className, ...props }: ComponentProps<"ul">) {
  return <ul data-slot="step-list" className={className} {...props} />;
}

type StepListRowProps = Omit<ComponentProps<"li">, "title"> & {
  /** Its place in the list, for the arrival's stagger. */
  index: number;
  /** Before the words: a LogoTile, an Avatar. */
  media?: ReactNode;
  /** Or a lucide icon, on Zephium's 36px tile (Models.svelte `.tile`). */
  icon?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  /** The detail in the faint ink: not set up yet. */
  quiet?: boolean;
  /** A tick after the title, and `data-done`. */
  done?: boolean;
  /** On the right: a control. */
  trailing?: ReactNode;
};

/** One thing in a StepList: its mark, its name in 15px at 500, a line under it, a control on the right. */
export function StepListRow({ index, media, icon, title, detail, quiet = false, done = false, trailing, style, ...props }: StepListRowProps) {
  return (
    <li
      data-slot="step-list-row"
      data-done={done || undefined}
      style={{ "--i": index, ...style } as CSSProperties}
      {...props}
    >
      {icon ? (
        <span data-slot="step-list-tile" aria-hidden="true">
          {icon}
        </span>
      ) : (
        media
      )}
      <div data-slot="step-list-words">
        <p data-slot="step-list-title">
          <span>{title}</span>
          {done ? <CheckIcon strokeWidth={2.5} aria-label="Done" /> : null}
        </p>
        {detail ? (
          <div data-slot="step-list-detail" data-quiet={quiet || undefined}>
            {detail}
          </div>
        ) : null}
      </div>
      {trailing ? <div data-slot="step-list-trailing">{trailing}</div> : null}
    </li>
  );
}
