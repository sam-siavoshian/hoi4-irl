// The chat composer's prompt: plain text that grows with what is typed. It
// stands where t3code's composer has its Tiptap editor
// (pingdotgg/t3code apps/web/src/components/ComposerPromptEditorTiptap.tsx,
// MIT, Copyright (c) T3 Tools Inc.; full notice in app/ui/THIRD_PARTY_NOTICES.md)
// and takes that editor's type and spacing: the prompt's font size
// (`--font-size-prompt`, 16px on touch phones so iOS never zooms), 24px
// lines, at least 48px tall and growing to 40% of the window, the placeholder
// ink. Changes: a textarea with `field-sizing: content` instead of a rich
// editor (Lanes' messages are plain text). Moved here from
// components/chat/ChatComposer.tsx.

import type * as React from "react";

import { cn } from "../../lib/utils";

export function ComposerPrompt({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      rows={1}
      data-slot="composer-prompt"
      className={cn(
        "block max-h-prompt-max min-h-12 w-full resize-none bg-transparent text-foreground leading-6 outline-none field-sizing-content placeholder:text-placeholder disabled:opacity-64",
        "text-(length:--font-size-prompt,var(--text-sm)) max-sm:pointer-coarse:text-(length:--font-size-prompt-touch)",
        className,
      )}
      {...props}
    />
  );
}
