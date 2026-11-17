// The marks from data, with nothing of the app's state in them, so the landing page (site/) shows the very same ones:
// a country's flag, a model provider's logo and the product's own mark. parts.jsx re-exports them for the app's sheets.
import { FlagImage, LogoTile } from '@sam/design-system';
import { MapIcon, ServerIcon, SparklesIcon, WifiOffIcon, ZapIcon } from 'lucide-react';
import { PROVIDER_LOGOS } from '../js/provider-logos.js';

// A country's flag (META.flag, described in docs/SCENARIOS.md). A scenario that ships its real flag gives an image
// (`{ image, sizes, ratio, focus, colors }`, the artwork in icons/flags/): it is shown as the picture it is, in the
// kit's FlagImage, round where a face would stand (`shape="circle"`, the Avatar's crop) or whole where there is room
// (`shape="rect"`). `base` is the folder the image paths are under, seen from the page ('demo/' on the landing page).
// A third-party scenario without artwork can still describe its flag as stripes: bands across (`h`) or upright (`v`)
// of any number and weight, then an optional canton, centred cross and disc over them (`h3`/`v3`: three bands, the
// middle one a little narrower). Those are drawn from its own colours; a scenario with no flag gets a plain roundel.
const BOX = { xs: 'size-5', sm: 'size-6', md: 'size-8', lg: 'size-9', xl: 'size-10' };
const HIGH = { xs: 'h-5', sm: 'h-6', md: 'h-8', lg: 'h-9', xl: 'h-10' };
export function flagSrcSet(flag, base = '') {
  const list = Object.entries(flag?.sizes || {}).map(([w, f]) => [Number(w), f]).filter(([w, f]) => w > 0 && typeof f === 'string').sort((a, b) => a[0] - b[0]);
  return list.length ? list.map(([w, f]) => `${base}${f} ${w}w`).join(', ') : undefined;
}
function bands(flag) {
  if (!flag) return null;
  if (flag.type === 'h3' || flag.type === 'v3') return Array.isArray(flag.colors) && flag.colors.length >= 3 ? flag.colors.slice(0, 3).map((c, i) => [c, i === 1 ? 12 : 14]) : null;
  const list = (Array.isArray(flag.stripes) ? flag.stripes : []).map(s => (Array.isArray(s) ? [s[0], Number(s[1]) > 0 ? Number(s[1]) : 1] : [s, 1])).filter(s => typeof s[0] === 'string');
  return list.length ? list : null;
}
function Stripes({ flag, shape, size }) {
  const list = bands(flag); const upright = flag?.type === 'v3' || flag?.type === 'v'; const round = shape !== 'rect';
  const W = round ? 40 : 60, H = 40;
  const total = (list || []).reduce((n, s) => n + s[1], 0); let at = 0;
  const band = w => { const span = upright ? W : H; const a = (at / total) * span, b = (w / total) * span; at += w; return upright ? { x: a, width: b, height: H } : { y: a, width: W, height: b }; };
  const part = (n, of) => Math.max(0, Math.min(1, Number(n) || 0)) * of;
  const canton = list && flag.canton?.color ? flag.canton : null, cross = list && flag.cross?.color ? flag.cross : null; const arm = cross ? part(cross.width ?? 0.2, H) : 0;
  return (
    <svg data-flag="" data-flag-kind="stripes" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" shapeRendering="crispEdges"
      className={`${round ? `${BOX[size]} rounded-full` : `${HIGH[size]} aspect-3/2 rounded-swatch`} shrink-0`}>
      {list
        ? list.map(([color, w], i) => <rect key={i} {...band(w)} fill={color} />)
        : [0, 1, 2].map(i => <rect key={i} y={[0, 14, 26][i]} width={W} height={[14, 12, 14][i]} className={i === 1 ? 'fill-muted-foreground/50' : 'fill-muted-foreground'} />)}
      {canton ? <rect width={part(canton.w ?? 0.5, W)} height={part(canton.h ?? 0.5, H)} fill={canton.color} /> : null}
      {cross ? <><rect x={W / 2 - arm / 2} width={arm} height={H} fill={cross.color} /><rect y={H / 2 - arm / 2} width={W} height={arm} fill={cross.color} /></> : null}
      {list && flag.disc ? <circle cx={W / 2} cy={H / 2} r="4.6" shapeRendering="geometricPrecision" fill={flag.disc} /> : null}
    </svg>
  );
}
export function Flag({ flag, shape = 'circle', size = 'md', base = '', label, className }) {
  const at = size in BOX ? size : 'md';
  if (typeof flag?.image === 'string') {
    return (
      <FlagImage data-flag="" data-flag-kind="image" shape={shape} size={at} src={base + flag.image} srcSet={flagSrcSet(flag, base)}
        ratio={Number(flag.ratio) > 0 ? Number(flag.ratio) : 1.5} focus={Array.isArray(flag.focus) ? flag.focus : undefined} label={label}
        fallback={<Stripes flag={null} shape={shape} size={at} />} className={className} />
    );
  }
  return <span className={`inline-flex shrink-0 ${className || ''}`}><Stripes flag={flag} shape={shape} size={at} /></span>;
}

// The product's own mark: a map on the kit's logo tile, in the ink of the page. Home Front is about no one country,
// so its mark is none of their flags.
export function BrandMark({ variant = 'tile', className }) {
  return <LogoTile data-brand-mark="" variant={variant} icon={<MapIcon />} className={className} />;
}

// A model provider's mark, in the ink of whatever holds it. The real brand marks are Simple Icons' (CC0; the paths are
// in js/provider-logos.js, written by tools/build-provider-logos.mjs). OpenAI and Groq are not in that set and their
// own terms do not let this project ship their logos, so they wear a plain Lucide icon, as do "another server" and
// the offline judge. Nothing here is drawn by hand. Names and logos belong to their owners (NOTICE.md).
const PLAIN_MARK = { openai: SparklesIcon, groq: ZapIcon, custom: ServerIcon, offline: WifiOffIcon };
export function ProviderLogo({ id, className = 'size-4' }) {
  const mark = PROVIDER_LOGOS[id];
  if (!mark) { const Icon = PLAIN_MARK[id] || ServerIcon; return <Icon data-provider-logo={id} data-mark="plain" aria-hidden="true" className={`${className} shrink-0`} />; }
  return <svg data-provider-logo={id} data-mark="brand" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" className={`${className} shrink-0`}><path d={mark.path} /></svg>;
}
