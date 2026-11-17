// The general staff: which provider judges your reports, its key and model, a test, and how speech becomes text.
// The key is the owner's own. It is sent to the private server once and kept there: this screen only ever learns
// whether a provider has one, and its last 4 characters. What it does is in core.js (chooseProvider, saveStaff,
// dropStaffKey, testStaff, findLocal, loadModels); who the providers are and their small default models come from the
// server (GET /api/ai). A local model is its own short path: find what is running, pick a model, test it; the rest is
// under Advanced.
import { useEffect, useState } from 'react';
import { Button, ChoiceCards, ChoiceSelect, Field, InlineButton, Input, ListRow, ListRowDisclosure, ListSection, LoadingState, StatusLabel, StatusLine } from '@sam/design-system';
import { app, useApp, chooseProvider, dropStaffKey, findLocal, loadModels, saveStaff, staffOf, testStaff, applyLocal } from '../core.js';
import { ProviderLogo } from '../parts.jsx';

const quiet = 'text-sm text-muted-foreground';
const HOST_IT = 'https://github.com/sam-siavoshian/hoi4-irl#readme';
// a state in a word. Something to act on is the attention tone; red is not used here.
const STATUS = { ready: ['success', 'Ready'], no_key: ['attention', 'No key'], rejected: ['attention', 'Key rejected'], no_address: ['attention', 'No address'], no_model: ['attention', 'No model'], server_down: ['attention', 'Model server not running'], offline: ['idle', 'Offline'] };
export function StaffStatus({ status }) {
  const [tone, word] = STATUS[status] || STATUS.offline;
  return <StatusLabel tone={tone} animate={false} data-testid="staff-status" data-status={status}>{word}</StatusLabel>;
}
const outside = href => <a href={href} target="_blank" rel="noopener noreferrer" />;
const MODE_WORDS = { json_schema: 'held to the schema', json_object: 'in JSON mode', text: 'in plain text, read for its JSON' };
const took = t => [t.ms < 950 ? `Works. ${t.model} answered in under 1 second` : `Works. ${t.model} answered in ${Math.round(t.ms / 1000)} seconds`,
  t.tps ? `, ${t.tps} tokens a second` : '', t.mode ? `, ${MODE_WORDS[t.mode]}` : '', '.'].join('');
const blurb = p => (!p.judges ? 'Reports are judged by keywords on your server. Nothing leaves it.'
  : p.local ? 'A model on your own machine or network: Ollama, LM Studio, llama.cpp or any server with the same API. Nothing leaves your network.'
    : `Reports go to ${p.name} to be judged, with your own key.`);
