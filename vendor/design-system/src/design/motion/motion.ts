// Lanes' motion for script: the values of ./tokens.css that code needs as
// numbers (Web Animations take milliseconds and easing strings, not var()),
// and the helpers that move things on them. motion.test.ts holds every value
// here to tokens.css, so the two never part. The rules are ./README.md.

/** Durations in ms, named as in tokens.css without `--motion-`. */
export const MOTION_MS = {
  instant: 70,
  fast: 120,
  base: 200,
  slow: 300,
  page: 400,
  press: 160,
  tooltip: 150,
  dropdown: 200,
  popover: 220,
  enter: 260,
  sheet: 320,
  move: 300,
  knob: 220,
  crossfade: 180,
  swap: 220,
  reveal: 360,
  pulse: 560,
  arc: 460,
  "spring-back": 380,
  stagger: 30,
  "settle-stagger": 60,
  roll: 560,
  linger: 4000,
  reduced: 140,
} as const;

export type MotionName = keyof typeof MOTION_MS;

/** Rule 15: an exit is 80% of its entrance. */
export const EXIT_RATIO = 0.8;

/** The curves, as tokens.css writes them (without `--ease-`). */
export const EASE = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
  "in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

/** Scales and constants (without the leading `--`). */
export const MOTION_SCALE = {
  "press-scale": 0.97,
  "popover-start-scale": 0.95,
  "knob-stretch": 1.12,
  "crossfade-scale": 0.7,
  "pulse-scale": 1.04,
  "arc-lift": 0.2,
  "rubber-band": 0.55,
  "motion-stagger-cap": 12,
} as const;

/** Reduced motion: the OS setting or the window's own (design/theme.ts writes data-motion). */
export function prefersReducedMotion(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.dataset.motion === "reduce") return true;
  return typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
}

/**
 * A duration in ms; an exit is 80% of it. Under reduced motion every
 * primitive's movement is the short fade (--motion-reduced), as motion.css
 * makes it for the CSS ones.
 */
export function motionMs(name: MotionName, phase: "enter" | "exit" = "enter"): number {
  const ms = prefersReducedMotion() ? MOTION_MS.reduced : MOTION_MS[name];
  return phase === "exit" ? Math.round(ms * EXIT_RATIO) : ms;
}

/**
 * Rule 19: how far something dragged `overshoot` px past its end actually
 * goes. It resists more the further it is pulled and never passes
 * `dimension` (Apple's UIScrollView curve; `constant` 0.55). Reduced
 * motion: 0, it clamps.
 */
export function rubberBand(overshoot: number, dimension: number, constant: number = MOTION_SCALE["rubber-band"]): number {
  if (overshoot <= 0 || dimension <= 0 || prefersReducedMotion()) return 0;
  return (1 - 1 / ((overshoot * constant) / dimension + 1)) * dimension;
}

/**
 * The inverse of rubberBand: how far past its end something must be pulled
 * to show `shown` px past it. Grabbing a thing mid spring-back starts the new
 * drag there, so it does not jump (QA.md, M7).
 */
export function rubberBandInverse(shown: number, dimension: number, constant: number = MOTION_SCALE["rubber-band"]): number {
  if (shown <= 0 || dimension <= 0 || constant <= 0 || prefersReducedMotion()) return 0;
  const reached = Math.min(shown, dimension * (1 - 1e-9));
  return (dimension / constant) * (reached / (dimension - reached));
}

/** A value kept inside [min, max] with a rubber band past either end, `dimension` the band's reach. */
export function rubberClamp(value: number, min: number, max: number, dimension: number): number {
  if (value < min) return min - rubberBand(min - value, dimension);
  if (value > max) return max + rubberBand(value - max, dimension);
  return value;
}

/** The inverse of rubberClamp: the pull that shows `shown` (the identity inside [min, max]). */
export function rubberUnclamp(shown: number, min: number, max: number, dimension: number): number {
  if (shown < min) return min - rubberBandInverse(min - shown, dimension);
  if (shown > max) return max + rubberBandInverse(shown - max, dimension);
  return shown;
}

