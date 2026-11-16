// From pingdotgg/t3code apps/web/src/keybindings.ts (MIT, Copyright (c) T3 Tools Inc.;
// full notice in app/ui/THIRD_PARTY_NOTICES.md): resolving an event to a command
// under a `when` context, and the label a shortcut is shown with. Changes: the
// terminal, preview, model-picker and thread-jump helpers are left out (no such
// surfaces), and the isDesktop/isWeb context is gone: Lanes runs in a browser.

import { isEditableFocused } from "../editableFocus";
import {
  isMacPlatform,
  matchesKeybindingShortcut,
  matchesKeybindingShortcutModifiers,
  type ShortcutEventLike as SharedShortcutEventLike,
  type ShortcutModifierStateLike,
} from "./shortcuts";
import {
  type KeybindingCommand,
  type KeybindingShortcut,
  type KeybindingWhenNode,
  NAVIGATION_KEYBINDING_COMMANDS,
  type ResolvedKeybindingRule,
  type ResolvedKeybindingsConfig,
} from "./types";

export interface ShortcutEventLike extends SharedShortcutEventLike {
  target?: EventTarget | null;
}

/** What a `when` clause can test. Scopes add their own (see dispatcher.ts). */
export interface ShortcutMatchContext {
  editableFocus?: boolean;
  commandPaletteOpen?: boolean;
  [key: string]: boolean | undefined;
}

export interface ShortcutMatchOptions {
  platform?: string;
  context?: Partial<ShortcutMatchContext>;
}

function resolvePlatform(options: ShortcutMatchOptions | undefined): string {
  return options?.platform ?? navigator.platform;
}

function resolveContext(options: ShortcutMatchOptions | undefined): ShortcutMatchContext {
  return {
    editableFocus: false,
    ...options?.context,
  };
}

function evaluateWhenNode(node: KeybindingWhenNode, context: ShortcutMatchContext): boolean {
  switch (node.type) {
    case "identifier":
      if (node.name === "true") return true;
      if (node.name === "false") return false;
      return Boolean(context[node.name]);
    case "not":
      return !evaluateWhenNode(node.node, context);
    case "and":
      return evaluateWhenNode(node.left, context) && evaluateWhenNode(node.right, context);
    case "or":
      return evaluateWhenNode(node.left, context) || evaluateWhenNode(node.right, context);
  }
}

function matchesWhenClause(
  whenAst: KeybindingWhenNode | undefined,
  context: ShortcutMatchContext,
): boolean {
  if (!whenAst) return true;
  return evaluateWhenNode(whenAst, context);
}

export function shortcutConflictKey(
  shortcut: KeybindingShortcut,
  platform = navigator.platform,
): string {
  const useMetaForMod = isMacPlatform(platform);
  const metaKey = shortcut.metaKey || (shortcut.modKey && useMetaForMod);
  const ctrlKey = shortcut.ctrlKey || (shortcut.modKey && !useMetaForMod);
  return [
    shortcut.key,
    metaKey ? "meta" : "",
    ctrlKey ? "ctrl" : "",
    shortcut.shiftKey ? "shift" : "",
    shortcut.altKey ? "alt" : "",
  ].join("|");
}

export function effectiveShortcutsForCommand(
  keybindings: ResolvedKeybindingsConfig,
  command: KeybindingCommand,
  options?: ShortcutMatchOptions,
): KeybindingShortcut[] {
  const platform = resolvePlatform(options);
  const context = resolveContext(options);
  const claimedShortcuts = new Set<string>();
  const effective: KeybindingShortcut[] = [];

  for (let index = keybindings.length - 1; index >= 0; index -= 1) {
    const binding: ResolvedKeybindingRule | undefined = keybindings[index];
    if (!binding) continue;
    if (!matchesWhenClause(binding.whenAst, context)) continue;

    const shortcut = binding.shortcut;
    const conflictKey = shortcutConflictKey(shortcut, platform);
    if (claimedShortcuts.has(conflictKey)) {
      continue;
    }

    claimedShortcuts.add(conflictKey);
    if (binding.command === command) {
      effective.push(shortcut);
    }
  }

  return effective;
}

