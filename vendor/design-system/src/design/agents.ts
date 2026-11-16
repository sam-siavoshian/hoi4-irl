// The Agents window's own art, as values a drawing needs at runtime: the
// faces are SVG written as strings (components/agents/faces.ts) and the tile's
// radar is one shared SVG image (components/agents/RadarImage.tsx), so their
// colours cannot be CSS tokens read through a class. They live here, in the
// design system, by name, instead of as literals in the components.
//
// The faces are Lanes' own art (components/agents/faces.ts says how they are
// drawn); the values are theirs, unchanged.

/** The six paints a face is cast in. */
export const FACE_PAINTS = {
  mint: "#61cbb1",
  peach: "#efa986",
  blue: "#8eb9ef",
  lilac: "#b7a3e6",
  lemon: "#e5ce76",
  rose: "#e3a3b9",
} as const;

/** The inks every face shares: its lines, its eyes, the light caught in them. */
export const FACE_INK = {
  /** The crease under an open eye. */
  crease: "#8ba59f",
  /** An oval eye's glint, and its softer second light. */
  glint: "#f7fff9",
  glintSoft: "#e9fff5",
  /** A spark eye's star, and its dot. */
  spark: "#f6fff8",
  sparkSoft: "#e5fff3",
  /** Closed and smiling eyes. */
  line: "#29453f",
  /** Highlights: the volume's sheen and the glow. */
  light: "#fff",
  /** An eye, top to bottom. */
  eyeTop: "#263e3c",
  eyeMiddle: "#152b29",
  eyeDeep: "#0b1d1c",
} as const;

/** The radar on a tile's dark chip: white, a touch under full. */
export const TILE_RADAR_INK = "rgb(255 255 255 / 0.92)";
