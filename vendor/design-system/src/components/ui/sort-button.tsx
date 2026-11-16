// A table column's heading that sorts it. t3code's table header type
// (pingdotgg/t3code apps/web/src/components/ui/table.tsx: medium weight, the
// muted ink, the foreground when it is the sorted column), as Leads' table drew
// it by hand (components/leads/LeadsTable.tsx): the label, an arrow for the
// direction, a soft fill on hover. Moved here unchanged. Put it inside the
// `role="columnheader"` cell, which carries `aria-sort`.

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../../lib/utils";

export function SortButton({
  label,
  direction,
  className,
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  label: string;
  /** The column is sorted this way; null when another column is. */
  direction: "asc" | "desc" | null;
}) {
  return (
    <button
      type="button"
      data-slot="sort-button"
      className={cn(
        "pressable inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 hover:bg-fill-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        direction && "text-foreground",
        className,
      )}
      {...props}
    >
      <span className="truncate">{label}</span>
      {direction === "asc" ? (
        <ArrowUpIcon className="size-3 shrink-0" />
      ) : direction === "desc" ? (
        <ArrowDownIcon className="size-3 shrink-0" />
      ) : null}
    </button>
  );
}
