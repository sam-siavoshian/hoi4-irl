// Greece, 1936. The Kingdom of Greece on the eve of the Metaxas years; the formable is the Byzantine (Eastern Roman)
// Empire as Basil II left it in 1025: the Balkans to the Danube and the Sava, Anatolia to Vaspurakan, Antioch, Cyprus,
// Crete and the Catepanate of Italy. Sicily, whose reconquest Basil was preparing when he died, is included as the
// last objective of the Ionian theatre.
// Coordinates are [lon, lat]. City tuple: [name, lon, lat, vp?, flags?]
// flags: P port, N naval base, A airbase, S supply hub, R heavy industry, F fort, C capital
//
// Honest approximations (modern polygons cannot reproduce 1936 exactly):
//  - The Dodecanese (Rhodes, Kos, Karpathos…) were Italian in 1936 but are part of the modern `Greece` polygon and
//    cannot be separated, so they are drawn as a home state.
//  - Southern Dobruja (Silistra, Dobrich) was Romanian in 1936 and is drawn Bulgarian; the Sanjak of Alexandretta
//    (Antioch) was still under the French mandate and is drawn Turkish; Istria, Fiume and Zara were Italian and are
//    drawn Yugoslav; Bessarabia south of the Dniester mouth (Izmail, Akkerman) was Romanian and is drawn Soviet.
//  - Turkey is shared by three theatres, separated by rectangles: the Straits (north of 39.45°N), the Aegean (south
//    of it and west of 31.8°E) and the Levantine Sea (south of it and east of 31.8°E).
//  - The Straits are a naval theatre: Eastern Thrace and Anatolia are separate polygons, so an overland front could
//    never cross the Bosporus.

export const ID = 'greece';
export const HOME = 'GRC';
export const CAPITAL = 'Athens';
export const EXTENT = { lon0: 11.9, lon1: 45.2, lat0: 34.0, lat1: 46.2 };

// 1936 political entities built from modern polygons
export const COUNTRIES = {
  GRC: { name: 'Greece', long: 'Kingdom of Greece', color: '#3f7fb5', from: ['Greece'], spacing: 0.35, minIsland: 0.011 },
  ALB: { name: 'Albania', long: 'Albanian Kingdom', color: '#9a4a44', from: ['Albania'], spacing: 0.5 },
  YUG: { name: 'Yugoslavia', long: 'Kingdom of Yugoslavia', color: '#7a6a9c',
    from: ['Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Kosovo', 'Montenegro', 'Macedonia'], spacing: 0.8 },
  BUL: { name: 'Bulgaria', long: 'Tsardom of Bulgaria', color: '#5f7a4a', from: ['Bulgaria'], spacing: 0.7 },
  TUR: { name: 'Turkey', long: 'Republic of Turkey', color: '#b3a376', from: ['Turkey'], spacing: 0.95 },
  ITA: { name: 'Italy', long: 'Kingdom of Italy', color: '#5c8a5c', from: ['Italy', 'San Marino', 'Vatican'], spacing: 0.75 },
  GBR: { name: 'British Mediterranean', long: 'British Cyprus & Malta', color: '#b0586a',
    from: ['Cyprus', 'N. Cyprus', 'Cyprus U.N. Buffer Zone', 'Dhekelia', 'Akrotiri', 'Malta'], spacing: 0.45 },
  FRA: { name: 'French Levant', long: 'French Mandate of Syria & Lebanon', color: '#4a67a8', from: ['Syria', 'Lebanon'], spacing: 1.4 },
  ROM: { name: 'Romania', long: 'Kingdom of Romania', color: '#b8a03a', from: ['Romania', 'Moldova'], spacing: 1.4 },
  HUN: { name: 'Hungary', long: 'Kingdom of Hungary', color: '#a8704a', from: ['Hungary'], spacing: 1.6 },
  SOV: { name: 'Soviet Union', long: 'Union of Soviet Socialist Republics', color: '#8c2f2a',
    from: ['Russia', 'Ukraine', 'Georgia', 'Armenia', 'Azerbaijan'], spacing: 1.5 },
  IRQ: { name: 'Iraq', long: 'Kingdom of Iraq', color: '#8a7a4d', from: ['Iraq'], spacing: 1.6 },
  IRN: { name: 'Iran', long: 'Imperial State of Iran', color: '#3f8f7a', from: ['Iran'], spacing: 1.8 },
};

// The historical regions of Greece and their towns
export const HOME_STATES = {
  'Attica & Boeotia': [
    ['Athens', 23.73, 37.98, 40, 'CS'], ['Piraeus', 23.63, 37.94, 15, 'PR'], ['Salamis', 23.50, 37.95, 3, 'N'], ['Eleusis', 23.54, 38.04, 3, 'R'],
    ['Tatoi', 23.78, 38.11, 1, 'A'], ['Lavrion', 24.05, 37.72, 1], ['Thebes', 23.32, 38.32, 3], ['Livadeia', 22.87, 38.44, 3],
  ],
  'Roumeli & Euboea': [
    ['Lamia', 22.43, 38.90, 5], ['Chalcis', 23.62, 38.47, 5], ['Karystos', 24.42, 38.02, 1], ['Kymi', 24.10, 38.63, 1],
    ['Istiaia', 23.15, 38.95, 1], ['Delphi', 22.50, 38.48, 3], ['Missolonghi', 21.43, 38.37, 3], ['Agrinio', 21.41, 38.63, 3],
    ['Skyros', 24.57, 38.91, 1], ['Linaria', 24.53, 38.84, 1],
  ],
  'Peloponnese': [
    ['Patras', 21.73, 38.25, 10, 'PS'], ['Corinth', 22.93, 37.94, 5], ['Nafplio', 22.80, 37.57, 3], ['Argos', 22.72, 37.63, 3],
    ['Tripoli', 22.37, 37.51, 5], ['Sparta', 22.43, 37.07, 3], ['Kalamata', 22.11, 37.04, 5, 'P'], ['Pyrgos', 21.44, 37.67, 3],
    ['Olympia', 21.63, 37.64, 1], ['Pylos', 21.70, 36.91, 1], ['Gytheio', 22.57, 36.76, 1], ['Monemvasia', 23.04, 36.69, 1],
    ['Kyparissia', 21.67, 37.25, 1], ['Araxos', 21.42, 38.15, 1, 'A'],
  ],
  'Thessaly': [
    ['Larissa', 22.42, 39.64, 10, 'AS'], ['Volos', 22.94, 39.36, 5, 'P'], ['Trikala', 21.77, 39.56, 3], ['Karditsa', 21.92, 39.36, 3],
    ['Kalambaka', 21.63, 39.71, 1], ['Farsala', 22.38, 39.29, 1], ['Almyros', 22.76, 39.18, 1, 'A'],
  ],
  'Epirus': [
    ['Ioannina', 20.85, 39.66, 10, 'AS'], ['Arta', 20.98, 39.16, 3], ['Preveza', 20.75, 38.96, 3], ['Igoumenitsa', 20.27, 39.50, 1],
    ['Konitsa', 20.75, 40.05, 1, 'F'], ['Filiates', 20.31, 39.60, 1, 'F'], ['Kalpaki', 20.63, 39.89, 1, 'F'],
  ],
  'Western Macedonia': [
    ['Kozani', 21.79, 40.30, 5, 'S'], ['Florina', 21.41, 40.78, 3, 'F'], ['Kastoria', 21.27, 40.52, 3], ['Grevena', 21.43, 40.08, 1],
    ['Amyntaio', 21.68, 40.69, 1],
  ],
  'Central Macedonia': [
    ['Thessaloniki', 22.94, 40.64, 20, 'PS'], ['Sedes', 23.03, 40.52, 1, 'A'], ['Veria', 22.20, 40.52, 3], ['Edessa', 22.05, 40.80, 3],
    ['Katerini', 22.50, 40.27, 3], ['Kilkis', 22.87, 40.99, 3], ['Giannitsa', 22.41, 40.79, 1], ['Polygyros', 23.44, 40.38, 1],
    ['Karyes', 24.24, 40.26, 1], ['Doirani', 22.77, 41.18, 1, 'F'], ['Idomeni', 22.51, 41.12, 1, 'F'],
  ],
  'Eastern Macedonia': [
    ['Serres', 23.55, 41.09, 5, 'S'], ['Kavala', 24.41, 40.94, 5, 'P'], ['Drama', 24.15, 41.15, 5, 'A'], ['Sidirokastro', 23.39, 41.24, 1],
    ['Fort Roupel', 23.35, 41.33, 1, 'F'], ['Fort Istibey', 23.18, 41.34, 1, 'F'], ['Kato Nevrokopi', 23.87, 41.35, 1, 'F'],
    ['Amphipolis', 23.84, 40.82, 1], ['Thasos', 24.71, 40.78, 1], ['Limenaria', 24.58, 40.63, 1],
  ],
  'Thrace': [
    ['Xanthi', 24.89, 41.13, 3], ['Komotini', 25.40, 41.12, 5, 'S'], ['Alexandroupoli', 25.87, 40.85, 5, 'P'], ['Soufli', 26.30, 41.19, 1],
    ['Didymoteicho', 26.50, 41.35, 3, 'F'], ['Orestiada', 26.53, 41.50, 1], ['Echinos', 25.00, 41.28, 1, 'F'], ['Nymfaia', 25.45, 41.22, 1, 'F'],
    ['Samothrace', 25.57, 40.45, 1], ['Therma', 25.67, 40.49, 1],
  ],
  'Ionian Islands': [
    ['Corfu', 19.92, 39.62, 5, 'PF'], ['Lefkimmi', 20.07, 39.42, 1], ['Lefkada', 20.71, 38.83, 1], ['Vasiliki', 20.60, 38.63, 1],
    ['Argostoli', 20.49, 38.18, 3], ['Sami', 20.65, 38.25, 1], ['Zakynthos', 20.90, 37.79, 3], ['Volimes', 20.66, 37.87, 1],
    ['Kythira', 23.00, 36.15, 1],
  ],
  'Aegean Islands': [
    ['Mytilene', 26.55, 39.11, 5, 'S'], ['Kalloni', 26.21, 39.23, 1], ['Molyvos', 26.17, 39.37, 1], ['Chios', 26.14, 38.37, 5],
    ['Volissos', 25.92, 38.48, 1], ['Vathy', 26.97, 37.75, 3], ['Karlovasi', 26.70, 37.79, 1], ['Myrina', 25.06, 39.87, 1],
    ['Moudros', 25.27, 39.87, 3, 'N'], ['Agios Kirykos', 26.29, 37.61, 1], ['Raches', 26.09, 37.60, 1],
  ],
  'Cyclades': [
    ['Ermoupoli', 24.94, 37.44, 5, 'P'], ['Poseidonia', 24.89, 37.39, 1], ['Naxos', 25.38, 37.10, 3], ['Apeiranthos', 25.52, 37.07, 1],
    ['Andros', 24.94, 37.84, 1], ['Gavrio', 24.73, 37.88, 1], ['Parikia', 25.15, 37.08, 1], ['Marpissa', 25.25, 37.04, 1],
    ['Tinos', 25.16, 37.54, 1], ['Isternia', 25.04, 37.62, 1], ['Milos', 24.43, 36.73, 1], ['Kythnos', 24.42, 37.42, 1], ['Dryopida', 24.43, 37.36, 1],
  ],
  'Crete': [
    ['Heraklion', 25.13, 35.34, 10, 'PA'], ['Chania', 24.02, 35.51, 10, 'S'], ['Souda', 24.15, 35.48, 3, 'N'], ['Rethymno', 24.47, 35.37, 3],
    ['Agios Nikolaos', 25.72, 35.19, 1], ['Sitia', 26.10, 35.21, 1], ['Ierapetra', 25.74, 35.01, 1], ['Kissamos', 23.65, 35.49, 1],
    ['Sfakia', 24.14, 35.20, 1], ['Tymbaki', 24.77, 35.07, 1], ['Anogeia', 24.88, 35.29, 1],
  ],
  // Italian since 1912 (Isole Italiane dell'Egeo); part of the modern Greek polygon, so drawn as home territory
  'Dodecanese': [
    ['Rhodes', 28.22, 36.44, 5], ['Lindos', 28.09, 36.09, 1], ['Kos', 27.29, 36.89, 1], ['Kefalos', 26.96, 36.74, 1],
    ['Pigadia', 27.21, 35.51, 1], ['Olympos', 27.17, 35.74, 1],
  ],
};

