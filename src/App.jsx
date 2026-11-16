// The screen: the map, a little chrome over it, and one sheet for everything else.
// The two canvases are created once and handed to the map renderer (js/map.js); React never re-creates them.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import {
  AlertDialog, AlertDialogClose, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogPopup, AlertDialogTitle,
  Button, Card, CardButton, IconButton, InlineButton, Menu, MenuCheckboxItem, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger,
  PersonRow, ScreenError, Sheet, SheetHeader, SheetPanel, SheetPopup, SheetTitle, Slider, Spinner, StatusDot, StatusLabel,
} from '@sam/design-system';
import { ArrowLeftIcon, BookOpenIcon, FlagIcon, FlameIcon, LayersIcon, LocateFixedIcon, MicIcon, MinusIcon, PauseIcon, PlayIcon, PlusIcon, XIcon } from 'lucide-react';
import { LEGENDS } from '../js/map.js';
import { app, useApp, change, boot, F, MODES, activeFronts, answer, back, closeDemoNote, closeSheet, emblem, exitReplay, fcol, fmtDate, go, labels, openSheet, playReplay, replayAt, seekReplay, setMode, toggleSheet, topAlert } from './core.js';
import { Flag, Swatch } from './parts.jsx';
import { fronts, frontSheet, units, division, province } from './sheets/fronts.jsx';
import { history, edit } from './sheets/history.jsx';
import { report } from './sheets/report.jsx';
import { overview, share, settings, country, welcome } from './sheets/nation.jsx';

const SHEETS = { fronts, front: frontSheet, units, division, province, history, edit, report, overview, share, settings, country, welcome };

const WIDE = '(min-width: 768px)';
function useWide() {
  return useSyncExternalStore(f => { const m = window.matchMedia(WIDE); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, () => window.matchMedia(WIDE).matches);
}

export function App() {
  const a = useApp();
  const base = useRef(null), over = useRef(null), wrap = useRef(null);
  useEffect(() => { boot(base.current, over.current, wrap.current).catch(err => { console.error(err); app.error = err; change(); }); }, []);
  return (
    <div className="fixed inset-0 overflow-hidden bg-background select-none">
      <main ref={wrap} id="mapwrap" className="absolute inset-0 touch-none">
        <canvas ref={base} id="base" className="absolute inset-0 block touch-none" />
        <canvas ref={over} id="over" className="absolute inset-0 block touch-none" />
      </main>
      {a.error ? (
        <div className="absolute inset-0 grid place-items-center bg-background p-4">
          <ScreenError title="Home Front couldn’t start" doing="Your reports are safe." ask="Try again. If it keeps happening, copy the details." details={String(a.error.stack || a.error)} onRetry={() => location.reload()} />
        </div>
      ) : a.ready ? <><Chrome /><Panel /><Confirm /></> : (
        <div className="absolute inset-0 grid place-items-center"><Spinner size="lg" tone="muted" /></div>
      )}
    </div>
  );
}

// ---------- chrome over the map ----------
function Chrome() {
  const { st, ui } = useApp(); const wide = useWide();
  const covered = !!ui.sheet && !wide; // a phone's sheet covers the foot of the map
  const alert = topAlert(); const v = st.nation.stability;
  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 px-4 pt-safe">
        <div className="mt-3 flex items-start justify-between gap-2 md:justify-start">
          <CardButton padding="sm" className="pointer-events-auto w-auto max-w-56" data-testid="identity" aria-label={`${st.nation.name}. Open the overview`} onClick={emblem}>
            <PersonRow size="md" avatar={<Flag flag={F().flag} />} name={<span data-testid="nation-name">{st.empire ? st.nation.name : F().name}</span>} detail={fmtDate(st.now)} />
          </CardButton>
          <CardButton padding="sm" className="pointer-events-auto flex h-14 w-auto items-center gap-3" data-testid="status" aria-label={`Stability ${v}%, day streak ${st.dayStreak}. Open the overview`} onClick={() => openSheet('overview')}>
            <StatusLabel tone={v >= 60 ? 'success' : v >= 35 ? 'attention' : 'danger'} animate={false} className="tabular-nums">{v}%</StatusLabel>
            <span data-streak="" className={`flex items-center gap-1 text-xs font-medium tabular-nums ${st.dayStreak ? 'text-foreground' : 'text-muted-foreground'}`}><FlameIcon className="size-3.5" />{st.dayStreak}</span>
          </CardButton>
        </div>
        <div className="flex items-start justify-between gap-2">
          {alert && !covered ? (
            <CardButton padding="sm" className="pointer-events-auto flex w-auto max-w-64 items-center gap-2 text-start text-xs font-medium" data-testid="alert" onClick={() => go(alert[2])}>
              <StatusDot tone={alert[0]} />{alert[1]}
            </CardButton>
          ) : <span />}
          {wide ? null : <MapControls wide={false} />}
        </div>
      </header>

      {wide ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-end gap-2">
          <MapControls wide />
          {ui.asOf ? null : <Legend />}
        </div>
      ) : null}

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 px-4 pb-safe">
        {!wide && !covered && !ui.asOf ? <div className="self-start"><Legend /></div> : null}
        {ui.demoNote && !covered ? <DemoNote /> : null}
        {ui.asOf ? <Replay /> : null}
        <Card as="nav" aria-label="Main" padding="none" radius="panel" className="pointer-events-auto mb-4 grid w-full max-w-xs grid-cols-[1fr_auto_1fr] items-center gap-2 p-1.5 md:w-auto md:max-w-none">
          <Button variant="ghost" size="lg" data-testid="nav-fronts" data-pressed={['fronts', 'front'].includes(ui.stack[0]?.[0] || ui.sheet) ? '' : undefined} onClick={() => toggleSheet('fronts')}><FlagIcon />Fronts</Button>
          <IconButton label="Report" size="xl" variant="primary" shape="circle" tooltip={false} data-testid="nav-report" onClick={() => toggleSheet('report')}><MicIcon /></IconButton>
          <Button variant="ghost" size="lg" data-testid="nav-history" data-pressed={(ui.stack[0]?.[0] || ui.sheet) === 'history' ? '' : undefined} onClick={() => toggleSheet('history')}><BookOpenIcon />History</Button>
        </Card>
      </footer>
    </>
  );
}

