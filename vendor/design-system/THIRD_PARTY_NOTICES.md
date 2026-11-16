# Third-party notices

The Lanes window (`app/ui`) includes or adapts work from the projects below.
Each entry says what was taken, which files carry it, and the licence it
comes under. Licence texts follow at the end. This follows the pattern of
Morrow's `web/THIRD_PARTY_NOTICES.md`.

## Zephium (MPL-2.0)

Source: https://github.com/zephium-browser/Zephium (`frame/`).

Files that contain code adapted from Zephium stay under the Mozilla Public
License 2.0 and carry the MPL header at their top, naming the upstream file.
Our other files are a Larger Work (MPL 3.3) and stay ours.

| Our file | Adapted from (Zephium) |
|---|---|
| `src/design/zephium/primitive.css` | `frame/src/styles/tokens/primitive.css`, unchanged |
| `src/design/zephium/tokens.css` | `frame/src/styles/tokens.css` (`@theme static` as `:root`, radius reset dropped) |
| `src/design/zephium/type.css` | `frame/src/styles/axes/type.css`, unchanged |
| `src/design/zephium/material.css` | `frame/src/styles/axes/material.css`, `frame/src/shared/ui/Menu/surface.css` (`.ui-menu` and its forced-colours fallback), `frame/src/styles/tokens/sky.css` |
| `src/design/zephium/motion.css` | `frame/src/styles/axes/motion.css`, `frame/src/shared/ui/Menu/popover.css` (keyframes), `frame/src/features/newtab/components/NewTab.svelte` and `frame/src/shared/ui/presence/Shimmer.svelte` (keyframes, renamed `zephium-*`) |
| `src/design/zephium/global.css` | `frame/src/styles/global.css` (the body's type rendering, `::selection`, `[data-glass-text]` on Liquid Glass; `font-synthesis` keeps `style` for the bundled Inter, which has no italic) |
| `src/components/ui/kbd.tsx` | `frame/src/shared/ui/KeyHint/KeyHint.svelte` (`.ui-keys kbd`: the keycap's size, radius, face, fill and ink) on t3code's Kbd |
| `src/design/zephium/controls.css` | `frame/src/shared/ui/Button/control.css` and `frame/src/shared/ui/Shine/shine.css`, unchanged; `frame/src/shared/ui/Button/Button.svelte` and `frame/src/shared/ui/KeyHint/KeyHint.svelte` (scoped styles made global under `.ui-button` and `.ui-keys`, `pending` renamed `ui-button-pending`) |
| `src/design/morrow/ShimmerText.tsx` | `website/components/island/shimmer.tsx` (https://github.com/zephium-browser/website), by way of Morrow |
| `src/design/morrow/shimmer-text.css` | `website/components/island/shimmer.module.css`, by way of Morrow |
| `src/screens/onboarding/formation.ts` | `frame/src/features/onboarding/lib/formation.ts`, by way of Morrow's `web/src/components/onboarding/formation.ts`. Against Zephium: the letters are a `draw` callback (live text) instead of a `path` + `place` (the wordmark), and each shade is painted at its alpha (`globalAlpha`) instead of an `rgba()` per shade; the welcome passes Zephium's constant pitch, 3.4 |
| `src/screens/onboarding/IntroStep.tsx` | `frame/src/features/onboarding/components/Onboarding.svelte` (welcome: forming on reveal, the intro with it), by way of Morrow's `intro-step.tsx` |
| `src/components/ui/step-shell.tsx`, `step-shell.css` | the same `Onboarding.svelte` (the welcome, head, scene, bar, dashes, notice, `.features`, skip, rise, leaving, the camera's curve) and `shared/ui/Button/Button.svelte` (the controls, on `design/zephium/controls.css`), by way of Morrow's `step-chrome.tsx`: first run's chrome, in the kit, without the step machine |
| `src/screens/onboarding/keys.ts`, `keys.test.ts` | `frame/src/features/onboarding/components/Onboarding.svelte` (keydown), by way of Morrow's `keys.ts` and its test, unchanged from Morrow. Against Zephium: Escape and Backspace also go back (Zephium answers Enter only), and more controls keep their own Enter |
| `src/screens/onboarding/OnboardingScreen.tsx` | `frame/src/features/onboarding/components/Onboarding.svelte` (the top row's Skip; `say`; the primary's labels; leaving after 1500ms), around Morrow's `onboarding-wizard.tsx` |
| `src/components/ui/choice-cards.css` | `frame/src/features/onboarding/components/steps/Models.svelte` (the option card's type: title 15px/500, the body in the body size) for the `sample` cards |
| `src/components/ui/assets/intro.m4a` | `assets/sounds/intro.m4a`, unchanged (by way of Morrow's `web/public/sounds/intro.m4a`, the same file); see Images and sounds |

Design values Morrow records as Zephium's (the beam, vibrancy and sky-glass
recipes in `src/design/morrow/effects.css`, the sky placement in
`src/design/morrow/sky.css`) are kept as Morrow wrote them. The Zephium name,
logo, wordmark and sky pictures are not used here; first run forms the word
"Lanes" (or the owner's name) from live text, not Zephium's wordmark path. The
one Zephium sound used is the onboarding intro, which the MPL covers (Zephium's
README excepts only its name and logo).

## t3code (MIT)

Source: https://github.com/pingdotgg/t3code (`apps/web`, `packages/shared`,
`packages/contracts`). Copyright (c) 2026 T3 Tools Inc.

| Our file | From (t3code) |
|---|---|
| `components.json`, `tsconfig.json`, `vite.config.ts` | `apps/web/components.json`, `apps/web/tsconfig.json` + `tsconfig.base.json`, `apps/web/vite.config.ts` (adapted) |
| `src/lib/utils.ts` | `apps/web/src/lib/utils.ts` (`cn`, platform helpers) |
| `src/components/ui/*.tsx`, `dialog-styles.ts`, `sidebarState.ts` | `apps/web/src/components/ui/*` (button, kbd, input, textarea, scroll-area, separator, badge, skeleton, dialog, sheet, autocomplete, command, tooltip, sidebar, empty, switch, select, alert-dialog, menu, closing-positioner, spinner, checkbox, alert, label), unchanged |
| `src/lib/visibleAnimation.ts` | `apps/web/src/lib/visibleAnimation.ts` (the spinner's pause offscreen), unchanged |
| `src/screens/settings/layout.tsx` | `apps/web/src/components/settings/settingsLayout.tsx` and `SettingsGroup.tsx` (section, group, row and page container, without settings scopes) |
| `src/screens/settings/SettingsScreen.tsx`, `controls.tsx` | `apps/web/src/routes/_chat.settings.tsx` (Settings in its app modal: the nav beside the section, the header with its breadcrumb and close); the breadcrumb of `components/settings/SettingsBreadcrumb.tsx` and `components/WorkspaceBreadcrumb.tsx`; the select row of `components/settings/NotificationSettings.tsx` |
| `src/screens/settings/SettingsSidebarNav.tsx` | `apps/web/src/components/settings/SettingsSidebarNav.tsx` (the search row, its listbox and keys, "/" and mod+F to focus it, the groups, the icon rail below md), for Lanes' sections |
| `src/screens/settings/settingsSearch.ts` | `searchSettings` of `apps/web/src/components/settings/settingsSearch.ts` and `normalizeSearchText` of `apps/web/src/lib/utils.ts`, over Lanes' sections |
| `src/screens/settings/sections/KeybindingsSettings.tsx` | `apps/web/src/components/settings/KeybindingsSettings.tsx` and `KeybindingsSettings.logic.ts` (the commands in groups with their current keys, and the filter), listing only |
| `src/components/ui/app-route-modal.tsx` | `apps/web/src/components/AppRouteModal.tsx` (`AppRouteModal`, `AppRouteModalClose`), with an `onClosed` prop |
| `src/components/shell/mainAppLocation.ts` | `apps/web/src/components/sidebar/mainAppLocation.ts` (where Settings returns to) |
| `src/components/shell/AppShell.tsx` | the section kept mounted under Settings, from `apps/web/src/routes/_chat.tsx` (`ChatRouteLayout`); the appearance toast of `apps/web/src/shortcuts/commandPaletteCommands.ts` |
| `src/components/ui/toast.tsx`, `toast.logic.ts`, `toastHelpers.ts` | `apps/web/src/components/ui/toast.tsx`, `toast.logic.ts`, `toastHelpers.ts`, without thread scoping |
| `src/components/ui/morph-icon.tsx` | `apps/web/src/components/MorphIcon.tsx` (on the `morphicons` package, as t3code) |
| `src/components/ui/composer-prompt.tsx` | the prompt's type and spacing of `apps/web/src/components/ComposerPromptEditorTiptap.tsx`, as a textarea |
| `src/hooks/useMediaQuery.ts`, `useResizeDrag.ts` | `apps/web/src/hooks/*` |
| `src/lib/accessibilityAnnouncements.ts`, `editableFocus.ts`, `workspaceTitlebar.ts` | `apps/web/src/lib/*`, `apps/web/src/workspaceTitlebar.ts` |
| `src/lib/keybindings/shortcuts.ts` | `packages/shared/src/keybindings.ts` (parser, matcher, `when` grammar) |
| `src/lib/keybindings/types.ts`, `defaults.ts` | `packages/contracts/src/keybindings.ts`; the rule format and merge of `packages/shared/src/keybindings.ts` |
| `src/lib/keybindings/keybindings.ts` | `apps/web/src/keybindings.ts` |
| `src/lib/keybindings/dispatcher.ts` | `apps/web/src/shortcuts/dispatcher.ts` |
| `src/lib/keybindings/modifierState.ts` | `apps/web/src/shortcutModifierState.ts` |
| `src/components/shell/AppSidebarLayout.tsx`, `AppSidebar.tsx` | `apps/web/src/components/AppSidebarLayout.tsx`, `sidebar/SidebarChrome.tsx` (the brand, the footer's utility row), `sidebar/SidebarThreadHeader.tsx` (the Search field and New chat button), `Sidebar.tsx` (adapted) |
| `src/components/shell/CommandPalette.tsx`, `CommandPaletteContent.tsx`, `commandPaletteStore.ts` | `apps/web/src/components/CommandPalette.tsx`, `CommandPaletteContent.tsx`, `CommandPaletteResults.tsx`, `CommandPalette.logic.ts`, `apps/web/src/commandPaletteStore.ts` |
| `src/components/shell/WorkspacePageHeader.tsx`, `WorkspacePageContainer.tsx` | `apps/web/src/components/*` |
| `src/components/ui/composer-surface.tsx` | `apps/web/src/components/chat/ComposerSurface.tsx`, unchanged |
| `src/components/chat/ChatComposer.tsx` | the layout of `apps/web/src/components/chat/ChatComposer.tsx` and `ComposerPrimaryActions.tsx`; its key handling (Enter, recall, page keys) |
| `src/components/ui/input-group.tsx`, `collapsible.tsx` | `apps/web/src/components/ui/input-group.tsx`, `collapsible.tsx`, unchanged |
| `src/screens/chat/ChatScreen.tsx` | the structure of `apps/web/src/components/ChatView.tsx`: timeline under a floating composer, banners docked above it, find bar, scroll-to-end pill, the chat's shortcut scope, type-to-focus and paste-to-focus (`useChatShortcuts.ts`, `usePasteToFocusComposer.ts`) |
| `src/components/chat/ChatMarkdown.tsx` | `apps/web/src/components/ChatMarkdown.tsx`, `chat/MarkdownCodeBlock.tsx` (the code block frame), `chat/MarkdownTable.tsx` (the table container); trimmed to the renderers Lanes uses |
| `src/components/chat/chat-markdown.css` | the `.chat-markdown` rules and find highlights of `apps/web/src/index.css` |
| `src/components/chat/markdownRenderer.ts` | `apps/web/src/components/chat/markdownRenderer.ts` (without the syntax gates) |
| `src/components/chat/markdownStreamBlocks.ts` | `apps/web/src/components/chat/markdownStreamBlocks.ts`, unchanged |
| `src/components/chat/markdownIncremental.ts` | `apps/web/src/markdown-incremental.ts`, unchanged |
| `src/components/chat/MessagesTimeline.tsx` | `apps/web/src/components/chat/TimelineUserMessageRow.tsx`, `TimelineAssistantRows.tsx`, `TimelineRowParts.tsx`, `MessagesTimeline.logic.ts` (`shouldCollapseUserMessage`) |
| `src/components/chat/MessageCopyButton.tsx` | `apps/web/src/components/chat/MessageCopyButton.tsx` |
| `src/components/chat/useCopyToClipboard.ts` | `apps/web/src/hooks/useCopyToClipboard.ts`, `useStableCallback.ts` |
| `src/components/ui/composer-banner.tsx` | `apps/web/src/components/chat/ComposerBanner.tsx`, unchanged |
| `src/components/chat/ComposerBanners.tsx` | `apps/web/src/components/chat/ComposerPendingUserInputPanel.tsx` (the question over the composer), `ComposerBannerStack.tsx` (`NoticeCard`) |
| `src/components/chat/ContextPicker.tsx`, `ContextChip.tsx` | the composer's attached pickers, and `apps/web/src/components/ContextChip.tsx` |
| `src/components/chat/composerPromptHistory.ts` (+ test) | `apps/web/src/components/chat/composerPromptHistory.ts` and its test |
| `src/components/chat/composerFocusRedirect.ts` | `apps/web/src/components/chat/composerFocusRedirect.ts` |
| `src/components/chat/pageScrollController.ts` | `apps/web/src/components/chat/pageScrollController.ts`, unchanged |
| `src/components/chat/timelineScrollTarget.ts` | `apps/web/src/components/chat/timelineScrollTarget.ts`, unchanged |
| `src/components/chat/timelineViewport.ts` (+ test) | `apps/web/src/components/chat/timelineViewport.ts`, `MessagesTimeline.logic.ts` (`resolveTimelineIsAtEnd`), and their tests (`timelineViewport.test.ts`, `pageScrollController.test.ts`) |
| `src/components/chat/useTimelineFollow.ts` | `apps/web/src/components/chat/useTimelineFollow.ts` (for a plain scrolling column), with the anchoring of a newly sent turn and `CHAT_TIMELINE_ANCHOR_OFFSET` of `timelineScrollAnchoring.ts` |
| `src/components/chat/ScrollToEndButton.tsx` | `apps/web/src/components/chat/TimelineOverlays.tsx` (`ScrollToEndButton`) |
| `src/components/chat/ChatFindBar.tsx` | `apps/web/src/components/chat/ThreadFindBar.tsx` |
| `src/components/chat/chatFind.ts` | `packages/shared/src/threadSearch.ts`, `threadFindText.ts` (block tags), `apps/web/src/components/chat/threadFind.ts`, `threadFindHighlights.ts` |
| `src/components/chat/chatState.ts` | the reconciliation of `apps/web/src/components/chat/optimisticUserMessages.ts` |
| `src/components/chat/timestampFormat.ts` | `apps/web/src/timestampFormat.ts` (the chat's formatters) |
| `src/components/chat/SidebarCampaigns.tsx` | `apps/web/src/components/sidebar/SidebarThreadRow.tsx` and `Sidebar.logic.ts` (a thread row and its status, for campaigns) |
| `src/components/chat/streaming.test.tsx` | `apps/web/src/components/chat/markdownStreamBlocks.test.tsx` (the block-split cases) |
| `src/design/t3code/theme.css` | `apps/web/src/index.css` (theme, utilities, base) |
| `src/components/connections/SettingsLayout.tsx` | `apps/web/src/components/settings/settingsLayout.tsx` (`SettingsSection`, `SettingsRow`) and `SettingsGroup.tsx`, without settings scopes, inheritance, policy locks and search targets; a `media` slot on rows |
| `src/components/leads/LeadsTable.tsx`, `leadPages.ts` | `apps/web/src/components/files/VirtualTablePreview.tsx` (the ARIA div table, sticky header, a scroll track as tall as every row with only the rows in view mounted, rows kept as skeletons while `loadPage` fills their page) and `components/ui/table.tsx` (row and header styling); fixed 48px rows, columns by width, selection, sorting and keys added |
| `src/components/leads/LeadsToolbar.tsx` | `apps/web/src/components/pullRequest/PullRequestListFilters.tsx` (the Filters button with its count, a radio submenu per filter with an icon per option) |
| `src/components/ui/list.tsx`, `section-header.tsx` | `apps/web/src/components/settings/settingsLayout.tsx` and `SettingsGroup.tsx` (SettingsSection, SettingsGroup, SettingsRow, the section header) without scopes, inheritance or policies; a media slot, a description and `setting`/`item` rows added |
| `src/components/ui/chip.tsx` | `apps/web/src/components/ContextChip.tsx` (the pill, its accent ink, the remove action) |
| `src/components/ui/sort-button.tsx`, `file-picker.tsx`, `choice-select.tsx` | the header type of `components/ui/table.tsx`; the drop-zone tile Leads' import drew; the Select use of t3code's settings rows |
| `src/components/ui/button.tsx` | `apps/web/src/components/ui/button.tsx`, with `primary`, `md`, `shape`, `loading` and `kbd` added (see its header); `send` and `stop` from `apps/web/src/components/chat/ComposerPrimaryActions.tsx` |
| `src/components/agents/observeResize.ts` | `apps/web/src/lib/observeResize.ts`, unchanged |
| `src/components/agents/framePainter.ts` | `packages/client-runtime/src/preview/serverBrowserStream.ts` (`createPreviewFramePainter`: paints a Blob, decodes at the shown size) |
| `src/components/agents/AgentGrid.tsx` | the windowing of `apps/web/src/components/files/VirtualTablePreview.tsx` (rows of tiles instead of a table's pages) |
| `src/components/agents/agents.css` (`agent-count-tick`) | `apps/web/src/index.css` `stash-pulse-count` and its swap-to-restart use in `components/chat/ComposerStashBadge.tsx` |

## opencode (MIT)

Source: https://github.com/anomalyco/opencode. Copyright (c) 2025 opencode.

| Our file | From (opencode) |
|---|---|
| `src/design/opencode/radar.ts`, `radar.test.ts` | `packages/ui/src/components/spinner-radar.ts` and its test, unchanged |
| `src/design/opencode/RadarSpinner.tsx` | `packages/ui/src/components/spinner.tsx`, ported from Solid to React |
| `src/design/opencode/spin-phase.ts` | `packages/ui/src/hooks/spin-phase.ts` |
| `src/design/opencode/WorkingIndicator.tsx` | `packages/app/src/session/header/session-working-indicator.tsx`, `packages/session-ui/src/v2/components/session-progress-indicator-v2.tsx`, `packages/app/src/runtime/presence.ts` + `animated-presence.ts` |
| `src/design/opencode/TextShimmer.tsx` | `packages/ui/src/typography/text-shimmer/text-shimmer.tsx` |
| `src/components/ui/AnimatedNumber.tsx` (+ test), `animated-number.css` | `packages/ui/src/components/animated-number.tsx` (Solid to React) and `animated-number.css`, unchanged; one copy for the chat, the Agents window and Overview |
| `src/components/agents/RadarImage.tsx` | the Soft Radar of `spinner-radar.ts` (via `src/design/opencode/radar.ts`), drawn as one shared SVG image for the grid's tiles |
| `src/components/ui/radar.tsx`, `shimmer.tsx`, `count-up.tsx` | `packages/ui/src/components/spinner.tsx` (sizes and inks for the Soft Radar), `typography/text-shimmer/text-shimmer.tsx`, and `animated-number.tsx` counting up from zero, all by way of the ports in `src/design/opencode/` and `src/components/ui/AnimatedNumber.tsx` |
| `src/components/ui/tooltip.tsx`, `src/components/shell/ScreenHeader.tsx` | the tooltip's motion (`data-component="tooltip-v2"`, `packages/ui/src/overlays/tooltip/tooltip.css`); the session header's title and radar placement (`packages/app/src/session/session-identity-header.tsx`) |
| `src/design/opencode/micro.css` | `packages/ui/src/components/spinner.css`, `session-progress-indicator-v2.css`, `typography/text-shimmer/text-shimmer.css`, `styles/scrollbar.css`, `styles/tailwind/utilities.css`, `styles/tailwind/index.css` (motion variants), `actions/button/button.css` (overlay hover), `styles/animations.css`, `components/typewriter.css`, `overlays/tooltip/tooltip.css` (keyframes) |
| `src/components/chat/Details.tsx` | `packages/ui/src/components/collapsible.tsx` ("Details") and `progress.tsx`, ported to React |
| `src/components/chat/chat-details.css` | `packages/ui/src/components/collapsible.css`, `progress.css`, and the message meta rules of `packages/session-ui/src/components/message-part.css` (hover-revealed details, the Sending transition) |
| `src/components/chat/MessagesTimeline.tsx` | the message details of `packages/session-ui/src/message/message-content.tsx` (`MetaItems`, `UserMessageTransition`, the reply's duration and copy footer) |
| `src/components/chat/usePacedText.ts` | `createPacedValue` of `packages/session-ui/src/message/message-content.tsx`, as a React hook |
| `src/components/chat/timestampFormat.ts` | the reply duration of `packages/session-ui/src/message/message-content.tsx` |
| `src/lib/keybindings/defaults.ts` | the chat's stop keys (Escape, Ctrl+G) of `packages/app/src/composer/editor/interaction.ts` and `message.previous`/`message.next` (mod+alt+[ / ]) of `packages/app/src/session/commands/use-session-commands.tsx` |
| `src/components/company/Progress.tsx`, `progress.css` | `packages/ui/src/components/progress.tsx` and `progress.css`, Solid and Kobalte to React with plain ARIA |

The opencode name and wordmark are not used.

## The old Lanes window (the owner's own code)

| Our file | From |
|---|---|
| `src/components/chat/dictation.ts` (+ test) | `app/src/dictation.js` (`insertTranscript`, the recorder, `meterMicrophone`) and `app/src/dictation-waveform.js`, ported to TypeScript |
| `src/components/chat/useDictation.ts` | the state machine of `app/src/dictation.js` |
| `src/components/connections/logos/{gmail,outlook,linkedin,x}.png` | `app/src/logos/*`, unchanged. The Gmail, Outlook, LinkedIn and X marks belong to their owners and are used only to name each service. |
| the words, states and rules in `src/components/connections/mailAccounts.ts`, `useMailAccounts.ts`, `src/components/leads/leadsQuery.ts`, `LeadDialogs.tsx`, `LeadDrawer.tsx` and `src/components/company/profileForm.ts` | `app/src/gmail-accounts.js`, `app/src/web-connections.js` and `app/src/main.js` (people, import, export, do not contact, profiles) |

## react-markdown

`markdownUrlTransform` in `src/components/chat/ChatMarkdown.tsx` is
react-markdown's `defaultUrlTransform` (MIT, Copyright (c) Espen Hovlandsdal),
which t3code's own transform falls back to; the package itself is not used.

## Morrow (the owner's own repository)

Source: sam-siavoshian/morrow (`web/`). The owner's code; no licence is
needed to use it here. Listed so its origin is clear.

| Our file | From (Morrow) |
|---|---|
| `src/design/morrow/scenes.ts` | `web/src/components/sky/scenes.ts` (plus the hour-of-day clock, new here) |
| `src/design/morrow/Sky.tsx`, `sky.css` | `web/src/components/sky/static-sky.tsx`, `static-sky.module.css`, the sky tokens in `web/src/app/globals.css` |
| `src/design/morrow/effects.css` | utilities in `web/src/app/globals.css` |
| `src/design/morrow/StatusDot.tsx` | `web/src/components/ui/status-dot.tsx` |
| `src/design/theme.ts` | the pattern of `web/src/components/ui/theme.tsx` |
| `src/design/morrow/sky/*` | `web/public/sky/*`, unchanged (see Images) |
| `src/screens/onboarding/OnboardingScreen.tsx` | `web/src/components/onboarding/onboarding-wizard.tsx` and `web/src/app/onboarding/page.tsx` + `components/auth/sky-stage.tsx` (the flow and its sky stage) |
| `src/screens/onboarding/machine.ts`, `machine.test.ts` | `web/src/components/onboarding/machine.ts` and its test (guards, `neighbour`, `position`), for Lanes' steps |
| `src/components/ui/sound.ts`, `sound.test.ts` | `web/src/components/onboarding/sound.ts` and its test (the switch and its stored choice left out, the volume full, as Zephium's) |
| `src/screens/onboarding/StillConnecting.tsx` | `web/src/components/onboarding/still-connecting.tsx` |
| `src/screens/onboarding/steps/DoneStep.tsx` | `web/src/components/onboarding/finish-step.tsx` |
| `src/components/agents/visibility.ts` | `web/src/lib/motion.ts` (`watchVisibility`) |
| `src/components/ui/glass-panel.tsx` | `web/src/components/ui/card.tsx` (`Card`, `GlassPanel`, the frost variant) |
| `src/components/ui/button.tsx` (its feel) | `web/src/components/ui/button.tsx`: the 0.98 press over 90ms on the press curve, the 1.012 hover lift on solid variants, and the `sky`, `sky-secondary`, `beam` and `sky-beam` capsules |
| `src/components/ui/checkbox.tsx`, `menu.tsx` (their checks) | `web/src/components/ui/checkbox.tsx` and `menu.tsx` (lucide Check and Minus at their strokes) |
| `src/components/agents/StateBadge.tsx` (the working word) | `web/src/components/ui/badge.tsx` (the working badge's `ShimmerText`) |
| `src/components/ui/avatar.tsx` | `web/src/components/ui/avatar.tsx` (initials, the name's hue, the status notch) |
| `src/components/ui/icon-button.tsx` | `web/src/components/ui/icon-button.tsx` |
| `src/components/ui/shortcut-hint.tsx` | `web/src/components/ui/kbd.tsx` (`formatKeys` and its glyphs) |
| `src/components/ui/empty-state.tsx` | the API of `web/src/components/ui/empty-state.tsx` (drawn with t3code's Empty) |
| `src/components/ui/segmented.tsx` | the track of `web/src/components/ui/segmented.tsx` |
| `src/components/ui/progress-meter.tsx`, `sky-backdrop.tsx`, `status-dot.tsx` | `web/src/components/pool/pool-meter.tsx` (the segment); `web/src/components/sky/static-sky.tsx` (by way of `src/design/morrow/Sky.tsx`); `web/src/components/ui/status-dot.tsx` (by way of `src/design/morrow/StatusDot.tsx`) |
| `src/components/agents/agents.css` (`agent-tick-pulse`) | `web/src/components/mission/agent-strip.module.css` (the tile pulse) |

The agents' faces (`src/components/agents/faces.ts`) are Lanes' own, ported
from the old window's `app/src/agent-face.js`, `pal-icon.js` and
`pal-character.js`.

## Fonts

- **The platform's own faces** (SF Pro, SF Pro Rounded, New York, SF Mono on a
  Mac; Segoe UI Variable on Windows): what Zephium uses. Named in the CSS,
  never shipped.
- **Inter Variable** (SIL Open Font License 1.1), from the
  `@fontsource-variable/inter` package, bundled by Vite into `app/dist/assets`.
  Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter).
  t3code's interface face; used where no platform face resolves.

## Images and sounds

- **Sky pictures** (`src/design/morrow/sky/*`: day, dawn and night, baked at
  2200 and 1200 px as AVIF and JPEG, and three 192 px frosts): copied unchanged
  from Morrow's `web/public/sky`, which Morrow bakes from its own
  `web/assets/sky/*-source.png` with `web/scripts/bake-sky.ts` (an MPL-2.0 port
  of Zephium's `frame/scripts/bake-sky.mjs`; the script is not copied here).
  The source pictures are Morrow's own, not Zephium's (they differ from
  Zephium's `assets/sky/*`); Morrow records no further provenance for them.
- **The Lanes mark** (`public/lanes-mark.svg`, `src/assets/lanes-mark.svg`) and
  `public/lanes-touch-icon.png`: Lanes' own, from `app/src/art`.
- **Provider marks** (`src/screens/onboarding/marks/gmail.png`, `google.png`,
  `github.png`): copied unchanged from the old window's `app/src/logos`, where
  Lanes already shows them beside "Connect Gmail" and the sign-in buttons. They
  are Google's and GitHub's marks, used only to name their services.
- **Icons**: `lucide-react` (ISC; some icons MIT from Feather, see below).
- **Sounds**: one. `src/components/ui/assets/intro.m4a` is Zephium's
  onboarding intro (`assets/sounds/intro.m4a`, 7 s AAC), copied unchanged; Morrow
  ships the same file. It is Covered Software under the MPL-2.0: its source is
  the file itself, at https://github.com/zephium-browser/Zephium. Vite bundles
  it into `app/dist/assets`; it plays once, at full volume, as the welcome's
  name forms (on Begin where the browser wants a click first), reduced motion
  or not, as Zephium's does.

## Libraries bundled into the app

| Package | Licence | Copyright |
|---|---|---|
| `react`, `react-dom`, `scheduler` | MIT | Meta Platforms, Inc. and affiliates |
| `@base-ui/react`, `@base-ui/utils` | MIT | Material-UI SAS |
| `@floating-ui/*` | MIT | Floating UI contributors |
| `@tanstack/react-router`, `router-core`, `history`, `store`, `react-store` | MIT | Tanner Linsley |
| `zustand` | MIT | Paul Henschel |
| `tailwind-merge` | MIT | Dany Castillo |
| `clsx` | MIT | Luke Edwards |
| `class-variance-authority` | Apache-2.0 | Joe Bell |
| `lucide-react`, `lucide` | ISC | Lucide Icons and Contributors |
| `morphicons` | MIT | Guillermo |
| `use-sync-external-store`, `reselect`, `cookie-es`, `seroval`, `seroval-plugins` | MIT | their authors |
| `isbot` | Unlicense | public domain |
| `@fontsource-variable/inter` | OFL-1.1 | The Inter Project Authors |
| `unified`, `remark-parse`, `remark-gfm`, `remark-breaks`, `remark-rehype`, `vfile`, `vfile-message`, `hast-util-to-jsx-runtime`, `hast-util-whitespace`, `html-url-attributes`, and their `mdast-util-*`, `micromark*`, `unist-util-*`, `property-information`, `space-separated-tokens`, `comma-separated-tokens`, `style-to-js`, `style-to-object`, `inline-style-parser`, `estree-util-is-identifier-name`, `bail`, `trough`, `devlop`, `extend`, `is-plain-obj`, `zwitch`, `ccount`, `longest-streak`, `markdown-table`, `trim-lines`, `character-entities*`, `decode-named-character-reference`, `parse-entities`, `stringify-entities`, `escape-string-regexp` (the chat's markdown, as t3code renders it) | MIT | Titus Wormer and the unified collective; their authors |
| `@ungap/structured-clone` | ISC | Andrea Giammarchi |
| Tailwind CSS (build-time; its preflight is in the CSS) | MIT | Tailwind Labs, Inc. |

The MIT texts of these packages are the same as t3code's below with their own
copyright lines; each package's `LICENSE` is in `app/node_modules/<package>`.

---

## Licence texts

### t3code (MIT)

```
MIT License

Copyright (c) 2026 T3 Tools Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### opencode (MIT)

```
MIT License

Copyright (c) 2025 opencode

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Inter (SIL Open Font License 1.1), as @fontsource-variable/inter ships it

```
Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) Inter-Italic[opsz,wght].ttf: Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

### lucide-react (ISC)

```
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### class-variance-authority (Apache License 2.0)

```
Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   Copyright 2022 Joe Bell

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### Mozilla Public License 2.0 (Zephium)

The full text is at https://mozilla.org/MPL/2.0/ and in the Zephium
repository's `LICENSE`. Every file here that contains Zephium's code carries
the MPL's Exhibit A notice at its top and names the upstream file it comes
from. Those files are the source form (MPL 3.1); the built app (`app/dist`,
`server/web`) is their executable form, and this repository is where its
recipients can get the source (MPL 3.2(a)).
