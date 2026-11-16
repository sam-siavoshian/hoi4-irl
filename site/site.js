// ARTESH landing page. No dependencies; the hero imports the app's own renderer and engine from ./demo/.
const DAY = 86400000;
const KEY = 'artesh.v1';
const FRONT_COLORS = { afg: '#4aa3c7', cau: '#d0604e', tks: '#dc8f3f', irq: '#c2aa3e', raj: '#cf5d84', tur: '#a195dc', glf: '#3fc0ab' };
const $ = (s, el = document) => el.querySelector(s);

// One campaign, used twice: the hero replays it step by step, and the demo opens with it already fought.
// [days ago, what was said, the staff's line, [front, outcome, severity, action, headline, reason][], shown as a hero step]
const CAMPAIGN = [
  [19, 'Signed our first pilot customer.', 'Our columns cross the Zagros passes and take ground beyond the frontier.', [['irq', 'win', 4, 'breakthrough', 'First pilot customer signed', 'a major milestone']]],
  [17, 'Gym three days in a row, and sleep is finally on a schedule.', 'Engineers lay the foundations for a long campaign.', [['raj', 'win', 3, 'infrastructure', 'Three straight gym days', 'a routine taking hold'], ['glf', 'win', 2, 'fortify', 'Sleep schedule holding', 'held the line']]],
  [15, 'Great dinner with the family, long talk with dad.', 'The Aras is crossed.', [['cau', 'win', 3, 'offensive', 'Long talk with dad', 'a good day']]],
  [13, 'Shipped the new onboarding flow.', 'A second thrust in the west.', [['irq', 'win', 3, 'offensive', 'Onboarding flow shipped', 'steady progress']]],
  [12, 'Fight with my girlfriend. Then slept four hours.', 'Enemy aircraft catch our columns in the open.', [['tks', 'loss', 4, 'enemy_cas', 'Fight with girlfriend', 'blindsided']]],
  [11, 'Made up with her, went for a long walk. Friends came over.', 'The line is restored.', [['tks', 'win', 3, 'encirclement', 'Made up after the fight', 'a problem resolved'], ['tur', 'win', 2, 'offensive', 'Good night with friends', 'a good day']]],
  [10, 'Two investors replied and one wants a second call.', 'Armour pours through the gap.', [['irq', 'win', 4, 'breakthrough', 'Investors want a second call', 'a big leap']]],
  [8, 'Failed the calculus midterm. I didn’t study.', 'Enemy armour breaks the line in the east.', [['afg', 'loss', 5, 'enemy_breakthrough', 'Calculus midterm failed', 'a major failure']], 1],
  [6, 'Closed our second pilot customer.', 'The enemy line in Mesopotamia gives way.', [['irq', 'win', 5, 'breakthrough', 'Second pilot closed', 'a major milestone']], 1],
  [5, 'Slept four hours a night all week.', 'Bombers find the supply dumps.', [['glf', 'loss', 3, 'supply_hub_bombed', 'Four hours of sleep', 'ran out of sleep']], 1],
  [3, 'Gym five days running. New deadlift record.', 'The southern columns push on.', [['raj', 'win', 4, 'offensive', 'Deadlift personal record', 'clear progress']], 1],
  [2, 'I finally understood recursion.', 'Signals intelligence reads the enemy plan.', [['afg', 'win', 3, 'intelligence', 'Recursion finally clicked', 'an insight']]],
  [0.3, 'Aced the calculus retake.', 'A counter-stroke in the east.', [['afg', 'win', 5, 'counterattack', 'Aced the retake', 'bounced back']], 1],
];
const reportsAt = now => CAMPAIGN.map(([d, text, summary, items], i) => ({
  id: 'demo' + i, ts: Math.round(now - d * DAY), text, summary, source: 'demo',
  items: items.map(([front, outcome, severity, action, headline, reason]) => ({ front, outcome, severity, action, headline, reason })),
}));

// ---- the demo link: open with a campaign in progress (same origin, so the app finds it in localStorage) ----
for (const a of document.querySelectorAll('a[data-demo]')) a.addEventListener('click', () => {
  try { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify({ v: 2, reports: reportsAt(Date.now()), labels: {}, notes: {}, off: [], ops: [], settings: {}, onboarded: true })); } catch { /* private mode: the demo starts empty */ }
});

