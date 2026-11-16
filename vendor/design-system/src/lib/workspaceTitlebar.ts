// Copied from pingdotgg/t3code apps/web/src/workspaceTitlebar.ts (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.
// Changes: the inset is the `titlebar-content` token (design/lanes.css), named
// where t3code wrote var(--workspace-titlebar-content-left) as an arbitrary value.


export const COLLAPSED_SIDEBAR_TITLEBAR_INSET_CLASS =
  "[[data-sidebar-state=collapsed]_&]:pl-titlebar-content max-md:[[data-sidebar-state=expanded]_&]:pl-titlebar-content";
