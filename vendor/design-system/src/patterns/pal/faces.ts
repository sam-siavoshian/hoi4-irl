// Each agent's own face: one of the pal's 72 looks (4 shapes x 6 colours x 3
// eyes), picked from its id, so the same agent looks the same in every window.
// Ported from the old window's app/src/agent-face.js, pal-icon.js (markSvg) and
// pal-character.js (Lanes' own code), behaviour unchanged:
//
// * Agents that work at the same time get different looks while there are
//   looks to go round. Placed oldest first, each starts at its id's look and
//   steps to the look that clashes least with the older agents still running
//   (a look one wears; a shape and colour one wears; the colour of either of
//   the two started just before it; the shape of the one just before it). Only
//   older, overlapping agents count, so a face never changes as others start
//   or finish. The owner's own pal look is never handed out.
// * Drawn as the pal's mark, frozen, as an <img> whose data URL is made once
//   per look and expression: a grid of a hundred agents is a hundred light
//   images over a few decoded pictures.
//
// Changes: TypeScript; the SVG is written as a string (no DOM), so the parts a
// look and expression hide are left out rather than removed; the 3.4% film
// grain (an feTurbulence) is left out too, unseen at tile size and the costliest
// part to draw; an agent's birth is its AgentStatus `started` (ISO), its end a
// `finished` when one is given.

/** The paints and inks are named in the design system (design/agents.ts). */
import { FACE_INK, FACE_PAINTS } from "../../design/agents";

export const COLORS = FACE_PAINTS;

export const SHAPES = {
  pebble:
    "M23 46C32 24 54 19 75 24C94 13 120 24 127 45C139 61 133 86 119 99C108 117 87 122 68 116C46 121 25 110 20 91C10 78 12 59 23 46Z",
  arch: "M19 78C17 37 38 17 71 15C106 11 132 39 131 75L131 91C131 111 114 121 98 114L76 104L56 114C37 124 19 111 19 93Z",
  bloom:
    "M75 24C95 9 117 19 117 41C140 44 147 68 130 83C139 107 118 125 97 116C83 134 58 128 50 111C24 118 9 97 22 77C7 57 21 34 43 37C43 13 64 9 75 24Z",
  drop: "M73 16C78 11 82 16 89 25C98 38 106 45 116 56C133 74 134 94 121 108C103 127 68 129 43 117C21 107 16 86 28 66C39 46 58 32 73 16Z",
} as const;

export const EYES = ["oval", "spark", "smile"] as const;

export type FaceShape = keyof typeof SHAPES;
export type FaceColor = keyof typeof COLORS;
export type FaceEyes = (typeof EYES)[number];

export interface Look {
  shape: FaceShape;
  color: FaceColor;
  eyes: FaceEyes;
}

/** The still expressions a face wears: rest, focused (working), waiting, done, resting. */
export const EXPRESSIONS = ["rest", "focused", "waiting", "done", "resting"] as const;
export type Expression = (typeof EXPRESSIONS)[number];

export const DEFAULT_LOOK: Look = { shape: "pebble", color: "lilac", eyes: "oval" };

const SHAPE_NAMES = Object.keys(SHAPES) as FaceShape[];
const COLOR_NAMES = Object.keys(COLORS) as FaceColor[];
const PAIRS = SHAPE_NAMES.length * COLOR_NAMES.length;

/** Shape, colour and eyes, the only parts of an identity a face draws. Anything unknown draws as the default. */
export function lookOf(identity: unknown): Look {
  const source = (identity && typeof identity === "object" ? identity : {}) as Record<string, unknown>;
  const pick = <T extends string>(names: readonly T[], value: unknown, fallback: T): T =>
    typeof value === "string" && (names as readonly string[]).includes(value) ? (value as T) : fallback;
  return {
    shape: pick(SHAPE_NAMES, source.shape, DEFAULT_LOOK.shape),
    color: pick(COLOR_NAMES, source.color, DEFAULT_LOOK.color),
    eyes: pick(EYES, source.eyes, DEFAULT_LOOK.eyes),
  };
}

