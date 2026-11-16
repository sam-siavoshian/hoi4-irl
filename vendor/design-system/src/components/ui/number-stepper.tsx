// A number with a minus and a plus either side: first run's daily limit
// (screens/onboarding/steps/VolumeStep.tsx `Stepper`), moved here unchanged
// in behaviour: the field takes any number typed, the buttons move by `step`,
// both clamp to `min` and `max`, and leaving the field puts back the number
// in force. Drawn from the kit: t3code's Button (outline, round) and a
// numeral on Zephium's fill, at the control-compact radius.

import { MinusIcon, PlusIcon } from "lucide-react";
import { type ComponentProps, useEffect, useState } from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

export function NumberStepper({
  value,
  min = 1,
  max,
  step = 1,
  onChange,
  label,
  fieldLabel,
  fewerLabel = "Fewer",
  moreLabel = "More",
  inputProps,
  className,
}: {
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** The group's spoken name: "Emails a day from sam@acme.com". */
  label: string;
  /** The field's: "Emails a day". */
  fieldLabel: string;
  fewerLabel?: string;
  moreLabel?: string;
  /** Data attributes for the field (`{ "data-volume-input": "" }`). */
  inputProps?: Record<`data-${string}`, string>;
  className?: string;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const round: ComponentProps<typeof Button>["className"] = "rounded-capsule before:rounded-capsule";
  return (
    <div role="group" aria-label={label} data-slot="number-stepper" className={cn("flex items-center gap-1.5", className)}>
      <Button
        variant="outline"
        size="icon-sm"
        className={round}
        aria-label={fewerLabel}
        disabled={value <= min}
        onClick={() => onChange(value - step)}
      >
        <MinusIcon />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        aria-label={fieldLabel}
        {...inputProps}
        onChange={(event) => {
          setText(event.currentTarget.value);
          const next = Number(event.currentTarget.value);
          if (event.currentTarget.value !== "" && Number.isFinite(next)) onChange(next);
        }}
        onBlur={() => setText(String(value))}
        className="h-8 w-16 rounded-control-compact bg-fill text-center text-reading font-medium text-foreground tabular-nums outline-none [appearance:textfield] focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        variant="outline"
        size="icon-sm"
        className={round}
        aria-label={moreLabel}
        disabled={value >= max}
        onClick={() => onChange(value + step)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
