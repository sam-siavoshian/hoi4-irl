// A bar that floats over the foot of a screen while something is selected or
// unsaved: what it is about, then its actions. t3code's surface glass on
// Zephium's float elevation, rising in on Zephium's curve, as Leads' selection
// bar (screens/leads/LeadsScreen.tsx) and Company's unsaved bar
// (components/company/CompanyPage.tsx) drew it by hand. Moved here; `size`
// keeps each one's spacing. `dock`: `absolute` stands at the foot of its
// parent, which must be `relative` (Leads); `sticky` stays at the foot of the
// scrolling page it ends (Company's unsaved changes); `fixed` stands at the
// foot of the window, over every screen (the analytics consent bar,
// components/consent/AnalyticsConsent.tsx).

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../../lib/utils";

export const floatingBarVariants = cva(
  "pointer-events-auto flex max-w-full items-center rounded-full border border-border/60 py-1 pe-1 text-sm shadow-float surface-glass animate-rise",
  {
    variants: {
      size: {
        /** Leads' selection bar: tight, for a row of small buttons. */
        sm: "gap-1 ps-3.5",
        /** Company's unsaved bar. */
        md: "gap-2 ps-4",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

export function FloatingBar({
  size,
  dock = "absolute",
  className,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof floatingBarVariants> & { dock?: "absolute" | "sticky" | "fixed" }) {
  return (
    <div
      className={cn(
        "pointer-events-none bottom-4 z-20 flex justify-center px-4",
        dock === "sticky" ? "sticky" : dock === "fixed" ? "fixed inset-x-0 z-50" : "absolute inset-x-0",
      )}
      data-slot="floating-bar-dock"
    >
      <div role="toolbar" data-slot="floating-bar" className={cn(floatingBarVariants({ size }), className)} {...props} />
    </div>
  );
}