function findEffectiveShortcutForCommand(
  keybindings: ResolvedKeybindingsConfig,
  command: KeybindingCommand,
  options?: ShortcutMatchOptions,
): KeybindingShortcut | null {
  return effectiveShortcutsForCommand(keybindings, command, options)[0] ?? null;
}

export function resolveShortcutCommand(
  event: ShortcutEventLike,
  keybindings: ResolvedKeybindingsConfig,
  options?: ShortcutMatchOptions,
): KeybindingCommand | null {
  const platform = resolvePlatform(options);
  const context = resolveContext(options);
  if (options?.context?.editableFocus === undefined && typeof document !== "undefined") {
    context.editableFocus = isEditableFocused(event.target ?? document.activeElement);
  }

  for (let index = keybindings.length - 1; index >= 0; index -= 1) {
    const binding = keybindings[index];
    if (!binding) continue;
    if (!matchesWhenClause(binding.whenAst, context)) continue;
    if (!matchesKeybindingShortcut(event, binding.shortcut, platform)) continue;
    return binding.command;
  }
  return null;
}

export function formatShortcutKeyLabel(key: string): string {
  if (key === " ") return "Space";
  if (key.length === 1) return key.toUpperCase();
  if (key === "escape") return "Esc";
  if (key === "arrowup") return "Up";
  if (key === "arrowdown") return "Down";
  if (key === "arrowleft") return "Left";
  if (key === "arrowright") return "Right";
  return key.slice(0, 1).toUpperCase() + key.slice(1);
}

export function formatShortcutLabel(
  shortcut: KeybindingShortcut,
  platform = navigator.platform,
): string {
  const keyLabel = formatShortcutKeyLabel(shortcut.key);
  const useMetaForMod = isMacPlatform(platform);
  const showMeta = shortcut.metaKey || (shortcut.modKey && useMetaForMod);
  const showCtrl = shortcut.ctrlKey || (shortcut.modKey && !useMetaForMod);
  const showAlt = shortcut.altKey;
  const showShift = shortcut.shiftKey;

  if (useMetaForMod) {
    return `${showCtrl ? "⌃" : ""}${showAlt ? "⌥" : ""}${showShift ? "⇧" : ""}${showMeta ? "⌘" : ""}${keyLabel}`;
  }

  const parts: string[] = [];
  if (showCtrl) parts.push("Ctrl");
  if (showAlt) parts.push("Alt");
  if (showShift) parts.push("Shift");
  if (showMeta) parts.push("Meta");
  parts.push(keyLabel);
  return parts.join("+");
}

export function shortcutLabelForCommand(
  keybindings: ResolvedKeybindingsConfig,
  command: KeybindingCommand | null,
  options?: string | ShortcutMatchOptions,
): string | null {
  if (command === null) return null;
  const resolvedOptions =
    typeof options === "string" ? ({ platform: options } satisfies ShortcutMatchOptions) : options;
  const platform = resolvePlatform(resolvedOptions);
  const shortcut = findEffectiveShortcutForCommand(keybindings, command, resolvedOptions);
  return shortcut ? formatShortcutLabel(shortcut, platform) : null;
}

/**
 * Whether held modifiers are the start of a section shortcut, so the sidebar
 * shows each section's key (t3code's shouldShowThreadJumpHintsForModifiers,
 * for Lanes' sections instead of threads).
 */
export function shouldShowNavigationHintsForModifiers(
  modifiers: ShortcutModifierStateLike,
  keybindings: ResolvedKeybindingsConfig,
  options?: ShortcutMatchOptions,
): boolean {
  const platform = resolvePlatform(options);
  for (const command of NAVIGATION_KEYBINDING_COMMANDS) {
    const shortcut = findEffectiveShortcutForCommand(keybindings, command, options);
    if (!shortcut) continue;
    if (matchesKeybindingShortcutModifiers(modifiers, shortcut, platform)) {
      return true;
    }
  }
  return false;
}
