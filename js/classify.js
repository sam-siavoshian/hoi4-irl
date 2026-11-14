// Turns a spoken/written life update into battle orders.
// When the private server has an OpenAI key the report is judged there (the key never reaches the browser);
// otherwise a local keyword classifier is used.
import { ACTIONS, WIN_ACTIONS, LOSS_ACTIONS, statusOf } from './engine.js';

const schemaFor = (map, off = []) => ({
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'War communiqué, 1–3 sentences, in the voice of a general staff bulletin. Mention the real-life events in military language.' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          front: { type: 'string', enum: map.fronts.map(f => f.id).filter(id => !off.includes(id)) },
          outcome: { type: 'string', enum: ['win', 'loss', 'neutral'] },
          severity: { type: 'integer', enum: [1, 2, 3, 4, 5] },
          action: { type: 'string', enum: Object.keys(ACTIONS) },
          headline: { type: 'string', description: 'Short battle-report headline (max ~12 words) that names what really happened.' },
          days_ago: { type: 'integer', enum: [0, 1, 2, 3, 4, 5, 6, 7], description: 'How many days before the report the event happened. 0 unless the user says otherwise (yesterday = 1).' },
        },
        required: ['front', 'outcome', 'severity', 'action', 'headline', 'days_ago'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'items'],
  additionalProperties: false,
});

export function buildSystem(map, labels, notes = {}, off = []) {
  const fronts = map.fronts.filter(f => !off.includes(f.id)).map(f => `- ${f.id}: ${f.name} (vs ${f.enemyName}) = "${labels[f.id] || f.defaultLabel}"${notes[f.id] ? ` — the user describes this area as: ${notes[f.id]}` : ''}`).join('\n');
  return `You are the chief of the general staff for a personal life tracker drawn as a 1936 grand-strategy war map of Iran. Each border front stands for one area of the user's real life. The user tells you, in plain speech, what happened; you convert it into battle results. It is a metaphor for their life, not a game and not real warfare.

Fronts and the life area each one represents:
${fronts}

For every distinct real-life event in the report, emit one item:
- front: the front whose life area the event belongs to. If an event fits no area, use the closest one; general mood, habits, sleep, money and discipline go to the front whose label is closest to personal life.
- outcome: "win" if it went well for the user, "loss" if it went badly, "neutral" only if it is genuinely neither.
- severity 1–5: 1 = minor (small task done, mild annoyance); 2 = ordinary good/bad day; 3 = significant (a good grade, a real argument, a missed week of gym); 4 = major (big milestone, serious fight, failed an exam); 5 = decisive, rare (got into the dream school, funding closed, breakup, a death). Do not inflate: most daily events are 1–3.
- action: the kind of battle that best matches what happened.
  Wins: offensive (ordinary progress), breakthrough (a sudden big leap forward), encirclement (decisively resolved a long-running problem), air_superiority (gained the upper hand / confidence / momentum), cas_strike (got decisive help or support from someone), naval_victory (only for the Persian Gulf, Caucasus or Turkestan fronts), infrastructure (built a habit, system, routine, long-term foundation), fortify (held the line, set boundaries, avoided a relapse, damage control), reinforce (rest, recovery, new resources, new people joining).
  Losses: enemy_offensive (ordinary setback), enemy_breakthrough (things collapsed quickly, "tank attack"), encircled (trapped, overwhelmed, no way out), enemy_cas (blindsided, criticised or attacked by someone), strategic_bombing (damage to long-term foundations: habits, health, finances), port_strike (lost an opportunity, a channel or a connection closed), supply_hub_bombed (burnout, exhaustion, sleep, energy or money ran out), naval_defeat (same fronts as naval_victory), attrition (slow grind, procrastination, neglect).
  Neutral: skirmish.
- days_ago: 0 for today; if the user places an event in the past ("yesterday", "on Monday", "two days ago"), the number of days back, at most 7.
- headline: a short dispatch that names the real event in military language, e.g. "Chemistry midterm failed — enemy armour breaks the line at Zabol".

Then write "summary": a 1–3 sentence communiqué covering the whole report in the same voice, honest about how things are going. If the user explicitly uses war language ("heavy tank attack", "they bombed our supply hub", "we broke through"), honour it when choosing action and severity. If the report contains nothing to classify, return an empty items list and say so in the summary.`;
}

