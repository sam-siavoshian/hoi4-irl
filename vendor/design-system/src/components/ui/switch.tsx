// Copied from pingdotgg/t3code apps/web/src/components/ui/switch.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes (design/motion/README.md): the thumb is a `motion-knob`. It crosses
// on --ease-in-out over --motion-knob and stretches 12% along the way at the
// middle of the move (rules 5 and 9), once per change and never on mount,
// where t3code stretched it 10% while held. The track's fill eases with it.

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { useState } from "react";

import { useKnob } from "./motion";

import { cn } from "../../lib/utils";

function Switch({
  className,
  size = "default",
  mixed = false,
  onCheckedChange,
  ...props
}: SwitchPrimitive.Root.Props & { size?: "default" | "sm"; mixed?: boolean }) {
  // Controlled, the change is `checked`; uncontrolled, the switch's own presses count it.
  const [presses, setPresses] = useState(0);
  const knob = useKnob<HTMLSpanElement>(props.checked ?? presses);
  return (
    <SwitchPrimitive.Root
      className={cn(
        "inline-flex h-[calc(var(--thumb-size)+2px)] w-[calc(var(--thumb-size)*2-2px)] shrink-0 cursor-pointer items-center rounded-full p-[2px] outline-none transition-[background-color,box-shadow] duration-(--motion-knob) ease-in-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-checked:bg-primary data-unchecked:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-64 data-[mixed]:bg-input",
        size === "sm"
          ? "[--thumb-size:--spacing(4)] sm:[--thumb-size:--spacing(3.5)]"
          : "[--thumb-size:--spacing(5)] sm:[--thumb-size:--spacing(4)]",
        className,
      )}
      data-size={size}
      data-slot="switch"
      data-mixed={mixed ? "" : undefined}
      // Base UI overwrites aria-checked even with undefined; pass it only for mixed state.
      {...(mixed ? { "aria-checked": "mixed" as const } : {})}
      onCheckedChange={(checked, details) => {
        if (props.checked === undefined) setPresses((count) => count + 1);
        onCheckedChange?.(checked, details);
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "motion-knob pointer-events-none block size-[calc(var(--thumb-size)-2px)] shrink-0 rounded-(--thumb-size) bg-background shadow-sm/5 dark:data-unchecked:bg-muted-foreground data-checked:translate-x-[calc(var(--thumb-size)-4px)]",
          mixed &&
            "translate-x-[calc((var(--thumb-size)-4px)/2)] opacity-70 data-checked:translate-x-[calc((var(--thumb-size)-4px)/2)]",
        )}
        data-slot="switch-thumb"
        ref={knob}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
