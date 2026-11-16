// Ported from anomalyco/opencode packages/ui/src/hooks/spin-phase.ts
// (https://github.com/anomalyco/opencode). MIT License, Copyright (c) 2025 opencode.
// Full notice in app/ui/THIRD_PARTY_NOTICES.md. Changes: Solid's onCleanup
// becomes the cleanup a React 19 ref callback returns.

// ResizeObserver delivers after style and layout but before paint, so a spinner that mounts or leaves `display: none`
// (which restarts its CSS animation) paints its first frame already in phase.
const resize =
  typeof ResizeObserver === "undefined"
    ? undefined
    : new ResizeObserver((entries) => entries.forEach((entry) => pinVisible(entry.target)));

// Spinners scrolled or clipped out of view, under a `display: none` or `content-visibility: hidden` ancestor, or sized
// to nothing get `data-offscreen`, which their CSS uses to pause. Coming back, they resume and re-pin to the shared
// phase. `visibility: hidden` and `opacity: 0` still count as visible.
const visibility =
  typeof IntersectionObserver === "undefined"
    ? undefined
    : new IntersectionObserver((entries) =>
        entries.forEach((entry) => {
          entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting);
          pinVisible(entry.target);
        }),
      );

/** Use as a `ref` on a looping indicator so every instance on screen shares one phase and pauses while hidden. */
export function syncSpinPhase(el: Element | null): (() => void) | undefined {
  if (!el) return undefined;
  resize?.observe(el);
  visibility?.observe(el);
  // Turning reduced motion back off restarts the animation without resizing anything.
  const restart = () => pinVisible(el);
  el.addEventListener("animationstart", restart);
  return () => {
    resize?.unobserve(el);
    visibility?.unobserve(el);
    el.removeEventListener("animationstart", restart);
  };
}

// Setting the start time of a paused CSS animation resumes it and makes it ignore `animation-play-state` from then on,
// so a paused spinner is left alone until it is visible. `getAnimations` flushes style, so a spinner that has just
// lost `data-offscreen` is running again by the time it is pinned.
function pinVisible(el: Element) {
  if (el.hasAttribute("data-offscreen")) return;

  pinSpinPhase(el);
}

// Starting every infinite loop at the document timeline's origin puts all instances of one animation in phase.
export function pinSpinPhase(el: {
  getAnimations(
    options: GetAnimationsOptions,
  ): { startTime: CSSNumberish | null; effect: { getTiming(): EffectTiming } | null }[];
}) {
  el.getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation.effect?.getTiming().iterations === Infinity && animation.startTime !== 0,
    )
    .forEach((animation) => {
      animation.startTime = 0;
    });
}
