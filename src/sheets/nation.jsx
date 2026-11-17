// The nation: overview (rank, orders, decorations), share cards, settings and the first run's welcome.
// (Choosing a country is its own screen: ../picker.jsx.)
import { useEffect, useRef, useState } from 'react';
import { Button, CardButton, ChoiceCards, FileInput, InlineButton, Input, ListGroup, ListRow, ListRowButton, ListSection, ProgressMeter, Segmented, StatTile, Switch } from '@sam/design-system';
import { setAppearance, useTheme } from '@sam/design-system/theme';
import { DownloadIcon, LogOutIcon, MedalIcon, PlayIcon, SettingsIcon, ShareIcon, TargetIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { medalOf, medalProgress } from '../../js/engine.js';
import { PRESETS } from '../../js/presets.js';
import { app, F, CARDS, altDate, card, choosePreset, closeSheet, exportBackup, fmtDate, importBackup, labels, loadDemo, logOut, openPicker, openSheet, reset, setLabel, shareCard, toggleFront, toggleFx } from '../core.js';
import { Flag, ProviderLogo } from '../parts.jsx';
import { Orders } from './report.jsx';
import { StaffStatus } from './staff.jsx';

const quiet = 'text-sm text-muted-foreground';

export const overview = {
  title: () => app.st.nation.name,
  Body() {
    const { st, live, map, ui } = app; const n = st.nation; const L = labels(); const a = ui.assess; const c = st.commander;
    const earned = Object.keys(live.ach).map(id => medalOf(id, map)).filter(Boolean); const alt = altDate(st.now); const next = (medalProgress(live) || [])[0];
    const empire = Math.round(map.fronts.reduce((s, f) => s + Math.max(0, -st.fronts[f.id].pos), 0) / map.fronts.length);
    return (
      <>
        <p className={quiet}>{fmtDate(st.now, { weekday: 'long', day: 'numeric', month: 'long' })}{alt ? ` · ${alt}` : ''}</p>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-base font-semibold text-foreground">{c.title} <span className="font-normal text-muted-foreground">{c.gloss}</span></span>
            <span className="text-sm text-muted-foreground tabular-nums">{c.xp.toLocaleString()} XP</span>
          </div>
          <ProgressMeter value={Math.round(c.progress * 100)} max={100} tone="primary" label="Progress to the next rank" valueText={`${Math.round(c.progress * 100)}%`} />
          {c.next ? <p className="text-xs text-muted-foreground">{(c.nextAt - c.xp).toLocaleString()} XP to {c.next.title} ({c.next.gloss})</p> : null}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatTile variant="plain" label="Stability" value={`${n.stability}%`} />
          <StatTile variant="plain" label="Day streak" value={st.dayStreak} />
          <StatTile variant="plain" label="Empire" value={`${empire}%`} />
        </div>
        <Orders />
        {a ? (
          <ListSection title="Chief of staff" description={a.assessment}>
            {a.orders.map((o, i) => <ListRow key={i} media={<TargetIcon className="size-4 text-muted-foreground" />} title={o.order} description={L[o.front]} />)}
          </ListSection>
        ) : null}
        <ListSection title={`Decorations · ${earned.length}`}>
          {earned.map(md => <ListRow key={md.name} variant="item" data-testid="medal" media={<MedalIcon className="size-4 text-muted-foreground" />} title={md.name} description={md.desc} />)}
          {st.satrapies.length ? <ListRow title={`${F().regionWord}s restored`} description={st.satrapies.map(x => x.name).join(', ')} /> : null}
          {next ? (
            <ListRow title={`Next: ${next.name}`} description={next.desc}>
              <ProgressMeter className="mt-3" value={Math.round(next.pct * 100)} max={100} tone="primary" />
            </ListRow>
          ) : null}
          {!earned.length && !st.satrapies.length && !next ? <ListRow title="None yet" description="Decorations come with what you report." /> : null}
        </ListSection>
        <div className="grid grid-cols-2 gap-2">
          <Button size="lg" data-testid="open-share" onClick={() => openSheet('share')}><ShareIcon />Share</Button>
          <Button size="lg" variant="outline" data-testid="open-settings" onClick={() => openSheet('settings')}><SettingsIcon />Settings</Button>
        </div>
      </>
    );
  },
};

// A share card is drawn by js/share.js on its own canvas; this shows that canvas small and shares it on a press.
function ShareCard({ kind, name }) {
  const slot = useRef(null);
  useEffect(() => {
    const c = card(kind); if (!c || !slot.current) return;
    c.removeAttribute('style'); c.className = 'block h-auto w-full rounded-row';
    slot.current.replaceChildren(c);
  }, [kind]);
  return (
    <CardButton variant="outline" padding="sm" data-testid="share-card" data-kind={kind} onClick={() => shareCard(kind)}>
      <span ref={slot} className="block" />
      <span className="mt-2 block text-sm font-medium text-foreground">{name}</span>
    </CardButton>
  );
}
export const share = {
  title: () => 'Share',
  Body() {
    return (
      <>
        <p className={quiet}>Press a card to share or save it.</p>
        <div className="grid grid-cols-2 items-start gap-3">{CARDS.map(([k, n]) => <ShareCard key={`${app.map.id}-${k}`} kind={k} name={n} />)}</div>
      </>
    );
  },
};

// A front's name, typed. An empty field falls back to the front's own name once you leave it.
function LabelInput({ f }) {
  const saved = labels()[f.id];
  const [text, setText] = useState(saved);
  const typing = useRef(false);
  useEffect(() => { if (!typing.current) setText(saved); }, [saved]);
  return (
    <Input size="sm" className="w-40" maxLength={28} data-testid="front-name" data-front={f.id} aria-label={`Name for the ${f.name}`} value={text}
      onFocus={() => { typing.current = true; }} onBlur={() => { typing.current = false; setText(labels()[f.id]); }}
      onChange={e => { setText(e.target.value); setLabel(f.id, e.target.value); }} />
  );
}
// Who judges your reports. With the private server this opens the provider screen; the static demo has no server
// to keep a key on, so it says so and shows nothing to fill in.
function Staff() {
  const { cfg, ai } = app;
  if (!cfg.server) {
    return (
      <ListSection title="General staff" data-testid="staff-section">
        <ListRow media={<ProviderLogo id="offline" className="size-4 text-muted-foreground" />} title="Offline judge"
          description={<>Keys need the self-hosted server, so there’s nothing to set here. <InlineButton render={<a href="https://github.com/sam-siavoshian/hoi4-irl#readme" target="_blank" rel="noopener noreferrer" />}>Host your own</InlineButton> to add a model.</>} />
      </ListSection>
    );
  }
  const p = ai?.providers.find(x => x.id === ai.provider);
  const voice = cfg.transcribe ? `Voice by ${cfg.transcribe}.` : 'Voice on this device.';
  return (
    <ListSection title="General staff" data-testid="staff-section">
      <ListRowButton data-testid="open-staff" data-provider={p?.id} media={<ProviderLogo id={p?.id || 'offline'} className="size-4 text-foreground" />}
        title={p ? p.name : cfg.judge ? 'A model judges your reports' : 'Offline judge'}
        description={cfg.judge ? `${cfg.judge}. ${voice}` : p && p.judges ? `Judged offline until it’s ready. ${voice}` : `Reports are judged by keywords. ${voice}`}
        status={p ? <StaffStatus status={p.status} /> : null} onClick={() => openSheet('staff')} />
    </ListSection>
  );
}
const APPEARANCE = [{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }];

function SettingsBody() {
  const { map, data, cfg, scenarios } = app; const theme = useTheme(); const file = useRef(null);
  const many = scenarios.length > 1;
  return (
    <>
      <ListSection title="Your fronts" description="Name each border after a part of your life. Turn off the ones you don’t use.">
        {map.fronts.map(f => (
          <ListRow key={`${map.id}-${f.id}`} inline data-testid="front-setting" title={f.name}
            control={<><LabelInput f={f} /><Switch aria-label={`Use the ${f.name}`} data-testid="front-switch" data-front={f.id} checked={!data.off.includes(f.id)} onCheckedChange={() => toggleFront(f.id)} /></>} />
        ))}
      </ListSection>
      <ListSection title="Country">
        {many
          ? <ListRowButton data-testid="change-country" media={<Flag flag={F().flag} />} title={F().name} description="Change country. Each one keeps its own campaign." onClick={openPicker} />
          : <ListRow variant="item" media={<Flag flag={F().flag} />} title={F().name} description={F().long} />}
      </ListSection>
      <Staff />
      <ListSection title="Look and feel">
        <ListRow inline title="Appearance" description="Auto is dark at night."
          control={<Segmented label="Appearance" value={theme.appearance} options={APPEARANCE} onChange={setAppearance} />} />
        <ListRow inline title="Sound" control={<Switch aria-label="Sound" data-testid="sound" checked={data.settings.sound !== false} onCheckedChange={() => toggleFx('sound')} />} />
        <ListRow inline title="Motion and confetti" control={<Switch aria-label="Motion and confetti" data-testid="motion" checked={data.settings.motion !== false} onCheckedChange={() => toggleFx('motion')} />} />
      </ListSection>
      <ListSection title="Your data">
        <ListRowButton trailing={null} data-testid="export" media={<DownloadIcon className="size-4" />} title="Export backup" onClick={exportBackup} />
        <ListRowButton trailing={null} data-testid="import" media={<UploadIcon className="size-4" />} title="Import backup" onClick={() => file.current?.click()} />
        <ListRowButton trailing={null} data-testid="demo" media={<PlayIcon className="size-4" />} title="Load demo" onClick={loadDemo} />
        <ListRowButton trailing={null} data-testid="reset" media={<Trash2Icon className="size-4 text-destructive" />} title={<span className="text-destructive">Erase everything</span>} onClick={reset} />
        {cfg.login ? <ListRowButton trailing={null} data-testid="logout" media={<LogOutIcon className="size-4" />} title="Sign out" onClick={logOut} /> : null}
      </ListSection>
      <FileInput ref={file} id="importfile" accept="application/json,.json" aria-label="Backup file" tabIndex={-1} onFiles={files => importBackup(files[0])} />
      <p className="text-xs text-muted-foreground">Unit icons by Game-icons.net (CC BY 3.0). Interface icons by Lucide. Borders from Natural Earth.</p>
    </>
  );
}
export const settings = { title: () => 'Settings', Body: SettingsBody };

export const welcome = {
  title: () => 'Your fronts',
  Body() {
    const { map, ui, cfg } = app; const cur = PRESETS.find(p => p.id === ui.preset);
    return (
      <>
        <p className={quiet}>Each border of {F().name} is one part of your life. Once a day, say what happened in a sentence. A good day pushes that front out, a neglected one lets the enemy in, and the map shows you what needs attention. Name the borders below; you can rename them later.</p>
        <div className="space-y-2">
          <ChoiceCards variant="chips" label="Starting point" value={ui.preset} options={PRESETS.map(p => ({ value: p.id, label: p.name }))} onChange={choosePreset} />
          {cur ? <p className="text-xs text-muted-foreground">{cur.blurb}</p> : null}
        </div>
        <ListGroup>
          {map.fronts.map(f => <ListRow key={`${map.id}-${f.id}`} inline data-testid="front-setting" title={f.name} control={<LabelInput f={f} />} />)}
        </ListGroup>
        {cur ? <p className="text-xs text-muted-foreground">Try saying: “{cur.examples[0]}”</p> : null}
        {cfg.server && !cfg.judge ? (
          <ListGroup>
            <ListRowButton data-testid="welcome-staff" media={<ProviderLogo id="offline" className="size-4 text-muted-foreground" />} title="Add a model"
              description="Add a model now, or skip and use the offline judge. You can add one later in Settings." onClick={() => openSheet('staff')} />
          </ListGroup>
        ) : null}
        <Button size="lg" className="w-full" data-testid="begin" onClick={closeSheet}>Begin</Button>
      </>
    );
  },
};
