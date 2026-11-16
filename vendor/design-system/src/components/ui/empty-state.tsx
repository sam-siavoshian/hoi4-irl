// Nothing here yet, said plainly, with the one action that fixes it. The API
// is Morrow's (sam-siavoshian/morrow web/src/components/ui/empty-state.tsx,
// the owner's own repo: icon, title, description, action); the drawing is
// t3code's Empty (./empty.tsx: the icon on a fanned stack of tiles, the title,
// the muted description), as Connections, Leads and Overview already composed
// it by hand (components/connections/ScreenStates.tsx `ScreenEmpty`, Overview's
// `Message`). Changes: t3code's sizes (`compact`, `default`, `hero`), `media`
// to drop the tile stack, and Zephium's settle-in on arrival (`arrive`).
// Rest props (data-testid, data-*) land on the outer element.

import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty";

export type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  /** A lucide icon element. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Usually one Button: the next thing to do. */
  action?: ReactNode;
  size?: "compact" | "default" | "hero";
  /** `icon` draws t3code's tile stack behind the icon; `plain` shows it bare. */
  media?: "icon" | "plain";
  /** Settle in on arrival (Zephium). */
  arrive?: boolean;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
  media = "icon",
  arrive = true,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Empty size={size} className={cn(arrive && "animate-settle", className)} {...props}>
      <EmptyHeader>
        {icon ? <EmptyMedia variant={media === "icon" ? "icon" : "default"}>{icon}</EmptyMedia> : null}
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