const gb = n => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n >= 1e6 ? `${Math.round(n / 1e6)} MB` : '');
const modelLabel = m => [m.id, [m.params, m.quant].filter(Boolean).join(' '), m.size ? gb(m.size) : ''].filter(Boolean).join(' · ');
const plural = (n, one) => `${n} ${one}${n === 1 ? '' : 's'}`;

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
function SavedInput({ id, label, value, placeholder, testid, onSave, numeric = false }) {
  const [text, setText] = useState(value ?? '');
  useEffect(() => { setText(value ?? ''); }, [value]);
  const commit = () => { const t = text.trim(); if (t !== String(value ?? '')) onSave(t); };
  return <Input id={id} aria-label={label} font="mono" className="min-w-0 flex-1" inputMode={numeric ? 'decimal' : undefined} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder={placeholder} data-testid={testid}
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

// ---- a model server of the owner's own: the same few rows for the judge and for speech ----
// Which kind of server it is (a preset that fills the address) and the address itself, which can be anywhere:
// this machine, another one on the network or the tailnet.
function ServerRow({ id, p, presets, onPreset }) {
  const busy = app.ui.staff.busy;
  const value = presets.some(r => r.id === p.runtime) ? p.runtime : 'other';
  return (
    <ListRow title="Address" data-testid={`${id}-server`}
      description="Where the server answers, up to /v1. It can be on another machine on your network."
      control={<ChoiceSelect label="Kind of server" value={value} disabled={!!busy} options={presets.map(r => ({ value: r.id, label: r.name }))} onChange={onPreset} />}>
      <div className="mt-3 flex"><SavedInput id={`${id}-address`} label={`${p.name} address`} testid={`${id}-address`} value={p.base} placeholder="http://127.0.0.1:11434/v1" onSave={v => applyLocal({ bases: { [id]: v || null } }, id)} /></div>
    </ListRow>
  );
}

// The models a server has, to pick from, and a field for any name it takes: a tag, a repository, a file.
// list: what GET /api/ai/models said. value: the model in use. save(name): keep another.
function ModelRow({ id, list, loading, value, save, placeholder, description, extra = null }) {
  const listed = list?.ok && list.listed && list.models.length ? list.models : null;
  const options = listed ? [...(value && !listed.some(m => m.id === value || m.id === `${value}:latest`) ? [{ value, label: `${value} (not in the list)` }] : []), ...listed.map(m => ({ value: m.id, label: modelLabel(m) }))] : null;
  const chosen = listed?.find(m => m.id === value || m.id === `${value}:latest`)?.id || value;
  const status = loading ? <StatusLine data-testid={`${id}-models-state`} text="Reading the server’s list of models…" />
    : !list ? null
      : !list.ok ? <StatusLine data-testid={`${id}-models-state`} data-reason={list.reason} tone="error" text={list.message} />
        : list.installed === false ? <StatusLine data-testid={`${id}-models-state`} data-reason="not_installed" tone="error" text={`${value} isn’t in this server’s list. ${list.get ? `To install it: ${list.get}.` : ''} Some servers load a model by name anyway: Test says for sure.`} />
          : list.listed && !list.models.length ? <StatusLine data-testid={`${id}-models-state`} data-reason="empty" tone="error" text="The server answered, but it has no models yet. Pull or load one, then refresh the list." />
            : listed ? <StatusLine data-testid={`${id}-models-state`} data-reason="listed" text={`${plural(listed.length, 'model')} on this server.`} /> : null;
  return (
    <ListRow title="Model" data-testid={`${id}-model-row`} description={description} status={status}
      control={options ? <ChoiceSelect label="Installed models" className="w-full sm:w-80" value={chosen} options={options} disabled={!!app.ui.staff.busy} onChange={m => m !== chosen && save(m)} /> : null}>
      <div className="mt-3 flex items-center gap-3">
        <SavedInput id={`${id}-model`} label={`Model name for ${id === 'speech' ? 'speech' : 'the local model'}`} testid={id === 'local' ? 'staff-model' : `${id}-model`} value={value} placeholder={placeholder} onSave={v => save(v || null)} />
        <Button size="sm" variant="ghost" data-testid={`${id}-refresh`} disabled={loading} onClick={() => loadModels(id)}>Refresh list</Button>
        {extra}
      </div>
    </ListRow>
  );
}

// What discovery found, in one line, and a choice when it found more than one server.
function Found({ p }) {
  const L = app.ui.local, f = L.found;
  if (!f) return null;
  if (!f.length) return <StatusLine data-testid="local-found" data-count="0" tone="error" text="No model server answered on this machine. Start one and find again, or type its address below if it runs somewhere else." />;
  const line = f.map(s => `${s.name} with ${plural(s.models.length, 'model')}`).join(', ');
  return (
    <div className="mt-3 flex flex-col gap-3">
      <StatusLine data-testid="local-found" data-count={f.length} tone="ok" text={`Found ${line}.`} />
      {f.length > 1 ? <ChoiceSelect label="Model server" className="w-full sm:w-64" value={f.some(s => s.base === p.base) ? p.base : f[0].base} disabled={!!app.ui.staff.busy}
        options={f.map(s => ({ value: s.base, label: `${s.name}, ${s.base.replace(/^https?:\/\//, '')}` }))}
        onChange={base => { const s = f.find(x => x.base === base); applyLocal({ provider: 'local', bases: { local: s.base }, local: { runtime: s.runtime === 'other' ? null : s.runtime }, ...(s.models[0] ? { models: { local: s.models[0].id } } : {}) }); }} /> : null}
    </div>
  );
}

// a key some local servers are started with (llama-server --api-key, vLLM --api-key, LocalAI, Jan, KoboldCpp --password)
function LocalKey({ p }) {
  const { ui } = app; const [text, setText] = useState(''); const busy = ui.staff.busy === 'key-local';
  const save = async () => { if (text.trim() && !busy && await saveStaff({ keys: { local: text.trim() } }, 'key-local')) setText(''); };
  if (p.hasKey) {
    return (
      <Field label="Key">
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-foreground" data-testid="local-key-tail">{p.keySource === 'app' ? `•••• ${p.last4}` : 'Set on the server, in .env'}</span>
          {p.keySource === 'app' ? <Button size="sm" variant="ghost-destructive" loading={ui.staff.busy === 'drop'} onClick={() => dropStaffKey('local')}>Remove</Button> : null}
        </div>
      </Field>
    );
  }
  return (
    <Field label="Key, if the server needs one" htmlFor="local-key" hint="Only for a server started with a key, such as llama-server --api-key. Kept on your server.">
      <div className="flex items-center gap-2">
        <Input id="local-key" type="password" font="mono" className="min-w-0 flex-1" autoComplete="off" spellCheck={false} placeholder="Paste the key" data-testid="local-key"
          value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} />
        <Button variant="outline" loading={busy} disabled={!text.trim()} onClick={save}>Save key</Button>
      </div>
    </Field>
  );
}

