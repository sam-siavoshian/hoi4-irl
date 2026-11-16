// Copied from pingdotgg/t3code apps/web/src/components/AppRouteModal.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: in the kit, so it takes `onClosed` (where to go once it has
// closed: components/shell/mainAppLocation.ts's useCloseAppModal for
// Settings) instead of importing the router's return location itself;
// Settings is the only page it holds (t3code also opens Usage in it); no
// Electron drag-region opt-out; its open and close ride Zephium's motion
// tokens: the `motion-dialog` surface, a large one (`data-size="large"`), from
// its trigger (design/motion/README.md), where t3code wrote `duration-150`.

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { Button } from "./button";
import { DialogBackdrop } from "./dialog";
import { mergeRefs, useTriggerOrigin } from "./motion";
import { Tooltip, TooltipPopup, TooltipTrigger } from "./tooltip";

/**
 * Large modal for the Settings routes. Esc, the close button, or a press on the
 * backdrop returns to the page that opened it. Keyboard guards that skip dialogs exempt
 * `[data-app-modal]`, because these pages own their shortcuts.
 */
export function AppRouteModal({
  label,
  onClosed,
  children,
}: {
  label: string;
  /** Once it has closed: go back to the page that opened it. */
  onClosed: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  // Text selection that ends on the backdrop is not a dismissal.
  const backdropPressRef = useRef(false);
  // Focus the surface, not its first control: no stray focus ring, no phone keyboard.
  // On close, leave focus alone; returning it to the opener paints a focus ring.
  const popupRef = useRef<HTMLDivElement>(null);
  // It grows from the control that opened it, and goes back to it.
  const origin = useTriggerOrigin<HTMLDivElement>();

  return (
    <DialogPrimitive.Root
      open={open}
      // Portaled layers outside this tree (toasts, confirm dialogs) are not backdrop presses.
      disablePointerDismissal
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        // Closing unmounts a focused field without a blur, so commit-on-blur rows would
        // drop what was typed. Blur first so they commit.
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && popupRef.current?.contains(focused)) focused.blur();
        setOpen(false);
      }}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) onClosed();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogBackdrop />
        <DialogPrimitive.Viewport
          className="fixed inset-0 z-50 flex items-center justify-center sm:p-6 lg:p-10"
          onPointerDown={(event) => {
            backdropPressRef.current = event.target === event.currentTarget;
          }}
          onClick={(event) => {
            if (backdropPressRef.current && event.target === event.currentTarget) setOpen(false);
            backdropPressRef.current = false;
          }}
        >
          <DialogPrimitive.Popup
            ref={mergeRefs(popupRef, origin)}
            data-size="large"
            initialFocus={popupRef}
            finalFocus={false}
            aria-label={label}
            data-slot="dialog-popup"
            data-app-modal=""
            className="motion-dialog relative flex size-full min-h-0 min-w-0 flex-col overflow-hidden bg-background text-foreground outline-none max-sm:pt-safe max-sm:pb-safe sm:max-h-[60rem] sm:max-w-[80rem] sm:rounded-2xl sm:border sm:shadow-2xl/40"
          >
            {children}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function AppRouteModalClose() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<DialogPrimitive.Close aria-label="Close" render={<Button size="icon-sm" variant="ghost" />} />}
      >
        <XIcon />
      </TooltipTrigger>
      <TooltipPopup side="bottom">Close (Esc)</TooltipPopup>
    </Tooltip>
  );
}