// Foreign cities by country tag → region → cities. Byzantine and classical names are used where the city was a
// notable one of the empire (Constantinople, Smyrna, Nicaea, Trebizond…), modern ones elsewhere.
export const FOREIGN = {
  ALB: {
    'Gegeria': [['Tirana', 19.82, 41.33, 15], ['Durres', 19.45, 41.32, 5], ['Shkoder', 19.51, 42.07, 5], ['Kruje', 19.79, 41.51, 3], ['Lezhe', 19.64, 41.78, 1],
      ['Kukes', 20.42, 42.08, 1], ['Peshkopi', 20.43, 41.69, 1], ['Burrel', 20.01, 41.61, 1], ['Elbasan', 20.08, 41.11, 3], ['Bajram Curri', 20.08, 42.36, 1]],
    'Myzeqe': [['Vlore', 19.49, 40.47, 5], ['Berat', 19.95, 40.71, 3], ['Fier', 19.56, 40.72, 1], ['Lushnje', 19.71, 40.94, 1], ['Pogradec', 20.65, 40.90, 1], ['Gramsh', 20.18, 40.87, 1]],
    'Northern Epirus': [['Korce', 20.78, 40.62, 5], ['Gjirokaster', 20.14, 40.08, 3], ['Sarande', 20.00, 39.87, 1], ['Permet', 20.35, 40.23, 1], ['Tepelene', 20.02, 40.30, 1],
      ['Himare', 19.74, 40.10, 1], ['Leskovik', 20.60, 40.15, 1], ['Erseke', 20.68, 40.34, 1]],
  },
  YUG: {
    'Vardar Macedonia': [['Skopje', 21.43, 42.00, 10], ['Bitola', 21.33, 41.03, 5], ['Ohrid', 20.80, 41.12, 5], ['Prilep', 21.55, 41.35, 3], ['Veles', 21.78, 41.72, 3],
      ['Stip', 22.19, 41.74, 1], ['Strumica', 22.64, 41.44, 1], ['Gevgelija', 22.50, 41.14, 1], ['Kumanovo', 21.71, 42.13, 1], ['Tetovo', 20.97, 42.01, 1],
      ['Kavadarci', 22.01, 41.43, 1], ['Debar', 20.52, 41.52, 1], ['Kicevo', 20.96, 41.51, 1], ['Kocani', 22.41, 41.92, 1]],
    'Kosovo & Raska': [['Pristina', 21.17, 42.66, 3], ['Prizren', 20.74, 42.21, 3], ['Pec', 20.29, 42.66, 1], ['Mitrovica', 20.87, 42.89, 1], ['Novi Pazar', 20.52, 43.14, 1]],
    'Serbia': [['Belgrade', 20.46, 44.80, 20], ['Nis', 21.90, 43.32, 5], ['Kragujevac', 20.91, 44.01, 3], ['Leskovac', 21.95, 43.00, 1], ['Vranje', 21.90, 42.55, 1],
      ['Kraljevo', 20.69, 43.72, 1], ['Uzice', 19.84, 43.86, 1], ['Smederevo', 20.93, 44.66, 1], ['Valjevo', 19.88, 44.27, 1], ['Zajecar', 22.28, 43.90, 1],
      ['Pirot', 22.59, 43.16, 1], ['Negotin', 22.53, 44.23, 1], ['Krusevac', 21.33, 43.58, 1], ['Pozarevac', 21.19, 44.62, 1], ['Sabac', 19.69, 44.75, 1], ['Sirmium', 19.61, 44.97, 3]],
    'Vojvodina': [['Novi Sad', 19.84, 45.25, 5], ['Subotica', 19.67, 46.10, 1], ['Petrovgrad', 20.39, 45.38, 1]],
    'Montenegro': [['Cetinje', 18.92, 42.39, 3], ['Podgorica', 19.26, 42.44, 3], ['Kotor', 18.77, 42.42, 1], ['Niksic', 18.95, 42.77, 1], ['Bar', 19.10, 42.09, 1],
      ['Pljevlja', 19.36, 43.36, 1], ['Berane', 19.87, 42.84, 1]],
    'Bosnia': [['Sarajevo', 18.41, 43.86, 10], ['Banja Luka', 17.19, 44.77, 3], ['Tuzla', 18.67, 44.54, 1], ['Zenica', 17.91, 44.20, 1], ['Bihac', 15.87, 44.82, 1],
      ['Doboj', 18.09, 44.73, 1], ['Jajce', 17.27, 44.34, 1], ['Foca', 18.78, 43.51, 1], ['Visegrad', 19.29, 43.78, 1]],
    'Herzegovina': [['Mostar', 17.81, 43.34, 3], ['Trebinje', 18.34, 42.71, 1]],
    'Dalmatia': [['Split', 16.44, 43.51, 5], ['Zadar', 15.23, 44.12, 3], ['Dubrovnik', 18.09, 42.65, 3], ['Sibenik', 15.90, 43.73, 1], ['Knin', 16.20, 44.04, 1],
      ['Gospic', 15.37, 44.55, 1], ['Makarska', 17.02, 43.30, 1], ['Senj', 14.90, 44.99, 1]],
    'Croatia-Slavonia': [['Zagreb', 15.98, 45.81, 10], ['Osijek', 18.69, 45.55, 1], ['Karlovac', 15.55, 45.49, 1], ['Slavonski Brod', 18.01, 45.16, 1], ['Rijeka', 14.44, 45.33, 1],
      ['Pula', 13.85, 44.87, 1], ['Sisak', 16.37, 45.48, 1]],
    'Drava Banovina': [['Ljubljana', 14.51, 46.05, 5], ['Novo Mesto', 15.17, 45.80, 1]],
  },
  BUL: {
    'Western Bulgaria': [['Sofia', 23.32, 42.70, 20], ['Kyustendil', 22.69, 42.28, 1], ['Gorna Dzhumaya', 23.10, 42.02, 1], ['Petrich', 23.21, 41.40, 1], ['Samokov', 23.55, 42.34, 1],
      ['Vidin', 22.87, 43.99, 3], ['Vratsa', 23.55, 43.21, 1], ['Lom', 23.24, 43.83, 1], ['Nevrokop', 23.73, 41.57, 1], ['Bansko', 23.49, 41.84, 1]],
    'Moesia': [['Pleven', 24.62, 43.42, 3], ['Ruse', 25.97, 43.85, 5], ['Veliko Tarnovo', 25.63, 43.08, 5], ['Shumen', 26.92, 43.27, 3], ['Silistra', 27.26, 44.11, 3],
      ['Dobrich', 27.83, 43.57, 1], ['Svishtov', 25.35, 43.62, 1], ['Lovech', 24.72, 43.14, 1], ['Gabrovo', 25.32, 42.87, 1], ['Razgrad', 26.52, 43.53, 1], ['Preslav', 26.81, 43.16, 3]],
    'Eastern Rumelia': [['Plovdiv', 24.75, 42.14, 10], ['Stara Zagora', 25.63, 42.43, 3], ['Sliven', 26.32, 42.68, 1], ['Yambol', 26.51, 42.48, 1], ['Haskovo', 25.56, 41.93, 1],
      ['Pazardzhik', 24.33, 42.19, 1], ['Svilengrad', 26.20, 41.77, 1], ['Kazanlak', 25.39, 42.62, 1], ['Elhovo', 26.57, 42.17, 1], ['Karlovo', 24.81, 42.64, 1]],
    'Rhodope': [['Kardzhali', 25.37, 41.65, 1], ['Pashmakli', 24.70, 41.58, 1], ['Zlatograd', 25.10, 41.38, 1], ['Ivaylovgrad', 26.12, 41.53, 1], ['Devin', 24.40, 41.74, 1]],
    'Black Sea Coast': [['Varna', 27.91, 43.21, 10], ['Burgas', 27.47, 42.50, 5], ['Nesebar', 27.73, 42.66, 3], ['Sozopol', 27.70, 42.42, 1], ['Malko Tarnovo', 27.53, 41.98, 1], ['Balchik', 28.16, 43.41, 1]],
  },
  TUR: {
    // --- the Straits theatre (north of 39.45°N) ---
    'Eastern Thrace': [['Constantinople', 28.98, 41.01, 30], ['Adrianople', 26.56, 41.68, 5], ['Rodosto', 27.51, 40.98, 1], ['Gallipoli', 26.67, 40.41, 3], ['Kirklareli', 27.22, 41.73, 1],
      ['Arcadiopolis', 27.36, 41.40, 1], ['Corlu', 27.80, 41.16, 1], ['Chataldja', 28.46, 41.14, 1], ['Selymbria', 28.25, 41.07, 1], ['Uzunkopru', 26.69, 41.27, 1],
      ['Kesan', 26.64, 40.85, 1], ['Ainos', 26.08, 40.72, 1], ['Bizye', 27.77, 41.57, 1], ['Midye', 28.09, 41.63, 1]],
    'Bithynia': [['Nicomedia', 29.92, 40.77, 5], ['Nicaea', 29.72, 40.43, 5], ['Prusa', 29.06, 40.19, 10], ['Adapazari', 30.40, 40.78, 1], ['Bolu', 31.61, 40.74, 1],
      ['Sile', 29.61, 41.18, 1], ['Bilecik', 29.98, 40.14, 1], ['Heraclea Pontica', 31.42, 41.28, 1]],
    'Mysia': [['Troy', 26.24, 39.96, 3], ['Canakkale', 26.41, 40.15, 3], ['Balikesir', 27.88, 39.65, 3], ['Panormos', 27.98, 40.35, 1], ['Adramyttium', 27.02, 39.60, 1],
      ['Biga', 27.24, 40.23, 1], ['Dorylaeum', 30.52, 39.78, 5], ['Mustafakemalpasa', 28.41, 40.04, 1]],
    'Galatia': [['Ankara', 32.85, 39.93, 20], ['Gangra', 33.62, 40.60, 1], ['Gordion', 32.15, 39.58, 1], ['Kirikkale', 33.51, 39.85, 1], ['Yozgat', 34.81, 39.82, 1],
      ['Nallihan', 31.35, 40.19, 1], ['Sivrihisar', 31.54, 39.60, 1]],
    'Paphlagonia': [['Kastamonu', 33.78, 41.38, 3], ['Sinope', 35.15, 42.03, 3], ['Zonguldak', 31.79, 41.45, 1], ['Amastris', 32.39, 41.75, 1], ['Inebolu', 33.76, 41.98, 1],
      ['Safranbolu', 32.69, 41.25, 1], ['Boyabat', 34.77, 41.47, 1]],
    'Western Pontus': [['Amisos', 36.33, 41.29, 5], ['Amaseia', 35.83, 40.65, 3], ['Corum', 34.95, 40.55, 1], ['Tokat', 36.55, 40.31, 1], ['Sebasteia', 37.02, 39.75, 5],
      ['Bafra', 35.91, 41.57, 1], ['Neocaesarea', 36.95, 40.59, 1], ['Unye', 37.29, 41.13, 1], ['Zara', 37.76, 39.90, 1]],
    'Eastern Pontus': [['Trebizond', 39.72, 41.00, 10], ['Kerasous', 38.39, 40.91, 3], ['Rize', 40.52, 41.02, 1], ['Ordu', 37.88, 40.98, 1], ['Gumushane', 39.48, 40.46, 1],
      ['Bayburt', 40.23, 40.26, 1], ['Hopa', 41.43, 41.39, 1], ['Koloneia', 38.42, 40.29, 1], ['Artvin', 41.82, 41.18, 1]],
    'Upper Armenia': [['Theodosiopolis', 41.27, 39.90, 5], ['Erzincan', 39.49, 39.75, 3], ['Kars', 43.10, 40.60, 3], ['Ani', 43.57, 40.51, 3], ['Ardahan', 42.70, 41.11, 1],
      ['Agri', 43.05, 39.72, 1], ['Igdir', 44.04, 39.92, 1], ['Oltu', 41.99, 40.55, 1], ['Sarikamis', 42.59, 40.33, 1], ['Dogubayazit', 44.08, 39.55, 1], ['Tercan', 40.39, 39.78, 1]],
    // --- the Aegean theatre (south of 39.45°N, west of 31.8°E) ---
    'Ionia & Lydia': [['Smyrna', 27.14, 38.42, 20], ['Ephesus', 27.34, 37.94, 5], ['Sardis', 28.04, 38.49, 3], ['Magnesia', 27.43, 38.61, 3], ['Philadelphia', 28.52, 38.35, 3],
      ['Pergamon', 27.18, 39.12, 5], ['Tralles', 27.85, 37.85, 3], ['Miletus', 27.28, 37.53, 3], ['Phocaea', 26.75, 38.67, 1], ['Cesme', 26.30, 38.32, 1],
      ['Kydonies', 26.69, 39.31, 1], ['Thyatira', 27.84, 38.92, 1], ['Odemis', 27.97, 38.23, 1], ['Usak', 29.41, 38.68, 1], ['Simav', 28.98, 39.09, 1], ['Nazilli', 28.32, 37.91, 1]],
    'Caria & Lycia': [['Halicarnassus', 27.43, 37.03, 3], ['Mugla', 28.36, 37.22, 1], ['Attaleia', 30.71, 36.89, 5], ['Makri', 29.12, 36.62, 1], ['Marmaris', 28.27, 36.85, 1],
      ['Myra', 29.98, 36.25, 3], ['Laodicea', 29.09, 37.78, 3], ['Kas', 29.64, 36.20, 1], ['Mylasa', 27.78, 37.32, 1], ['Cnidus', 27.69, 36.73, 1],
      ['Elmali', 29.92, 36.74, 1], ['Burdur', 30.29, 37.72, 1], ['Tavas', 29.07, 37.57, 1], ['Side', 31.39, 36.77, 1]],
    'Phrygia': [['Amorium', 31.29, 39.02, 5], ['Akroinon', 30.54, 38.76, 3], ['Kotyaion', 29.98, 39.42, 3], ['Isparta', 30.55, 37.76, 1], ['Sozopolis', 30.45, 38.08, 1],
      ['Philomelion', 31.42, 38.36, 1], ['Apamea', 30.17, 38.07, 1], ['Sandikli', 30.27, 38.47, 1], ['Polybotos', 31.05, 38.71, 1]],
    // --- the Levantine theatre (south of 39.45°N, east of 31.8°E) ---
    'Lycaonia': [['Iconium', 32.48, 37.87, 10], ['Laranda', 33.22, 37.18, 1], ['Aksaray', 34.03, 38.37, 1], ['Herakleia Kybistra', 34.05, 37.51, 1], ['Cihanbeyli', 32.92, 38.66, 1],
      ['Seydisehir', 31.85, 37.42, 1], ['Kulu', 33.08, 39.09, 1]],
    'Cappadocia': [['Caesarea', 35.48, 38.72, 10], ['Nigde', 34.68, 37.97, 1], ['Nevsehir', 34.71, 38.62, 1], ['Kirsehir', 34.16, 39.15, 1], ['Pinarbasi', 36.39, 38.72, 1],
      ['Bogazliyan', 35.25, 39.19, 1], ['Kangal', 37.39, 39.23, 1], ['Gurun', 37.27, 38.72, 1], ['Tephrike', 38.11, 39.37, 1]],
    'Cilicia': [['Adana', 35.32, 37.00, 10], ['Tarsus', 34.90, 36.92, 5], ['Mersin', 34.63, 36.80, 3], ['Seleucia', 33.93, 36.38, 3], ['Anamur', 32.84, 36.08, 1],
      ['Alanya', 32.00, 36.54, 1], ['Sis', 35.82, 37.45, 1], ['Osmaniye', 36.25, 37.07, 1], ['Mut', 33.40, 36.64, 1], ['Ermenek', 32.89, 36.64, 1]],
    'Antioch & the Amanus': [['Antioch', 36.16, 36.20, 15], ['Alexandretta', 36.17, 36.59, 3], ['Aintab', 37.38, 37.07, 5], ['Germanikeia', 36.94, 37.58, 3], ['Kilis', 37.12, 36.72, 1],
      ['Islahiye', 36.63, 37.03, 1]],
    'Euphratesia': [['Melitene', 38.31, 38.35, 5], ['Edessa (Urfa)', 38.79, 37.16, 5], ['Samosata', 38.48, 37.58, 1], ['Adiyaman', 38.28, 37.76, 1], ['Kharput', 39.22, 38.67, 1],
      ['Birecik', 37.98, 37.03, 1], ['Harran', 39.03, 36.86, 1], ['Arapgir', 38.49, 39.04, 1], ['Elbistan', 37.19, 38.20, 1], ['Siverek', 39.31, 37.75, 1]],
    'Upper Mesopotamia': [['Amida', 40.23, 37.91, 5], ['Mardin', 40.74, 37.31, 3], ['Nisibis', 41.22, 37.07, 1], ['Martyropolis', 41.01, 38.14, 1], ['Siirt', 41.94, 37.93, 1],
      ['Cizre', 42.19, 37.33, 1], ['Midyat', 41.37, 37.42, 1], ['Ergani', 39.76, 38.27, 1], ['Capakcur', 40.50, 38.89, 1], ['Dersim', 39.55, 39.11, 1], ['Viransehir', 39.76, 37.23, 1]],
    'Vaspurakan & Taron': [['Van', 43.40, 38.50, 5], ['Mus', 41.49, 38.73, 3], ['Bitlis', 42.11, 38.40, 1], ['Manzikert', 42.54, 39.15, 3], ['Chliat', 42.48, 38.78, 1],
      ['Ercis', 43.36, 39.05, 1], ['Hakkari', 43.74, 37.57, 1], ['Baskale', 44.02, 38.05, 1], ['Varto', 41.45, 39.17, 1], ['Yuksekova', 44.29, 37.57, 1], ['Sirnak', 42.46, 37.52, 1]],
  },
  ITA: {
    'Apulia': [['Bari', 16.87, 41.12, 10], ['Taranto', 17.23, 40.47, 5], ['Brindisi', 17.94, 40.63, 5], ['Lecce', 18.17, 40.35, 3], ['Otranto', 18.49, 40.15, 3],
      ['Foggia', 15.54, 41.46, 3], ['Barletta', 16.28, 41.32, 1], ['Monopoli', 17.30, 40.95, 1], ['Altamura', 16.55, 40.83, 1], ['Leuca', 18.36, 39.80, 1],
      ['Troia', 15.31, 41.36, 1], ['Manfredonia', 15.92, 41.63, 1], ['Vieste', 16.18, 41.88, 1]],
    'Lucania': [['Potenza', 15.80, 40.64, 3], ['Matera', 16.60, 40.67, 3], ['Melfi', 15.65, 40.99, 1], ['Policoro', 16.67, 40.21, 1], ['Lagonegro', 15.76, 40.13, 1]],
    'Calabria': [['Reggio', 15.65, 38.11, 5], ['Catanzaro', 16.59, 38.91, 3], ['Cosenza', 16.25, 39.30, 3], ['Crotone', 17.12, 39.08, 3], ['Rossano', 16.63, 39.58, 3],
      ['Gerace', 16.22, 38.27, 1], ['Vibo Valentia', 16.10, 38.68, 1], ['Stilo', 16.47, 38.48, 1], ['Scalea', 15.79, 39.81, 1], ['Castrovillari', 16.20, 39.81, 1]],
    'Campania': [['Naples', 14.25, 40.84, 20], ['Salerno', 14.76, 40.68, 5], ['Benevento', 14.78, 41.13, 3], ['Capua', 14.21, 41.11, 3], ['Amalfi', 14.60, 40.63, 3],
      ['Gaeta', 13.57, 41.21, 3], ['Avellino', 14.79, 40.91, 1], ['Agropoli', 14.99, 40.35, 1], ['Sapri', 15.63, 40.07, 1], ['Campobasso', 14.66, 41.56, 1], ['Terracina', 13.25, 41.29, 1]],
    'Sicily': [['Palermo', 13.36, 38.12, 15], ['Syracuse', 15.29, 37.08, 5], ['Messina', 15.55, 38.19, 5], ['Catania', 15.09, 37.50, 10], ['Agrigento', 13.58, 37.31, 3],
      ['Trapani', 12.51, 38.02, 3], ['Taormina', 15.28, 37.85, 1], ['Enna', 14.28, 37.57, 3], ['Marsala', 12.44, 37.80, 1], ['Caltanissetta', 14.06, 37.49, 1],
      ['Ragusa', 14.73, 36.93, 1], ['Gela', 14.25, 37.07, 1], ['Cefalu', 14.02, 38.04, 1], ['Sciacca', 13.08, 37.51, 1], ['Corleone', 13.30, 37.81, 1], ['Milazzo', 15.24, 38.22, 1]],
    'Latium & the Centre': [['Rome', 12.50, 41.90, 30], ['Perugia', 12.39, 43.11, 1], ['Ancona', 13.52, 43.62, 3], ['Pescara', 14.21, 42.46, 1], ["L'Aquila", 13.40, 42.35, 1],
      ['Rimini', 12.57, 44.06, 1], ['Ravenna', 12.20, 44.42, 3]],
    'Venetia': [['Venice', 12.34, 45.44, 10], ['Trieste', 13.77, 45.65, 5], ['Udine', 13.24, 46.07, 1], ['Treviso', 12.25, 45.67, 1]],
  },
  GBR: {
    'Cyprus': [['Nicosia', 33.37, 35.17, 5], ['Famagusta', 33.94, 35.12, 3], ['Limassol', 33.04, 34.68, 3], ['Larnaca', 33.63, 34.92, 1], ['Paphos', 32.42, 34.77, 3],
      ['Kyrenia', 33.32, 35.34, 1], ['Morphou', 32.99, 35.20, 1], ['Polis', 32.43, 35.04, 1], ['Rizokarpaso', 34.38, 35.60, 1], ['Troodos', 32.87, 34.93, 1]],
    'Malta': [['Valletta', 14.51, 35.90, 5]],
  },
  FRA: {
    'Syria': [['Aleppo', 37.16, 36.20, 10], ['Latakia', 35.78, 35.52, 3], ['Homs', 36.72, 34.73, 3], ['Hama', 36.75, 35.13, 1], ['Tartus', 35.89, 34.89, 1],
      ['Deir ez-Zor', 40.14, 35.33, 1], ['Raqqa', 39.01, 35.95, 1], ['Palmyra', 38.28, 34.56, 3], ['Qamishli', 41.22, 37.05, 1], ['Hasakah', 40.74, 36.50, 1]],
    'Lebanon': [['Tripolis of Syria', 35.84, 34.44, 3]],
  },
  ROM: {
    'Wallachia': [['Bucharest', 26.10, 44.43, 15], ['Craiova', 23.80, 44.32, 3], ['Ploiesti', 26.02, 44.94, 3], ['Turnu Severin', 22.66, 44.63, 1], ['Giurgiu', 25.97, 43.90, 1]],
    'Dobruja': [['Constanta', 28.65, 44.18, 5], ['Tulcea', 28.80, 45.18, 1]],
    'Transylvania & Banat': [['Brasov', 25.60, 45.65, 3], ['Sibiu', 24.15, 45.80, 1], ['Timisoara', 21.23, 45.75, 3]],
    'Moldavia': [['Galati', 28.05, 45.44, 3], ['Focsani', 27.18, 45.70, 1], ['Cahul', 28.19, 45.90, 1]],
  },
  HUN: { 'Hungary': [['Pecs', 18.23, 46.07, 1]] },
  SOV: {
    'Crimea': [['Sevastopol', 33.52, 44.62, 5], ['Simferopol', 34.10, 44.95, 1], ['Kerch', 36.47, 45.36, 1], ['Feodosia', 35.38, 45.03, 1]],
    'Ukraine': [['Izmail', 28.84, 45.35, 1]],
    'Kuban': [['Krasnodar', 38.98, 45.04, 3], ['Novorossiysk', 37.77, 44.72, 1], ['Sochi', 39.72, 43.60, 1], ['Maykop', 40.10, 44.61, 1], ['Stavropol', 41.97, 45.04, 1],
      ['Nalchik', 43.62, 43.48, 1], ['Ordzhonikidze', 44.68, 43.02, 1]],
    'Georgian SSR': [['Tbilisi', 44.80, 41.72, 10], ['Batumi', 41.64, 41.64, 3], ['Kutaisi', 42.70, 42.27, 1], ['Sukhumi', 41.02, 43.00, 1], ['Akhaltsikhe', 42.99, 41.64, 1]],
    'Armenian SSR': [['Yerevan', 44.51, 40.18, 5], ['Leninakan', 43.85, 40.79, 1]],
  },
  IRQ: { 'Assyria': [['Mosul', 43.13, 36.34, 5], ['Erbil', 44.01, 36.19, 1], ['Kirkuk', 44.39, 35.47, 3], ['Zakho', 42.69, 37.14, 1], ['Tikrit', 43.68, 34.60, 1], ['Sinjar', 41.87, 36.32, 1]] },
  IRN: { 'Azerbaijan': [['Urmia', 45.07, 37.55, 1], ['Khoy', 44.95, 38.55, 1], ['Maku', 44.52, 39.29, 1]] },
};

