// The search terms of each page of the site, from one place: the page's <meta name="keywords">, its Open Graph
// article:tag lines and the `keywords` of its structured data (tools/build-site.mjs). Each page gets 8 to 15 terms
// that are true of that page; the shared ones below are used only where the page is about them, so no two pages
// carry the same list. The words also appear, naturally, in each page's title, heading or first paragraph.
export const TERMS = {
  productivity: 'productivity app', habit: 'habit tracker', life: 'life tracker', journal: 'daily journal', journaling: 'journaling app',
  selfHosted: 'self-hosted', local: 'local-first', gamified: 'gamified productivity', qs: 'quantified self', dashboard: 'personal dashboard',
  ai: 'AI journal', voice: 'voice journal', ollama: 'Ollama', llm: 'local LLM', strategy: 'grand strategy', map: 'war map',
  history: 'alternate history', year: '1936',
};
const T = TERMS;

export function keywordsFor(page, data) {
  const c = page.country ? data.countries.find(x => x.id === page.country) : null;
  const list = {
    landing: [T.productivity, T.habit, T.life, T.journal, T.journaling, T.selfHosted, T.local, T.gamified, T.ai, T.voice, T.strategy, T.map, T.year, 'open source'],
    'how-it-works': ['how Home Front works', T.ai, T.journal, T.life, T.gamified, T.qs, T.voice, T.map, 'battle types', 'replay engine'],
    'ai-providers': [T.ai, T.llm, ...data.providers.filter(p => p.needsKey || (p.local && p.base)).map(p => p.name), 'offline judge', 'your own API key', T.selfHosted].slice(0, 15),
    'self-hosting': [T.selfHosted, 'self-hosted habit tracker', T.local, 'Docker', 'Raspberry Pi', 'Mac mini', 'Node.js', 'home server', 'Tailscale', T.journal, 'privacy'],
    faq: ['Home Front FAQ', T.habit, T.journal, T.selfHosted, T.local, T.ai, T.ollama, T.voice, 'offline', 'privacy'],
    compare: ['habit tracker alternative', 'journal app alternative', 'spreadsheet tracker', T.gamified, T.qs, T.life, T.dashboard, T.journal, 'who should not use it'],
    countries: ['1936 map', T.strategy, T.history, T.map, ...data.countries.map(x => x.name), 'empire to restore'].slice(0, 15),
  }[page.name];
  if (list) return list;
  if (c) return [`${c.name} 1936 map`, `${c.name} in ${c.year}`, c.long, c.empire, `restore the ${c.empire}`, T.strategy, T.history, T.map, `${c.name} order of battle`, T.habit, T.life, T.journal];
  return [T.productivity, T.journal];
}
