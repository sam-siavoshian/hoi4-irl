// Copied from pingdotgg/t3code apps/web/src/hooks/useResizeDrag.ts (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes (design/motion/README.md): past its bounds the edge resists, more
// the further it is pulled (rubberClamp, rule 19), and the release commits the
// width inside them, which the session springs back to; while held it follows
// the pointer 1:1 (rule 14), where t3code stopped dead at the bound. Grabbed
// again mid spring-back, the session's `width` is where the edge is on screen
// (past a bound included), and the drag pulls on from the pull that shows it
// (rubberUnclamp), so the edge stays under the pointer (design/motion/QA.md, M18).

import { type PointerEvent, useState } from "react";

import { rubberClamp, rubberUnclamp } from "../design/motion/motion";

/** How far past a bound the band can stretch, at most. */
export const BAND_REACH = 64;

export interface ResizeBounds {
  readonly min: number;
  readonly max: number;
}

interface ResizeSession {
  width: number;
  edge: "left" | "right";
  /** Pointer widths are clamped to these before `resize` sees them. */
  bounds: ResizeBounds;
  resize: (width: number) => number;
  finish: (width: number, moved: boolean) => void;
  cleanup?: (committed: boolean) => void;
}

function clampToBounds(width: number, bounds: ResizeBounds): number {
  return Math.max(bounds.min, Math.min(bounds.max, width));
}

interface ActiveDrag<T extends HTMLElement> {
  session: ResizeSession;
  target: T;
  pointerId: number;
  /** The unbanded width the drag starts from: the one that shows `session.width`. */
  pull: number;
  startX: number;
  pendingX: number;
  width: number;
  moved: boolean;
  frame: number | null;
  onBlur: () => void;
}

function createResizeDrag<T extends HTMLElement>() {
  let drag: ActiveDrag<T> | null = null;

  const flush = (final = false) => {
    const active = drag;
    if (!active) return;
    const delta = (active.pendingX - active.startX) * (active.session.edge === "left" ? -1 : 1);
    if (Math.abs(delta) > 2) active.moved = true;
    const { min, max } = active.session.bounds;
    const wanted = active.pull + delta;
    active.width = active.session.resize(
      final ? clampToBounds(wanted, active.session.bounds) : rubberClamp(wanted, min, max, BAND_REACH),
    );
  };

  const finish = (commit: boolean) => {
    const active = drag;
    if (!active) return;
    if (active.frame !== null) cancelAnimationFrame(active.frame);
    window.removeEventListener("blur", active.onBlur);
    if (commit) flush(true);
    // Release can synchronously dispatch lostpointercapture.
    drag = null;
    try {
      if (active.target.hasPointerCapture(active.pointerId)) {
        active.target.releasePointerCapture(active.pointerId);
      }
    } catch {}
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    active.session.cleanup?.(commit);
    if (commit) active.session.finish(active.width, active.moved);
  };

  const end = (event: PointerEvent<T>, usePosition: boolean) => {
    const active = drag;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (usePosition) active.pendingX = event.clientX;
    finish(true);
  };

  return {
    ref: (node: T | null) => (node === null ? undefined : () => finish(false)),
    cancel: () => finish(false),
    refresh(bounds?: ResizeBounds) {
      if (!drag) return;
      if (bounds) drag.session.bounds = bounds;
      flush();
    },
    begin(event: PointerEvent<T>, start: (event: PointerEvent<T>) => ResizeSession | null) {
      if (event.button !== 0 || drag) return;
      const session = start(event);
      if (!session) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        session.cleanup?.(false);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      // Leaving the window mid-drag commits where the pointer was.
      const onBlur = () => finish(true);
      window.addEventListener("blur", onBlur);
      drag = {
        session,
        target: event.currentTarget,
        pointerId: event.pointerId,
        pull: rubberUnclamp(session.width, session.bounds.min, session.bounds.max, BAND_REACH),
        startX: event.clientX,
        pendingX: event.clientX,
        width: session.width,
        moved: false,
        frame: null,
        onBlur,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    onPointerMove(event: PointerEvent<T>) {
      const active = drag;
      if (!active || active.pointerId !== event.pointerId) return;
      event.preventDefault();
      active.pendingX = event.clientX;
      if (Math.abs(event.clientX - active.startX) > 2) active.moved = true;
      if (active.frame !== null) return;
      active.frame = requestAnimationFrame(() => {
        active.frame = null;
        flush();
      });
    },
    onPointerUp: (event: PointerEvent<T>) => end(event, true),
    onPointerCancel: (event: PointerEvent<T>) => end(event, false),
    onLostPointerCapture: (event: PointerEvent<T>) => end(event, false),
  };
}

/**
 * A pointer drag that resizes along one edge. The session `start` returns owns
 * everything the drag needs, so options read at pointer-down hold for the whole
 * drag. Attach `ref` to the handle so unmounting it abandons the drag.
 */
export function useResizeDrag<T extends HTMLElement>(
  start: (event: PointerEvent<T>) => ResizeSession | null,
) {
  // Created once: `ref` must keep its identity, or a re-render mid-drag would run its cleanup.
  const [drag] = useState(createResizeDrag<T>);
  const { begin, ...rest } = drag;
  return { ...rest, onPointerDown: (event: PointerEvent<T>) => begin(event, start) };
}
