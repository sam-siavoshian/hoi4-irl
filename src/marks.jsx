// Two marks drawn from data, with nothing of the app's state in them, so the landing page (site/) draws the very same
// ones: a country's flag and a model provider's logo. parts.jsx re-exports both for the app's sheets.
import { ServerIcon, SparklesIcon, WifiOffIcon, ZapIcon } from 'lucide-react';
import { PROVIDER_LOGOS } from '../js/provider-logos.js';

// A small round flag from the scenario's own colours (META.flag, described in docs/SCENARIOS.md): bands across (`h`) or
// upright (`v`) of any number and weight, then an optional canton, centred cross and disc over them. `h3` and `v3` are the
// first form: three bands, the middle one a little narrower. The paints are the country's, so they come from the data;
// a scenario without a flag gets a plain roundel.
function bands(flag) {
  if (!flag) return null;
  if (flag.type === 'h3' || flag.type === 'v3') return Array.isArray(flag.colors) && flag.colors.length >= 3 ? flag.colors.slice(0, 3).map((c, i) => [c, i === 1 ? 12 : 14]) : null;
  const list = (Array.isArray(flag.stripes) ? flag.stripes : []).map(s => (Array.isArray(s) ? [s[0], Number(s[1]) > 0 ? Number(s[1]) : 1] : [s, 1])).filter(s => typeof s[0] === 'string');
  return list.length ? list : null;
}
export function Flag({ flag, className = 'size-8' }) {
  const list = bands(flag); const upright = flag?.type === 'v3' || flag?.type === 'v';
  const total = (list || []).reduce((n, s) => n + s[1], 0); let at = 0;
  const band = w => { const a = (at / total) * 40, b = (w / total) * 40; at += w; return upright ? { x: a, width: b, height: 40 } : { y: a, width: 40, height: b }; };
  const part = n => Math.max(0, Math.min(1, Number(n) || 0)) * 40;
  const canton = list && flag.canton?.color ? flag.canton : null, cross = list && flag.cross?.color ? flag.cross : null; const arm = cross ? part(cross.width ?? 0.2) : 0;
  return (
    <svg data-flag="" viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges" className={`${className} shrink-0 rounded-full`}>
      {list
        ? list.map(([color, w], i) => <rect key={i} {...band(w)} fill={color} />)
        : [0, 1, 2].map(i => <rect key={i} y={[0, 14, 26][i]} width="40" height={[14, 12, 14][i]} className={i === 1 ? 'fill-muted-foreground/50' : 'fill-muted-foreground'} />)}
      {canton ? <rect width={part(canton.w ?? 0.5)} height={part(canton.h ?? 0.5)} fill={canton.color} /> : null}
      {cross ? <><rect x={20 - arm / 2} width={arm} height="40" fill={cross.color} /><rect y={20 - arm / 2} width="40" height={arm} fill={cross.color} /></> : null}
      {list && flag.disc ? <circle cx="20" cy="20" r="4.6" shapeRendering="geometricPrecision" fill={flag.disc} /> : null}
    </svg>
  );
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