// Naval theatres: the stretch of the home coast (and the islands) that faces each sea
const THRACIAN_COAST = [[25.45, 40.93], [25.9, 40.82], [26.05, 40.72], [25.6, 40.48]];
const IONIAN_COAST = [[19.85, 39.75], [20.2, 39.5], [20.45, 39.25], [20.72, 38.95], [20.75, 38.6], [21.0, 38.35], [21.25, 38.15], [21.15, 37.85], [21.4, 37.6], [21.6, 37.25], [21.65, 36.85]];
const AEGEAN_COAST = [[23.05, 39.75], [23.3, 39.3], [23.7, 39.15], [24.55, 38.9], [25.2, 39.85], [26.2, 39.25], [26.4, 39.0], [26.05, 38.4], [26.2, 37.6], [26.85, 37.72], [25.4, 37.1], [24.93, 37.44], [24.85, 37.85], [24.93, 37.44], [24.5, 37.25], [24.45, 36.72]];
const CRETAN_COAST = [[27.1, 36.82], [28.0, 36.3], [27.15, 35.6], [26.3, 35.1], [25.0, 34.95], [23.6, 35.25], [23.0, 36.2], [23.15, 36.45], [22.6, 36.7], [22.48, 36.4]];

// Fronts. `subs` = modern-country polygons that make up the enemy objective zone; `box` trims them to a rectangle.
export const FRONTS = [
  { id: 'epr', name: 'Epirus Front', enemy: 'ALB', enemyName: 'Albania', subs: ['Albania'], defaultLabel: 'School',
    satrapy: 'Dyrrhachion & Northern Epirus', hq: 'Ioannina' },
  // Sirmium on the Sava and the Danube line; Croatia south of 45.15°N stands for Byzantine Dalmatia and its vassal hinterland
  { id: 'mac', name: 'Macedonian Front', enemy: 'YUG', enemyName: 'Yugoslavia', subs: ['Macedonia', 'Kosovo', 'Serbia', 'Montenegro', 'Bosnia and Herz.', 'Croatia'],
    box: [14.2, 40.5, 23.3, 45.15], defaultLabel: 'Family', satrapy: 'Boulgaria, Sirmion & Dalmatia', hq: 'Thessaloniki' },
  { id: 'thr', name: 'Thracian Front', enemy: 'BUL', enemyName: 'Bulgaria', subs: ['Bulgaria'], defaultLabel: 'Partner',
    satrapy: 'Paristrion & Philippoupolis', hq: 'Serres' },
  { id: 'str', name: 'Straits Theatre', enemy: 'TUR', enemyName: 'Turkey', naval: true, subs: ['Turkey'], box: [25.5, 39.45, 45.2, 42.4],
    coast: THRACIAN_COAST, coastKm: 40, defaultLabel: 'Work', satrapy: 'Thrace, Bithynia & Pontus', hq: 'Alexandroupoli' },
  // the Catepanate (Apulia, Lucania, Calabria), the Lombard principalities that acknowledged Basil, and Sicily
  { id: 'ion', name: 'Ionian Sea Theatre', enemy: 'ITA', enemyName: 'Regia Marina', naval: true, subs: ['Italy'], box: [12.2, 36.4, 19.0, 41.55],
    coast: IONIAN_COAST, coastKm: 60, defaultLabel: 'Health', satrapy: 'the Catepanate of Italy & Sicily', hq: 'Patras' },
  { id: 'aeg', name: 'Aegean Sea Theatre', enemy: 'TUR', enemyName: 'Turkish Navy', naval: true, subs: ['Turkey'], box: [25.5, 35.8, 31.8, 39.45],
    coast: AEGEAN_COAST, coastKm: 34, defaultLabel: 'Friends', satrapy: 'Ionia, Caria & Phrygia', hq: 'Mytilene' },
  { id: 'lev', name: 'Levantine Sea Theatre', enemy: 'GBR', enemyName: 'Royal Navy', naval: true,
    subs: ['Cyprus', 'N. Cyprus', 'Cyprus U.N. Buffer Zone', 'Dhekelia', 'Akrotiri', 'Turkey'], box: [31.8, 34.3, 45.2, 39.45],
    coast: CRETAN_COAST, coastKm: 45, defaultLabel: 'Self', satrapy: 'Cyprus, Cilicia & Antioch', hq: 'Chania' },
];

