// Rows in a rounded group, under a heading: the layout of every settings-like
// screen. From pingdotgg/t3code apps/web/src/components/settings/settingsLayout.tsx
// and SettingsGroup.tsx (MIT, Copyright (c) T3 Tools Inc.; full notice in
// app/ui/THIRD_PARTY_NOTICES.md): SettingsGroup, SettingsRow and
// SettingsSection, without t3code's settings scopes, inheritance markers,
// managed-policy locks and search targets (Lanes has one owner and one
// kernel). Lanes had two copies of these (components/connections/
// SettingsLayout.tsx and screens/settings/layout.tsx); this is the one.
// Changes:
//   * ListRow takes a `media` slot (a logo, an avatar) before its title.
//   * ListRow's `variant`: `setting` is t3code's row (a title that wraps, the
//     status under it as a block); `item` is a row about a thing (an account,
//     a service): the title on one line, the status a line of dot, word and
//     badges, the controls free to wrap, and colour that eases.
//   * `hover`: opencode's overlay hover, for rows you can act on.
//   * ListSection's header is ./section-header.tsx (with a description).
//   * `inline` (ARTESH's vendored copy): the control stays beside the title at any width, for a short control
//     (a switch, a segmented choice, two small buttons) in a narrow panel, where the row would otherwise stack.
//   * ListRowButton (ARTESH's vendored copy): an `item` row that is one press, a <button> with the row's own
//     type and gutters, the overlay hover, and a chevron (or any `trailing`) at its end.
//   * ListRowDisclosure (ARTESH's vendored copy): a row that opens in place, a question and its answer. The
//     row's own type and gutters on ./collapsible.tsx: the title is the press, a chevron turns as it opens,
//     and the answer wipes in under it (rule 17). A full-width row, so it answers with its fill, not a scale.

import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible";
import { SectionHeader } from "./section-header";

export const listGroupVariants = cva("relative overflow-visible text-foreground", {
  variants: {
    variant: {
      /** t3code's settings group: a quiet bordered box. */
      grouped: "rounded-xl border border-border/60 bg-card/40 shadow-xs/5",
      /** No box: rows stand on the page. */
      plain: "space-y-1",
    },
    /** Hairlines between the rows (grouped only). */
    divided: { true: "", false: "" },
  },
  compoundVariants: [
    {
      variant: "grouped",
      divided: true,
      className: "[&>*+*]:border-t [&>*+*]:border-border/50 [&>[data-slot=settings-row]]:rounded-none",
    },
  ],
  defaultVariants: { variant: "grouped", divided: true },
});

