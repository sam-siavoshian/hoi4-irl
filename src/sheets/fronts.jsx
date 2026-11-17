// Fronts, one front, its divisions, a division, and a province pressed on the map.
import { Button, EmptyState, ListGroup, ListRow, ListRowButton, ListSection, StatTile, StatusLabel } from '@sam/design-system';
import { AnchorIcon, ArrowLeftIcon, ArrowRightIcon, CastleIcon, FactoryIcon, LocateFixedIcon, MedalIcon, PackageIcon, PlaneIcon, ShieldIcon, TargetIcon } from 'lucide-react';
import { objective, frontNote, mapMeta, capitalOf, shortName, UNIT_TYPES, rankOf, DAY } from '../../js/engine.js';
import { app, F, activeFronts, flyFront, fmtDate, front, labels, openSheet, quick } from '../core.js';
import { EventRow, FrontMeter, FrontRow, FrontStatus, TONE, UnitIcon } from '../parts.jsx';

const quiet = 'text-sm text-muted-foreground';

export const fronts = {
  title: () => 'Fronts',
  Body() {
    const { map, data, st } = app;
    const order = map.fronts.slice().sort((a, b) => data.off.includes(a.id) - data.off.includes(b.id) || st.fronts[b.id].pos - st.fronts[a.id].pos);
    return (
      <>
        <ListGroup>{order.map(f => <FrontRow key={f.id} f={f} />)}</ListGroup>
        <p className="text-xs text-muted-foreground">Red: the enemy is inside {F().name}. Green: you’re pushing out.</p>
      </>
    );
  },
};

function DivisionRow({ d }) {
  return (
    <ListRowButton data-testid="division" media={<UnitIcon type={d.type} />} title={d.name}
      description={`${UNIT_TYPES[d.type].name} · ${rankOf(d.xp)} · ${Math.round(d.str)}%`} onClick={() => openSheet('division', d.id)} />
  );
}

export const frontSheet = {
  title: () => labels()[app.ui.arg],
  Body() {
    const { map, st, data, ui } = app;
    const f = front(ui.arg), fr = st.fronts[f.id]; const off = data.off.includes(f.id);
    const divs = st.divisions.filter(d => d.front === f.id); const obj = objective(map, st, f.id);
    const latest = st.log.slice().reverse().flatMap(l => l.items.filter(i => i.front === f.id).map(i => [i, l.ts])).slice(0, 5);
    const note = off ? null : frontNote(map, st, f.id);
    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className={quiet}>{f.name}</span>
            <FrontStatus id={f.id} />
          </div>
          <FrontMeter fr={fr} />
          <div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>{F().capital}</span><span>{f.satrapy}</span></div>
          {note ? <p className="pt-1 text-sm"><StatusLabel variant="inline" tone={TONE[note.tone]}>{note.text}</StatusLabel></p> : null}
        </div>
        <ListGroup>
          <ListRowButton media={<TargetIcon className="size-4" />} title={obj.text} description="Next objective" onClick={() => flyFront(f.id)} />
        </ListGroup>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" disabled={off} data-testid="quick-win" onClick={() => quick(f.id, 'win')}><ArrowRightIcon />Win</Button>
          <Button variant="outline" size="lg" disabled={off} data-testid="quick-loss" onClick={() => quick(f.id, 'loss')}><ArrowLeftIcon />Loss</Button>
        </div>
        {divs.length ? <ListSection title="Divisions">{divs.map(d => <DivisionRow key={d.id} d={d} />)}</ListSection> : null}
        <ListSection title="Latest">
          {latest.length ? latest.map(([i, ts], n) => <EventRow key={n} item={i} ts={ts} clamp />) : <ListRow title="Nothing reported here yet" description="Report a win or a loss and it shows here." />}
        </ListSection>
      </>
    );
  },
};

// the air force, the navy, the capital's garrison, or one front's divisions
export const units = {
  title: () => (app.ui.arg === 'air' ? 'Air force' : app.ui.arg === 'navy' ? 'Navy' : app.ui.arg === 'guard' ? `${F().capital} garrison` : `${labels()[app.ui.arg]} divisions`),
  Body() {
    const { st, ui } = app;
    const pct = n => <span className="text-sm text-muted-foreground tabular-nums">{Math.round(n)}%</span>;
    if (ui.arg === 'air') return (
      <ListGroup>
        {st.wings.map((w, i) => <ListRow key={i} variant="item" media={<UnitIcon type="air" />} title={w.name} description={`${w.model} · ${w.base} · ${Math.round(w.planes)} aircraft`} control={pct((w.planes / w.max) * 100)} />)}
      </ListGroup>
    );
    if (ui.arg === 'navy') return st.fleets.map((fl, i) => (
      <ListSection key={i} title={fl.name}>
        {fl.ships.map((s, n) => <ListRow key={n} variant="item" media={<UnitIcon type="ship" />} title={s.name} description={s.cls} control={pct(s.hp)} />)}
      </ListSection>
    ));
    const list = st.divisions.filter(d => (ui.arg === 'guard' ? !d.front : d.front === ui.arg));
    return <ListGroup>{list.map(d => <DivisionRow key={d.id} d={d} />)}</ListGroup>;
  },
};

