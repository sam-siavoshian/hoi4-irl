// Iran, 1936. The original scenario; geography lives in ../seeds.mjs.
import * as G from '../seeds.mjs';
export * from '../seeds.mjs';
export const ID = 'iran';
export const HOME = 'IRN';
export const CAPITAL = 'Tehran';
export const HOME_STATES = G.IRAN_STATES;
export const EMPIRE = G.ACHAEMENID;
export const HOME_LABEL = [54.6, 32.7];
export const COUNTRY_LABELS = [['TUR', 'TURKEY', 34.2, 39.0, 15], ['SOV', 'SOVIET UNION', 61.5, 41.6, 19], ['IRQ', 'IRAQ', 43.3, 32.9, 13], ['AFG', 'AFGHANISTAN', 65.6, 33.3, 13],
  ['RAJ', 'BRITISH RAJ', 70.6, 27.4, 15], ['SAU', 'SAUDI ARABIA', 44.5, 24.6, 14], ['EGY', 'EGYPT', 29.2, 27.2, 14], ['FRA', 'SYRIA', 38.4, 35.0, 10], ['GBR', 'OMAN', 57.2, 22.6, 9]];
// where fleet counters sit on the map: our fleets by id, and "enemy:<front id>" for the enemy squadron on a naval front
export const FLEET_AT = { south: [50.6, 28.1], north: [50.8, 38.4], 'enemy:glf': [57.2, 25.5] };
// the naval front needs to know which stretch of the home coast it faces
const GULF_COAST = [[48.9, 30.2], [50.1, 30.1], [50.8, 29.0], [51.5, 27.9], [52.6, 27.4], [54.0, 26.6], [55.5, 26.8], [56.3, 27.1], [57.0, 26.8], [57.3, 25.8], [58.8, 25.5], [60.6, 25.3], [61.6, 25.1]];
export const FRONTS = G.FRONTS.map(f => (f.id === 'glf' ? { ...f, coast: GULF_COAST, coastKm: 60 } : f));
export const META = { name: 'Iran', long: 'Imperial State of Iran', empire: 'Achaemenid Empire', year: 1936, blurb: 'Seven borders from the Caucasus to the Gulf. Restore the empire of Cyrus.' };
