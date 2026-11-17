// The landing page, built only from the design system (vendor/design-system), as the app is. It is rendered to HTML at
// build time (tools/build-site.mjs) and hydrated in the browser, so everything here must render the same on both
// sides: no window, no clock, no storage outside an effect or a handler. The live map loads after the first paint.
import { useEffect, useRef, useState } from 'react';
import {
  Badge, Button, Card, ChoiceCards, Chip, CodeBlock, IconButton, ListGroup, ListRow, ListRowDisclosure, PersonRow, SectionHeader, Spinner, StatTile, StatusLabel,
  toastManager,
} from '@sam/design-system';
import { cycleAppearance } from '@sam/design-system/theme';
import { AnchorIcon, ArrowRightIcon, FolderIcon, GamepadIcon, KeyRoundIcon, LayersIcon, ListXIcon, MicIcon, NotebookPenIcon, ServerIcon, SunMoonIcon, SwordsIcon } from 'lucide-react';
import { countries, examples, start } from 'virtual:site-data';
import { BrandMark, Flag, ProviderLogo } from '../src/marks.jsx';

const REPO = 'https://github.com/sam-siavoshian/hoi4-irl';
const DEMO = './demo/?demo=1';
const SAVE = 'homefront.v1'; // the app's own key (js/store.js): the demo is on this origin, so it finds what is put here
const column = 'mx-auto w-full max-w-6xl px-4 sm:px-6';
const quiet = 'text-sm leading-relaxed text-muted-foreground';

// The demo opens on the country picked here, with a campaign already in progress (the app fills an empty one when
// it is opened with ?demo=1). A visitor who already has a campaign in this browser keeps it.
function seedDemo(id) {
  try { if (!localStorage.getItem(SAVE)) localStorage.setItem(SAVE, JSON.stringify({ v: 3, scenario: id, reports: [], labels: {}, notes: {}, off: [], campaigns: {} })); } catch { /* private mode: the demo starts on its own picker */ }
}

// The hero is no one country's: the HTML is written with the build's country of the day (site-data's `start`), then
// the browser picks one of the eight at random and loads only its map. Each time the story ends the hero moves on to
// the next country, until the visitor picks one themselves.
const FLAGS = 'demo/'; // the flags are the app's (icons/flags/), served beside it
export function Landing() {
  const [picked, setPicked] = useState(countries[start].id);
  const [live, setLive] = useState(false); // false until the browser has picked the hero's country
  const chosen = useRef(false);
  useEffect(() => { setPicked(countries[Math.floor(Math.random() * countries.length)].id); setLive(true); }, []);
  const pick = id => { chosen.current = true; setPicked(id); };
  const next = () => { if (!chosen.current) setPicked(id => countries[(countries.findIndex(c => c.id === id) + 1) % countries.length].id); };
  const country = countries.find(c => c.id === picked) || countries[0];
  return (
    <div className="flex min-h-dvh flex-col gap-16 pb-12 sm:gap-24">
      <div className="flex flex-col gap-8 sm:gap-12">
        <TopBar />
        <main className="flex flex-col gap-20 sm:gap-28">
          <div className={`${column} flex flex-col gap-10 sm:gap-14`}>
            <Hero picked={picked} country={country} live={live} onLoop={next} />
            <Nations picked={picked} country={country} onPick={pick} />
          </div>
          <HowItWorks e={examples[country.id]} />
          <WhoItIsFor />
          <YourData />
          <GetIt />
          <Faq />
        </main>
      </div>
      <Foot />
    </div>
  );
}

function TopBar() {
  const appearance = () => {
    cycleAppearance();
    const now = document.documentElement.dataset.appearance;
    toastManager.add({ title: `Appearance: ${now === 'light' ? 'Light' : now === 'dark' ? 'Dark' : 'Auto'}`, timeout: 1500 });
  };
  return (
    <header className={`${column} flex items-center justify-between gap-3 pt-4`}>
      <a href="./" className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BrandMark />
        Home Front
      </a>
      <nav aria-label="Sections" className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" render={<a href="#how" />}>How it works</Button>
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" render={<a href="#get" />}>Get it</Button>
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" render={<a href="#faq" />}>FAQ</Button>
        <IconButton label="Change appearance" size="md" data-testid="appearance" onClick={appearance}><SunMoonIcon /></IconButton>
        <Button variant="outline" size="sm" render={<a href={REPO} />}>GitHub</Button>
      </nav>
    </header>
  );
}