const LEARNED = { json_schema: 'Last time it was held to the schema.', json_object: 'Last time it needed JSON mode.', text: 'Last time it answered in plain text, and its JSON was read from that.' };
const JSON_WAYS = [{ value: 'auto', label: 'Automatic' }, { value: 'json_schema', label: 'Strict schema' }, { value: 'json_object', label: 'JSON mode' }, { value: 'text', label: 'Plain text' }];
function Advanced({ p }) {
  const o = p.options, ollama = p.runtime === 'ollama';
  const set = patch => saveStaff({ local: patch });
  const num = (key, label, hint, placeholder) => (
    <Field label={label} htmlFor={`local-${key}`} hint={hint}>
      <div className="flex"><SavedInput numeric id={`local-${key}`} label={label} testid={`local-${key}`} value={o[key] == null ? '' : String(o[key])} placeholder={placeholder} onSave={v => set({ [key]: v === '' ? null : Number(v) })} /></div>
    </Field>
  );
  return (
    <ListRowDisclosure title="Advanced" data-testid="local-advanced">
      <div className="flex flex-col gap-4 pt-1">
        <LocalKey p={p} />
        {num('timeout', 'Wait for an answer, in seconds', 'A model loads into memory before its first answer, which can take a while on a small machine.', String(p.defaultTimeout))}
        <Field label="Ask for JSON" hint={`Automatic tries the strictest way first and remembers what works for this model.${p.learned ? ` ${LEARNED[p.learned]}` : ''}`}>
          <ChoiceSelect label="Ask for JSON" value={o.mode || 'auto'} options={JSON_WAYS} onChange={m => set({ mode: m })} />
        </Field>
        {num('maxTokens', 'Most tokens to write', 'Leave it empty for the server’s own limit. A judgement needs a few hundred.', 'The server’s default')}
        {num('temperature', 'Temperature', 'At 0 the same report is judged the same way every time.', '0')}
        {ollama ? num('context', 'Context length, in tokens', 'Ollama only. Other servers take it when they start, such as llama-server -c 8192.', 'The model’s default') : null}
        {ollama ? (
          <Field label="Keep the model loaded for" htmlFor="local-keepAlive" hint="Ollama only: a time such as 10m or 1h, or -1 to keep it loaded.">
            <div className="flex"><SavedInput id="local-keepAlive" label="Keep the model loaded for" testid="local-keepAlive" value={o.keepAlive} placeholder="5m" onSave={v => set({ keepAlive: v })} /></div>
          </Field>
        ) : null}
      </div>
    </ListRowDisclosure>
  );
}

