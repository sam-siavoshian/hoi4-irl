// How Lanes says something went wrong, at four loudnesses (docs/problems.md):
//
//   StatusNote    quiet      a word on the thing itself: "Reconnecting…",
//                            "Paused: today’s limit is used". Never a toast.
//   NoticeBar     notice     a slim bar on the screen it affects; it clears itself.
//   ProblemCard   needs_you  one card with one action, until it's fixed.
//   ScreenError   broken     a screen that crashed: Try again and Copy details.
//
// Each says what happened, what Lanes is doing and what the owner needs to
// do, in that order, with the technical part behind a quiet "Details". A
// problem that clears says "Back to normal." for a moment and fades (none of
// it moves for prefers-reduced-motion). Neutral and soft tones: lemon for
// "needs you", the page's own fill for a notice, and red only for a send
// that was stopped (`tone="stopped"`). Live regions: polite for quiet and
// notice, assertive only for needs_you.
//
// Composed from the kit: Button (./button.tsx), Spinner (./spinner.tsx),
// Collapsible (./collapsible.tsx), EmptyState's tile (./empty.tsx). New for
// Lanes; the card's lemon wash, its border all round and the tone's icon in
// its header are the chat's question card's (components/chat/EscalationCard.tsx).
// No bar down its side (COMPONENTS.md, "No side accent bars").

import { CheckIcon, ChevronRightIcon, CircleAlertIcon, CopyIcon, InfoIcon, OctagonXIcon, RotateCwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty";
import { Crossfade, Swap, usePulse } from "./motion";
import { Spinner } from "./spinner";
import "./problem.css";

export const BACK_TO_NORMAL = "Back to normal.";

// ------------------------------------------------------------------ copy
/** Put text on the clipboard; answers whether it went. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** "Copy details", saying "Copied" for a moment after. */
export function CopyDetailsButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState<"" | "yes" | "no">("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const copy = useCallback(async () => {
    const went = await copyText(text);
    setCopied(went ? "yes" : "no");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(""), 2000);
  }, [text]);
  const pulse = usePulse();
  useEffect(() => {
    if (copied === "yes") pulse.fire();
  }, [copied, pulse.fire]);
  const words = copied === "yes" ? "Copied" : copied === "no" ? "Couldn’t copy" : "Copy details";
  // The icon crossfades (rule 18), the words swap in place (16), a copy pulses (8): design/motion/README.md.
  return (
    <Button
      size="xs"
      variant="ghost-muted"
      onClick={() => void copy()}
      className={cn(pulse.props.className, className)}
      data-pulse={pulse.props["data-pulse"]}
      data-slot="copy-details"
    >
      <Crossfade>{copied === "yes" ? <CheckIcon key="copied" /> : <CopyIcon key="copy" />}</Crossfade>
      <Swap value={words}>{words}</Swap>
    </Button>
  );
}

/** The quiet "Details" disclosure: the technical text, and a way to copy it. */
export function ProblemDetails({ details, className }: { details: string; className?: string }) {
  if (!details.trim()) return null;
  return (
    <Collapsible className={cn("min-w-0", className)} data-slot="problem-details">
      <CollapsibleTrigger
        render={<Button size="xs" variant="ghost-muted" className="group -ms-1.5" />}
        data-slot="problem-details-trigger"
      >
        <ChevronRightIcon className="transition-transform duration-(--motion-base) group-data-panel-open:rotate-90 motion-reduce:transition-none" />
        Details
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="mt-1 flex flex-col items-start gap-1.5">
          <pre className="max-h-48 w-full overflow-auto rounded-inset bg-fill px-2.5 py-2 font-mono text-2xs leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
            {details}
          </pre>
          <CopyDetailsButton text={details} />
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

function Lines({ doing, ask, className }: { doing?: ReactNode; ask?: ReactNode; className?: string }) {
  if (!doing && !ask) return null;
  return (
    <p className={cn("text-pretty text-muted-foreground", className)}>
      {doing}
      {doing && ask ? " " : null}
      {ask ? <span className="text-foreground">{ask}</span> : null}
    </p>
  );
}

// ------------------------------------------------------------ StatusNote
export type StatusNoteTone = "neutral" | "working" | "done";

/**
 * Quiet: a word on the thing it's about, with a spinner while Lanes works on
 * it. `resolved` turns it into "Back to normal." for a moment.
 */
export function StatusNote({
  children,
  tone = "neutral",
  icon,
  resolved = false,
  className,
  ...props
}: Omit<ComponentProps<"span">, "children"> & {
  children: ReactNode;
  tone?: StatusNoteTone;
  /** A lucide icon element, in place of the dot. */
  icon?: ReactNode;
  resolved?: boolean;
}) {
  const shown = resolved ? "done" : tone;
  return (
    <span
      role="status"
      aria-live="polite"
      data-slot="status-note"
      data-tone={shown}
      data-resolved={resolved ? "" : undefined}
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0",
        resolved && "problem-fade",
        className,
      )}
      {...props}
    >
      {shown === "working" ? (
        <Spinner size="xs" tone="muted" />
      ) : shown === "done" ? (
        <CheckIcon className="text-success" aria-hidden />
      ) : (
        (icon ?? <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-icon-muted" />)
      )}
      <span className="min-w-0 truncate">{resolved ? BACK_TO_NORMAL : children}</span>
    </span>
  );
}

// ------------------------------------------------------------- NoticeBar
export type NoticeBarProps = Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode;
  doing?: ReactNode;
  ask?: ReactNode;
  /** At most one: a small Button. */
  action?: ReactNode;
  details?: string;
  /** The problem is over: "Back to normal." for a moment, then it fades. */
  resolved?: boolean;
};

