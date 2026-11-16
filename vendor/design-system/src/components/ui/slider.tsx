// A slider: one value along a track. New in ARTESH's vendored copy of the kit (Lanes has none), on Base UI's
// Slider like the kit's other primitives: ProgressMeter's track and fill, the Switch's knob for a thumb.

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "../../lib/utils";

export function Slider({
  label,
  valueText,
  className,
  ...props
}: Omit<SliderPrimitive.Root.Props<number>, "children"> & {
  /** Spoken name: what the value is. */
  label: string;
  /** The value in words ("3 March"). */
  valueText?: string;
}) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={cn("w-full min-w-0", className)} {...props}>
      <SliderPrimitive.Control className="flex h-9 w-full cursor-pointer touch-none items-center select-none sm:h-8">
        <SliderPrimitive.Track className="h-1.5 w-full rounded-full bg-fill">
          <SliderPrimitive.Indicator className="rounded-full bg-primary" />
          <SliderPrimitive.Thumb
            aria-label={label}
            {...(valueText ? { getAriaValueText: () => valueText } : {})}
            className="size-4.5 rounded-full bg-background shadow-raised outline-none has-focus-visible:ring-2 has-focus-visible:ring-ring"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
