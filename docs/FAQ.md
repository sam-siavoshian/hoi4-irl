# FAQ

## The idea

### Is it a game?

No. There is nothing to play and no way to win by being clever. The map only moves when you report
something that happened in your life. It borrows the look and the pull of a strategy game so that
keeping a record is something you want to do. Think of it as a diary with consequences.

### Why a war map? Why 1936?

A front line is an honest picture of a life. Several things compete for limited attention; ground gained
in one place is often paid for in another; neglect has a cost that shows up slowly and then all at once.
A map shows all of that at a glance.

A country in 1936 gives the map its shape: one state in the middle, with borders in every direction, each
facing a different neighbour. That makes seven distinct fronts with their own terrain and objectives.
Each country's historical empire supplies the far goal: take every objective and it is restored. The
project began with Iran and the Achaemenid Empire; Turkey, Greece, France, Ethiopia, Siam, Peru and
Mexico followed. Countries that were the aggressors of the period are left out on purpose.

### Is it making light of war?

It is a metaphor, and the judge is told so in its instructions: "a metaphor for their life, not a game
and not real warfare." The setting is historical, the enemies are 1936 states, and no real conflict is
simulated. If the framing is not for you, that is a fair reason to pass on it.

### What happens if I stop reporting?

Mostly nothing: it is a tracker, so no report means no battle. Two things do change with time. Damaged
units and buildings recover, and a front you have not reported on for a while lets the enemy mass, which
shows up as a warning on that front. The map never invents defeats for you.

### What does "winning" look like?

Each front has objectives beyond the border. Take them all, on every front, and the empire is
restored. In the other direction, a front that collapses all the way puts the enemy in the capital. Most of
life happens in between.

## Using it

### How does it decide what a report means?

For each event in your report the judge returns: which front it belongs to, whether it was a win or a
loss, a severity from 1 (minor) to 5 (decisive, rare), the reason in your own terms, and the battle type
whose meaning matches that reason. Illness is harsh conditions. Self-sabotage is sabotage. Help from a
friend is close air support. If nothing specific fits, it is a plain offensive. The reason is saved with
the entry and shown in History.

### It judged something wrong. Now what?

Tap Undo straight away, or open the entry in History and edit or delete it. Because the whole war is
replayed from your list of reports, the map rewinds as if the mistake had never happened.

