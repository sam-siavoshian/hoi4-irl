// The hero's live map: the app's own canvas renderer (js/map.js) and engine (js/engine.js) replaying the story in
// story.js on whichever country is picked. Loaded on its own, after the page has painted (Landing.jsx imports it
// lazily), and a country's map (about 1 MB) is fetched only when that country is shown.
import { MapView } from '../js/map.js';
import { simulate, ACTIONS } from '../js/engine.js';
import { STEPS, reportsFor, verdictOf } from './story.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const maps = new Map();
function loadMap(id) {
  if (!maps.has(id)) maps.set(id, fetch(`./demo/data/maps/${id}.json`).then(r => { if (!r.ok) throw new Error(`map ${r.status}`); return r.json(); }).catch(e => { maps.delete(id); throw e; }));
  return maps.get(id);
}
const still = () => document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;

// `frame` holds the two canvases. `onCaption({ said, typing, verdict })` gets what the strip under the map shows;
// `onLoop()` is told each time the story has played to its end (the page may then show() another country).
// Returns { show(id), stop() }: show() resolves once that country's map is on screen.
export function createStage({ frame, base, over, onCaption, onLoop }) {
  let view = null, turn = 0, visible = true, stopped = false;
  const home = (animate = true) => { view.frameWhole(true); view.home(animate); };
  // Towards a front, but not as close as the app goes (view.flyToFront): the country stays in the picture, so a
  // visitor sees which border moved.
  const towards = (map, st, fid, fit) => {
    const line = st.lines[fid]; const ids = line ? [...line.ours, ...line.theirs] : []; if (!ids.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of ids) { const c = map.provinces[id].c; x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); }
    const [hx0, hy0, hx1, hy1] = view.homeBox; // lean a third of the way back to the middle of the country
    view.flyTo((x0 + x1) / 2 * 0.66 + (hx0 + hx1) / 2 * 0.34, (y0 + y1) / 2 * 0.66 + (hy0 + hy1) / 2 * 0.34, fit * 1.45);
  };
  const resizes = new ResizeObserver(() => { if (view) { view.resize(); home(false); } });
  resizes.observe(frame);
  // no drawing and no story while the map is off screen or the tab is hidden
  const sees = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.15 });
  sees.observe(frame);
  const idle = async mine => { while (mine === turn && (!visible || document.hidden)) await sleep(400); };

  async function play(map, mine) {
    const labels = Object.fromEntries(map.fronts.map(f => [f.id, f.defaultLabel]));
    const reports = reportsFor(map, Date.now());
    const stateAt = at => simulate(map, reports.slice(0, at + 1), reports[at].ts + 2 * 3600000);
    const before = stateAt(STEPS[0] - 1);
    if (still()) { // one still frame: the story's last entry, no loop
      const at = STEPS[STEPS.length - 1]; const st = stateAt(at);
      view.setState(st, labels); home(false); onCaption({ said: reports[at].text, typing: false, verdict: verdictOf(map, st, ACTIONS) });
      return;
    }
    view.setState(before, labels); home(false);
    const fit = view.view.s; // the scale at which the whole country fits
    await sleep(700);
    while (mine === turn) {
      for (const at of STEPS) {
        await idle(mine); if (mine !== turn) return;
        const text = reports[at].text;
        home(); onCaption({ said: '', typing: true, verdict: null });
        await sleep(500);
        for (let k = 1; k <= text.length; k++) {
          if (mine !== turn) return;
          onCaption({ said: text.slice(0, k), typing: true, verdict: null });
          await sleep(26 + (text[k - 1] === '.' ? 160 : 0));
        }
        await sleep(450); if (mine !== turn) return;
        const st = stateAt(at); const verdict = verdictOf(map, st, ACTIONS);
        view.setState(st, labels); towards(map, st, st.log[st.log.length - 1].items[0].front, fit);
        onCaption({ said: text, typing: false, verdict });
        await sleep(4200);
      }
      await idle(mine); if (mine !== turn) return;
      home(); await sleep(1600); if (mine !== turn) return;
      onLoop?.(); await sleep(0); if (mine !== turn) return; // the page moved on to another country
      view.setState(before, labels);
    }
  }

  return {
    async show(id) {
      const mine = ++turn;
      const map = await loadMap(id);
      if (mine !== turn || stopped) return false;
      if (!view) {
        view = new MapView(base, over, map);
        const overlay = view.drawOverlay.bind(view);
        view.drawOverlay = now => { if (visible) overlay(now); };
      } else { view.setMap(map); view.setMode(view.mode); }
      view.frameWhole(true); view.resize();
      play(map, mine).catch(() => { /* the map stays as it is */ });
      return true;
    },
    stop() { stopped = true; turn++; resizes.disconnect(); sees.disconnect(); },
  };
}