/** Notice: degraded, nothing to do yet. A slim bar across the screen it affects. */
export function NoticeBar({ title, doing, ask, action, details, resolved = false, className, ...props }: NoticeBarProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="notice-bar"
      data-resolved={resolved ? "" : undefined}
      className={cn(
        // Opaque under its fill: a bar over the sky or a scrolling page stays readable.
        "relative isolate flex min-w-0 flex-col gap-1 overflow-hidden rounded-lg border border-border/70 bg-card px-3 py-2 text-sm sm:flex-row sm:items-start sm:gap-3",
        "after:absolute after:inset-0 after:-z-10 after:bg-fill",
        resolved ? "problem-fade" : "animate-menu-in",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {resolved ? (
          <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
        ) : (
          <InfoIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-soft-sky-ink" />
        )}
        <div className="min-w-0 flex-1">
          {resolved ? (
            <p className="text-muted-foreground">{BACK_TO_NORMAL}</p>
          ) : (
            <>
              <p className="font-medium text-foreground">{title}</p>
              <Lines doing={doing} ask={ask} />
              {details ? <ProblemDetails details={details} className="mt-0.5" /> : null}
            </>
          )}
        </div>
      </div>
      {!resolved && action ? <div className="flex shrink-0 items-center gap-2 ps-6 sm:ps-0">{action}</div> : null}
    </div>
  );
}

// ----------------------------------------------------------- ProblemCard
export type ProblemCardTone = "attention" | "stopped";

export type ProblemCardProps = Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode;
  doing?: ReactNode;
  ask?: ReactNode;
  /** The one thing to do: a verb, 1 to 3 words. */
  actionLabel: string;
  onAction: () => void;
  actionIcon?: ReactNode;
  actionBusy?: boolean;
  /** A small word above the title: the campaign, the account. */
  eyebrow?: ReactNode;
  details?: string;
  /** `stopped` (red) only for a send that was stopped; `attention` (lemon) for everything else. */
  tone?: ProblemCardTone;
  resolved?: boolean;
};

/** Needs you: work waits until the owner acts. One card, one primary action, until it's fixed. */
export function ProblemCard({
  title,
  doing,
  ask,
  actionLabel,
  onAction,
  actionIcon,
  actionBusy = false,
  eyebrow,
  details,
  tone = "attention",
  resolved = false,
  className,
  ...props
}: ProblemCardProps) {
  const stopped = tone === "stopped";
  const Icon = stopped ? OctagonXIcon : CircleAlertIcon;
  return (
    <div
      role={resolved ? "status" : "alert"}
      aria-live={resolved ? "polite" : "assertive"}
      data-slot="problem-card"
      data-tone={tone}
      data-resolved={resolved ? "" : undefined}
      className={cn(
        // The wash sits on the card's own opaque fill, so the card reads the same over the sky.
        "relative isolate w-full overflow-hidden rounded-xl border bg-card px-3.5 py-3 text-sm",
        "after:absolute after:inset-0 after:-z-10",
        stopped ? "border-destructive/30 after:bg-error-surface" : "border-soft-lemon/45 after:bg-soft-lemon-wash/60",
        resolved ? "problem-fade" : "animate-menu-in",
        className,
      )}
      {...props}
    >
      {resolved ? (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <CheckIcon aria-hidden className="size-4 shrink-0 text-success" />
          {BACK_TO_NORMAL}
        </p>
      ) : (
        <>
          <div className={cn("flex min-w-0 items-center gap-1.5 text-xs", stopped ? "text-destructive" : "text-soft-lemon-ink")}>
            <Icon aria-hidden className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate font-medium">{eyebrow ?? (stopped ? "Stopped" : "Needs you")}</span>
          </div>
          <p className="mt-1.5 font-medium text-foreground text-pretty">{title}</p>
          <Lines doing={doing} ask={ask} className="mt-0.5" />
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <Button size="xs" variant="outline" onClick={onAction} loading={actionBusy} data-slot="problem-action">
              {actionIcon}
              {actionLabel}
            </Button>
          </div>
          {details ? <ProblemDetails details={details} className="mt-1.5" /> : null}
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------- ScreenError
export type ScreenErrorProps = Omit<ComponentProps<"div">, "title"> & {
  title?: ReactNode;
  doing?: ReactNode;
  ask?: ReactNode;
  onRetry: () => void;
  /** The error's own text, for Copy details. */
  details?: string;
  size?: "compact" | "default";
};

/** Broken: this screen crashed. A calm state with Try again and Copy details; the rest of Lanes keeps working. */
export function ScreenError({
  title = "This screen stopped working",
  doing = "The rest of Lanes is fine.",
  ask = "Try again. If it keeps happening, copy the details.",
  onRetry,
  details = "",
  size = "default",
  className,
  ...props
}: ScreenErrorProps) {
  return (
    <Empty size={size} role="alert" aria-live="polite" data-slot="screen-error" className={className} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {doing} {ask}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={onRetry} data-slot="screen-error-retry">
            <RotateCwIcon />
            Try again
          </Button>
          {details ? <CopyDetailsButton text={details} /> : null}
        </div>
      </EmptyContent>
    </Empty>
  );
}
