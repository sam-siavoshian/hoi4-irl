# Motion

How everything in Lanes moves: the window (`app/ui`), the site (`site/`), and
the emails (`server/email_design/`, which do not move at all). Twenty rules,
one set of tokens, and a handful of primitives that carry them, so a
component never picks its own numbers.

| File | What |
|---|---|
| `tokens.css` | every duration, curve, scale and distance, and what each becomes under reduced motion. The one source: the site's `site/app/motion-tokens.css` is a copy of it (`scripts/sync_site_motion.py`), and `tests/test_site_motion_matches_app.py` fails when they part |
| `motion.css` | the primitives as classes: `pressable`, `motion-enter`/`-exit`, the surfaces (`motion-tooltip`, `-dropdown`, `-popover`, `-dialog`, `-sheet`, `-backdrop`), `motion-stagger`/`-settle`, `motion-knob`, `motion-pulse`, `motion-crossfade`, `motion-swap`, `motion-reveal`, `motion-sweep`, `motion-segments` (a track a pill slides in), and the keyframes they run |
| `motion.ts` | the same values for script: `motionMs()`, `rubberBand()`/`rubberClamp()` and their inverses, `arcKeyframes()`, `flip()`, `continueTo()` (an animation that starts from where the element is), the layer, reveal and knob motions, `prefersReducedMotion()` |
| `../../components/ui/motion.tsx` | the React side: `Stagger`, `Crossfade`, `Swap`, `Pulse`/`usePulse`, `Reveal`, `SharedLayout`, `useTriggerOrigin`, `useRubberBand`, `useKnob`, `sharedTransition` |
| `../../components/ui/motion.test.ts` | the enforcement (below) |
| `QA.md` | every defect the motion pipeline has caught, what fixed it and the test that holds it, and how to run each of the pipeline's six layers |

**Interruptions continue.** Everything that can be changed again while it
moves (a crossfade, a swap, a reveal, a knob, a pill or anything else
`SharedLayout` flies) is a Web Animation that starts from the element's
current computed values (`continueTo`, `flip`), so a second click mid-flight
turns it round where it is instead of restarting it, a parent's re-render
or StrictMode's second effect leaves it alone, and the last frame is the
resting state exactly. A CSS keyframe cannot do that: it starts from its
`from` every time.

