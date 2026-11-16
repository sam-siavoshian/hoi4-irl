// Copied from pingdotgg/t3code apps/web/src/components/ui/checkbox.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: the tick and the dash are lucide's Check and Minus at stroke 3, as
// Morrow draws them (sam-siavoshian/morrow web/src/components/ui/checkbox.tsx),
// in place of t3code's hand-drawn paths.

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";

import { cn } from "../../lib/utils";

const rootClassName =
  "relative inline-flex size-4.5 shrink-0 items-center justify-center rounded-[.25rem] border border-input bg-background not-dark:bg-clip-padding shadow-xs/5 outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[3px] not-data-disabled:not-data-checked:not-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive/36 focus-visible:aria-invalid:border-destructive/64 focus-visible:aria-invalid:outline-destructive/48 data-disabled:opacity-64 sm:size-4 dark:not-data-checked:bg-input/32 dark:focus-visible:aria-invalid:outline-destructive/24 dark:not-data-disabled:not-data-checked:not-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)] [[data-disabled],[data-checked],[aria-invalid]]:shadow-none";

const indicatorClassName =
  "-inset-px absolute flex items-center justify-center rounded-[.25rem] text-primary-foreground data-unchecked:hidden data-checked:bg-primary data-indeterminate:text-foreground in-[[data-slot=checkbox]:focus-visible]:inset-shadow-[0_0_0_3px_var(--background)] in-[[data-slot=checkbox]:focus-visible]:outline-2 in-[[data-slot=checkbox]:focus-visible]:outline-solid in-[[data-slot=checkbox]:focus-visible]:-outline-offset-2 in-[[data-slot=checkbox]:focus-visible]:outline-inherit";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      className={cn(rootClassName, className)}
      data-slot="checkbox"
      {...props}
    >
      {/* Keep an inner gap in the focus outline. Explicit glyph colors resist row icon-muting rules. */}
      <CheckboxPrimitive.Indicator
        className={indicatorClassName}
        data-slot="checkbox-indicator"
        render={(props, state) => (
          <span {...props}>
            {state.indeterminate ? (
              <MinusIcon className="size-3.5 text-current sm:size-3" strokeWidth={3} />
            ) : (
              <CheckIcon className="size-3.5 text-current sm:size-3" strokeWidth={3} />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

// Checkbox's look without its hidden input, for a row that is itself the button.
function CheckboxMark({ checked }: { checked: boolean }) {
  const state = checked ? { "data-checked": "" } : { "data-unchecked": "" };
  return (
    <span aria-hidden className={rootClassName} data-slot="checkbox" {...state}>
      <span className={indicatorClassName} data-slot="checkbox-indicator" {...state}>
        <CheckIcon className="size-3.5 text-current sm:size-3" strokeWidth={3} />
      </span>
    </span>
  );
}

export { Checkbox, CheckboxMark };
