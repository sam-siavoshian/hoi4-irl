// Copied from pingdotgg/t3code apps/web/src/components/ui/input.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes for the kit: `variant="shine"` is Zephium's field on its pressable
// material (`.ui-shine-field`, design/zephium/controls.css; first run's
// fields), with `size="xl"` for a field that is the whole step (the company
// website) and `leading` for an icon inside it; `size="bare"` is a field that
// reads as text until it is pressed (the writing style's subject).


import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "../../lib/utils";

type InputProps = Omit<InputPrimitive.Props & React.RefAttributes<HTMLInputElement>, "size"> & {
  size?: "sm" | "compact" | "default" | "lg" | "xl" | "bare" | number;
  font?: "default" | "mono";
  unstyled?: boolean;
  nativeInput?: boolean;
  /** `shine`: Zephium's field (first run). */
  variant?: "default" | "shine";
  /** An icon inside the field, before the text. */
  leading?: React.ReactNode;
};

function Input({
  className,
  size = "default",
  font = "default",
  unstyled = false,
  nativeInput = false,
  variant = "default",
  leading,
  ...props
}: InputProps) {
  const shine = variant === "shine" && !unstyled;
  const inputClassName = cn(
    "h-8.5 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] leading-8.5 outline-none placeholder:text-placeholder sm:h-7.5 sm:leading-7.5 [transition:background-color_5000000s_ease-in-out_0s]",
    size === "compact" && "h-7 px-[calc(--spacing(2.5)-1px)] text-xs leading-7 sm:h-7 sm:leading-7",
    size === "sm" && "h-7.5 px-[calc(--spacing(2.5)-1px)] leading-7.5 sm:h-6.5 sm:leading-6.5",
    size === "lg" && "h-9.5 leading-9.5 sm:h-8.5 sm:leading-8.5",
    size === "xl" && "h-13 px-4 text-lg leading-13 tracking-tight sm:h-13 sm:leading-13",
    size === "bare" && "h-auto p-0 leading-normal sm:h-auto sm:leading-normal",
    shine && size === "default" && "h-8.5 leading-8.5 sm:h-8.5 sm:leading-8.5",
    Boolean(leading) && "ps-0",
    props.type === "search" &&
      "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
    props.type === "number" &&
      "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
    props.type === "file" &&
      "text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm",
  );
  let inputElement: React.ReactElement;

  if (nativeInput) {
    const { style, onValueChange: _onValueChange, ...nativeInputProps } = props;
    const nativeStyle = typeof style === "function" ? undefined : style;

    inputElement = (
      <input
        className={inputClassName}
        data-slot="input"
        size={typeof size === "number" ? size : undefined}
        style={nativeStyle}
        {...(nativeInputProps as React.ComponentProps<"input">)}
      />
    );
  } else {
    inputElement = (
      <InputPrimitive
        className={inputClassName}
        data-slot="input"
        size={typeof size === "number" ? size : undefined}
        {...props}
      />
    );
  }

  return (
    <span
      className={
        cn(
          shine &&
            "ui-shine-field relative inline-flex w-full items-center text-base text-foreground has-disabled:opacity-64 has-aria-invalid:shadow-[var(--shine-top),inset_0_0_0_1px_color-mix(in_srgb,var(--color-danger)_60%,transparent)] sm:text-sm",
          shine && size === "xl" && "text-lg sm:text-lg",
          !unstyled &&
            !shine &&
            "relative inline-flex w-full rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring has-autofill:bg-foreground/4 has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] has-focus-visible:ring-inset sm:text-sm dark:bg-input/32 dark:has-autofill:bg-foreground/8 dark:has-aria-invalid:ring-destructive/24 dark:not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]",
          !unstyled &&
            !shine &&
            size === "compact" &&
            "rounded-md before:rounded-[calc(var(--radius-md)-1px)]",
          font === "mono" && "font-mono tabular-nums",
          className,
        ) || undefined
      }
      data-size={size}
      data-slot="input-control"
      data-variant={shine ? "shine" : undefined}
    >
      {leading ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center text-muted-foreground",
            size === "xl" ? "ps-4 pe-3 [&_svg]:size-4.5" : "ps-3 pe-2 [&_svg]:size-4",
          )}
        >
          {leading}
        </span>
      ) : null}
      {inputElement}
    </span>
  );
}

export { Input, type InputProps };