The catalog shows every rule live, with its number and tokens:
`npm --prefix app run dev`, then `http://127.0.0.1:1420/kit.html#motion`
(the toolbar's Motion switch shows each one reduced).

## The idea in one paragraph

Motion in Lanes says *where something came from and where it went*, and it
gets out of the way. Things that arrive decelerate (ease-out) so they land
softly; things that travel on screen accelerate and decelerate (ease-in-out)
so the move reads as one gesture; things that leave are quicker than they
came, because nobody waits for a goodbye. A press answers in the same frame.
Nothing bounces unless the moment is meant to be play. Under reduced motion
nothing travels, scales, stretches or bounces: what is left is opacity, short.

## Tokens

All on `:root` in `tokens.css`. Durations are named by what they are for, not
by how long they are. `-exit` durations are always `calc(<enter> * 0.8)`.

| Token | Value | Rule | For |
|---|---|---|---|
| `--motion-instant` | 70ms | | a state the pointer is on: a hover fill |
| `--motion-fast` | 120ms | | colour, a border, an opacity on hover (Tailwind's default `transition-*` duration) |
| `--motion-base` | 200ms | | a small thing changing shape |
| `--motion-slow` | 300ms | | |
| `--motion-page` | 400ms | | a page arriving, a meter filling |
| `--motion-press` | 160ms | 4, 14 | the release of a press (the press itself is 0ms) |
| `--motion-tooltip` / `-exit` | 150ms / 120ms | 2, 15 | a tooltip |
| `--motion-dropdown` / `-exit` | 200ms / 160ms | 2, 15 | a menu, a select, an autocomplete list |
| `--motion-popover` / `-exit` | 220ms / 176ms | 10, 15 | a popover, a card over the page |
| `--motion-enter` / `--motion-exit` | 260ms / 208ms | 1, 15 | anything arriving and leaving: a row, a dialog, a toast, a banner |
| `--motion-sheet` / `-exit` | 320ms / 256ms | 1, 15 | a side panel |
| `--motion-move` | 300ms | 9 | something already on screen going somewhere else |
| `--motion-knob` | 220ms | 5, 9 | a switch's thumb, a slider's knob |
| `--motion-crossfade` | 180ms | 18 | one icon becoming another |
| `--motion-swap` | 220ms | 16 | a label, a status, a number becoming another |
| `--motion-reveal` / `-exit` | 360ms / 288ms | 17 | a clip or mask wipe |
| `--motion-pulse` | 560ms | 8 | the confirmation of a success |
| `--motion-arc` | 460ms | 7 | an object flying between two places |
| `--motion-spring-back` | 380ms | 19 | a dragged edge returning inside its bounds |
| `--motion-stagger` | 30ms | 3 | the step between rows of a list |
| `--motion-settle-stagger` | 60ms | 6 | the step between the details inside one thing |
| `--motion-stagger-cap` | 12 | 3 | rows past this many arrive together |
| `--motion-roll` | 560ms | 16 | a number's digits rolling to their new place (`AnimatedNumber`) |
| `--motion-linger` | 4000ms | | what stays to be read before it fades ("Back to normal.") |
| `--motion-reduced` | 140ms | all | the opacity fade that is left under reduced motion |
| `--motion-rise`, `--motion-rise-after`, `--motion-stage`, `--motion-stage-short`, `--motion-horizon` | 720, 640, 900, 600, 1400ms | 1 | a whole page or first run's stage arriving (Zephium's choreography) |
| `--motion-rise-delay`, `--motion-rise-after-delay`, `--motion-stage-delay` | 40, 120, 250ms | 6 | where in that choreography a part comes in |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | 1 | every entrance; hover and colour |
| `--ease-emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` | 1 | a large surface arriving (a page, a stage): ease-out, steeper |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | 9 | every move on screen, the knob, the arc, a shared element |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | 12, 15 | every exit: it leaves without lingering |
| `--ease-spring-playful` | a `linear()` spring, 8% over | 13 | **playful moments only** (the pal landing). Never everyday UI |
| `--ease-press`, `--ease-smooth`, `--ease-snap`, `--ease-spring` | Zephium's | | kept so older names resolve; new code uses the four above. `--ease-snap`/`--ease-spring` count as springs (rule 13) |
| `--press-scale` | 0.97 | 4 | a press |
| `--popover-start-scale` | 0.95 | 10 | where a popover, menu, tooltip or dialog starts and ends |
| `--knob-stretch` | 1.12 | 5 | a knob's length mid-move |
| `--enter-distance` | 6px | 1 | how far a row or banner rises as it arrives |
| `--settle-distance` | 4px | 6 | how far a detail rises as it settles |
| `--sheet-distance` | 2rem | 1 | how far a sheet slides |
| `--crossfade-scale`, `--crossfade-blur` | 0.7, 2px | 18 | an icon leaving and arriving |
| `--swap-distance` | 40% | 16 | how far a swapped label travels (of its own height) |
| `--pulse-scale`, `--pulse-ring` | 1.04, 6px | 8 | the confirmation's swell and ring |
| `--arc-lift` | 0.2 | 7 | how far an arc bows, as a share of the distance |
| `--rubber-band` | 0.55 | 19 | the resistance past an end (Apple's constant) |
| `--motion-travel` | 1 | all | multiplies every distance; 0 under reduced motion |

## Reduced motion

`data-motion="reduce"` on `<html>` (the OS setting, or Settings > Appearance >
Animation, `design/theme.ts`) and `prefers-reduced-motion: reduce` both:

- **stop**: travel (`--motion-travel: 0`, every distance is 0), scale
  (`--press-scale`, `--popover-start-scale`, `--crossfade-scale`,
  `--pulse-scale` are 1), stretch (`--knob-stretch: 1`), blur, arcs
  (`--arc-lift: 0`, and `flip()` jumps), bounce (springs are never reached),
  rubber banding (`rubberBand()` clamps), staggers (`--motion-stagger: 0ms`),
  ambient loops (`zephium/motion.css` collapses every other animation and
  transition to a frame).
- **stays**: opacity. Every primitive in `motion.css` keeps its fade at
  `--motion-reduced` (140ms): a menu still fades in, an icon still
  crossfades, a toast still fades, a success still shows its ring (still, not
  growing), a reveal becomes a fade. Nothing that carries meaning is lost.

Each rule below says what it does reduced.

## The twenty rules

### 1. Ease-out for entrances

- **Means**: anything appearing (a row, a banner, a page, a toast) starts fast
  and decelerates into place.
- **Why**: the eye catches the start of a motion; an ease-out puts the
  movement there and lands softly, so the thing feels already arrived. Ease-in
  on an entrance feels sluggish, linear feels mechanical.
- **When**: every entrance and every hover or colour change. **Not**: a
  move on screen (rule 9), an exit (rule 15), an ambient loop (linear or
  stepped).
- **Tokens**: `--ease-out` (`ease-out` in Tailwind), `--ease-emphasized` for a
  page or stage, `--motion-enter`, `--enter-distance`.
- **In Lanes**: a message arriving in the chat (`MessagesTimeline`: what was
  there when the thread opened stands still), the composer's banners and
  attachments, the scroll-to-end button, Overview's campaigns, a filter chip,
  a notice; `animate-settle`/`animate-rise` on pages and the chat's hero;
  every popup's opening; the site's reveals and nav menus.
- **Reduced**: a fade, no rise.

### 2. Dropdowns at 150–250ms

- **Means**: a menu, select or list that drops from a control opens in 200ms
  (a tooltip in 150ms, a popover in 220ms). Faster than 150 reads as a flash,
  slower than 250 as a wait.
- **Why**: a dropdown answers a click; it has to feel like the click did it.
- **When**: every Base UI popup anchored to a trigger. **Not**: dialogs and
  sheets (260–320ms: bigger, further).
- **Tokens**: `--motion-dropdown`, `--motion-tooltip`, `--motion-popover`
  and their `-exit`s; the classes `motion-dropdown`, `motion-tooltip`,
  `motion-popover`.
- **In Lanes**: `MenuPopup`, `SelectPopup` (and `ChoiceSelect`),
  `AutocompletePopup`, `TooltipPopup`; the site's nav menus.
- **Reduced**: the same fade, 140ms, no scale.

### 3. Stagger list rows by 30ms

- **Means**: rows that arrive together come in one after another, 30ms apart,
  the twelfth and later all at once.
- **Why**: a list that appears in one frame is a wall; 30ms is below the
  threshold of "waiting" but enough for the eye to read a direction.
- **When**: a list's first arrival (What's new, Leads, a person's activity,
  the plan's ladder, a step's list). **Not**: rows added one at a time later
  (they enter on their own), a list re-sorted (rule 20 moves them), long
  virtualized lists (only the first screen staggers; the cap does it).
- **Tokens**: `--motion-stagger`, `--motion-stagger-cap`, `--motion-enter`.
  `<Stagger>` sets `--i` on each child; `motion-stagger` on the parent and
  `motion-enter` on the rows read it.
- **In Lanes**: What's new's notes, a person's activity (`LeadDrawer`), the
  plans (`PlanSettings`), Overview's tiles and then its campaigns, `StepList`
  rows, `StepTrail` rows, `SuggestionGrid` cards. **Not** the Agents window's
  tiles: the grid is virtualized, and tiles mounting on scroll must not
  replay an entrance (and cost the frame time `agents-perf` measures).
- **Reduced**: every row fades in at once.

### 4. Scale to 0.97 on press

- **Means**: a button, chip, card or segment you press shrinks to 97%.
- **Why**: it is the physical answer to a press: the thing gives under the
  finger, so the press is felt before anything else happens.
- **When**: everything pressable and compact: buttons, icon buttons, chips'
  remove buttons, segments, cards that are one press, sort buttons, the
  StepButton. **Not**: a full-width row or a menu item (0.97 of 600px moves
  its edges by 9px: rows answer with their fill), a button that opens a menu
  from where it sits (`aria-haspopup`: the menu is anchored to it), anything
  disabled.
- **Tokens**: `--press-scale`; the class `pressable`.
- **In Lanes**: `Button` (every variant), `IconButton`, `SortButton`,
  `Segmented`, `CardButton` (not `variant="bare"`, a press inside a card that
  stays still), `SuggestionCard`, `Chip`'s remove, `FilePicker`, Zephium's
  `.ui-button` and `.ui-shine-press` (`StepButton`), first run's top action,
  `ChoiceCards`' tiles, cards, chips, thumbs and swatches;
  the site's `.btn-primary`, `.btn-secondary` and start cards. **Not**:
  `AccountPicker` rows, menu items, sidebar rows (full width).
- **Reduced**: no scale (`--press-scale: 1`); the fill still changes.

### 5. Stretch moving knobs 12%

- **Means**: a switch's thumb, or a slider's knob, gets about 12% longer along
  the way it travels at the middle of its move, and is round again when it
  lands.
- **Why**: a solid that moves fast smears a little; the stretch makes the
  knob read as pulled across rather than teleported, and says which way it
  went.
- **When**: a knob or thumb travelling along its track on a change.
  **Not**: while it is held still under the finger (rule 14), a knob dragged
  1:1 by the pointer.
- **Tokens**: `--knob-stretch`, `--motion-knob`, `--ease-in-out`; the class
  `motion-knob` (the crossing, a transition) and `useKnob(value)` on its ref
  (the stretch, a Web Animation that carries on from the width it has when
  the knob is flipped again mid-move; kit `Switch` does it).
- **In Lanes**: `Switch` (every settings toggle, the menu's checkbox switch).
- **Reduced**: no stretch, no travel: the knob is where it should be.

### 6. Stagger as details settle

- **Means**: inside one thing that arrives (a card, a dialog, a page header),
  its parts come after it, 60ms apart: the frame, then the title, then the
  details, then the actions.
- **Why**: the container says "something is here", the details say "this is
  what". Arriving together they compete; settling in order they read in order.
- **When**: a card or dialog whose contents matter in order: the deal-line
  card, the campaign card's counters, a step's heading and its scene, the
  done card. **Not**: controls the owner is about to use (they must be there
  at once), anything shown again on every render.
- **Tokens**: `--motion-settle-stagger`, `--settle-distance`; `<Stagger
  step="settle">` (or `motion-settle` on the parent, `motion-enter` on the
  parts).
- **In Lanes**: a new message in the chat (the message, then its campaign
  card, then what happens next), `CampaignCard`'s rows, the chat's hero
  (title, then lede), `StepShell` (the heading at `--motion-stage-delay`, its
  line and scene after it, the ready step's features).
- **Reduced**: all at once, a fade.

### 7. Arcs for object movement

- **Means**: an object that flies between two places that differ in both x
  and y follows a curve, bowing upward (up first when it rises, across first
  when it falls), not a straight diagonal. The bow leans toward the upper
  corner of the box the two places span and never leaves that box, so a
  thing arcing between two corners of a card stays inside the card.
- **Why**: things in the world move in arcs (a thrown object, a hand); a
  straight diagonal reads as a slide on rails.
- **When**: a thing travelling between two places on two axes: a tile
  flying into its inspector, a chip moving to where it was dropped. **Not**:
  a move along one axis (a tab's pill, a toast stacking: straight is right),
  anything under 24px.
- **Tokens**: `--motion-arc`, `--arc-lift`, `--ease-in-out`; `arcKeyframes()`
  and `flip({ arc: true })` in `motion.ts`, which `SharedLayout` uses on its
  own when both axes move.
- **In Lanes**: `SharedLayout` everywhere it moves diagonally; the catalog's
  specimen.
- **Reduced**: no flight: it is at its new place, faded in.

### 8. Pulse to confirm success

- **Means**: when something worked (sent, saved, approved, copied,
  connected), the thing that did it swells to 104% and a ring in the success
  colour breathes out from it once.
- **Why**: it confirms at the place the owner is looking, with no extra
  words to read; once, so it never nags.
- **When**: the end of an action the owner took and is waiting on. **Not**:
  something that succeeded on its own in the background (that's a quiet
  status), every row of a bulk action (pulse the summary once), errors.
- **Tokens**: `--motion-pulse`, `--pulse-scale`, `--pulse-ring`,
  `--color-success`; the class `motion-pulse` with `data-pulse`;
  `usePulse()` / `<Pulse when>`.
- **In Lanes**: every "Saved" (`StatusLine` with `tone="ok"`, so all of
  Settings), a toast of type `success` (once it has landed), the chat's copy
  button, Copy details, a campaign card reaching done (its badge), the Agents
  window's tick when an agent's send is confirmed.
- **Reduced**: the ring shows still and fades; no swell.

### 9. Ease-in-out for moves

- **Means**: something already on screen going somewhere else (a pill
  sliding, a sidebar resizing, a knob crossing) accelerates out and
  decelerates in.
- **Why**: it was at rest and will be at rest; both ends need the soft edge.
  An ease-out move snaps away; an ease-in move crashes.
- **When**: every on-screen move and morph. **Not**: arrivals and exits.
- **Tokens**: `--ease-in-out`, `--motion-move`.
- **In Lanes**: `SharedLayout` (Segmented's pill, What's new's tabs, the
  catalog's arc), the Switch knob, a tooltip moving between triggers, a
  meter's fill and flight in the chat's details, the sky's horizon in first
  run, the site's FAQ plus turning.
- **Reduced**: no move: it is there.

### 10. Start popovers at 0.95

- **Means**: a popover, menu, tooltip or dialog starts at 95% of its size and
  fully transparent, and grows to 100% as it fades in.
- **Why**: from 0 it would fly in from a point (too much); from 1 it would
  just appear. 0.95 gives the surface a sense of arriving without travel.
- **When**: every floating surface. **Not**: sheets (they slide from their
  edge), toasts (they slide from theirs), full-screen modals.
- **Tokens**: `--popover-start-scale`; every surface class.
- **In Lanes**: Menu, Select, Autocomplete, Tooltip, Dialog, AlertDialog,
  Command, AppRouteModal.
- **Reduced**: 1: no scale, a fade.

### 11. Enter from the trigger

- **Means**: a popover grows out of the control that opened it: its
  `transform-origin` is the trigger's side (Base UI's `--transform-origin`)
  or, for a dialog, the trigger's centre (`useTriggerOrigin` writes
  `--trigger-origin`).
- **Why**: the eye is on the trigger; growing from it ties the surface to its
  cause, and shows where it will go back to.
- **When**: every popup with a trigger. **Not**: a surface with no trigger
  (a dialog opened by a shortcut or a route grows from the centre).
- **Tokens**: `--transform-origin`, `--trigger-origin`; the surface classes
  set `transform-origin: var(--transform-origin, var(--trigger-origin,
  center))`. `useTriggerOrigin()` finds the trigger itself: the element that
  had the focus or the last press when it opened.
- **In Lanes**: every Menu, Select, Tooltip, Autocomplete; `DialogPopup`,
  `AlertDialogPopup`, `CommandDialogPopup`, `AppRouteModal`; the Agents
  window's inspector (from its tile).
- **Reduced**: no scale, so the origin does nothing: a fade.

### 12. Exit to the trigger

- **Means**: closing runs the opening backwards to the same origin: the
  surface shrinks back toward its trigger as it fades.
- **Why**: it closes the loop the opening drew, and says the thing is
  put away, not gone.
- **When**: wherever rule 11 applies. **Not**: a surface leaving because
  something else replaced it (crossfade, rule 16).
- **Tokens**: the same origin, `--ease-exit`, the `-exit` durations.
  `ClosingPositioner` (kit) keeps the popup where it was while it leaves.
- **In Lanes**: the same list as rule 11.
- **Reduced**: a fade.

### 13. No bounce on everyday UI

- **Means**: nothing the owner works with every day overshoots: menus,
  dialogs, buttons, rows, toasts, switches all land without a bounce.
- **Why**: a bounce is a joke; told on every click it stops being funny and
  starts costing time and attention. Calm UI is quick UI.
- **When**: always, except a short list of playful moments that are meant
  to delight once: the pal landing on a new look, a celebration.
  **Not**: there is no other exception.
- **Tokens**: `--ease-spring-playful` is the only spring for new code; the
  test allows it (and Zephium's `--ease-snap`/`--ease-spring`) only in
  `PLAYFUL` (`motion.test.ts`).
- **In Lanes**: Zephium's controls' hover scale moved off its spring; the
  pal portrait's landing keeps one.
- **Reduced**: springs never run.

### 14. Don't tween while held

- **Means**: while a finger or the mouse holds something (a press, a drag), it
  follows at once: the press scale is instant on pointer-down, a dragged edge
  tracks the pointer 1:1. The easing comes on release.
- **Why**: a tween while held is lag: the interface trails the hand. Direct
  manipulation has to be direct.
- **When**: presses, drags, resizes, scrubbing. **Not**: what happens
  after the release (that eases back).
- **Tokens**: `pressable` sets `transition-duration: 0ms` on `:active`;
  `--motion-press` is only the release; `useResizeDrag` sets
  `transition-duration: 0ms` while dragging.
- **In Lanes**: every pressable; the sidebar's resize handle.
- **Reduced**: same (nothing tweens anyway).

### 15. Make exits 20% shorter

- **Means**: a thing leaves in 80% of the time it took to arrive.
- **Why**: an entrance is information; an exit is the owner moving on, and
  the interface should not hold them back.
- **When**: every pair. **Not**: a move (no exit), a crossfade (both at
  once, rule 16).
- **Tokens**: every `-exit` is `calc(<enter> * 0.8)`; `--motion-exit`.
  `motion.test.ts` fails a token that is not, and a surface's
  `[data-ending-style]` that does not use one.
- **In Lanes**: every surface class, `motion-exit`, `Reveal`.
- **Reduced**: both are 140ms.

### 16. Overlap old & new states

- **Means**: when a state swaps (a button's label, a status word, a number, a
  step) the old one leaves while the new one arrives, in the same 220ms,
  rather than out-then-in.
- **Why**: sequenced, a swap has a blank gap and takes twice as long; the
  overlap reads as one thing changing.
- **When**: a value replacing a value in the same place. **Not**: content
  that changes length a lot (it would overlap unreadably: let it reflow), a
  page change (rise).
- **Tokens**: `--motion-swap`, `--swap-distance`; `<Swap value>` keeps the
  leaving value until it's gone; `motion-swap`, which clips both to the
  value's own line. The old one moves with the new one (the swap's whole
  time, `--ease-out`) and fades in an exit's time on `--ease-out`, not on
  `--ease-exit`: an exit curve starts slowly, and the old value sat in place
  at full strength while the new one arrived on top of it. The one leaving
  is lifted out of the line at the width it had, so the line takes the new
  value's width as the change starts, never a swap later in one jump.
  Changed again mid-swap, the one arriving turns round where it is and the
  one that was leaving goes: two copies at most.
- **In Lanes**: `Button`'s `loading` (the words fade as the spinner grows
  in), `StatusLabel`'s word, the campaign card's state, `StatusLine`
  ("Saving…" to "Saved"), Copy details' words, the text shimmer's swap, the
  style step's preview, `AnimatedNumber` (rolls each digit on
  `--motion-roll`, its own overlap).
- **Reduced**: a crossfade in place.

### 17. Masks for reveals & colour

- **Means**: something revealed (a panel, a section, a preview) is wiped in
  with a `clip-path` from the edge it opens from, not jumped open or grown in
  height; a colour change that should be noticed sweeps across with a mask.
- **Why**: a clip keeps the content at its final layout (no reflow, no
  squash), and the wipe says which way it came from; a sweep makes a state
  change visible without a flash.
- **When**: a reveal of content in place (Details, a problem's details, a
  card's more); a colour change that is the news (a meter met, a step done).
  **Not**: a popover (scale, rule 10), anything under reduced motion (a fade).
- **Tokens**: `--motion-reveal`/`-exit`, `--ease-out`; `<Reveal from>`
  (`motion-reveal`), `motion-sweep`.
- **In Lanes**: `CollapsiblePanel` (the clip rides on its height: every
  disclosure, `ProblemDetails`), `ProgressMeter` turning success (a sweep
  along the fill), the chat's streaming blocks (a fade, opacity only), the
  site's FAQ answers.
- **Reduced**: a fade.

### 18. Crossfade icons + blur

- **Means**: an icon becoming another (copy to check, play to pause, a state
  icon) crossfades with the old one shrinking to 70% and blurring 2px as the
  new one grows out of it.
- **Why**: a hard swap blinks; the blur and scale hide the moment the shapes
  differ, so the eye sees one icon turning into the other.
- **When**: an icon swap in place. **Not**: a morph that has its own
  geometry (`MorphIcon`), a different control appearing.
- **Tokens**: `--motion-crossfade`, `--crossfade-scale`, `--crossfade-blur`;
  `<Crossfade>` (keyed by its child), `motion-crossfade`. The old icon fades
  on `--ease-out` (fast first), so the two are never both half there on top
  of each other; changed back mid-crossfade, both turn round where they are.
- **In Lanes**: the chat's copy button (copy to check), `CopyDetailsButton`,
  the campaign card's state icon. The sidebar toggle and the toast's copy and
  chevron stay `MorphIcon` morphs.
- **Reduced**: a plain crossfade.

### 19. Rubber band past bounds

- **Means**: dragging past an end resists, more the further you go, and on
  release springs back inside.
- **Why**: a hard stop feels broken; resistance says "this is the end" and
  keeps the content under the finger.
- **When**: a drag that has bounds (the sidebar's width), a scroller's end
  where the platform does not do it already. **Not**: native scrolling on
  macOS and iOS (they rubber-band themselves: don't double it).
- **Tokens**: `--rubber-band` (0.55), `--motion-spring-back`, `--ease-out`;
  `rubberBand(overshoot, size)` in `motion.ts`, `useRubberBand()`
  (`within: "parent"` takes its bounds from its box: free inside, resisting
  past the edges by at most a quarter of the box, always at rest inside it;
  grabbed mid spring-back it is held where it is on screen; a lost pointer
  capture lets go like a release). `useResizeDrag` does the same for an
  edge: grabbed mid spring-back it holds where it is, and no transition runs
  while it is held.
- **In Lanes**: the sidebar's resize handle; the catalog's specimen (which
  clips at its track, like a scroller's frame).
- **Reduced**: it clamps.

### 20. Reuse the same layoutId

- **Means**: one thing in two states is one element moving, not two
  elements swapping: the selected pill slides between tabs, a card grows into
  its dialog.
- **Why**: continuity: the eye keeps hold of the object across the change.
- **When**: a selection indicator, a thing that opens into a bigger version
  of itself. **Not**: unrelated things that happen to look alike.
- **Tokens**: `--motion-move`, `--ease-in-out`; `<SharedLayout id>` (a FLIP
  keyed by id: whichever element holds the id last is where the next one
  flies from) and `sharedTransition()` (the View Transitions API, for a
  card into a dialog; a plain update where it is missing). Re-aimed
  mid-flight, it sets off at the speed it had towards its new place
  (`flightVelocity`, `easeFrom`), so clicking fast across tabs never stops
  the pill dead at each click. A pill sits in
  a `motion-segments` track: its box is measured against the track (so when
  the whole track moves in the same change, the pill moves with it and
  flies only the way it moved inside it), the option holding it sits under
  the others (so it never covers the words of the option it is leaving),
  and an option's press shrinks its words, not the pill arriving in it.
  The `motion` library is not a dependency and is not added: a FLIP keyed by
  id is 80 lines here, covers every use the window has, and costs no
  bundle; the View Transitions API covers the cross-tree cases natively.
- **In Lanes**: `Segmented` (Settings' Appearance, the catalog's toolbar),
  What's new's tabs, `ChoiceCards`' chips (the style's "switch to" row).
- **Reduced**: no slide: the pill is at its new place, faded in.

## Using it

```tsx
import { Crossfade, Pulse, Reveal, SharedLayout, Stagger, Swap, usePulse, useTriggerOrigin } from "~/components/ui";

<Button>Save</Button>                                    // pressable already
<Stagger as="ul">{rows.map((r) => <li key={r.id}>…</li>)}</Stagger>   // 30ms apart
<Crossfade>{copied ? <CheckIcon key="done" /> : <CopyIcon key="copy" />}</Crossfade>
<Swap value={status}>{label}</Swap>
const pulse = usePulse(); …; <span {...pulse.props}>Saved</span>; pulse.fire();
<Reveal open={open} from="top">…</Reveal>
<SharedLayout id={`tabs-${group}`} className="absolute inset-0 rounded-capsule bg-background" />
```

In CSS, a component reads tokens, never numbers:

```css
.thing { transition: opacity var(--motion-enter) var(--ease-out); }
.thing[data-ending-style] { transition-duration: var(--motion-exit); transition-timing-function: var(--ease-exit); }
```

In Tailwind: `duration-(--motion-enter) ease-out`, never `duration-200` or
`duration-[90ms]`. A bare `transition-colors` takes `--motion-fast` on
`--ease-out` (the defaults are set in `bridge.css`).

## Enforcement

`app/ui/src/components/ui/motion.test.ts` fails on:

- a hard-coded duration or curve in a `transition`, `animation`, `*-duration`,
  `*-delay` or `*-timing-function`, a `duration-<n>`/`delay-<n>` class, a
  `duration-[…]`/`ease-[…]` value, or a `cubic-bezier()`/`linear(…)`/`ease`
  keyword, anywhere in `app/ui/src` outside `design/motion/tokens.css`
  (ambient `infinite` loops and `steps()` are left alone; a file being
  redesigned by others may sit in `ELSEWHERE` until it adopts the tokens,
  and none does now);
- a spring (`--ease-spring-playful`, `--ease-snap`, `--ease-spring`) outside
  `PLAYFUL`;
- a Base UI popup (Menu, Select, Popover, Tooltip, Autocomplete, Combobox,
  Dialog, AlertDialog) without its surface class (and so without its trigger
  origin), and a Dialog popup without `useTriggerOrigin`;
- a kit component that renders a `<button>` (or Base UI's button) without
  `pressable`, unless it is in `NOT_PRESSABLE` with its reason;
- an `-exit` token that is not 80% of its entrance, and a surface whose
  `[data-ending-style]` does not use an `-exit` token.

The motion pipeline (`QA.md`) holds the primitives frame by frame on top of
that: the math over thousands of inputs (`motion.property.test.ts`), no
layout animated (`motion.perf.test.ts`), and in the browser every primitive
in every view, on a controlled clock, with visual baselines
(`e2e/motion-*.spec.ts`).

`tests/test_site_motion_matches_app.py` fails when the site's copy of the
tokens differs from this one, and on a hard-coded duration or curve in the
site's own CSS or a site component's inline style, every file included;
it holds the hero reel's roll to its tokens by name.
`tests/test_email_design.py` fails on any animation or transition in an
email.

## The site

`site/app/motion-tokens.css` is `tokens.css`, copied by
`scripts/sync_site_motion.py` (run it after changing a token; the test says
when). The site's CSS uses the same names: `var(--motion-dropdown)` for the
nav's menus, `var(--motion-reveal)` for the FAQ, `var(--press-scale)` on
`.btn-primary`. Reduced motion there is `prefers-reduced-motion` alone.

**The hero reel** (`site/components/home/hero-reel.tsx`, `hero.module.css`):
the opening arrives on `--ease-emphasized`: the chip and the headline's
words on `--motion-rise`, the words `--motion-stagger` apart from
`--motion-rise-delay`, the reel as the last word at `--motion-stage-delay`;
the lede, the start choice and the note on `--motion-rise-after`,
`--motion-settle-stagger` apart; the window lifting on `--motion-stage`. The
roll is one job replacing another (rule 16, overlapped): the one arriving
rolls up `--swap-distance` on `--motion-roll` and `--ease-out`, a
`--motion-stagger` behind, fading in at once on `--motion-swap`; the one
leaving rolls `--swap-distance` up with it on `--motion-roll` and
`--ease-out` and fades in an exit's time (rule 15) on `--ease-out`, so the
two never sit on top of each other half there (QA.md, M8); both blur by
`--crossfade-blur`; nothing overshoots (rule 13). The 1.3 seconds a
job stays is reading time, not motion (`REEL_EVERY_MS`). The start choice
and the film's play disc press to `--press-scale` at once (rules 4, 14); the
film's player fades its loop in on `--motion-stage-short`. Anything
travelling across the frame later takes `--ease-in-out` with
`--motion-move` (an arc, `--arc-lift`, when it crosses on both axes). Under
`prefers-reduced-motion` the reel stays on its first job, the opening does
not run, and the film shows its poster still and does not autoplay; the
keyframes' distances multiply by `--motion-travel` besides.

## About you

First run's About you (`screens/onboarding/steps/AboutStep.tsx`,
`components/about/AboutYouForm.tsx`) and its tiles and chips
(`components/ui/choice-cards.*`) are on the tokens: every tile, card, thumb
and swatch presses to `--press-scale` at `transition-duration: 0ms` on
`:active` (`choice-cards.css`), and the chips take `pressable` (rules 4,
14); the tiles and the style's sample cards arrive on `--motion-rise-after`
and `--ease-emphasized` from `--motion-stage-delay`, `--motion-stagger`
apart (rule 3; About you's three questions count on from each other with
`--choice-from`, so the page arrives as one list); a chosen tile's or card's
tick is drawn once chosen with `motion-appear` (rules 13, 18); the chosen
chip's capsule is a `SegmentThumb` (`tone="ink"`) sliding between the chips
(rule 20); and the words under "Something else" arrive with `motion-enter`.

## Emails

Email clients don't animate reliably: Outlook for Windows renders with Word
and ignores CSS animation and transition outright, Gmail strips `<style>`
blocks in many views and every `@keyframes`, and Apple Mail animates where the
others show a frozen first frame, so a mail would look different in every
inbox. Lanes' emails therefore never move: no `animation`, `transition`,
`@keyframes`, animated GIF or SVG `<animate>`; their states are drawn still
(`server/email_design/`). `tests/test_email_design.py` holds it.
