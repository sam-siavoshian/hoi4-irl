# The kit

Every visual building block of the Lanes window is a component with typed
variants, imported from one place:

```tsx
import { Button, ListSection, ListRow, StatusLabel } from "~/components/ui";

<Button variant="primary" kbd="enter" loading={saving}>Save</Button>
```

Three rules (also in `AGENTS.md`):

1. **Use the kit.** Never hand-roll markup the kit already has: no raw
   `<button>`, `<input>` or `<textarea>`, no hex/`rgb()` colours, no colours in
   `style`, no arbitrary Tailwind values (`text-[13px]`, `bg-[#fff]`,
   `backdrop-blur-[2px]`), no local spinners.
2. **Look it up in the catalog first.** `npm --prefix app run dev`, then
   <http://127.0.0.1:1420/kit.html> (`?theme=dark`, `&surface=sky`): every
   component in every variant and state, light and dark, on the page and on
   the sky. It is a page of the dev server only (`kit.html`, a second Vite
   entry that `vite build` never reads).
3. **A new look is a new variant**, added to the component in
   `src/components/ui/`, never a `className` on a screen. `className` is for
   placement (margin, width, grid position, `hidden sm:flex`), not for looks
   (colour, type, radius, shadow, padding of a surface).

`src/components/ui/kit.test.ts` (in `npm test`) holds the line: it fails on a
new hand-rolled piece outside `components/ui/**` and `design/**`. Today's
offenders are counted in `src/components/ui/kit-baseline.json`: none (0, down
from 428 before first run, the writing style and the company study moved onto
the kit, and from 154 before the shell, the chat, the Agents window and
Overview did). The count only goes down, and
`LANES_KIT_BASELINE=shrink npm --prefix app test` records a lower one; with
nothing left, any hand-rolled piece fails the test.

**Motion is the design system's too** (`src/design/motion/README.md`: twenty
rules, their tokens and primitives). Every kit button already presses
(`pressable`: 0.97 at once, eased back); every popup grows from its trigger
(`motion-dropdown`, `-popover`, `-tooltip`, `-dialog`, `-sheet`); a list
staggers with `Stagger`, an icon swaps with `Crossfade`, a value with `Swap`,
a success pulses with `usePulse`, a reveal wipes with `Reveal`, one element
across states is a `SharedLayout`. A screen never writes a duration, a curve
or a spring: `duration-(--motion-enter) ease-out`, not `duration-200`.
`src/components/ui/motion.test.ts` fails on a hard-coded one, a spring on
everyday UI, a popup without its trigger origin, a kit button that doesn't
press and an exit as long as its entrance. The catalog's Motion section
(`kit.html#motion`) has every rule live, and its toolbar shows them reduced.

## No side accent bars

**Nothing in Lanes wears a coloured bar down one edge** (the owner's call,
2026-11-05): no card, notice, question, quote, row or email has a stripe on
its left, start, right or top. A tone reads from the card itself: its tinted
fill (`bg-soft-lemon-wash`, `bg-error-surface`, the page's `bg-fill`), its
border all round in the tone (`border-soft-lemon/45`, `border-destructive/30`),
the tone's icon in its header (`CircleAlertIcon`, `OctagonXIcon`,
`MessageCircleQuestionIcon`, `InfoIcon`) and its words ("Needs you",
"Stopped", "Lanes has a question"). Don't put anything in a bar's place. An
open or chosen row is its fill (`bg-accent`); a quote in the chat is a quiet
tinted plate with its edge all round.

Banned, in the window (`src/`, the kit and the design system included), the
extension's page (`app/connector-ui`), the emails (`server/email_design` and
`server/lifecycle_mail.py`) and the site (`site/`):

- a one-sided border on the left, right, start or end: `border-l-*`,
  `border-s-*`, `border-r-*`, `border-e-*`, `border-left:`, `border-right:`,
  `border-inline-start:`; or a 2px-and-up one on the top or bottom;
- an inset box-shadow stripe: `inset 3px 0 0 …`, `shadow-[inset_2px_0_…]`;
- a 1–4px absolutely positioned bar: a `before:`/`after:` pseudo-element
  (`before:absolute before:inset-y-3 before:start-0 before:w-0.5`) or an element.

