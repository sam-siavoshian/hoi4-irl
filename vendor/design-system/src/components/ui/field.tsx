// A control with its label over it and a line of help or an error under it.
// t3code's Label (./label.tsx) over the control, as Leads' dialogs composed it
// (components/leads/LeadDialogs.tsx `Field`), with Morrow's error line
// (sam-siavoshian/morrow web/src/components/onboarding: the error replaces
// the help and is announced). `StatusLine` is Settings' word beside a control
// that just saved (screens/settings/layout.tsx): "Saving…", "Saved", or what
// went wrong, in the tone that says which.

import { useEffect, type ComponentProps, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Label } from "./label";
import { Swap, usePulse } from "./motion";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  hintId,
  variant = "default",
  children,
  className,
}: {
  label: ReactNode;
  /** Help under the control. */
  hint?: ReactNode;
  /** What is wrong; replaces the hint and is announced. */
  error?: string | null | undefined;
  /** The control's id, so the label names it. */
  htmlFor?: string;
  /** An id for the hint or error line, for the control's `aria-describedby`. */
  hintId?: string;
  /**
   * `step`: a field in a guided step (first run), labelled as Zephium's
   * onboarding labels its controls (Import.svelte `.label`: small, medium,
   * the faint ink), its help in the body size.
   */
  variant?: "default" | "step";
  children: ReactNode;
  className?: string;
}) {
  const step = variant === "step";
  return (
    <div data-slot="field" data-variant={variant} className={cn(step ? "flex flex-col gap-2" : "space-y-1.5", className)}>
      <Label {...(htmlFor ? { htmlFor } : {})} className={cn(step && "text-label font-medium text-faint sm:text-label")}>
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" {...(hintId ? { id: hintId } : {})} className={cn("text-xs text-destructive", step && "text-label")}>
          {error}
        </p>
      ) : hint ? (
        <p
          {...(hintId ? { id: hintId } : {})}
          className={cn("text-xs text-muted-foreground", step && "text-label leading-normal text-pretty")}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** `error` is what went wrong, in a calm ink; `stopped`, red, only for a send that was stopped (docs/problems.md). */
export type StatusLineTone = "" | "ok" | "error" | "stopped";

/**
 * A save's result beside what made it: "Saving…", "Saved", or what went
 * wrong. Nothing when empty. A new line replaces the old one in place (Swap,
 * design/motion/README.md rule 16), and "ok" pulses once (rule 8).
 */
export function StatusLine({
  text,
  tone = "",
  className,
  ...props
}: { text: string; tone?: StatusLineTone; className?: string } & Omit<ComponentProps<"p">, "children">) {
  const pulse = usePulse();
  const saved = tone === "ok" ? text : "";
  useEffect(() => {
    if (saved) pulse.fire();
  }, [saved, pulse.fire]);
  if (!text) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      data-tone={tone || undefined}
      data-slot="settings-status"
      className={cn(
        "text-xs",
        tone === "stopped"
          ? "text-destructive"
          : tone === "error"
            ? "text-soft-lemon-ink"
            : tone === "ok"
              ? "text-success"
              : "text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span className={cn(pulse.props.className, "-mx-1.5 inline-flex rounded-capsule px-1.5")} data-pulse={pulse.props["data-pulse"]}>
        <Swap value={text}>{text}</Swap>
      </span>
    </p>
  );
}
