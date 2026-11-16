// The keybinding contract, from pingdotgg/t3code packages/contracts/src/keybindings.ts
// (MIT, Copyright (c) T3 Tools Inc.; full notice in app/ui/THIRD_PARTY_NOTICES.md).
// Changes: plain TypeScript types instead of effect Schema, and Lanes' own
// command list in place of t3code's.

export const MAX_WHEN_EXPRESSION_DEPTH = 64;
export const MAX_KEYBINDINGS_COUNT = 256;

/** The sections, in sidebar order. `navigate.<section>` jumps to one. */
export const NAVIGATION_KEYBINDING_COMMANDS = [
  "navigate.chat",
  "navigate.agents",
  "navigate.overview",
  "navigate.connections",
  "navigate.leads",
  "navigate.company",
  "navigate.settings",
] as const;
export type NavigationKeybindingCommand = (typeof NAVIGATION_KEYBINDING_COMMANDS)[number];

/**
 * Every command a shortcut can run. Add a command here, give it a default key
 * in ./defaults.ts, and handle it with `registerCommands` (./dispatcher.ts);
 * the palette lists it if it has an entry in components/shell/commands.tsx.
 */
export const STATIC_KEYBINDING_COMMANDS = [
  // t3code's, as t3code names them.
  "workspace.focusNext",
  "workspace.focusPrevious",
  "commandPalette.toggle",
  "theme.select",
  "sidebar.toggle",
  "navigation.back",
  "navigation.forward",
  "chat.new",
  "composer.focus",
  // The chat's own (screens/chat): t3code's chat.find and thread.stop/previous/next,
  // opencode's message.previous/next, and Lanes' clear and dictation.
  "chat.find",
  "chat.stop",
  "chat.clear",
  "chat.dictate",
  "campaign.previous",
  "campaign.next",
  "message.previous",
  "message.next",
  "appearance.cycle",
  "agents.openWindow",
  ...NAVIGATION_KEYBINDING_COMMANDS,
] as const;

export type KeybindingCommand = (typeof STATIC_KEYBINDING_COMMANDS)[number];

/** As written in a keybindings file: `{ key: "mod+k", command: "commandPalette.toggle", when: "!editableFocus" }`. */
export interface KeybindingRule {
  readonly key: string;
  readonly command: KeybindingCommand;
  readonly when?: string;
}

export interface KeybindingShortcut {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  /** Command on a Mac, Control elsewhere. */
  readonly modKey: boolean;
}

export type KeybindingWhenNode =
  | { type: "identifier"; name: string }
  | { type: "not"; node: KeybindingWhenNode }
  | { type: "and"; left: KeybindingWhenNode; right: KeybindingWhenNode }
  | { type: "or"; left: KeybindingWhenNode; right: KeybindingWhenNode };

export interface ResolvedKeybindingRule {
  readonly command: KeybindingCommand;
  readonly shortcut: KeybindingShortcut;
  readonly whenAst?: KeybindingWhenNode;
}

export type ResolvedKeybindingsConfig = ReadonlyArray<ResolvedKeybindingRule>;
