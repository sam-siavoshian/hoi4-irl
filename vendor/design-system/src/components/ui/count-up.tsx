// A number that counts up to its value when it first shows. Built on
// opencode's odometer (anomalyco/opencode packages/ui/src/components/
// animated-number.tsx, here ./AnimatedNumber.tsx), which rolls each digit to
// its new value: CountUp renders it at `from` (0), then hands it the real value
// a frame later, once it is in the document, so the digits roll up from zero.
// After that it is an AnimatedNumber: a later change rolls from the old value.
// Reduced motion shows the value at once (the odometer's own CSS stops the roll).

import { useEffect, useState } from "react";

import { AnimatedNumber } from "./AnimatedNumber";

export function CountUp({ value, from = 0, className }: { value: number; from?: number; className?: string }) {
  const [shown, setShown] = useState(from);

  useEffect(() => {
    // A frame later, so the first value is drawn at `from` and the odometer has something to roll from.
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <AnimatedNumber value={shown} {...(className ? { className } : {})} />;
}