// The local model: find what is running, pick a model, test it.
function LocalModel({ p, ai }) {
  const { ui } = app; const st = ui.staff; const t = st.test; const L = ui.local;
  useEffect(() => { if (p.base && !L.models.local && !L.loading.local) loadModels('local'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const preset = id => { const r = ai.runtimes.find(x => x.id === id); applyLocal({ local: { runtime: id === 'other' ? null : id }, ...(r?.base ? { bases: { local: r.base } } : {}) }); };
  return (
    <ListSection data-testid="staff-provider" data-provider={p.id} title={p.name} description={blurb(p)} headerAction={<StaffStatus status={p.status} />}>
      <ListRow title="Find local models" data-testid="local-find-row" description="Looks for a model server running on this machine. Nothing else on your network is touched."
        control={<Button variant="outline" data-testid="local-find" loading={L.finding} onClick={findLocal}>Find local models</Button>}>
        <Found p={p} />
      </ListRow>
      <ServerRow id="local" p={p} presets={ai.runtimes} onPreset={preset} />
      <ModelRow id="local" list={L.models.local} loading={!!L.loading.local} value={p.model} placeholder="A tag, a repository or a .gguf file"
        description="Pick one the server has, or type any name it takes. A 3 to 8B instruct model is enough."
        save={m => applyLocal({ provider: 'local', models: { local: m } })} />
      <ListRow inline title="Test" description="One small request: is the server there, has it this model, and does it answer with JSON."
        status={t ? <StatusLine data-testid="test-result" data-ok={t.ok ? 'yes' : 'no'} data-reason={t.reason || ''} tone={t.ok ? 'ok' : 'error'} text={t.ok ? took(t) : t.message} /> : null}
        control={<Button variant="outline" data-testid="staff-test" loading={st.busy === 'test'} disabled={!['ready', 'rejected', 'server_down'].includes(p.status)} onClick={() => testStaff('judge')}>Test</Button>} />
      <Advanced p={p} />
    </ListSection>
  );
}

// How speech becomes text: the staff's own provider when it can, another one with its own key, a speech server of
// your own, or this device.
function Voice({ ai, p }) {
  const st = app.ui.staff; const v = ai.transcribe; const t = st.voiceTest; const L = app.ui.local;
  const able = ai.providers.filter(x => x.defaultStt);
  const options = [
    ...(p.defaultStt ? [{ value: 'same', label: 'Same as the staff' }] : []),
    ...able.filter(x => x.id !== p.id).map(x => ({ value: x.id, label: x.name })),
    { value: 'device', label: 'On this device' },
  ];
  const mode = options.some(o => o.value === v.mode) ? v.mode : 'device';
  const other = mode !== 'same' && mode !== 'device' ? staffOf(mode) : null;
  const who = mode === 'same' ? p : other;
  const own = who?.id === 'speech';
  useEffect(() => { if (own && who.base && !L.models.speech && !L.loading.speech) loadModels('speech'); }, [own]); // eslint-disable-line react-hooks/exhaustive-deps
  const speechPreset = id => { const r = ai.speechRuntimes.find(x => x.id === id); applyLocal({ speech: { runtime: id }, ...(r?.base ? { bases: { speech: r.base } } : {}), ...(r?.model ? { transcribe: { models: { speech: r.model } } } : {}) }, 'speech'); };
  const sttModel = who ? who.sttModel : null;
  return (
    <ListSection data-testid="staff-voice" title="Voice" description={p.defaultStt ? 'What turns your speech into text.' : `${p.name} can’t turn speech into text. Choose who does.`}
      headerAction={own ? <StaffStatus status={v.status} /> : null}>
      <ListRow title="Speech to text" data-testid="voice-row"
        description={mode === 'device' ? 'Your browser’s dictation, or the microphone key on your keyboard.' : own ? 'A speech server of your own, such as Speaches or whisper.cpp. Nothing leaves your network.' : v.model ? `${who.name} writes it down with ${v.model}.` : `${who.name} needs a key first.`}
        control={<ChoiceSelect label="Speech to text" value={mode} options={options} disabled={st.busy === 'voice'} onChange={m => saveStaff({ transcribe: { mode: m } }, 'voice')} />} />
      {other && !own ? <KeyRow key={other.id} p={other} /> : null}
      {own ? <ServerRow id="speech" p={who} presets={ai.speechRuntimes} onPreset={speechPreset} /> : null}
      {own ? (
        <ModelRow id="speech" list={L.models.speech} loading={!!L.loading.speech} value={sttModel} placeholder="Systran/faster-distil-whisper-small.en"
          description="The speech model the server should use. whisper.cpp uses the file it was started with, whatever is typed here."
          save={m => applyLocal({ transcribe: { models: { speech: m } } }, 'speech')} />
      ) : who && mode !== 'device' ? (
        <ListRow title="Speech model" data-testid="voice-model-row" description="The provider’s small speech model is filled in. Type another if you prefer it.">
          <div className="mt-3 flex items-center gap-3">
            <SavedInput id="voice-model" label={`${who.name} speech model`} testid="voice-model" value={sttModel} placeholder={who.defaultStt} onSave={m => saveStaff({ transcribe: { models: { [who.id]: m || null } } }, 'voice')} />
            {sttModel !== who.defaultStt ? <InlineButton data-testid="voice-model-default" onClick={() => saveStaff({ transcribe: { models: { [who.id]: null } } }, 'voice')}>Use default</InlineButton> : null}
          </div>
        </ListRow>
      ) : null}
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
        options={ai.providers.filter(x => !x.sttOnly).map(x => ({ value: x.id, label: x.name, icon: <ProviderLogo id={x.id} />, data: { 'data-testid': 'provider', 'data-id': x.id } }))} />
      {ui.staff.error ? <StatusLine data-testid="staff-error" tone="error" text={ui.staff.error} /> : null}
      {p.id === 'local' ? <LocalModel key={p.id} p={p} ai={ai} /> : <Provider key={p.id} p={p} />}
      <Voice ai={ai} p={p} />
      <p className="text-xs text-muted-foreground">Names and logos belong to their owners. They’re shown to say which service is which.</p>
    </>
  );
}
export const staff = { title: () => 'General staff', Body: StaffBody };
