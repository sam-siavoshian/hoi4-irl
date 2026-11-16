// Copied from pingdotgg/t3code apps/web/src/components/ui/textarea.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes for the kit: `variant="shine"` is Zephium's field (`.ui-shine-field`,
// design/zephium/controls.css), as Input's; `size="bare"` is text that is a
// field only when pressed (the writing style's lines and sample), growing
// with what is typed and taking its type from where it stands.


import { Field as FieldPrimitive } from "@base-ui/react/field";
import { mergeProps } from "@base-ui/react/merge-props";
import type * as React from "react";

import { cn } from "../../lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  size?: "sm" | "default" | "lg" | "bare" | number;
  unstyled?: boolean;
  /** `shine`: Zephium's field (first run). */
  variant?: "default" | "shine";
};

function Textarea({ className, size = "default", unstyled = false, variant = "default", ...props }: TextareaProps) {
  const shine = variant === "shine" && !unstyled;
  return (
    <span
      className={
        cn(
          shine &&
            "ui-shine-field relative inline-flex w-full text-base text-foreground has-disabled:opacity-64 has-aria-invalid:shadow-[var(--shine-top),inset_0_0_0_1px_color-mix(in_srgb,var(--color-danger)_60%,transparent)] sm:text-sm",
          !unstyled &&
            !shine &&
            "relative inline-flex w-full rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] has-focus-visible:ring-inset not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] sm:text-sm dark:bg-input/32 dark:has-aria-invalid:ring-destructive/24 dark:not-has-disabled:has-not-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]",
          className,
        ) || undefined
      }
      data-size={size}
      data-slot="textarea-control"
    >
      <FieldPrimitive.Control
        render={(defaultProps) => (
          <textarea
            className={cn(
              "field-sizing-content min-h-17.5 max-h-64 w-full rounded-[inherit] px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] outline-none wrap-anywhere max-sm:min-h-20.5",
              size === "sm" &&
                "min-h-16.5 px-[calc(--spacing(2.5)-1px)] py-[calc(--spacing(1)-1px)] max-sm:min-h-19.5",
              size === "lg" && "min-h-18.5 py-[calc(--spacing(2)-1px)] max-sm:min-h-21.5",
              size === "bare" &&
                "block max-h-none min-h-0 flex-1 resize-none rounded-none bg-transparent p-0 leading-[inherit] placeholder:text-faint max-sm:min-h-0",
              shine && "min-h-15 py-2",
            )}
            data-slot="textarea"
            {...mergeProps(defaultProps, props)}
          />
        )}
      />
    </span>
  );
}

export { Textarea, type TextareaProps };
