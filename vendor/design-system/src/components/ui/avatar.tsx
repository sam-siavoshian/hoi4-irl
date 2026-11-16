// A person's (or an account's) face, or their initials until there is one. From
// sam-siavoshian/morrow web/src/components/ui/avatar.tsx (the owner's own
// repo): initials of the first two words (`initialsOf`), t3code's stable name
// hash picking one of Zephium's soft hues, the status dot set into a notch at
// the top right (opencode), and never a broken image. Changes: any photo URL
// (Morrow takes GitHub's only), drawn as Leads' PersonAvatar drew it
// (components/leads/PersonAvatar.tsx): the initials stay underneath and a
// photo that loads fades in over them, one that fails is silent; `tone`
// adds the neutral fill every Lanes avatar used (`bg-fill`, the secondary
// label ink) beside Morrow's hue; sizes are Lanes' (28, 32, 40px).
// `Face` is an agent's face (components/agents/AgentFace.tsx), re-exported.
// @sam/design-system: the `Face` re-export is left out (it reads Lanes' agents store).

import { cva, type VariantProps } from "class-variance-authority";
import { type CSSProperties, type ReactNode, useState } from "react";

import { cn } from "../../lib/utils";
import { type StatusTone } from "./status-dot";

const HUES = ["sky", "mint", "lemon", "peach", "rose", "lilac"] as const;

/** t3code's stable name hash: the same name always gets the same hue. */
function hueOf(name: string) {
  let index = 0;
  for (const char of name.normalize("NFKC").toLowerCase()) index = (index * 31 + char.codePointAt(0)!) % 997;
  return HUES[index % HUES.length]!;
}

/** First letter of the first two words, or the first two letters of one (Morrow). */
export function initialsOf(name: string) {
  const words = name.trim().split(/[\s._@-]+/u).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length > 1 ? [words[0]![0], words[1]![0]] : [...words[0]!].slice(0, 2);
  return letters.join("").toUpperCase();
}

const HUE_CLASS: Record<(typeof HUES)[number], string> = {
  sky: "bg-soft-sky-wash text-soft-sky-ink",
  mint: "bg-soft-mint-wash text-soft-mint-ink",
  lemon: "bg-soft-lemon-wash text-soft-lemon-ink",
  peach: "bg-soft-peach-wash text-soft-peach-ink",
  rose: "bg-soft-rose-wash text-soft-rose-ink",
  lilac: "bg-soft-lilac-wash text-soft-lilac-ink",
};

const DOT_TONE: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  live: "bg-soft-sky",
  attention: "bg-warning",
  success: "bg-success",
  danger: "bg-destructive",
  info: "bg-info",
  idle: "bg-faint",
};

export const avatarVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden select-none",
  {
    variants: {
      size: {
        /** Leads' table rows. */
        sm: "size-7 text-[0.6875rem]",
        /** Connections' account rows. */
        md: "size-8 text-xs",
        /** A drawer's header. */
        lg: "size-10 text-sm",
        /** Settings' signed-in identity. */
        xl: "size-10 text-base",
      },
      tone: {
        /** The fill every Lanes avatar uses. */
        neutral: "bg-fill font-medium text-label-secondary",
        /** Bolder initials in the foreground ink (the signed-in owner). */
        strong: "bg-fill font-semibold text-foreground",
        /** Morrow's: the name's own soft hue. */
        hue: "font-semibold tracking-[-0.02em]",
      },
      shape: {
        circle: "rounded-full",
        squircle: "rounded-[28%]",
      },
    },
    defaultVariants: { size: "sm", tone: "neutral", shape: "circle" },
  },
);

const PIXELS = { sm: 28, md: 32, lg: 40, xl: 40 } as const;

export type AvatarProps = VariantProps<typeof avatarVariants> & {
  /** Whose: their initials, their hue, and nothing spoken (the name sits beside it). */
  name: string;
  /** A photo. Missing or failing, the initials stay. */
  src?: string | null | undefined;
  /** What shows without a photo (letters, or a generic face); the name’s initials by default. */
  fallback?: ReactNode;
  /** A small dot set into a notch at the top right (opencode). */
  status?: StatusTone;
  /** For a photo on someone else's host (Google's avatars): send no referrer. */
  referrerPolicy?: "no-referrer";
  className?: string;
};

export function Avatar({ name, src, fallback, status, referrerPolicy, size, tone, shape, className }: AvatarProps) {
  const [state, setState] = useState<{ src: string; shown: boolean; failed: boolean } | null>(null);
  const current = src && state?.src === src ? state : src ? { src, shown: false, failed: false } : null;
  const hue = tone === "hue" ? HUE_CLASS[hueOf(name)] : "";
  const px = PIXELS[size ?? "sm"];
  const dot = Math.max(6, Math.round(px * 0.24));
  const gap = dot / 2 + 1.5;
  // The notch: a ring of transparency round where the dot sits, so it reads as set into the avatar (Morrow).
  const notch: CSSProperties | undefined = status
    ? { maskImage: `radial-gradient(circle at ${px - dot / 2 + 1}px ${dot / 2 - 1}px, transparent ${gap}px, #000 ${gap + 0.5}px)` }
    : undefined;
  const face = (
    <span
      aria-hidden
      data-slot="avatar"
      className={cn(avatarVariants({ size, tone, shape }), hue, !status && className)}
      style={notch}
    >
      {fallback ?? initialsOf(name)}
      {current && !current.failed ? (
        <img
          src={current.src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          {...(referrerPolicy ? { referrerPolicy } : {})}
          onLoad={() => setState({ src: current.src, shown: true, failed: false })}
          onError={() => setState({ src: current.src, shown: false, failed: true })}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-(--motion-base) ease-out",
            current.shown ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </span>
  );
  if (!status) return face;
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {face}
      <span
        aria-hidden="true"
        className={cn("absolute rounded-full", DOT_TONE[status])}
        style={{ width: dot, height: dot, top: -1, right: -1 }}
      />
    </span>
  );
}

