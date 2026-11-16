// The motion primitives for React: the twenty rules (design/motion/README.md)
// as components and hooks, so a screen never times or curves anything itself.
// Each puts a class from design/motion/motion.css on what it wraps; the
// values are the tokens in design/motion/tokens.css.
//
//   Stagger           3, 6   rows 30ms apart, a thing's details 60ms apart
//   Crossfade         18     an icon becoming another, with blur and scale
//   Swap              16     a value replacing a value, overlapping
//   usePulse, Pulse   8      a success confirmed once, where it happened
//   Reveal            17     a clip wipe in from an edge, and back
//   SharedLayout      20, 7  one element across states (a FLIP keyed by id)
//   sharedTransition  20     the View Transitions API, for a card into a dialog
//   useTriggerOrigin  11, 12 a dialog grows from, and goes back to, its trigger
//   useRubberBand     19     a drag that resists past its ends
//   useKnob           5      a knob's stretch, once per change, continuing
//
// The press (4, 14) is a class, `pressable`, already on every kit button.
//
// Anything that can be interrupted (a crossfade, a swap, a reveal, a knob, a
// FLIP) runs as a Web Animation that starts from where the element is now
// (design/motion/motion.ts continueTo, flip), so a second change mid-flight
// carries on instead of restarting, and a re-render or StrictMode's second
// effect leaves a running animation alone. design/motion/QA.md lists what
// went wrong before, and the tests that keep it from coming back.

