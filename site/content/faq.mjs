// Every question the site answers, once. The landing page shows the ones marked `landing`, /faq/ shows all of them,
// and the FAQPage structured data and the Markdown copies are built from this same list (tools/build-site.mjs), so
// the three can't disagree. Answers are plain text: no markup, so they read the same in HTML, JSON-LD and Markdown.
// The long form, with setup detail, is docs/FAQ.md in the repository.
export const FAQ_GROUPS = [
  {
    title: 'The idea',
    items: [
      { landing: true, q: 'Is it a game?', a: 'No. It looks like one, but there is nothing to play. The map only moves when you report something real. It is a diary with consequences.' },
      { q: 'What is Home Front?', a: 'Home Front is an open-source, self-hosted productivity app and daily journal that shows your life as a 1936 grand-strategy war map. Each border of your country stands for 1 part of your life. You say what happened today, the entry is filed and dated, and that front advances or gives ground.' },
      { q: 'Why a war map, and why 1936?', a: 'A front line is an honest picture of a life. Several things compete for limited attention, ground gained in one place is often paid for in another, and neglect shows up slowly and then all at once. A country in 1936 gives the map its shape: 1 state in the middle with a different neighbour on every border, which makes 7 fronts. Each country’s historical empire is the far goal.' },
      { q: 'Does it make light of war?', a: 'It is a metaphor, and the judge is told so in its instructions: a metaphor for a life, not a game and not real warfare. The setting is historical, the opponents are 1936 states, and no real conflict is simulated. Countries that were the aggressors of the period are left out on purpose. If the framing isn’t for you, that is a fair reason to pass on it.' },
      { q: 'What happens if I stop reporting?', a: 'Mostly nothing. No report means no battle. 2 things change with time: damaged units and buildings recover, and a front you haven’t reported on for more than 10 days shows a warning that the enemy is massing. The map never invents defeats for you.' },
      { q: 'What does winning look like?', a: 'Each front has objectives beyond the border. Take them all, on every front, and the country’s historical empire is restored. In the other direction, a front that collapses all the way puts the enemy in the capital. Most of life happens in between.' },
    ],
  },
  {
    title: 'Using it',
    items: [
      { q: 'How does it decide what an entry means?', a: 'For each event in what you said, the judge returns which front it belongs to, whether it was a win or a loss, a size from 1 (minor) to 5 (decisive, rare), the reason in your own terms, and the battle type whose meaning matches that reason. Illness is harsh conditions. Self-sabotage is sabotage. Help from a friend is close air support. The reason is saved with the entry.' },
      { q: 'It judged something wrong. What now?', a: 'Tap Undo straight away, or open the entry in History and edit or delete it. The whole map is replayed from your list of entries, so it rewinds as if the mistake never happened. You can also give each front a 1-line description in Settings, which is sent with every judging request.' },
      { q: 'Do I have to write a lot?', a: 'No. 1 sentence is an entry. Each front also has 1-tap Win and Loss buttons for days when you don’t want to write at all.' },
      { q: 'Can I report something from a few days ago?', a: 'Yes. Say when it happened (“on Monday”, “yesterday”) and it is dated for you, up to 7 days back.' },
      { landing: true, q: 'Can I change the map?', a: 'Yes. Pick any of the 8 countries, rename every front and pause the ones you don’t need. Each country keeps its own campaign.' },
      { q: 'Can I have more than 7 areas, or fewer?', a: 'Fewer, yes: pause the fronts you don’t use and they are left out of judging. More than 7 isn’t possible today. The 7 fronts come from each map’s geography.' },
      { q: 'Can I add my own country?', a: 'Yes. A country is 1 file in tools/scenarios/ that holds its geography, fronts and names, and npm run build:map turns it into a map. docs/SCENARIOS.md in the repository describes the format.' },
    ],
  },
  {
    title: 'AI providers and cost',
    items: [
      { landing: true, q: 'Does it need an API key?', a: 'No. With no key, the offline keyword judge files your entries on the device. Add your own key or a local model later, in Settings, without losing anything.' },
      { q: 'Which AI providers does it work with?', a: 'OpenAI, Anthropic, Google Gemini, Groq, Mistral and OpenRouter with your own key, Ollama and LM Studio on your own machine with no key, any other server that speaks OpenAI’s Chat Completions, and a built-in offline judge that uses no model at all. You choose in Settings, under General staff.' },
      { landing: true, q: 'What does it cost to run?', a: '1 short model call for each entry, plus speech to text if you use voice. With a local model or the offline judge it costs nothing.' },
      { q: 'How good is the offline judge?', a: 'Good enough to keep the map moving, and not as good as a model. It routes each clause to a front by keywords and your own labels, reads positive and negative words with simple negation handling, and recognises a number of specific causes such as illness, an apology or burnout. It misses nuance and sarcasm. It never needs a network connection.' },
      { q: 'Which local model should I use?', a: 'One that follows a JSON schema reliably. The default for Ollama is llama3.2. Larger instruction-tuned models choose battle types better, and very small ones tend to get the front right and the type wrong. Try it with a few entries you know the right answer to. A wrong judgement takes 1 tap to fix.' },
      { q: 'Does voice work with a local model?', a: 'Local servers aren’t used for speech to text. Choose “On this device” under Voice, which uses the browser’s dictation or the keyboard’s microphone key, or pick a hosted provider for voice only.' },
    ],
  },
  {
    title: 'Phone, offline and sync',
    items: [
      { landing: true, q: 'Does it work on a phone?', a: 'Yes. It installs to the iPhone or Android home screen and keeps working offline. Entries made offline are kept on the phone and sent when you are back online.' },
      { q: 'Does it work offline?', a: 'Yes, in 2 ways. Installed to the home screen over HTTPS, the app opens and takes entries with no connection. And with no API key at all, the offline keyword judge files entries on the device.' },
      { q: 'Why does it need HTTPS?', a: 'Browsers only allow the microphone and offline mode over HTTPS, and it keeps your password private on the network. Tailscale gives a private HTTPS address in 1 command: tailscale serve --bg 8080.' },
      { q: 'How do my phone and computer stay the same?', a: 'The server stores 1 copy of the campaign with a revision number. Each device saves with the revision it last saw. If another device saved first, the server hands back the newer copy and the device adopts it. It is safe for 1 person. It isn’t a merge, so avoid changing things on 2 devices while both are offline.' },
      { q: 'Is there a native app?', a: 'No. It is a web app that installs to the home screen and behaves like one. That keeps it to 1 codebase.' },
    ],
  },
  {
    title: 'Data and privacy',
    items: [
      { q: 'Where is my data?', a: 'In 1 folder on your own machine: ~/.homefront, or wherever HOMEFRONT_DATA_DIR points. state.json is the campaign, journal.ndjson is an append-only record of every change, and the server keeps daily backups beside them. Each device also keeps a copy in the browser so it can work offline.' },
      { q: 'Who can see what I write?', a: 'You, and the AI provider you chose, which receives the text of each entry (and the audio, if you use voice) to judge it. With a local model or the offline judge, nothing leaves your machine. The project collects nothing. There is no telemetry.' },
      { q: 'Where is my API key kept?', a: 'On your server, in ai.json in the data folder, readable only by its owner. It is never sent back to the browser: the app is told only that a key exists and its last 4 characters. It isn’t in the campaign, the journal, a backup or an export.' },
      { q: 'Can several people share one server?', a: 'No. 1 server is 1 campaign behind 1 password. For a household, run 1 instance for each person on different ports or in separate containers.' },
      { q: 'How do I export or delete everything?', a: 'To export, use Settings, More, Export backup for a single JSON file, or copy the data folder. To delete, stop the server, remove the data folder, then clear the site’s data in each browser.' },
    ],
  },
  {
    title: 'The project',
    items: [
      { q: 'Is it free and open source?', a: 'Yes. Home Front is open source under the MIT licence and free to run. The only possible cost is the AI provider you choose, and the offline judge and local models cost nothing.' },
      { q: 'What do I need to run it?', a: 'Node 20 or newer, or Docker. It runs on a Mac, a Linux machine, a Raspberry Pi with a 64-bit system, Windows through WSL2, or a cloud host that has a disk. The server has no runtime dependencies.' },
      { q: 'Can I host it on a static host?', a: 'Only as a demo. Static hosts such as GitHub Pages, Vercel, Netlify and Cloudflare Pages have no disk and no long-lived process, so they can’t run the server, keep the journal or hold a key. They can serve the browser-only demo, with the offline judge and data kept in that browser.' },
      { q: 'What is it built with?', a: 'The engine, the map renderer and the server are plain JavaScript with no runtime dependencies. The interface is a small React app built with Vite. npm install and npm start build it and start the server.' },
      { q: 'Is it affiliated with any strategy game?', a: 'No. It is an independent open-source project and uses no assets from any commercial game. Unit silhouettes come from Game-icons.net, icons from Lucide and borders from Natural Earth.' },
      { q: 'How can I help?', a: 'Good first contributions are a new country, a new battle type with a clear real-life meaning, a persona preset, better keyword rules for the offline judge, or a guide for a hosting setup that isn’t covered yet. CONTRIBUTING.md in the repository has the layout and conventions.' },
    ],
  },
];

export const FAQ_ALL = FAQ_GROUPS.flatMap(g => g.items);
// The landing page's 5, in the order it has always shown them.
const ORDER = ['Is it a game?', 'Does it need an API key?', 'What does it cost to run?', 'Does it work on a phone?', 'Can I change the map?'];
export const FAQ_LANDING = ORDER.map(q => FAQ_ALL.find(i => i.q === q));