export function buildUser(map, st, labels, text) {
  const sit = map.fronts.map(f => { const fr = st.fronts[f.id]; return `${f.id} (${labels[f.id] || f.defaultLabel}): ${statusOf(fr.pos).text}, position ${Math.round(fr.pos)} (−100 = all objectives taken, 0 = border, +100 = Tehran falls)`; }).join('\n');
  const recent = st.log.slice(-8).map(l => `${new Date(l.ts).toISOString().slice(0, 10)}: ${l.items.map(i => `[${i.front} ${i.outcome} ${i.severity}] ${i.headline}`).join('; ') || l.summary || ''}`).join('\n');
  return `Current situation:\n${sit}\n\nRecent dispatches (for continuity):\n${recent || '(none yet)'}\n\nToday's report from the user:\n"""\n${text}\n"""`;
}

function sanitize(map, data, off = []) {
  const ids = new Set(map.fronts.map(f => f.id).filter(id => !off.includes(id)));
  const items = [];
  for (const i of data.items || []) {
    if (!ids.has(i.front)) continue;
    const outcome = ['win', 'loss', 'neutral'].includes(i.outcome) ? i.outcome : 'neutral';
    let action = i.action;
    if (!ACTIONS[action] || ACTIONS[action].side !== outcome) action = outcome === 'win' ? 'offensive' : outcome === 'loss' ? 'enemy_offensive' : 'skirmish';
    items.push({ front: i.front, outcome, severity: Math.max(1, Math.min(5, Math.round(Number(i.severity) || 2))), action, headline: String(i.headline || ACTIONS[action].label).slice(0, 160), days_ago: Math.max(0, Math.min(7, Math.round(Number(i.days_ago) || 0))) });
  }
  return { summary: String(data.summary || '').slice(0, 600), items };
}