// ---- copy the install commands ----
for (const b of document.querySelectorAll('[data-copy]')) b.addEventListener('click', async () => {
  const text = [...document.querySelectorAll(b.dataset.copy + ' [data-cmd]')].map(x => x.textContent).join('\n');
  try { await navigator.clipboard.writeText(text); b.textContent = 'Copied'; } catch { b.textContent = 'Select and copy'; }
  setTimeout(() => { b.textContent = 'Copy'; }, 1800);
});

// ---- hero: the real map, replaying a scripted week ----
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function hero() {
  const frame = $('#hero-map'); if (!frame) return;
  const [{ MapView }, { simulate, ACTIONS }, map] = await Promise.all([
    import('./demo/js/map.js'), import('./demo/js/engine.js'), fetch('./demo/data/map.json').then(r => { if (!r.ok) throw new Error('map ' + r.status); return r.json(); }),
  ]);
  const labels = Object.fromEntries(map.fronts.map(f => [f.id, f.defaultLabel]));
  const reports = reportsAt(Date.now());
  const steps = CAMPAIGN.map((c, i) => (c[4] ? i : -1)).filter(i => i >= 0);
  const stateAt = i => simulate(map, reports.slice(0, i + 1), reports[i].ts + 2 * 3600000);

  const view = new MapView($('#hero-base'), $('#hero-over'), map);
  const said = $('#said'), verdict = $('#verdict'), pips = $('#pips');
  pips.innerHTML = steps.map(() => '<i></i>').join('');
  // a slightly tighter framing than the app's own home view, so every front fits the hero
  const home = (animate = true) => { const [cx, cy] = view.proj(53.9, 33.4); view.flyTo(cx, cy, Math.max(view.minS, Math.min(view.w / 1560, view.h / 1180)), animate); };
  new ResizeObserver(() => { view.resize(); home(false); }).observe(frame);

  // do no work while the hero is off screen
  let visible = true; const overlay = view.drawOverlay.bind(view);
  view.drawOverlay = now => { if (visible) overlay(now); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.15 }).observe(frame);
  const whenVisible = async () => { while (!visible || document.hidden) await sleep(400); };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function showVerdict(st) {
    const l = st.log[st.log.length - 1], it = l.items[0], A = ACTIONS[it.action];
    const toned = l.fx.filter(x => x.tone).slice(0, 3), plain = l.fx.filter(x => !x.tone).slice(0, Math.max(0, 2 - toned.length));
    const chips = [...toned, ...plain].map(x => `<span class="chip ${x.tone || ''}">${esc(x.text)}</span>`).join('');
    verdict.innerHTML = `<p class="v-line"><i class="dot" style="background:${FRONT_COLORS[it.front]}"></i><b style="color:${FRONT_COLORS[it.front]}">${esc(labels[it.front])}</b><span class="${it.outcome}">${esc(A.label)}</span>${it.battle ? `<span class="dim">${esc(it.battle)}</span>` : ''}</p><p class="v-sum">${esc(l.summary)}</p><div class="chips">${chips}</div>`;
    verdict.classList.remove('wait');
  }
  const mark = n => [...pips.children].forEach((p, k) => p.classList.toggle('on', k === n));

  view.setState(stateAt(steps[0] - 1), labels);
  frame.classList.add('live');

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { // one still frame, no loop
    const i = steps[steps.length - 1], st = stateAt(i); view.setState(st, labels); said.textContent = reports[i].text; showVerdict(st); mark(steps.length - 1); return;
  }
  await sleep(900);
  for (;;) {
    for (let n = 0; n < steps.length; n++) {
      await whenVisible();
      const i = steps[n], text = reports[i].text;
      mark(n); home(); verdict.classList.add('wait'); said.textContent = ''; said.classList.add('typing');
      await sleep(500);
      for (let k = 1; k <= text.length; k++) { said.textContent = text.slice(0, k); await sleep(26 + (text[k - 1] === '.' ? 160 : 0)); }
      said.classList.remove('typing');
      await sleep(450);
      const st = stateAt(i); view.setState(st, labels); view.flyToFront(st.log[st.log.length - 1].items[0].front); showVerdict(st);
      await sleep(4200);
    }
    await whenVisible();
    home(); await sleep(1600);
    view.setState(stateAt(steps[0] - 1), labels);
  }
}
hero().catch(() => { /* the still image stays */ });
