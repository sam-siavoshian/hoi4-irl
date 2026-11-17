// The scripted fortnight the hero map replays, and the entry "How it works" follows through its three steps.
// Fronts are named by slot (0 to 6, the order a country lists them), so the same story plays on any of the eight maps:
// slot 0 is School, 1 Family, 2 Partner, 3 Work, 4 Health, 5 Friends, 6 Self under the default names. Where each entry
// is fought (the battle, the towns taken and lost) is the engine's, on that country's own map.
// [days ago, what was said, [slot, outcome, size 1 to 5, battle type, headline, reason][], shown as a step on the hero]
const DAY = 86400000;
export const STORY = [
  [19, 'Signed our first pilot customer.', [[3, 'win', 3, 'offensive', 'First pilot customer signed', 'a milestone']]],
  [17, 'Gym 3 days in a row, and sleep is on a schedule.', [[4, 'win', 3, 'infrastructure', 'Three straight gym days', 'a routine taking hold'], [6, 'win', 2, 'fortify', 'Sleep schedule holding', 'held the line']]],
  [15, 'Great dinner with the family, long talk with dad.', [[1, 'win', 3, 'offensive', 'Long talk with dad', 'a good day']]],
  [13, 'Shipped the new onboarding flow.', [[3, 'win', 2, 'offensive', 'Onboarding flow shipped', 'steady progress']]],
  [12, 'Fight with my girlfriend. Then slept 4 hours.', [[2, 'loss', 4, 'enemy_cas', 'Fight with girlfriend', 'blindsided']]],
  [11, 'Made up with her, went for a long walk. Friends came over.', [[2, 'win', 3, 'encirclement', 'Made up after the fight', 'a problem resolved'], [5, 'win', 2, 'offensive', 'Good night with friends', 'a good day']]],
  [10, '2 investors replied and 1 wants a second call.', [[3, 'win', 2, 'offensive', 'Investors want a second call', 'a step forward']]],
  [8, 'Failed the calculus midterm. I didn’t study.', [[0, 'loss', 5, 'enemy_breakthrough', 'Calculus midterm failed', 'a major failure']], true],
  [6, 'Closed our second pilot customer.', [[3, 'win', 4, 'breakthrough', 'Second pilot closed', 'a major milestone']], true],
  [5, 'Slept 4 hours a night all week.', [[6, 'loss', 3, 'supply_hub_bombed', 'Four hours of sleep', 'ran out of sleep']], true],
  [3, 'Gym 5 days running. New deadlift record.', [[4, 'win', 4, 'offensive', 'Deadlift personal record', 'clear progress']], true],
  [2, 'I finally understood recursion.', [[0, 'win', 3, 'intelligence', 'Recursion finally clicked', 'an insight']]],
  [0.3, 'Aced the calculus retake.', [[0, 'win', 5, 'counterattack', 'Aced the retake', 'bounced back']], true],
];
// The steps the hero shows, as indexes into STORY, and the one "How it works" explains (the last).
export const STEPS = STORY.map((entry, at) => (entry[3] ? at : -1)).filter(at => at >= 0);

// The story as the engine's reports, on a map's own front ids.
export function reportsFor(map, now) {
  const ids = map.fronts.map(f => f.id);
  return STORY.map(([days, text, items], at) => ({
    id: 'story' + at, ts: Math.round(now - days * DAY), text, summary: '', source: 'demo',
    items: items.map(([slot, outcome, severity, action, headline, reason]) => ({ front: ids[slot % ids.length], outcome, severity, action, headline, reason })),
  }));
}

// What one entry did, in the engine's own words: the part of life, the battle it became and what moved.
export function verdictOf(map, st, ACTIONS) {
  const entry = st.log[st.log.length - 1]; const item = entry.items[0]; const front = map.fronts.find(f => f.id === item.front);
  const toned = entry.fx.filter(x => x.tone === 'good' || x.tone === 'bad');
  return {
    area: front.defaultLabel, front: front.name, outcome: item.outcome, severity: item.severity, reason: item.reason,
    type: ACTIONS[item.action].label, battle: item.battle || '',
    lead: (entry.fx.find(x => !x.tone) || {}).text || '',
    moved: (toned.length ? toned : entry.fx.filter(x => !x.tone)).slice(0, 2).map(x => x.text),
  };
}
