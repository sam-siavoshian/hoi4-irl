// The shortcut system, t3code's: rules ({key, command, when}) compile once, one
// keydown listener resolves an event to a command under a `when` context, and
// the newest registered scope that handles the command runs it.
//
// To add a shortcut: name the command in ./types.ts, give it a default key in
// ./defaults.ts, handle it with registerCommands() where it belongs, and (to
// make it findable) add it to the palette in components/shell/commands.tsx.

export { DEFAULT_KEYBINDINGS, DEFAULT_RESOLVED_KEYBINDINGS } from "./defaults";
export { registerCommands, type CommandHandler, type CommandHandlers } from "./dispatcher";
export {
  formatShortcutLabel,
  resolveShortcutCommand,
  shortcutLabelForCommand,
  type ShortcutMatchContext,
} from "./keybindings";
export { compileResolvedKeybindingsConfig, parseKeybindingShortcut } from "./shortcuts";
export { getKeybindings, setCustomKeybindings, useKeybindings } from "./store";
export * from "./types";