// Terrain features. ranges: polyline + half-width in degrees
export const RANGES = [
  { name: 'Pindus', w: 0.38, pts: [[20.6, 40.6], [20.9, 40.15], [21.15, 39.75], [21.35, 39.3], [21.6, 38.95], [21.9, 38.7]] },
  { name: 'Olympus', w: 0.18, pts: [[22.15, 40.25], [22.4, 40.05], [22.55, 39.85]] },
  { name: 'Ossa & Pelion', w: 0.14, pts: [[22.7, 39.8], [23.0, 39.5], [23.15, 39.3]] },
  { name: 'Parnassus', w: 0.2, pts: [[22.0, 38.75], [22.55, 38.53], [23.1, 38.35]] },
  { name: 'Vermion', w: 0.16, pts: [[21.95, 40.85], [22.05, 40.4]] },
  { name: 'Voras', w: 0.14, pts: [[21.5, 40.92], [22.1, 41.12], [22.4, 41.15]] },
  { name: 'Belasica', w: 0.1, pts: [[22.75, 41.35], [23.3, 41.35]] },
  { name: 'Rhodope', w: 0.32, pts: [[23.6, 41.75], [24.3, 41.6], [25.0, 41.45], [25.9, 41.4]] },
  { name: 'Pirin & Rila', w: 0.25, pts: [[23.4, 42.25], [23.45, 41.6]] },
  { name: 'Taygetus', w: 0.14, pts: [[22.25, 37.25], [22.35, 36.95], [22.4, 36.55]] },
  { name: 'Parnon', w: 0.12, pts: [[22.55, 37.35], [22.85, 36.95]] },
  { name: 'Arcadian Highlands', w: 0.2, pts: [[21.9, 38.0], [22.2, 37.75], [22.2, 37.45]] },
  { name: 'White Mountains & Ida', w: 0.16, pts: [[23.8, 35.32], [24.3, 35.28], [24.85, 35.22], [25.5, 35.13], [26.0, 35.12]] },
  { name: 'Haemus', w: 0.3, pts: [[22.6, 43.35], [23.6, 42.85], [25.0, 42.75], [26.3, 42.8], [27.4, 42.75]] },
  { name: 'Dinaric Alps', w: 0.6, pts: [[14.8, 45.2], [16.3, 44.1], [17.8, 43.5], [19.2, 42.85], [20.0, 42.4]] },
  { name: 'Sar & Korab', w: 0.25, pts: [[20.45, 41.5], [20.7, 41.9], [21.1, 42.15]] },
  { name: 'Carpathians', w: 0.4, pts: [[22.4, 45.3], [24.5, 45.5], [25.9, 45.5], [26.5, 46.1]] },
  { name: 'Apennines', w: 0.35, pts: [[12.4, 43.7], [13.4, 42.5], [14.3, 41.6], [15.5, 40.6], [16.1, 39.7], [16.4, 38.9], [16.0, 38.2]] },
  { name: 'Nebrodi & Etna', w: 0.2, pts: [[13.9, 37.85], [14.6, 37.9], [15.1, 37.8]] },
  { name: 'Pontic Mountains', w: 0.5, pts: [[31.5, 41.0], [33.5, 41.3], [36.5, 40.8], [39.0, 40.6], [41.0, 40.8], [42.3, 41.2]] },
  { name: 'Taurus', w: 0.55, pts: [[29.3, 36.7], [30.6, 37.2], [32.5, 36.9], [34.5, 37.4], [36.5, 38.0], [38.6, 38.2]] },
  { name: 'Armenian Highlands', w: 0.9, pts: [[39.0, 39.3], [41.5, 39.4], [43.8, 39.0]] },
  { name: 'Hakkari', w: 0.45, pts: [[42.4, 37.7], [44.4, 37.5]] },
  { name: 'Amanus', w: 0.18, pts: [[36.2, 36.3], [36.55, 37.2]] },
  { name: 'Lebanon & Ansariyah', w: 0.22, pts: [[36.1, 34.2], [36.2, 35.7]] },
  { name: 'Troodos', w: 0.15, pts: [[32.6, 34.95], [33.1, 34.92]] },
  { name: 'Tmolus', w: 0.18, pts: [[27.6, 38.33], [28.6, 38.25]] },
  { name: 'Caucasus', w: 0.6, pts: [[37.6, 44.6], [40.0, 43.6], [42.5, 43.1], [44.6, 42.6]] },
  { name: 'Lesser Caucasus', w: 0.45, pts: [[42.2, 41.4], [44.6, 40.4]] },
];
export const DESERTS = [[39.6, 34.9, 2.4, 0.8, 'Syrian Desert'], [33.3, 38.6, 0.7, 0.45, 'Lycaonian Steppe']];
export const FORESTS = [[35.5, 41.4, 3.2, 0.35], [27.7, 41.9, 0.6, 0.25], [20.7, 44.1, 0.7, 0.4], [17.8, 45.0, 1.2, 0.3], [24.6, 45.2, 1.4, 0.35], [41.6, 42.2, 1.0, 0.5]];
export const MARSHES = [[29.2, 45.2, 0.6, 0.35], [37.9, 45.4, 0.6, 0.3], [13.0, 41.42, 0.25, 0.12], [26.12, 40.8, 0.14, 0.1]];

