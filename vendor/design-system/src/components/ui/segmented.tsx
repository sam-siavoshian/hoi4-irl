// Two or three short options side by side, one chosen; arrow keys move between
// them. Moved here from screens/settings/controls.tsx (Appearance's Animation
// choice), unchanged: the track is Morrow's segmented control
// (sam-siavoshian/morrow web/src/components/ui/segmented.tsx: a capsule of
// `bg-fill`), the chosen option a raised capsule on the page colour (Zephium's
// raised elevation) rather than Morrow's sliding thumb. A radiogroup of
// buttons, so it needs no Base UI radio.
// Motion (design/motion/README.md): the raised capsule is one element that
// slides to the option chosen (SharedLayout, rules 20 and 9) instead of one
// fading out as another fades in, and each option presses (rule 4).
// Labels longer than the track has room for (a phone, a narrow column) stay
// one 28px line each: the track never grows past its container, its options
// are columns that share what room there is (a short label keeps its whole
// width, the long ones split the rest), and a label cut short ends in an
// ellipsis and says all of itself on hover (`title`). They used to wrap onto
// two and three lines and spill out of the option (design/motion/QA.md, M23).

import { useId } from "react";

import { cn } from "../../lib/utils";
import { SharedLayout } from "./motion";

/**
 * The chosen option's raised capsule, as one element that slides between the
 * options of its `group` (SharedLayout, design/motion/README.md rule 20). Put
 * it first inside the chosen option (a Button `variant="tab"`, Segmented's
 * own, or a ChoiceCards chip); it sits behind the label, so the option needs
 * `relative isolate` and must not clip it, and the track takes
 * `motion-segments` (design/motion/motion.css), which keeps the flying pill
 * under every other option's words, measures it against the track, and
 * presses an option's words rather than the pill (design/motion/QA.md, M3,
 * M2, M9). Wrap a bare label in an element so it can sit above the pill.
 * `tone`: `raised` (the page colour,
 * raised: a segment in a track) or `ink` (the text colour: a chosen chip,
 * lit, with `text-background` on its words).
 */
export function SegmentThumb({ group, tone = "raised" }: { group: string; tone?: "raised" | "ink" }) {
  return (
    <SharedLayout
      id={`segment-thumb:${group}`}
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 rounded-capsule",
        tone === "ink" ? "bg-foreground" : "bg-background shadow-raised",
      )}
      data-slot="segmented-thumb"
    />
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  /** The group's spoken name. */
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const group = useId();
  const move = (from: T, step: number) => {
    const at = options.findIndex((option) => option.value === from);
    const next = options[(at + step + options.length) % options.length];
    if (next) onChange(next.value);
    return next;
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        // Columns at most as wide as their label: the room there is goes to all of them evenly,
        // each stopping once it is whole, so a short label is never the one cut.
        "motion-segments grid w-fit max-w-full auto-cols-[minmax(0,max-content)] grid-flow-col gap-1 rounded-capsule bg-fill p-1",
        className,
      )}
      data-slot="segmented"
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            data-value={option.value}
            onClick={() => onChange(option.value)}
            // The whole label on hover, only where it is cut short.
            onPointerEnter={(event) => {
              const words = event.currentTarget.querySelector<HTMLElement>("[data-segmented-label]");
              if (words && words.scrollWidth > words.clientWidth) event.currentTarget.title = option.label;
              else event.currentTarget.removeAttribute("title");
            }}
            onKeyDown={(event) => {
              const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[
                event.key
              ];
              if (!step) return;
              event.preventDefault();
              const next = move(option.value, step);
              const group = event.currentTarget.parentElement;
              requestAnimationFrame(() =>
                group?.querySelector<HTMLElement>(`[data-value="${next?.value}"]`)?.focus(),
              );
            }}
            className={cn(
              "pressable relative isolate inline-flex h-7 min-w-0 cursor-pointer items-center rounded-capsule px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {on ? <SegmentThumb group={group} /> : null}
            <span className="min-w-0 truncate" data-segmented-label="">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
