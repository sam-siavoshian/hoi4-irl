// React port of anomalyco/opencode (https://github.com/anomalyco/opencode),
// MIT License, Copyright (c) 2025 opencode. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
//
//   packages/app/src/session/header/session-working-indicator.tsx   WorkingIndicator
//   packages/session-ui/src/v2/components/session-progress-indicator-v2.tsx   ProgressIndicator
//   packages/app/src/runtime/presence.ts + animated-presence.ts      usePresence
//
// Changes: the session lookup is a `working` prop (the chat header passes
// whether its agent is generating), and Solid's signals become React state;
// the icon colour is `text-muted-foreground` (opencode's text-v2-icon-icon-muted,
// which ./micro.css feeds from the same rung), and tw-animate's
// `animate-out fade-out fill-mode-forwards` is `animate-working-out`
// (./micro.css: the same 200ms ease-out fade to 0, held), as Lanes has no
// tw-animate.
//
// Placement, as opencode's header has it: the indicator goes BEFORE the title
// (`ms-1 me-0.5`; `-me-0.5` on the way out cancels the header's 2px gap, so the
// title does not move when the indicator unmounts).

import { useCallback, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "../../lib/utils";
import { RadarSpinner } from "./RadarSpinner";

// The app's one activity spinner, shared by the activity chip, subagent rows, task cards and loading tabs.
export function ProgressIndicator(props: ComponentProps<"svg">) {
  return (
    <RadarSpinner
      {...props}
      width={props.width ?? 16}
      height={props.height ?? 16}
      data-component="session-progress-indicator-v2"
      aria-hidden={props["aria-hidden"] ?? "true"}
    />
  );
}

type PresenceState = "present" | "hiding" | "hidden";

/**
 * Keeps an element mounted while its CSS exit animation runs. Reduced motion needs no special case: when the styles
 * drop the animation, the computed name is "none" and the element hides at once.
 *
 * opencode's createPresence (runtime/presence.ts) with createAnimatedPresence's `animate` flag. The hide decision
 * reads the element's computed animation once the exit class is on it: a layout effect, where Solid's effect runs
 * after render.
 */
export function usePresence(show: boolean) {
  const element = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<PresenceState>(show ? "present" : "hidden");
  const [previous, setPrevious] = useState(show);
  // `animate` turns on at the first change and stays on, so the first paint never transitions.
  const [animate, setAnimate] = useState(false);
  // The last animation the element started. A different name when hiding means an exit animation is running.
  const started = useRef("none");

  if (previous !== show) {
    setPrevious(show);
    setAnimate(true);
    setState(show ? "present" : element.current ? "hiding" : "hidden");
  }

  useLayoutEffect(() => {
    if (show) {
      // Forget the previous exit animation so the next hide runs it again.
      started.current = "none";
      return;
    }
    if (state !== "hiding") return;
    const node = element.current;
    const styles = node ? getComputedStyle(node) : null;
    const current = styles?.animationName ?? "none";
    if (current === "none" || styles?.display === "none" || started.current === current) setState("hidden");
  }, [show, state]);

  // The element's own animations: which one started, and whether the exit one ended.
  const ref = useCallback((node: HTMLElement | null) => {
    element.current = node;
    if (!node) return;
    const animationName = () => getComputedStyle(node).animationName;
    const start = (event: AnimationEvent) => {
      if (event.target === node) started.current = animationName();
    };
    const end = (event: AnimationEvent) => {
      if (event.target === node && animationName().includes(event.animationName)) {
        setState((current) => (current === "hiding" ? "hidden" : current));
      }
    };
    node.addEventListener("animationstart", start);
    node.addEventListener("animationcancel", end);
    node.addEventListener("animationend", end);
    return () => {
      node.removeEventListener("animationstart", start);
      node.removeEventListener("animationcancel", end);
      node.removeEventListener("animationend", end);
      if (element.current === node) element.current = null;
    };
  }, []);

  return { ref, present: state !== "hidden", show, animate };
}

/**
 * The radar in a chat header while its agent is generating. It collapses its
 * own width and margins on the way out, so the title beside it never jumps.
 */
export function WorkingIndicator({
  working,
  label = "Working",
  className,
}: {
  working: boolean;
  label?: string;
  className?: string;
}) {
  const presence = usePresence(working);
  if (!presence.present) return null;

  return (
    <span
      ref={presence.ref}
      role="status"
      aria-label={label}
      data-visible={presence.show}
      data-slot="working-indicator"
      // Cancel the header's 2px gap at the end of the collapse so unmounting doesn't nudge the title.
      className={cn(
        "ms-1 me-0.5 flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden text-muted-foreground duration-(--motion-exit) ease-out data-[visible=false]:ms-0 data-[visible=false]:-me-0.5 data-[visible=false]:w-0 data-[visible=false]:opacity-0 motion-reduce:animate-none motion-reduce:transition-none",
        presence.animate && "transition-[width,margin,opacity]",
        // Presence waits for animationend; transitions alone would unmount the icon immediately.
        presence.animate && !presence.show && "animate-working-out",
        className,
      )}
    >
      <ProgressIndicator className="shrink-0" />
    </span>
  );
}
