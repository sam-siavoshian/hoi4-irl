// React port of anomalyco/opencode packages/ui/src/components/animated-number.tsx
// (https://github.com/anomalyco/opencode). MIT License, Copyright (c) 2025 opencode.
// Full notice in app/ui/THIRD_PARTY_NOTICES.md.
//
// An odometer: each digit rolls to its new value, up or down with the change,
// and the width eases only when the number of digits changes. The campaign
// card's verified counts, the Agents window's tiles and totals, and Overview
// roll as receipts land. Changes: Solid's stores and `on` effects become React
// state updated during render (the values a change derives from are the
// previous props); a number or digit not in the document settles at once,
// since it would never hear its transition end; and the CSS is
// ./animated-number.css.

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import "./animated-number.css";

const TRACK = Array.from({ length: 30 }, (_, index) => index % 10);

const DURATION = 600;

function normalize(value: number) {
  return ((value % 10) + 10) % 10;
}

function spin(from: number, to: number, direction: 1 | -1) {
  if (from === to) return 0;
  if (direction > 0) return (to - from + 10) % 10;
  return -((from - to + 10) % 10);
}

/** Whether the component is mounted, as a ref its render can read. */
function useConnected() {
  const connected = useRef(false);
  useLayoutEffect(() => {
    connected.current = true;
    return () => {
      connected.current = false;
    };
  }, []);
  return connected;
}

function Digit({ value, direction }: { value: number; direction: 1 | -1 }) {
  const [state, setState] = useState({ step: value + 10, animating: false, last: value });
  const connected = useConnected();

  if (state.last !== value) {
    const delta = spin(state.last, value, direction);
    const target = state.step + delta;
    // An unchanged digit keeps any roll it is in the middle of.
    if (!delta) setState({ ...state, last: value });
    // A detached digit never finishes a roll, and rapid changes can run off the track, so both settle at once.
    else if (!connected.current || target < 0 || target >= TRACK.length)
      setState({ animating: false, step: value + 10, last: value });
    else setState({ animating: true, step: target, last: value });
  }

  return (
    <span data-slot="animated-number-digit" data-animating={state.animating ? "true" : "false"}>
      <span data-slot="animated-number-static" data-digit={value} />
      <span
        data-slot="animated-number-strip"
        onTransitionEnd={() =>
          setState((current) => ({ ...current, animating: false, step: normalize(current.step) + 10 }))
        }
        style={
          {
            "--animated-number-offset": `${state.step}`,
            "--animated-number-duration": `var(--tool-motion-odometer-ms, ${DURATION}ms)`,
          } as CSSProperties
        }
      >
        {TRACK.map((cell, index) => (
          <span key={index} data-slot="animated-number-cell" data-digit={cell} />
        ))}
      </span>
    </span>
  );
}

export function AnimatedNumber({ value: input, className }: { value: number; className?: string }) {
  const target = Number.isFinite(input) ? Math.max(0, Math.round(input)) : 0;

  // A spare leading zero waits outside the clipped width to roll in. A digit that leaves stays until the width has
  // shrunk past it, so it rolls to zero instead of vanishing.
  const [state, setState] = useState({
    value: target,
    direction: 1 as 1 | -1,
    places: String(target).length + 1,
    resizing: false,
  });
  const connected = useConnected();

  if (target !== state.value) {
    const digits = String(target).length;
    const direction = target > state.value ? 1 : -1;
    // A detached number cannot ease its width and would never hear it end, so it settles at once.
    if (!connected.current) setState({ direction, value: target, places: digits + 1, resizing: false });
    // Only a change to the digit count eases the width, so a late font swap or zoom never animates it.
    else
      setState({
        direction,
        value: target,
        places: Math.max(state.places, digits + 1),
        resizing: state.resizing || digits !== String(state.value).length,
      });
  }

  const label = state.value.toString();
  // Place values, most significant first. Keying by place keeps each digit rolling as digits appear and leave.
  const places = Array.from({ length: state.places }, (_, index) => state.places - 1 - index);

  return (
    <span data-component="animated-number" className={className}>
      {/* The value is the only text: screen readers and copy read it once, in order. CSS draws the digits. */}
      <span className="sr-only">{label}</span>
      <span
        data-slot="animated-number-value"
        data-resizing={state.resizing ? "true" : "false"}
        aria-hidden="true"
        style={{ "--animated-number-width": `${label.length}ch` } as CSSProperties}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget)
            setState((current) => ({ ...current, places: current.value.toString().length + 1, resizing: false }));
        }}
      >
        {places.map((place) => (
          <Digit key={place} value={Math.floor(state.value / 10 ** place) % 10} direction={state.direction} />
        ))}
      </span>
    </span>
  );
}
