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

// A country's flag and a provider's mark are in marks.jsx (the landing page draws the same ones).
export { Flag, ProviderLogo } from './marks.jsx';

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

// One thing that happened on a front: what, then where and how.
export function EventRow({ item: i, ts }) {
  const { map } = app; const L = labels();
  const meta = [
    L[i.front],
    i.battle ? `${ACTIONS[i.action].label} · ${i.battle}` : ACTIONS[i.action].label,
    i.unit ? i.unit.replace(/ (Division|Brigade).*$/, '') : '',
  ].filter(Boolean).join(' · ') + (i.reason ? ` (${i.reason})` : '') + (i.at != null ? ` at ${map.provinces[i.at].n}` : '') + (ts ? ` · ${fmtDate(ts, { day: 'numeric', month: 'short' })}` : '');
  return <ListRow data-testid="event" media={<OutcomeIcon action={i.action} outcome={i.outcome} />} title={i.headline} description={meta} />;
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
