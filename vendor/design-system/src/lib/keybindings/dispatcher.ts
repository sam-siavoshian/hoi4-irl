// From pingdotgg/t3code apps/web/src/shortcuts/dispatcher.ts (MIT, Copyright (c)
// T3 Tools Inc.; full notice in app/ui/THIRD_PARTY_NOTICES.md): one keydown
// listener, a stack of command scopes, the newest scope wins. Changes: the
// keybindings come from ./store (t3code reads them from its server atom), the
// focus context is Lanes' (editable focus, the palette), and the Electron menu
// bridge is left out.

import { isEditableFocused } from "../editableFocus";
import { resolveShortcutCommand, type ShortcutMatchContext } from "./keybindings";
import { getKeybindings } from "./store";
import type { KeybindingCommand, ResolvedKeybindingsConfig } from "./types";

/** Return `false` to let the next scope handle the event. */
export type CommandHandler = (event: KeyboardEvent) => boolean | void;

export type CommandHandlers = Partial<Record<KeybindingCommand, CommandHandler>>;

export interface CommandScopeOptions {
  /** Read at event time; a scope whose guard fails is skipped. */
  readonly when?: (event: KeyboardEvent) => boolean;
  /** When-clause context the dispatcher cannot know, read at event time. */
  readonly context?: () => Partial<ShortcutMatchContext>;
  readonly keybindings?: () => ResolvedKeybindingsConfig;
  /** For shortcuts that are not keybinding commands (Escape, "/"); runs before command lookup. */
  readonly onKeyDown?: CommandHandler;
  /**
   * Run in the capture phase, ahead of focused widgets that consume the key
   * themselves.
   */
  readonly capture?: boolean;
  /**
   * Hear every bubbling keydown after the scopes ran, with whether one of them
   * (or the page) consumed it. Observers never consume. For listeners that react to keys other
   * scopes may also handle, such as scroll keys.
   */
  readonly observe?: (event: KeyboardEvent, consumed: boolean) => void;
}

interface CommandScope {
  readonly commands: CommandHandlers;
  readonly options: CommandScopeOptions;
}

// Within each list the newest scope wins.
const globalScopes: CommandScope[] = [];
const captureScopes: CommandScope[] = [];
const observerScopes: CommandScope[] = [];

function readFocusContext(event: KeyboardEvent): Partial<ShortcutMatchContext> {
  return {
    editableFocus: isEditableFocused(event.target),
    commandPaletteOpen:
      typeof document !== "undefined" && document.querySelector("[data-command-palette]") !== null,
  };
}

function isInsideConfirmation(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[role="alertdialog"]') !== null;
}

function runScope(scope: CommandScope, event: KeyboardEvent): boolean {
  const { commands, options } = scope;
  if (options.when && !options.when(event)) return false;
  if (options.onKeyDown && options.onKeyDown(event) !== false) return true;
  const command = resolveShortcutCommand(event, options.keybindings?.() ?? getKeybindings(), {
    context: { ...readFocusContext(event), ...options.context?.() },
  });
  const handler = command === null ? undefined : commands[command];
  if (handler === undefined) return false;
  if (isInsideConfirmation(event.target)) {
    event.preventDefault();
    return true;
  }
  return handler(event) !== false;
}

function runScopes(scopes: readonly CommandScope[], event: KeyboardEvent): boolean {
  for (let index = scopes.length - 1; index >= 0; index -= 1) {
    if (event.defaultPrevented) return true;
    const scope = scopes[index];
    if (scope && runScope(scope, event)) return true;
  }
  return false;
}

function dispatchCaptureKeyDown(event: KeyboardEvent): void {
  runScopes(captureScopes, event);
}

function dispatchKeyDown(event: KeyboardEvent): void {
  const consumed = runScopes(globalScopes, event) || event.defaultPrevented;
  for (const scope of observerScopes.slice()) scope.options.observe?.(event, consumed);
}

let keydownInstalled = false;
function ensureKeydownListener() {
  if (keydownInstalled || typeof window === "undefined") return;
  keydownInstalled = true;
  window.addEventListener("keydown", dispatchCaptureKeyDown, true);
  window.addEventListener("keydown", dispatchKeyDown);
}

function pushScope(list: CommandScope[], scope: CommandScope): () => void {
  ensureKeydownListener();
  list.push(scope);
  return () => {
    const index = list.lastIndexOf(scope);
    if (index !== -1) list.splice(index, 1);
  };
}

/**
 * Handle commands while the returned function has not been called. App-global
 * commands register once at the shell; a screen registers its own in an effect
 * and returns the disposer, so its handlers win while it is mounted.
 */
export function registerCommands(
  commands: CommandHandlers,
  options: CommandScopeOptions = {},
): () => void {
  const scopes = options.observe ? observerScopes : options.capture ? captureScopes : globalScopes;
  return pushScope(scopes, { commands, options });
}
