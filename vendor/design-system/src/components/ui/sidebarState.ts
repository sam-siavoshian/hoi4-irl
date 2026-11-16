// Copied from pingdotgg/t3code apps/web/src/components/ui/sidebarState.ts (https://github.com/pingdotgg/t3code).
// MIT License, Copyright (c) T3 Tools Inc. Full notice in app/ui/THIRD_PARTY_NOTICES.md.


export type ResponsiveSidebarState = "expanded" | "collapsed";

export function resolveSidebarState(input: {
  isMobile: boolean;
  open: boolean;
  openMobile: boolean;
}): ResponsiveSidebarState {
  return (input.isMobile ? input.openMobile : input.open) ? "expanded" : "collapsed";
}
