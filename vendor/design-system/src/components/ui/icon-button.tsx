// A button that is only an icon, with the name it must have. From
// sam-siavoshian/morrow web/src/components/ui/icon-button.tsx (the owner's own
// repo): `label` is required and is both the spoken name and the tooltip, an
// optional shortcut shows in the tooltip, sizes map to t3code's icon sizes.
// Changes: t3code's Button (./button.tsx) and Tooltip (./tooltip.tsx) in
// place of Morrow's; the tooltip names the shortcut as t3code's do,
// "Label (⌘F)" (its sidebar toggle and chat header), from keys or from a
// keybinding `command` (so a rebound key shows its new keys); `variant`
// defaults to t3code's `ghost-muted`, which every header action in Lanes
// already used.

import type { ReactNode } from "react";

import { type KeybindingCommand, shortcutLabelForCommand, useKeybindings } from "../../lib/keybindings";
import { isMacPlatform } from "../../lib/utils";
import { Button, type ButtonProps } from "./button";
import { formatKeys } from "./shortcut-hint";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./tooltip";

const SIZE = {
  micro: "icon-micro",
  xs: "icon-xs",
  sm: "icon-sm",
  md: "icon",
  lg: "icon-lg",
  xl: "icon-xl",
} as const;

export type IconButtonSize = keyof typeof SIZE;

export type IconButtonProps = Omit<ButtonProps, "size" | "aria-label" | "children"> & {
  /** Spoken name and tooltip text. Required: an icon alone says nothing. */
  label: string;
  /** The icon, a lucide component element. */
  children: ReactNode;
  /** Keys to show in the tooltip ("mod+k"). */
  shortcut?: string;
  /** Or the keybinding command it runs: its current keys show in the tooltip. */
  command?: KeybindingCommand;
  size?: IconButtonSize;
  /** Hide the tooltip, e.g. when a visible label sits next to the button. */
  tooltip?: boolean;
  tooltipSide?: "top" | "bottom" | "left" | "right";
};

/** t3code's tooltip hint: "Label (⌘F)", or the label alone. */
export function useShortcutTooltip(label: string, keys?: string, command?: KeybindingCommand): string {
  const bindings = useKeybindings();
  const mac = typeof navigator !== "undefined" && isMacPlatform(navigator.platform);
  const hint = command
    ? shortcutLabelForCommand(bindings, command)
    : keys
      ? formatKeys(keys, mac)
          .map((part) => part.glyph)
          .join(mac ? "" : "+")
      : null;
  return hint ? `${label} (${hint})` : label;
}

export function IconButton({
  label,
  shortcut,
  command,
  size = "sm",
  variant = "ghost-muted",
  tooltip = true,
  tooltipSide,
  children,
  ...props
}: IconButtonProps) {
  const tip = useShortcutTooltip(label, shortcut, command);
  if (!tooltip) {
    return (
      <Button aria-label={label} variant={variant} size={SIZE[size]} {...props}>
        {children}
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<Button aria-label={label} variant={variant} size={SIZE[size]} {...props} />}>
        {children}
      </TooltipTrigger>
      <TooltipPopup {...(tooltipSide ? { side: tooltipSide } : {})}>{tip}</TooltipPopup>
    </Tooltip>
  );
}
