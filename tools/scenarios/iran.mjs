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
// Everything the engine and the interface say about the country (see docs/SCENARIOS.md).
export const META = {
  name: 'Iran', long: 'Imperial State of Iran', empire: 'Achaemenid Empire', year: 1936,
  blurb: 'Seven borders from the Caucasus to the Gulf. Restore the empire of Cyrus.',
  pitch: 'a 1936 grand-strategy war map of Iran',
  flag: { type: 'h3', colors: ['#3f9467', '#efeadb', '#cf4a39'], disc: '#e3b85c' },
  regionWord: 'Satrapy',
  // Old Persian names of the lands, shown when a region is fully retaken
  regions: {
    'Herat': 'Haraiva', 'Kandahar': 'Harauvatish', 'Sistan': 'Zranka', 'Kabul': 'Gandara', 'Bactria': 'Bakhtrish', 'Turkmen SSR': 'Margush', 'Uzbek SSR': 'Suguda', 'Tajik SSR': 'Saka lands',
    'Azerbaijan SSR': 'Aturpatakan', 'Armenian SSR': 'Armina', 'Georgian SSR': 'Kolkha', 'Mesopotamia': 'Babirush', 'Basra': 'the Sealand', 'Assyria': 'Athura', 'Western Desert': 'Arabaya',
    'Syria': 'Abar-Nahara', 'Lebanon': 'Phoenicia', 'Palestine': 'Yehud', 'Transjordan': 'Nabataea', 'Lower Egypt': 'Mudraya', 'Upper Egypt': 'Upper Mudraya', 'Sinai': 'Sinai', 'Red Sea Coast': 'the Red Sea shore',
    'Eastern Anatolia': 'Western Armina', 'Pontus': 'Pontus', 'Upper Mesopotamia': 'Upper Athura', 'Cappadocia': 'Katpatuka', 'Cilicia': 'Khilakku', 'Lydia': 'Sparda', 'Thrace': 'Skudra',
    'Baluchistan Agency': 'Maka', 'Sindh': 'Hindush', 'Punjab': 'Thatagush', 'North-West Frontier': 'Eastern Gandara', 'Kuwait': 'Kuwait', 'Bahrain': 'Tylos', 'Qatar': 'Qatar', 'Trucial States': 'the Pirate Coast',
    'Muscat & Oman': 'Mazun', 'Al-Hasa': 'Hagar', 'Nejd': 'Inner Arabaya', 'Hejaz': 'Hejaz',
  },
  capitalFalls: 'The government evacuates to Isfahan. The war goes on.',
  capitalFreed: 'Tehran is free again. The Shah returns to the capital.',
  fightsOnFrom: 'Isfahan',
  honor: {
    afg: ['Khorasan', 'Mashhad', 'Birjand', 'Sistan', 'Toos', 'Nishapur', 'Qaen', 'Torbat', 'Sarakhs', 'Tabas'],
    cau: ['Azerbaijan', 'Tabriz', 'Ardabil', 'Aras', 'Sahand', 'Sabalan', 'Moghan', 'Maragheh', 'Khoy', 'Julfa'],
    tks: ['Gorgan', 'Mazandaran', 'Atrak', 'Bojnurd', 'Hyrcania', 'Shahrud', 'Quchan', 'Damghan', 'Dargaz', 'Alborz'],
    irq: ['Kermanshah', 'Khuzestan', 'Luristan', 'Ahvaz', 'Zagros', 'Kurdistan', 'Dezful', 'Ilam', 'Hamadan', 'Susa'],
    raj: ['Baluchistan', 'Kerman', 'Makran', 'Zahedan', 'Bam', 'Taftan', 'Iranshahr', 'Saravan', 'Jiroft', 'Lut'],
    tur: ['Urmia', 'Maku', 'Mahabad', 'Ararat', 'Salmas', 'Saqqez', 'Sanandaj', 'Zanjan', 'Bijar', 'Qazvin'],
    glf: ['Fars', 'Bushehr', 'Hormuz', 'Shiraz', 'Persepolis', 'Bandar Abbas', 'Lar', 'Qeshm', 'Kharg', 'Lengeh'],
  },
  commanders: { afg: 'Gen. Dariush Khorasani', cau: 'Gen. Babak Azari', tks: 'Gen. Arash Torkaman', irq: 'Gen. Kaveh Zagrosi', raj: 'Gen. Rostam Sistani', tur: 'Gen. Farhad Urmavi', glf: 'Adm. Sohrab Daryayi' },
  oob: { afg: ['inf', 'inf', 'cav', 'art'], cau: ['inf', 'inf', 'mtn', 'arm'], tks: ['inf', 'cav', 'inf'], irq: ['inf', 'inf', 'mtn', 'art'], raj: ['inf', 'cav', 'inf'], tur: ['inf', 'mtn', 'inf'], glf: ['inf', 'mar', 'inf'] },
  guard: [['grd', '1st Imperial Guard Division “Javidan”'], ['arm', '2nd Guard Armoured Brigade']],
  officerNames: {
    first: ['Bahram', 'Kourosh', 'Jamshid', 'Parviz', 'Hormoz', 'Ardeshir', 'Manuchehr', 'Esfandiar', 'Khosrow', 'Bijan', 'Fereydoun', 'Siamak', 'Houshang', 'Shapour', 'Iraj', 'Touraj'],
    last: ['Shahbazi', 'Daryani', 'Kohestani', 'Alborzi', 'Sepahbod', 'Rostami', 'Golzar', 'Tavakoli', 'Niknam', 'Farahmand', 'Zandieh', 'Karimkhani', 'Mirfendereski', 'Bakhtiar', 'Qaragozlu', 'Sardari'],
    ranks: { div: 'Brig. Gen.', bde: 'Col.', guard: 'Maj. Gen.' },
  },
  wings: [
    { name: '1st Air Regiment', type: 'fighter', model: 'Hawker Fury', base: 'Tehran', planes: 24 },
    { name: '2nd Air Regiment', type: 'cas', model: 'Hawker Hind', base: 'Tabriz', planes: 18 },
    { name: '3rd Air Regiment', type: 'cas', model: 'Hawker Audax', base: 'Mashhad', planes: 18 },
    { name: '4th Air Regiment', type: 'fighter', model: 'Hawker Fury', base: 'Ahvaz', planes: 16 },
  ],
  newWingModels: { fighter: 'Hawker Hurricane', cas: 'Hawker Hind', bomber: 'Bristol Blenheim' },
  // `fronts`: the fronts whose naval events use this fleet (and which therefore "have a fleet")
  fleets: [
    { id: 'south', name: 'Southern Fleet', base: 'Khorramshahr', sea: 'Persian Gulf', fronts: ['glf'], ships: [['Babr', 'Sloop'], ['Palang', 'Sloop'], ['Shahrokh', 'Gunboat'], ['Simorgh', 'Gunboat'], ['Karkas', 'Gunboat'], ['Shahbaz', 'Gunboat']] },
    { id: 'north', name: 'Caspian Flotilla', base: 'Bandar Pahlavi', sea: 'Caspian Sea', fronts: ['cau', 'tks'], ships: [['Shahsavar', 'Imperial Yacht'], ['Sefidrud', 'Gunboat'], ['Babolsar', 'Gunboat'], ['Gorgan', 'Gunboat']] },
  ],
  shipNames: ['Homa', 'Azarbaijan', 'Khuzestan', 'Gilan', 'Mazandaran', 'Artemiz', 'Damavand', 'Sahand', 'Alvand', 'Zagros', 'Kaveh', 'Rostam',
    'Sohrab', 'Arash', 'Darius', 'Kourosh', 'Xerxes', 'Kambujiya', 'Bahram', 'Shapur', 'Anushirvan', 'Faramarz', 'Zal', 'Siavash'],
  operations: ['Simorgh', 'Derafsh', 'Kaveh', 'Arash', 'Tondar', 'Alborz', 'Sepand', 'Homa', 'Zolfaghar', 'Mehr', 'Anahita', 'Tishtar', 'Damavand', 'Rakhsh', 'Fereydun', 'Azar'],
  enemyOperations: ['Iron Gate', 'Red Star', 'Hammer', 'Steppe Wind', 'Black Tulip', 'Khyber', 'Crescent', 'Trident', 'Grey Wolf', 'Avalanche', 'Monsoon', 'Anvil'],
  nicknames: ['Lions', 'Falcons', 'Wolves', 'Leopards', 'Eagles', 'Stallions', 'Tigers', 'Hawks'],
  // per home state: [infrastructure 0-5, civilian factories, military factories, dockyards]
  stateStart: {
    'Tehran': [3, 3, 2, 0], 'Azerbaijan': [2, 1, 1, 0], 'Gilan': [2, 1, 0, 0], 'Mazandaran': [2, 1, 0, 0], 'Kurdistan': [1, 0, 0, 0],
    'Luristan': [1, 0, 0, 0], 'Khuzestan': [3, 1, 0, 1], 'Isfahan': [2, 1, 1, 0], 'Fars': [1, 1, 0, 0], 'Kerman': [1, 0, 0, 0],
    'Baluchistan': [0, 0, 0, 0], 'Khorasan': [1, 1, 0, 0],
  },
  // Mountain fronts freeze in winter; the southern fronts bake in summer.
  weather: { cau: 'snow', tur: 'snow', afg: 'snow', glf: 'heat', raj: 'heat' },
  enemyAdjectives: { AFG: 'Afghan', SOV: 'Soviet', IRQ: 'Iraqi', RAJ: 'British Indian', TUR: 'Turkish', GBR: 'British' },
  enemyArmour: ['SOV'],
  // ranks of the Imperial Iranian Army
  ranks: [['Sarbaz', 'Private'], ['Sarjukheh', 'Corporal'], ['Goruhban', 'Sergeant'], ['Sotvan', 'Lieutenant'], ['Sarvan', 'Captain'], ['Sargord', 'Major'],
    ['Sarhang', 'Colonel'], ['Sartip', 'Brigadier'], ['Sarlashkar', 'Major General'], ['Sepahbod', 'Lieutenant General'], ['Arteshbod', 'General'], ['Eran-Spahbod', 'Marshal of the Empire']],
  landmarks: [{ city: 'Babylon', medal: 'Cyrus Cylinder', desc: 'Enter Babylon' }, { city: 'Sardis', medal: 'Royal Road', desc: 'Reach Sardis, the western end of the Royal Road' }],
  medalNames: {
    ten: 'Order of the Lion and Sun', fifty: 'Order of Aqdas', decisive: 'Order of Zolfaghar', week: 'Order of Homayoun', month: 'Order of the Crown', phoenix: 'Simorgh',
    satrap: 'Satrap', comeback: 'Arash the Archer', empire: 'Shahanshah', haftkhan: 'Haft Khan', rasti: 'Rasti', qanat: 'Qanat Builder', hundred: 'Shahnameh',
    hundreddays: 'Order of Khorshid', year: 'Order of Pahlavi', elite: 'The Immortals', kaveh: 'Kaveh the Blacksmith', nowruz: 'Haft-Seen', cyrus: 'King of the Four Corners',
    hotgates: 'The Hot Gates', artemisia: 'Artemisia',
  },
  medalDescs: {
    rasti: 'Report a defeat three days running — a Persian is taught to ride, to shoot and to tell the truth', nowruz: 'File a dispatch on Nowruz, the first day of spring',
    cyrus: 'Take Sardis and Babylon within seven days, as Cyrus took them within seven years', hotgates: 'Three defeats on one front, then a decisive victory — Xerxes at Thermopylae',
    artemisia: 'Answer a naval defeat with a naval victory — “my men have become women, and my women men”',
  },
  masthead: "ETTELA'AT-E ARTESH",
  calendar: 'persian',
  days: [{ month: 3, day: 21, text: 'Nowruz Pirouz. A new year on every front.' }, { month: 12, day: 21, text: 'Shab-e Yalda. The longest night ends at dawn.' }, { month: 10, day: 29, text: '7 Aban — Cyrus the Great Day.' }],
  motto: 'adam Kūruš, xšāyaθiya — “I am Cyrus, the king.”',
};
