// Copied from pingdotgg/t3code apps/web/src/components/ui/button.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes (the kit, app/ui/COMPONENTS.md): t3code's variants and sizes are all
// kept; added are the names the kit speaks (`variant="primary"`, the same lit
// fill as `default`; `size="md"`, the same as `default`), `shape="capsule"`
// (Zephium's onboarding controls, by way of Morrow step-chrome.tsx), and two
// props from that same step chrome's PrimaryAction: `loading` keeps the
// button's width, hides its words and turns a spinner in their place (t3code's
// Spinner, or opencode's radar for agent work), and `kbd` puts the key that
// presses it after the label (./shortcut-hint.tsx).
// From Morrow (sam-siavoshian/morrow web/src/components/ui/button.tsx, the
// owner's own repo), its feel: solid buttons lift to 1.012 on hover where a
// mouse can hover, and
// its four variants for UI standing on the sky or wanting light on its rim:
// `sky`, `sky-secondary`, `beam`, `sky-beam`, capsules as all of Morrow's
// are. Morrow's token names are this app's (`text-text` is
// `text-foreground`, `shadow-hairline` the `hairline` utility).
// From t3code's composer (apps/web/src/components/chat/ComposerPrimaryActions.tsx),
// its round send and stop: `variant="send"` (the message-action fill that
// grows a little on hover, grey while there is nothing to send) and
// `variant="stop"` (the destructive fill), with `shape="circle"`.
// Motion (design/motion/README.md): every button is `pressable` (rule 4, 14:
// 0.97 at once on the press, eased back over --motion-press on release, its
// fill and ink on the same release), and `loading` overlaps the words leaving
// with the spinner arriving (rule 16).

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { RadarSpinner } from "../../design/opencode/RadarSpinner";
import { cn } from "../../lib/utils";
import { ShortcutHint } from "./shortcut-hint";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "[--control-icon-color:currentColor] [&_svg]:-mx-0.5 relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[var(--control-radius)] border font-medium text-base outline-none pressable [&:not([aria-haspopup]):not(:disabled):not([aria-disabled=true])]:will-change-[scale] before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--control-radius)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 aria-disabled:cursor-not-allowed aria-disabled:opacity-64 sm:text-sm [&_svg:not([class*='text-'])]:text-[var(--control-icon-color)] [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
      shape: "default",
    },
    variants: {
      size: {
        compact:
          "h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-xs before:rounded-[calc(var(--radius-md)-1px)] [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-9 px-[calc(--spacing(3)-1px)] sm:h-8",
        md: "h-9 px-[calc(--spacing(3)-1px)] sm:h-8",
        icon: "size-9 sm:size-8",
        "icon-lg": "size-10 sm:size-9",
        "icon-micro":
          "size-5 rounded-sm p-0 before:rounded-[calc(var(--radius-sm)-1px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-tiny": "size-4 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 sm:size-7",
        "icon-xl":
          "size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs":
          "size-7 sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9",
        micro:
          "h-5 gap-1 rounded-sm px-[calc(--spacing(1.5)-1px)] text-[11px] before:rounded-[calc(var(--radius-sm)-1px)] sm:text-[11px] [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-3",
        multiline:
          "min-h-9 px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] whitespace-normal sm:min-h-8",
        sm: "h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7",
        "sm-multiline":
          "min-h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)] whitespace-normal sm:min-h-7",
        xl: "h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        xs: "h-7 gap-1 px-[calc(--spacing(2)-1px)] text-sm sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default:
          "not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-primary bg-primary text-primary-foreground shadow-primary/24 shadow-xs [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:bg-primary/90",
        primary:
          "not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-primary bg-primary text-primary-foreground shadow-primary/24 shadow-xs [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:bg-primary/90",
        destructive:
          "not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-destructive bg-destructive text-white shadow-destructive/24 shadow-xs [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:bg-destructive/90",
        "destructive-outline":
          "border-input bg-popover not-dark:bg-clip-padding text-destructive-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:border-destructive/32 [:hover,[data-pressed]]:bg-destructive/4",
        ghost:
          "[--control-icon-color:var(--contrast-muted-foreground)] border-transparent text-foreground data-pressed:bg-accent [:hover,[data-pressed]]:bg-accent",
        "ghost-muted":
          "[--control-icon-color:currentColor] border-transparent text-muted-foreground data-pressed:bg-accent [:hover,[data-pressed]]:bg-accent [:hover,[data-pressed]]:text-foreground",
        "ghost-destructive":
          "[--control-icon-color:currentColor] border-transparent text-muted-foreground data-pressed:bg-accent [:hover,[data-pressed]]:bg-accent [:hover,[data-pressed]]:text-destructive",
        glass:
          "surface-glass [--control-icon-color:var(--contrast-muted-foreground)] rounded-full border-border/60 text-foreground shadow-sm before:rounded-full [:hover,[data-pressed]]:border-border",
        link: "border-transparent underline-offset-4 [:hover,[data-pressed]]:underline",
        "media-close":
          "[--control-icon-color:currentColor] border-transparent bg-black/65 text-white shadow-sm ring-1 ring-white/20 [:hover,[data-pressed]]:bg-black/80 focus-visible:ring-white",
        "media-navigation":
          "[--control-icon-color:currentColor] absolute top-1/2 z-20 -translate-y-1/2 border-transparent text-white/90 [:hover,[data-pressed]]:bg-white/10 [:hover,[data-pressed]]:text-white focus-visible:ring-white focus-visible:ring-offset-transparent",
        outline:
          "[--control-icon-color:var(--contrast-muted-foreground)] border-input bg-popover not-dark:bg-clip-padding text-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:bg-accent/50 dark:[:hover,[data-pressed]]:bg-input/64",
        overlay: "border-transparent bg-black/70 text-white/65 [:hover,[data-pressed]]:bg-black/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [:active,[data-pressed]]:bg-secondary/80 [:hover,[data-pressed]]:bg-secondary/90",
        "warning-outline":
          "border-warning/32 bg-warning-surface text-warning-foreground shadow-xs/5 [:disabled,:active,[data-pressed]]:shadow-none [:hover,[data-pressed]]:border-warning/40 [:hover,[data-pressed]]:bg-warning/16 dark:[:hover,[data-pressed]]:bg-warning/24",
        /** Morrow's hero capsule, for UI standing on the sky: the sky's white ink. */
        sky: "border-transparent bg-sky-ink text-sky-on-ink [--control-icon-color:currentColor] hover:bg-sky-ink-hover",
        /** Morrow's deep-sky veil beside it: a white veil would vanish over the cloud bank. */
        "sky-secondary":
          "border-transparent bg-sky-veil text-sky-ink shadow-sky-veil sky-text [--control-icon-color:currentColor] hover:bg-sky-veil-hover",
        /** Morrow's beam: light running round the rim, for the one action that leads on. */
        beam: "beam-edge border-transparent bg-fill text-foreground hairline hover:bg-fill-hover [&_svg]:opacity-75 [&_svg]:transition-transform [&_svg]:duration-(--motion-base) hover:[&_svg:last-child]:translate-x-0.5",
        /** t3code's composer send: the message-action fill, a 5% grow on hover, grey and still while disabled. */
        send: "border-transparent bg-message-action text-message-action-foreground shadow-xs [--control-icon-color:currentColor] enabled:shadow-message-action/24 enabled:inset-shadow-control-highlight [&:hover:not(:active)]:scale-105 hover:bg-message-action-hover active:inset-shadow-control-pressed active:shadow-none disabled:bg-foreground/12 disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none disabled:hover:scale-100",
        /** t3code's composer stop: the destructive fill, for interrupting a reply. */
        stop: "border-transparent bg-destructive/90 text-white shadow-xs shadow-destructive/24 inset-shadow-control-highlight [--control-icon-color:currentColor] hover:bg-destructive active:inset-shadow-control-pressed active:shadow-none",
        /** A segment in a track (the kit's Segmented, What's new's tabs): quiet until chosen, then raised on the page. */
        segment:
          "border-transparent text-muted-foreground [--control-icon-color:currentColor] hover:text-foreground aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-raised aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-raised",
        /** A tab in a `motion-segments` track whose chosen capsule is a SegmentThumb (./segmented.tsx) sliding between them (rule 20). */
        tab: "isolate border-transparent text-muted-foreground [--control-icon-color:currentColor] hover:text-foreground aria-selected:text-foreground aria-checked:text-foreground",
        /** The beam on the sky: white light on a white veil. */
        "sky-beam":
          "beam-edge border-transparent bg-white/14 text-white shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.3)] [--beam-light:rgb(255_255_255/0.95)] [--control-icon-color:currentColor] hover:bg-white/22 [&_svg]:opacity-75 [&_svg]:transition-transform [&_svg]:duration-(--motion-base) hover:[&_svg:last-child]:translate-x-0.5",
      },
      shape: {
        default: "",
        /** Zephium's onboarding controls: a full capsule. */
        capsule: "rounded-capsule before:rounded-capsule",
        /** A round icon button (t3code's composer send and stop). */
        circle: "rounded-full before:rounded-full",
      },
    },
    compoundVariants: [
      // Morrow: solid buttons lift a hair on hover; flat ones only change fill.
      {
        variant: [
          "default",
          "primary",
          "secondary",
          "outline",
          "glass",
          "destructive",
          "destructive-outline",
          "sky",
          "sky-secondary",
          "beam",
          "sky-beam",
        ],
        className: "[@media(hover:hover)]:[&:hover:not(:active)]:scale-[1.012]",
      },
      // Morrow's buttons are capsules throughout; the sky and beam ones keep that shape here.
      {
        variant: ["sky", "sky-secondary", "beam", "sky-beam"],
        className: "rounded-capsule before:rounded-capsule",
      },
    ],
  },
);

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
type ButtonShape = NonNullable<VariantProps<typeof buttonVariants>["shape"]>;

