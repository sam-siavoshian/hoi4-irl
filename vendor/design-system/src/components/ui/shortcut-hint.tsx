// The key a control answers to, as a quiet chip beside its label. From
// sam-siavoshian/morrow web/src/components/ui/kbd.tsx (the owner's own repo):
// `formatKeys` and its glyphs (⌘ on a Mac, Ctrl elsewhere; ↵, Esc, ⇧ ...), one
// chip per key so ⌘ and K never read as one blob (opencode's keybind). Drawn
// with t3code's Kbd (./kbd.tsx), dressed as Zephium's keycap
// (frame/src/shared/ui/KeyHint/KeyHint.svelte, `.ui-keys kbd` in
// design/zephium/controls.css): 18px, the inset radius, the mono face at
// 11px/500, the control fill and the muted ink. The tones are Zephium's
// KeyHint on its onboarding buttons (Onboarding.svelte). Changes: Enter is
// "↵" on every platform, as Zephium writes it (Morrow wrote "Enter" off the
// Mac); `command` reads a shortcut's label from the keybindings
// (lib/keybindings, t3code's) instead of naming keys, so a rebound shortcut
// shows its new keys; `joined` draws the whole chord in one chip, as
// t3code's sidebar jump hints do.

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { type KeybindingCommand, shortcutLabelForCommand, useKeybindings } from "../../lib/keybindings";
import { cn, isMacPlatform } from "../../lib/utils";
import { Kbd, KbdGroup } from "./kbd";

const GLYPH: Record<string, { mac: string; other: string; label: string }> = {
  mod: { mac: "⌘", other: "Ctrl", label: "Command" },
  meta: { mac: "⌘", other: "Win", label: "Command" },
  ctrl: { mac: "⌃", other: "Ctrl", label: "Control" },
  alt: { mac: "⌥", other: "Alt", label: "Option" },
  shift: { mac: "⇧", other: "Shift", label: "Shift" },
  enter: { mac: "↵", other: "↵", label: "Enter" },
  escape: { mac: "Esc", other: "Esc", label: "Escape" },
  backspace: { mac: "⌫", other: "Backspace", label: "Backspace" },
  tab: { mac: "⇥", other: "Tab", label: "Tab" },
  up: { mac: "↑", other: "↑", label: "Up" },
  down: { mac: "↓", other: "↓", label: "Down" },
  left: { mac: "←", other: "←", label: "Left" },
  right: { mac: "→", other: "→", label: "Right" },
  space: { mac: "Space", other: "Space", label: "Space" },
};

/** Splits "mod+shift+k" or ["mod", "k"] into display glyphs and a spoken label (Morrow kbd.tsx). */
export function formatKeys(keys: string | readonly string[], mac: boolean) {
  const list = typeof keys === "string" ? keys.split("+") : keys;
  return list.map((raw) => {
    const key = raw.trim().toLowerCase();
    const known = GLYPH[key];
    if (known) return { glyph: mac ? known.mac : known.other, label: known.label };
    const glyph = raw.length === 1 ? raw.toUpperCase() : raw;
    return { glyph, label: glyph };
  });
}

const isMac = () => typeof navigator !== "undefined" && isMacPlatform(navigator.platform);

export const shortcutHintVariants = cva(
  "pointer-events-none select-none font-medium tracking-normal tabular-nums",
  {
    variants: {
      tone: {
        /** On a page or a control: Zephium's keycap, the control fill and the muted ink. */
        plain: "bg-control text-muted-foreground",
        /** On a lit fill (a primary button), where a control-grey key would vanish: the label's ink (Onboarding.svelte). */
        lit: "bg-[color-mix(in_srgb,var(--color-on-lit)_10%,transparent)] text-[color-mix(in_srgb,var(--color-on-lit)_64%,transparent)]",
        /** On a white control standing on the sky: the sky's own ink. */
        sky: "bg-[color-mix(in_srgb,var(--sky-on-ink)_8%,transparent)] text-[color-mix(in_srgb,var(--sky-on-ink)_60%,transparent)]",
        /** Just the glyph, no chip (a menu's trailing shortcut). */
        ghost: "bg-transparent text-faint",
      },
      size: {
        /** Zephium's keycap (KeyHint.svelte), the default beside a label: 18px, mono 11px. */
        md: "h-4.5 min-w-4.5 gap-0 rounded-inset px-[5px] font-mono text-caption",
        /** Morrow's 14px chip, for tooltips and menus. */
        sm: "h-3.5 min-w-3.5 rounded-[3px] px-1 text-[10px]",
      },
    },
    defaultVariants: { tone: "plain", size: "md" },
  },
);

type ShortcutHintProps = Omit<ComponentProps<"kbd">, "children"> &
  VariantProps<typeof shortcutHintVariants> & {
    /** Keys to show: "enter", "mod+k", or a list. `mod` is ⌘ on Apple platforms and Ctrl elsewhere. */
    keys?: string | readonly string[];
    /** Or a command from lib/keybindings: its current shortcut, as the palette and sidebar label it. */
    command?: KeybindingCommand;
    /** One chip for the whole chord ("⌘K") instead of one per key. */
    joined?: boolean;
  };

/**
 * The shortcut beside a label. Decoration for sighted readers only: the
 * control it sits in carries the name (and `aria-keyshortcuts`, if it wants).
 */
export function ShortcutHint({ keys, command, joined = false, tone, size, className, ...props }: ShortcutHintProps) {
  const bindings = useKeybindings();
  const mac = isMac();
  const label = command ? shortcutLabelForCommand(bindings, command) : null;
  const parts = command ? (label ? [{ glyph: label, label }] : []) : formatKeys(keys ?? "", mac);
  if (parts.length === 0 || (parts.length === 1 && !parts[0]!.glyph)) return null;
  const chip = shortcutHintVariants({ tone, size });
  if (joined || parts.length === 1) {
    return (
      <Kbd
        aria-hidden="true"
        data-key-hint={typeof keys === "string" ? keys : command}
        className={cn(chip, className)}
        {...props}
      >
        {parts.map((part) => part.glyph).join(mac ? "" : "+")}
      </Kbd>
    );
  }
  return (
    <KbdGroup aria-hidden="true" data-key-hint={typeof keys === "string" ? keys : undefined} className={className} {...props}>
      {parts.map((part, index) => (
        <Kbd key={index} className={chip}>
          {part.glyph}
        </Kbd>
      ))}
    </KbdGroup>
  );
}
