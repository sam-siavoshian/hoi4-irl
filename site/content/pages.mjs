// Every page of the site except the landing page's own sections, as data: its address, title, description, heading,
// the one sentence under it, and its body as a list of blocks. One list feeds the HTML (site/DocPage.jsx, prerendered
// and hydrated), the Markdown copy of each page (site/content/markdown.mjs), llms.txt and llms-full.txt, the sitemap
// and the structured data (tools/build-site.mjs). Facts come from `data` (tools/content-data.mjs: the scenarios,
// the engine, the provider registry, package.json) and from the FAQ list, so a page can't drift from the product.
//
// Blocks: { t: 'h2' | 'h3', text, id } · { t: 'p', text } · { t: 'ul' | 'ol', items } · { t: 'table', label, head, rows }
//         { t: 'code', label, lines } · { t: 'quote', text } · { t: 'image', src, alt, w, h } · { t: 'faq', items }
// Text is plain, with three inline marks: [words](address), `code` and **strong**. An address that starts with ~/
// is a page of this site (~/faq/), written relative to the page when rendered and absolute in Markdown.
import { FAQ_GROUPS, FAQ_ALL } from './faq.mjs';

export const NAME = 'Home Front';
// The sentence every page carries near its top, so any page quoted alone says what the product is.
export const DEFINITION = 'Home Front is an open-source, self-hosted productivity app and daily journal that shows your life as a 1936 grand-strategy war map.';

// The site's own pages, in the order the footer lists them, with the one line llms.txt gives each.
export const SECTIONS = [
  { label: 'Product', links: [['how-it-works', 'How it works'], ['countries', 'Countries'], ['compare', 'Compare'], ['faq', 'FAQ']] },
  { label: 'Run it', links: [['self-hosting', 'Self-hosting'], ['ai-providers', 'AI providers'], ['demo', 'Try the demo']] },
];