/** Every look, numbered shape fastest, then colour, then eyes. */
export const LOOKS: readonly Look[] = EYES.flatMap((eyes) =>
  COLOR_NAMES.flatMap((color) => SHAPE_NAMES.map((shape) => ({ shape, color, eyes }))),
);

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** One step in each of shape, colour and eyes: the next look tried after a taken one differs in all three. */
const STRIDE = (() => {
  let stride = 1 + SHAPE_NAMES.length + PAIRS;
  while (gcd(stride, LOOKS.length) !== 1) stride += 1;
  return stride;
})();

/** The order looks are tried in, from `start`. */
export const probe = (start: number, step: number) => (start + step * STRIDE) % LOOKS.length;

/** "pebble/mint/oval": a look's name and cache key. */
export const lookKey = (look: Look) => `${look.shape}/${look.color}/${look.eyes}`;

const indexOf = (look: Look) =>
  SHAPE_NAMES.indexOf(look.shape) +
  SHAPE_NAMES.length * COLOR_NAMES.indexOf(look.color) +
  PAIRS * EYES.indexOf(look.eyes);

/** A 32-bit hash of an id (FNV-1a, then mixed), the same in every window. */
export function hashId(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) hash = Math.imul(hash ^ id.charCodeAt(i), 0x01000193);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}

const shapeOf = (index: number) => index % SHAPE_NAMES.length;
const colorOf = (index: number) => Math.floor(index / SHAPE_NAMES.length) % COLOR_NAMES.length;

interface Placed {
  index: number;
  end: number;
}

function pick(start: number, company: readonly Placed[], own: number): number {
  const looks = new Set(company.map((entry) => entry.index));
  const pairs = new Set(company.map((entry) => entry.index % PAIRS));
  pairs.add(own % PAIRS);
  const nearColors = new Set(company.slice(-2).map((entry) => colorOf(entry.index)));
  const last = company.at(-1);
  let best = -1;
  let least = Infinity;
  for (let step = 0; step < LOOKS.length && least > 0; step += 1) {
    const index = probe(start, step);
    if (index === own) continue;
    const clash =
      (looks.has(index) ? 1000 : 0) +
      (pairs.has(index % PAIRS) ? 100 : 0) +
      (nearColors.has(colorOf(index)) ? 10 : 0) +
      (last && shapeOf(last.index) === shapeOf(index) ? 1 : 0);
    if (clash < least) {
      best = index;
      least = clash;
    }
  }
  return best;
}

export interface FaceSubject {
  id: string;
  started?: string;
  finished?: string | number;
}

const born = (agent: FaceSubject) => Date.parse(agent.started ?? "") || 0;
// No finish time: still at work. It keeps its look out of the way of agents that come after it.
const ended = (agent: FaceSubject) =>
  typeof agent.finished === "number" ? agent.finished : Date.parse(agent.finished ?? "") || Infinity;

/** One agent's face with no others to make room for. */
export function faceOfId(id: string, owner: unknown = null): Look {
  return LOOKS[pick(hashId(id) % LOOKS.length, [], indexOf(lookOf(owner)))]!;
}

let remembered: { key: string | null; faces: Map<string, Look> } = { key: null, faces: new Map() };