import {
  Children,
  cloneElement,
  type CSSProperties,
  type ElementType,
  isValidElement,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

import {
  flightVelocity,
  flip,
  layerMotion,
  prefersReducedMotion,
  revealMotion,
  rubberClamp,
  rubberUnclamp,
  stretchKnob,
  MOTION_MS,
  type Velocity,
} from "../../design/motion/motion";
import { cn } from "../../lib/utils";

export {
  arcKeyframes,
  continueTo,
  flip,
  motionMs,
  prefersReducedMotion,
  rubberBand,
  rubberBandInverse,
  rubberClamp,
  rubberUnclamp,
  staggerDelay,
} from "../../design/motion/motion";

// ----------------------------------------------------------------- stagger

/** The style that puts something at place `index` in a stagger (rule 3); give it `motion-enter`. */
export function staggerStyle(index: number, style?: CSSProperties): CSSProperties {
  return { ...style, "--i": index } as CSSProperties;
}

type StaggerProps<T extends ElementType> = {
  as?: T;
  /** `list` (rule 3): rows 30ms apart. `settle` (rule 6): a thing's details 60ms apart, rising less. */
  step?: "list" | "settle";
  /** Wait this long first (a token, `var(--motion-…)`), for a part that follows another. */
  delay?: string;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/**
 * Its children arrive one after another: each gets `motion-enter` and its
 * place (`--i`). Rows past `--motion-stagger-cap` arrive together; under
 * reduced motion all of them do, fading. A parent's re-render leaves rows
 * mid-arrival alone (the class and place stay the same, so the CSS
 * animation never restarts); key the Stagger to play it again.
 */
export function Stagger<T extends ElementType = "div">({ as, step = "list", delay, className, style, children, ...props }: StaggerProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  let index = 0;
  const items = Children.map(children, (child) => {
    if (!isValidElement<{ className?: string; style?: CSSProperties }>(child)) return child;
    const at = index;
    index += 1;
    return cloneElement(child, {
      className: cn(child.props.className, "motion-enter"),
      style: staggerStyle(at, child.props.style),
    });
  });
  return (
    <Tag
      className={cn(step === "settle" ? "motion-settle" : "motion-stagger", className)}
      style={delay ? ({ ...(style as CSSProperties), "--motion-delay": delay } as CSSProperties) : style}
      {...props}
    >
      {items}
    </Tag>
  );
}

// -------------------------------------------------------- crossfade, swap

/** Whether this document runs animations at all (a test's DOM doesn't, so nothing waits on one). */
const ANIMATES = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";

interface Layer {
  key: string;
  node: ReactNode;
  phase: "still" | "in" | "out";
}

/**
 * The layers of a stack where a new keyed child arrives as the old one
 * leaves: at most one leaving (kept from its last render) under what is here
 * now (always the current props, so a parent's re-render costs nothing).
 *
 * Changed again before the last change has finished, the one that was
 * leaving goes at once (two copies at most, never a pile of ghosts), and a
 * key that comes back while it is still leaving turns round where it is: it
 * is the same element, in the same place in the DOM, so it is never shown
 * twice and its animation continues (QA.md, M4 and M5).
 */
function useLayers(key: string, node: ReactNode): [Layer[], (key: string) => void] {
  const [state, setState] = useState<{ key: string; entered: boolean; leaving: { key: string; node: ReactNode } | null }>({
    key,
    entered: false,
    leaving: null,
  });
  const shown = useRef<{ key: string; node: ReactNode }>({ key, node });
  if (state.key !== key) {
    // The old one leaves while the new one arrives (rule 16): both are on screen at once.
    // Where nothing animates (a test's DOM) the old one would never finish leaving: it just goes.
    const leaving = ANIMATES && shown.current.key !== key ? shown.current : null;
    setState({ key, entered: ANIMATES, leaving });
  }
  useLayoutEffect(() => {
    shown.current = { key, node };
  });
  const drop = useCallback(
    (gone: string) => setState((now) => (now.leaving?.key === gone ? { ...now, leaving: null } : now)),
    [],
  );
  // A stable order: a layer keeps its place in the DOM for as long as it is in the stack.
  const order = useRef(new Map<string, number>());
  const next = useRef(0);
  const here: Layer[] = [
    ...(state.leaving && state.leaving.key !== key ? [{ ...state.leaving, phase: "out" as const }] : []),
    { key, node, phase: state.entered && state.key === key ? "in" : "still" },
  ];
  for (const layer of here) if (!order.current.has(layer.key)) order.current.set(layer.key, next.current++);
  for (const known of [...order.current.keys()]) if (!here.some((layer) => layer.key === known)) order.current.delete(known);
  here.sort((a, b) => order.current.get(a.key)! - order.current.get(b.key)!);
  return [here, drop];
}

/** Lift a swap's layer out of its line at the width it has now (`out`), or put it back. */
function detach(element: HTMLElement, out: boolean) {
  const lifted = element.hasAttribute("data-swap-lifted");
  if (out === lifted) return;
  if (out) {
    element.style.width = getComputedStyle(element).width;
    element.setAttribute("data-swap-lifted", "");
  } else {
    element.style.removeProperty("width");
    element.removeAttribute("data-swap-lifted");
  }
}

/** One layer of a Crossfade or a Swap: its motion runs when its phase changes, from where it is. */
function MotionLayer({
  kind,
  layer,
  direction,
  onGone,
  className,
}: {
  kind: "crossfade" | "swap";
  layer: Layer;
  direction: 1 | -1;
  onGone: (key: string) => void;
  className: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { phase, key } = layer;
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    // A swap's leaving value no longer holds the line open: it is lifted out
    // of the flow at the width it has (so it does not rewrap), and the line
    // takes the new value's width at once. Kept in the flow, a longer old
    // value held the line wide for the whole swap and then let go in one
    // frame, and everything after it jumped (design/motion/QA.md, M19).
    // Before paint, so nothing shows the change. Turned round, it is back in.
    if (kind === "swap") detach(element, phase === "out");
    if (phase === "still") return;
    const animation = layerMotion(element, kind, phase, direction);
    if (phase !== "out") return;
    if (!animation) {
      onGone(key);
      return;
    }
    // Turned round before it finished: the leaving animation is cancelled, and the layer stays.
    animation.finished.then(
      () => onGone(key),
      () => {},
    );
  }, [kind, phase, direction, key, onGone]);
  const attribute = kind === "crossfade" ? "data-crossfade" : "data-swap";
  return (
    <span
      ref={ref}
      className={className}
      {...{ [attribute]: phase === "still" ? undefined : phase }}
      aria-hidden={phase === "out" || undefined}
    >
      {layer.node}
    </span>
  );
}

/**
 * Rule 18: one icon becoming another. Key the child by what it shows
 * (`{done ? <CheckIcon key="done" /> : <CopyIcon key="copy" />}`); the old
 * one shrinks to 0.7 and blurs out as the new one grows in from it.
 * Reduced: a plain crossfade.
 */
export function Crossfade({ children, className }: { children: ReactElement; className?: string }) {
  const key = String(children.key ?? "only");
  const [layers, drop] = useLayers(key, children);
  return (
    <span className={cn("motion-crossfade", className)} data-slot="crossfade">
      {layers.map((layer) => (
        <MotionLayer key={layer.key} kind="crossfade" layer={layer} direction={1} onGone={drop} className="inline-flex" />
      ))}
    </span>
  );
}

/**
 * Rule 16: a value replacing a value in place (a label, a status, a number):
 * the old leaves upward as the new rises in, in the same 220ms, both clipped
 * to the value's line so neither shows outside it. `value` is what changes;
 * `direction="down"` when it goes back (a count going down). Reduced: a
 * crossfade in place.
 */
export function Swap({
  value,
  children,
  direction = "up",
  className,
}: {
  value: string | number;
  children: ReactNode;
  direction?: "up" | "down";
  className?: string;
}) {
  const [layers, drop] = useLayers(String(value), children);
  return (
    <span className={cn("motion-swap", className)} data-direction={direction} data-slot="swap">
      {layers.map((layer) => (
        <MotionLayer key={layer.key} kind="swap" layer={layer} direction={direction === "down" ? -1 : 1} onGone={drop} className="min-w-0" />
      ))}
    </span>
  );
}

// ------------------------------------------------------------------- pulse

/**
 * Rule 8: confirm a success once, on the thing that did it. Spread `props`
 * on it (it needs to be the size of the thing: the ring follows its radius)
 * and call `fire()` when it worked. Firing again restarts it.
 */
export function usePulse(): { fire: () => void; props: { className: string; "data-pulse": "a" | "b" | undefined } } {
  const [phase, setPhase] = useState<"a" | "b" | undefined>(undefined);
  const fire = useCallback(() => setPhase((now) => (now === "a" ? "b" : "a")), []);
  return { fire, props: { className: "motion-pulse", "data-pulse": phase } };
}

/** Rule 8 as a wrapper: pulses its child each time `when` becomes something new and truthy. */
export function Pulse({ when, children, className }: { when: unknown; children: ReactNode; className?: string }) {
  const pulse = usePulse();
  const last = useRef(when);
  useEffect(() => {
    if (when && when !== last.current) pulse.fire();
    last.current = when;
  }, [when, pulse.fire]);
  return (
    <span className={cn("inline-flex rounded-[inherit]", pulse.props.className, className)} data-pulse={pulse.props["data-pulse"]} data-slot="pulse">
      {children}
    </span>
  );
}

// ------------------------------------------------------------------ reveal

/**
 * Rule 17: content revealed in place with a clip wipe from the edge it opens
 * from (`from`: top, bottom, left, right, center), never a height jump; it
 * wipes back out, 20% quicker, before it unmounts. Toggled mid-wipe, it
 * turns round where it is. Reduced: a fade.
 */
export function Reveal({
  open,
  from = "top",
  children,
  className,
  as,
}: {
  open: boolean;
  from?: "top" | "bottom" | "left" | "right" | "center";
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const Tag = (as ?? "div") as ElementType;
  const [shown, setShown] = useState(open);
  if (open && !shown) setShown(true);
  const ref = useRef<HTMLElement | null>(null);
  // What the DOM shows: the wipe runs only when `open` moves off it, so a
  // mount (open or not) and StrictMode's second effect never wipe.
  const showing = useRef(open);
  const wanted = useRef(open);
  wanted.current = open;
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || showing.current === open) return;
    showing.current = open;
    const animation = revealMotion(element, open);
    if (open) return;
    if (!animation) {
      setShown(false);
      return;
    }
    animation.finished.then(
      () => {
        if (!wanted.current) setShown(false);
      },
      () => {},
    );
  }, [open, shown]);
  if (!shown || (!open && !ANIMATES)) return null;
  return (
    <Tag
      ref={ref}
      className={cn("motion-reveal", className)}
      data-from={from}
      data-reveal={open ? undefined : "out"}
      data-slot="reveal"
    >
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------- shared layout

type Box = { left: number; top: number; width: number; height: number };

/**
 * Where a shared element is measured from: its track (`motion-segments`) or
 * any ancestor marked `data-layout-root`. Its box is kept relative to that,
 * so when the whole track moves in the same change (a dialog that re-centres
 * because its tab filtered its list) the element moves with its track and
 * flies only the way it moved inside it, never in from where the track used
 * to be (QA.md, M9). Without one, the viewport.
 */
const layoutRoot = (element: Element) => element.closest<HTMLElement>("[data-layout-root], .motion-segments");

const boxOf = (element: Element): Box => {
  const box = element.getBoundingClientRect();
  return { left: box.left, top: box.top, width: box.width, height: box.height };
};

/** Its box now, and against its root, so a later mount can place it. */
function measure(element: HTMLElement): { box: Box; root: HTMLElement | null; inRoot: Box | null } {
  const box = boxOf(element);
  const root = layoutRoot(element);
  if (!root) return { box, root: null, inRoot: null };
  const from = boxOf(root);
  return { box, root, inRoot: { ...box, left: box.left - from.left, top: box.top - from.top } };
}

/** Where a measured box is on screen now: moved with its root if that is still the root here. */
function placeNow(seen: ReturnType<typeof measure>, element: HTMLElement): Box {
  const root = layoutRoot(element);
  if (!seen.root || !seen.inRoot || root !== seen.root || !root.isConnected) return seen.box;
  const at = boxOf(root);
  return { ...seen.inRoot, left: at.left + seen.inRoot.left, top: at.top + seen.inRoot.top };
}

const lastBoxes = new Map<string, ReturnType<typeof measure> & { velocity: Velocity | null }>();

/**
 * Rule 20: one element across states. Every `SharedLayout` with the same `id`
 * is the same object: when one unmounts and another mounts (the selected
 * pill moving to another tab), the new one flies from where the old one was
 * on screen (mid-flight included, so a fast second click carries on), on
 * --ease-in-out over --motion-move, along an arc if it moves on both axes
 * (rule 7). Reduced: it is at its new place, faded in.
 *
 * A pill that slides between options sits in a `motion-segments` track
 * (motion.css), which keeps it under every option's words while it flies.
 */
export function SharedLayout({
  id,
  className,
  as,
  children,
  layoutKey,
  ...props
}: {
  id: string;
  className?: string;
  as?: ElementType;
  children?: ReactNode;
  /**
   * For one element that stays mounted and moves (its parent's layout
   * changed): whatever says where it is. When it changes, it flies from
   * where it was.
   */
  layoutKey?: unknown;
} & Omit<React.HTMLAttributes<HTMLElement>, "id">) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  // Its box before a layoutKey change, read while the DOM is still the old one
  // (with any flight still running: where it is on screen).
  const placed = useRef<{ key: unknown; seen: ReturnType<typeof measure> | null }>({ key: layoutKey, seen: null });
  if (placed.current.key !== layoutKey) {
    placed.current = { key: layoutKey, seen: ref.current ? measure(ref.current) : null };
  }
  useLayoutEffect(() => {
    const element = ref.current;
    const seen = placed.current.seen;
    if (!element || !seen) return;
    placed.current.seen = null;
    flip(element, placeNow(seen, element));
  }, [layoutKey]);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const before = lastBoxes.get(id);
    lastBoxes.delete(id);
    if (before) flip(element, placeNow(before, element), { velocity: before.velocity });
    return () => {
      // Mid-flight, its speed too: the next one sets off at it (QA.md, M20).
      lastBoxes.set(id, { ...measure(element), velocity: flightVelocity(element) });
    };
  }, [id]);
  useEffect(() => () => {
    // Forget the box once nothing has taken the id within a frame: a later
    // mount is a fresh arrival, not a move.
    requestAnimationFrame(() => {
      if (!ref.current) lastBoxes.delete(id);
    });
  }, [id]);
  return <Tag ref={ref} className={className} data-shared-layout={id} aria-hidden={children ? undefined : true} {...props}>{children}</Tag>;
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };

