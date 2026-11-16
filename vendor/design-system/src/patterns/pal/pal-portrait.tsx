// The owner's pal, drawn: one of the faces' looks (components/agents/faces.ts,
// the same drawing the Agents window and the lifecycle emails use) wearing
// one of its still expressions. Lanes' own.
//
//   PalFace      the face alone, as an <img>, at any width: a thumbnail in a
//                choice, a mark beside words. Decorative unless it has `label`.
//   PalPortrait  the face large, standing on a soft glow with its shadow on
//                the ground, and its name under it: "Make your pal"'s live
//                preview. `backdrop`: `none` (on the sky already: first run),
//                `sky` (its own patch of sky in a rounded panel: Settings).
//                A new look lands with a small spring (`key` it by the look);
//                at rest it floats, slowly. Reduced motion: it stands still.

import { faceUrl, type Expression, type Look } from "./faces";
import { cn } from "../../lib/utils";

import { SkyBackdrop } from "../../components/ui/sky-backdrop";

import "./pal-portrait.css";

const RATIO = 120 / 133;

export function PalFace({
  look,
  expression = "rest",
  width = 40,
  label,
  className,
}: {
  look: Look;
  expression?: Expression;
  /** Its width in px; the height follows the drawing (133 by 120). */
  width?: number;
  /** Spoken: without it the face is decoration beside words that say what it is. */
  label?: string;
  className?: string;
}) {
  return (
    <img
      src={faceUrl(look, expression)}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      draggable={false}
      decoding="async"
      width={width}
      height={Math.round(width * RATIO)}
      className={cn("shrink-0 select-none", className)}
      data-slot="pal-face"
    />
  );
}

export function PalPortrait({
  look,
  expression = "rest",
  name,
  label,
  size = "hero",
  backdrop = "none",
  className,
}: {
  look: Look;
  expression?: Expression;
  /** Its name, under it (empty: nothing is written). */
  name?: string;
  /** Spoken, for the picture: "Your pal: a lilac pebble". */
  label: string;
  /** `hero` (160px, first run), `lg` (120px, Settings). */
  size?: "hero" | "lg";
  backdrop?: "none" | "sky";
  className?: string;
}) {
  const width = size === "hero" ? 160 : 120;
  return (
    <figure
      data-slot="pal-portrait"
      data-size={size}
      data-backdrop={backdrop}
      className={cn(backdrop === "sky" && "relative isolate overflow-hidden", className)}
    >
      {backdrop === "sky" ? <SkyBackdrop placement="fill" horizon={96} /> : null}
      <span data-slot="pal-portrait-stage">
        <span data-slot="pal-portrait-glow" aria-hidden="true" />
        <span data-slot="pal-portrait-float">
          <PalFace
            key={`${look.shape}/${look.color}/${look.eyes}/${expression}`}
            look={look}
            expression={expression}
            width={width}
            label={label}
            className="pal-portrait-face"
          />
        </span>
        <span data-slot="pal-portrait-shadow" aria-hidden="true" />
      </span>
      {name ? (
        <figcaption data-slot="pal-portrait-name" data-glass-text={backdrop === "none" ? "" : undefined}>
          {name}
        </figcaption>
      ) : null}
    </figure>
  );
}