export const LAKES = [
  { name: 'Lake Prespa', pts: [[20.95, 40.98], [21.08, 40.98], [21.12, 40.85], [21.05, 40.78], [20.95, 40.85]] },
  { name: 'Lake Ohrid', pts: [[20.63, 41.12], [20.77, 41.09], [20.79, 40.95], [20.72, 40.9], [20.65, 40.98]] },
  { name: 'Lake Scutari', pts: [[19.1, 42.32], [19.3, 42.3], [19.45, 42.12], [19.42, 42.05], [19.25, 42.12], [19.12, 42.22]] },
  { name: 'Lake Trichonida', pts: [[21.44, 38.59], [21.6, 38.58], [21.68, 38.53], [21.55, 38.52], [21.45, 38.55]] },
  { name: 'Lake Volvi', pts: [[23.35, 40.7], [23.58, 40.69], [23.58, 40.65], [23.36, 40.66]] },
  { name: 'Lake Koroneia', pts: [[23.07, 40.7], [23.22, 40.69], [23.22, 40.66], [23.08, 40.66]] },
  { name: 'Lake Vegoritida', pts: [[21.74, 40.82], [21.82, 40.8], [21.82, 40.68], [21.76, 40.7]] },
  { name: 'Lake Kerkini', pts: [[23.05, 41.26], [23.2, 41.25], [23.23, 41.16], [23.1, 41.15]] },
  { name: 'Lake Iznik', pts: [[29.35, 40.48], [29.66, 40.47], [29.66, 40.4], [29.36, 40.4]] },
  { name: 'Lake Tuz', pts: [[33.2, 39.0], [33.6, 38.9], [33.6, 38.5], [33.3, 38.5]] },
  { name: 'Lake Egirdir', pts: [[30.8, 38.25], [30.92, 38.25], [30.9, 37.88], [30.8, 37.9]] },
  { name: 'Lake Beysehir', pts: [[31.35, 37.95], [31.6, 37.9], [31.65, 37.55], [31.45, 37.55]] },
  { name: 'Lake Van', pts: [[42.3, 38.45], [42.42, 38.72], [42.75, 38.82], [43.0, 38.95], [43.3, 38.98], [43.55, 38.92], [43.45, 38.7], [43.27, 38.55], [43.25, 38.38], [43.0, 38.3], [42.6, 38.38]] },
];
export const RIVERS = [
  { name: 'Axios', pts: [[20.9, 41.8], [21.15, 42.0], [21.43, 41.98], [21.78, 41.72], [22.0, 41.5], [22.25, 41.41], [22.5, 41.14], [22.6, 40.95], [22.72, 40.65], [22.75, 40.5]] },
  { name: 'Aliakmon', pts: [[20.95, 40.35], [21.2, 40.45], [21.35, 40.2], [21.5, 40.05], [21.9, 40.1], [22.1, 40.25], [22.25, 40.45], [22.65, 40.48]] },
  { name: 'Pineios', pts: [[21.25, 39.75], [21.62, 39.69], [21.8, 39.53], [22.1, 39.55], [22.42, 39.63], [22.6, 39.88], [22.72, 39.93]] },
  { name: 'Acheloos', pts: [[21.2, 39.6], [21.35, 39.2], [21.3, 38.9], [21.3, 38.6], [21.1, 38.33]] },
  { name: 'Aoos', pts: [[21.1, 39.9], [20.75, 40.03], [20.35, 40.22], [20.02, 40.29], [19.7, 40.5], [19.33, 40.64]] },
  { name: 'Alfeios', pts: [[22.2, 37.4], [21.9, 37.55], [21.63, 37.63], [21.45, 37.61]] },
  { name: 'Evros', pts: [[23.8, 42.2], [24.33, 42.18], [24.75, 42.13], [25.3, 42.05], [25.9, 41.92], [26.2, 41.76], [26.56, 41.67], [26.6, 41.35], [26.33, 41.2], [26.2, 40.92], [26.05, 40.73]] },
  { name: 'Strymon', pts: [[23.2, 42.5], [22.9, 42.3], [23.1, 42.0], [23.25, 41.55], [23.35, 41.32], [23.22, 41.2], [23.5, 41.03], [23.75, 40.9], [23.86, 40.79]] },
  { name: 'Nestos', pts: [[23.6, 42.1], [23.5, 41.85], [23.75, 41.57], [24.1, 41.45], [24.5, 41.3], [24.75, 41.1], [24.8, 40.86]] },
  { name: 'Danube', pts: [[18.9, 46.2], [18.85, 45.9], [19.0, 45.35], [19.85, 45.24], [20.46, 44.83], [20.93, 44.68], [21.4, 44.77], [22.0, 44.5], [22.5, 44.7], [22.7, 44.2],
    [22.88, 43.99], [23.6, 43.8], [24.9, 43.7], [25.97, 43.87], [27.26, 44.13], [28.03, 44.35], [28.0, 45.2], [28.8, 45.22], [29.65, 45.15]] },
  { name: 'Sava', pts: [[15.7, 45.85], [16.4, 45.45], [17.2, 45.15], [18.0, 45.14], [18.7, 45.05], [19.6, 44.93], [20.44, 44.82]] },
  { name: 'Morava', pts: [[21.9, 42.9], [21.75, 43.4], [21.4, 43.7], [21.2, 44.2], [21.05, 44.7]] },
  { name: 'Sangarios', pts: [[31.0, 39.2], [32.0, 39.6], [31.2, 40.0], [30.3, 40.1], [30.5, 40.7], [30.65, 41.13]] },
  { name: 'Halys', pts: [[37.8, 39.9], [36.0, 39.4], [34.8, 38.7], [33.9, 39.4], [34.0, 40.6], [35.9, 41.7]] },
  { name: 'Maeander', pts: [[30.2, 38.1], [29.3, 37.95], [28.3, 37.87], [27.6, 37.75], [27.25, 37.53]] },
  { name: 'Euphrates', pts: [[40.6, 39.9], [39.5, 39.7], [38.8, 39.2], [38.75, 38.5], [38.5, 37.6], [37.98, 37.03], [38.2, 36.3], [39.0, 35.95], [40.15, 35.33], [41.0, 34.4], [41.9, 34.2]] },
  { name: 'Tigris', pts: [[39.6, 38.4], [40.2, 37.9], [41.2, 37.6], [42.2, 37.33], [43.13, 36.34], [43.3, 35.3], [43.7, 34.6], [43.85, 34.1]] },
];

