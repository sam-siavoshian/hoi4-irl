// A line of text that is also the way to change it: it reads as text, warms
// under the pointer and shows a pencil, and a press opens its field. The
// company card's lines (components/company/StudyParts.tsx `EditableLine`,
// which keeps the editing; this is the line at rest), moved here: the look
// unchanged but for the company's name, now at Zephium's weight (500).

import { PencilIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";

export function EditableText({
  size = "line",
  empty = false,
  label,
  children,
  className,
  ...props
}: Omit<ComponentProps<"button">, "type" | "children"> & {
  /** `title`: the card's name, larger, on one line; `line`: one of its lines. */
  size?: "title" | "line";
  /** Nothing written yet: the placeholder shows, in the muted ink. */
  empty?: boolean;
  /** Spoken before the text: "Change company name: ". */
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-slot="editable-text"
      {...props}
      className={cn(
        "group -mx-1.5 flex w-[calc(100%+0.75rem)] min-w-0 items-start gap-2 rounded-inset px-1.5 py-0.5 text-left outline-none transition-colors duration-(--motion-fast) hover:bg-fill focus-visible:bg-fill focus-visible:ring-2 focus-visible:ring-ring/40",
        size === "title" ? "text-lg leading-snug font-medium tracking-tight" : "text-sm leading-normal",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <span className={cn("min-w-0 flex-1 text-pretty", empty ? "text-muted-foreground" : "text-foreground")}>
        {children}
      </span>
      <PencilIcon
        aria-hidden
        className={cn(
          "mt-[0.3em] size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-(--motion-fast) group-hover:opacity-100 group-focus-visible:opacity-100",
          empty && "opacity-60",
        )}
      />
    </button>
  );
}
