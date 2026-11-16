// The sky behind a screen. The picture is Morrow's baked sky
// (sam-siavoshian/morrow web/src/components/sky/static-sky.tsx, here
// design/morrow/Sky.tsx: `BakedSky`, `Frost`), placed after Zephium's new-tab
// mockup. What this adds is where it stands, which every screen on the sky
// wrote by hand: the chat's hero band and the Agents window's header band
// (each a top band fading to the page through a mask, ChatScreen.tsx and
// AgentsScreen.tsx), a panel's full box, and first run's whole window
// (OnboardingScreen.tsx). The bands' heights and fades are those screens'
// numbers, unchanged, but for the chat's band, Morrow's +15.5rem (it was
// +18rem; docs/design-audit/morrow.md). `home` is the chat's main page once
// it shows its ideas: the sky behind the whole screen, so the ideas' glass
// stands on it rather than on the page below the band.

import { cva, type VariantProps } from "class-variance-authority";

import { BakedSky, Frost } from "../../design/morrow/Sky";
import type { Scene } from "../../design/morrow/scenes";
import { cn } from "../../lib/utils";

export const skyBackdropVariants = cva("pointer-events-none -z-10", {
  variants: {
    placement: {
      /** The box it is in (`relative isolate`), edge to edge. */
      fill: "absolute inset-0",
      /** The whole window, behind everything (first run). */
      screen: "fixed inset-0",
      /** The chat's hero alone: a tall band under the header, fading to the page at 70%; Morrow's team-home
       *  band height (composer.module.css: the header's room + 15.5rem). */
      hero: "absolute inset-x-0 top-0 h-[calc(max(3.5rem,min(16vh,9rem))+15.5rem)] [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]",
      /** The chat's main page with its ideas: the whole screen, fading to the page from 74% so the
       *  composer stands on the page, and the ideas' glass on the sky. */
      home: "absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_74%,transparent)]",
      /** The Agents window: a band behind the header and the totals, fading at 58%. */
      header: "absolute inset-x-0 top-0 h-[15.5rem] [mask-image:linear-gradient(to_bottom,#000_58%,transparent)]",
    },
  },
  defaultVariants: { placement: "fill" },
});

export type SkyBackdropProps = VariantProps<typeof skyBackdropVariants> & {
  /** Which sky. Left out, it follows `data-sky` (the clock's, or a pinned one). */
  scene?: Scene;
  /** Where the horizon sits, as a percentage of the box's height. */
  horizon?: number;
  /** Fade in on mount. */
  arrive?: boolean;
  className?: string;
};

/** The sky behind a screen or a panel; place it as the first child of a `relative isolate` box. */
export function SkyBackdrop({ placement, scene, horizon, arrive, className }: SkyBackdropProps) {
  return (
    <div aria-hidden="true" data-slot="sky-backdrop" className={cn(skyBackdropVariants({ placement }), className)}>
      <BakedSky
        {...(scene ? { scene } : {})}
        {...(horizon !== undefined ? { horizon } : {})}
        {...(arrive ? { arrive } : {})}
      />
    </div>
  );
}

export { BakedSky, Frost };
