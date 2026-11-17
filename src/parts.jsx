// The few pieces several sheets share. Everything visible is a kit component; what is left here is content:
// a country's flag, a division's glyph, a legend swatch, and how a front or a battle is laid out in a row.
import { ListRow, ListRowButton, ProgressMeter, StatusLabel } from '@sam/design-system';
import {
  AnchorIcon, ArrowLeftIcon, ArrowRightIcon, BombIcon, CastleIcon, ChevronsLeftIcon, ChevronsRightIcon, CircleDashedIcon, EyeIcon, FactoryIcon,
  GiftIcon, HandshakeIcon, MegaphoneIcon, PackageIcon, PlaneIcon, SnowflakeIcon, SwordsIcon, TrainFrontIcon, UserMinusIcon, UsersIcon, WindIcon,
} from 'lucide-react';
import { ACTIONS } from '../js/engine.js';
import { UNIT_PATHS } from '../js/icons.js';
import { app, fmtDate, labels, openSheet, statusOf } from './core.js';

// engine tones → the kit's status tones
export const TONE = { gold: 'success', good: 'success', neutral: 'idle', warn: 'attention', bad: 'danger', crit: 'danger', dim: 'idle' };

// A small round flag from the scenario's own colours: 3 bands (h3 across, v3 upright) and an optional disc.
// The paints are the country's, so they come from the data; a scenario without a flag gets a plain roundel.
export function Flag({ flag, className = 'size-8' }) {
  const c = flag && Array.isArray(flag.colors) && flag.colors.length >= 3 ? flag.colors : null;
  const upright = flag?.type === 'v3';
  const band = i => (upright ? { x: [0, 14, 26][i], width: [14, 12, 14][i], height: 40 } : { y: [0, 14, 26][i], width: 40, height: [14, 12, 14][i] });
  return (
    <svg data-flag="" viewBox="0 0 40 40" aria-hidden="true" className={`${className} shrink-0 rounded-full`}>
      {[0, 1, 2].map(i => (c ? <rect key={i} {...band(i)} fill={c[i]} /> : <rect key={i} {...band(i)} className={i === 1 ? 'fill-muted-foreground/50' : 'fill-muted-foreground'} />))}
      {flag?.disc ? <circle cx="20" cy="20" r="4.6" fill={flag.disc} /> : null}
    </svg>
  );
}

// A unit's silhouette (Game-icons.net, CC BY 3.0; the paths are in js/icons.js) in the ink of whatever holds it.
// Every division, wing and ship in a list wears one.
export function UnitIcon({ type, size = 'md' }) {
  const well = size === 'lg' ? 'size-12 rounded-card' : 'size-9 rounded-row';
  return (
    <span data-unit-icon={type} className={`flex ${well} shrink-0 items-center justify-center bg-fill text-foreground`}>
      <svg viewBox="0 0 512 512" aria-hidden="true" fill="currentColor" className={size === 'lg' ? 'size-8' : 'size-6'}>
        <path d={UNIT_PATHS[type] || UNIT_PATHS.inf} />
      </svg>
    </span>
  );
}

// One paint from the map's legend. The colour is the renderer's (js/map.js), so the swatch matches the canvas.
export function Swatch({ color }) {
  return <svg viewBox="0 0 10 10" aria-hidden="true" className="size-2.5 shrink-0"><rect width="10" height="10" rx="3" fill={color} /></svg>;
}

// every battle type has its own icon, matching what it means
const ACT_ICON = {
  offensive: ArrowRightIcon, breakthrough: ChevronsRightIcon, encirclement: CircleDashedIcon, air_superiority: PlaneIcon, cas_strike: PlaneIcon, naval_victory: AnchorIcon,
  infrastructure: FactoryIcon, fortify: CastleIcon, reinforce: UsersIcon, counterattack: SwordsIcon, airborne: WindIcon, uprising: MegaphoneIcon, intelligence: EyeIcon,
  lend_lease: GiftIcon, treaty: HandshakeIcon, enemy_offensive: ArrowLeftIcon, enemy_breakthrough: ChevronsLeftIcon, encircled: CircleDashedIcon, enemy_cas: PlaneIcon,
  strategic_bombing: BombIcon, port_strike: AnchorIcon, supply_hub_bombed: PackageIcon, naval_defeat: AnchorIcon, attrition: UsersIcon, rail_cut: TrainFrontIcon,
  sabotage: BombIcon, desertion: UserMinusIcon, winter: SnowflakeIcon, skirmish: SwordsIcon,
};
export function OutcomeIcon({ action, outcome }) {
  const Icon = ACT_ICON[action] || SwordsIcon;
  return <Icon className={`size-4 ${outcome === 'win' ? 'text-success' : outcome === 'loss' ? 'text-destructive' : 'text-muted-foreground'}`} />;
}

// One thing that happened on a front: what, then where and how, then the user's own account of it.
// clamp: a three-line preview of the details (a front's latest); History shows them in full.
export function EventRow({ item: i, ts, clamp = false }) {
  const { map } = app; const L = labels();
  const meta = [
    L[i.front],
    i.battle ? `${ACTIONS[i.action].label} · ${i.battle}` : ACTIONS[i.action].label,
    i.unit ? i.unit.replace(/ (Division|Brigade).*$/, '') : '',
  ].filter(Boolean).join(' · ') + (i.reason ? ` (${i.reason})` : '') + (i.at != null ? ` at ${map.provinces[i.at].n}` : '') + (ts ? ` · ${fmtDate(ts, { day: 'numeric', month: 'short' })}` : '');
  return (
    <ListRow data-testid="event" media={<OutcomeIcon action={i.action} outcome={i.outcome} />} title={i.headline} description={meta}>
      {i.details ? <p data-testid="event-details" className={`mt-1 pl-7 text-sm whitespace-pre-line text-foreground${clamp ? ' line-clamp-3' : ''}`}>{i.details}</p> : null}
    </ListRow>
  );
}

// Where a front stands: left of the middle the enemy is inside the country, right of it you are pushing out.
export function FrontMeter({ fr, className }) {
  return <ProgressMeter origin="center" value={-fr.pos} max={100} tone={fr.pos > 0 ? 'danger' : 'success'} className={className} />;
}
export function FrontStatus({ id }) {
  const s = statusOf(app.st.fronts[id].pos);
  return app.data.off.includes(id) ? <StatusLabel tone="idle">Paused</StatusLabel> : <StatusLabel tone={TONE[s.tone]}>{s.text}</StatusLabel>;
}
export function FrontRow({ f }) {
  return (
    <ListRowButton data-testid="front" data-front={f.id} title={labels()[f.id]} status={<FrontStatus id={f.id} />} onClick={() => openSheet('front', f.id)}>
      <FrontMeter fr={app.st.fronts[f.id]} className="mt-3" />
    </ListRowButton>
  );
}
