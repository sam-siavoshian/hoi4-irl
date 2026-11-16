// A site's mark, for the sites the owner signed in to on their Lanes computer: the channel's own
// logo for a site Lanes knows (Reddit, LinkedIn, X, Gmail), else the site's own favicon as the
// kernel read it, else a globe. LogoTile's look, so it sits beside Gmail's in Connections.
//
// @sam/design-system pattern. Copied from Lanes app/ui/src/components/ui/site-logo.tsx. Changes: the
// logos Lanes ships for the sites it knows (ChannelLogo's map of Gmail, Outlook, X, Reddit and
// LinkedIn PNGs) are product data and third-party marks, so they are not in this package; a
// project passes its own as `logos` (a domain to its mark). Everything else is as it was.

import { GlobeIcon } from "lucide-react";
import { useState } from "react";

import type { VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { LogoTile, logoTileVariants } from "../components/ui/logo-tile";

/** A site's own mark, as a project knows it: the image, and whether a black mark turns white on a dark page (X's). */
export interface SiteMark {
  src: string;
  invertInDark?: boolean | undefined;
}

/** The domains a project has a mark for: `{ "x.com": { src: xLogo, invertInDark: true } }`. */
export type SiteMarks = Readonly<Record<string, SiteMark>>;

export function siteMark(site: string, logos: SiteMarks | undefined): SiteMark | null {
  return logos?.[site] ?? null;
}

export function SiteLogo({
  site,
  icon,
  logos,
  variant = "tile",
  className,
}: {
  /** The registrable domain: "linkedin.com". */
  site: string;
  /** The site's favicon (a URL), when the kernel has one. */
  icon?: string | null | undefined;
  /** The marks this project knows, by domain; a site in it shows its mark instead of its favicon. */
  logos?: SiteMarks | undefined;
  className?: string | undefined;
} & Pick<VariantProps<typeof logoTileVariants>, "variant">) {
  const [failed, setFailed] = useState(false);
  const known = siteMark(site, logos);
  if (known) {
    return <LogoTile src={known.src} variant={variant} invertInDark={known.invertInDark === true} className={className} />;
  }
  return (
    <span
      aria-hidden
      data-slot="logo-tile"
      data-site-logo={icon && !failed ? "icon" : "globe"}
      className={cn(logoTileVariants({ variant }), "text-muted-foreground [&>svg]:size-4", className)}
    >
      {icon && !failed ? (
        <img src={icon} alt="" className="object-contain" draggable={false} onError={() => setFailed(true)} />
      ) : (
        <GlobeIcon />
      )}
    </span>
  );
}