export const division = {
  title: () => { const d = app.st.divisions.find(x => x.id === app.ui.arg); return d ? shortName(d) : 'Division'; },
  Body() {
    const { st, ui } = app; const L = labels();
    const d = st.divisions.find(x => x.id === ui.arg);
    if (!d) return <EmptyState size="compact" icon={<ShieldIcon />} title="Struck from the order of battle" description="This division was destroyed." />;
    const f = d.front ? front(d.front) : null;
    const state = d.str < 30 ? ['Pulled out of the line to refit', 'attention'] : d.led && st.now - d.led < 3 * DAY ? ['In action in the last few days', 'success'] : [f ? `In the line on the ${f.name}` : 'Guarding the capital', 'idle'];
    const record = [d.w ? `Led ${d.w} ${d.w === 1 ? 'victory' : 'victories'}` : '', d.l ? `took ${d.l} ${d.l === 1 ? 'blow' : 'blows'}` : ''].filter(Boolean).join(', ');
    return (
      <>
        <ListGroup>
          <ListRow variant="item" media={<UnitIcon type={d.type} size="lg" />} title={d.name}
            description={<>{d.nick ? <>“{d.nick}” · </> : null}{d.co} · raised at {d.home}</>}
            status={<StatusLabel tone={state[1]}>{state[0]}</StatusLabel>} />
        </ListGroup>
        <div className="grid grid-cols-3 gap-4 px-3 sm:px-4">
          <StatTile variant="plain" label="Strength" value={`${Math.round(d.str)}%`} />
          <StatTile variant="plain" label="Organisation" value={`${Math.round(d.org)}%`} />
          <StatTile variant="plain" label="Experience" value={rankOf(d.xp)} />
        </div>
        <p className={`${quiet} px-3 sm:px-4`}>{f ? `${L[f.id]} front` : `Stationed in ${F().capital}`}{record ? `. ${record}.` : '.'}</p>
        <ListSection title="Battle honours">
          {d.honours.length
            ? d.honours.slice().reverse().map((h, i) => (
              <ListRow key={i} variant="item" media={h.win ? <MedalIcon className="size-4 text-success" /> : <ArrowLeftIcon className="size-4 text-destructive" />}
                title={h.text} description={[h.headline, fmtDate(h.t, { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')} />))
            : <ListRow title="None yet" description="Honours are earned in significant engagements this division leads." />}
        </ListSection>
        {f ? <Button variant="outline" onClick={() => flyFront(f.id)}><LocateFixedIcon />Show on map</Button> : null}
      </>
    );
  },
};

const BUILDINGS = { port: ['Port', AnchorIcon], naval: ['Naval base', AnchorIcon], airbase: ['Airbase', PlaneIcon], hub: ['Supply hub', PackageIcon], refinery: ['Oil refinery', FactoryIcon], fort: ['Fortress', CastleIcon] };
export const province = {
  title: () => app.map.provinces[app.ui.arg].n,
  Body() {
    const { map, st, ui } = app;
    const p = map.provinces[ui.arg]; const meta = mapMeta(map); const c = map.countries[p.t]; const t = st.terr;
    const occ = t.occ.get(p.id), lib = t.lib.get(p.id); const us = F().name;
    const holder = p.t === F().home ? (occ ? front(occ).enemyName : us) : lib ? us : c.name;
    const built = meta.buildings.filter(b => b.prov === p.id);
    const here = activeFronts().filter(f => st.lines[f.id].ours.includes(p.id) || st.lines[f.id].theirs.includes(p.id));
    return (
      <>
        <p className={quiet}>{meta.stateName(p.s)} · {c.name} · held by <span className={occ ? 'text-destructive' : lib ? 'text-success' : 'text-foreground'}>{holder}</span></p>
        {built.length ? (
          <ListGroup>
            {built.map(b => { const [name, Icon] = BUILDINGS[b.kind]; const dmg = st.bld[b.id].dmg; return (
              <ListRow key={b.id} variant="item" media={<Icon className="size-4 text-muted-foreground" />} title={name}
                status={dmg > 0.05 ? <StatusLabel tone="danger">{Math.round(dmg * 100)}% damaged</StatusLabel> : null} />); })}
          </ListGroup>
        ) : null}
        {p.id === capitalOf(map) ? (
          <ListGroup><ListRowButton media={<ShieldIcon className="size-4" />} title={`${F().capital} garrison`} onClick={() => openSheet('units', 'guard')} /></ListGroup>
        ) : null}
        {here.length ? <ListGroup>{here.map(f => <FrontRow key={f.id} f={f} />)}</ListGroup> : null}
      </>
    );
  },
};
