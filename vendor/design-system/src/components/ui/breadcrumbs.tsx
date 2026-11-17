// Where a page sits on a site: its parents as links, then the page itself.
// ARTESH's vendored copy (the site's content pages, under their header). The kit's sidebar says where you are in an
// app; a site read page by page had nothing. A `nav` named "Breadcrumb" holding an ordered list: each parent is a
// link in the muted ink that turns to the foreground on hover (Button `link`'s underline), a chevron between them
// (lucide, hidden from screen readers), and the current page in the foreground with `aria-current="page"`.
// A long trail wraps; it never pushes the page sideways.
//
//   items   [{ label, href }] from the top down; the last one is the current page (its href is not used)

import { ChevronRightIcon } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../lib/utils";

export type BreadcrumbItem = { label: string; href?: string };

export type BreadcrumbsProps = Omit<ComponentPropsWithoutRef<"nav">, "children"> & {
  items: readonly BreadcrumbItem[];
};

export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" data-slot="breadcrumbs" className={cn("min-w-0", className)} {...props}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        {items.map((item, at) => {
          const last = at === items.length - 1;
          return (
            <li key={`${at}-${item.label}`} className="flex min-w-0 items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {item.label}
                </span>
              ) : (
                <>
                  <a href={item.href} className="truncate underline-offset-4 transition-colors duration-(--motion-fast) hover:text-foreground hover:underline">
                    {item.label}
                  </a>
                  <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0 text-faint" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
