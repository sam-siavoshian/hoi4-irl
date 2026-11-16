// A select of named options, as t3code's settings rows use its Select
// (pingdotgg/t3code apps/web/src/components/settings/*: a small trigger at the
// row's right, the list aligned to its end, no check indicator). Moved here
// from screens/settings/controls.tsx, unchanged. Options are typed, so the
// value handed back is one of them.

import { cn } from "../../lib/utils";
import type { Option } from "./segmented";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "./select";

export function ChoiceSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
}: {
  /** The trigger's spoken name. */
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  const current = options.find((option) => option.value === value);
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        const found = options.find((option) => option.value === next);
        if (found) onChange(found.value);
      }}
    >
      <SelectTrigger size="sm" className={cn("w-full sm:w-44", className)} aria-label={label}>
        <SelectValue>{current?.label ?? value}</SelectValue>
      </SelectTrigger>
      <SelectPopup align="end" alignItemWithTrigger={false}>
        {options.map((option) => (
          <SelectItem key={option.value} hideIndicator value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}
