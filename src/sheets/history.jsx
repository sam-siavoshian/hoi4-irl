// History: ask the staff, the calendar, every entry with edit and delete; and the editor for one entry.
import { Button, Card, ChoiceSelect, DayGrid, EmptyState, Field, IconButton, Input, ListSection, NumberStepper, Segmented } from '@sam/design-system';
import { BookOpenIcon, PencilIcon, PlayIcon, SearchIcon, Trash2Icon, XIcon } from 'lucide-react';
import { ACTIONS, WIN_ACTIONS, LOSS_ACTIONS } from '../../js/engine.js';
import { app, back, clearAsk, dayKey, deleteReport, editItem, editReport, fmtDate, labels, openSheet, removeItem, runAsk, saveEdit, setAsk, startReplay } from '../core.js';
import { EventRow } from '../parts.jsx';

const WEEKS = 20;
// 20 weeks of days, oldest first: green for a day that went well on balance, red for one that did not
function days(live) {
  const today = dayKey(Date.now()); const dow = (new Date().getDay() + 6) % 7; const start = today - dow - (WEEKS - 1) * 7;
  const net = new Map();
  for (const l of live.log) { if (l.kind) continue; const k = dayKey(l.ts); net.set(k, (net.get(k) || 0) + l.items.reduce((a, i) => a + (i.outcome === 'win' ? i.severity : i.outcome === 'loss' ? -i.severity : 0), 0)); }
  return Array.from({ length: WEEKS * 7 }, (_, n) => {
    const d = start + n, v = net.get(d);
    return { future: d > today, tone: v == null ? null : v > 0 ? 'success' : v < 0 ? 'danger' : 'neutral', level: v == null ? 1 : Math.abs(v) >= 6 ? 3 : Math.abs(v) >= 3 ? 2 : 1 };
  });
}

function Entry({ l }) {
  const notes = l.fx.filter(x => x.tone).slice(0, 6).map(x => x.text);
  return (
    <ListSection data-testid="entry" title={fmtDate(l.ts)}
      description={l.summary || notes.length ? <>{l.summary ? <span className="block">{l.summary}</span> : null}{notes.length ? <span className="block">{notes.join(' · ')}</span> : null}</> : null}
      headerAction={<>
        <IconButton label="Edit" onClick={() => editReport(l.id)}><PencilIcon /></IconButton>
        <IconButton label="Delete" variant="ghost-destructive" onClick={() => deleteReport(l.id)}><Trash2Icon /></IconButton>
      </>}>
      {l.items.map((i, n) => <EventRow key={n} item={i} />)}
    </ListSection>
  );
}

function Ask() {
  const { ui, live } = app; const a = ui.ask; const res = a.res;
  const cited = res ? res.cited.map(id => live.log.find(l => l.id === id)).filter(Boolean) : [];
  return (
    <>
      <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); runAsk(); }}>
        <Input size="lg" leading={<SearchIcon />} aria-label="Ask about your history" enterKeyHint="search" autoComplete="off" placeholder="When did I last go to the gym?"
          value={a.q} onChange={e => setAsk(e.target.value)} />
        <Button type="submit" variant="outline" size="lg" loading={a.busy}>Ask</Button>
      </form>
      {res ? (
        <>
          <Card variant="inset" data-testid="answer" className="space-y-3">
            <p className="text-sm whitespace-pre-line text-foreground">{res.answer}</p>
            {res.warning ? <p className="text-xs text-muted-foreground">{res.warning}</p> : null}
            {res.followups?.length ? (
              <div className="flex flex-wrap gap-2">
                {res.followups.map(f => <Button key={f} variant="outline" size="sm-multiline" onClick={() => runAsk(f)}>{f}</Button>)}
              </div>
            ) : null}
            <Button variant="ghost" size="sm" onClick={clearAsk}>Clear</Button>
          </Card>
          {cited.slice(0, 6).map(l => <Entry key={l.id} l={l} />)}
        </>
      ) : null}
    </>
  );
}

export const history = {
  title: () => 'History',
  Body() {
    const { live, ui } = app;
    const list = live.log.filter(l => !l.kind).reverse();
    if (!list.length) return (
      <EmptyState size="compact" icon={<BookOpenIcon />} title="No reports yet" description="Say or type how your day went. Every report is kept here."
        action={<Button onClick={() => openSheet('report')}>Report</Button>} />
    );
    return (
      <>
        <Ask />
        {ui.ask.res ? null : (
          <>
            <div className="space-y-3">
              <DayGrid cells={days(live)} label="The last 20 weeks, a square a day" />
              <Button variant="outline" size="sm" data-testid="replay" onClick={startReplay}><PlayIcon />Replay on map</Button>
            </div>
            {list.map(l => <Entry key={l.id} l={l} />)}
          </>
        )}
      </>
    );
  },
};

const OUTCOMES = [{ value: 'win', label: 'Win' }, { value: 'loss', label: 'Loss' }];
export const edit = {
  title: () => 'Edit entry',
  Body() {
    const { ui, map } = app; const res = ui.edit; const L = labels();
    const frontOptions = map.fronts.map(f => ({ value: f.id, label: L[f.id] }));
    return (
      <>
        {res.items.map((it, i) => (
          <Card key={i} variant="outline" data-testid="edit-item" className="space-y-4">
            <div className="flex items-center gap-2">
              <ChoiceSelect label="Front" className="sm:w-full" value={it.front} options={frontOptions} onChange={v => editItem(i, { front: v })} />
              <IconButton label="Remove" onClick={() => removeItem(i)}><XIcon /></IconButton>
            </div>
            <Field label="What happened" htmlFor={`edit-${i}`}>
              <Input id={`edit-${i}`} value={it.headline} onChange={e => editItem(i, { headline: e.target.value })} />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented label="Outcome" value={it.outcome} options={OUTCOMES} onChange={v => editItem(i, { outcome: v })} />
              <NumberStepper label="How much it mattered, 1 to 5" fieldLabel="Weight" min={1} max={5} value={it.severity} fewerLabel="Less" moreLabel="More" onChange={v => editItem(i, { severity: Math.max(1, Math.min(5, Math.round(v) || 1)) })} />
            </div>
            <ChoiceSelect label="Kind of battle" className="sm:w-full" value={it.action}
              options={(it.outcome === 'win' ? WIN_ACTIONS : LOSS_ACTIONS).map(a => ({ value: a, label: `${ACTIONS[a].label}: ${ACTIONS[a].means}` }))}
              onChange={v => editItem(i, { action: v })} />
          </Card>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" onClick={back}>Cancel</Button>
          <Button size="lg" disabled={!res.items.length} data-testid="save-edit" onClick={saveEdit}>Save</Button>
        </div>
      </>
    );
  },
};
