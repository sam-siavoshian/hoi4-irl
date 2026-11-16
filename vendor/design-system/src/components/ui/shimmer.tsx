// Text that is still being worked on: a light sweeps across it. Two recipes,
// both already in the design system and both re-used here unchanged:
//
//   sweep  anomalyco/opencode packages/ui/src/typography/text-shimmer/text-shimmer.tsx
//          (design/opencode/TextShimmer.tsx; CSS in design/opencode/micro.css):
//          per-word highlight that fades out over 220ms when the work stops.
//          opencode's "Thinking…".
//   band   zephium-browser/website components/island/shimmer.tsx, by way of
//          sam-siavoshian/morrow shimmer-text.tsx (design/morrow/ShimmerText.tsx):
//          one band sliding over the words, transform only. Zephium's island.
//
// `Shimmer` picks one by `variant`, so a screen never imports either directly.

import { ShimmerText } from "../../design/morrow/ShimmerText";
import { TextShimmer } from "../../design/opencode/TextShimmer";

type ShimmerProps = {
  /** The words. */
  text: string;
  /** While true the light runs; false leaves plain text. */
  active?: boolean;
  /** `sweep` (opencode, the default) or `band` (Zephium's island). */
  variant?: "sweep" | "band";
  className?: string;
};

export function Shimmer({ text, active = true, variant = "sweep", className }: ShimmerProps) {
  if (variant === "band") {
    return (
      <ShimmerText active={active} {...(className ? { className } : {})}>
        {text}
      </ShimmerText>
    );
  }
  return <TextShimmer text={text} active={active} {...(className ? { className } : {})} />;
}

export { ShimmerText, TextShimmer };
