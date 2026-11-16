// The band across the top of every section: its title, the radar before it
// while an agent works (`working`), a status after it (Overview's "Live", the
// Agents window's count), actions on the right. t3code's
// WorkspacePageHeader underneath, so it leaves room for the floating sidebar
// toggle when the sidebar is closed. The status and the title are opencode's
// session header (anomalyco/opencode packages/app/src/session/
// session-identity-header.tsx, MIT, Copyright (c) 2025 opencode): the radar
// stands before the title and collapses out without moving it, and the title
// is 13px at weight 530 with -0.04px tracking (design/lanes.css: text-body,
// font-header, tracking-header).
//
// @sam/design-system pattern: Lanes' components/shell/ScreenHeader.tsx. Changes: Lanes' ShellProblems
// (its kernel's connection and sign-in problems) is a `below` slot.

import type { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { WorkspacePageHeader } from "./WorkspacePageHeader";

export function ScreenHeader({
  title,
  working,
  status,
  actions,
  onSky = false,
  below,
  className,
}: {
  title: ReactNode;
  /** Just before the title: the WorkingIndicator while an agent works (opencode's place for it). */
  working?: ReactNode;
  /** After the title: a caption, a StatusLabel, a live summary. */
  status?: ReactNode;
  actions?: ReactNode;
  /** The header stands on the sky (the chat's hero): no rule, sky ink. */
  onSky?: boolean;
  /** @sam/design-system: under the header, once (Lanes' ShellProblems: the connection, being signed out). */
  below?: ReactNode;
  className?: string;
}) {
  return (
    <>
    <WorkspacePageHeader
      reserveNativeControls={false}
      className={cn(onSky ? "text-sky-ink" : "border-b border-border/60 text-foreground", className)}
      data-slot="screen-header"
      data-on-sky={onSky || undefined}
    >
      <div className="flex min-w-0 flex-1 items-center gap-0.5">
        {working}
        <h1
          className={cn("truncate text-body font-header tracking-header", onSky && "sky-text")}
          data-slot="screen-title"
        >
          {title}
        </h1>
        {status}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </WorkspacePageHeader>
    {/* @sam/design-system: Lanes renders <ShellProblems /> here (what affects every screen: the
        connection, being signed out). It reads Lanes' kernel, so a project passes its own as `below`. */}
    {below}
    </>
  );
}
