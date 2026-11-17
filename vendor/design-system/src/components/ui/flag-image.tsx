// A flag as a picture: real artwork in an `<img>`, never shapes drawn in code.
// ARTESH's vendored copy (not in Lanes). Two looks. `circle` is the Avatar's
// treatment (./avatar.tsx: a round crop, `object-cover`, the same sizes) for a
// flag standing where a face would, in a PersonRow or a row's media. `rect` is
// the whole flag at its own proportions, as high as a `circle` of the same size
// is, with the swatch radius. Both carry a faint rim inside the edge, so a white
// stripe does not melt into a light card. Unlike Avatar the picture does not
// fade in: a page rendered on the server shows it before any script runs. A
// picture that is missing or fails leaves `fallback` (or the plain fill).

import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";

export const flagImageVariants = cva("relative inline-flex shrink-0 overflow-hidden bg-fill select-none", {
  variants: {
    shape: {
      /** The Avatar's round crop. */
      circle: "aspect-square rounded-full",
      /** The whole flag, at its own proportions. */
      rect: "rounded-swatch",
    },
    size: {
      /** A footer's or a chip's mark (20px). */
      xs: "h-5",
      /** Beside a line of text (24px). */
      sm: "h-6",
      /** A row's media, Avatar `md` (32px). */
      md: "h-8",
      /** A picker's thumb (36px). */
      lg: "h-9",
      /** A header's lockup, Avatar `lg` (40px). */
      xl: "h-10",
    },
  },
  defaultVariants: { shape: "circle", size: "md" },
});

const PIXELS = { xs: 20, sm: 24, md: 32, lg: 36, xl: 40 } as const;

export type FlagImageProps = Omit<ComponentProps<"span">, "children"> & VariantProps<typeof flagImageVariants> & {
  /** The picture: a raster file (PNG or WebP). */
  src: string;
  /** Other widths of the same picture, as an `<img srcset>` with `w` descriptors. */
  srcSet?: string | undefined;
  /** The flag's proportions, width over height (1.5 for 3:2). */
  ratio?: number | undefined;
  /** Where a round crop looks, as parts of the flag from its top left (`[0.5, 0.5]` is the middle). */
  focus?: readonly [number, number] | undefined;
  /** Spoken name ("Flag of France"). Decorative without it. */
  label?: string | undefined;
  /** What stands there when the picture is missing or does not load. */
  fallback?: ReactNode;
  className?: string | undefined;
};

export function FlagImage({ src, srcSet, ratio = 1.5, focus, label, fallback, shape, size, className, ...props }: FlagImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const img = useRef<HTMLImageElement>(null);
  // A picture that failed before the page was hydrated never fires onError: look once.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(src);
  }, [src]);
  const round = (shape ?? "circle") === "circle";
  const px = PIXELS[size ?? "md"];
  const wide = Math.max(1, Math.round(px * ratio));
  const broken = failed === src;
  return (
    <span
      data-slot="flag-image"
      data-shape={round ? "circle" : "rect"}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...props}
      className={cn(flagImageVariants({ shape, size }), className)}
      style={round ? undefined : { aspectRatio: String(ratio) }}
    >
      {broken ? fallback : (
        <img
          ref={img}
          src={src}
          {...(srcSet ? { srcSet, sizes: `${wide}px` } : {})}
          alt=""
          width={wide}
          height={px}
          decoding="async"
          draggable={false}
          onError={() => setFailed(src)}
          className={cn("size-full", round ? "object-cover" : "object-fill")}
          style={round && focus ? { objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%` } : undefined}
        />
      )}
      <span aria-hidden className={cn("pointer-events-none absolute inset-0 ring-1 ring-border ring-inset", round ? "rounded-full" : "rounded-swatch")} />
    </span>
  );
}
