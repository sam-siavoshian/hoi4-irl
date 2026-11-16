// Lanes' default keymap, in t3code's rule format (packages/shared/src/keybindings.ts,
// MIT, Copyright (c) T3 Tools Inc.). The keys follow t3code where the command is
// the same (mod+k palette, mod+b sidebar, F6 / Shift+F6 between areas,
// mod+[ / mod+] history, mod+shift+o new chat, mod+alt+a appearance,
// mod+alt+shift+a cycle appearance, mod+u Overview where t3code has Usage)
// and the old Lanes window for the sections: Alt/Option+1-7, because a browser
// keeps Cmd/Ctrl+1-8 for its own tabs and never hands them to the page, and
// Alt+N for a new chat, because it keeps Cmd/Ctrl+N for a new window
// (app/src/platform.js keysFor).

import { compileResolvedKeybindingsConfig } from "./shortcuts";
import {
  type KeybindingRule,
  MAX_KEYBINDINGS_COUNT,
  NAVIGATION_KEYBINDING_COMMANDS,
  type ResolvedKeybindingsConfig,
} from "./types";

export const DEFAULT_KEYBINDINGS: ReadonlyArray<KeybindingRule> = [
  { key: "mod+k", command: "commandPalette.toggle" },
  { key: "mod+b", command: "sidebar.toggle" },
  // t3code: F6 / Shift+F6 move focus between the sidebar and the section
  // (lib/keybindings/workspaceFocus.ts). Some browsers keep plain F6 for their
  // own toolbars; mod+F6 reaches the page in all of them.
  { key: "f6", command: "workspace.focusNext" },
  { key: "shift+f6", command: "workspace.focusPrevious" },
  { key: "mod+f6", command: "workspace.focusNext" },
  { key: "mod+shift+f6", command: "workspace.focusPrevious" },
  { key: "mod+[", command: "navigation.back" },
  { key: "mod+]", command: "navigation.forward" },
  // t3code's second key for a new chat. First, so alt+n stays the label: a
  // later rule wins.
  { key: "mod+shift+o", command: "chat.new" },
  { key: "alt+n", command: "chat.new" },
  // t3code: mod+alt+a opens the palette on the appearance choices.
  { key: "mod+alt+a", command: "theme.select" },
  // t3code's mod+u opens Usage; Lanes' counterpart is Overview (the same
  // chart icon). Before the numbered rules, so its number stays the label.
  { key: "mod+u", command: "navigate.overview" },
  { key: "/", command: "composer.focus", when: "!editableFocus" },
  // The chat (screens/chat registers the handlers). t3code: mod+f finds in the
  // thread, mod+shift+[ / ] step threads (here, campaigns). opencode: Escape or
  // Ctrl+G stops a reply while one is being written, mod+alt+[ / ] step messages.
  { key: "mod+f", command: "chat.find" },
  { key: "ctrl+g", command: "chat.stop", when: "!commandPaletteOpen" },
  // Last of the two, so Esc is the label the Stop button shows.
  { key: "escape", command: "chat.stop", when: "!commandPaletteOpen" },
  { key: "mod+shift+d", command: "chat.dictate" },
  // Clearing asks first (a confirmation), so a stray chord loses nothing.
  { key: "mod+shift+backspace", command: "chat.clear" },
  { key: "mod+shift+[", command: "campaign.previous" },
  { key: "mod+shift+]", command: "campaign.next" },
  { key: "mod+alt+[", command: "message.previous" },
  { key: "mod+alt+]", command: "message.next" },
  { key: "mod+alt+shift+a", command: "appearance.cycle" },
  // The Agents window, in a window of its own: the Agents section's key with Shift.
  { key: "alt+shift+2", command: "agents.openWindow" },
  ...NAVIGATION_KEYBINDING_COMMANDS.map((command, index) => ({
    key: `alt+${index + 1}`,
    command,
  })),
  // Last, so it is the label Settings shows (a later rule wins); Alt+7 still works.
  { key: "mod+,", command: "navigate.settings" },
];

export const DEFAULT_RESOLVED_KEYBINDINGS = compileResolvedKeybindingsConfig(DEFAULT_KEYBINDINGS);

// From t3code packages/shared/src/keybindings.ts, unchanged: a user's rules
// replace the defaults for the commands they name and keep the rest.
export function mergeWithDefaultKeybindings(
  custom: ResolvedKeybindingsConfig,
): ResolvedKeybindingsConfig {
  if (custom.length === 0) {
    return [...DEFAULT_RESOLVED_KEYBINDINGS];
  }

  const overriddenCommands = new Set(custom.map((binding) => binding.command));
  const retainedDefaults = DEFAULT_RESOLVED_KEYBINDINGS.filter(
    (binding) => !overriddenCommands.has(binding.command),
  );
  const merged = [...retainedDefaults, ...custom];

  if (merged.length <= MAX_KEYBINDINGS_COUNT) {
    return merged;
  }

  return merged.slice(-MAX_KEYBINDINGS_COUNT);
}
