// From pingdotgg/t3code apps/web/src/hooks/useCopyToClipboard.ts and
// useStableCallback.ts (https://github.com/pingdotgg/t3code). MIT License,
// Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: plain Errors instead of effect's tagged errors; t3code's extra
// clipboard flavors (its composer-context MIME) are left out.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** t3code useStableCallback: one identity for the component's life, always calling the latest function. */
export function useStableCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result {
  const latest = useRef(callback);
  useLayoutEffect(() => {
    latest.current = callback;
  });
  return useCallback((...args: Args) => latest.current(...args), []);
}

function writeTextWithExecCommand(value: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") return false;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  textarea.style.fontSize = "16px";

  const previouslyFocused = document.activeElement;
  document.body.appendChild(textarea);
  try {
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
    const restoreFocus = (previouslyFocused as { focus?: unknown } | null)?.focus;
    if (typeof restoreFocus === "function") {
      restoreFocus.call(previouslyFocused);
    }
  }
}

export async function writeTextToClipboard(value: string, target = "text"): Promise<boolean> {
  if (typeof window === "undefined") throw new Error(`Clipboard API is unavailable while copying ${target}.`);
  if (!value) return false;
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    if (writeTextWithExecCommand(value)) return true;
    throw new Error(`Clipboard API is unavailable while copying ${target}.`);
  }
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (cause) {
    // A page without clipboard permission (an embedded webview) can still copy the old way.
    if (writeTextWithExecCommand(value)) return true;
    throw new Error(`Failed to copy ${target} to the clipboard.`, { cause });
  }
}

export function useCopyToClipboard<TContext = void>({
  timeout = 2000,
  target = "text",
  onCopy,
  onError,
}: {
  timeout?: number;
  target?: string;
  onCopy?: (ctx: TContext) => void;
  onError?: (error: Error, ctx: TContext) => void;
} = {}): { copyToClipboard: (value: string, ctx: TContext) => void; isCopied: boolean } {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyToClipboard = useStableCallback((value: string, ctx: TContext): void => {
    void writeTextToClipboard(value, target).then(
      (didCopy) => {
        if (!didCopy) return;
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
        setIsCopied(true);
        onCopy?.(ctx);
        if (timeout !== 0) {
          timeoutIdRef.current = setTimeout(() => {
            setIsCopied(false);
            timeoutIdRef.current = null;
          }, timeout);
        }
      },
      (error: Error) => {
        console.error(error);
        onError?.(error, ctx);
      },
    );
  });

  useEffect(() => {
    return (): void => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, []);

  return { copyToClipboard, isCopied };
}
