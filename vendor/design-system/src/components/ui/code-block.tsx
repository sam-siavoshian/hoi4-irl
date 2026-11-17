// Commands to copy and run: a recessed plate of monospace lines with one button that copies them.
// ARTESH's vendored copy (the landing page's install commands); the kit had a code chip in prose and
// ProblemDetails' technical text (./problem.tsx), but no block of commands. Built from what is already here:
// ProblemDetails' plate (the fill, the mono face, the muted ink) at the card radius, and CopyDetailsButton's
// copy (the icon crossfades, rule 18; the word swaps in place, 16; a copy pulses once, 8).
//
//   lines   each a command (a string) or a note over the commands after it (`{ note }`), which is not copied
//   label   the block's spoken name, and the words in its header ("Terminal")
//
// A long command scrolls sideways inside the plate; the page never does.

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Crossfade, Swap, usePulse } from "./motion";

export type CodeBlockLine = string | { note: string };

export type CodeBlockProps = Omit<ComponentPropsWithoutRef<"figure">, "children"> & {
  lines: readonly CodeBlockLine[];
  label: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CodeBlock({ lines, label, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState<"" | "yes" | "no">("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const commands = lines.filter((line): line is string => typeof line === "string").join("\n");
  const copy = useCallback(async () => {
    const went = await copyText(commands);
    setCopied(went ? "yes" : "no");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(""), 2000);
  }, [commands]);
  const pulse = usePulse();
  useEffect(() => {
    if (copied === "yes") pulse.fire();
  }, [copied, pulse.fire]);
  const words = copied === "yes" ? "Copied" : copied === "no" ? "Couldn’t copy" : "Copy";
  return (
    <figure
      data-slot="code-block"
      aria-label={label}
      className={cn("min-w-0 overflow-hidden rounded-card bg-fill text-foreground", className)}
      {...props}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 ps-4 pe-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          size="xs"
          variant="ghost-muted"
          onClick={() => void copy()}
          className={pulse.props.className}
          data-pulse={pulse.props["data-pulse"]}
          data-slot="code-block-copy"
        >
          <Crossfade>{copied === "yes" ? <CheckIcon key="copied" /> : <CopyIcon key="copy" />}</Crossfade>
          <Swap value={words}>{words}</Swap>
        </Button>
      </figcaption>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-xs leading-relaxed">
        <code className="flex w-max flex-col">
          {lines.map((line, at) =>
            typeof line === "string" ? (
              <span key={at} data-slot="code-block-command">
                {line}
              </span>
            ) : (
              <span key={at} data-slot="code-block-note" className={cn("text-faint select-none", at > 0 && "pt-2.5")}>
                {line.note}
              </span>
            ),
          )}
        </code>
      </pre>
    </figure>
  );
}