/** Every agent's face by id, for one roster and the owner's pal identity. An unchanged roster costs one pass. */
export function agentFaces(agents: Iterable<FaceSubject | null | undefined>, owner: unknown = null): Map<string, Look> {
  const own = indexOf(lookOf(owner));
  const order = [...agents]
    .filter((agent): agent is FaceSubject => Boolean(agent && typeof agent.id === "string" && agent.id))
    .map((agent) => ({ id: agent.id, born: born(agent), end: ended(agent) }))
    .sort((a, b) => a.born - b.born || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const key = `${own}|${order.map((entry) => `${entry.id}:${entry.born}:${entry.end}`).join("|")}`;
  if (key === remembered.key) return remembered.faces;
  const faces = new Map<string, Look>();
  const company: Placed[] = [];
  for (const entry of order) {
    // Ordered by when each began: an agent that finished before this one began is out of its company.
    for (let i = company.length - 1; i >= 0; i -= 1) if (company[i]!.end <= entry.born) company.splice(i, 1);
    const index = pick(hashId(entry.id) % LOOKS.length, company, own);
    company.push({ end: entry.end, index });
    faces.set(entry.id, LOOKS[index]!);
  }
  remembered = { key, faces };
  return faces;
}

/** The still expression a face wears for its agent's state. */
export function agentExpression(state: string): Expression {
  if (["working", "running", "starting", "stopping"].includes(state)) return "focused";
  if (state === "failed" || state.startsWith("waiting")) return "waiting";
  if (["done", "completed", "passed"].includes(state)) return "done";
  if (["paused", "stopped"].includes(state)) return "resting";
  return "rest";
}

// ------------------------------------------------------------- the drawing

function mix(hex: string, destination: readonly [number, number, number], ratio: number): string {
  const source = hex
    .slice(1)
    .match(/../g)!
    .map((part) => parseInt(part, 16));
  return `#${source
    .map((channel, index) => Math.round(channel + (destination[index]! - channel) * ratio).toString(16).padStart(2, "0"))
    .join("")}`;
}

let sequence = 0;

/** The pal's mark for a look and expression, frozen, as standalone SVG markup (pal-icon.js markSvg). */
export function faceSvg(look: Look, expression: Expression = "rest"): string {
  const id = `face-${++sequence}`;
  const paint = COLORS[look.color];
  const form = SHAPES[look.shape];
  const lit = mix(paint, [255, 255, 255], 0.58);
  const middle = mix(paint, [255, 255, 255], 0.09);
  const shade = mix(paint, [17, 46, 43], 0.36);
  const rim = mix(paint, [255, 255, 255], 0.78);
  const cheek = mix(paint, [240, 120, 140], 0.62);
  const smiling = expression === "done" || look.eyes === "smile";
  const focused = expression === "focused";
  const glint = look.eyes === "spark" ? "spark" : "oval";
  const eye = (x: number) => `<g>
    <ellipse cx="${x + 1}" cy="72" rx="17" ry="25" fill="${shade}" opacity=".33" filter="url(#${id}-socket)"/>
    <rect x="${x - 13}" y="49" width="27" height="44" rx="13.5" fill="url(#${id}-eye)" stroke="${shade}" stroke-opacity=".35" stroke-width=".8"/>
    <path d="M${x - 9} 83q8 8 17-1" fill="none" stroke="${FACE_INK.crease}" stroke-opacity=".18" stroke-width="1.5" stroke-linecap="round"/>
    <g${focused ? ' transform="translate(2 1.5)"' : ""}>${
      glint === "oval"
        ? `<ellipse cx="${x - 4}" cy="61" rx="5" ry="7.5" fill="${FACE_INK.glint}"/><ellipse cx="${x + 5}" cy="79" rx="2.2" ry="2.8" fill="${FACE_INK.glintSoft}" opacity=".6"/>`
        : `<path d="M${x} 53q3 7 8 10-5 3-8 11-3-8-8-11 5-3 8-10Z" fill="${FACE_INK.spark}"/><circle cx="${x + 6}" cy="81" r="2.4" fill="${FACE_INK.sparkSoft}" opacity=".76"/>`
    }</g>
  </g>`;
  let face = "";
  if (expression === "resting") {
    face += `<g fill="none" stroke-linecap="round"><path d="M43 74q11 7 23-1M85 74q11 7 23-1" stroke="${lit}" stroke-width="6" opacity=".44" transform="translate(0 1.5)"/><path d="M43 74q11 7 23-1M85 74q11 7 23-1" stroke="${FACE_INK.line}" stroke-width="4.2"/></g>`;
  } else if (smiling) {
    face += `<g fill="none" stroke-linecap="round"><path d="M43 76q11-17 23 0M85 76q11-17 23 0" stroke="${lit}" stroke-width="7" opacity=".4" transform="translate(0 2)"/><path d="M43 76q11-17 23 0M85 76q11-17 23 0" stroke="${FACE_INK.line}" stroke-width="5"/></g>`;
  } else {
    face += `<g${focused ? ' transform="translate(0 72) scale(1 .9) translate(0 -72)"' : ""}>${eye(54)}${eye(96)}</g>`;
  }
  if (expression === "waiting" || expression === "done") {
    face += `<g fill="${cheek}"${expression === "waiting" ? ' opacity=".55"' : ""}><ellipse cx="37" cy="93" rx="8" ry="4.4"/><ellipse cx="113" cy="93" rx="8" ry="4.4"/></g>`;
  }
  if (expression === "waiting") {
    face += `<path d="M87 42q6-3 12 0" fill="none" stroke="${shade}" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="9 6 133 120" width="133" height="120"><defs>
    <linearGradient id="${id}-base" x1=".14" y1="0" x2=".82" y2="1"><stop stop-color="${lit}"/><stop offset=".38" stop-color="${middle}"/><stop offset=".73" stop-color="${paint}"/><stop offset="1" stop-color="${shade}"/></linearGradient>
    <radialGradient id="${id}-volume" cx=".32" cy=".2" r=".83"><stop stop-color="${FACE_INK.light}" stop-opacity=".55"/><stop offset=".42" stop-color="${FACE_INK.light}" stop-opacity=".06"/><stop offset=".76" stop-color="${shade}" stop-opacity="0"/><stop offset="1" stop-color="${shade}" stop-opacity=".42"/></radialGradient>
    <radialGradient id="${id}-glow"><stop stop-color="${FACE_INK.light}" stop-opacity=".65"/><stop offset="1" stop-color="${FACE_INK.light}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-rim" x1=".2" y1="0" x2=".75" y2="1"><stop stop-color="${rim}" stop-opacity=".9"/><stop offset=".45" stop-color="${rim}" stop-opacity=".12"/><stop offset="1" stop-color="${shade}" stop-opacity=".32"/></linearGradient>
    <linearGradient id="${id}-eye" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${FACE_INK.eyeTop}"/><stop offset=".46" stop-color="${FACE_INK.eyeMiddle}"/><stop offset="1" stop-color="${FACE_INK.eyeDeep}"/></linearGradient>
    <filter id="${id}-soft" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="3.6"/></filter>
    <filter id="${id}-socket" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.7"/></filter>
    <clipPath id="${id}-clip"><path d="${form}"/></clipPath>
  </defs>
  <g>
    <path d="${form}" fill="url(#${id}-base)"/>
    <g clip-path="url(#${id}-clip)">
      <path d="${form}" fill="url(#${id}-volume)"/>
      <ellipse cx="46" cy="37" rx="37" ry="28" fill="url(#${id}-glow)" transform="rotate(-28 46 37)"/>
      <ellipse cx="102" cy="115" rx="54" ry="15" fill="${lit}" opacity=".13" filter="url(#${id}-soft)"/>
      <path d="${form}" fill="none" stroke="url(#${id}-rim)" stroke-width="2.4"/>
      <path d="M29 51C32 40 41 33 50 31" fill="none" stroke="${rim}" stroke-opacity=".36" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <g>${face}</g>
  </g>
</svg>`;
}

const urls = new Map<string, string>();

/** The face's picture as a data URL, drawn once per look and expression. `draw` is for tests. */
export function faceUrl(
  identity: unknown,
  expression: Expression = "rest",
  draw: (look: Look, expression: Expression) => string = (look, face) =>
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(faceSvg(look, face))}`,
): string {
  const look = lookOf(identity);
  const face = EXPRESSIONS.includes(expression) ? expression : "rest";
  const key = `${lookKey(look)}/${face}`;
  let url = urls.get(key);
  if (url === undefined) {
    url = draw(look, face);
    urls.set(key, url);
  }
  return url;
}

export const faceCacheSize = () => urls.size;
