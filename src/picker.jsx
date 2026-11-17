// Choosing a country: the first thing a first run shows, and "Change country" in Settings.
// The map is the stage (App.jsx gives it the room the picker leaves), the nations stand in a strip under it on a phone
// or a column beside it on a wide screen, and the highlighted one has its briefing and the one button that commits.
// What it does is in core.js (openPicker, browse, playPicked, cancelPicker); the numbers come from the scenario itself.
import { useEffect } from 'react';
import { Badge, Button, Card, ChoiceCards, IconButton, ListRow, ListSection, LoadingState, PersonRow, ScrollArea, Spinner, Stagger, StatTile } from '@sam/design-system';
import { AnchorIcon, SwordsIcon, XIcon } from 'lucide-react';
import { app, useApp, briefOf, browse, cancelPicker, firstRun, hasCampaign, playPicked } from './core.js';
import { Flag } from './parts.jsx';

const quiet = 'text-sm text-muted-foreground';

export function Picker({ wide }) {
  const { ui, scenarios, data } = useApp(); const p = ui.picker; const first = firstRun();
  useEffect(() => {
    if (first) return undefined;
    const esc = e => { if (e.key === 'Escape' && !app.ui.confirm) cancelPicker(); };
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, [first]);
  if (!p) return null;
  const s = scenarios.find(c => c.id === p.id) || scenarios[0];
  const heading = <h1 data-testid="picker-title" className="text-sm font-semibold text-foreground">{first ? 'Choose your country' : 'Change country'}</h1>;
  const close = first ? null : <IconButton label="Close" size="md" tooltip={false} data-testid="picker-close" onClick={cancelPicker}><XIcon /></IconButton>;
  const nations = (
    <ChoiceCards variant="thumbs" flow={wide ? 'column' : 'scroll'} label="Country" value={p.id} onChange={browse} data-testid="nations"
      options={scenarios.map(c => ({ value: c.id, label: c.name, sub: c.empire, preview: wide ? <Flag flag={c.flag} size="lg" /> : <Flag flag={c.flag} shape="rect" size="lg" className="max-w-full" />, data: { 'data-testid': 'country', 'data-id': c.id } }))} />
  );
  const play = (
    <Button size="lg" className="w-full" data-testid="play" loading={p.busy} onClick={playPicked}>
      {!first && hasCampaign(s.id) ? `Continue as ${s.name}` : `Play as ${s.name}`}
    </Button>
  );
  const briefing = <Briefing key={s.id} s={s} playing={!first && s.id === data.scenario} />;
  const loading = p.busy && app.view.map.id !== p.id ? <Card padding="sm" role="status" aria-label="Loading the map" data-testid="map-loading" className="flex"><Spinner size="md" tone="muted" /></Card> : null;

  if (wide) {
    return (
      <div data-testid="picker" className="pointer-events-none absolute inset-0 z-20">
        <Card as="aside" padding="none" radius="panel" className="pointer-events-auto absolute inset-y-4 start-4 flex w-68 flex-col">
          <div className="space-y-1 px-5 pt-4 pb-2">
            <div className="flex min-h-8 items-center justify-between gap-2">{heading}{close}</div>
            <p className="text-xs text-muted-foreground">{first ? 'A journal you read as a map. Each of a country’s 7 borders is one part of your life. Pick the map you want; you can change it later.' : 'Each country keeps its own campaign. Nothing is lost by switching.'}</p>
          </div>
          <div className="min-h-0 flex-1"><ScrollArea scrollFade><div className="p-3">{nations}</div></ScrollArea></div>
        </Card>
        {loading ? <div className="absolute inset-y-0 start-76 end-100 grid place-items-center">{loading}</div> : null}
        <Card as="section" aria-label="Briefing" padding="none" radius="panel" className="pointer-events-auto absolute inset-y-4 end-4 flex w-92 flex-col">
          <div className="min-h-0 flex-1"><ScrollArea scrollFade><div className="p-5">{briefing}</div></ScrollArea></div>
          <div className="p-4">{play}</div>
        </Card>
      </div>
    );
  }
  return (
    <div data-testid="picker" className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-4 pt-safe">
        <Card padding="sm" className="pointer-events-auto mt-3">{heading}</Card>
        {close ? <Card padding="none" className="pointer-events-auto mt-3 p-1">{close}</Card> : null}
      </div>
      {loading ? <div className="absolute inset-x-0 top-0 grid h-9/20 place-items-center">{loading}</div> : null}
      <div className="absolute inset-x-0 top-9/20 bottom-0 flex px-2 pb-safe">
        <Card as="section" aria-label="Briefing" padding="none" radius="panel" className="pointer-events-auto mb-2 flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-w-0 px-1 pt-1">{nations}</div>
          <div className="min-h-0 flex-1"><ScrollArea scrollFade><div className="px-4 pt-2 pb-4">{briefing}</div></ScrollArea></div>
          <div className="px-3 pb-3">{play}</div>
        </Card>
      </div>
    </div>
  );
}

// What you are choosing: who the country is, what it means to win, and what it starts with.
function Briefing({ s, playing }) {
  const b = briefOf(s.id);
  return (
    <Stagger step="settle" data-testid="briefing" data-id={s.id} className="space-y-4">
      <PersonRow size="lg" avatar={<Flag flag={s.flag} shape="rect" size="xl" />} name={<span data-testid="brief-name">{s.name}</span>} detail={`${s.long} · ${s.year}`}
        trailing={playing ? <Badge variant="secondary">Playing</Badge> : null} />
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Empire to restore</p>
        <p className="text-sm font-medium text-foreground" data-testid="brief-empire">{s.empire}</p>
        {s.blurb ? <p className={quiet}>{s.blurb}</p> : null}
      </div>
      {b ? (
        <div className="grid grid-cols-3 gap-4" data-testid="brief-stats">
          <StatTile variant="plain" label="Divisions" value={b.divisions} />
          <StatTile variant="plain" label="Ships" value={b.ships} />
          <StatTile variant="plain" label="Air wings" value={b.wings} />
        </div>
      ) : null}
      {b ? (
        <ListSection title={`${b.fronts.length} fronts`} description="Each border stands for a part of your life. You can rename them.">
          {b.fronts.map(f => {
            const Icon = f.naval ? AnchorIcon : SwordsIcon;
            return (
              <ListRow key={f.id} variant="item" inline data-testid="brief-front" data-front={f.id} media={<Icon className="size-4 text-muted-foreground" />}
                title={f.name} description={`${f.enemy} · ${f.naval ? 'Naval' : 'Land'}`} control={<Badge variant="outline">{f.label}</Badge>} />
            );
          })}
        </ListSection>
      ) : <LoadingState variant="rows" count={4} label="Loading the briefing" />}
    </Stagger>
  );
}
