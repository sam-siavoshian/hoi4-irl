# @sam/design-system (vendored)

The Lanes design system: tokens, motion, and the component kit (React 19 + Tailwind 4). ARTESH's interface in
`src/` and its landing page in `site/` are built only from this kit.

- **From**: the `sam-designsystem` repository, `packages/design`.
- **At commit**: `adcc1cf9515be9a8c5cae7add60e9cd86344f7b5`.
- **Copied**: `src/`, `boot/`, `check/`, `package.json`, `COMPONENTS.md`, `THIRD_PARTY_NOTICES.md`. The test files
  (`*.test.ts`, `*.test.tsx`) and the package's own build config were left out; `devDependencies` and `scripts` were
  removed from `package.json`, because the app only consumes the source.
- **Used as**: `"@sam/design-system": "file:vendor/design-system"` in the root `package.json`. Vite compiles the
  TypeScript and CSS from here.
- **Licences**: see `THIRD_PARTY_NOTICES.md` in this folder.

## Changes made here

A look the kit lacked was added to the kit, not to a screen. Each file's header says what changed.

| File | Change | Why |
|---|---|---|
| `src/components/ui/sheet.tsx` | `SheetPopup layer="panel"`; `SheetPanel` | A sheet with no backdrop that lets presses reach the page, so the map stays in use beside or above it; a scrolling body with room for the home indicator. |
| `src/components/ui/list.tsx` | `ListRowButton`; `ListRow inline` | A row that is one press (a front, a division, a country); a short control kept beside its title in a narrow panel. |
| `src/components/ui/progress-meter.tsx` | `ProgressMeter origin="center"` | A front's balance: the fill grows from the middle, one way for ground lost and the other for ground taken. |
| `src/components/ui/day-grid.tsx` | new `DayGrid` | History's calendar: a square a day, tinted by how the day went. |
| `src/components/ui/slider.tsx` | new `Slider` (Base UI) | The replay's date. The kit had no slider. |
| `src/components/ui/choice-cards.tsx`, `choice-cards.css` | `ChoiceCards variant="thumbs" flow="scroll" \| "column"` | The country picker's nations: one line of flags that scrolls sideways on a phone, a stacked column (flag, name, a line under it) on a wide screen. |
| `src/components/ui/choice-cards.tsx`, `choice-cards.css` | `ChoiceCards variant="tiles" columns={2}` | The provider tiles in Settings: two across at any width. The tiles' grid follows the window, so three across in a narrow side panel on a wide screen cut the names. |
| `src/components/ui/choice-cards.tsx`, `choice-cards.css` | `ChoiceCards variant="thumbs" flow="strip"` | The landing page's nations: one line that shares the row when all eight flags fit and scrolls sideways on a phone. It brings the chosen one into view by scrolling only itself, so a page that scrolls never jumps (`scroll` uses `scrollIntoView`, right for a full-screen picker, wrong on a page). |
| `src/components/ui/section-header.tsx` | `SectionHeader level="hero" \| "display"`, `align="center"` | A page read from top to bottom (the landing page): its one headline at `text-hero` with the sentence and actions under it, and each band's heading at `text-headline`. The kit's levels stop at a settings page's title. |
| `src/components/ui/list.tsx` | `ListRowDisclosure` | A row that opens in place, a question and its answer (the landing page's FAQ): the row's type and gutters on the kit's `Collapsible`, a chevron that turns, the answer wiped in. |
| `src/components/ui/code-block.tsx` | new `CodeBlock` | Commands to copy and run (the landing page's install steps): a recessed plate of monospace lines, notes that are not copied, and one Copy button made as `CopyDetailsButton` is. The kit had no block of code. |
| `src/components/ui/prose.tsx` | new `Prose`, `ProseTable` | The site's content pages (a country, self-hosting, the FAQ): a column of words to read at length, styled from the kit's tokens (the reading size, the headline size, the inks, Button `link`'s underline, `ProblemDetails`' plate for inline code), and a table of facts that scrolls sideways inside its own frame. The kit had type for a screen, not for a page of sentences. |
| `src/components/ui/breadcrumbs.tsx` | new `Breadcrumbs` | Where a content page sits on the site, under its header: parents as links, the current page last with `aria-current`. |
| `src/components/ui/list.tsx` | `ListRowLink`; `ListRowDisclosure findable` | A row that goes to another page (the site's "Read next"); a closed answer that stays in the HTML (`hidden="until-found"`), so a search engine reads it and find-in-page opens it. |
| `src/components/ui/section-header.tsx` | `hero` and `display` actions follow `align` | A content page's heading starts at the left; its buttons were centred under it. |
| `src/components/ui/index.ts` | exports `DayGrid`, `Slider`, `CodeBlock`, `Prose`, `ProseTable` and `Breadcrumbs` | |

## Updating

Copy the same folders over this one from a newer commit, re-apply the changes in the table (or upstream them first),
update the commit above, then run `npm run build`, `npm run build:site`, `npx sam-design-check src site` and the tests.
