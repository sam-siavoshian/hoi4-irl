// Words to read at length: a page of documentation, a guide, a list of questions and answers.
// ARTESH's vendored copy (the site's content pages: the countries, self-hosting, the AI providers, how it works,
// the FAQ). The kit had type for a screen (SectionHeader, ListRow) and for a short description, but nothing for a
// page that is mostly sentences. Built only from the kit's tokens: the reading size and its leading, the headline
// size for a section, the foreground and muted inks, the link look of Button `link` (underlined on hover, the
// underline 4px under), `ProblemDetails`' plate for inline code, and the hairline between a table's rows that
// `ListGroup divided` uses.
//
//   Prose        the column: h2, h3, p, ul, ol, li, a, code, strong, blockquote inside it are styled; `size`
//                `md` (the reading size, default) or `sm` (a card's worth of text)
//   ProseTable   a table of facts inside it: `head` (the column names), `rows` (cells: strings or nodes),
//                `label` (its spoken name). A table wider than the column scrolls sideways inside its own
//                frame; the page never does.
//
// Headings keep their ids (an anchor to a section) and leave room above for a fixed header when jumped to.

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../../lib/utils";

const proseVariants = cva(
  [
    "min-w-0 max-w-prose text-pretty text-foreground",
    "[&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:scroll-mt-20 [&_h2]:text-headline [&_h2]:leading-tight [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-balance first:[&_h2]:mt-0",
    "[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:scroll-mt-20 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-balance",
    "[&_p]:my-3 [&_p]:text-muted-foreground",
    "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5 [&_ul]:text-muted-foreground [&_ul]:marker:text-faint",
    "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:ps-5 [&_ol]:text-muted-foreground [&_ol]:marker:text-faint",
    "[&_li]:ps-1 [&_li>p]:my-1",
    "[&_strong]:font-semibold [&_strong]:text-foreground",
    "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-4 [&_a:hover]:decoration-foreground",
    "[&_:not(pre)>code]:rounded-inset [&_:not(pre)>code]:bg-fill [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-sm [&_:not(pre)>code]:text-foreground",
    "[&_blockquote]:my-4 [&_blockquote]:rounded-card [&_blockquote]:bg-fill [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-foreground",
    "[&>[data-slot=code-block]]:my-4 [&>[data-slot=prose-table]]:my-4",
  ],
  {
    variants: {
      size: {
        md: "text-reading leading-relaxed",
        sm: "text-sm leading-relaxed",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type ProseProps = ComponentPropsWithoutRef<"div"> & VariantProps<typeof proseVariants>;

/** A column of words to read: its headings, paragraphs, lists, links and inline code are styled by the kit. */
export function Prose({ size, className, ...props }: ProseProps) {
  return <div data-slot="prose" className={cn(proseVariants({ size }), className)} {...props} />;
}

export type ProseTableProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  head: readonly ReactNode[];
  rows: readonly (readonly ReactNode[])[];
  /** The table's spoken name, and its caption for a screen reader. */
  label: string;
};

/** A table of facts in a Prose column. It scrolls sideways inside its frame when it is wider than the column. */
export function ProseTable({ head, rows, label, className, ...props }: ProseTableProps) {
  return (
    <div
      data-slot="prose-table"
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn("max-w-full overflow-x-auto rounded-card border border-border/60 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    >
      <table className="w-full border-collapse text-start text-sm leading-normal">
        <caption className="sr-only">{label}</caption>
        <thead className="bg-fill">
          <tr>
            {head.map((cell, at) => (
              <th key={at} scope="col" className="px-3 py-2 text-start align-bottom text-xs font-medium whitespace-nowrap text-muted-foreground">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-border/50">
          {rows.map((row, at) => (
            <tr key={at}>
              {row.map((cell, k) =>
                k === 0 ? (
                  <th key={k} scope="row" className="px-3 py-2 text-start align-top font-medium text-foreground">
                    {cell}
                  </th>
                ) : (
                  <td key={k} className="px-3 py-2 align-top text-muted-foreground">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