`tests/test_no_side_accent_bars.py` fails on any of them. A one-sided line
that is structure, not an accent (the sidebar's or a sheet's edge against the
page, a submenu's tree guide, a timeline's spine, StepTrail's rule, a
chevron, a button's bevel), goes in its `ALLOWED` list, one entry each with
its reason; an entry that matches nothing any more fails too. A divider
between rows (`border-t border-border/50`, ListGroup's `divided`) is no
accent and needs no entry.

Files inside `components/ui/` import each other directly, never the barrel.
Each file's header names the source file it was copied from and what changed;
licences are in `THIRD_PARTY_NOTICES.md`. Screenshots of the catalog:
`PW_LOCAL_EXECUTABLE=… LANES_KIT_SHOTS_DIR=/tmp/kit npm --prefix app run kit:shots`
(`playwright.kit.config.ts`; it also checks every specimen draws with no
console error).

## Registry

Sources: **t3code** `pingdotgg/t3code apps/web/src/components/ui`,
**Zephium** `zephium-browser/zephium frame/src`, **opencode**
`anomalyco/opencode packages/ui`, **Morrow** `sam-siavoshian/morrow web/src/components`.

### Controls

| Component | Props and variants | Use it for | Not for | Source |
|---|---|---|---|---|
| `Button` | `variant`: `primary` (= `default`), `secondary`, `outline`, `ghost`, `ghost-muted`, `ghost-destructive`, `glass`, `destructive`, `destructive-outline`, `warning-outline`, `link`, `overlay`, `media-close`, `media-navigation`; Morrow's `sky`, `sky-secondary`, `beam`, `sky-beam` (capsules, for UI on the sky or the one action that leads on); t3code's composer `send` and `stop`; `segment` (a segment in a track: quiet until `aria-selected`/`aria-checked`). `size`: `xs`, `sm`, `md` (= `default`), `lg`, `xl`, `compact`, `micro`, `multiline`, `sm-multiline`, `icon`, `icon-xs`/`-sm`/`-lg`/`-xl`/`-micro`/`-tiny`. `shape`: `default`, `capsule`, `circle`. `loading` (keeps width, spinner over the words, refuses presses; pass `false` on a button that can become busy), `spinner`: `ring` \| `radar`, `kbd` ("enter", "mod+k"), `render` (an `<a>`, a trigger). Every button is `pressable`: 0.97 at once on the press, eased back on release; solid ones lift to 1.012 on hover (Morrow) | every press | an icon alone (IconButton), a table heading (SortButton), a radio (Segmented, ChoiceCards) | t3code `button.tsx`; `loading`/`kbd`/`capsule` from Zephium `Onboarding.svelte` via Morrow `onboarding/step-chrome.tsx`; the feel and the sky/beam variants from Morrow `ui/button.tsx`; `send`/`stop` from t3code `ComposerPrimaryActions.tsx` |
| `InlineButton` | `tone`: `default`, `muted`, `destructive`, `picker` | a press inside a sentence | anything that should look like a control | t3code `button.tsx` |
| `IconButton` | `label` (required: name and tooltip), `size`: `micro`, `xs`, `sm` (default), `md`, `lg`, `xl`, `variant`, `shape` (Button's; `ghost-muted` default), `shortcut` (keys) or `command` (a keybinding: its current keys), `tooltip`, `tooltipSide`. The tooltip reads t3code's "Label (⌘F)"; `useShortcutTooltip(label, keys, command)` gives the same words to a tooltip of your own | a header action, a row's menu, close | a button with words | Morrow `ui/icon-button.tsx` on t3code Button + Tooltip |
| `Kbd`, `KbdGroup` | | a key in prose, a palette footer, a sidebar jump hint, the Keyboard shortcuts page | beside a control's label (ShortcutHint) | t3code `kbd.tsx`, drawn as Zephium's keycap (`KeyHint.svelte`: 18px, the inset radius, mono 11px/500, the control fill, the muted ink) |
| `ShortcutHint` | `keys` ("enter", "mod+shift+p", a list) or `command` (a keybinding id: shows its current keys), `tone`: `plain`, `lit` (on a primary fill), `sky`, `ghost`, `size`: `md` (Zephium's keycap: 18px, the inset radius, mono 11px), `sm`, `joined`. Enter is ↵ on every platform | the key that presses a control | typing a shortcut label by hand | Morrow `ui/kbd.tsx` (`formatKeys`) on t3code Kbd; the keycap and tones from Zephium's `KeyHint.svelte` |
| `Input` | `size`: `sm`, `compact`, `default`, `lg`, `xl` (a field that is the whole step), `bare` (text until pressed); `variant`: `default`, `shine` (Zephium's `.ui-shine-field`, first run); `leading` (an icon inside); `font`: `default`, `mono`; `unstyled`; `nativeInput` | one line of text, a number | a file (FilePicker) | t3code `input.tsx`; `shine` from Zephium `Shine/shine.css` |
| `Textarea` | `size`: `sm`, `default`, `lg`, `bare` (the style's lines: text until pressed, growing with it); `variant`: `default`, `shine`; `unstyled` | several lines | | t3code `textarea.tsx` |
| `InputGroup`, `InputGroupAddon`, `InputGroupInput` | | an input with an icon or button inside | | t3code `input-group.tsx` |
| `Label`, `Field` | Field: `label`, `hint`, `error` (replaces the hint, announced), `htmlFor`, `hintId` (for the control's `aria-describedby`), `variant`: `default`, `step` (Zephium's onboarding label: small, medium, faint) | a control with its label and help | | t3code `label.tsx`; Field as Leads' dialogs composed it, error line from Morrow onboarding, `step` from Zephium `Import.svelte` `.label` |
| `Select…`, `ChoiceSelect` | ChoiceSelect: `label`, `value`, `options` (typed), `onChange`, `disabled` | picking one of many named options | two or three short options (Segmented) | t3code `select.tsx`; ChoiceSelect as t3code's settings rows use it |
| `Segmented` | `label`, `value`, `options`, `onChange`. Never wider than its container: a label too long for the room is one line cut with … and shown whole on hover, short ones keep their width | two or three short options side by side | more than three | Morrow `ui/segmented.tsx` track (Lanes' raised capsule) |
| `ChoiceCards`, `ThemePreview` | `label`, `value` (or null), `options` (`{value, label, sub, preview, quote, tags, icon, data}`), `onChange`, `onPoint` (hovered or focused), `onUse` (Enter), `disabled`; `variant`: `preview` (a picture each; `columns`: 2, 3, 4), `sample` (a card that plays it: the writing style's presets, five across, three in a narrow column, sideways on a phone; `columns`: 2 or 4 for a choice of that many, as how you sound on X has, four going two across in a narrow column), `chips` (capsules in a row; arrows move, Space picks; `size`: `md`, `lg`, 40px, a big target), `tiles` (a grid of small cards, the option's `icon` in a well and its words: three across, two on a phone, every tile in a row one height, the words never cut short; the chosen one tinted, ringed in the lit ink and ticked on its well; arrows move, Space picks; `size`: `md` 40px (Settings), `lg` 44px (first run): About you), `thumbs` (small tiles, a picture and a name each: the pal's shape, eyes and face), `swatches` (round paints, `swatch` the colour: the pal's colour); `onClear` (pressing the chosen one again clears it: an optional question); ThemePreview `theme`: `light`, `dark` | a choice best shown as pictures (theme), a style to start from, which account, a short answer, a part of the pal's look | plain text choices | Zephium onboarding `Models.svelte` option cards; Appearance's theme cards; the writing style's cards and chips; `thumbs` and `swatches` are Lanes' |
| `ChoiceToggles` | `label`, `values`, `options` (`{value, label, icon, data}`), `onChange` (every value chosen, in the options' order), `size`: `md`, `lg`, `disabled`. A group of toggles (`aria-pressed`), each its own tab stop, the chosen ones lit with a tick | several of a few short answers (About you: how you'll use Lanes) | one of many (ChoiceCards) | Lanes, on ChoiceCards' chips |
| `ChoiceToggles variant="tiles"` | ChoiceToggles' props, `variant`: `chips` (default), `tiles` (ChoiceCards' tiles, `aria-pressed`); `size`: `md`, `lg` | several answers as tiles with an icon each: About you's first question, in first run and Settings | one answer (ChoiceCards `tiles`) | Lanes, on ChoiceCards' tiles (`choice-cards.css`: the style cards' surface, the theme cards' ring) |
| `Switch`, `Checkbox` | Switch `size`: `sm`, `default`; Checkbox `indeterminate` (its tick and dash are lucide's Check and Minus at stroke 3, Morrow's) | on/off, selection | | t3code; the marks from Morrow `ui/checkbox.tsx` |
| `FilePicker`, `FileInput`, `FileDropZone` | FilePicker: `accept`, `title`, `hint`, `icon`, `onFile`, `label`, `inputProps`; FileInput: the hidden native input (`ref`, `onFiles`); FileDropZone: `onFiles`, warms while files are held over it | choosing a file; dropping several | | Leads' import tile (t3code drop zone); the Company page's documents |
| `NumberStepper` | `value`, `min`, `max`, `step`, `onChange`, `label`, `fieldLabel`, `inputProps` | a number with a minus and a plus (a daily limit) | a free number field (Input) | first run's daily limit |
| `EditableText` | `size`: `title`, `line`; `empty`; `label` (spoken before it) | a line that is the way to change it (the company card) | a field always open (Input) | the company card's lines |
| `SortButton` | `label`, `direction`: `asc`, `desc`, `null` | a sortable column heading | | t3code `table.tsx` header type; Leads' table |
| `Autocomplete…`, `Command…` | | search-as-you-type, the palette | | t3code |

### Labels, chips and status

| Component | Props and variants | Use it for | Not for | Source |
|---|---|---|---|---|
| `Badge` | `variant`: `default`, `secondary`, `outline`, `success`, `info`, `warning`, `error`, `destructive`, `label`; `size`: `sm`, `default`, `lg`, `control` | a state or a count that cannot be removed | something removable (Chip) | t3code `badge.tsx` |
| `Chip` | `variant`: `filter`, `soft`; `tone` (soft): `neutral`, `sky`, `mint`, `lilac`; `wrap` (a sentence that wraps instead of truncating); `icon`, `onRemove`, `removeLabel` | a filter in force, context on a message | a plain state (Badge) | t3code `ContextChip.tsx`; Leads' filter chips; the chat's context chip |
| `StatusDot`, `StatusSlot` | `tone`: `neutral`, `live`, `attention`, `success`, `danger`, `info`, `idle`; `pulse`, `ping`, `label` | a state at a glance next to its word | the only signal of a state | opencode's dot via Morrow `ui/status-dot.tsx` |
| `StatusLabel` | `tone`; `variant`: `badge` (small medium muted), `caption` (a header's status), `inline` (inherits the line's ink); `animate` (live pulses, attention pings) | a state in a word with its dot | | the Agents window's `StateBadge` |
| `StatusLine`, `StatusLineTone` | `text`, `tone`: `""`, `ok`, `error` (what went wrong, in a calm lemon ink), `stopped` (red: only a send the gate stopped) | a save's result beside its control | a screen-wide message (Notice), a problem (NoticeBar) | Settings' layout |
| `FrameStateChip`, `StateBadge` | `state`, `glass` | the chip on an agent's live frame | | components/agents (re-exported) |

### Working and numbers

| Component | Props and variants | Use it for | Not for | Source |
|---|---|---|---|---|
| `Radar` | `size`: `xs`, `sm`, `md`, `lg`, `xl`, `2xl` (44px), `3xl` (88px), `hero` (112px); `tone`: `current`, `muted`, `live`, `sky`, `inverse`; `plate` (on a raised plate: the style read's); `label` | an agent is working | ordinary loading (Spinner) | opencode `components/spinner.tsx` (Soft Radar) |
| `RadarImage`, `WorkingIndicator`, `ProgressIndicator`, `RadarSpinner`, `usePresence` | RadarImage `size`, `color`; WorkingIndicator `working`, `label` | the radar as one `<img>` in a grid; the radar in a header, collapsing out | | components/agents/RadarImage.tsx; opencode `session-working-indicator.tsx` (re-exported) |
| `Spinner` | `size`: `xs`, `sm`, `md`, `lg`; `tone`: `current`, `muted` | saving, loading a page | agent work (Radar) | t3code `spinner.tsx` |
| `Shimmer`, `TextShimmer`, `ShimmerText` | `text`, `active`, `variant`: `sweep` (opencode), `band` (Zephium) | words still being worked on ("Thinking…") | | opencode `text-shimmer.tsx`; Zephium website `island/shimmer.tsx` via Morrow |
| `ProgressMeter` | `value`, `max`, `inFlight`, `label` (without it the bar is decoration), `valueText`, `tone`: `auto` (sky, then success when met), `sky`, `primary`, `success`, `warning`, `danger`; `size`: `sm`, `md`, `edge` (2px, square-ended, along an agent's frame) | an amount against its whole: a campaign, an agent's work, credits | a step count (StepProgress) | Morrow `pool/pool-meter.tsx`; the campaign meter |
| `StepTrail` | `steps` (`{id, icon, title, detail, state}`), `variant`: `page`, `sky`; `size`: `roomy` (32px wells), `compact` (20px, a card in the chat); `arrive` (rows settle in one after another). With no `state` it explains; with `state` (`done`, `now`, `next`) it's live: done ticks, the step on now lit with a slow ring (still under reduced motion) and `aria-current="step"`, the rest faint; each live title is read with "Done:", "Now:" or "Next:" | the steps a campaign goes through: How Lanes works, the chat's What happens next, Settings' help | where a flow is (StepProgress), an amount (ProgressMeter) | Lanes; the wells SuggestionCard's, the rhythm StepList's |
| `StatTile` | `label`, `value` (a number rolls), `detail`, `size`: `md`, `lg`, `hero`; `variant`: `card`, `plain`, `sky`; `countUp`; children (a meter) | one number that matters | a table cell | Overview's tile on Morrow's card |
| `AnimatedNumber`, `CountUp` | `value`; CountUp `from` | every count that changes / that should count up when it shows | | opencode `animated-number.tsx` |

### Surfaces and the sky

| Component | Props and variants | Use it for | Not for | Source |
|---|---|---|---|---|
| `Card`, `CardButton`, `GlassPanel`, `CardTitle`, `CardDescription` | `variant`: `solid` (raised; the shadow carries its own rim, no `hairline` beside it), `raised` (Zephium's translucent card), `surface`, `inset`, `outline`, `glass`, `sky`, `frost`, `menu`, `attention`, `bare` (no surface: a press inside another card); `radius`: `none`, `row`, `card`, `panel`, `xl`; `padding`: `none`, `sm`, `snug` (p-3.5), `md`, `lg`, `xl`, `responsive` (p-4, p-5 from sm); `ring`: `none`, `attention` (a card that needs the owner); `lift`; `as`. `CardButton`: the card's look on a `<button>` (text from the start, the focus ring) | any surface; a whole card that is one press (an agent's tile, a campaign's totals) | a list of settings (ListSection) | Morrow `ui/card.tsx`; glass from Zephium `material.css` and t3code `surface-glass` |
| `FloatingBar` | `size`: `sm` (Leads), `md` (Company); `dock`: `absolute` (its `relative` parent's foot), `sticky` (the foot of the page it ends), `fixed` (the window's foot, over every screen) | a bar over a screen's foot while something is selected or unsaved; a one-time ask over the window (the analytics consent bar) | | Leads' selection bar, Company's unsaved bar, the consent bar |
| `SkyBackdrop`, `BakedSky`, `Frost` | `placement`: `fill`, `screen`, `hero` (the chat's band, the hero alone), `home` (the chat's main page with its ideas: the whole screen, fading to the page at its foot), `header` (the Agents window); `scene`, `horizon`, `arrive` | the sky behind a screen or a panel | | Morrow `sky/static-sky.tsx` |
| `SuggestionCard`, `SuggestionCardSkeleton`, `SuggestionGrid` | SuggestionCard: `icon` (a lucide element), `title`, `line`, `mark` (a `LogoTile variant="mark"`), `markLabel` (the channel, read with it), `note` (what comes first, at its foot: "Connect X first"), `tone` (the icon's well): `sky`, `lilac`, `peach`, `mint`, `neutral`; `index` (the arrival's stagger); a `<button>`, named by its title, described by its channel and line. Liquid glass on the sky (Zephium's `--sky-card` sheet thinned, a sheen from the top, a lit rim, a highlight under the pointer); lifts on hover and focus, presses to `--press-scale` at once; sideways in a phone's one column. SuggestionCardSkeleton: its shape while loading. SuggestionGrid: `heading` (on the sky) or `label`, `busy`; a list sized by its own width: one column under 30rem, two, three from 42rem (two for exactly four, and a single card takes the whole row) | an idea that is one press: the chat's main page and its Ideas dialog | a choice (ChoiceCards), a card on the page (CardButton) | Lanes; the glass after Zephium `material.css` and Morrow `sky-glass` (`design/morrow/effects.css`), the stagger after the style cards (`choice-cards.css`) |
| `FeatureCard` | `icon` (a lucide element), `title`, `line`, `tone` (the well, SuggestionCard's), `index` (the stagger), `level` (its heading: 2, 3, 4); an `<article>` named by its heading. SuggestionCard's liquid glass with nothing to press: no lift, no pointer highlight, its words never cut short; in a SuggestionGrid, four stand two by two, one under another on a phone | one thing Lanes does, read on the sky: first run's last moment ("Here’s what Lanes does") | anything you press (SuggestionCard) | Lanes; SuggestionCard's glass (`suggestion-card.css`, `data-static`) |
| `LogoTile` | `variant`: `tile`, `plate`, `mark` (the logo alone, 16px, on a card that is already the surface: an idea's channel), `glyph` (12px, a chip's icon); `invertInDark` | a service's mark (Gmail, X) | a person (Avatar) | Connections' ServiceLogo; Zephium onboarding `Essentials.svelte` plate |
| `ChannelLogo`, `CHANNEL_LOGOS` | `service`: `gmail`, `outlook`, `x`, `reddit`, `linkedin`; `variant` (LogoTile's, default `mark`) | a channel named anywhere: Overview's X and Reddit rows, On Reddit, a campaign's Reddit chip | an image of anything else (LogoTile with its own `src`) | Lanes; one map so every screen shows the same mark, X white on dark |
| `SiteLogo`, `siteService` | `site` (a registrable domain: "linkedin.com"), `icon` (the site's favicon URL, when the kernel kept one), `variant` (LogoTile's, default `tile`). A site Lanes knows shows its channel's own logo (ChannelLogo's map); any other its favicon; without one, or if it won't load, a globe | a site the owner signed in to on the Lanes computer (Connections' Sites, the sign-in dialog's quick picks) | a channel named in a sentence (ChannelLogo) | Lanes; LogoTile's look |
| `ComposerSurface`, `ComposerBanner`, `ComposerPrompt` | ComposerSurface `Shell`, `Host`, `Main`, `ContextStrip`; ComposerBanner `Dock`, `Column`, `Attachment`, `Root` (`variant`, `density`), `Row`, `Icon`, `Content`, `Actions`, `Dismiss`, `Scroll`, `Body`; ComposerPrompt: a textarea that grows to 40% of the window | the chat's composer: its glass, what docks above it, the prompt | any other field (Input, Textarea) | t3code `chat/ComposerSurface.tsx`, `chat/ComposerBanner.tsx`, unchanged; the prompt after `ComposerPromptEditorTiptap.tsx` |

### Layout, people and agents

| Component | Props and variants | Use it for | Not for | Source |
|---|---|---|---|---|
| `SectionHeader` | `level`: `page`, `section`, `eyebrow`, `step` (a question inside a step's panel: a small lucide icon in the muted ink, the words in the reading size at 500, `description` as a hint after them: About you's "How will you use Lanes? Pick any"; never inset); `inset`; `title`, `description`, `icon`, `action`, `as` | the heading over a block | a screen's top band (ScreenHeader) | t3code `settings/settingsLayout.tsx` |
| `ListSection`, `ListGroup`, `ListRow` | ListGroup `variant`: `grouped`, `plain`; `divided`. ListRow `variant`: `setting` (title wraps, status a block), `item` (one-line title, a line of dot/word/badges, controls wrap); `hover`; `media`, `title`, `description`, `status`, `control`, children | every settings-like screen | a data table | t3code `settings/settingsLayout.tsx`, `SettingsGroup.tsx` |
| `Avatar` | `name`, `src` (fades in; a failure is silent), `fallback` (letters, or a node: a generic face), `size`: `sm` 28, `md` 32, `lg` 40, `xl` 40 bold; `tone`: `neutral`, `strong`, `hue`; `shape`: `circle`, `squircle`; `status`; `referrerPolicy` | a person or an account | an agent (Face) | Morrow `ui/avatar.tsx`; Leads' PersonAvatar |
| `Face`, `lookFor`, `useAgentFaces` | `look`, `state`, `size` | an agent | a person | components/agents/AgentFace.tsx (re-exported) |
| `PalPortrait`, `PalFace` | PalPortrait: `look`, `expression`, `name` (under it), `label` (spoken), `size`: `hero` (160px), `lg` (120px); `backdrop`: `none` (on the sky already), `sky` (its own patch of sky in a rounded panel). It floats at rest and lands with a spring on a new look, and stands still under reduced motion. PalFace: `look`, `expression`, `width`, `label` (decorative without it) | the owner's pal: Make your pal's live preview (first run, Settings), its thumbnails, the chat's hero | an agent (Face) | Lanes, on the faces of components/agents/faces.ts |
| `PersonRow` | `name`, `detail`, `avatar`, `avatarName`, `trailing`, `size`: `sm`, `md`, `lg`; `nameSlot`, `detailSlot` | a person in a line | | Leads' name cell; Settings' signed-in identity |
| `AccountPicker`, `AccountOption` | `label` (spoken), `accounts` (`{id, title, detail, avatarUrl, badge, disabled, data}`), `value` (the chosen id, or null), `onChange`, `busy` (the id being saved: a spinner for its tick), `disabled`. A radio group: one tab stop, arrows, Home and End move the focus (stepping over a row that can't be picked), Space or Enter picks; the chosen row on `bg-fill` with ChoiceCards' 2px ring and a tick; a missing or failing picture leaves a generic face | which account: the X accounts signed in to the owner's browser (first run's X step, Settings > X, Connections) | a choice of options that aren't accounts (ChoiceCards, Segmented) | Lanes: PersonRow's lockup in ChoiceCards' radio group |
| `AgentTile` | `id`, `width`, `height`, `look`, `onOpen` (reads the Agents store) | one agent in the grid | | components/agents/AgentTile.tsx (re-exported) |
| `LiveView`, `pagePoint`, `keyInput` | `src` (the frame now, an object URL), `viewport` (the page's own CSS size: the frame's shape, and what a pointer maps to), `state`: `loading`, `live`, `stale` (the picture dims and says so), `paused` (held back on purpose: the owner is signing in there, so a watcher sees nothing; dims, no spinner), `closed`; `mode`: `control` (the owner works the page), `view` (view only: no input reaches the page, no keyboard, a "View only" badge); `status` (the words over the frame while not live, on the sky's glass), `label` (spoken), `onInput` (`down`/`up`/`wheel` at page pixels, `text` for anything printable and pastes, `key` for Enter, Tab, Backspace and the arrows; never called in `view`), `keyboard`: `auto` (a coarse pointer), `always`, `never` (a masked field and Send, Tab, Delete, Enter for a phone, emptied the moment it sends), `disabled`. Nothing typed is kept | a page in a browser somewhere else, live: signing in to a site on the Lanes computer (`control`), watching agents at a site's desk (`view`) | an agent's frame in the grid (AgentTile) | Lanes; the frame's states after the Agents window's enlarged agent |
| `Sidebar…` | | the shell's sidebar | | t3code `sidebar.tsx` |

### Instead of content, and after

| Component | Props and variants | Use it for | Not for | Source |
|---|---|---|---|---|
| `EmptyState`, `Empty…` | `icon`, `title`, `description`, `action`; `size`: `compact`, `default`, `hero`; `media`: `icon`, `plain`; `arrive` | nothing here yet, not connected, not available, a failed first read | a section waiting (LoadingState) | Morrow `ui/empty-state.tsx` API on t3code `empty.tsx` |
| `LoadingState`, `Skeleton` | `variant`: `rows`, `stats`, `cards`, `lines`, `agents` (a grid of agent tiles), `inline`; `count`; `label`; `slowAfterMs` (5000: "Still loading…" under the shape after it; `false` never). Skeleton `shape`: `block`, `card`, `pill` | a first read | agent work (Radar) | t3code `skeleton.tsx`, laid out as Settings, Overview and the Agents window did |
| `Notice`, `useNotice` | `notice` (`{text, tone, id}`), `onDismiss`; `useNotice(ttl)` returns `{notice, say, clear}` | what just happened, under a toolbar | a save beside its control (StatusLine); something wrong that stays (NoticeBar) | Leads' Notice on t3code `alert.tsx` |
| `StatusNote` | children (a few words); `tone`: `neutral` (a dot), `working` (a spinner), `done` (a tick); `icon`; `resolved` ("Back to normal.", then it fades). `role="status"`, polite | a **quiet** problem, on the thing it's about: "Reconnecting…", "Paused: today’s limit is used", "Still loading…" | anything the owner must act on | new (`ui/problem.tsx`), docs/problems.md |
| `NoticeBar` | `title`, `doing`, `ask`, `action` (at most one small Button), `details` (behind "Details", with Copy details), `resolved`. Polite | a **notice**: degraded, nothing to do yet, on the screen it affects; it clears itself | a toast, a modal, something that blocks work (ProblemCard) | new (`ui/problem.tsx`) |
| `ProblemCard` | `title`, `doing`, `ask`, `actionLabel` + `onAction` (exactly one), `actionIcon`, `actionBusy`, `eyebrow` ("Needs you"), `details`, `tone`: `attention` (lemon), `stopped` (red, a stopped send only); `resolved`. `role="alert"`, assertive | **needs you**: work waits until the owner acts. In the chat for campaigns, on Connections or Settings for theirs | a question a campaign asks (the chat's question card is that) | new; the lemon wash, its border all round and the header's icon are `components/chat/EscalationCard.tsx`'s |
| `ScreenError` | `title`, `doing`, `ask` (the catalog's `screen.crashed` by default), `onRetry`, `details` (Copy details), `size` | **broken**: a screen crashed (`components/problems/ScreenBoundary.tsx` draws it) | a read that failed (EmptyState + Try again) | new, on t3code `empty.tsx` |
| `ProblemDetails`, `CopyDetailsButton` | `details` / `text` | the technical part of a problem, closed by default | words for the owner | new |
| `Alert…` | `variant`: `default`, `info`, `success`, `warning`, `error`, `sidebar`, `note` (a step's quiet note), `note-danger` (what went wrong in a step), `bare` (inside a box already) | a lasting message in a panel or dialog, a note in a step | | t3code `alert.tsx`; the notes after Morrow's Alert |

### Motion

| Component | Props | Use it for | Rule | Source |
|---|---|---|---|---|
| `pressable` (a class) | | a press: 0.97 at once on pointer-down, eased back over `--motion-press` (already on Button, IconButton, SortButton, Chip's remove, Segmented, CardButton, FilePicker; SuggestionCard and StepButton press in their own CSS on the same token) | 4, 14 | `design/motion/motion.css` |
| `Stagger`, `staggerStyle` | `as`, `step`: `list` (30ms), `settle` (60ms, a thing's details); `delay` (a token). `staggerStyle(i)` puts `--i` on a row that maps itself, with `motion-enter` on it and `motion-stagger` on its list | a list or a card's details arriving | 3, 6 | Lanes |
| `Crossfade` | one keyed child | an icon becoming another (copy to check) | 18 | Lanes |
| `Swap` | `value`, `direction`: `up`, `down` | a label, a status, a number replacing another in place (StatusLine, StatusLabel and the campaign card already do) | 16 | Lanes |
| `usePulse`, `Pulse` | `usePulse()` gives `{ fire, props }`; `Pulse` `when` | a success the owner was waiting on: saved, sent, copied, done | 8 | Lanes |
| `Reveal` | `open`, `from`: `top`, `bottom`, `left`, `right`, `center` | content revealed in place, wiped in with a clip | 17 | Lanes |
| `SharedLayout`, `SegmentThumb`, `sharedTransition` | SharedLayout `id`, `layoutKey`; SegmentThumb `group` (the chosen tab's capsule, sliding; with Button `variant="tab"`); `sharedTransition(update)` (View Transitions) | one element across states: a pill between tabs, a card into its dialog | 20, 7, 9 | Lanes (no `motion` dependency: a FLIP keyed by id) |
| `useTriggerOrigin` | `trigger?` (a ref) | a surface Base UI doesn't anchor growing from what opened it (DialogPopup, AlertDialogPopup, CommandDialogPopup and AppRouteModal already do) | 11, 12 | Lanes |
| `useRubberBand`, `rubberBand`, `rubberClamp` | `min`, `max`, `axis`, `reach` | a drag that resists past its ends (the sidebar's resize already does) | 19 | Apple's curve |
| `useKnobTravel` | `value` | a `motion-knob` stretching as it crosses (Switch already does) | 5 | Lanes |

### Over the page

| Component | Use it for | Source |
|---|---|---|
| `Dialog…`, `AlertDialog…` | a task or a question that needs an answer. `DialogPopup variant`: `default`, `media`, `sky` (the sky behind the whole popup, its title and description in the sky's ink, the close on the sky's veil: the chat's Ideas; give its `DialogPanel` `scrollFade={false}`, as a mask on the scroller hides the sky from glass inside it) | t3code `dialog.tsx`, `alert-dialog.tsx` (Base UI); `sky` is Lanes' |
| `Sheet…` | a side panel (a person) | t3code `sheet.tsx` |
| `Menu…` | actions and choices from a trigger | t3code `menu.tsx` |
| `Tooltip…`, `TooltipProvider` | a word for a control (IconButton already has one); it grows from its trigger (`motion-tooltip`: in 150ms from 0.95, out 120ms) and opens on Base UI's own delay | t3code `tooltip.tsx`, opencode `tooltip.css` |
| `AppRouteModal`, `AppRouteModalClose` | `label`, `onClosed`: a large modal over the page that opened it; Esc, its close button or a press on the backdrop closes it (Settings) | t3code `AppRouteModal.tsx` |
| `toastManager`, `ToastProvider`, `AnchoredToastProvider`, `anchoredToastManager`, `stackedThreadToast` | a word about what just happened, at the top right: `toastManager.add({ title: "Appearance: Light", timeout: 1500 })`; `type` (`success`, `error`…), `description`, `actionProps`. Mounted once, in the shell | t3code `toast.tsx`, `toast.logic.ts`, `toastHelpers.ts` |
| `MorphIcon` | `icon` (a vanilla `lucide` icon node), `strokeWidth`: one icon turning into another (the sidebar toggle) | t3code `MorphIcon.tsx` on `morphicons` |
| `Collapsible…`, `ScrollArea`, `Separator` | | t3code |

### Guided flows

| Component | Props | Use it for | Source |
|---|---|---|---|
| `StepStage` | `step`, `horizon`, `leaving`, `top`, `bar` | the whole window on the sky: the top row, the steps scrolling above the bar | Morrow `auth/sky-stage.tsx` on Zephium `Onboarding.svelte`'s stage |
| `StepWelcome` | `name`, `nameRef`, `airRef`, `phase`, `tagline`, `gate`, `action` | the door: the name formed at Zephium's size and weight, then its words | Zephium `Onboarding.svelte` (welcome) |
| `StepShell` | `title`, `description`, `aside`, `headingRef`, `step`, `width`: `default` (600px), `medium` (800px: three short answers a row, About you), `wide` (1080px); `surface`: `glass` (the scene in one frosted panel), `none` (the scene on the sky as it is, for cards that are glass themselves) | a step: the heading on the sky (40px at 500, at 250 and 360ms), the scene in frosted glass (420ms) | Zephium `Onboarding.svelte` via Morrow `onboarding/step-chrome.tsx` |
| `StepShellBar`, `StepProgress` | `at`, `of`, `onBack`, `notice`, `actions` or `slotRef` | the one bar at the foot, the window's width: Back as a word, the dashes, the actions | same |
| `StepActionSlot`, `StepActions` | | a step's actions, rendered into the bar from anywhere in the step | same |
| `StepShellFeatures` | `items` (`{icon, label}`) | the ready step's line of what is on | same |
| `StepButton` | `variant`: `primary`, `ghost`, `secondary`; `size`: `large`, `regular`; `shape`; `tone`: `default`, `sky` (the welcome's white); `pending`; `kbd` | Zephium's control on a guided flow (`.ui-button`, design/zephium/controls.css) | Zephium `Button.svelte` |
| `StepPrimaryAction`, `StepSecondaryAction` | StepButton's; primary has `loading` | the step's one primary (Enter presses it, ↵), and a second action as a plain word | same |
| `StepTopAction` | | a quiet word in the top row: "Skip setup" | Zephium `Onboarding.svelte` `.skip` |
| `StepList`, `StepListRow` | `index`, `media` or `icon`, `title`, `detail`, `quiet`, `done`, `trailing` | a step's list: an account, a limit, what is set up | Zephium `Essentials.svelte` rows, `Models.svelte` tile |
| `createIntroSound`, `startIntro`, `INTRO_SOUND_SRC` | | the one sound: Zephium's intro, at full volume, tried on reveal; `startIntro` says when the browser wants a click first | Morrow `onboarding/sound.ts`; Zephium `intro_sound.rs` |

## Inventory

Every visual building block in `app/ui/src` (2026-11-03), the kit component
that is it, and where it is still drawn by hand. Line numbers are as of this
pass; the Migration list below is the work order.

| Building block | Kit component | Shared use today | Still hand-rolled at |
|---|---|---|---|
| Buttons | `Button`, `CardButton` | every screen; the composer's send and stop, What's new's tabs, an agent's tile, a campaign's totals and its chat card | |
| Icon buttons | `IconButton` | Connections, the chat's header, find bar and attach, the Agents window's header and inspector, the sidebar's open-window button | Tooltip + Button by hand, still: `components/chat/DictationControls.tsx` (the microphone: its tooltip says why it is off), `components/chat/ChatMarkdown.tsx:138` (copy, t3code's) |
| Inputs and textareas | `Input`, `Textarea`, `FilePicker`, `ComposerPrompt` | Leads, Settings, Company, the composer and its attach search | |
| Choice controls | `Segmented`, `ChoiceSelect`, `ChoiceCards` | Settings (Appearance, Notifications), first run and Settings' writing style | |
| Cards | `Card`, `CardButton` | Overview's tiles and campaign cards, the Agents window's tiles and totals, Settings | `components/chat/CampaignCard.tsx` (t3code's card language, a bordered card; its press is a CardButton); `components/agents/AgentInspector.tsx` (the enlarged frame's box) |
| Glass panels | `Card variant="glass"/"sky"/"menu"`, `GlassPanel` | the Agents window's campaign totals | |
| Floating bars | `FloatingBar` | Leads' selection bar, Company's unsaved bar | |
| The sky | `SkyBackdrop` | the chat's hero and main page, the Agents window's header, first run | |
| Ideas | `SuggestionCard`, `SuggestionGrid` | the chat's main page and its Ideas dialog (`components/chat/ChatSuggestions.tsx`) | |
| Badges | `Badge` | Connections, Leads, Settings | |
| Pills and chips | `Chip` | Leads' filters, the chat's context chips | Leads' Filters count pill `components/leads/LeadsToolbar.tsx:215` |
| Status dots | `StatusDot`, `StatusLabel` | Connections, Overview header, Agents | dot + word by hand: `components/company/CompanyPage.tsx:113`, `:120`, `:264`; a 6px dot `components/leads/LeadsTable.tsx:76` (email confidence); `components/agents/StateBadge.tsx` (is StatusLabel) |
| The radar | `Radar`, `RadarImage`, `WorkingIndicator` | Agents, chat header (before the title), Company's site read | `ProgressIndicator` (opencode's 16px activity spinner, kit-exported) direct: `components/chat/CampaignCard.tsx:31`, `:39`; `components/chat/DictationControls.tsx:51` |
| Shimmer | `Shimmer`, `ShimmerText` | the chat's "Thinking…", dictation's status, the Agents window's working badge | |
| Keyboard hints | `ShortcutHint`, `Kbd` | sidebar jump hints, palette, first run | `components/shell/CommandPaletteContent.tsx:72-94` (static keys, fine as `Kbd`) |
| Section headers | `SectionHeader` | Settings, Connections, Leads' drawer | Settings' nav group headings `screens/settings/SettingsSidebarNav.tsx` (t3code's, `aria-hidden` labels of a group) |
| List rows | `ListSection`, `ListGroup`, `ListRow` | Connections, Settings, Company (through `components/connections/SettingsLayout.tsx`) | Leads' do-not-contact list `components/leads/LeadDialogs.tsx:424-450`; Plan's plan cards `screens/settings/sections/PlanSettings.tsx:234-275`; credit history rows `PlanSettings.tsx:506` |
| Stat tiles | `StatTile` | Overview | Plan's credit figure `screens/settings/sections/PlanSettings.tsx:74-83` (`variant="plain" size="lg"`); `components/agents/CampaignTotals.tsx` FleetHero (its detail sits under the number, which StatTile's `sky` does not do yet; on `text-figure` and `sky-veil-glow-firm`) |
| Progress meters | `ProgressMeter` | Overview, the Agents window (totals, groups, tiles' frame foot, the inspector), Plan's credits, Sending | |
| Empty states | `EmptyState` | Connections, Leads, Company, Overview, the Agents window | |
| Loading states | `LoadingState`, `Skeleton` | Settings, Overview, Leads' drawer, the Agents window | `screens/company/CompanyScreen.tsx:158-159`; `components/chat/CampaignCard.tsx:118-120` (Skeletons laid out by hand) |
| Dialogs, sheets, menus, tooltips | `Dialog…`, `AlertDialog…`, `Sheet…`, `Menu…`, `Tooltip…`, `AppRouteModal` | everywhere; "Clear the chat?" is an AlertDialog; Settings is an AppRouteModal | |
| Toasts | `toastManager` (t3code's toasts), `Notice`, `useNotice` | the appearance key; Leads, Company | |
| Avatars | `Avatar`, `AccountPicker` | Leads, Connections, Settings; the X account picker | |
| Agent faces | `Face` | Agents window, Overview | |
| The agent tile | `AgentTile` | Agents window | |
| A person row | `PersonRow` | Leads table, Settings' identity | Leads' drawer header `components/leads/LeadDrawer.tsx:145-154` (Sheet title inside) |
| Onboarding step chrome | `StepStage`, `StepWelcome`, `StepShell`, `StepShellBar`, `StepButton`, `StepList` | first run | |
| Count up | `CountUp` | catalog | |
| Logos | `LogoTile` | Connections, first run's plates, the chat's ideas (`mark`) | |
| Sounds | `createIntroSound`, `startIntro` (`components/ui/sound.ts`) | first run's welcome | |

## Migration

### Done in this pass

Connections, Leads/People, Settings (all but Your writing style) and
Overview's body now draw only from the kit:

- Connections: `SettingsLayout.tsx` is the kit's ListSection/ListRow (`item`),
  `ScreenStates.tsx` is EmptyState, Refresh and Add are IconButtons, logos are
  LogoTiles, account avatars are Avatars, statuses are StatusLabels.
- Leads: names are PersonRows over the kit Avatar, sort headings are
  SortButtons, filter chips are Chips, the import file is a FilePicker, fields
  are Fields, the drawer's headings are SectionHeaders and its waiting is a
  LoadingState, the selection bar is a FloatingBar, the notice is the kit's.
- Settings: `layout.tsx` is the kit's ListSection/ListRow (`setting`),
  LoadingState and StatusLine; `controls.tsx` re-exports Segmented and
  ChoiceSelect; Appearance's theme cards are ChoiceCards with ThemePreview;
  the section head is a SectionHeader; the identity is a PersonRow; the credit
  and sending bars are ProgressMeters.
- Overview's body: StatTiles, LoadingState, EmptyState, the header's
  StatusLabel. (Its campaign rows are untouched.)

Before/after screenshots of every state these screens have (light, dark,
desktop, narrow) match pixel for pixel, with two deliberate exceptions:

- Settings' section headings with a description sit 2px further from it: the
  two copies of t3code's settings layout (Connections' and Settings') differed
  by `space-y-0.5`; the kit keeps Connections' (the copy with t3code's icon
  slot), so they are one again.
- Leads' open row now shows its 2px marker in the lit ink down its leading
  edge: the hand-rolled `shadow-[inset_2px_0_0_var(--color-primary)]` never
  drew, the kit-safe `before:` bar does.

### First run, the writing style and the company study

First run (`screens/onboarding/**`), the writing style (`components/style/**`)
and the company study (`components/company/**`) draw only from the kit: no
offender left in the baseline.

- First run's chrome is the kit's `step-shell.tsx`, on Zephium's own values:
  StepStage (the window on the sky), StepWelcome, StepShell, StepShellBar,
  StepButton (`.ui-button`), StepList; KeyHint is ShortcutHint; the radars
  are Radar; the fields are Input and Textarea (`shine`) in a `step` Field;
  the notes are Alert (`note`, `note-danger`); the plates are LogoTile; the
  daily limit is NumberStepper; the sound is `components/ui/sound.ts`.
- The writing style's cards and chips are ChoiceCards (`sample`, `chips`);
  its editor's fields are Textarea and Input (`bare`); its panels are Card
  (`raised`, `solid`); its notice is Alert.
- The company study's fields are Field, Input and Textarea; its lines at rest
  are EditableText; its radar is Radar (`hero`, `3xl`); the documents are
  FileInput, FileDropZone and InlineButton. The Company page's unsaved bar
  is FloatingBar (`size="md" dock="sticky"`), its read status a StatusLabel,
  its sections ListSection and ListRow, all from `~/components/ui`.
- Card `solid` and `glass` lost the `hairline` beside `shadow-raised`
  (docs/design-audit/morrow.md #5): the raised shadow carries its own rim.

### The shell, the chat, the Agents window and Overview

They draw only from the kit now, and the baseline is empty:

- The shell: the titlebar geometry is named in `design/lanes.css` (`h-topbar`,
  `top-controls-y`, `ml-controls-x-inner`, `pl-titlebar-content`,
  `max-h-palette`); the sidebar's open-window button is an IconButton with
  `hover-reveal`; its search, New chat and footer row are the kit's sidebar
  pieces; Settings is AppRouteModal; the
  appearance key raises a toast.
- The chat: the composer is ComposerSurface, ComposerBanner and
  ComposerPrompt with Button `send`/`stop` (`shape="circle"`); the header's
  and the find bar's buttons are IconButtons; context chips are Chip
  (`soft`); the attach search is Input; "Clear the chat?" is AlertDialog;
  the sky band is SkyBackdrop (`hero`); the shimmers are Shimmer; the hero's
  type and glow are `text-hero`, `text-lede` and `sky-veil-glow`.
- The Agents window: tiles are CardButton with a ProgressMeter (`edge`) on
  the frame's foot; CampaignTotals is a glass Card with a CardButton press;
  StateBadge is StatusLabel with the working word in ShimmerText; the agents'
  own ProgressMeter is gone for the kit's; the header band is SkyBackdrop
  (`header`), its actions IconButtons, the first read LoadingState
  (`agents`), what it says instead of the grid EmptyState; the faces' paints
  and the tile radar's ink are named in `design/agents.ts`.
- Overview: campaign rows are Card (`responsive`, `ring="attention"`), "Needs
  you" a Card (`attention`), the meters ProgressMeter.
- What's new's tabs are Button (`segment`); the sidebar's campaign rows are
  links on SidebarMenuSubButton.

### Next pass

What is left is not hand-rolled by the kit test's rules, but is still not
the kit's own component, file:line → kit component:

**The Company screen (`screens/company/**`)**
- `CompanyScreen.tsx:158-159` (two skeletons by hand) → `LoadingState` (a variant for the company page's two blocks).

**The chat**
- `components/chat/CampaignCard.tsx:31`, `:39` → `Radar`; `:118-120` → `LoadingState`.
- `components/chat/DictationControls.tsx` (the microphone) and `ChatMarkdown.tsx:138` (copy) → `IconButton` once it takes a tooltip that differs from its label.
- `components/chat/MessageCopyButton.tsx` → `MorphIcon` for its copy-to-check (t3code's own copy buttons morph).

**The Agents window**
- `components/agents/CampaignTotals.tsx` FleetHero → `StatTile variant="sky" size="hero"` once StatTile can put its detail under the number.
- `components/agents/StateBadge.tsx` `FrameStateChip` → a `Badge variant="overlay"` (the chip on a live frame).