// 1. What it is, the two things to do, and the product itself: the live map.
function Hero({ picked, country, live, onLoop }) {
  return (
    <section className="flex flex-col gap-8 pt-4 sm:gap-12 sm:pt-8">
      <SectionHeader
        level="hero" align="center" as="h1" title="Your life as a war map"
        description="Home Front is a productivity app and daily journal. Each border of your country is a part of your life. Say what happened today and the front moves. One look tells you what needs you."
        action={(
          <>
            <Button size="lg" data-testid="try-demo" render={<a href={DEMO} />} onClick={() => seedDemo(picked)}>Try the demo<ArrowRightIcon /></Button>
            <Button size="lg" variant="outline" render={<a href="#get" />}>Self-host it</Button>
          </>
        )}
      />
      <Stage picked={picked} country={country} live={live} onLoop={onLoop} />
    </section>
  );
}

// The map and the strip under it: what was said, and what it became.
function Stage({ picked, country, live, onLoop }) {
  const frame = useRef(null), base = useRef(null), over = useRef(null), stage = useRef(null);
  const [shown, setShown] = useState(null); // the country on the canvas, once its map has loaded
  const [failed, setFailed] = useState(false);
  const [caption, setCaption] = useState(() => ({ said: examples[picked].said, typing: false, verdict: examples[picked] }));
  const loop = useRef(onLoop); loop.current = onLoop;
  useEffect(() => {
    if (!live) return undefined; // not before the browser has picked the hero's country: only that map loads
    let on = true;
    (async () => {
      try {
        if (!stage.current) {
          const { createStage } = await import('./stage.js');
          if (!on) return;
          stage.current = createStage({ frame: frame.current, base: base.current, over: over.current, onCaption: setCaption, onLoop: () => loop.current?.() });
        }
        if (await stage.current.show(picked) && on) { setShown(picked); setFailed(false); }
      } catch { if (on) setFailed(true); }
    })();
    return () => { on = false; };
  }, [picked, live]);
  useEffect(() => () => stage.current?.stop(), []);
  const loading = shown !== picked && !failed;
  const v = caption.verdict;
  return (
    <Card as="figure" padding="none" radius="panel" className="overflow-hidden">
      <div ref={frame} data-testid="hero-map" data-country={shown || undefined} data-loading={loading ? '' : undefined} className="relative aspect-4/5 w-full bg-fill sm:aspect-16/9">
        <noscript>
          <img src="img/hero.png" width="1104" height="621" alt="The Home Front maps of four of the eight countries, each with division counters along every border and front lines drawn province by province." className="absolute inset-0 size-full object-cover" />
        </noscript>
        <canvas ref={base} aria-hidden="true" className="pointer-events-none absolute inset-0" />
        <canvas ref={over} aria-hidden="true" className="pointer-events-none absolute inset-0" />
        {loading ? (
          <div className="absolute inset-0 grid place-items-center">
            <Card padding="sm" role="status" aria-label={`Loading the map of ${country.name}`} data-testid="map-loading" className="flex"><Spinner size="md" tone="muted" /></Card>
          </div>
        ) : null}
        {failed ? <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted-foreground">Couldn’t load the map of {country.name}. Reload the page to try again.</p> : null}
      </div>
      <figcaption className="flex min-h-28 flex-col justify-center gap-2.5 px-4 py-3.5 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
        <p className="flex min-w-0 items-start gap-2.5 text-sm font-medium text-foreground">
          <MicIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span data-testid="said">{caption.said ? `“${caption.said}${caption.typing ? '' : '”'}` : ' '}</span>
        </p>
        <div data-testid="verdict" className="flex min-h-6 flex-wrap items-center gap-x-2.5 gap-y-1.5 sm:justify-end">
          {v ? (
            <>
              <Badge variant="secondary" size="lg">{v.area}</Badge>
              <StatusLabel tone={v.outcome === 'win' ? 'success' : 'danger'} animate={false}>{v.type}</StatusLabel>
              {v.moved.slice(0, 1).map(text => <span key={text} className="text-xs text-muted-foreground">{text}</span>)}
            </>
          ) : null}
        </div>
      </figcaption>
    </Card>
  );
}

// 2. Choose your nation: eight flags, the map above follows, and the briefing says what you would be taking on.
function Nations({ picked, country, onPick }) {
  const half = Math.ceil(country.fronts.length / 2);
  return (
    <section id="nations" aria-labelledby="nations-title" className="flex flex-col gap-5">
      <SectionHeader level="display" align="center" title={<span id="nations-title">Choose your nation</span>}
        description="8 countries on their 1936 borders, each with an empire to restore. Pick one and the map changes to it." />
      <ChoiceCards variant="thumbs" flow="strip" label="Country" value={picked} onChange={onPick} data-testid="nations"
        options={countries.map(c => ({ value: c.id, label: c.name, preview: <Flag flag={c.flag} shape="rect" size="lg" base={FLAGS} className="max-w-full" />, data: { 'data-testid': 'country', 'data-id': c.id } }))} />
      <Card as="article" padding="none" radius="panel" data-testid="briefing" data-id={country.id} className="flex flex-col gap-7 p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="flex max-w-xl flex-col gap-4">
            <PersonRow size="lg" avatar={<Flag flag={country.flag} shape="rect" size="xl" base={FLAGS} />} name={<span data-testid="brief-name">{country.name}</span>} detail={`${country.long} · ${country.year}`} />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Empire to restore</p>
              <p className="text-base font-semibold text-foreground" data-testid="brief-empire">{country.empire}</p>
              {country.blurb ? <p className={quiet}>{country.blurb}</p> : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-5 lg:w-80">
            <div className="grid grid-cols-3 gap-4" data-testid="brief-stats">
              <StatTile variant="plain" label="Divisions" value={country.divisions} />
              <StatTile variant="plain" label="Ships" value={country.ships} />
              <StatTile variant="plain" label="Air wings" value={country.wings} />
            </div>
            <div className="flex flex-col gap-2">
              <Button size="lg" data-testid="play" render={<a href={DEMO} />} onClick={() => seedDemo(country.id)}>Play as {country.name}</Button>
              <p className="text-xs text-muted-foreground">Opens the demo in your browser. No sign-up.</p>
            </div>
          </div>
        </div>
        <section className="space-y-2.5">
          <SectionHeader as="h3" title={`${country.fronts.length} fronts`} description="Each border stands for a part of your life. You can rename them." />
          <div className="grid gap-3 md:grid-cols-2 md:items-start">
            {[country.fronts.slice(0, half), country.fronts.slice(half)].map((fronts, at) => (
              <ListGroup key={at}>
                {fronts.map(f => {
                  const Icon = f.naval ? AnchorIcon : SwordsIcon;
                  return (
                    <ListRow key={f.id} variant="item" inline data-testid="brief-front" media={<Icon className="size-4 text-muted-foreground" />}
                      title={f.name} description={`${f.enemy} · ${f.naval ? 'Naval' : 'Land'}`} control={<Badge variant="outline">{f.label}</Badge>} />
                  );
                })}
              </ListGroup>
            ))}
          </div>
        </section>
      </Card>
    </section>
  );
}

// 3. One real entry, carried through the three steps. The words on the right of each step are the engine's own.
function HowItWorks({ e }) {
  return (
    <section id="how" aria-labelledby="how-title" className={`${column} flex flex-col gap-8`}>
      <SectionHeader level="display" title={<span id="how-title">How it works</span>} description="You say 1 sentence. It becomes 1 battle. Here is a real entry, start to finish." />
      <ol className="grid gap-4 md:grid-cols-3">
        <Step n={1} title="Say it" line="Speak or type a sentence about your day. That is the whole input.">
          <p className="flex items-start gap-2.5 text-sm font-medium text-foreground">
            <MicIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>“{e.said}”</span>
          </p>
        </Step>
        <Step n={2} title="It’s judged" line="Your own model, or the built-in offline judge, files it: which part of your life, win or loss, and how big.">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <Badge variant="secondary" size="lg">{e.area}</Badge>
            <StatusLabel tone={e.outcome === 'win' ? 'success' : 'danger'} animate={false}>{e.outcome === 'win' ? 'Win' : 'Loss'}</StatusLabel>
            <span className="text-xs text-muted-foreground">Size {e.severity} of 5</span>
          </div>
          <p className="text-sm text-muted-foreground">Reason: {e.reason}. So it becomes a <span className="font-medium text-foreground">{e.type.toLowerCase()}</span>.</p>
        </Step>
        <Step n={3} title="The map moves" line="The front advances or gives ground, and the entry is saved with its date.">
          <p className="text-sm font-medium text-foreground">{e.battle || e.front}</p>
          <p className="text-sm text-muted-foreground">{[e.lead, ...e.moved].filter(Boolean).join('. ')}.</p>
        </Step>
      </ol>
    </section>
  );
}
function Step({ n, title, line, children }) {
  return (
    <Card as="li" padding="lg" className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <h3 className="flex items-center gap-2.5 text-base font-semibold text-foreground"><Badge variant="outline" size="lg" aria-hidden="true">{n}</Badge>{title}</h3>
        <p className={quiet}>{line}</p>
      </div>
      <Card variant="inset" radius="row" padding="snug" className="mt-auto flex min-h-24 flex-col justify-center gap-2">{children}</Card>
    </Card>
  );
}

// 4. Who it is for, in four lines.
const FOR = [
  [ListXIcon, 'People who quit habit trackers', 'No forms, tags or checkboxes. 1 sentence a day is the whole input.'],
  [LayersIcon, 'People juggling several things', 'School, work, family, health. The map shows which part is paying for the others.'],
  [GamepadIcon, 'People who like strategy games', 'A front line is easier to care about than a dashboard.'],
  [NotebookPenIcon, 'People who keep a journal', 'Every entry is dated and searchable. Replay it from day 1, or ask it questions.'],
];
function WhoItIsFor() {
  return (
    <section id="for" aria-labelledby="for-title" className={`${column} flex flex-col gap-8`}>
      <SectionHeader level="display" title={<span id="for-title">Who it’s for</span>} description="It isn’t a game. Nothing moves unless you report something real." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FOR.map(([Icon, title, line]) => (
          <Card as="li" key={title} padding="lg" className="flex flex-col gap-3">
            <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className={quiet}>{line}</p>
            </div>
          </Card>
        ))}
      </ul>
    </section>
  );
}

// 5. Your data stays yours.
const PROVIDERS = [['openai', 'OpenAI'], ['anthropic', 'Anthropic'], ['gemini', 'Google Gemini'], ['groq', 'Groq'], ['mistral', 'Mistral'], ['openrouter', 'OpenRouter'], ['ollama', 'Ollama'], ['lmstudio', 'LM Studio'], ['offline', 'Offline judge']];
function YourData() {
  return (
    <section id="data" aria-labelledby="data-title" className={`${column} grid gap-8 lg:grid-cols-2 lg:gap-12`}>
      <div className="flex flex-col gap-6">
        <SectionHeader level="display" title={<span id="data-title">Your data stays yours</span>} description="Home Front is built for 1 person on a machine they control." />
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Works with any of these, or none</p>
          <ul className="flex flex-wrap gap-2" data-testid="providers">
            {PROVIDERS.map(([id, name]) => <li key={id}><Chip variant="soft" icon={<ProviderLogo id={id} className="size-3.5" />}>{name}</Chip></li>)}
          </ul>
        </div>
      </div>
      <ListGroup>
        <ListRow media={<ServerIcon className="size-4 text-muted-foreground" />} title="Self-hosted" description="It runs on your own machine behind 1 password. No accounts and no telemetry." />
        <ListRow media={<KeyRoundIcon className="size-4 text-muted-foreground" />} title="Your own key" description="Use a key for any provider, a local model, or the offline judge with no key at all. The key stays on your server and never reaches the browser." />
        <ListRow media={<FolderIcon className="size-4 text-muted-foreground" />} title="Plain files" description="Your record is a folder on your disk. Copy it to back it up, and export it at any time." />
      </ListGroup>
    </section>
  );
}

// 6. Get it.
const INSTALL = [
  { note: '# 1. Get it' },
  `git clone ${REPO}.git homefront`,
  'cd homefront',
  { note: '# 2. Install it and set a password in .env' },
  'npm install',
  'cp .env.example .env',
  { note: '# 3. Start it, then open http://localhost:8080' },
  'npm start',
];
function GetIt() {
  return (
    <section id="get" aria-labelledby="get-title" className={`${column} grid gap-8 lg:grid-cols-2 lg:gap-12`}>
      <div className="flex flex-col gap-6">
        <SectionHeader level="display" title={<span id="get-title">Get it</span>} description="You need Node 20 or newer. It is open source under the MIT licence." />
        <p className={quiet}>
          <span className="font-medium text-foreground">Or let your coding agent do it.</span> The repository ships a setup skill. In Claude Code, open the folder and say “set up Home Front”. Any other agent can follow AGENTS.md.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" render={<a href={REPO} />}>Open the repository</Button>
          <Button variant="outline" render={<a href={`${REPO}/blob/main/docs/SELF_HOSTING.md`} />}>Read the self-hosting guide</Button>
        </div>
      </div>
      <CodeBlock label="Terminal" lines={INSTALL} data-testid="install" />
    </section>
  );
}

// 7. Five questions.
const FAQ = [
  ['Is it a game?', 'No. It looks like one, but there is nothing to play. The map only moves when you report something real. It is a diary with consequences.'],
  ['Does it need an API key?', 'No. With no key, the offline keyword judge files your entries on the device. Add your own key or a local model later, in Settings, without losing anything.'],
  ['What does it cost to run?', '1 short model call for each entry, plus speech to text if you use voice. With a local model or the offline judge it costs nothing.'],
  ['Does it work on a phone?', 'Yes. It installs to the iPhone or Android home screen and keeps working offline. Entries made offline are kept on the phone and sent when you are back online.'],
  ['Can I change the map?', 'Yes. Pick any of the 8 countries, rename every front and pause the ones you don’t need. Each country keeps its own campaign.'],
];
function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={`${column} grid gap-8 lg:grid-cols-2 lg:gap-12`}>
      <SectionHeader level="display" title={<span id="faq-title">Questions</span>} description="The short answers. The repository has the long ones." />
      <ListGroup data-testid="faq">
        {FAQ.map(([q, a], at) => <ListRowDisclosure key={q} title={q} defaultOpen={at === 0}>{a}</ListRowDisclosure>)}
      </ListGroup>
    </section>
  );
}

// 8. The foot.
function Foot() {
  return (
    <footer className={`${column} flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:gap-8`}>
      <p className="flex items-center gap-2 font-medium text-foreground"><BrandMark variant="mark" />Home Front</p>
      <div className="max-w-2xl space-y-1.5 sm:text-end">
        <p className="-mx-2 flex items-center gap-1 sm:justify-end">
          <Button variant="link" size="xs" render={<a href={`${REPO}/blob/main/LICENSE`} />}>MIT licence</Button>
          <Button variant="link" size="xs" render={<a href={REPO} />}>GitHub</Button>
        </p>
        <p>Home Front is not affiliated with Paradox Interactive.</p>
        <p>Unit silhouettes from Game-icons.net, CC BY 3.0. Icons by Lucide. Borders from Natural Earth.</p>
      </div>
    </footer>
  );
}