/**
 * Rule 20 across trees: a card growing into its dialog. Name the two
 * elements alike with `view-transition-name` (`viewTransitionName` in a
 * style) and make the change here; where the API is missing, or under
 * reduced motion, the change just happens.
 */
export function sharedTransition(update: () => void): void {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  doc.startViewTransition(() => flushSync(update));
}

// ---------------------------------------------------------- trigger origin

let lastPress: { x: number; y: number; at: number } | null = null;
if (typeof document !== "undefined") {
  document.addEventListener(
    "pointerdown",
    (event) => {
      lastPress = { x: event.clientX, y: event.clientY, at: performance.now() };
    },
    { capture: true, passive: true },
  );
}

/** Where the surface opening now came from: the explicit trigger, the press that opened it, or the focused control. */
function triggerPoint(trigger?: HTMLElement | null): { x: number; y: number } | null {
  const from = trigger ?? null;
  if (from) {
    const box = from.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }
  if (lastPress && performance.now() - lastPress.at < 1000) return { x: lastPress.x, y: lastPress.y };
  const focused = document.activeElement;
  if (focused instanceof HTMLElement && focused !== document.body) {
    const box = focused.getBoundingClientRect();
    if (box.width || box.height) return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  }
  return null;
}

/**
 * Rules 11 and 12 for a surface Base UI doesn't anchor (a dialog): put the
 * returned ref on its popup, and it grows from its trigger and shrinks back
 * to it. It writes `--trigger-origin` (the trigger's centre in the popup's
 * own box) when the popup mounts, which the `motion-dialog` surface reads.
 * Without a trigger it grows from its centre.
 */