// One structured-output call through the private server (POST /api/llm → OpenAI Responses API).
async function callJudge({ name, system, user, schema, fetchImpl = fetch }) {
  const res = await fetchImpl('api/llm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, system, user, schema }) });
  let data = null; try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error(res.status === 401 ? 'Signed out — reload and log in again.' : data?.error || `Server error ${res.status}`);
  return data.result;
}
export async function classifyLLM({ map, st, labels, notes = {}, off = [], text, fetchImpl = fetch }) {
  const result = await callJudge({ name: 'battle_report', system: buildSystem(map, labels, notes, off), user: buildUser(map, st, labels, text), schema: schemaFor(map, off), fetchImpl });
  return { ...sanitize(map, result, off), source: 'llm' };
}

// ---------- offline keyword classifier ----------
const AREA_WORDS = {
  school: ['school', 'class', 'classes', 'exam', 'exams', 'test', 'quiz', 'midterm', 'final', 'finals', 'homework', 'assignment', 'grade', 'grades', 'teacher', 'professor', 'lecture', 'study', 'studying', 'studied', 'essay', 'gpa', 'college', 'university', 'course', 'sat', 'ap', 'paper', 'lab', 'tutor'],
  family: ['family', 'mom', 'mother', 'dad', 'father', 'parents', 'parent', 'brother', 'sister', 'sibling', 'grandma', 'grandpa', 'grandmother', 'grandfather', 'uncle', 'aunt', 'cousin', 'home'],
  girlfriend: ['girlfriend', 'gf', 'boyfriend', 'bf', 'partner', 'relationship', 'date', 'dating', 'her', 'she', 'babe', 'anniversary', 'breakup', 'broke up', 'wife', 'husband', 'love'],
  startup: ['startup', 'company', 'product', 'launch', 'launched', 'shipped', 'ship', 'users', 'customer', 'customers', 'revenue', 'investor', 'investors', 'funding', 'pitch', 'cofounder', 'co-founder', 'code', 'coding', 'bug', 'deploy', 'feature', 'app', 'client', 'mrr', 'demo', 'work', 'job', 'business', 'sales', 'project'],
  gym: ['gym', 'workout', 'worked out', 'lift', 'lifting', 'lifted', 'run', 'ran', 'running', 'pr', 'bench', 'squat', 'deadlift', 'cardio', 'diet', 'weight', 'protein', 'sick', 'ill', 'injury', 'injured', 'health', 'sleep', 'slept', 'training', 'exercise', 'sport', 'practice', 'doctor'],
  friends: ['friend', 'friends', 'buddy', 'buddies', 'party', 'hang out', 'hung out', 'hangout', 'social', 'bro', 'guys', 'team', 'roommate', 'club'],
  personal: ['personal', 'mood', 'habit', 'habits', 'routine', 'money', 'broke', 'saved', 'reading', 'read', 'meditat', 'journal', 'discipline', 'procrastinat', 'phone', 'scrolling', 'anxious', 'anxiety', 'depressed', 'happy', 'sad', 'lonely', 'motivated', 'unmotivated', 'tired', 'exhausted', 'burnout', 'burned out', 'life', 'hobby', 'mental'],
};
const LABEL_AREA = [[/school|study|class|uni|college|academ|learn/i, 'school'], [/famil|parent|home/i, 'family'], [/girl|boy|partner|relationship|love|romanc|dating|wife|husband/i, 'girlfriend'],
  [/startup|work|business|career|job|company|project/i, 'startup'], [/gym|health|fitness|sport|body|train/i, 'gym'], [/friend|social/i, 'friends'], [/personal|life|mind|self|money|financ/i, 'personal']];
const POS = ['good', 'great', 'amazing', 'awesome', 'excellent', 'aced', 'passed', 'won', 'win', 'nailed', 'crushed', 'progress', 'finished', 'completed', 'done', 'better', 'best', 'happy', 'proud', 'fixed', 'solved', 'improved', 'productive', 'success', 'successful', 'shipped', 'launched', 'closed', 'signed', 'hit', 'pr', 'made up', 'reconciled', 'fun', 'love', 'loved', 'well', 'breakthrough', 'broke through', 'advancing', 'captured', 'victory', 'got an a', 'promoted', 'accepted', 'raised', 'grew', 'healthy', 'strong', 'on track', 'caught up', 'apologized', 'apologised', 'nice', 'solid', 'smooth', 'motivated', 'consistent'];
const NEG = ['bad', 'horrible', 'terrible', 'awful', 'failed', 'failing', 'fail', 'lost', 'lose', 'fight', 'fought', 'argument', 'argued', 'yelled', 'screamed', 'missed', 'skipped', 'late', 'behind', 'worse', 'worst', 'sad', 'angry', 'mad', 'upset', 'stressed', 'stress', 'broke up', 'breakup', 'dumped', 'rejected', 'bug', 'crash', 'crashed', 'churned', 'sick', 'injured', 'tired', 'exhausted', 'burnout', 'burned out', 'procrastinated', 'wasted', 'ignored', 'ghosted', 'disappointed', 'struggling', 'struggle', 'overwhelmed', 'attack', 'attacked', 'bombed', 'retreat', 'retreating', 'collapsed', 'collapse', 'disaster', 'mess', 'rough', 'hard time', 'not good', "didn't", 'couldnt', "couldn't", 'cant', "can't", 'forgot', 'cried', 'lonely', 'anxious', 'depressed', 'unmotivated', 'lazy', 'cheated', 'lied', 'grounded', 'in trouble', 'cancelled', 'canceled', 'down'];
const STRONG = ['very', 'really', 'extremely', 'huge', 'massive', 'heavy', 'horrible', 'terrible', 'awful', 'amazing', 'incredible', 'worst', 'best', 'completely', 'totally', 'major', 'serious', 'big', 'disaster', 'devastating', 'crushed', 'so'];
const WEAK = ['little', 'slightly', 'kinda', 'kind of', 'bit', 'small', 'minor', 'somewhat', 'okay', 'ok', 'fine'];
const has = (s, w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(s);

export function classifyLocal({ map, labels, text, off = [] }) {
  const areaFront = {};
  const fronts = map.fronts.filter(f => !off.includes(f.id));
  for (const f of fronts) { const lab = labels[f.id] || f.defaultLabel; const m = LABEL_AREA.find(([re]) => re.test(lab)); if (m && !areaFront[m[1]]) areaFront[m[1]] = f.id; }
  const labelWords = fronts.map(f => [f.id, (labels[f.id] || f.defaultLabel).toLowerCase().split(/[^a-z]+/).filter(w => w.length > 2)]);
  const fallback = areaFront.personal || fronts.at(-1).id;
  const clauses = text.split(/[.!?;\n]+|,\s*(?:and|but)\s+|\s+(?:and then|but|also)\s+|,\s+(?=i\s|my\s|we\s|our\s)/i).map(s => s.trim()).filter(s => s.length > 2);
  const items = []; let lastFront = null;
  for (const c of clauses) {
    const lc = c.toLowerCase();
    let front = null, best = 0;
    for (const [fid, words] of labelWords) { const n = words.filter(w => has(lc, w)).length * 2; if (n > best) { best = n; front = fid; } }
    for (const [area, words] of Object.entries(AREA_WORDS)) { if (!areaFront[area]) continue; const n = words.filter(w => has(lc, w)).length; if (n > best) { best = n; front = areaFront[area]; } }
    let p = POS.filter(w => has(lc, w)).length, n = NEG.filter(w => has(lc, w)).length;
    if (/\b(not|never|no|didn'?t|wasn'?t|isn'?t)\s+(\w+\s+)?(good|great|well|happy|fun|productive|better)/i.test(lc)) { n += 2; p = Math.max(0, p - 1); }
    if (/\b(not|no longer|isn'?t|wasn'?t)\s+(\w+\s+)?(bad|sick|behind|stressed|failing)/i.test(lc)) { p += 2; n = Math.max(0, n - 1); }
    if (!p && !n) continue;
    if (!front) front = lastFront || fallback;
    lastFront = front;
    const outcome = p > n ? 'win' : n > p ? 'loss' : 'neutral';
    let sev = 2 + (STRONG.some(w => has(lc, w)) ? 1 : 0) - (WEAK.some(w => has(lc, w)) ? 1 : 0) + (Math.abs(p - n) >= 3 ? 1 : 0);
    if (/broke up|breakup|dumped|expelled|fired|died|death|funding closed|accepted into|got into/i.test(lc)) sev = 5;
    sev = Math.max(1, Math.min(5, sev));
    let action = outcome === 'win' ? 'offensive' : outcome === 'loss' ? 'enemy_offensive' : 'skirmish';
    if (outcome === 'win') {
      if (/break ?through|broke through|aced|crushed|nailed|huge|massive/i.test(lc)) action = 'breakthrough';
      else if (/habit|routine|system|consistent|built|foundation|saved/i.test(lc)) action = 'infrastructure';
      else if (/rest|recover|slept well|vacation|break/i.test(lc)) action = 'reinforce';
      else if (/held|boundar|avoided|resisted|stayed/i.test(lc)) action = 'fortify';
      else if (/made up|reconcil|resolved|fixed|solved/i.test(lc)) action = 'encirclement';
    } else if (outcome === 'loss') {
      if (/tank|collapse|disaster|failed|failing|broke up|dumped/i.test(lc)) action = 'enemy_breakthrough';
      else if (/burn ?out|exhausted|tired|no energy|sleep|broke\b|supply/i.test(lc)) action = 'supply_hub_bombed';
      else if (/air|close ?air|cas\b|yelled|screamed|criticis|criticiz|blindsided|fight|fought|argu/i.test(lc)) action = 'enemy_cas';
      else if (/bomb|habit|health|sick|injur/i.test(lc)) action = 'strategic_bombing';
      else if (/port|missed|opportunit|rejected|cancel/i.test(lc)) action = 'port_strike';
      else if (/overwhelmed|trapped|stuck|encircl/i.test(lc)) action = 'encircled';
      else if (/procrastinat|wasted|lazy|skipped|neglect|behind/i.test(lc)) action = 'attrition';
    }
    const f = map.fronts.find(x => x.id === front);
    if (!(f.naval || f.id === 'cau' || f.id === 'tks') && action === 'port_strike') action = 'supply_hub_bombed';
    const head = c.length > 90 ? c.slice(0, 87) + '…' : c;
    const days_ago = /day before yesterday|two days ago|2 days ago/i.test(lc) ? 2 : /three days ago|3 days ago/i.test(lc) ? 3 : /yesterday/i.test(lc) ? 1 : 0;
    const dup = items.find(i => i.front === front && i.outcome === outcome && i.days_ago === days_ago);
    if (dup) { dup.severity = Math.min(5, Math.max(dup.severity, sev) + (dup.severity === sev ? 1 : 0)); if (ACTIONS[action].adv > ACTIONS[dup.action].adv) dup.action = action; dup.headline = `${dup.headline}; ${head}`.slice(0, 160); continue; }
    items.push({ front, outcome, severity: sev, action, headline: head.charAt(0).toUpperCase() + head.slice(1), days_ago });
  }
  const w = items.filter(i => i.outcome === 'win').length, l = items.filter(i => i.outcome === 'loss').length;
  const names = ids => [...new Set(ids)].map(id => map.fronts.find(f => f.id === id).name).join(', ');
  let summary = 'General Staff: nothing of note to report.';
  if (items.length) {
    const parts = [];
    if (l) parts.push(`the enemy pressed on the ${names(items.filter(i => i.outcome === 'loss').map(i => i.front))}`);
    if (w) parts.push(`our forces gained ground on the ${names(items.filter(i => i.outcome === 'win').map(i => i.front))}`);
    summary = `General Staff communiqué: ${parts.join(', while ')}.`;
  }
  return { summary, items, source: 'local' };
}

export async function classify(opts) {
  if (opts.remote) {
    try { return await classifyLLM(opts); }
    catch (e) { const r = classifyLocal(opts); r.warning = `Judge unavailable (${e.message}). Used the offline classifier instead.`; return r; }
  }
  return classifyLocal(opts);
}
export { WIN_ACTIONS, LOSS_ACTIONS };

// ---------- staff assessment ----------
export async function assessLLM({ map, st, labels, off = [], fetchImpl = fetch }) {
  const active = map.fronts.filter(f => !off.includes(f.id));
  const sit = active.map(f => { const fr = st.fronts[f.id]; return `${f.id} — ${labels[f.id] || f.defaultLabel} (${f.name}): ${statusOf(fr.pos).text}, position ${Math.round(fr.pos)}, streak ${fr.streak}, record ${fr.wins}W/${fr.losses}L`; }).join('\n');
  const recent = st.log.filter(l => !l.kind).slice(-20).map(l => `${new Date(l.ts).toISOString().slice(0, 10)}: ${l.items.map(i => `[${labels[i.front] || i.front} ${i.outcome} ${i.severity}] ${i.headline}`).join('; ')}`).join('\n');
  const d = await callJudge({ name: 'staff_assessment', system: `You are the chief of staff in a personal life tracker drawn as a 1936 war map of Iran. Each front is an area of the user's real life. Write a short, honest staff assessment of how their life is going, in the dry voice of a staff officer, but always about the real events behind the metaphor. Be specific, name patterns you see in the dispatches, do not flatter, do not moralise. Then give up to three concrete orders for the coming week, each tied to one front, each something the user can actually do.`, user: `Fronts (position −100 = all objectives taken, 0 = border, +100 = Tehran falls):\n${sit}\n\nDispatches, oldest first:\n${recent || '(none)'}`, schema: { type: 'object', properties: { assessment: { type: 'string', description: '3–6 sentences.' }, orders: { type: 'array', items: { type: 'object', properties: { front: { type: 'string', enum: active.map(f => f.id) }, order: { type: 'string' } }, required: ['front', 'order'], additionalProperties: false } } }, required: ['assessment', 'orders'], additionalProperties: false }, fetchImpl });
  return { assessment: String(d.assessment || ''), orders: (d.orders || []).filter(o => active.some(f => f.id === o.front)).slice(0, 3), source: 'llm' };
}
export function assessLocal({ map, st, labels, off = [] }) {
  const active = map.fronts.filter(f => !off.includes(f.id)); const L = f => labels[f.id] || f.defaultLabel;
  const worst = active.slice().sort((a, b) => st.fronts[b.id].pos - st.fronts[a.id].pos), best = worst.slice().reverse();
  const quiet = active.filter(f => !st.fronts[f.id].lastT || st.now - st.fronts[f.id].lastT > 7 * 86400000);
  const parts = [];
  const w = worst[0], b = best[0];
  if (!st.log.length) return { assessment: 'No dispatches yet. The borders are quiet and the staff has nothing to assess. Report how your day went and the picture will form.', orders: [], source: 'local' };
  if (st.fronts[w.id].pos > 4) parts.push(`${L(w)} is the weakest sector: ${statusOf(st.fronts[w.id].pos).text.toLowerCase()}${st.fronts[w.id].streak <= -2 ? `, ${-st.fronts[w.id].streak} defeats running` : ''}.`);
  else parts.push('No front is currently behind the border.');
  if (st.fronts[b.id].pos < -4) parts.push(`${L(b)} is carrying the war: ${statusOf(st.fronts[b.id].pos).text.toLowerCase()}.`);
  if (quiet.length) parts.push(`Nothing has been heard from ${quiet.map(L).join(', ')} for over a week.`);
  parts.push(`Overall stability stands at ${st.nation.stability}%.`);
  const orders = [];
  if (st.fronts[w.id].pos > 4) orders.push({ front: w.id, order: `Stabilise ${L(w)}: one small, certain win before anything ambitious.` });
  if (quiet[0]) orders.push({ front: quiet[0].id, order: `Send a patrol to ${L(quiet[0])} — report something, good or bad.` });
  if (st.fronts[b.id].pos < -4) orders.push({ front: b.id, order: `Keep the momentum on ${L(b)}; build something lasting there while it is going well.` });
  return { assessment: parts.join(' '), orders: orders.slice(0, 3), source: 'local' };
}
export async function assess(opts) {
  if (opts.remote) { try { return await assessLLM(opts); } catch (e) { return { ...assessLocal(opts), warning: `Judge unavailable (${e.message}).` }; } }
  return assessLocal(opts);
}