export function ListGroup({
  variant,
  divided,
  className,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof listGroupVariants>) {
  return <div data-slot="settings-group" {...props} className={cn(listGroupVariants({ variant, divided }), className)} />;
}

export const listRowVariants = cva(
  "group/settings-row @container/settings-row rounded-xl px-3 sm:px-4 aria-disabled:opacity-64 aria-disabled:[&_*]:text-muted-foreground",
  {
    variants: {
      variant: {
        setting: "",
        item: "transition-colors duration-(--motion-fast)",
      },
      /** opencode's overlay hover, for a row you can act on. */
      hover: {
        true: "hover:bg-fill-hover/40",
        false: "",
      },
    },
    defaultVariants: { variant: "setting", hover: false },
  },
);

export type ListRowProps = Omit<ComponentPropsWithoutRef<"div">, "title"> &
  VariantProps<typeof listRowVariants> & {
    title: ReactNode;
    description?: ReactNode;
    /** A line under the description: a state, a save's result, a failure. */
    status?: ReactNode;
    /** Before the title: a logo, an avatar. */
    media?: ReactNode;
    /** On the right: a switch, a button, a select. */
    control?: ReactNode;
    /** Under the row, inside it: a list, a form. */
    children?: ReactNode;
    /** Keep the control beside the title at any width (a short control in a narrow panel). */
    inline?: boolean;
  };

export function ListRow({
  title,
  description,
  status,
  media,
  control,
  children,
  variant,
  hover,
  inline = false,
  className,
  ...rowProps
}: ListRowProps) {
  const item = variant === "item";
  return (
    <div
      {...rowProps}
      data-slot="settings-row"
      className={cn(listRowVariants({ variant, hover }), children ? "pt-3 pb-3" : "py-3", className)}
    >
      <div
        className={
          inline
            ? "flex items-center gap-3"
            : "flex flex-col gap-3 @min-[32rem]/settings-row:grid @min-[32rem]/settings-row:grid-cols-[minmax(0,1fr)_minmax(10rem,auto)] @min-[32rem]/settings-row:items-center @min-[32rem]/settings-row:gap-8"
        }
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {media ? <div className="flex shrink-0 items-center pt-0.5">{media}</div> : null}
          <div className="min-w-0 flex-1 space-y-1">
            {item ? (
              <div className="flex min-h-5 min-w-0 items-center gap-1.5">
                <h3 className="min-w-0 truncate text-sm font-medium text-foreground">{title}</h3>
              </div>
            ) : (
              <h3 className="flex min-h-5 items-center text-sm font-medium text-foreground">{title}</h3>
            )}
            {description ? (
              <p className="max-w-2xl text-balance text-xs leading-normal text-muted-foreground">{description}</p>
            ) : null}
            {status ? (
              <div
                className={cn(
                  "pt-0.5 text-xs text-muted-foreground",
                  item && "flex flex-wrap items-center gap-1.5",
                )}
              >
                {status}
              </div>
            ) : null}
          </div>
        </div>
        {control ? (
          <div
            className={cn(
              inline
                ? "flex shrink-0 items-center justify-end gap-2"
                : "flex w-full min-w-0 shrink-0 items-center gap-2 @min-[32rem]/settings-row:w-auto @min-[32rem]/settings-row:justify-end",
              item && !inline && "flex-wrap",
            )}
          >
            {control}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export type ListSectionProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  title: ReactNode;
  /** One line under the title. */
  description?: ReactNode;
  icon?: ReactNode;
  /** On the right of the title: an add button, a save's status line. */
  headerAction?: ReactNode;
  variant?: VariantProps<typeof listGroupVariants>["variant"];
  children: ReactNode;
};

/** A heading and its group of rows (t3code's SettingsSection). */
export function ListSection({
  title,
  description,
  icon,
  headerAction,
  variant,
  children,
  className,
  ...sectionProps
}: ListSectionProps) {
  return (
    <section data-slot="settings-section" {...sectionProps} className={cn("space-y-2.5", className)}>
      <SectionHeader as="h2" title={title} description={description} icon={icon} action={headerAction} />
      <ListGroup variant={variant}>{children}</ListGroup>
    </section>
  );
}

export type ListRowButtonProps = Omit<ComponentPropsWithoutRef<"button">, "title" | "type"> & {
  title: ReactNode;
  description?: ReactNode;
  /** A line under the description: a dot and its word, badges. */
  status?: ReactNode;
  /** Before the title: a logo, an icon. */
  media?: ReactNode;
  /** At the end, in place of the chevron; `null` for nothing. */
  trailing?: ReactNode;
  /** Under the row, inside the press: a meter. */
  children?: ReactNode;
};

/** A row that is one press: it opens the thing it names. The `item` row's look on a <button>. */
export function ListRowButton({
  title,
  description,
  status,
  media,
  trailing,
  children,
  className,
  ...props
}: ListRowButtonProps) {
  return (
    <button
      type="button"
      {...props}
      data-slot="settings-row"
      className={cn(
        listRowVariants({ variant: "item", hover: true }),
        "block w-full cursor-pointer py-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-64",
        className,
      )}
    >
      <span className="flex items-center gap-3">
        {media ? <span className="flex shrink-0 items-center text-muted-foreground">{media}</span> : null}
        <span className="block min-w-0 flex-1 space-y-1">
          <span className="block truncate text-sm font-medium text-foreground">{title}</span>
          {description ? (
            <span className="block text-xs leading-normal text-muted-foreground">{description}</span>
          ) : null}
          {status ? (
            <span className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">{status}</span>
          ) : null}
        </span>
        {trailing === undefined ? (
          <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground/70" />
        ) : (
          trailing
        )}
      </span>
      {children}
    </button>
  );
}

export type ListRowDisclosureProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  /** The question: the row's title, and the press that opens it. */
  title: ReactNode;
  /** The answer, shown under the title when open. */
  children: ReactNode;
  defaultOpen?: boolean;
};

/** A row that opens in place: a question, and its answer under it. */
export function ListRowDisclosure({ title, children, defaultOpen = false, className, ...props }: ListRowDisclosureProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      {...props}
      data-slot="settings-row"
      className={cn("group/settings-row rounded-xl", className)}
    >
      <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-start outline-none transition-colors duration-(--motion-fast) hover:bg-fill-hover/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4 [&[data-panel-open]>svg]:rotate-180">
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{title}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground/70 transition-transform duration-(--motion-base) ease-out"
        />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="max-w-prose px-3 pb-4 text-sm leading-relaxed text-pretty text-muted-foreground sm:px-4">{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