// Railways. stage 0 = running in 1936; 1–4 = built as national infrastructure grows (several were planned and never built)
export const RAILWAYS = [
  { name: 'Piraeus–Athens–Thessaloniki Main Line', stage: 0, via: ['Piraeus', 'Athens', [23.6, 38.3], 'Thebes', 'Livadeia', [22.63, 38.62], [22.36, 38.89], [22.3, 39.13], 'Farsala', 'Larissa',
    [22.6, 39.88], [22.52, 40.1], 'Katerini', [22.53, 40.63], 'Thessaloniki'] },
  { name: 'Peloponnese Metre-Gauge (Piraeus–Patras–Kyparissia)', stage: 0, via: ['Piraeus', 'Athens', 'Eleusis', [23.34, 38.0], 'Corinth', [22.75, 38.01], [22.08, 38.25], 'Patras', [21.35, 37.8], 'Pyrgos', 'Kyparissia'] },
  { name: 'Peloponnese Metre-Gauge (Corinth–Tripoli–Kalamata)', stage: 0, via: ['Corinth', 'Argos', 'Tripoli', [22.14, 37.4], [22.0, 37.2], 'Kalamata'] },
  { name: 'Argos–Nafplio Branch', stage: 0, via: ['Argos', 'Nafplio'] },
  { name: 'Pyrgos–Olympia Branch', stage: 0, via: ['Pyrgos', 'Olympia'] },
  { name: 'Thessaly Railways (Volos–Kalambaka)', stage: 0, via: ['Volos', [22.75, 39.38], 'Farsala', 'Karditsa', 'Trikala', 'Kalambaka'] },
  { name: 'Volos–Larissa Line', stage: 0, via: ['Volos', [22.75, 39.38], 'Larissa'] },
  { name: 'Athens–Chalcis Branch', stage: 0, via: [[23.6, 38.3], 'Chalcis'] },
  { name: 'Athens–Lavrion Line', stage: 0, via: ['Athens', [23.87, 37.95], 'Lavrion'] },
  { name: 'Thessaloniki–Alexandroupoli Line', stage: 0, via: ['Thessaloniki', 'Kilkis', 'Doirani', [23.05, 41.27], 'Sidirokastro', 'Serres', [23.9, 41.03], 'Drama', [24.5, 41.27], [24.72, 41.2], 'Xanthi', 'Komotini',
    [25.75, 41.0], 'Alexandroupoli'] },
  { name: 'Evros Line', stage: 0, via: ['Alexandroupoli', [26.17, 40.9], 'Soufli', 'Didymoteicho', 'Orestiada'] },
  { name: 'Thessaloniki–Florina Line', stage: 0, via: ['Thessaloniki', [22.53, 40.63], 'Veria', [22.07, 40.63], 'Edessa', 'Amyntaio', 'Florina'] },
  { name: 'Thessaloniki–Idomeni Line', stage: 0, via: ['Thessaloniki', [22.57, 40.95], 'Idomeni'] },
  { name: 'North-Western Railway', stage: 0, via: ['Missolonghi', 'Agrinio'] },
  { name: 'Kozani Branch', stage: 1, via: ['Amyntaio', [21.68, 40.51], 'Kozani'] },
  { name: 'Kavala Branch', stage: 2, via: ['Drama', 'Kavala'] },
  { name: 'Western Line', stage: 2, via: ['Agrinio', [21.17, 38.86], 'Arta', 'Ioannina'] },
  { name: 'Epirus Line', stage: 3, via: ['Kalambaka', [21.18, 39.77], 'Ioannina', 'Igoumenitsa'] },
  { name: 'Laconia Line', stage: 3, via: ['Tripoli', 'Sparta', 'Gytheio'] },
  { name: 'Cretan Railway', stage: 4, via: ['Chania', 'Souda', 'Rethymno', [24.8, 35.4], 'Heraklion'] },
];