/** The fills a ShortcutHint takes the label's ink on (Zephium Onboarding.svelte). */
const LIT: ReadonlySet<ButtonVariant> = new Set<ButtonVariant>(["default", "primary", "destructive"]);
/** Standing on the sky, a key takes the sky's tone. */
const SKY: ReadonlySet<ButtonVariant> = new Set<ButtonVariant>(["sky", "sky-secondary", "sky-beam"]);

interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  /**
   * Busy: the words stay (invisible, so the width holds), a spinner turns over
   * them, and presses are refused. Pass it as `false` too on a button that can
   * become busy, so its layout never changes when it does.
   */
  loading?: boolean;
  /** What turns while `loading`: t3code's ring for ordinary work, opencode's radar for an agent's. */
  spinner?: "ring" | "radar";
  /** The key that presses it ("enter", "mod+k"), after the label (./shortcut-hint.tsx). Hidden on phones. */
  kbd?: string;
}

function Button({
  className,
  variant,
  size,
  shape,
  loading,
  spinner = "ring",
  kbd,
  render,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render
    ? undefined
    : "button";

  // Only a button that names `loading` or `kbd` gets the inner span, so every
  // other button renders exactly as t3code's.
  const wrapped = loading !== undefined || kbd !== undefined;
  const content = wrapped ? (
    <>
      <span
        data-slot="button-content"
        className={cn(
          "inline-flex min-w-0 items-center gap-[inherit] transition-opacity duration-(--motion-swap)",
          loading && "opacity-0",
        )}
      >
        {children}
        {kbd ? (
          <ShortcutHint
            keys={kbd}
            tone={LIT.has(variant ?? "default") ? "lit" : SKY.has(variant ?? "default") ? "sky" : "plain"}
            className="max-sm:hidden"
          />
        ) : null}
      </span>
      {loading ? (
        <span data-slot="button-spinner" className="motion-appear absolute inset-0 grid place-items-center">
          {spinner === "radar" ? (
            <RadarSpinner data-component="radar" className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Spinner />
          )}
        </span>
      ) : null}
    </>
  ) : (
    children
  );

  const defaultProps = {
    className: cn(buttonVariants({ className, size, variant, shape })),
    "data-slot": "button",
    type: typeValue,
    children: content,
    disabled: disabled || loading || undefined,
    "aria-busy": loading || undefined,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export { Button, buttonVariants, type ButtonProps, type ButtonShape, type ButtonSize, type ButtonVariant };

const inlineButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center gap-0.5 font-medium underline-offset-2 [text-align:var(--inline-button-text-align,center)] [white-space:var(--inline-button-white-space,nowrap)] hover:underline focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-64",
  {
    defaultVariants: { tone: "default" },
    variants: {
      tone: {
        default: "text-foreground",
        muted: "text-muted-foreground hover:text-foreground",
        destructive: "text-destructive/80 hover:text-destructive",
        picker:
          "gap-1 text-foreground decoration-from-font underline-offset-4 data-popup-open:underline",
      },
    },
  },
);

export function InlineButton({
  className,
  tone,
  render,
  ...props
}: useRender.ComponentProps<"button"> & VariantProps<typeof inlineButtonVariants>) {
  const defaultProps = {
    className: cn(inlineButtonVariants({ tone }), className),
    "data-slot": "inline-button",
    type: render ? undefined : ("button" as const),
  };
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}