/** The stagger index's delay: rule 3's 30ms step (6's 60ms for `settle`), capped. */
export function staggerDelay(index: number, step: "list" | "settle" = "list"): number {
  if (prefersReducedMotion()) return 0;
  const ms = step === "settle" ? MOTION_MS["settle-stagger"] : MOTION_MS.stagger;
  return Math.min(Math.max(index, 0), MOTION_SCALE["motion-stagger-cap"]) * ms;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Rule 7: keyframes that carry something from `dx, dy` (px from where it
 * ends) home along a curve that bows upward, like a thrown thing, as
 * transforms (optionally scaling from `sx, sy` too). Sampled, so any easing
 * can run over it.
 *
 * The bow leans toward the upper corner of the box its two ends span (up
 * first when it rises, across first when it falls), `lift` of the way there
 * twice over, so the curve never leaves that box: a thing arcing between two
 * corners of a card stays inside the card (QA.md, M6). Pushed off the chord
 * at right angles instead, it overshot the card's edge.
 */
export function arcKeyframes(
  dx: number,
  dy: number,
  { lift = MOTION_SCALE["arc-lift"], sx = 1, sy = 1, steps = 16 }: { lift?: number; sx?: number; sy?: number; steps?: number } = {},
): Keyframe[] {
  // The control point: between the chord's middle and the upper corner of the ends' box (y grows downward).
  const [cornerX, cornerY] = dy > 0 ? [dx, 0] : [0, dy];
  const pull = Math.min(1, Math.max(0, lift * 2));
  const cx = dx / 2 + (cornerX - dx / 2) * pull;
  const cy = dy / 2 + (cornerY - dy / 2) * pull;
  const frames: Keyframe[] = [];
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const u = 1 - t;
    // Quadratic Bezier from (dx, dy) through (cx, cy) to (0, 0).
    const x = u * u * dx + 2 * u * t * cx;
    const y = u * u * dy + 2 * u * t * cy;
    const scaleX = sx + (1 - sx) * t;
    const scaleY = sy + (1 - sy) * t;
    frames.push({ transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`, offset: t });
  }
  return frames;
}

/** The flip each element is running, so a new one starts where it is rather than where the old one began. */
const flights = new WeakMap<Element, Animation>();

/** A speed on screen, in px per ms. */
export interface Velocity {
  x: number;
  y: number;
}

/**
 * How fast the flip running on `element` is moving it on screen right now
 * (px per ms), read by stepping the flight a few ms back and forth; null when
 * none is running. A flight that replaces it starts at this speed (flip's
 * `velocity`), so a second click mid-flight never stops it dead.
 */
export function flightVelocity(element: Element): Velocity | null {
  const flight = flights.get(element);
  if (!flight || flight.playState === "idle" || flight.playState === "finished") return null;
  const time = Number(flight.currentTime ?? 0);
  const step = Math.min(time, 8);
  if (!(step > 0)) return { x: 0, y: 0 };
  const now = element.getBoundingClientRect();
  flight.currentTime = time - step;
  const then = element.getBoundingClientRect();
  flight.currentTime = time;
  return { x: (now.left - then.left) / step, y: (now.top - then.top) / step };
}

/**
 * Rule 9's curve for a flight that starts moving at `speed` (its progress per
 * unit of its time at the start): --ease-in-out's when it starts from rest,
 * otherwise the same landing with a start that already has that speed, never
 * past the end (both control points' progress stay inside 0..1).
 */
export function easeFrom(speed: number): string {
  if (!(speed > 0.05)) return EASE["in-out"];
  const x1 = Math.min(0.65, 1 / speed);
  return `cubic-bezier(${x1.toFixed(4)}, ${Math.min(1, x1 * speed).toFixed(4)}, 0.35, 1)`;
}

/**
 * FLIP: `element` has just moved from `from` (its old box) to where it is now;
 * run it from there to here on `--ease-in-out` over `--motion-move` (rule 9),
 * along an arc when it travels on both axes (rule 7). Reduced motion: no
 * travel, a short fade in place. Returns the animation, or null when there
 * was nothing to do.
 *
 * Interrupted (asked to move again mid-flight): `from` is where it is on
 * screen now (a box read with the old flip still running), and the old flip
 * is cancelled before its new place is read, so it carries on from where it
 * was instead of jumping back to where the old flip began (QA.md, M1).
 */
export function flip(
  element: HTMLElement,
  from: Box,
  {
    duration,
    arc = "auto",
    scale = true,
    velocity,
  }: {
    duration?: number;
    arc?: boolean | "auto";
    scale?: boolean;
    /** How fast it was moving on screen when this flight replaced the last (px/ms); read off its own flight when not given. */
    velocity?: Velocity | null;
  } = {},
): Animation | null {
  if (typeof element.animate !== "function") return null;
  const before = flights.get(element);
  const moving = velocity ?? (before ? flightVelocity(element) : null);
  if (before) {
    flights.delete(element);
    before.cancel();
  }
  const to = element.getBoundingClientRect();
  // The scale its ancestors put on it right now (a pressed option's 0.97): a
  // translate runs in their space, so a distance on screen is divided by it,
  // or the flight would start off where it was (QA.md, M2).
  const kx = element.offsetWidth ? to.width / element.offsetWidth : 1;
  const ky = element.offsetHeight ? to.height / element.offsetHeight : 1;
  const dx = (from.left - to.left + (scale ? 0 : (from.width - to.width) / 2)) / (kx || 1);
  const dy = (from.top - to.top + (scale ? 0 : (from.height - to.height) / 2)) / (ky || 1);
  const sx = scale && to.width ? from.width / to.width : 1;
  const sy = scale && to.height ? from.height / to.height : 1;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.005 && Math.abs(sy - 1) < 0.005) {
    element.style.removeProperty("transform-origin");
    return null;
  }
  if (prefersReducedMotion()) {
    const fade = element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MOTION_MS.reduced, easing: EASE.out });
    flights.set(element, fade);
    return fade;
  }
  const curved = arc === true || (arc === "auto" && Math.abs(dx) > 24 && Math.abs(dy) > 24);
  const keyframes = curved
    ? arcKeyframes(dx, dy, { sx, sy })
    : [{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: "none" }];
  element.style.transformOrigin = "0 0";
  const ms = duration ?? (curved ? MOTION_MS.arc : MOTION_MS.move);
  // Re-aimed mid-flight along a line: it sets off at the speed it had towards
  // where it is going now, instead of from rest (ease-in-out's first frames
  // barely move: the pill stopped dead for 60ms at every click; QA.md, M20).
  // Turned back, it starts from rest, which is where it is turning.
  const travelX = to.left - from.left;
  const travelY = to.top - from.top;
  const span = travelX * travelX + travelY * travelY;
  const speed = moving && !curved && span > 0 ? ((moving.x * travelX + moving.y * travelY) / span) * ms : 0;
  const animation = element.animate(keyframes, { duration: ms, easing: easeFrom(speed) });
  flights.set(element, animation);
  // Only the flight still running tidies up: a cancelled one's late event must
  // not take the origin from under the flight that replaced it.
  const done = () => {
    if (flights.get(element) !== animation) return;
    flights.delete(element);
    element.style.removeProperty("transform-origin");
  };
  animation.addEventListener("finish", done);
  animation.addEventListener("cancel", done);
  return animation;
}

// ------------------------------------------------------- continuing motion

type Frame = Record<string, string>;

interface Running {
  animation: Animation;
  target: string;
  duration: number;
}

/** Per element, per channel ("layer", "reveal", "knob"): what is running there. */
const running = new WeakMap<Element, Map<string, Running>>();

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/**
 * Animate `element` on `channel` to `to`, from wherever it is now.
 *
 * With nothing running on the channel it starts at `from`. Interrupted (the
 * channel is still moving, or holding its end), it starts at the element's
 * current computed values instead, and takes as long to turn back as it had
 * run (the way CSS transitions reverse): nothing jumps to a keyframe's start,
 * nothing restarts, nothing flickers. Asked again for the target it is
 * already going to (a parent's re-render, StrictMode's second effect), it
 * carries on untouched. Returns the animation, or null where nothing
 * animates (a test's DOM).
 */
export function continueTo(
  element: Element,
  channel: string,
  { from, to, duration, easing, fill = "none" }: { from: Frame; to: Frame; duration: number; easing: string; fill?: FillMode },
): Animation | null {
  if (typeof (element as HTMLElement).animate !== "function") return null;
  const channels = running.get(element) ?? new Map<string, Running>();
  running.set(element, channels);
  const target = JSON.stringify(to);
  const now = channels.get(channel);
  const live = now && now.animation.playState !== "idle" ? now : undefined;
  if (live && live.target === target) return live.animation;
  let start = from;
  let ms = duration;
  if (live) {
    const style = getComputedStyle(element);
    start = Object.fromEntries(Object.keys(to).map((name) => [name, style.getPropertyValue(kebab(name)) || from[name] || ""]));
    // How far there is still to go: by opacity where it fades (a layer half
    // in leaves over half an exit, so the swap never blinks empty), else by
    // the time the turned-round animation had run.
    const goal = Number.parseFloat(to.opacity ?? "");
    const whole = Math.abs(Number.parseFloat(from.opacity ?? "") - goal);
    const left = Math.abs(Number.parseFloat(start.opacity ?? "") - goal);
    const ran = Number(live.animation.currentTime ?? live.duration);
    const progress = whole > 0 && Number.isFinite(left)
      ? Math.min(1, left / whole)
      : live.duration > 0 ? Math.min(1, Math.max(0, ran / live.duration)) : 1;
    ms = Math.max(1, Math.round(duration * progress));
    live.animation.cancel();
  }
  const animation = (element as HTMLElement).animate([start, to], { duration: ms, easing, fill });
  const entry = { animation, target, duration: ms };
  channels.set(channel, entry);
  // Done and holding nothing: forget it, so the next change starts from `from`.
  animation.addEventListener("finish", () => {
    if (channels.get(channel) === entry && fill === "none") channels.delete(channel);
  });
  return animation;
}

/** What `channel` on `element` is running now (for tests and specimens). */
export function runningOn(element: Element, channel: string): Animation | null {
  return running.get(element)?.get(channel)?.animation ?? null;
}

/** A motion token's value on `element`, as the cascade has it there (reduced motion included). */
export function tokenOn(element: Element, name: string, fallback: string): string {
  if (typeof getComputedStyle !== "function") return fallback;
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

/**
 * Rules 16 and 18: a layer of a Crossfade or a Swap arriving (`in`) or
 * leaving (`out`), from wherever it is (continueTo). A crossfade's layer
 * grows from --crossfade-scale and unblurs; a swap's rises --swap-distance of
 * its own height (`direction` -1 when it goes back down). An exit is 80% of
 * the entrance (rule 15) and holds its end until the layer is dropped. The
 * tokens are read off the element, so reduced motion (no scale, no blur, no
 * travel) is the cascade's; the time is the short fade there.
 */
export function layerMotion(element: Element, kind: "crossfade" | "swap", phase: "in" | "out", direction: 1 | -1 = 1): Animation | null {
  let hidden: Frame;
  let shown: Frame;
  if (kind === "crossfade") {
    const scale = tokenOn(element, "--crossfade-scale", String(MOTION_SCALE["crossfade-scale"]));
    const blur = tokenOn(element, "--crossfade-blur", "2px");
    hidden = { opacity: "0", scale, filter: `blur(${blur})` };
    shown = { opacity: "1", scale: "1", filter: "blur(0px)" };
  } else {
    const distance = tokenOn(element, "--swap-distance", "40%");
    const travel = Number.parseFloat(tokenOn(element, "--motion-travel", "1")) || 0;
    const away = (sign: number) => `0px calc(${distance} * ${sign * direction * travel})`;
    hidden = { opacity: "0", translate: phase === "in" ? away(1) : away(-1) };
    shown = { opacity: "1", translate: "0px 0px" };
  }
  // Under reduced motion the scale, blur and travel are their resting values:
  // leave them out, so only the fade runs (and nothing else claims to move).
  for (const [name, value] of Object.entries(hidden)) {
    if (name !== "opacity" && (value === shown[name] || /^(?:1|blur\(0px\)|0px calc\([^)]* \* -?0\))$/.test(value))) {
      delete hidden[name];
      delete shown[name];
    }
  }
  // The fade and the movement run as two animations (each continues on its
  // own when turned round). Leaving, both run on --ease-out, not rule 15's
  // --ease-exit: an exit curve starts slowly, so the old value sat where it
  // was at nearly full strength while the new one arrived on top of it, a
  // double exposure (QA.md, M8). The old one moves with the new one (a swap's
  // whole time) and is mostly gone within the first frames.
  const fade = (frame: Frame) => ({ opacity: frame.opacity! });
  const move = (frame: Frame) => Object.fromEntries(Object.entries(frame).filter(([name]) => name !== "opacity"));
  const moves = Object.keys(move(shown)).length > 0;
  if (phase === "in") {
    const faded = continueTo(element, "layer", { from: fade(hidden), to: fade(shown), duration: motionMs(kind), easing: EASE.out });
    if (moves) continueTo(element, "layer-move", { from: move(hidden), to: move(shown), duration: motionMs(kind), easing: EASE.out });
    return faded;
  }
  const faded = continueTo(element, "layer", { from: fade(shown), to: fade(hidden), duration: motionMs(kind, "exit"), easing: EASE.out, fill: "forwards" });
  const moved = moves
    ? continueTo(element, "layer-move", {
        from: move(shown),
        to: move(hidden),
        duration: kind === "swap" ? motionMs(kind) : motionMs(kind, "exit"),
        easing: EASE.out,
        fill: "forwards",
      })
    : null;
  // The layer is done when the longer of the two is.
  return moved && Number(moved.effect?.getComputedTiming().endTime ?? 0) > Number(faded?.effect?.getComputedTiming().endTime ?? 0) ? moved : faded;
}

/**
 * Rule 17: a Reveal wiping in from its edge (`open`) or back out, 20%
 * quicker, from wherever its wipe is: reopened mid-close it opens from there
 * rather than starting over. The wipe is --reveal-clip (motion.css, per
 * edge); under reduced motion the clip collapses with --motion-travel and a
 * fade is left.
 */
export function revealMotion(element: Element, open: boolean): Animation | null {
  const travel = Number.parseFloat(tokenOn(element, "--motion-travel", "1")) || 0;
  // Reduced (no travel): the clip is the whole box already; only the fade runs.
  const closed: Frame = travel ? { clipPath: tokenOn(element, "--reveal-clip", "inset(0px 0px 100% 0px)"), opacity: String(0.6 * travel) } : { opacity: "0" };
  const opened: Frame = travel ? { clipPath: "inset(0px)", opacity: "1" } : { opacity: "1" };
  return open
    ? continueTo(element, "reveal", { from: closed, to: opened, duration: motionMs("reveal"), easing: EASE.out })
    : continueTo(element, "reveal", { from: opened, to: closed, duration: motionMs("reveal", "exit"), easing: EASE.exit, fill: "forwards" });
}

/**
 * Rule 5: a knob stretching --knob-stretch along its track at the middle of
 * its move, once per change. Changed again mid-stretch, it stretches on from
 * the width it has, with no snap back to 1 first. Reduced motion: nothing.
 */
export function stretchKnob(element: HTMLElement): Animation | null {
  if (typeof element.animate !== "function" || prefersReducedMotion()) return null;
  const stretch = tokenOn(element, "--knob-stretch", String(MOTION_SCALE["knob-stretch"]));
  if (Number.parseFloat(stretch) === 1) return null;
  const now = getComputedStyle(element).scale;
  const channels = running.get(element) ?? new Map<string, Running>();
  running.set(element, channels);
  channels.get("knob")?.animation.cancel();
  const animation = element.animate([{ scale: now === "none" ? "1" : now }, { scale: `${stretch} 1`, offset: 0.5 }, { scale: "1" }], {
    duration: MOTION_MS.knob,
    easing: EASE["in-out"],
  });
  const entry = { animation, target: "stretch", duration: MOTION_MS.knob };
  channels.set("knob", entry);
  animation.addEventListener("finish", () => {
    if (channels.get("knob") === entry) channels.delete("knob");
  });
  return animation;
}