export const SEA_LABELS = [
  ['AEGEAN SEA', 25.1, 38.75, 1.0], ['IONIAN SEA', 18.6, 37.6, 1.2], ['MEDITERRANEAN SEA', 19.5, 34.9, 1.3], ['LEVANTINE SEA', 30.6, 34.75, 1.0],
  ['BLACK SEA', 34.0, 43.4, 1.3], ['ADRIATIC SEA', 16.3, 42.75, 0.9, 38], ['TYRRHENIAN SEA', 13.3, 39.7, 1.0], ['SEA OF CRETE', 25.0, 35.95, 0.7],
  ['Sea of Marmara', 28.0, 40.72, 0.5], ['Gulf of Corinth', 22.4, 38.22, 0.42], ['Libyan Sea', 24.6, 34.45, 0.7], ['Dardanelles', 26.0, 40.08, 0.42],
];
export const COUNTRY_LABELS = [['TUR', 'TURKEY', 33.6, 39.0, 15], ['BUL', 'BULGARIA', 25.3, 42.8, 11], ['YUG', 'YUGOSLAVIA', 19.3, 44.2, 12], ['ALB', 'ALBANIA', 20.05, 41.0, 7],
  ['ITA', 'ITALY', 14.6, 41.75, 12], ['ROM', 'ROMANIA', 25.0, 45.0, 12], ['SOV', 'SOVIET UNION', 40.0, 44.9, 11], ['FRA', 'SYRIA', 38.6, 35.3, 10], ['IRQ', 'IRAQ', 43.3, 35.4, 9],
  ['GBR', 'CYPRUS', 33.2, 35.0, 6], ['HUN', 'HUNGARY', 19.3, 46.0, 7]];
export const HOME_LABEL = [22.2, 39.05];

// Rough outline of the empire of Basil II in 1025 (with Sicily, see the note at the top), for the overlay
export const EMPIRE = [[14.9, 45.0], [16.0, 45.2], [17.5, 45.1], [19.0, 44.9], [20.4, 44.85], [21.4, 44.78], [22.5, 44.6], [22.7, 44.2], [22.9, 43.9], [24.0, 43.75], [25.4, 43.65],
  [26.0, 43.95], [27.3, 44.15], [28.0, 44.45], [28.1, 45.3], [29.7, 45.25], [28.8, 44.0], [28.7, 43.4], [28.0, 42.8], [28.2, 41.9], [29.2, 41.35], [31.4, 41.45], [33.3, 42.1],
  [35.2, 42.2], [36.7, 41.45], [38.5, 41.1], [40.0, 41.15], [41.5, 41.6], [42.6, 41.2], [42.9, 40.5], [43.3, 39.9], [44.4, 39.5], [44.6, 38.3], [44.3, 37.6], [43.0, 37.8],
  [42.0, 38.1], [41.0, 38.4], [40.0, 38.3], [39.2, 37.9], [38.9, 37.4], [38.2, 36.9], [37.5, 36.6], [37.0, 36.1], [36.6, 35.5], [36.3, 34.9], [35.9, 34.55], [34.8, 34.4],
  [32.2, 34.4], [31.4, 35.5], [30.3, 35.95], [28.6, 35.7], [27.0, 35.2], [26.4, 34.7], [24.0, 34.6], [22.8, 35.5], [21.5, 36.5], [20.3, 37.6], [19.3, 39.0], [18.7, 39.6],
  [17.3, 38.7], [16.2, 37.7], [15.5, 36.5], [13.5, 36.9], [12.2, 37.6], [12.3, 38.3], [14.0, 38.4], [15.3, 38.5], [15.5, 39.3], [14.9, 40.0], [13.9, 40.5], [13.2, 41.15],
  [13.7, 41.6], [15.0, 41.95], [16.3, 42.0], [17.5, 41.6], [18.4, 41.6], [18.3, 42.2], [16.5, 43.0], [15.0, 43.8], [14.4, 44.6]];

// where fleet counters sit on the map: our fleets by id, and "enemy:<front id>" for the enemy squadron on a naval front
export const FLEET_AT = { aegean: [23.95, 37.3], ionian: [20.3, 37.55], 'enemy:str': [28.0, 40.78], 'enemy:ion': [18.2, 38.8], 'enemy:aeg': [26.55, 37.97], 'enemy:lev': [30.6, 35.3] };

