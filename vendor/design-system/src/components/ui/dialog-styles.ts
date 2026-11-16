// Copied from pingdotgg/t3code apps/web/src/components/ui/dialog-styles.ts (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: the motion is the design system's (design/motion/README.md): the
// popup is the `motion-dialog` surface (from 0.95, from its trigger, out 20%
// quicker on the exit curve; DialogPopup puts useTriggerOrigin on it), the
// backdrop `motion-backdrop`, and the slides of a nested dialog or a phone's
// sheet go by --motion-travel, so reduced motion only fades. t3code ran
// both on 200ms ease-in-out from 0.98.


const DIALOG_BACKDROP_BASE_CLASS =
  "motion-backdrop fixed inset-0 z-50";

const DIALOG_BACKDROP_CLASS = `dialog-backdrop ${DIALOG_BACKDROP_BASE_CLASS}`;
const DIALOG_MEDIA_BACKDROP_CLASS = `${DIALOG_BACKDROP_BASE_CLASS} bg-black/75 backdrop-blur-none`;

const DIALOG_POPUP_BASE_CLASS =
  "-translate-y-[calc(1.25rem*var(--nested-dialogs))] relative flex min-h-0 w-full min-w-0 scale-[calc(1-0.1*var(--nested-dialogs))] flex-col opacity-[calc(1-0.1*var(--nested-dialogs))] outline-none motion-dialog will-change-transform data-nested:data-ending-style:translate-y-[calc(2rem*var(--motion-travel))] data-nested:data-starting-style:translate-y-[calc(2rem*var(--motion-travel))] data-nested-dialog-open:origin-top [-webkit-app-region:no-drag]";

const DIALOG_POPUP_CLASS = `dialog-glass ${DIALOG_POPUP_BASE_CLASS} rounded-2xl border`;
// Lanes: the sky behind the whole popup (DialogPopup `variant="sky"` lays a SkyBackdrop in it),
// its words standing on it in the sky's ink, the ideas' liquid glass on top (./suggestion-card.tsx).
const DIALOG_SKY_POPUP_CLASS = `${DIALOG_POPUP_BASE_CLASS} isolate overflow-hidden rounded-2xl text-sky-ink shadow-overlay [&_[data-slot=dialog-title]]:sky-text [&_[data-slot=dialog-description]]:text-sky-ink/85 [&_[data-slot=dialog-description]]:sky-text`;
const DIALOG_MEDIA_POPUP_CLASS = `${DIALOG_POPUP_BASE_CLASS} max-h-[92vh] w-auto max-w-[92vw] overflow-visible rounded-none border border-transparent bg-transparent p-0 shadow-none`;

const DIALOG_MOBILE_SHEET_CLASS =
  "max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-t max-sm:border-b-0 max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))] max-sm:data-ending-style:translate-y-[calc(1rem*var(--motion-travel))] max-sm:data-starting-style:translate-y-[calc(1rem*var(--motion-travel))]";

export {
  DIALOG_BACKDROP_CLASS,
  DIALOG_MEDIA_BACKDROP_CLASS,
  DIALOG_MOBILE_SHEET_CLASS,
  DIALOG_POPUP_CLASS,
  DIALOG_MEDIA_POPUP_CLASS,
  DIALOG_SKY_POPUP_CLASS,
};
