# The design system

Copied, not re-imagined: each piece is the reference project's own code, with
the changes named in the file's header. `index.css` is the one stylesheet the
app imports; its order is the contract (Zephium paints, t3code shapes, the
bridge joins them).

| Here | From | What |
|---|---|---|
| `zephium/primitive.css` | Zephium `frame/src/styles/tokens/primitive.css` | raw greys and alphas, unchanged |
| `zephium/tokens.css` | Zephium `frame/src/styles/tokens.css` | colour ladder (dark base, `[data-theme="light"]`), type sizes, role radii, elevations, the shine, motion durations and curves (`--motion-*`, `--ease-*`, the `linear()` springs) |
| `zephium/type.css` | Zephium `frame/src/styles/axes/type.css` | `data-font`, `data-font-size`, `data-code-font` axes, unchanged |
| `zephium/material.css` | Zephium `axes/material.css`, `shared/ui/Menu/surface.css`, `tokens/sky.css` | liquid glass: the native material tiers (`data-material`), the menu's glass surface (`.ui-menu`, also the `glass-menu` utility in `bridge.css`) and its forced-colours fallback, glass standing on the sky |
| `zephium/motion.css` | Zephium `axes/motion.css`, `Menu/popover.css`, `NewTab.svelte`, `presence/Shimmer.svelte` | reduced motion; keyframes `ui-menu-*`, `zephium-rise`/`-settle`/`-arrive`, the shimmer band |
| `zephium/global.css` | Zephium `styles/global.css` | the body's type rendering (antialiased, optical sizing, kerning), the selection, text on Liquid Glass (`[data-glass-text]`) |
| `zephium/controls.css` | Zephium `shared/ui/Button/control.css`, `Button.svelte`, `KeyHint/KeyHint.svelte`, `Shine/shine.css` | the one control (`.ui-control`), the button (`.ui-button` + `data-variant` / `data-size="large"` / `data-shape="capsule"`), key hints (`.ui-keys kbd`), the shine plate (`.ui-shine*`) |
| `t3code/theme.css` | t3code `apps/web/src/index.css` | geometry (`--control-radius`, sidebar/command insets, `--workspace-topbar-height`, `--chat-content-max-width`), the semantic Tailwind names the primitives use, radius ladder, stepped status keyframes, glass/scroll-fade/grain utilities, contrast mixer, body/#root |
| `opencode/radar.ts`, `radar.test.ts` | opencode `packages/ui/src/components/spinner-radar.ts` (+ test) | the 5x5 Soft Radar layout and keyframes, unchanged |
| `opencode/RadarSpinner.tsx` | opencode `packages/ui/src/components/spinner.tsx` | Solid to React |
| `opencode/spin-phase.ts` | opencode `packages/ui/src/hooks/spin-phase.ts` | every spinner in phase, paused offscreen |
| `opencode/WorkingIndicator.tsx` | opencode `session/header/session-working-indicator.tsx`, `session-progress-indicator-v2.tsx`, `runtime/presence.ts` | the radar in a chat header while the agent generates, collapsing out |
| `opencode/TextShimmer.tsx` | opencode `typography/text-shimmer/text-shimmer.tsx` | "Thinking…" sweep |
| `opencode/micro.css` | opencode `spinner.css`, `text-shimmer.css`, `styles/scrollbar.css`, `tailwind/utilities.css`, `button.css`, `animations.css`, `typewriter.css`, `tooltip.css` | radar states, hover-only scrollbar (opencode's thumb alphas), `hover-reveal`, `no-scrollbar`, `overlay-hover`, cursor blink, tooltip in/out (`data-component="tooltip-v2"` on a popup, or `animate-tooltip-in`/`-out`), `motion-reduce:` on `data-motion` |
| `morrow/scenes.ts` | Morrow `web/src/components/sky/scenes.ts` | the three skies, plus the clock (`sceneForHour`) |
| `morrow/Sky.tsx`, `sky.css` | Morrow `web/src/components/sky/static-sky.tsx` + `.module.css`, `globals.css` | `BakedSky`, `Frost`, per-scene pictures |
| `morrow/sky/*` | Morrow `web/public/sky/*` | the baked skies (2200/1200, AVIF + JPEG) and frosts, unchanged |
| `morrow/effects.css` | Morrow `web/src/app/globals.css` | `sky-text`, `vibrant`, `sky-glass`, `beam-edge`, `hairline`, `text-quiet`, `tabular` |
| `morrow/ShimmerText.tsx`, `shimmer-text.css` | Morrow `shimmer-text.tsx` + `.module.css` (from Zephium's website) | the working shimmer (MPL-2.0) |
| `morrow/StatusDot.tsx` | Morrow `status-dot.tsx` | opencode's 7px status dot and its tab trick |
| `motion/` | ours | how everything moves: the twenty rules (`motion/README.md`), every duration, curve, scale and distance (`motion/tokens.css`, the one source, copied to the site), the primitives (`motion/motion.css`: `pressable`, the surfaces, `motion-enter`, `motion-knob`, `motion-pulse`, `motion-crossfade`, `motion-swap`, `motion-reveal`, `motion-sweep`) and their script side (`motion/motion.ts`) |
| `bridge.css` | ours | t3code's variables fed from Zephium's tokens; Zephium names as utilities |
| `lanes.css` | ours | Lanes' named sizes and glows: the titlebar geometry (`h-topbar`, `top-controls-y`, `ml-titlebar-content`), the palette and chat column (`max-h-palette`, `max-w-chat-column`, `pt-hero-top`), type (`text-hero`, `text-lede`, `text-figure`, a header's `font-header` `tracking-header`), inks on a dark chip (`text-success-on-dark`), `sky-veil-glow`, `virtualized-scroll-fade-top`, `scrollbar-stable` |
| `agents.ts` | ours | the Agents window's art as runtime values: the faces' paints and inks, the tile radar's ink |
| `theme.ts` | after Morrow `components/ui/theme.tsx` | live light/dark, sky clock, motion; `useTheme()` |

Fonts: Zephium ships none, and so neither does the stack: Zephium's own
(`bridge.css`), the platform's faces, SF on a Mac, Segoe UI Variable on
Windows, `system-ui` on Linux. t3code's Inter Variable, bundled from
`@fontsource-variable/inter` (OFL-1.1), is only the last resort before
`sans-serif`. Icons: `lucide-react`, as t3code
and Morrow use. Licences: `../../THIRD_PARTY_NOTICES.md`.

## Using it

- **Light and dark** are `data-theme="light" | "dark"` on `<html>`; write
  `dark:` in Tailwind. On Auto the sky decides (night is dark, dawn and day
  light); a theme the owner picks wins, and the clock's sky keeps to it
  (`theme.ts`). Never hardcode a colour: use the semantic utilities.
- **Semantic (t3code) names, Zephium values:** `bg-background`, `text-foreground`,
  `text-muted-foreground`, `bg-card`, `bg-popover`, `bg-accent`, `border-border`,
  `border-input`, `bg-primary text-primary-foreground` (Zephium's "lit" rung:
  there is no accent hue), `bg-sidebar`, `text-destructive`, `text-success`.
- **Zephium names** where t3code has none: surfaces `bg-chrome` `bg-surface`
  `bg-raised` `bg-float`; fills `bg-fill` `bg-fill-hover` `bg-fill-pressed`;
  text `text-faint` `text-label-secondary`; `bg-lit` `text-on-lit`; soft hues
  `bg-soft-sky-wash` `text-soft-mint-ink` (sky, mint, lemon, peach, rose,
  lilac); agents `bg-agent-browser`...; charts `bg-chart-1`..`8`.
- **Shape by role** (Zephium): `rounded-control` (30-34px controls),
  `rounded-control-compact`, `rounded-row`, `rounded-card`, `rounded-panel`,
  `rounded-capsule`. t3code's `rounded-md/lg/xl/2xl` stay for its primitives.
- **Depth**: `shadow-raised`, `shadow-float`, `shadow-overlay`, `shadow-menu`,
  `shadow-shine`, `shadow-shine-top`. Glass: `glass-menu` (Zephium),
  `surface-glass` `dialog-glass` `dropdown-glass` (t3code), `sky-glass` `vibrant`
  (on the sky).
- **Motion**: `motion/README.md` is the law (twenty rules, the tokens, the
  primitives, reduced motion). Durations by what they are for,
  `duration-(--motion-press|dropdown|popover|enter|exit|move|swap|...)`, and
  Zephium's `--motion-instant|fast|base|slow|page`; curves `ease-out` for
  entrances, `ease-in-out` for moves, `ease-exit` for exits,
  `ease-emphasized` for a page; no spring outside a playful moment
  (`--ease-spring-playful`). A bare `transition-colors` runs on
  `--motion-fast` and `--ease-out`. Arrivals `animate-rise`
  `animate-rise-after` `animate-settle` `animate-menu-in`, rows `motion-enter`
  with `Stagger`; status `animate-status-pulse` `animate-status-ping`
  `animate-skeleton`. `motion-reduce:` reads `data-motion="reduce"`.
- **Zephium's own controls** (`zephium/controls.css`), for a screen that should
  look exactly like Zephium's (first run): `<button className="ui-button ui-control"
  data-variant="primary" data-size="large" data-shape="capsule">` with
  `<span className="ui-keys"><kbd>↵</kbd></span>` beside the label; add
  `ui-shine ui-shine-press` for the secondary plate.
- **Working**: `<WorkingIndicator working />` (header radar), `<RadarSpinner />`,
  `<TextShimmer text="Thinking…" />`, `<StatusDot tone="live" pulse />`.
- **The sky**: `<BakedSky horizon={80} arrive />` follows `data-sky` (the clock,
  or a pinned scene); `<Frost />` is frosted glass for a panel on it; text on
  it is `text-sky-ink sky-text`. `setSkyPreference("night" | "time")`.
