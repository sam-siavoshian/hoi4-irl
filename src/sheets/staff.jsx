// The general staff: which provider judges your reports, its key and model, a test, and how speech becomes text.
// The key is the owner's own. It is sent to the private server once and kept there: this screen only ever learns
// whether a provider has one, and its last 4 characters. What it does is in core.js (chooseProvider, saveStaff,
// dropStaffKey, testStaff); who the providers are and their small default models come from the server (GET /api/ai).
import { useEffect, useState } from 'react';
import { Button, ChoiceCards, ChoiceSelect, InlineButton, Input, ListRow, ListSection, LoadingState, StatusLabel, StatusLine } from '@sam/design-system';
import { app, useApp, chooseProvider, dropStaffKey, saveStaff, staffOf, testStaff } from '../core.js';
import { ProviderLogo } from '../parts.jsx';

const quiet = 'text-sm text-muted-foreground';
const HOST_IT = 'https://github.com/sam-siavoshian/hoi4-irl#readme';
// a state in a word. Something to act on is the attention tone; red is not used here.
const STATUS = { ready: ['success', 'Ready'], no_key: ['attention', 'No key'], rejected: ['attention', 'Key rejected'], no_address: ['attention', 'No address'], no_model: ['attention', 'No model'], offline: ['idle', 'Offline'] };
export function StaffStatus({ status }) {
  const [tone, word] = STATUS[status] || STATUS.offline;
  return <StatusLabel tone={tone} animate={false} data-testid="staff-status" data-status={status}>{word}</StatusLabel>;
}
const outside = href => <a href={href} target="_blank" rel="noopener noreferrer" />;
const took = t => (t.ms < 950 ? `Works. ${t.model} answered in under 1 second.` : `Works. ${t.model} answered in ${Math.round(t.ms / 1000)} seconds.`);
const blurb = p => (!p.judges ? 'Reports are judged by keywords on your server. Nothing leaves it.'
  : p.id === 'custom' ? 'Any server that speaks OpenAI’s Chat Completions.'
    : p.local ? `Runs on your own machine. No key, and nothing leaves it.`
      : `Reports go to ${p.name} to be judged, with your own key.`);

// A key: a field to paste into, or, once saved, its last 4 characters with Replace and Remove.
function KeyRow({ p }) {
  const { ui } = app; const [text, setText] = useState(''); const [open, setOpen] = useState(false);
  const id = `key-${p.id}`; const busy = ui.staff.busy === id;
  const save = async () => { if (!text.trim() || busy) return; if (await saveStaff({ keys: { [p.id]: text.trim() } }, id)) { setText(''); setOpen(false); } };
  if (p.hasKey && !open) {
    return (
      <ListRow inline data-testid="key-saved" data-provider={p.id} title="Key"
        description={p.keySource === 'app' ? <span className="tabular-nums" data-testid="key-tail">•••• {p.last4}</span> : 'Set on the server, in .env. Add one here to use it instead.'}
        control={<>
          <Button size="sm" variant="outline" data-testid="key-replace" onClick={() => setOpen(true)}>Replace</Button>
          {p.keySource === 'app' ? <Button size="sm" variant="ghost-destructive" data-testid="key-remove" loading={ui.staff.busy === 'drop'} onClick={() => dropStaffKey(p.id)}>Remove</Button> : null}
        </>} />
    );
  }
  return (
    <ListRow data-testid="key-row" data-provider={p.id} title={p.keyOptional ? 'Key, if the server needs one' : 'Key'}
      description={<>Kept on your server only. {p.keyUrl ? <InlineButton data-testid="key-link" render={outside(p.keyUrl)}>Get a key</InlineButton> : null}</>}>
      <div className="mt-3 flex items-center gap-2">
        <Input id={id} type="password" aria-label={`${p.name} key`} font="mono"className="min-w-0 flex-1" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="Paste your key" data-testid="key-input"
          value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} />
        <Button data-testid="key-save" loading={busy} disabled={!text.trim()} onClick={save}>Save key</Button>
        {open ? <Button variant="ghost" onClick={() => { setOpen(false); setText(''); }}>Cancel</Button> : null}
      </div>
    </ListRow>
  );
}