export function useTriggerOrigin<T extends HTMLElement>(trigger?: React.RefObject<HTMLElement | null>): Ref<T> {
  return useCallback(
    (node: T | null) => {
      if (!node) return;
      const point = triggerPoint(trigger?.current);
      if (!point) return;
      // The popup's untransformed box: its centre survives a scale about the centre.
      const box = node.getBoundingClientRect();
      const left = box.left + box.width / 2 - node.offsetWidth / 2;
      const top = box.top + box.height / 2 - node.offsetHeight / 2;
      node.style.setProperty("--trigger-origin", `${Math.round(point.x - left)}px ${Math.round(point.y - top)}px`);
    },
    [trigger],
  );
}

/** One ref callback that sets every ref given (a primitive's own and the caller's). */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}

// ------------------------------------------------------------ rubber band

/** Where `element` is translated to along `axis` right now (mid spring-back included). */
function shownOffset(element: HTMLElement, axis: "x" | "y"): number {
  const value = getComputedStyle(element).translate;
  if (!value || value === "none") return 0;
  const [x = "0", y = "0"] = value.split(/\s+/);
  return Number.parseFloat(axis === "x" ? x : y) || 0;
}

interface Drag {
  pointer: number;
  pull: number;
  min: number;
  max: number;
  reach: number;
  id: number;
}