function MapControls({ wide }) {
  const { view } = app;
  return (
    <Card padding="none" className="pointer-events-auto flex flex-col gap-0.5 p-1">
      {wide ? <>
        <IconButton label="Zoom in" size="md" tooltipSide="right" onClick={() => view.zoomBy(1.6)}><PlusIcon /></IconButton>
        <IconButton label="Zoom out" size="md" tooltipSide="right" onClick={() => view.zoomBy(0.625)}><MinusIcon /></IconButton>
      </> : null}
      <IconButton label="Centre the map" size="md" tooltipSide={wide ? 'right' : 'left'} data-testid="home" onClick={() => view.home()}><LocateFixedIcon /></IconButton>
      <Menu>
        <MenuTrigger render={<IconButton label="Map layers" size="md" tooltip={false} data-testid="layers" variant={view.mode !== 'political' || view.showEmpire ? 'secondary' : 'ghost-muted'} />}><LayersIcon /></MenuTrigger>
        <MenuPopup align={wide ? 'start' : 'end'} side={wide ? 'right' : 'bottom'}>
          <MenuRadioGroup value={view.mode} onValueChange={setMode}>
            {MODES.map(([id, name]) => <MenuRadioItem key={id} value={id} data-mode={id} closeOnClick>{name}</MenuRadioItem>)}
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuCheckboxItem checked={!!view.showEmpire} data-mode="empire" closeOnClick onCheckedChange={() => setMode('empire')}>Old empire</MenuCheckboxItem>
        </MenuPopup>
      </Menu>
    </Card>
  );
}