export const META = {
  name: 'Greece',
  long: 'Kingdom of Greece',
  empire: 'Byzantine Empire',
  year: 1936,
  blurb: 'Three mountain borders and four seas. Restore the empire of Basil II, from the Danube to Antioch.',
  pitch: 'a 1936 grand-strategy war map of Greece',
  flag: { type: 'h3', colors: ['#0d5eaf', '#f4f1e6', '#0d5eaf'] },
  regionWord: 'Theme',
  regions: {
    'Gegeria': 'Dyrrhachion', 'Myzeqe': 'Aulon', 'Northern Epirus': 'Dryinopolis',
    'Vardar Macedonia': 'Boulgaria', 'Kosovo & Raska': 'Rhaskia', 'Serbia': 'Sirmion', 'Montenegro': 'Dioklea', 'Bosnia': 'Bosona', 'Herzegovina': 'Zachlumia',
    'Dalmatia': 'Dalmatia', 'Croatia-Slavonia': 'Chrobatia',
    'Western Bulgaria': 'Triaditsa', 'Moesia': 'Paristrion', 'Eastern Rumelia': 'Philippoupolis', 'Rhodope': 'Achridos', 'Black Sea Coast': 'Mesembria',
    'Eastern Thrace': 'Thrake', 'Bithynia': 'Optimaton', 'Mysia': 'Opsikion', 'Galatia': 'Boukellarion', 'Paphlagonia': 'Paphlagonia', 'Western Pontus': 'Armeniakon',
    'Eastern Pontus': 'Chaldia', 'Upper Armenia': 'Iberia',
    'Ionia & Lydia': 'Thrakesion', 'Caria & Lycia': 'Kibyrrhaioton', 'Phrygia': 'Anatolikon',
    'Lycaonia': 'Seleukeia', 'Cappadocia': 'Kappadokia', 'Cilicia': 'Kilikia', 'Antioch & the Amanus': 'Antiocheia', 'Euphratesia': 'Melitene',
    'Upper Mesopotamia': 'Mesopotamia', 'Vaspurakan & Taron': 'Vaspurakan', 'Cyprus': 'Kypros',
    'Apulia': 'Longobardia', 'Lucania': 'Loukania', 'Calabria': 'Kalabria', 'Campania': 'Neapolis', 'Sicily': 'Sikelia',
  },
  capitalFalls: 'The government leaves Athens for Crete. The war goes on from Chania.',
  capitalFreed: 'Athens is free again. The flag flies over the Acropolis.',
  fightsOnFrom: 'Chania',
  honor: {
    epr: ['Epirus', 'Ioannina', 'Arta', 'Souli', 'Pindus', 'Bizani', 'Zagori', 'Preveza', 'Konitsa', 'Tzoumerka'],
    mac: ['Macedonia', 'Kozani', 'Florina', 'Kastoria', 'Veria', 'Edessa', 'Olympus', 'Vermion', 'Pella', 'Grevena'],
    thr: ['Serres', 'Drama', 'Kavala', 'Roupel', 'Nestos', 'Strymon', 'Rhodope', 'Pangaion', 'Xanthi', 'Nevrokopi'],
    str: ['Thrace', 'Evros', 'Komotini', 'Alexandroupoli', 'Didymoteicho', 'Soufli', 'Orestiada', 'Samothrace', 'Maroneia', 'Abdera'],
    ion: ['Ionian', 'Corfu', 'Kefalonia', 'Zakynthos', 'Lefkada', 'Ithaca', 'Patras', 'Achaea', 'Messenia', 'Navarino'],
    aeg: ['Archipelago', 'Lesbos', 'Chios', 'Samos', 'Lemnos', 'Cyclades', 'Euboea', 'Magnesia', 'Psara', 'Thessaly'],
    lev: ['Crete', 'Chania', 'Heraklion', 'Rethymno', 'Sfakia', 'Lasithi', 'Kythira', 'Mani', 'Laconia', 'Arkadi'],
  },
  commanders: {
    epr: 'Lt. Gen. Spyridon Zervakis', mac: 'Lt. Gen. Athanasios Kalogeras', thr: 'Lt. Gen. Leonidas Vasilakos',
    str: 'Adm. Themistoklis Marinakis', ion: 'Adm. Gerasimos Vlassopoulos', aeg: 'Adm. Miltiadis Kanellos', lev: 'Adm. Emmanouil Daskalakis',
  },
  oob: {
    epr: ['mtn', 'inf', 'mtn', 'art'], mac: ['inf', 'inf', 'cav', 'art'], thr: ['inf', 'inf', 'mtn', 'art'], str: ['inf', 'cav', 'mar', 'inf'],
    ion: ['mar', 'inf', 'art'], aeg: ['mar', 'inf', 'inf'], lev: ['mar', 'mtn', 'inf'],
  },
  guard: [['grd', 'Royal Guard Evzone Division “Evzones”'], ['arm', 'Athens Tank Battalion']],
  officerNames: {
    first: ['Georgios', 'Konstantinos', 'Ioannis', 'Dimitrios', 'Nikolaos', 'Panagiotis', 'Christos', 'Vasileios', 'Athanasios', 'Evangelos', 'Michail', 'Spyridon', 'Andreas',
      'Theodoros', 'Stylianos', 'Emmanouil'],
    last: ['Vlachos', 'Makris', 'Mavridis', 'Sarantis', 'Raptis', 'Galanis', 'Tsakiris', 'Kontos', 'Lekkas', 'Drosos', 'Kalantzis', 'Maniatis', 'Zafeiriou', 'Moraitis', 'Sideris', 'Floros'],
    ranks: { div: 'Maj. Gen.', bde: 'Col.', guard: 'Lt. Gen.' },
  },
  wings: [
    { name: '21st Pursuit Squadron', type: 'fighter', model: 'Avia BH-33', base: 'Tatoi', planes: 12 },
    { name: '1st Army Cooperation Squadron', type: 'cas', model: 'Breguet 19', base: 'Larissa', planes: 18 },
    { name: '3rd Army Cooperation Squadron', type: 'cas', model: 'Potez 25', base: 'Sedes', planes: 18 },
    { name: '31st Bombardment Squadron', type: 'bomber', model: 'Hawker Horsley', base: 'Tatoi', planes: 6 },
  ],
  newWingModels: { fighter: 'PZL P.24', cas: 'Henschel Hs 126', bomber: 'Bristol Blenheim' },
  fleets: [
    { id: 'aegean', name: 'Fleet of the Aegean', base: 'Salamis', sea: 'Aegean Sea', fronts: ['aeg', 'str', 'lev', 'thr'],
      ships: [['Georgios Averof', 'Armoured Cruiser'], ['Elli', 'Light Cruiser'], ['Hydra', 'Destroyer'], ['Spetsai', 'Destroyer'], ['Psara', 'Destroyer'],
        ['Kountouriotis', 'Destroyer'], ['Proteus', 'Submarine'], ['Nereus', 'Submarine'], ['Triton', 'Submarine'], ['Glafkos', 'Submarine']] },
    { id: 'ionian', name: 'Ionian Squadron', base: 'Patras', sea: 'Ionian Sea', fronts: ['ion', 'epr', 'mac'],
      ships: [['Aetos', 'Destroyer'], ['Ierax', 'Destroyer'], ['Leon', 'Destroyer'], ['Panthir', 'Destroyer'], ['Katsonis', 'Submarine'], ['Papanikolis', 'Submarine']] },
  ],
  shipNames: ['Vasilefs Georgios', 'Vasilissa Olga', 'Salamis', 'Kilkis', 'Lemnos', 'Thyella', 'Sfendoni', 'Aspis', 'Niki', 'Velos', 'Doxa', 'Navarinon', 'Miaoulis', 'Kanaris', 'Kriti',
    'Themistoklis', 'Pindos', 'Adrias', 'Delfin', 'Xifias', 'Amfitriti', 'Matrozos', 'Pipinos', 'Argonaftis'],
  operations: ['Marathon', 'Salamis', 'Plataea', 'Thermopylae', 'Leonidas', 'Achilles', 'Odysseus', 'Herakles', 'Argo', 'Akritas', 'Navarino', 'Bizani', 'Keravnos', 'Phoenix', 'Aegis',
    'Olympus'],
  enemyOperations: ['Minotaur', 'Cyclops', 'Chimera', 'Cerberus', 'Medusa', 'Scylla', 'Charybdis', 'Typhon', 'Xerxes', 'Harpy', 'Siren', 'Gorgon'],
  nicknames: ['Lions', 'Eagles', 'Hoplites', 'Akritai', 'Myrmidons', 'Argonauts', 'Titans', 'Centaurs'],
  stateStart: {
    'Attica & Boeotia': [4, 5, 2, 2], 'Roumeli & Euboea': [2, 1, 0, 0], 'Peloponnese': [2, 2, 0, 1], 'Thessaly': [2, 1, 1, 0], 'Epirus': [1, 0, 0, 0],
    'Western Macedonia': [1, 0, 0, 0], 'Central Macedonia': [3, 3, 1, 1], 'Eastern Macedonia': [2, 1, 0, 0], 'Thrace': [1, 0, 0, 0], 'Ionian Islands': [1, 0, 0, 0],
    'Aegean Islands': [1, 1, 0, 0], 'Cyclades': [1, 0, 0, 1], 'Crete': [1, 1, 0, 0], 'Dodecanese': [1, 0, 0, 0],
  },
  weather: { epr: 'snow', mac: 'snow', thr: 'snow', lev: 'heat' },
  enemyAdjectives: { ALB: 'Albanian', YUG: 'Yugoslav', BUL: 'Bulgarian', TUR: 'Turkish', ITA: 'Italian', GBR: 'British' },
  ranks: [['Stratiotis', 'Private'], ['Dekaneas', 'Corporal'], ['Lochias', 'Sergeant'], ['Anthypolochagos', 'Second Lieutenant'], ['Ypolochagos', 'Lieutenant'],
    ['Lochagos', 'Captain'], ['Tagmatarchis', 'Major'], ['Antisyntagmatarchis', 'Lieutenant Colonel'], ['Syntagmatarchis', 'Colonel'], ['Ypostratigos', 'Major General'],
    ['Antistratigos', 'Lieutenant General'], ['Stratigos', 'General']],
  landmarks: [
    { city: 'Constantinople', medal: 'Double-Headed Eagle', desc: 'Enter Constantinople, the Queen of Cities' },
    { city: 'Antioch', medal: 'Keys of Antioch', desc: 'Reach Antioch, the seat of the doux of the East' },
  ],
  medalNames: {
    ten: 'Cross of Valour', fifty: 'Order of the Redeemer', decisive: 'War Cross', week: 'Order of the Phoenix', month: 'Order of George I', phoenix: 'Anastasis',
    allfronts: 'Seven Themes', defender: 'Defender of Athens', satrap: 'Strategos', comeback: 'Digenis Akritas', thirty: 'Chronographia', empire: 'Basileus Autokrator',
    haftkhan: 'Twelve Labours', rasti: 'Parrhesia', qanat: 'Aqueduct Builder', hundred: 'Alexiad', hundreddays: 'Order of Saints George and Constantine',
    elite: 'The Sacred Band', kaveh: 'Liberator of Athens', marshal: 'Marshal’s Baton',
  },
  masthead: 'EFIMERIS TOU STRATOU',
  days: [
    { month: 1, day: 1, text: 'Kali Chronia. Saint Basil’s day: cut the vasilopita and find the coin.' },
    { month: 3, day: 25, text: 'Chronia polla. The twenty-fifth of March: the banner of 1821 is raised again on every front.' },
    { month: 5, day: 29, text: 'On this day in 1453 the City fell. The lamps of Hagia Sophia are waiting.' },
    { month: 8, day: 15, text: 'Dekapentavgoustos. The bells ring on every island of the Archipelago.' },
  ],
  motto: 'Πάλι με χρόνους, με καιρούς, πάλι δικά μας θα ’ναι — “Again, with the years, with time, they will be ours once more.”',
};
