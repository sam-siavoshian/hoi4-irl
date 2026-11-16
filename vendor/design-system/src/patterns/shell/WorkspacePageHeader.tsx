// Copied from pingdotgg/t3code apps/web/src/components/WorkspacePageHeader.tsx (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: imports through ~/; the band's height is the `topbar` token
// (design/lanes.css: --workspace-topbar-height), named where t3code wrote it
// as an arbitrary value.

import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../lib/utils";
import { COLLAPSED_SIDEBAR_TITLEBAR_INSET_CLASS } from "../../lib/workspaceTitlebar";

export function WorkspacePageHeader({
  electron = false,
  reserveNativeControls = electron,
  className,
  ...props
}: ComponentPropsWithoutRef<"header"> & {
  readonly electron?: boolean;
  readonly reserveNativeControls?: boolean;
}) {
  return (
    <header
      className={cn(
        "flex h-topbar! min-h-topbar! max-h-topbar! shrink-0 items-center gap-3 pl-(--workspace-gutter-start) pr-(--workspace-gutter-end) [[data-panel-animations=true]_&]:motion-safe:transition-[padding-left,padding-right] [[data-panel-animations=true]_&]:motion-safe:duration-(--panel-animation-duration) [[data-panel-animations=true]_&]:motion-safe:ease-out",
        electron && "drag-region",
        reserveNativeControls && "wco:pr-(--workspace-native-controls-inset)",
        COLLAPSED_SIDEBAR_TITLEBAR_INSET_CLASS,
        className,
      )}
      {...props}
    />
  );
}
