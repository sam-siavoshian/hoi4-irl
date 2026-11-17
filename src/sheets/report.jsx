// Report: say or type what happened, send it. If the staff can't place it, pick the front by hand.
import { useRef } from 'react';
import { Badge, Button, Field, IconButton, ListRow, ListSection, Spinner, StatusLabel, Textarea } from '@sam/design-system';
import { CheckIcon, MicIcon, RotateCcwIcon, SquareIcon, TargetIcon } from 'lucide-react';
import { orderText } from '../../js/engine.js';
import { pickEngine } from '../../js/voice.js';
import { app, activeFronts, labels, quick, retryMic, send, setReportText, toggleMic } from '../core.js';

export function Orders() {
  const { live, map } = app;
  return (
    <ListSection title="Orders of the day">
      {(live.orders || []).map((o, i) => (
        <ListRow key={i} data-testid="order" aria-disabled={o.done || undefined}
          media={o.done ? <CheckIcon className="size-4 text-success" /> : <TargetIcon className="size-4 text-muted-foreground" />}
          title={orderText(o, labels(), map)} status={<Badge variant="outline">+{o.reward} XP</Badge>} />
      ))}
    </ListSection>
  );
}

const clock = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

function Composer() {
  const { ui, cfg } = app; const r = ui.report; const field = useRef(null);
  const keyboard = pickEngine(cfg) === 'keyboard';
  const state = ui.dict ? (ui.dict.state === 'transcribing' ? 'busy' : 'live') : 'idle';
  const hint = r.note || (r.text ? '' : keyboard ? 'Type, or use the microphone key on your keyboard.' : 'Press the microphone and talk, or type.');
  return (
    <div className="space-y-3">
      <Field label="What happened?" htmlFor="report-text" hint={state === 'idle' ? hint : null}>
        <Textarea id="report-text" ref={field} size="lg" rows={4} placeholder="Failed a quiz. Hit a PR at the gym. Great call with mom."
          value={r.text} onChange={e => setReportText(e.target.value)} />
      </Field>
      {state === 'live' ? <StatusLabel tone="live" variant="caption" data-testid="mic-clock">Listening {clock(ui.dict.seconds || 0)}. Press the square to stop.</StatusLabel> : null}
      {state === 'busy' ? <span className="flex items-center gap-2 text-xs text-muted-foreground"><Spinner size="xs" />Turning that into text…</span> : null}
      <div className="flex items-center gap-2">
        <IconButton label={state === 'live' ? 'Stop dictating' : 'Dictate'} data-testid="mic" data-state={state} size="lg" variant={state === 'live' ? 'destructive' : 'outline'}
          disabled={state === 'busy'} onClick={() => toggleMic(() => field.current?.focus())}>
          {state === 'live' ? <SquareIcon /> : <MicIcon />}
        </IconButton>
        {r.audio && state === 'idle' ? <Button variant="outline" size="lg" data-testid="retry-mic" onClick={retryMic}><RotateCcwIcon />Retry</Button> : null}
        <Button size="lg" className="flex-1" loading={r.busy || r.sendAfter} data-testid="send" onClick={send}>Send</Button>
      </div>
    </div>
  );
}

export const report = {
  title: () => 'Report',
  Body() {
    const r = app.ui.report; const L = labels();
    if (!r) return null;
    return (
      <>
        <Composer />
        {r.pick ? (
          <ListSection title="Which front?" description="The staff couldn’t place that. Pick where it belongs.">
            {activeFronts().map(f => (
              <ListRow key={f.id} variant="item" inline data-testid="pick" title={L[f.id]}
                control={<>
                  <Button variant="outline" size="sm" onClick={() => quick(f.id, 'win')}>Win</Button>
                  <Button variant="outline" size="sm" onClick={() => quick(f.id, 'loss')}>Loss</Button>
                </>} />
            ))}
          </ListSection>
        ) : <Orders />}
      </>
    );
  },
};