/**
 * Rule 19 for a thing dragged along one axis inside `[min, max]`: it follows
 * the pointer 1:1 (rule 14) inside its bounds, resists past them, and on
 * release springs back inside on --ease-out over --motion-spring-back.
 * Spread `handlers` on the dragged element and `style` on it; `offset` is
 * where it is.
 *
 * `within: "parent"` (or a ref to a box) takes the bounds from that box
 * instead: it moves freely inside it, resists past its edges by at most a
 * quarter of its size (or `reach`), and always comes to rest inside it, so
 * it never ends up anywhere but its own box. Grabbed mid spring-back, it is
 * held where it is on screen and the drag carries on from there; a lost
 * pointer capture lets go like a release, so it never stays stuck out.
 */
export function useRubberBand({
  min = 0,
  max = 0,
  axis = "x",
  reach,
  within,
}: { min?: number; max?: number; axis?: "x" | "y"; reach?: number; within?: "parent" | RefObject<HTMLElement | null> } = {}) {
  const [offset, setOffset] = useState(0);
  const [held, setHeld] = useState(false);
  const drag = useRef<Drag | null>(null);
  const read = (event: ReactPointerEvent) => (axis === "x" ? event.clientX : event.clientY);
  const bounds = (element: HTMLElement, shown: number): { min: number; max: number; reach: number } => {
    const box = within === "parent" ? element.parentElement : within?.current;
    if (!box) return { min, max, reach: reach ?? 120 };
    const outer = box.getBoundingClientRect();
    const style = getComputedStyle(box);
    const own = element.getBoundingClientRect();
    const x = axis === "x";
    const start = (x ? outer.left : outer.top) + Number.parseFloat(x ? style.paddingLeft : style.paddingTop);
    const end = (x ? outer.right : outer.bottom) - Number.parseFloat(x ? style.paddingRight : style.paddingBottom);
    const at = (x ? own.left : own.top) - shown;
    const size = x ? own.width : own.height;
    const lo = start - at;
    const hi = Math.max(lo, end - (at + size));
    return { min: lo, max: hi, reach: reach ?? Math.max(8, (x ? outer.width : outer.height) / 4) };
  };
  const release = (event: ReactPointerEvent<HTMLElement>) => {
    const now = drag.current;
    if (!now || event.pointerId !== now.id) return;
    drag.current = null;
    setHeld(false);
    setOffset((at) => Math.min(now.max, Math.max(now.min, at)));
  };
  const handlers = {
    onPointerDown(event: ReactPointerEvent<HTMLElement>) {
      if (drag.current) return; // one pointer at a time
      const element = event.currentTarget;
      element.setPointerCapture?.(event.pointerId);
      const shown = shownOffset(element, axis);
      const limits = bounds(element, shown);
      drag.current = { pointer: read(event), pull: rubberUnclamp(shown, limits.min, limits.max, limits.reach), ...limits, id: event.pointerId };
      setOffset(shown);
      setHeld(true);
    },
    onPointerMove(event: ReactPointerEvent<HTMLElement>) {
      const now = drag.current;
      if (!now || event.pointerId !== now.id) return;
      setOffset(rubberClamp(now.pull + read(event) - now.pointer, now.min, now.max, now.reach));
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
  };
  const style: CSSProperties = {
    translate: axis === "x" ? `${offset}px 0` : `0 ${offset}px`,
    // Held: no tween (rule 14). Released: the spring back.
    transition: held ? "none" : "translate var(--motion-spring-back) var(--ease-out)",
    touchAction: "none",
  };
  return { offset, held, handlers, style };
}

// ------------------------------------------------------------- knob travel

/**
 * Rule 5 for a `motion-knob`: put the ref on the knob, and each change of
 * `value` after the first render stretches it once as it crosses, never on
 * mount. Changed again mid-stretch, the stretch carries on from where it is
 * (stretchKnob), it does not snap back to 1 and start over. The crossing
 * itself is the knob's CSS transition, which turns round where it is.
 */
export function useKnob<T extends HTMLElement>(value: unknown): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const seen = useRef(value);
  useLayoutEffect(() => {
    if (Object.is(seen.current, value)) return;
    seen.current = value;
    if (ref.current) stretchKnob(ref.current);
  }, [value]);
  return ref;
}

/**
 * `a` and `b` in turn, flipping on every change of `value` after the first
 * render, for a CSS animation that should play once per change and never on
 * mount (ProgressMeter's sweep): two identical keyframes, one per letter.
 */
export function useKnobTravel(value: unknown): "a" | "b" | undefined {
  const [travel, setTravel] = useState<{ value: unknown; phase: "a" | "b" | undefined }>({ value, phase: undefined });
  if (travel.value !== value) setTravel({ value, phase: travel.phase === "a" ? "b" : "a" });
  return travel.phase;
}

/** For tests and specimens: the durations the primitives run on. */
export const MOTION = MOTION_MS;
