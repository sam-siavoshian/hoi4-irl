// Testland: a small, deliberately awkward scenario for the tests. Not shipped, not in tools/scenarios/.
// It is written to docs/SCENARIOS.md like any other country, but picks everything the first scenario does not have:
//   - another home tag (URU) and seven front ids no other scenario uses;
//   - the southern hemisphere, where the seasons fall six months later;
//   - two naval fronts served by ONE fleet, and five land fronts made by cutting two neighbours into boxes;
//   - a capital that is not the largest city and does not sit on the coast;
//   - a META with most optional fields left out (no commanders, officers, guard, wings, ship names, enemy operations,
//     nicknames, state figures, enemy adjectives, medal names, masthead, calendar, motto or capital texts), a rank ladder of
//     six ranks instead of twelve, honours and an order of battle for only some fronts.
// The geography is Uruguay and its neighbours, so the borders are real.
export const ID = 'testland';
export const EXTENT = { lon0: -64, lon1: -46, lat0: -40, lat1: -23 };
export const HOME = 'URU';
export const CAPITAL = 'Durazno';
export const COUNTRIES = {
  URU: { name: 'Testland', long: 'Oriental Republic of Testland', color: '#3f6f9f', from: ['Uruguay'], spacing: 0.42 },
  ARG: { name: 'Argentina', long: 'Argentine Republic', color: '#8fa6b8', from: ['Argentina'], spacing: 1.1 },
  BRA: { name: 'Brazil', long: 'United States of Brazil', color: '#6f9a55', from: ['Brazil'], spacing: 1.1 },
  PAR: { name: 'Paraguay', long: 'Republic of Paraguay', color: '#b08a6a', from: ['Paraguay'], spacing: 1.8 },
};
export const HOME_STATES = {
  'Durazno': [['Durazno', -56.52, -33.38, 20, 'CAS'], ['Sarandí del Yí', -55.63, -33.34, 3], ['Trinidad', -56.90, -33.52, 3], ['Paso de los Toros', -56.51, -32.82, 3, 'S']],
  'Montevideo': [['Montevideo', -56.16, -34.88, 15, 'PNAR'], ['Canelones', -56.28, -34.52, 3], ['Pando', -55.96, -34.70, 1], ['Florida', -56.21, -34.10, 3, 'S'], ['San José de Mayo', -56.71, -34.34, 3]],
  'Colonia': [['Colonia del Sacramento', -57.84, -34.45, 5, 'PF'], ['Carmelo', -58.28, -34.00, 1], ['Nueva Palmira', -58.40, -33.88, 1, 'P'], ['Rosario', -57.35, -34.32, 1]],
  'Soriano': [['Mercedes', -58.03, -33.25, 5, 'S'], ['Fray Bentos', -58.29, -33.13, 3, 'PR'], ['Dolores', -58.22, -33.53, 1]],
  'Paysandú': [['Paysandú', -58.07, -32.32, 10, 'PAF'], ['Guichón', -57.20, -32.36, 1]],
  'Salto': [['Salto', -57.95, -31.39, 10, 'ASF'], ['Bella Unión', -57.59, -30.27, 1, 'F'], ['Constitución', -57.83, -31.07, 1]],
  'Artigas': [['Artigas', -56.47, -30.42, 5, 'F'], ['Tomás Gomensoro', -57.44, -30.43, 1], ['Baltasar Brum', -57.33, -30.72, 1]],
  'Rivera': [['Rivera', -55.55, -30.92, 5, 'FAS'], ['Tranqueras', -55.75, -31.20, 1], ['Vichadero', -54.69, -31.78, 1]],
  'Tacuarembó': [['Tacuarembó', -55.98, -31.71, 5, 'S'], ['San Gregorio de Polanco', -55.84, -32.62, 1]],
  'Cerro Largo': [['Melo', -54.18, -32.37, 5, 'SAF'], ['Río Branco', -53.40, -32.60, 1, 'F'], ['Aceguá', -54.17, -31.89, 1]],
  'Treinta y Tres': [['Treinta y Tres', -54.38, -33.23, 3, 'S'], ['Vergara', -53.94, -32.94, 1], ['José Pedro Varela', -54.53, -33.45, 1]],
  'Rocha': [['Rocha', -54.33, -34.48, 3], ['La Paloma', -54.17, -34.65, 1, 'P'], ['Chuy', -53.47, -33.70, 1, 'F'], ['Castillos', -53.86, -34.20, 1], ['Maldonado', -54.95, -34.90, 5, 'P'], ['Minas', -55.24, -34.37, 3, 'S']],
};
export const FOREIGN = {
  ARG: {
    'Entre Ríos': [['Concordia', -58.02, -31.39, 5], ['Concepción del Uruguay', -58.24, -32.48, 3], ['Gualeguaychú', -58.52, -33.01, 3], ['Paraná', -60.53, -31.73, 5], ['Villaguay', -59.02, -31.87, 1], ['Federación', -57.95, -30.98, 1], ['Gualeguay', -59.31, -33.14, 1], ['Victoria', -60.15, -32.62, 1]],
    'Corrientes': [['Corrientes', -58.83, -27.47, 5], ['Paso de los Libres', -57.09, -29.71, 3], ['Monte Caseros', -57.64, -30.25, 1], ['Curuzú Cuatiá', -58.05, -29.79, 1], ['Goya', -59.26, -29.14, 1], ['Posadas', -55.89, -27.37, 3]],
    'Santa Fe': [['Santa Fe', -60.70, -31.63, 5], ['Rosario de Santa Fe', -60.64, -32.95, 10], ['San Nicolás', -60.22, -33.33, 1], ['Pergamino', -60.57, -33.89, 1], ['Zárate', -59.03, -34.10, 1]],
    'Buenos Aires': [['Buenos Aires', -58.42, -34.61, 20], ['La Plata', -57.95, -34.92, 5], ['Mar del Plata', -57.56, -38.00, 5], ['Bahía Blanca', -62.27, -38.72, 3], ['Tandil', -59.13, -37.32, 1], ['Azul', -59.86, -36.78, 1], ['Junín', -60.95, -34.59, 1], ['Chascomús', -58.01, -35.58, 1]],
  },
  BRA: {
    'Fronteira Oeste': [['Uruguaiana', -57.08, -29.76, 5], ['Quaraí', -56.45, -30.38, 1], ['Itaqui', -56.55, -29.13, 1], ['Barra do Quaraí', -57.55, -30.20, 1], ['São Borja', -56.00, -28.66, 3]],
    'Campanha': [['Santana do Livramento', -55.53, -30.87, 5], ['Rosário do Sul', -54.91, -30.26, 1], ['Dom Pedrito', -54.67, -30.98, 1], ['Alegrete', -55.79, -29.78, 3], ['Cacequi', -54.82, -29.88, 1], ['Santiago', -54.87, -29.19, 1]],
    'Rio Grande do Sul': [['Porto Alegre', -51.22, -30.03, 15], ['Pelotas', -52.34, -31.77, 5], ['Rio Grande', -52.10, -32.03, 5], ['Bagé', -54.11, -31.33, 3], ['Jaguarão', -53.38, -32.55, 1], ['Santa Maria', -53.80, -29.68, 3], ['Chuí', -53.45, -33.68, 1], ['Caxias do Sul', -51.18, -29.17, 3], ['São Gabriel', -54.32, -30.34, 1]],
    'Santa Catarina': [['Florianópolis', -48.55, -27.60, 5], ['Joinville', -48.85, -26.30, 3], ['Lages', -50.33, -27.82, 1], ['Chapecó', -52.62, -27.10, 1], ['Passo Fundo', -52.41, -28.26, 3]],
    'Paraná': [['Curitiba', -49.27, -25.43, 10], ['Foz do Iguaçu', -54.59, -25.55, 1], ['Ponta Grossa', -50.16, -25.09, 1]],
  },
  PAR: { 'Paraguay': [['Asunción', -57.58, -25.28, 5], ['Encarnación', -55.87, -27.33, 1]] },
};
// The same modern country appears in several fronts, kept apart with boxes [lon0, lat0, lon1, lat1].
const PLATA_COAST = [[-58.4, -33.9], [-57.85, -34.47], [-57.3, -34.45], [-56.7, -34.75], [-56.16, -34.92], [-55.6, -34.8]];
const ATLANTIC_COAST = [[-55.2, -34.9], [-54.9, -34.97], [-54.3, -34.7], [-53.8, -34.4], [-53.5, -33.9], [-53.38, -33.75]];
export const FRONTS = [
  { id: 'lit', name: 'Littoral Front', enemy: 'ARG', enemyName: 'Argentina', subs: ['Argentina'], box: [-64, -32.2, -53, -23], defaultLabel: 'School', satrapy: 'the Mesopotamian Littoral', hq: 'Salto' },
  { id: 'ent', name: 'Lower River Front', enemy: 'ARG', enemyName: 'Argentina', subs: ['Argentina'], box: [-64, -34.2, -57, -32.2], defaultLabel: 'Family', satrapy: 'the Lower Paraná', hq: 'Mercedes' },
  { id: 'qua', name: 'Quaraí Front', enemy: 'BRA', enemyName: 'Brazil', subs: ['Brazil'], box: [-58, -34, -55.9, -28.5], defaultLabel: 'Partner', satrapy: 'the Western Marches', hq: 'Artigas' },
  { id: 'cam', name: 'Campanha Front', enemy: 'BRA', enemyName: 'Brazil', subs: ['Brazil'], box: [-55.9, -34, -54.4, -28.5], defaultLabel: 'Work', satrapy: 'the Campanha', hq: 'Rivera' },
  { id: 'lag', name: 'Lagoon Front', enemy: 'BRA', enemyName: 'Brazil', subs: ['Brazil'], box: [-54.4, -34, -46, -28.5], defaultLabel: 'Health', satrapy: 'the Lagoon Country', hq: 'Melo' },
  { id: 'pla', name: 'River Plate Theatre', enemy: 'ARG', enemyName: 'Argentine Navy', subs: ['Argentina'], box: [-64, -40, -56, -34.2], defaultLabel: 'Friends', satrapy: 'the Southern Shore', hq: 'Montevideo', naval: true, coast: PLATA_COAST, coastKm: 45 },
  { id: 'atl', name: 'Atlantic Theatre', enemy: 'BRA', enemyName: 'Brazilian Navy', subs: ['Brazil'], box: [-58, -28.5, -46, -23], defaultLabel: 'Self', satrapy: 'the Atlantic Shore', hq: 'Maldonado', naval: true, coast: ATLANTIC_COAST, coastKm: 45 },
];
export const RANGES = [
  { name: 'Serra Geral', w: 0.7, pts: [[-54.5, -29.3], [-52.5, -29.0], [-51.0, -28.6], [-50.0, -27.6], [-49.6, -26.4]] },
  { name: 'Cuchilla Grande', w: 0.25, pts: [[-54.6, -32.6], [-54.9, -33.4], [-55.2, -34.2]] },
];
export const DESERTS = [];
export const FORESTS = [[-54.6, -26.5, 1.5, 1.2], [-49.4, -25.6, 0.8, 1.0]];
export const MARSHES = [[-57.5, -28.2, 0.9, 0.6, 'Iberá'], [-53.2, -32.9, 0.3, 0.5]];
export const LAKES = [
  { name: 'Lagoa dos Patos', pts: [[-51.2, -30.4], [-50.8, -30.6], [-51.2, -31.2], [-51.9, -31.8], [-52.15, -31.9], [-51.9, -31.3], [-51.4, -30.8]] },
  { name: 'Lagoa Mirim', pts: [[-52.7, -32.3], [-52.6, -32.7], [-53.1, -33.2], [-53.5, -33.5], [-53.3, -32.9], [-52.9, -32.4]] },
];
export const RIVERS = [
  { name: 'Uruguay', pts: [[-55.9, -28.2], [-56.6, -29.1], [-57.6, -30.2], [-57.9, -31.0], [-58.0, -31.9], [-58.2, -32.6], [-58.4, -33.5], [-58.4, -34.0]] },
  { name: 'Río Negro', pts: [[-54.3, -31.6], [-55.3, -32.3], [-56.0, -32.7], [-56.6, -32.85], [-57.4, -33.0], [-58.0, -33.3], [-58.4, -33.4]] },
  { name: 'Paraná', pts: [[-54.6, -25.6], [-55.9, -27.4], [-58.8, -27.3], [-59.4, -29.5], [-60.6, -31.7], [-60.5, -33.0], [-58.9, -34.1]] },
];
export const RAILWAYS = [
  { name: 'Central Railway', stage: 0, via: ['Montevideo', 'Florida', 'Durazno', 'Paso de los Toros', 'Tacuarembó', 'Rivera'] },
  { name: 'Midland Railway', stage: 0, via: ['Paso de los Toros', 'Guichón', 'Paysandú', 'Salto'] },
  { name: 'Eastern Railway', stage: 1, via: ['Montevideo', 'Minas', 'Treinta y Tres', 'Melo'] },
  { name: 'Western Extension', stage: 2, via: ['Durazno', 'Trinidad', 'Mercedes', 'Fray Bentos'] },
  { name: 'Coast Line', stage: 3, via: ['Montevideo', 'Maldonado', 'Rocha'] },
  { name: 'Northern Loop', stage: 4, via: ['Salto', 'Artigas', 'Rivera'] },
];
export const SEA_LABELS = [['ATLANTIC OCEAN', -51.5, -36.5, 1.3], ['Río de la Plata', -57.0, -35.35, 0.6, -20]];
export const COUNTRY_LABELS = [['ARG', 'ARGENTINA', -61.0, -36.0, 15], ['BRA', 'BRAZIL', -52.0, -27.0, 17], ['PAR', 'PARAGUAY', -57.0, -24.5, 10]];
export const HOME_LABEL = [-55.9, -32.4];
export const EMPIRE = [[-63.5, -38.9], [-61.5, -39.6], [-57.0, -38.4], [-54.5, -35.6], [-51.5, -33.0], [-48.2, -28.9], [-48.0, -25.0], [-52.0, -24.0], [-58.0, -26.8], [-61.2, -30.2], [-62.5, -34.2]];
// one fleet for both naval fronts; an enemy squadron on each
export const FLEET_AT = { plate: [-55.9, -35.5], 'enemy:pla': [-57.4, -35.7], 'enemy:atl': [-52.3, -34.6] };
export const META = {
  name: 'Testland', long: 'Oriental Republic of Testland', empire: 'Platine Confederation', year: 1936,
  blurb: 'A small republic between two giants and two seas. For tests only.',
  flag: { type: 'v3', colors: ['#2f5f9f', '#f1ede4', '#2f5f9f'] },
  regionWord: 'Department',
  regions: { 'Entre Ríos': 'the Land Between Rivers' }, // every other region keeps its own name
  honor: { lit: ['Salto', 'Daymán', 'Arapey'], pla: ['Montevideo', 'Colonia', 'Cerro'] }, // the other fronts are named after the towns behind them
  oob: { lit: ['inf', 'cav', 'art'], pla: ['inf', 'mar'], atl: ['mar', 'inf', 'nonsense'] }, // an unknown type must not break anything
  fleets: [{ id: 'plate', name: 'River Plate Squadron', base: 'Montevideo', sea: 'Río de la Plata', fronts: ['pla', 'atl'], ships: [['Uruguay', 'Gunboat'], ['Huracán', 'Gunboat'], ['Montevideo', 'Training Cruiser']] }],
  operations: ['Ceibo', 'Hornero', 'Pampero', 'Charrúa'],
  weather: { cam: 'snow', atl: 'heat', south: true }, // "snow": hard winters, which here are June to August
  ranks: [['Soldado', 'Private'], ['Sargento', 'Sergeant'], ['Teniente', 'Lieutenant'], ['Capitán', 'Captain'], ['Coronel', 'Colonel'], ['General', 'General']],
  landmarks: [{ city: 'Buenos Aires', medal: 'Keys of the Port', desc: 'Enter Buenos Aires' }, { city: 'Porto Alegre' }], // the second has no medal name of its own
  days: [{ month: 8, day: 25, text: 'Independence Day. The line holds.' }],
};
