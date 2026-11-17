// A service's mark on a small raised tile: Gmail, Outlook, LinkedIn, X.
// Connections' ServiceLogo (components/connections/MailSection.tsx: t3code's
// control surface, a bordered `bg-background` tile with its faint shadow) and
// first run's plate (Zephium onboarding Essentials.svelte `.plate`: the mark
// on a raised card, 44px). Moved here; both looks unchanged. `mark` is the
// logo alone, for the channel on an idea's card (./suggestion-card.tsx).
// ARTESH's vendored copy: `icon` (a lucide element in place of `src`, in the
// page's ink, at the size a picture would have) for a product's own plain mark,
// and other props (data-*) reach the tile.

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";

export const logoTileVariants = cva("flex shrink-0 items-center justify-center text-foreground", {
  variants: {
    variant: {
      /** Connections' rows: 32px, bordered. */
      tile: "size-8 rounded-lg border border-border/60 bg-background shadow-xs/5 [&>img]:size-4.5 [&>svg]:size-4.5",
      /** First run's plate: 44px, raised. */
      plate: "size-11 rounded-card bg-card shadow-raised [&>img]:size-6.5 [&>svg]:size-6.5",
      /** The mark alone, 16px, on a card that already is the surface (SuggestionCard's channel). */
      mark: "size-4 [&>img]:size-4 [&>svg]:size-4",
      /** The mark at a chip's icon size, 12px. */
      glyph: "size-3 [&>img]:size-3 [&>svg]:size-3",
    },
    /** A black mark (X) turns white on a dark page. */
    invertInDark: {
      true: "dark:[&>img]:invert",
      false: "",
    },
  },
  defaultVariants: { variant: "tile", invertInDark: false },
});

type LogoTileProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof logoTileVariants> &
  ({ src: string; icon?: never } | { icon: ReactNode; src?: never }) & { className?: string | undefined };

export function LogoTile({ src, icon, variant, invertInDark, className, ...props }: LogoTileProps) {
  return (
    <span aria-hidden data-slot="logo-tile" {...props} className={cn(logoTileVariants({ variant, invertInDark }), className)}>
      {icon ?? <img src={src} alt="" className="object-contain" draggable={false} />}
    </span>
  );
}