// A line of text that saves when you leave it or press Enter. `value` is what the server holds.
function SavedInput({ id, label, value, placeholder, testid, onSave }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  const commit = () => { const t = text.trim(); if (t !== value) onSave(t); };
  return <Input id={id} aria-label={label} font="mono" className="min-w-0 flex-1" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder={placeholder} data-testid={testid}
    value={text} onChange={e => setText(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}

function Provider({ p }) {
  const { ui } = app; const st = ui.staff; const t = st.test;
  return (
    <ListSection data-testid="staff-provider" data-provider={p.id} title={p.name} description={blurb(p)} headerAction={<StaffStatus status={p.status} />}>
      {p.needsKey || p.keyOptional ? <KeyRow key={p.id} p={p} /> : null}
      {p.baseEditable ? (
        <ListRow title="Address" description={p.id === 'custom' ? 'Where the server answers, up to /v1.' : `Where ${p.name} answers. Change it if it runs on another machine.`}>
          <div className="mt-3 flex"><SavedInput id="staff-address" label={`${p.name} address`} testid="staff-address" value={p.base} placeholder={p.defaultBase || 'http://localhost:8000/v1'} onSave={v => saveStaff({ provider: p.id, bases: { [p.id]: v || null } })} /></div>
        </ListRow>
      ) : null}
      {p.judges ? (
        <ListRow title="Model" description="A small model is enough. Judging a day needs no frontier model.">
          <div className="mt-3 flex items-center gap-3">
            <SavedInput id="staff-model" label={`${p.name} model`} testid="staff-model" value={p.model} placeholder={p.defaultModel || 'The model’s name'} onSave={v => saveStaff({ provider: p.id, models: { [p.id]: v || null } })} />
            {p.defaultModel && p.model !== p.defaultModel ? <InlineButton data-testid="model-default" onClick={() => saveStaff({ provider: p.id, models: { [p.id]: p.defaultModel } })}>Use default</InlineButton> : null}
          </div>
        </ListRow>
      ) : null}
      {p.judges ? (
        <ListRow inline title="Test" description="One small request that proves the key and the model work."
          status={t ? <StatusLine data-testid="test-result" data-ok={t.ok ? 'yes' : 'no'} tone={t.ok ? 'ok' : 'error'} text={t.ok ? took(t) : t.message} /> : null}
          control={<Button variant="outline" data-testid="staff-test" loading={st.busy === 'test'} disabled={p.status !== 'ready' && p.status !== 'rejected'} onClick={() => testStaff('judge')}>Test</Button>} />
      ) : null}
    </ListSection>
  );
}

// How speech becomes text: the staff's own provider when it can, another one with its own key, or this device.
function Voice({ ai, p }) {
  const st = app.ui.staff; const v = ai.transcribe; const t = st.voiceTest;
  const able = ai.providers.filter(x => x.defaultStt);
  const options = [
    ...(p.defaultStt ? [{ value: 'same', label: 'Same as the staff' }] : []),
    ...able.filter(x => x.id !== p.id).map(x => ({ value: x.id, label: x.name })),
    { value: 'device', label: 'On this device' },
  ];
  const mode = options.some(o => o.value === v.mode) ? v.mode : 'device';
  const other = mode !== 'same' && mode !== 'device' ? staffOf(mode) : null;
  const who = mode === 'same' ? p : other;
  return (
    <ListSection data-testid="staff-voice" title="Voice" description={p.defaultStt ? 'What turns your speech into text.' : `${p.name} can’t turn speech into text. Choose who does.`}>
      <ListRow title="Speech to text" data-testid="voice-row"
        description={mode === 'device' ? 'Your browser’s dictation, or the microphone key on your keyboard.' : v.model ? `${who.name} writes it down with ${v.model}, its small speech model.` : `${who.name} needs a key first.`}
        control={<ChoiceSelect label="Speech to text" value={mode} options={options} disabled={st.busy === 'voice'} onChange={m => saveStaff({ transcribe: { mode: m } }, 'voice')} />} />
      {other ? <KeyRow key={other.id} p={other} /> : null}
      {mode !== 'device' ? (
        <ListRow inline title="Test" description="Half a second of silence, sent once."
          status={t ? <StatusLine data-testid="voice-result" data-ok={t.ok ? 'yes' : 'no'} tone={t.ok ? 'ok' : 'error'} text={t.ok ? took(t) : t.message} /> : null}
          control={<Button variant="outline" data-testid="voice-test" loading={st.busy === 'voiceTest'} disabled={!v.model} onClick={() => testStaff('transcribe')}>Test</Button>} />
      ) : null}
    </ListSection>
  );
}

function StaffBody() {
  const { ai, cfg, ui } = useApp();
  if (!cfg.server) {
    return (
      <ListSection title="This is the demo" data-testid="staff-demo">
        <ListRow media={<ProviderLogo id="offline" className="size-4 text-muted-foreground" />} title="Offline judge"
          description={<>Keys need the self-hosted server, which keeps them on your own machine. The demo runs in this browser alone, so there’s nothing to fill in here. <InlineButton render={outside(HOST_IT)}>Host your own</InlineButton> to add a model.</>} />
      </ListSection>
    );
  }
  if (!ai) return <LoadingState variant="rows" count={4} label="Loading the staff" />;
  const p = staffOf(ai.provider) || ai.providers[0];
  return (
    <>
      <p className={quiet}>Choose who judges your reports. Your key stays on your server.</p>
      <ChoiceCards variant="tiles" columns={2} label="Provider" value={p.id} disabled={!!ui.staff.busy && ui.staff.busy !== 'choose'} onChange={chooseProvider}
        options={ai.providers.map(x => ({ value: x.id, label: x.name, icon: <ProviderLogo id={x.id} />, data: { 'data-testid': 'provider', 'data-id': x.id } }))} />
      {ui.staff.error ? <StatusLine data-testid="staff-error" tone="error" text={ui.staff.error} /> : null}
      <Provider key={p.id} p={p} />
      <Voice ai={ai} p={p} />
      <p className="text-xs text-muted-foreground">Names and logos belong to their owners. They’re shown to say which service is which.</p>
    </>
  );
}
export const staff = { title: () => 'General staff', Body: StaffBody };