const slug = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const h2 = text => ({ t: 'h2', text, id: slug(text) });
const h3 = text => ({ t: 'h3', text, id: slug(text) });
const p = text => ({ t: 'p', text });
const ul = items => ({ t: 'ul', items });
const ol = items => ({ t: 'ol', items });
const table = (label, head, rows) => ({ t: 'table', label, head, rows });
const code = (label, lines) => ({ t: 'code', label, lines });
const esc = s => String(s).replace(/([[\]`*])/g, '\\$1'); // data that must not be read as an inline mark
const list = words => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`);
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const API = { responses: 'OpenAI Responses API', chat: 'Chat Completions (OpenAI-compatible)', anthropic: 'Anthropic Messages API', gemini: 'Gemini Interactions API' };

export function keyFacts(data) {
  const hosted = data.providers.filter(x => x.needsKey).map(x => x.name);
  const local = data.providers.filter(x => x.local && x.base).map(x => x.name);
  return [
    `**What it is:** ${DEFINITION.replace(/^Home Front is /, '').replace(/\.$/, '')}.`,
    `**Input:** 1 sentence a day, spoken or typed. The entry is filed and dated for you, and the front for that part of your life moves.`,
    `**Countries:** ${data.countries.length} (${list(data.countries.map(c => c.name))}), each on its ${data.countries[0].year} borders with 7 fronts and an empire to restore.`,
    `**AI providers:** ${list(hosted)} with your own key, ${list(local)} on your own machine, any OpenAI-compatible server, or a built-in offline judge with no model at all.`,
    `**Runs on:** Node ${data.node} or newer, or Docker. A Mac, a Linux machine, a Raspberry Pi, Windows through WSL2, or a cloud host with a disk.`,
    `**Privacy:** 1 user, 1 password, your own machine. The key stays on the server, the record is a folder of plain files, and there is no telemetry.`,
    `**Phone:** installs to the iPhone or Android home screen and works offline.`,
    `**Licence:** ${data.license}. Free to run. Version ${data.version}.`,
  ];
}

export function buildPages(data, site) {
  const { countries, providers, actions, examples } = data;
  const REPO = data.repo;
  const blob = f => `${REPO}/blob/main/${f}`;
  const byId = Object.fromEntries(countries.map(c => [c.id, c]));
  const pages = [];

  // ---------------- the landing page: only its head lives here; its body is site/Landing.jsx ----------------
  pages.push({
    name: 'landing', path: '', kind: 'landing',
    title: 'Home Front · Your life as a 1936 war map',
    description: 'Home Front is an open-source, self-hosted productivity app and daily journal that shows your life as a 1936 war map. Say what happened and the front moves.',
    h1: 'Your life as a war map',
    lead: 'Home Front is a productivity app and daily journal. Each border of your country is a part of your life. Say what happened today and the front moves. One look tells you what needs you.',
    image: { src: 'img/og.png', w: 1200, h: 630, alt: 'A Home Front war map in 1936, with division counters along every border, beside the words: Your life as a war map.' },
    blocks: [
      p(DEFINITION + ' You tell it what happened today in a sentence or two, by voice or by typing. It files the entry: which part of your life it was about, whether it went well or badly, and how much it mattered. Then each border of your country moves: when an area of your life goes well, its front line pushes outward, and when you neglect it, the enemy pushes in.'),
      h2('Key facts'), ul(keyFacts(data)),
      h2('Who it is for'),
      ul([
        '**People who quit habit trackers.** No forms, tags or checkboxes. 1 sentence a day is the whole input.',
        '**People juggling several things.** School, work, family, health. The map shows which part is paying for the others.',
        '**People who like strategy games** and would rather look at a front line than a dashboard.',
        '**People who keep a journal.** Every entry is dated and searchable. Replay it from day 1, or ask it questions.',
      ]),
      h2('Get it'),
      code('Terminal', [`git clone ${REPO}.git homefront`, 'cd homefront', 'npm install', 'cp .env.example .env   # set HOMEFRONT_PASSWORD', 'npm start               # http://localhost:8080']),
      p('Or try the [demo in your browser](~/demo/?demo=1), with no sign-up. More: [how it works](~/how-it-works/), [the 8 countries](~/countries/), [self-hosting](~/self-hosting/), [AI providers](~/ai-providers/), [FAQ](~/faq/).'),
    ],
  });

  // ---------------- how it works ----------------
  const wins = actions.filter(a => a.side === 'win'), losses = actions.filter(a => a.side === 'loss'), neutral = actions.filter(a => a.side === 'neutral');
  const actionRows = arr => arr.map(a => [a.label, a.means.charAt(0).toUpperCase() + a.means.slice(1) + '.']);
  const turkey = byId.turkey || countries[0];
  pages.push({
    name: 'how-it-works', path: 'how-it-works/', kind: 'TechArticle',
    title: 'How Home Front works: from a sentence to a battle',
    description: 'How Home Front turns 1 sentence about your day into a dated journal entry and a battle on a 1936 map: the judge, the battle types, the 1 to 5 scale.',
    h1: 'How it works',
    lead: 'You say 1 sentence about your day. It is judged, filed and dated, and the front for that part of your life moves. Here is each step, with real entries from 3 different countries.',
    crumbs: [['How it works']],
    related: ['countries', 'ai-providers', 'faq', 'compare'],
    blocks: [
      p(DEFINITION + ' Each of the 7 borders of your country stands for 1 part of your life, such as School, Family, Partner, Work, Health, Friends and Self. Nothing moves unless you report something real.'),
      h2('What happens when you file an entry?'),
      p('3 things, in order. The answer comes first and the detail follows.'),
      ol([
        '**You say it.** Speak or type a sentence or two. "Closed the second pilot today. Skipped the gym again." That is the whole input. Voice is turned into text by the provider you chose, or by your device.',
        '**It is judged.** Your server sends the text, the current situation and a strict JSON schema to the AI provider you chose, or to the built-in offline judge. For each event it gets back: which front, win or loss, a size from 1 to 5, the reason in your words, a battle type that fits that reason, and a headline. Your API key never leaves the server.',
        '**The map moves.** The engine replays every entry you have ever made, in order, and draws the result. The front advances or gives ground, divisions gain experience or take losses, and cities change hands. The entry is saved with its date, what you said and what it changed.',
      ]),
      p('If it can’t tell where something belongs, it asks 1 question. Any judgement can be undone with 1 tap, or edited later in History, and the map rewinds as if the mistake never happened.'),
      h2('Worked examples'),
      p('These are entries from the landing page’s story, carried through the real engine on 3 different maps at build time. The words on the right are the engine’s own.'),
      table('Worked examples', ['Country', 'What was said', 'Filed as', 'Battle type', 'What moved'],
        examples.map(e => [e.country, `“${esc(e.said)}”`, `${e.area}, ${e.outcome === 'win' ? 'win' : 'loss'}, size ${e.severity} (${esc(e.reason)})`, e.type, esc([e.battle, ...e.moved].filter(Boolean).join('. '))])),
      p('The same sentence can play out differently on different maps: an armoured breakthrough needs armour on that front, ports are only struck where there is a port, fleets only fight where there is sea, and the weather follows the calendar of that part of the world.'),
      h2('How is a battle type chosen?'),
      p(`The judge states the reason first, and only then picks the type whose meaning matches it. The type is never picked for variety. There are ${actions.length} types: ${wins.length} for a win, ${losses.length} for a loss and ${neutral.length} for neither. If nothing specific fits, a win is a ground offensive and a loss is an enemy offensive. This table is read from the engine’s own list, so it is always the one the app uses.`),
      h3('When it went well'),
      table('Battle types for a win', ['Battle type', 'What it means in your life'], actionRows(wins)),
      h3('When it went badly'),
      table('Battle types for a loss', ['Battle type', 'What it means in your life'], actionRows(losses)),
      ...(neutral.length ? [p(`Neither: ${list(neutral.map(a => `**${a.label}** (${a.means})`))}.`)] : []),
      h2('What do the sizes 1 to 5 mean?'),
      table('The 1 to 5 scale', ['Size', 'Meaning', 'Examples', 'Base movement'], [
        ['1', 'Minor', 'A small task done, a mild annoyance', `${data.base[0]} points`],
        ['2', 'Ordinary', 'A normal good or bad day', `${data.base[1]} points`],
        ['3', 'Significant', 'A good grade, a real argument, a missed week of gym', `${data.base[2]} points`],
        ['4', 'Major', 'A big milestone, a serious fight, a failed exam', `${data.base[3]} points`],
        ['5', 'Decisive, rare', 'Into the dream school, funding closed, a breakup, a death', `${data.base[4]} points`],
      ]),
      p('The judge is told not to inflate: most days are 1 to 3.'),
      h2('How does a front’s position work?'),
      p('Each front has a position from −100 to 100. 0 is the border. −100 means every objective on that front has been taken. 100 means the enemy has reached the capital. A win moves the front towards the enemy and a loss moves it back.'),
      p('How far it moves starts from the base movement for the size (the table above), times the weight of the battle type (an armoured breakthrough moves the line much further than a fortification). It is then adjusted by the state of that front: the strength and organisation of its divisions, its supply, air cover, the weather, the enemy’s strength, a run of wins or losses, and whether you are fighting on your own ground or theirs. Taking back your own land is easier than pushing deep into theirs.'),
      p('3 wins in a row on 1 front launch a named operation. A front you haven’t reported on for more than 10 days lets the enemy mass, and the app says so. Damaged buildings and tired units recover with time. The map never invents a defeat for you.'),
      h2('What do the fronts look like?'),
      p(`Each country has its own 7 fronts. Here are ${turkey.name}’s, with the part of life each one stands for by default. The persona you pick on first run (General, Student, Founder, Professional, Athlete, Creator, Parent, Job seeker or Recovery) sets these names, and you can rename or pause any of them.`),
      table(`${turkey.name}’s 7 fronts`, ['Front', 'Opponent', 'Type', 'Default area'], turkey.fronts.map(f => [f.name, f.enemy, f.naval ? 'Naval' : 'Land', f.label])),
      p('See [all 8 countries](~/countries/) for the others.'),
      h2('Why is the map always right?'),
      p('The engine is a pure function: the state of the war is computed from your list of entries and the time, every time. So editing or deleting an old entry rewinds history correctly, a replay shows the whole campaign from day 1, and 2 devices with the same entries always show the same war. The engine has no randomness that isn’t seeded from your own entries.'),
      h2('What is stored?'),
      ul([
        '**Each entry:** its date and time, the words you said, and for each event the front, win or loss, the size, the battle type, the reason and the headline.',
        '**Your settings:** front names and descriptions, paused fronts, the chosen country and persona. Each country keeps its own campaign.',
        '**On your server:** the campaign (`state.json`), an append-only journal of every change (`journal.ndjson`), daily backups, logged-in devices (`sessions.json`) and your provider settings and key (`ai.json`, readable only by its owner). All of it is in 1 folder, `~/.homefront` by default.',
        '**In the browser:** a copy of the campaign so the app works offline. Never the API key.',
        '**Sent to the AI provider you chose:** the text of each entry (and the audio, if you use voice) with the current situation, to judge it. Nothing else. With a local model or the offline judge, nothing leaves your machine.',
      ]),
      h2('What else does it do?'),
      ul([
        '**History:** a calendar of reported days, every entry editable or deletable, a weekly recap and a replay of the whole campaign.',
        '**Ask the staff:** questions about your own record, such as “how has work gone since September?”, answered from your entries.',
        '**Progress:** commander experience and ranks, 3 small goals a day, a day streak and more than 30 decorations.',
        '**Shareable images:** a daily bulletin, a newspaper front page for big events and a weekly recap card.',
        '**Automation:** a token-authenticated HTTP API and a small command-line tool, so iOS Shortcuts, Siri or a scheduled job can file an entry.',
      ]),
      p(`The source of all of this is on [GitHub](${REPO}): [the architecture](${blob('docs/ARCHITECTURE.md')}), [the API](${blob('docs/API.md')}) and [the engine](${blob('js/engine.js')}).`),
    ],
  });

  // ---------------- AI providers ----------------
  const hosted = providers.filter(x => x.needsKey), local = providers.filter(x => x.local && x.base), other = providers.find(x => x.id === 'custom');
  const sttCount = providers.filter(x => x.stt).length;
  pages.push({
    name: 'ai-providers', path: 'ai-providers/', kind: 'TechArticle',
    title: 'AI providers and models for Home Front',
    description: `Which AI providers Home Front works with: ${list(hosted.map(x => x.name))}, local models in ${list(local.map(x => x.name))}, or an offline judge. Small default models.`.slice(0, 160),
    h1: 'AI providers',
    lead: `Home Front works with ${plural(hosted.length, 'hosted provider')} on your own key, ${plural(local.length, 'local server')} with no key, any OpenAI-compatible server, or no model at all.`,
    crumbs: [['AI providers']],
    related: ['self-hosting', 'how-it-works', 'faq'],
    blocks: [
      p(DEFINITION + ' A model reads each entry and files it: which part of your life it was about, win or loss, how big, and why. This page lists every provider the app can use. It is generated from the server’s own provider list when the site is built, so it always matches the code.'),
      h2('Which providers work?'),
      p(`You choose in the app, under **Settings, General staff**: pick a provider, paste your own key, and press **Test**. Nothing needs a restart. Each provider starts on its small, cheap model, because filing a day needs no frontier model. You can type another model name, and **Use default** puts the small one back.`),
      table('Providers and their default models', ['Provider', 'Key', 'Default model for judging', 'Default for speech to text', 'How it is called'],
        providers.map(x => [x.name, x.needsKey ? 'Your own key' : x.keyOptional ? 'Optional' : x.id === 'offline' ? 'None' : 'None (local)', x.model ? `\`${x.model}\`` : x.id === 'offline' ? 'Keywords, no model' : 'You type it', x.stt ? `\`${x.stt}\`` : x.id === 'offline' ? 'This device' : 'None', x.api ? API[x.api] || x.api : 'Not a model'])),
      p(`${plural(sttCount, 'provider')} can also turn speech into text. For the others, choose a different provider for voice, or “On this device”, which uses the browser’s dictation or the keyboard’s microphone key. When a provider refuses the JSON schema, the server asks for plain JSON instead and checks the answer itself. A bad answer falls back to the offline judge, as any failure does.`),
      p(`The [README](${REPO}#configuration) says, for each default, when it was last checked against that provider’s own documentation and which ones could not be confirmed. The **Test** button is the proof for your own key and model.`),
      h2('Can I use a local model?'),
      p(`Yes, and then nothing leaves your machine. Choose ${list(local.map(x => `**${x.name}**`))}, or **${other ? other.name : 'Other server'}** for anything else that speaks OpenAI’s Chat Completions. There is no key. Check the address, type the name of a model you have, and press **Test**.`),
      table('Local servers', ['Server', 'Default address', 'Default model'], local.map(x => [x.name, `\`${x.base}\``, x.model ? `\`${x.model}\`` : 'You type it'])),
      code('Terminal', ['ollama pull llama3.2      # the small default; any model you have works']),
      ul([
        'Pick a model that follows a JSON schema well. Larger instruction-tuned models choose battle types better, and very small ones tend to get the front right and the type wrong.',
        'Running Home Front in Docker and Ollama on the host? Use `http://host.docker.internal:11434/v1` as the address.',
        'Local servers aren’t used for voice. Choose “On this device”, or another provider, under Voice.',
        'A Raspberry Pi runs the server well, but use a hosted or networked model, not a model on the Pi itself.',
      ]),
      h2('What is the offline judge?'),
      p('A built-in keyword judge that needs no model, no key and no network. It routes each clause of your entry to a front by keywords and your own front names, reads positive and negative words with simple negation handling, and recognises a number of specific causes such as illness, an apology or burnout. It is cruder than a model: it misses nuance and sarcasm. It keeps the app fully working, and it is what the [browser demo](~/demo/?demo=1) uses.'),
      h2('Where is my key kept?'),
      ul([
        'On your server, in `ai.json` in the data folder (`~/.homefront/ai.json`), written with owner-only permissions.',
        'It is never sent back to the browser. The app is told only that a key exists, and its last 4 characters.',
        'It isn’t in the campaign, the journal, a backup or an export. A copy of the whole data folder does carry it, so treat that copy like the key.',
        'What is set in the app wins. `.env` remains the fallback, so an existing install keeps working with no action.',
      ]),
      p(`The \`.env\` names, for a key kept on the server instead of in the app: ${list(providers.filter(x => x.envKey).map(x => `\`${x.envKey}\``))}. A key from \`.env\` shows in the app as “set on the server”: the app can use it, and can’t show or remove it.`),
      h2('What does it cost?'),
      p('1 short request for each entry, a prompt of a couple of thousand tokens and a small JSON answer, plus a speech-to-text request if you dictate. For 1 person filing every day that is a small amount each month on a hosted provider’s small model, and nothing with a local model or the offline judge. There is no subscription: you pay your provider directly, on your own key, or nothing.'),
      h2('What is sent to the provider?'),
      p(`The text of the entry (and the audio, if you use voice), the names and descriptions of your fronts, a short summary of the current situation and the most recent entries, and the schema of the answer. Nothing goes to the project itself: there is no telemetry.`),
    ],
  });

  // ---------------- self-hosting ----------------
  pages.push({
    name: 'self-hosting', path: 'self-hosting/', kind: 'TechArticle', howto: true,
    title: 'Self-host Home Front on a Mac, Pi, Linux or Docker',
    description: 'Run Home Front on your own machine: a Mac mini, a Raspberry Pi, Linux, Docker or a cloud host with a disk. Node 20, 1 password, your data in 1 folder.',
    h1: 'Self-hosting',
    lead: `Home Front runs as 1 small Node server on a machine you control. You need Node ${data.node} or newer, or Docker, and a folder that survives a restart.`,
    crumbs: [['Self-hosting']],
    related: ['ai-providers', 'faq', 'how-it-works'],
    steps: [
      ['Get the code', `git clone ${REPO}.git homefront && cd homefront`],
      ['Install the build tools', 'npm install'],
      ['Set a password', 'cp .env.example .env, then set HOMEFRONT_PASSWORD in .env'],
      ['Start it', 'npm start'],
      ['Open it', 'Open http://localhost:8080, log in, pick a country and file your first entry'],
    ],
    blocks: [
      p(DEFINITION + ' It is built for 1 person on a machine they control: 1 server, 1 password, and your record in 1 folder of plain files. This page is a readable summary. The [full self-hosting guide](' + blob('docs/SELF_HOSTING.md') + ') has every detail.'),
      h2('What do I need?'),
      ul([`Node ${data.node} or newer, or Docker. The server has no runtime dependencies.`, 'A machine that stays on, if you want it from your phone: a Mac mini, a Raspberry Pi, a home server or a small cloud host.', 'Optionally, a key for an AI provider. Without one the offline judge files your entries.']),
      h2('How do I install it?'),
      ol(['Get the code.', 'Install the build tools for the interface.', 'Copy the settings file and set a password in it (`HOMEFRONT_PASSWORD`). The server refuses to start without one.', 'Start it. It builds the interface the first time, then serves it on port 8080.', 'Open the address, log in, pick a country and a persona, and file your first entry.']),
      code('Terminal', [{ note: '# 1. Get it' }, `git clone ${REPO}.git homefront`, 'cd homefront', { note: '# 2. Install it and set a password in .env' }, 'npm install', 'cp .env.example .env', { note: '# 3. Start it, then open http://localhost:8080' }, 'npm start']),
      p('To have a model judge your entries, add your own key in the app under Settings, General staff, or skip it. See [AI providers](~/ai-providers/).'),
      h2('Can my coding agent set it up for me?'),
      p('Yes. The repository ships a setup guide written for agents, [SKILL.md](' + blob('SKILL.md') + '). It covers every platform on this page, generates a password without showing it, starts the server, checks it, and can add a background service, HTTPS for your phone and backups, asking before each system change. Give your agent (Claude Code, Codex, Cursor or any other) this 1 line:'),
      code('Prompt for your agent', [`Read ${REPO.replace('github.com', 'raw.githubusercontent.com')}/main/SKILL.md and set up Home Front for me.`]),
      p('The same file is served by this site, so `curl` works too:'),
      code('Terminal', [`curl -fsSL ${site}skill.md`]),
      h2('Where can it run?'),
      table('Where Home Front can run', ['Where', 'Works', 'How'], [
        ['Mac (a Mac mini that stays on is ideal)', 'Yes', 'Node, kept running by launchd'],
        ['Raspberry Pi 3, 4, 5 or Zero 2, 64-bit system', 'Yes', 'Node, kept running by systemd. The first install and build take a few minutes'],
        ['Linux PC, home server or NAS', 'Yes', 'Node with systemd, or Docker'],
        ['Windows', 'Yes', 'Node in WSL2, treated as Linux, or Docker Desktop'],
        ['Docker anywhere', 'Yes', '`docker compose up -d`, data in a named volume'],
        ['A cloud host with a disk (Fly.io, Railway, Render, a VPS)', 'Yes', 'The Docker image, with a persistent volume for the data'],
        ['GitHub Pages, Vercel, Netlify, Cloudflare Pages', 'Demo only', 'Static files with no disk: the browser-only demo'],
      ]),
      p('The test for any other host: can it run a long-lived Node process, or a container, with a folder that survives restarts? If yes, it works.'),
      h2('How do I keep it running on a Mac?'),
      p('The repository ships a launchd agent, `deploy/com.homefront.server.plist`, that starts the server at login and restarts it if it stops. Put the absolute path of `node` (from `which node`) and of the repository into it, copy it to `~/Library/LaunchAgents/` and load it with `launchctl load`. On a Mac mini without a screen, turn on automatic login and stop the Mac from sleeping in System Settings, Energy.'),
      h2('How do I run it on a Raspberry Pi or Linux?'),
      p('Install Node 20 or newer, clone the repository into a folder owned by a service user, and run it as a systemd service with `Restart=always`. The guide has a ready unit file with hardening that lets the service write only to its data folder. The server is light enough for any Pi from the 3 onwards. Check it with `systemctl status homefront` and follow the log with `journalctl -u homefront -f`.'),
      h2('How do I run it with Docker?'),
      code('Terminal', ['cp .env.example .env       # set HOMEFRONT_PASSWORD', 'docker compose up -d', 'docker compose logs -f']),
      p('The compose file builds a small image (`node:22-alpine`, not root), keeps the data in a named volume and publishes port 8080 on the host’s loopback interface only. The image has a health check, so `docker ps` shows `healthy` once it is up.'),
      h2('Can I host it in the cloud?'),
      p('Yes, on any host that runs a container and gives it a persistent disk. Build from the `Dockerfile`, attach a volume at `/app/private`, set `HOMEFRONT_PASSWORD` through the host’s secrets, never in the image, and let the host provide HTTPS. The login page is then on the public internet, so the password must be long and random.'),
      h2('What can a static host do?'),
      p('Only the demo. GitHub Pages, Vercel, Netlify and Cloudflare Pages serve files and short-lived functions with no disk, so they can’t run the server, keep your journal or hold a key. `npm run build:site` builds this site and the app as a browser-only demo, with the offline judge and the data kept in that browser. That is how [the demo](~/demo/?demo=1) is served. It isn’t the private, synced app.'),
      h2('How do I use it on my phone?'),
      p('Put HTTPS in front of the server, because the microphone and offline mode only work over HTTPS. The private way is [Tailscale](https://tailscale.com): only your own devices can open the address, and nothing is exposed to the internet.'),
      code('Terminal', ['tailscale serve --bg 8080   # then open https://<machine>.<tailnet>.ts.net']),
      p('Open that address in Safari or Chrome, log in, and add it to the home screen. It then opens full-screen and keeps working offline. Set `HOST=127.0.0.1` in `.env` so the port is reachable only through the tunnel. A public domain with Caddy works too; the guide explains the trade-off.'),
      h2('How do I back it up and update it?'),
      p('Everything worth keeping is the data folder, `~/.homefront` by default. Copy it somewhere else as well: the server’s own daily backups live in the same folder, so they don’t protect against a dead disk. The app also exports a single JSON backup from Settings.'),
      code('Terminal', [{ note: '# a backup, then the update' }, 'tar -czf "$HOME/backups/homefront-$(date +%F).tar.gz" -C "$HOME" .homefront', 'git pull', 'npm install && npm run build', { note: '# then restart the service' }]),
      p('There is nothing to migrate. The map is replayed from your entries, so a new version draws the same history. Read the [changelog](' + blob('CHANGELOG.md') + ') first: a change to the engine’s rules can shift where your fronts stand.'),
      h2('Is it private?'),
      ul(['1 user and 1 password. Nothing but a password box is served until you log in, and failed attempts are rate-limited.', 'Your API key stays on the host and never reaches the browser.', 'Every response from your server carries `noindex`, and its `robots.txt` disallows everything, so search engines stay away from your instance.', 'No telemetry. The server makes no network calls other than to the AI provider you chose.']),
      p('Read more: the [self-hosting guide](' + blob('docs/SELF_HOSTING.md') + '), [SKILL.md](' + blob('SKILL.md') + ') and the [security policy](' + blob('SECURITY.md') + ').'),
    ],
  });

  // ---------------- FAQ ----------------
  pages.push({
    name: 'faq', path: 'faq/', kind: 'FAQPage',
    title: 'Home Front FAQ: questions and answers',
    description: `${FAQ_ALL.length} questions about Home Front answered: is it a game, does it need an API key, what it costs, phones and offline use, privacy, self-hosting.`,
    h1: 'Questions and answers',
    lead: 'Short, direct answers about what Home Front is, how it judges your entries, what it costs, where your data lives and how to run it.',
    crumbs: [['FAQ']],
    related: ['how-it-works', 'self-hosting', 'ai-providers', 'compare'],
    blocks: [
      p(DEFINITION + ` Here are ${FAQ_ALL.length} questions people ask about it. The long form, with setup detail, is [docs/FAQ.md](${blob('docs/FAQ.md')}) in the repository.`),
      h2('Key facts'), ul(keyFacts(data)),
      ...FAQ_GROUPS.flatMap(g => [h2(g.title), { t: 'faq', items: g.items.map(({ q, a }) => ({ q, a })) }]),
    ],
  });

  // ---------------- compare ----------------
  pages.push({
    name: 'compare', path: 'compare/', kind: 'WebPage',
    title: 'Home Front vs a habit tracker, journal or spreadsheet',
    description: 'How Home Front differs from a habit tracker, a journal app, a spreadsheet and gamified to-do apps, and who should not use it. An honest comparison.',
    h1: 'How it compares',
    lead: 'Home Front sits between a habit tracker and a journal. Here is what it does differently from each kind of tool, and who should use something else.',
    crumbs: [['Compare']],
    related: ['how-it-works', 'faq', 'countries'],
    blocks: [
      p(DEFINITION + ' It compares to whole kinds of tools, not to any one product. Every tool on this page is a good choice for someone.'),
      h2('In short'),
      table('Home Front and other kinds of tools', ['', 'Habit tracker', 'Journal app', 'Spreadsheet', 'Home Front'], [
        ['Daily input', 'Tick a box for each habit', 'Write as much as you like', 'Type numbers and notes into cells', '1 sentence, spoken or typed'],
        ['What you see', 'Streaks and checkmarks', 'Pages of text', 'Whatever charts you build', '1 map: 7 fronts that moved'],
        ['Areas of life', 'One habit at a time', 'Implicit in the text', 'As many as you add', '7 fronts, named for you or by you'],
        ['Judging an event', 'You decide in advance what counts', 'Nobody does', 'You do, by hand', 'A model or the offline judge, and you can correct it'],
        ['Neglect', 'A broken streak', 'Nothing', 'Nothing', 'A quiet front, and after 10 days a warning'],
        ['Your data', 'Usually a company’s server', 'Varies', 'A file you own', 'Plain files on your own machine'],
      ]),
      h2('How is it different from a habit tracker?'),
      p('A habit tracker asks you to decide in advance what counts, then tick it every day. That works well for 1 or 2 habits and tends to fail when life doesn’t fit the boxes. Home Front has no boxes. You say what happened, including the things you didn’t plan, and it decides which part of your life it belongs to. A missed gym day and a fight with your brother land on different fronts with different weight. What you get back is the balance between parts of your life, not a streak for each.'),
      p('If what you want is to build 1 specific habit and see an unbroken chain, a habit tracker is the better tool.'),
      h2('How is it different from a journal app?'),
      p('A journal keeps your words. Home Front keeps them too, dated and searchable, and you can read them back or ask questions of them. The difference is that each entry also becomes a result on a map, so a month of entries is something you can see in 1 look: which area is advancing, which is giving ground, which you haven’t mentioned in weeks.'),
      p('If you want long, private writing with no judgement at all, a plain journal is better. Home Front’s entries are short and each one is judged.'),
      h2('How is it different from a spreadsheet?'),
      p('A spreadsheet can track anything, if you design it, keep it up and read it. Home Front is the opposite trade: almost no input and a fixed picture. You can’t add your own columns or charts. You can export everything as JSON at any time, and the record is a folder of plain files.'),
      h2('How is it different from gamified to-do apps?'),
      p('Many apps turn tasks into points, levels or a character to look after. Home Front borrows the pull of a strategy game, but there is nothing to play and no way to win by being clever. It doesn’t give you tasks. The map only moves when you report something real, and a bad week shows as ground lost, without punishment beyond that.'),
      h2('How is it different from a quantified-self dashboard?'),
      p('Dashboards are built from numbers that devices collect: steps, sleep, screen time. Home Front is built from what you say, which covers the things no device measures, such as an argument, an exam or a good evening with friends. It doesn’t import data from devices today.'),
      h2('Who should not use it?'),
      ul([
        '**If a war map is not for you.** It is a metaphor, set in 1936 with historical states as opponents. That framing is the product. If it puts you off, pass on it.',
        '**If you need several people on 1 account.** 1 server is 1 campaign behind 1 password. A household runs 1 instance for each person.',
        '**If you want a hosted service.** There is no account to sign up for. You run it yourself, or use the browser demo, which keeps its data only in that browser.',
        '**If you need exact numbers.** It shows direction and balance, not measurements. Track weights, money or minutes somewhere else.',
        '**If you want every word to stay on your machine but don’t want to run a local model.** A hosted provider receives the text of each entry. The offline judge and local models keep it all at home.',
        '**If you can’t run a server and want sync between devices.** It needs a machine that stays on, or a cloud host with a disk.',
      ]),
      h2('Who it suits'),
      ul(['People who stopped using habit trackers because the boxes didn’t fit their life.', 'People juggling school, work, family and health who want to see which one is paying for the others.', 'People who like strategy games and would rather read a front line than a chart.', 'People who want their record on their own machine, in plain files.']),
      p('[Try the demo](~/demo/?demo=1) in your browser, with no sign-up, or read [how it works](~/how-it-works/).'),
    ],
  });

  // ---------------- countries ----------------
  pages.push({
    name: 'countries', path: 'countries/', kind: 'CollectionPage',
    title: 'The 8 countries of Home Front, on their 1936 borders',
    description: `${list(countries.map(c => c.name))} on their 1936 borders. Each has 7 fronts, its own army, navy and air force, and an empire to restore.`.slice(0, 160),
    h1: `${countries.length} countries`,
    lead: `Each country has its own 1936 map, 7 fronts, army, navy, air force, commanders and ranks, and a historical empire to restore. Change country at any time. Each keeps its own campaign.`,
    crumbs: [['Countries']],
    related: countries.map(c => `country-${c.id}`),
    blocks: [
      p(DEFINITION + ' The country you pick sets the map: its 7 borders become the 7 parts of your life, each facing a different neighbour. Each country page below describes its setting, its fronts and its order of battle, all read from the scenario that the app itself plays.'),
      table('The countries', ['Country', 'Year', 'Empire to restore', 'Fronts', 'Divisions', 'Ships'], countries.map(c => [`[${c.name}](~/countries/${c.id}/)`, String(c.year), c.empire, `${c.land} land, ${c.naval} naval`, String(c.divisions), String(c.ships)])),
      h2('Why these countries?'),
      p('A country in 1936 gives the map its shape: 1 state in the middle, with borders in every direction, each facing a different neighbour. That makes 7 distinct fronts with their own terrain and objectives. Each country’s historical empire supplies the far goal: take every objective on every front and it is restored. The project began with Iran, and the others followed. Countries that were the aggressors of the period are left out on purpose.'),
      h2('How are the maps made?'),
      p('Borders come from Natural Earth’s modern country outlines, regrouped into the states of 1936: colonial empires, mandates, the Soviet Union and so on. Where a 1936 border cut through a modern country, the map uses the modern line, and each country page lists those approximations. Provinces are generated from seeded points, so the same sources always give the same map. Cities, ports, airfields, rivers, railways and every name are written by hand for each country.'),
      h2('Can I add a country?'),
      p(`Yes. A country is 1 file in \`tools/scenarios/\`, and \`npm run build:map\` turns it into a map. [docs/SCENARIOS.md](${blob('docs/SCENARIOS.md')}) describes the format: exactly 7 fronts, the year 1936, a formable empire, plausible period names and no real living people. Open an issue first, so 2 people don’t write the same country.`),
    ],
  });

  for (const c of countries) {
    const navalFronts = c.fronts.filter(f => f.naval);
    const others = countries.filter(x => x.id !== c.id);
    const approx = c.approximations.length ? c.approximations : c.builtFrom.filter(b => b.from.length > 1 || b.from[0] !== b.name).slice(0, 8).map(b => `${b.name} is drawn from the modern outline${b.from.length > 1 ? 's' : ''} of ${list(b.from)}.`);
    pages.push({
      name: `country-${c.id}`, path: `countries/${c.id}/`, kind: 'WebPage', country: c.id,
      title: `Play as ${c.name} in ${c.year} · Home Front`,
      description: `${c.long} in ${c.year}: ${c.land} land and ${c.naval} naval fronts, ${c.divisions} divisions, ${c.ships} ships. Restore the ${c.empire} in Home Front.`.slice(0, 160),
      h1: `${c.name} in ${c.year}`,
      lead: `${c.blurb} Each border stands for a part of your life.`,
      crumbs: [['Countries', 'countries/'], [c.name]],
      image: { src: `img/countries/${c.id}.png`, w: 1200, h: 630, alt: `The Home Front map of ${c.name} in ${c.year} during a campaign: the home country in the middle, front lines on its ${c.land} land borders${c.naval ? ` and ${c.naval} sea theatres` : ''}, and division counters along them.` },
      related: ['countries', ...others.slice(0, 3).map(x => `country-${x.id}`), 'how-it-works'],
      blocks: [
        p(`${DEFINITION} This page describes its ${c.name} campaign: the ${c.long} in ${c.year}, with ${plural(c.land, 'land front')}${c.naval ? ` and ${plural(c.naval, 'naval theatre')}` : ''}, and the ${c.empire} as the far goal. Everything here is read from the scenario the app plays.`),
        { t: 'image', ...{ src: `img/countries/${c.id}.png`, w: 1200, h: 630, alt: `The Home Front map of ${c.name} in ${c.year} during a campaign: the home country in the middle, front lines on its borders and division counters along them.` } },
        h2('The setting'),
        p(`You play the ${c.long} in ${c.year}, with its capital at ${c.capital}. The home country is ${plural(c.homeStates, 'region')} on a map of ${c.provinces} provinces. ${c.fightsOnFrom ? `If ${c.capital} falls, the government fights on from ${c.fightsOnFrom}.` : ''}`),
        ...(c.motto ? [{ t: 'quote', text: esc(c.motto) }] : []),
        h2(`The empire to restore: the ${c.empire}`),
        p(`Every front has objectives beyond the border. Take all of them, on all 7 fronts, and the ${c.empire} is restored. Conquered lands come back under their historical names: ${plural(c.regions, c.regionWord.toLowerCase())} in all, such as ${list(c.regionNames.slice(0, 4))}.`),
        ...(c.landmarks.length ? [p('Some places carry a decoration of their own:'), ul(c.landmarks.map(l => `**${esc(l.medal)}:** ${esc(l.desc)}.`))] : []),
        h2(`What are ${c.name}’s 7 fronts?`),
        p(`Each border is 1 part of your life. These are the default names, from the General persona. Pick another persona on first run, or rename and pause any front in Settings.`),
        table(`${c.name}’s fronts`, ['Front', 'Opponent', 'Type', 'Default area', 'Objectives include'], c.fronts.map(f => [f.name, f.enemy, f.naval ? 'Naval' : 'Land', f.label, f.objectives.length ? list(f.objectives) : esc(f.restores)])),
        ...(navalFronts.length ? [p(`On the ${list(navalFronts.map(f => f.name))}, fleets fight and ports can be struck. On land fronts they can’t.`)] : [p(`${c.name} has no naval front: all 7 fronts are land borders.`)]),
        h2('Order of battle'),
        p(`On the first day, ${c.name} has ${plural(c.divisions, 'division')}, ${plural(c.ships, 'ship')} in ${plural(c.fleets.length, 'fleet')}${c.wings.length ? ` and ${plural(c.wings.length, 'air wing')}` : ''}. Divisions lead battles according to their arm: armour breaks through, cavalry counter-attacks, artillery holds the line. They gain experience, earn battle honours and nicknames, or take the losses. New divisions are raised from veterans as a front gains merit.`),
        h3('Divisions on each front'),
        table(`${c.name}’s divisions by front`, ['Front', 'Commander', 'Divisions'], c.fronts.map(f => [f.name, f.commander || '', f.divisions.map(d => esc(d.name)).join(', ')])),
        ...(c.reserve.length ? [p(`In reserve at ${c.capital}: ${list(c.reserve.map(d => esc(d.name)))}.`)] : []),
        ...(c.fleets.length ? [h3('Fleets'), ...c.fleets.map(fl => p(`**${esc(fl.name)}**, based at ${fl.base} on the ${fl.sea}: ${list(fl.ships.map(s => `${esc(s.name)} (${s.cls.toLowerCase()})`))}.`))] : []),
        ...(c.wings.length ? [h3('Air wings'), table(`${c.name}’s air wings`, ['Wing', 'Role', 'Aircraft', 'Base', 'Planes'], c.wings.map(w => [esc(w.name), w.type, esc(w.model), w.base, String(w.planes)]))] : []),
        ...(c.ranks.length ? [h2('Ranks'), p(`Your commander rises through ${c.name}’s own ranks as you report, from ${esc(c.ranks[0].native)} (${c.ranks[0].english}) to ${esc(c.ranks[c.ranks.length - 1].native)} (${c.ranks[c.ranks.length - 1].english}).`), table(`${c.name}’s ranks`, ['Rank', 'In English'], c.ranks.map(r => [esc(r.native), r.english]))] : []),
        h2('How the map was drawn'),
        p(`Borders are built from Natural Earth’s modern country outlines, regrouped into the states of ${c.year}. Where modern outlines can’t reproduce ${c.year} exactly, the scenario takes the simpler honest approximation and says so:`),
        ul(approx.map(esc)),
        p('Commanders and officers have plausible period names, not the names of real people.'),
        h2(`How do I play as ${c.name}?`),
        p(`Press **Play as ${c.name}** at the top of this page to open the demo in your browser, already on ${c.name}, with no sign-up. The demo uses the offline judge and keeps its data in that browser. To keep a real campaign, [self-host it](~/self-hosting/) and pick ${c.name} on first run, or change country at any time in Settings. Each country keeps its own campaign.`),
        p(`Other countries: ${list(others.map(x => `[${x.name}](~/countries/${x.id}/)`))}.`),
      ],
    });
  }
  return pages;
}

// What each page is called in a list of links (footer, "Read next", llms.txt), with its one line.
export function linkOf(page) {
  const short = { 'how-it-works': 'How it works', 'ai-providers': 'AI providers', 'self-hosting': 'Self-hosting', faq: 'FAQ', compare: 'Compare', countries: 'Countries' };
  return { label: page.country ? page.h1.replace(/ in \d+$/, '') : short[page.name] || page.h1, line: page.description };
}
