// The keymap in force: the defaults, merged with a person's own rules once
// Settings can write them (mergeWithDefaultKeybindings, t3code's rule). Plain
// module state so the dispatcher can read it at event time; React reads it
// through useKeybindings().

import { useSyncExternalStore } from "react";

import { DEFAULT_RESOLVED_KEYBINDINGS, mergeWithDefaultKeybindings } from "./defaults";
import { compileResolvedKeybindingsConfig } from "./shortcuts";
import type { KeybindingRule, ResolvedKeybindingsConfig } from "./types";

let current: ResolvedKeybindingsConfig = DEFAULT_RESOLVED_KEYBINDINGS;
const listeners = new Set<() => void>();

export function getKeybindings(): ResolvedKeybindingsConfig {
  return current;
}

/** Replace the person's own rules; the defaults fill in every command they leave out. */
export function setCustomKeybindings(rules: ReadonlyArray<KeybindingRule>): void {
  current = mergeWithDefaultKeybindings(compileResolvedKeybindingsConfig(rules));
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useKeybindings(): ResolvedKeybindingsConfig {
  return useSyncExternalStore(subscribe, getKeybindings, getKeybindings);
}
