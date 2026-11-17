// The heading over a block of a screen. From pingdotgg/t3code
// apps/web/src/components/settings/settingsLayout.tsx (MIT, Copyright (c) T3
// Tools Inc.; full notice in app/ui/THIRD_PARTY_NOTICES.md), its
// SettingsSection header: a title (with an icon) on the left at the rows'
// inset, an action on the right. Changes: a description under the title (as
// Connections and Settings both added it), and three levels, each a heading
// Lanes already drew by hand:
//
//   page     Settings' section head (screens/settings/SettingsScreen.tsx): the
//            section's name, large, and what it is for
//   section  t3code's settings section header (the default)
//   eyebrow  the small capitals over a drawer's block ("About them", LeadDrawer.tsx)
//   step     a question inside a step's panel (About you): a small icon, the
//            words in the reading size at 500, and a hint after them in the
//            muted ink ("Pick any"); never inset
//
// ARTESH's vendored copy adds two levels for a page read from top to bottom (the landing page), and `align`:
//
//   hero     the page's one headline at the hero size, the sentence under it and its actions; never inset
//   display  a band's heading on such a page, at the headline size, and what the band is about; never inset
//   align    `start` (the default) or `center`, for `hero` and `display`; the actions follow it

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../../lib/utils";

const headerVariants = cva("", {
  variants: {
    level: {
      page: "space-y-1",
      section: "flex min-h-7 items-start justify-between gap-4",
      eyebrow: "flex items-center justify-between gap-3",
      step: "flex flex-wrap items-center gap-x-2 gap-y-0.5",
      hero: "flex flex-col gap-4",
      display: "flex flex-col gap-2",
    },
    /** Inset to line up with the rows of a ListGroup under it (t3code's px-3 sm:px-4). */
    inset: {
      true: "px-3 sm:px-4",
      false: "",
    },
    /** `hero` and `display`: the words from the start, or centred over what follows. */
    align: {
      start: "items-start",
      center: "items-center text-center",
    },
  },
  defaultVariants: { level: "section", inset: true },
});

const TITLE = {
  page: "text-xl font-semibold tracking-tight text-foreground",
  section: "flex min-h-7 items-center gap-2 text-base font-semibold text-foreground",
  eyebrow: "flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase",
  step: "flex items-center gap-2 text-reading leading-6 font-medium tracking-tight text-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
  hero: "text-hero font-semibold text-balance text-foreground",
  display: "text-headline leading-tight font-semibold tracking-tight text-balance text-foreground",
} as const;

const DESCRIPTION = {
  page: "text-sm text-muted-foreground",
  section: "max-w-2xl text-xs text-muted-foreground",
  eyebrow: "text-xs text-muted-foreground",
  step: "text-body leading-6 text-muted-foreground",
  hero: "max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg sm:leading-relaxed",
  display: "max-w-prose text-reading leading-relaxed text-pretty text-muted-foreground",
} as const;

export type SectionHeaderProps = Omit<ComponentPropsWithoutRef<"header">, "title"> &
  VariantProps<typeof headerVariants> & {
    title: ReactNode;
    description?: ReactNode;
    /** Before the title: a logo, a lucide icon. */
    icon?: ReactNode;
    /** On the right: a button, a status line. Under the words on `hero` and `display`. */
    action?: ReactNode;
    /** The heading element; `h2` by default, `h3` inside a section. */
    as?: "h1" | "h2" | "h3";
  };

export function SectionHeader({
  title,
  description,
  icon,
  action,
  level,
  inset,
  align,
  as: Heading = "h2",
  className,
  ...props
}: SectionHeaderProps) {
  const at = level ?? "section";
  const resolvedInset = inset ?? (at === "section" || at === "page");
  if (at === "hero" || at === "display") {
    return (
      <header
        data-slot="section-header"
        data-level={at}
        className={cn(headerVariants({ level: at, inset: resolvedInset, align: align ?? "start" }), className)}
        {...props}
      >
        <Heading className={TITLE[at]}>{title}</Heading>
        {description ? <p className={DESCRIPTION[at]}>{description}</p> : null}
        {action ? <div className={cn("flex flex-wrap items-center gap-3 pt-2", (align ?? "start") === "center" ? "justify-center" : "justify-start")}>{action}</div> : null}
      </header>
    );
  }
  if (at === "step") {
    return (
      <header
        data-slot="section-header"
        data-level={at}
        className={cn(headerVariants({ level: at, inset: resolvedInset }), className)}
        {...props}
      >
        <Heading className={TITLE.step}>
          {icon}
          {title}
        </Heading>
        {description ? <p className={DESCRIPTION.step}>{description}</p> : null}
      </header>
    );
  }
  if (at === "page") {
    return (
      <header
        data-slot="section-header"
        data-level={at}
        className={cn(headerVariants({ level: at, inset: resolvedInset }), className)}
        {...props}
      >
        <Heading className={TITLE.page}>{title}</Heading>
        {description ? <p className={DESCRIPTION.page}>{description}</p> : null}
      </header>
    );
  }
  return (
    <header
      data-slot="section-header"
      data-level={at}
      className={cn(headerVariants({ level: at, inset: resolvedInset }), className)}
      {...props}
    >
      <div className={cn("min-w-0", at === "section" && "space-y-0.5")}>
        <Heading className={TITLE[at]}>
          {icon}
          {title}
        </Heading>
        {description ? <p className={DESCRIPTION[at]}>{description}</p> : null}
      </div>
      {at === "section" ? (
        <div className="flex min-h-7 min-w-7 shrink-0 items-center justify-end gap-1">{action}</div>
      ) : action ? (
        <div className="flex shrink-0 items-center gap-1">{action}</div>
      ) : null}
    </header>
  );
}