// what the colours of the chosen map layer mean; nothing for the plain map
function Legend() {
  const { view } = app; const L = labels();
  const items = view.mode === 'life' ? activeFronts().map(f => [fcol(f.id), L[f.id]]) : LEGENDS[view.mode];
  if (!items) return null;
  return (
    <Card padding="none" data-testid="legend" className="pointer-events-auto flex max-w-72 flex-wrap gap-x-3 gap-y-1 px-3 py-2">
      {items.map(([color, name]) => <span key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground"><Swatch color={color} />{name}</span>)}
    </Card>
  );
}

function Replay() {
  const { ui } = app;
  return (
    <Card padding="none" data-testid="replay-bar" className="pointer-events-auto flex w-full max-w-md items-center gap-2 p-1.5">
      <IconButton label={ui.playing ? 'Pause' : 'Play'} size="md" tooltip={false} data-testid="replay-play" onClick={playReplay}>{ui.playing ? <PauseIcon /> : <PlayIcon />}</IconButton>
      <Slider label="Date" min={0} max={1000} step={1} value={replayAt()} valueText={fmtDate(ui.asOf, { day: 'numeric', month: 'long' })} onValueChange={seekReplay} />
      <span className="w-14 shrink-0 text-end text-xs text-muted-foreground tabular-nums">{fmtDate(ui.asOf, { day: 'numeric', month: 'short' })}</span>
      <IconButton label="Back to today" size="md" tooltip={false} data-testid="replay-exit" onClick={exitReplay}><XIcon /></IconButton>
    </Card>
  );
}

function DemoNote() {
  return (
    <Card padding="none" role="note" data-testid="demo-note" className="pointer-events-auto flex w-full max-w-md items-center gap-2 py-1.5 ps-4 pe-1.5">
      <p className="min-w-0 flex-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">This is a demo.</span> Your entries stay in this browser.{' '}
        <InlineButton render={<a href="https://github.com/sam-siavoshian/hoi4-irl#readme" target="_blank" rel="noopener" />}>Host your own</InlineButton> to keep them.
      </p>
      <IconButton label="Close" tooltip={false} onClick={closeDemoNote}><XIcon /></IconButton>
    </Card>
  );
}

// ---------- the sheet: under the map on a phone, beside it on a wide screen ----------
function Panel() {
  const { ui } = useApp(); const wide = useWide();
  const S = SHEETS[ui.sheet]; const popup = useRef(null);
  return (
    <Sheet open={!!S} modal={false} disablePointerDismissal onOpenChange={open => { if (!open) closeSheet(); }}>
      <SheetPopup ref={popup} side={wide ? 'right' : 'bottom'} variant="inset" layer="panel" initialFocus={popup} data-testid="sheet" data-sheet={ui.sheet || undefined}>
        {S ? (
          <>
            <SheetHeader>
              <div className="flex min-h-8 items-center gap-1 pe-8">
                {ui.stack.length ? <IconButton label="Back" size="md" tooltip={false} className="-ms-2" data-testid="sheet-back" onClick={back}><ArrowLeftIcon /></IconButton> : null}
                <SheetTitle data-testid="sheet-title" className="truncate leading-tight">{S.title()}</SheetTitle>
              </div>
            </SheetHeader>
            <SheetPanel key={`${ui.sheet}:${ui.arg}`} data-testid="sheet-body"><S.Body /></SheetPanel>
          </>
        ) : null}
      </SheetPopup>
    </Sheet>
  );
}

// ---------- a question before something is destroyed ----------
function Confirm() {
  const c = useApp().ui.confirm;
  return (
    <AlertDialog open={!!c} onOpenChange={open => { if (!open) answer(false); }}>
      <AlertDialogPopup data-testid="confirm">
        {c ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{c.title}</AlertDialogTitle>
              <AlertDialogDescription>{c.body}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
              <Button variant="destructive" data-testid="confirm-yes" onClick={() => answer(true)}>{c.verb}</Button>
            </AlertDialogFooter>
          </>
        ) : null}
      </AlertDialogPopup>
    </AlertDialog>
  );
}
