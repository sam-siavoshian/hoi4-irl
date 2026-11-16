// opencode's Soft Radar (design/opencode/radar.ts: its layout and keyframes,
// unchanged) drawn as one shared SVG image for the tiles. The header's
// <RadarSpinner> animates 24 rects in the page's own style system, which is
// right for one spinner and wrong for a grid of them: measured in the grid, a
// screen of radars was most of the cost of scrolling (e2e/agents-perf.spec.ts).
// As an image, every tile shows the same picture, whose animation runs inside
// it on one timeline (so every radar is in phase without syncSpinPhase) and
// costs the page no style work. Reduced motion shows the sweep frozen, as the
// spinner does.

import { TILE_RADAR_INK } from "../../design/agents";
import { radarDots, radarKeyframes, radarLoop } from "../../design/opencode/radar";

const urls = new Map<string, string>();

function radarSvg(color: string, still: boolean): string {
  const name = "r";
  const rects = radarDots()
    .map((dot) => {
      const animation =
        still || dot.steady
          ? ""
          : `animation:${name}-${dot.shape} ${radarLoop}s linear ${-radarLoop * (1 - dot.at)}s infinite;`;
      return `<rect x="${dot.x}" y="${dot.y}" width="${dot.size}" height="${dot.size}" rx="${dot.size * 0.24}" style="opacity:${dot.still};${animation}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="${color}"><style>${still ? "" : radarKeyframes(name)}</style>${rects}</svg>`;
}

export function radarUrl(color: string, still: boolean): string {
  const key = `${color}|${still}`;
  let url = urls.get(key);
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(radarSvg(color, still))}`;
    urls.set(key, url);
  }
  return url;
}

const reduced = () => typeof document !== "undefined" && document.documentElement.dataset.motion === "reduce";

export function RadarImage({ size = 12, color = TILE_RADAR_INK, className }: { size?: number; color?: string; className?: string }) {
  return (
    <img
      src={radarUrl(color, reduced())}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      className={className}
      data-slot="radar"
    />
  );
}