You can also help the judge: give each front a one-line description in Settings ("School = my chemistry
degree, including the lab job"). It is included in every judging request.

### Can I report something from a few days ago?

Yes. Say when it happened ("on Monday I...", "yesterday") and the staff dates it, up to a week back.

### Do I have to write a lot?

No. One sentence is a report. Each front also has one-tap Win and Loss buttons for days when you do not
want to write at all.

### Can I rename the fronts?

Yes. Pick a persona on first run (Student, Founder, Athlete, Creator, Parent and others) to get a
sensible starting set, then rename anything in Settings. You can also pause fronts you do not need;
paused fronts are left out of judging.

### Can I have more than seven areas, or fewer?

Fewer: pause the ones you do not use. More: not today. The seven fronts come from the map's geography.

### Can I use my own map or country?

Yes. Eight countries ship with it; choose one on first run or change it in Settings, and each keeps its
own campaign. A new country is one file in `tools/scenarios/` holding its geography, fronts and names;
[SCENARIOS.md](SCENARIOS.md) documents the format. Borders are rebuilt from modern country outlines, so
where a 1936 border cut through a modern country the map uses the modern line; each scenario file lists
its approximations at the top.

## Models and cost

### Do I need an OpenAI account?

No. There are three ways to run it:

1. **OpenAI** (the default): set `OPENAI_API_KEY`.
2. **Any OpenAI-compatible endpoint**: Ollama or LM Studio on your own machine, or a hosted one such as
   OpenRouter or Groq. Set `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `LLM_API=chat` if the server has no
   Responses API.
3. **No model at all**: leave the key empty and the offline keyword judge is used.

### How good is the offline judge?

Good enough to keep the map moving; not as good as a model. It routes clauses to fronts by keywords and
your labels, reads positive and negative words with simple negation handling, and recognises a number
of specific causes (illness, apology, burnout and so on). It will miss nuance, sarcasm and anything
unusual. It never needs a network connection.

### Which local model should I use?

One that follows a JSON schema reliably. Larger instruction-tuned models choose battle types better;
very small ones tend to get the front right and the type wrong. Try it with a few reports you know the
right answer to. Bad judgements are easy to fix in History.

### How much does it cost?

One short request per report (a prompt of a couple of thousand tokens and a small JSON answer), plus a
transcription request if you dictate. For one person reporting daily, that is a small amount per month
on a hosted model, and nothing on a local one.

### Does voice work with local models?

Only if your endpoint offers `/audio/transcriptions`. Otherwise use the dictation key on your keyboard,
which works everywhere and needs no setup.

## Offline, sync and devices

### Does it work offline?

Yes. Once installed to the Home Screen over HTTPS, the app opens with no connection. Reports are saved
on the device first. If the server cannot be reached, judging falls back to the offline judge and the
report syncs when the connection returns.

### How do my phone and computer stay the same?

The server stores one copy of the campaign with a revision number. Each device saves with the revision
it last saw. If another device saved first, the server hands back the newer copy and the device adopts
it. It is simple and safe for one person; it is not a merge, so avoid making changes on two devices
while both are offline.

### Why does it need HTTPS?

Browsers only allow the microphone and offline mode on HTTPS. It also keeps your password private on
the network. Tailscale gives you HTTPS on a private address in one command; see
[SELF_HOSTING.md](SELF_HOSTING.md#https).

### Is there a native app?

No. It is a web app that installs to the Home Screen and behaves like one. That is what keeps it to one
codebase.

### Can I run it without the server at all?

For development, yes: `npm run serve` is a plain static server, and the app runs with the offline judge
and browser storage only. There is no login, no sync and no model in that mode, so it is not meant for
real use. The hosted [demo](https://sam-siavoshian.github.io/hoi4-irl/) works the same way.

## Data and privacy

### Where is my data?

In one folder on your host: `private/` (or wherever `HOMEFRONT_DATA_DIR` points). `state.json` is the
campaign, `journal.ndjson` is an append-only record of every change, and the server keeps daily backups
beside them. Each device also holds a copy in the browser's storage so it can work offline.

### Who can see what I write?

You, and the model provider you chose, which receives the text of each report (and audio, if you use
voice) in order to judge it. With a local model or the offline judge, nothing leaves your machine. The
project collects nothing; there is no telemetry.

### Can several people use one server?

No. One server is one campaign behind one password. For a household, run one instance per person on
different ports or in separate containers.

### How do I export or delete everything?

Export: Settings › More › Export backup gives one JSON file, or copy the data folder. Delete: stop the
server and remove the data folder, then clear the site's data in each browser.

### I forgot my password.

Change `HOMEFRONT_PASSWORD` in `.env` and restart. Your data is untouched; devices that were already logged
in stay logged in. To log every device out, delete `sessions.json` from the data folder as well.

## The project

### What is it built with?

The engine, the map renderer and the server are plain JavaScript with no runtime dependencies, so the
rules are easy to read and the server has nothing to audit. The interface is a small React app built
with Vite on a design system kept in `vendor/design-system`. `npm install && npm start` builds it and
starts the server.

### How can I help?

See [CONTRIBUTING.md](../CONTRIBUTING.md). Good first contributions: a new battle type with a clear
real-life meaning, a persona preset, better keyword rules for the offline judge, or documentation for a
hosting setup that is not covered yet.

### Is it affiliated with any strategy game?

No. It is an independent open-source project and uses no assets from any commercial game. Icons come
from Game-icons.net and Lucide, and borders from Natural Earth; see [NOTICE.md](../NOTICE.md).
