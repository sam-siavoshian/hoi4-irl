// Turkey, 1936. The Republic of Turkey between the Balkans, the Caucasus and the Arab lands; formable: the Ottoman
// Empire at its height (c. 1683). Coordinates are [lon, lat]. City tuple: [name, lon, lat, vp?, flags?]
// flags: P port, N naval base, A airbase, S supply hub, R heavy industry, F fort, C capital
//
// Honest approximations forced by building 1936 states out of whole modern countries:
//  - Hatay (the Sanjak of Alexandretta: İskenderun, Antakya) was under French mandate until 1939, but it is part of the
//    modern Turkey polygon and cannot be separated. It is drawn as Turkish; its cities sit in the Çukurova state.
//  - The Dodecanese (Rhodes, Kos…) were Italian in 1936; they are part of the modern Greece polygon and drawn as Greek.
//  - Southern Dobruja (Silistra, Dobrich) was Romanian in 1936 and is drawn as Bulgarian; Bessarabia (modern Moldova) is
//    correctly Romanian, but the Budjak (Izmail, Akkerman), northern Bukovina, Galicia and Transcarpathia are inside
//    modern Ukraine and so are drawn as Soviet. The Moldavian ASSR east of the Dniester ends up Romanian.
//  - Yugoslavia is the six modern successor states plus Kosovo; Istria, Rijeka and Zadar (Italian in 1936) come with it.
//  - Trans-Jordan, Palestine, Cyprus, Malta, Kuwait, Bahrain, Qatar and the Trucial coast are one British tag.
//  - Italy and Italian Libya are two tags so the Libyan regions can be named; French Chad and Niger are one tag.
export const ID = 'turkey';
export const EXTENT = { lon0: 14, lon1: 52, lat0: 20.5, lat1: 49 };
export const HOME = 'TUR';
export const CAPITAL = 'Ankara';

// ---------- 1936 political entities built from modern polygons ----------
export const COUNTRIES = {
  TUR: { name: 'Turkey', long: 'Republic of Turkey', color: '#b9544a', from: ['Turkey'], spacing: 0.66 },
  SOV: { name: 'Soviet Union', long: 'Union of Soviet Socialist Republics (Russian, Ukrainian and Transcaucasian republics)', color: '#6e2f33',
    from: ['Russia', 'Ukraine', 'Georgia', 'Armenia', 'Azerbaijan', 'Kazakhstan', 'Turkmenistan'], spacing: 1.2 },
  GRC: { name: 'Greece', long: 'Kingdom of Greece (with the Italian Dodecanese, which cannot be separated)', color: '#5a8fb8', from: ['Greece'], spacing: 0.95, minIsland: 0.008 },
  BUL: { name: 'Bulgaria', long: 'Tsardom of Bulgaria', color: '#5f7a4a', from: ['Bulgaria'], spacing: 0.95 },
  YUG: { name: 'Yugoslavia', long: 'Kingdom of Yugoslavia (modern Serbia, Croatia, Bosnia, Montenegro, Macedonia, Slovenia and Kosovo)', color: '#56799a',
    from: ['Serbia', 'Kosovo', 'Montenegro', 'Macedonia', 'Bosnia and Herz.', 'Croatia', 'Slovenia'], spacing: 1.2 },
  ROM: { name: 'Romania', long: 'Kingdom of Romania (with Bessarabia)', color: '#b8a03a', from: ['Romania', 'Moldova'], spacing: 1.25 },
  HUN: { name: 'Hungary', long: 'Kingdom of Hungary', color: '#9a6a52', from: ['Hungary'], spacing: 1.2 },
  ALB: { name: 'Albania', long: 'Albanian Kingdom', color: '#8b5d86', from: ['Albania'], spacing: 1.1 },
  IRN: { name: 'Iran', long: 'Imperial State of Iran', color: '#3f8f7a', from: ['Iran'], spacing: 1.15 },
  IRQ: { name: 'Iraq', long: 'Kingdom of Iraq', color: '#8a7a4d', from: ['Iraq'], spacing: 1.05 },
  FRA: { name: 'French Levant', long: 'French Mandate of Syria & Lebanon', color: '#4a67a8', from: ['Syria', 'Lebanon'], spacing: 1.0 },
  GBR: { name: 'British Mandates', long: 'British Mandates, Colonies & Protectorates (Palestine, Trans-Jordan, Cyprus, Malta, the Gulf sheikhdoms)', color: '#b0586a',
    from: ['Israel', 'Palestine', 'Jordan', 'Cyprus', 'N. Cyprus', 'Cyprus U.N. Buffer Zone', 'Dhekelia', 'Akrotiri', 'Kuwait', 'Bahrain', 'Qatar', 'United Arab Emirates', 'Malta'], spacing: 1.0 },
  EGY: { name: 'Egypt', long: 'Kingdom of Egypt', color: '#b89a5e', from: ['Egypt'], spacing: 1.5 },
  SAU: { name: 'Saudi Arabia', long: 'Kingdom of Saudi Arabia', color: '#6f8556', from: ['Saudi Arabia'], spacing: 1.6 },
  LBY: { name: 'Italian Libya', long: 'Italian Libya', color: '#5c8a5c', from: ['Libya'], spacing: 1.9 },
  ITA: { name: 'Italy', long: 'Kingdom of Italy', color: '#6b9a64', from: ['Italy'], spacing: 1.7 },
  AUS: { name: 'Austria', long: 'Federal State of Austria', color: '#a9a9a0', from: ['Austria'], spacing: 1.6 },
  CZE: { name: 'Czechoslovakia', long: 'Czechoslovak Republic', color: '#6aa0a0', from: ['Czechia', 'Slovakia'], spacing: 1.6 },
  POL: { name: 'Poland', long: 'Republic of Poland', color: '#b07a8a', from: ['Poland'], spacing: 1.8 },
  SUD: { name: 'Anglo-Egyptian Sudan', long: 'Anglo-Egyptian Sudan', color: '#9a6f6a', from: ['Sudan'], spacing: 1.9 },
  AEF: { name: 'French Africa', long: 'French Equatorial & West Africa (Chad, Niger)', color: '#5c6f9c', from: ['Chad', 'Niger'], spacing: 2.0 },
};

// ---------- Turkey: historical regions and their cities (1936 names) ----------
export const HOME_STATES = {
  'Thrace': [
    ['Edirne', 26.56, 41.68, 5, 'F'], ['Kırklareli', 27.23, 41.74, 3, 'F'], ['Tekirdağ', 27.51, 40.98, 3], ['Çorlu', 27.8, 41.16, 3, 'AS'],
    ['Lüleburgaz', 27.36, 41.4, 3], ['Uzunköprü', 26.69, 41.27, 1], ['Gelibolu', 26.67, 40.41, 3, 'F'], ['Çatalca', 28.46, 41.14, 1, 'F'],
  ],
  'Marmara': [
    ['İstanbul', 28.98, 41.01, 20, 'PNS'], ['İzmit', 29.92, 40.77, 5], ['Gölcük', 29.82, 40.72, 5, 'N'], ['Adapazarı', 30.4, 40.78, 3],
    ['Bursa', 29.06, 40.19, 10], ['Mudanya', 28.88, 40.38, 1], ['Bandırma', 27.98, 40.35, 3, 'P'], ['Balıkesir', 27.89, 39.65, 5],
    ['Çanakkale', 26.41, 40.15, 5, 'NF'], ['Bilecik', 29.98, 40.14, 1], ['Edremit', 27.02, 39.6, 1],
  ],
  'Aegean': [
    ['İzmir', 27.14, 38.42, 15, 'PNAS'], ['Manisa', 27.43, 38.61, 5], ['Aydın', 27.85, 37.85, 5], ['Denizli', 29.09, 37.77, 3],
    ['Muğla', 28.36, 37.22, 3], ['Uşak', 29.41, 38.68, 3], ['Kütahya', 29.98, 39.42, 3, 'A'], ['Afyon', 30.54, 38.76, 5],
    ['Çeşme', 26.3, 38.32, 1], ['Bodrum', 27.43, 37.03, 1], ['Fethiye', 29.12, 36.62, 1], ['Nazilli', 28.32, 37.91, 1], ['Dinar', 30.17, 38.07, 1],
  ],
  'Western Black Sea': [
    ['Zonguldak', 31.79, 41.45, 5, 'PR'], ['Karabük', 32.62, 41.2, 3, 'R'], ['Bartın', 32.34, 41.64, 1], ['Kastamonu', 33.78, 41.38, 3],
    ['İnebolu', 33.76, 41.97, 1], ['Sinop', 35.15, 42.03, 3, 'P'], ['Bolu', 31.61, 40.74, 3], ['Çankırı', 33.62, 40.6, 1],
  ],
  'Pontus': [
    ['Samsun', 36.33, 41.29, 10, 'PS'], ['Ünye', 37.29, 41.13, 1], ['Ordu', 37.88, 40.98, 3], ['Giresun', 38.39, 40.91, 3],
    ['Trabzon', 39.72, 41.0, 10, 'P'], ['Rize', 40.52, 41.02, 3], ['Hopa', 41.43, 41.41, 1], ['Gümüşhane', 39.48, 40.46, 1],
    ['Amasya', 35.83, 40.65, 3], ['Tokat', 36.55, 40.31, 3], ['Çorum', 34.95, 40.55, 3],
  ],
  'Ankara': [
    ['Ankara', 32.85, 39.93, 40, 'CASF'], ['Eskişehir', 30.52, 39.78, 10, 'A'], ['Polatlı', 32.15, 39.58, 1], ['Kırıkkale', 33.51, 39.85, 3, 'R'],
    ['Kırşehir', 34.16, 39.15, 3], ['Yozgat', 34.81, 39.82, 3], ['Sivrihisar', 31.54, 39.45, 1], ['Yerköy', 34.47, 39.64, 1],
  ],
  'Konya': [
    ['Konya', 32.48, 37.87, 10], ['Karaman', 33.22, 37.18, 3], ['Ereğli', 34.05, 37.51, 1], ['Akşehir', 31.42, 38.36, 1],
    ['Niğde', 34.68, 37.97, 3], ['Aksaray', 34.03, 38.37, 1], ['Beyşehir', 31.73, 37.68, 1], ['Isparta', 30.55, 37.76, 3],
    ['Ulukışla', 34.48, 37.55, 1], ['Eğirdir', 30.85, 37.87, 1],
  ],
  'Cappadocia': [
    ['Kayseri', 35.48, 38.72, 10, 'A'], ['Sivas', 37.02, 39.75, 10, 'S'], ['Nevşehir', 34.71, 38.62, 1], ['Divriği', 38.12, 39.37, 1],
    ['Şarkışla', 36.41, 39.35, 1], ['Zara', 37.76, 39.9, 1], ['Gürün', 37.27, 38.72, 1], ['Pınarbaşı', 36.39, 38.72, 1],
  ],
  'Antalya': [
    ['Antalya', 30.7, 36.9, 5, 'P'], ['Alanya', 32.0, 36.54, 1], ['Manavgat', 31.44, 36.79, 1], ['Finike', 30.15, 36.3, 1],
    ['Kaş', 29.64, 36.2, 1], ['Elmalı', 29.92, 36.74, 1],
  ],
  // İskenderun and Antakya: the Sanjak of Alexandretta, under French mandate until 1939 (see the note at the top)
  'Çukurova': [
    ['Adana', 35.32, 37.0, 10, 'AS'], ['Mersin', 34.63, 36.8, 5, 'P'], ['Tarsus', 34.9, 36.92, 3], ['Silifke', 33.93, 36.38, 1],
    ['Anamur', 32.84, 36.08, 1], ['Osmaniye', 36.25, 37.07, 1], ['Maraş', 36.93, 37.58, 3], ['İskenderun', 36.17, 36.59, 3, 'P'],
    ['Antakya', 36.16, 36.2, 3], ['Islahiye', 36.63, 37.03, 1], ['Elbistan', 37.2, 38.2, 1],
  ],
  'Erzurum': [
    ['Erzurum', 41.27, 39.9, 10, 'ASF'], ['Kars', 43.1, 40.6, 5, 'F'], ['Ardahan', 42.7, 41.11, 1, 'F'], ['Sarıkamış', 42.59, 40.33, 3, 'F'],
    ['Erzincan', 39.49, 39.75, 5], ['Bayburt', 40.23, 40.26, 1], ['Karaköse', 43.05, 39.72, 1], ['Doğubayazıt', 44.08, 39.55, 1, 'F'],
    ['Iğdır', 44.04, 39.92, 1], ['Horasan', 42.17, 40.04, 1], ['Artvin', 41.82, 41.18, 1], ['Kemah', 39.03, 39.6, 1],
  ],
  'Van': [
    ['Van', 43.38, 38.5, 5, 'S'], ['Bitlis', 42.11, 38.4, 1], ['Muş', 41.49, 38.73, 1], ['Hakkâri', 43.74, 37.57, 1],
    ['Siirt', 41.94, 37.93, 3], ['Başkale', 44.02, 38.05, 1, 'F'], ['Erciş', 43.36, 39.03, 1], ['Yüksekova', 44.28, 37.57, 1],
    ['Malazgirt', 42.54, 39.15, 1], ['Şemdinli', 44.57, 37.31, 1],
  ],
  'Diyarbakır': [
    ['Diyarbakır', 40.23, 37.91, 10, 'AS'], ['Mardin', 40.74, 37.31, 3], ['Urfa', 38.79, 37.16, 5], ['Gaziantep', 37.38, 37.07, 5],
    ['Malatya', 38.31, 38.35, 5], ['Elazığ', 39.22, 38.67, 3], ['Adıyaman', 38.28, 37.76, 1], ['Nusaybin', 41.22, 37.07, 1, 'F'],
    ['Cizre', 42.19, 37.33, 1, 'F'], ['Kilis', 37.12, 36.72, 1, 'F'], ['Birecik', 37.98, 37.03, 1], ['Ergani', 39.76, 38.27, 1],
    ['Tunceli', 39.55, 39.11, 1], ['Bingöl', 40.5, 38.89, 1],
  ],
};

// ---------- foreign cities by country tag → region → cities. Region names are the historical lands; META.regions
// gives each the name of its Ottoman eyalet, sanjak or vassal state. ----------
export const FOREIGN = {
  BUL: {
    'Sofia & the West': [['Sofia', 23.32, 42.7, 15], ['Kyustendil', 22.69, 42.28, 1], ['Gorna Dzhumaya', 23.1, 42.02, 1], ['Vidin', 22.87, 43.99, 3], ['Lom', 23.24, 43.83, 1]],
    'Danubian Bulgaria': [['Ruse', 25.97, 43.85, 3], ['Pleven', 24.62, 43.41, 3], ['Tarnovo', 25.63, 43.08, 3], ['Shumen', 26.92, 43.27, 3], ['Varna', 27.91, 43.2, 5], ['Silistra', 27.26, 44.12, 1], ['Dobrich', 27.83, 43.57, 1], ['Nikopol', 24.9, 43.7, 1]],
    'Eastern Rumelia': [['Plovdiv', 24.75, 42.14, 5], ['Stara Zagora', 25.63, 42.43, 1], ['Burgas', 27.47, 42.5, 3], ['Sliven', 26.32, 42.68, 1], ['Haskovo', 25.56, 41.93, 1], ['Kardzhali', 25.37, 41.65, 1], ['Svilengrad', 26.2, 41.77, 1], ['Yambol', 26.51, 42.48, 1], ['Malko Tarnovo', 27.53, 41.98, 1], ['Pazardzhik', 24.33, 42.19, 1]],
  },
  GRC: {
    'Western Thrace': [['Alexandroupoli', 25.87, 40.85, 1], ['Komotini', 25.4, 41.12, 1], ['Xanthi', 24.89, 41.14, 1], ['Didymoteicho', 26.5, 41.35, 1]],
    'Macedonia': [['Thessaloniki', 22.94, 40.64, 15], ['Kavala', 24.41, 40.94, 3], ['Serres', 23.55, 41.09, 1], ['Drama', 24.15, 41.15, 1], ['Kozani', 21.79, 40.3, 1], ['Florina', 21.41, 40.78, 1], ['Veria', 22.2, 40.52, 1], ['Polygyros', 23.44, 40.38, 1]],
    'Epirus & Thessaly': [['Ioannina', 20.85, 39.66, 3], ['Larissa', 22.42, 39.64, 3], ['Volos', 22.94, 39.36, 1], ['Trikala', 21.77, 39.56, 1]],
    'Attica & Euboea': [['Athens', 23.73, 37.98, 20], ['Thebes', 23.32, 38.32, 1], ['Lamia', 22.43, 38.9, 1], ['Chalcis', 23.6, 38.46, 1], ['Lepanto', 21.83, 38.39, 3], ['Missolonghi', 21.43, 38.37, 1], ['Arta', 20.98, 39.16, 1]],
    'Morea': [['Patras', 21.73, 38.25, 5], ['Tripolitsa', 22.37, 37.51, 1], ['Kalamata', 22.11, 37.04, 1], ['Nafplio', 22.8, 37.57, 3], ['Corinth', 22.93, 37.94, 1], ['Sparta', 22.43, 37.07, 1], ['Navarino', 21.7, 36.91, 3], ['Pyrgos', 21.44, 37.67, 1]],
    'Crete': [['Heraklion', 25.13, 35.34, 5], ['Chania', 24.02, 35.51, 3], ['Rethymno', 24.47, 35.37, 1], ['Sitia', 26.1, 35.21, 1]],
    'Aegean Islands': [['Mytilene', 26.55, 39.1, 3], ['Chios', 26.14, 38.37, 3], ['Samos', 26.97, 37.75, 1], ['Naxos', 25.38, 37.1, 1], ['Lemnos', 25.07, 39.87, 1]],
    'Dodecanese': [['Rhodes', 28.22, 36.43, 5], ['Kos', 27.29, 36.89, 1], ['Karpathos', 27.21, 35.51, 1]],
  },
  YUG: {
    'Serbia': [['Belgrade', 20.46, 44.8, 20], ['Niš', 21.9, 43.32, 5], ['Kragujevac', 20.91, 44.01, 1], ['Smederevo', 20.93, 44.66, 3], ['Užice', 19.84, 43.86, 1], ['Novi Pazar', 20.52, 43.14, 1], ['Vranje', 21.9, 42.55, 1], ['Zaječar', 22.28, 43.9, 1], ['Šabac', 19.69, 44.75, 1]],
    'Vojvodina': [['Novi Sad', 19.84, 45.25, 3], ['Subotica', 19.67, 46.1, 1], ['Petrovgrad', 20.39, 45.38, 1], ['Vršac', 21.3, 45.12, 1]],
    'Kosovo': [['Priština', 21.17, 42.66, 3], ['Prizren', 20.74, 42.21, 1], ['Peć', 20.29, 42.66, 1]],
    'Vardar Macedonia': [['Skopje', 21.43, 42.0, 5], ['Bitola', 21.33, 41.03, 3], ['Ohrid', 20.8, 41.12, 1], ['Štip', 22.19, 41.74, 1], ['Veles', 21.78, 41.72, 1]],
    'Montenegro': [['Cetinje', 18.92, 42.39, 1], ['Podgorica', 19.26, 42.44, 1], ['Nikšić', 18.95, 42.77, 1], ['Bar', 19.1, 42.09, 1]],
    'Bosnia': [['Sarajevo', 18.41, 43.86, 10], ['Banja Luka', 17.19, 44.77, 3], ['Tuzla', 18.67, 44.54, 1], ['Travnik', 17.67, 44.23, 3], ['Bihać', 15.87, 44.82, 1], ['Višegrad', 19.29, 43.78, 1], ['Jajce', 17.27, 44.34, 1], ['Livno', 17.01, 43.83, 1]],
    'Herzegovina': [['Mostar', 17.81, 43.34, 3], ['Trebinje', 18.34, 42.71, 1], ['Foča', 18.78, 43.51, 1]],
    'Croatia': [['Zagreb', 15.98, 45.81, 10], ['Split', 16.44, 43.51, 3], ['Osijek', 18.69, 45.55, 1], ['Dubrovnik', 18.09, 42.65, 3], ['Slavonski Brod', 18.02, 45.16, 1], ['Karlovac', 15.55, 45.49, 1], ['Šibenik', 15.89, 43.73, 1]],
    'Slovenia': [['Ljubljana', 14.51, 46.05, 3], ['Maribor', 15.65, 46.55, 1]],
  },
  ROM: {
    'Wallachia': [['Bucharest', 26.1, 44.43, 20], ['Craiova', 23.8, 44.32, 3], ['Ploiești', 26.02, 44.94, 5], ['Pitești', 24.87, 44.86, 1], ['Giurgiu', 25.97, 43.99, 1], ['Brăila', 27.96, 45.27, 3], ['Turnu Severin', 22.66, 44.63, 1], ['Târgoviște', 25.46, 44.93, 1], ['Buzău', 26.82, 45.15, 1]],
    'Dobruja': [['Constanța', 28.65, 44.18, 5], ['Tulcea', 28.8, 45.18, 1]],
    'Moldavia': [['Iași', 27.59, 47.16, 5], ['Galați', 28.05, 45.44, 3], ['Bacău', 26.91, 46.57, 1], ['Suceava', 26.25, 47.65, 1], ['Focșani', 27.18, 45.7, 1], ['Botoșani', 26.67, 47.75, 1]],
    'Bessarabia': [['Chișinău', 28.86, 47.01, 5], ['Bălți', 27.93, 47.76, 1], ['Tighina', 29.48, 46.83, 3], ['Cahul', 28.19, 45.9, 1], ['Soroca', 28.3, 48.16, 1]],
    'Transylvania': [['Cluj', 23.59, 46.77, 5], ['Brașov', 25.6, 45.65, 3], ['Sibiu', 24.15, 45.8, 3], ['Alba Iulia', 23.57, 46.07, 3], ['Târgu Mureș', 24.56, 46.54, 1], ['Oradea', 21.93, 47.05, 3], ['Baia Mare', 23.58, 47.66, 1], ['Satu Mare', 22.88, 47.79, 1], ['Deva', 22.9, 45.88, 1]],
    'Banat': [['Timișoara', 21.23, 45.75, 5], ['Arad', 21.31, 46.18, 1], ['Lugoj', 21.9, 45.69, 1], ['Orșova', 22.4, 44.72, 1]],
  },
  HUN: {
    'Buda': [['Budapest', 19.04, 47.5, 20], ['Székesfehérvár', 18.42, 47.19, 3], ['Esztergom', 18.74, 47.79, 3], ['Kecskemét', 19.69, 46.91, 1], ['Szolnok', 20.18, 47.17, 1]],
    'Transdanubia': [['Pécs', 18.23, 46.07, 3], ['Nagykanizsa', 16.99, 46.45, 3], ['Mohács', 18.68, 45.99, 3], ['Szigetvár', 17.8, 46.05, 1], ['Veszprém', 17.91, 47.09, 1], ['Győr', 17.63, 47.69, 1], ['Szombathely', 16.62, 47.23, 1]],
    'Great Plain': [['Szeged', 20.15, 46.25, 3], ['Debrecen', 21.63, 47.53, 3], ['Eger', 20.37, 47.9, 3], ['Miskolc', 20.78, 48.1, 1], ['Gyula', 21.28, 46.65, 1], ['Baja', 18.95, 46.18, 1]],
  },
  ALB: {
    'Albania': [['Tirana', 19.82, 41.33, 5], ['Shkodër', 19.51, 42.07, 3], ['Vlorë', 19.49, 40.47, 1], ['Korçë', 20.78, 40.62, 1], ['Elbasan', 20.08, 41.11, 1], ['Gjirokastër', 20.14, 40.08, 1], ['Berat', 19.95, 40.71, 1]],
  },
  SOV: {
    'Georgian SSR': [['Tbilisi', 44.8, 41.72, 15], ['Batumi', 41.64, 41.64, 5], ['Kutaisi', 42.7, 42.27, 3], ['Sukhumi', 41.02, 43.0, 1], ['Poti', 41.67, 42.15, 1], ['Gori', 44.11, 41.98, 1], ['Telavi', 45.47, 41.92, 1], ['Zugdidi', 41.87, 42.51, 1]],
    'Meskheti': [['Akhaltsikhe', 42.99, 41.64, 3], ['Akhalkalaki', 43.49, 41.41, 1]],
    'Armenian SSR': [['Yerevan', 44.51, 40.18, 10], ['Leninakan', 43.85, 40.79, 3], ['Kirovakan', 44.49, 40.81, 1], ['Goris', 46.34, 39.51, 1], ['Dilijan', 44.86, 40.74, 1]],
    'Azerbaijan SSR': [['Baku', 49.87, 40.41, 20], ['Kirovabad', 46.36, 40.68, 3], ['Lankaran', 48.85, 38.75, 1], ['Stepanakert', 46.75, 39.82, 1], ['Shamakhi', 48.64, 40.63, 3], ['Yevlakh', 47.15, 40.62, 1], ['Quba', 48.51, 41.36, 1], ['Nukha', 47.17, 41.19, 1], ['Zaqatala', 46.64, 41.63, 1], ['Salyan', 48.98, 39.6, 1]],
    'Nakhichevan ASSR': [['Nakhichevan', 45.41, 39.21, 3], ['Ordubad', 46.03, 38.91, 1]],
    'Crimea': [['Sevastopol', 33.52, 44.62, 10], ['Simferopol', 34.1, 44.95, 3], ['Bakhchisaray', 33.86, 44.75, 5], ['Kerch', 36.47, 45.36, 3], ['Feodosia', 35.38, 45.03, 3], ['Yalta', 34.17, 44.5, 1], ['Yevpatoria', 33.37, 45.19, 1], ['Perekop', 33.69, 46.16, 1], ['Dzhankoy', 34.39, 45.71, 1]],
    'Southern Ukraine': [['Odessa', 30.72, 46.48, 10], ['Nikolayev', 31.99, 46.97, 3], ['Kherson', 32.62, 46.64, 3], ['Ochakov', 31.54, 46.62, 3], ['Melitopol', 35.37, 46.85, 1], ['Mariupol', 37.55, 47.1, 1], ['Berdyansk', 36.8, 46.76, 1]],
    'Budjak': [['Akkerman', 30.34, 46.19, 3], ['Izmail', 28.84, 45.35, 3], ['Kiliya', 29.27, 45.45, 1]],
    'Azov': [['Azov', 39.42, 47.11, 5], ['Taganrog', 38.9, 47.24, 1], ['Rostov-on-Don', 39.72, 47.23, 5], ['Yeysk', 38.28, 46.71, 1]],
    'Kuban & Circassia': [['Krasnodar', 38.98, 45.04, 3], ['Novorossiysk', 37.77, 44.72, 3], ['Anapa', 37.32, 44.89, 3], ['Sochi', 39.72, 43.6, 1], ['Tuapse', 39.08, 44.1, 1], ['Maykop', 40.1, 44.61, 1], ['Temryuk', 37.38, 45.28, 1]],
    'North Caucasus': [['Makhachkala', 47.5, 42.98, 1], ['Grozny', 45.69, 43.32, 3], ['Derbent', 48.29, 42.06, 1], ['Ordzhonikidze', 44.68, 43.02, 1], ['Voroshilovsk', 41.97, 45.04, 1], ['Nalchik', 43.62, 43.49, 1], ['Elista', 44.27, 46.31, 1], ['Armavir', 41.12, 45.0, 1]],
    'Lower Volga': [['Stalingrad', 44.52, 48.71, 5], ['Astrakhan', 48.04, 46.35, 3], ['Guryev', 51.88, 47.12, 1]],
    'Ukraine': [['Dnepropetrovsk', 35.05, 48.46, 5], ['Zaporozhye', 35.14, 47.84, 1], ['Stalino', 37.8, 48.0, 3], ['Krivoy Rog', 33.39, 47.91, 1], ['Kirovo', 32.26, 48.51, 1], ['Uman', 30.22, 48.75, 1], ['Voroshilovgrad', 39.31, 48.57, 1]],
    'Podolia & Bukovina': [['Kamenets-Podolsk', 26.58, 48.68, 3], ['Chernovtsy', 25.94, 48.29, 1], ['Khotin', 26.49, 48.51, 1], ['Uzhgorod', 22.3, 48.62, 1], ['Balta', 29.62, 47.94, 1]],
  },
  IRN: {
    'Azerbaijan': [['Tabriz', 46.29, 38.08, 15], ['Urmia', 45.07, 37.55, 3], ['Ardabil', 48.29, 38.25, 3], ['Khoy', 44.95, 38.55, 1], ['Maku', 44.52, 39.29, 1], ['Maragheh', 46.24, 37.39, 1], ['Mahabad', 45.72, 36.76, 1], ['Mianeh', 47.71, 37.42, 1], ['Julfa', 45.63, 38.94, 1], ['Ahar', 47.07, 38.48, 1], ['Zanjan', 48.48, 36.67, 1]],
    'Kurdistan': [['Sanandaj', 47.0, 35.31, 3], ['Saqqez', 46.27, 36.25, 1], ['Bijar', 47.6, 35.87, 1]],
    'Kermanshah & Hamadan': [['Kermanshah', 47.07, 34.31, 5], ['Hamadan', 48.51, 34.8, 5], ['Qasr-e Shirin', 45.58, 34.52, 1], ['Malayer', 48.82, 34.3, 1]],
    'Luristan': [['Khorramabad', 48.36, 33.49, 3], ['Borujerd', 48.75, 33.9, 1], ['Ilam', 46.42, 33.64, 1]],
    'Persia': [['Tehran', 51.39, 35.69, 30], ['Qazvin', 50.0, 36.27, 3], ['Rasht', 49.58, 37.28, 3], ['Qom', 50.88, 34.64, 3], ['Arak', 49.69, 34.09, 1], ['Isfahan', 51.67, 32.65, 15], ['Kashan', 51.44, 33.98, 1]],
    'Khuzestan & Fars': [['Ahvaz', 48.68, 31.32, 5], ['Abadan', 48.3, 30.34, 10], ['Dezful', 48.4, 32.38, 1], ['Bushehr', 50.84, 28.97, 5]],
  },
  IRQ: {
    'Baghdad': [['Baghdad', 44.36, 33.31, 20], ['Karbala', 44.02, 32.62, 3], ['Najaf', 44.31, 32.0, 3], ['Hillah', 44.43, 32.48, 3], ['Kut', 45.82, 32.5, 1], ['Samarra', 43.87, 34.2, 1], ['Baqubah', 44.65, 33.75, 1], ['Khanaqin', 45.38, 34.35, 1], ['Ramadi', 43.3, 33.42, 1], ['Diwaniyah', 44.92, 31.99, 1]],
    'Basra': [['Basra', 47.78, 30.51, 10], ['Fao', 48.48, 29.97, 1], ['Nasiriyah', 46.26, 31.04, 1], ['Amarah', 47.15, 31.84, 1], ['Samawah', 45.28, 31.31, 1], ['Qurna', 47.43, 31.02, 1]],
    'Mosul': [['Mosul', 43.13, 36.34, 10], ['Erbil', 44.01, 36.19, 3], ['Dohuk', 42.99, 36.87, 1], ['Zakho', 42.68, 37.14, 1], ['Sinjar', 41.87, 36.32, 1], ['Rawanduz', 44.52, 36.61, 1], ['Amadiya', 43.49, 37.09, 1], ['Tal Afar', 42.45, 36.38, 1]],
    'Shahrizor': [['Kirkuk', 44.39, 35.47, 5], ['Sulaymaniyah', 45.43, 35.56, 3], ['Halabja', 45.98, 35.18, 1], ['Tikrit', 43.68, 34.6, 1]],
    'Western Desert': [['Rutbah', 40.28, 33.04, 1], ['Haditha', 42.38, 34.13, 1], ['Anah', 41.98, 34.37, 1]],
  },
  FRA: {
    'Aleppo': [['Aleppo', 37.16, 36.2, 10], ['Idlib', 36.63, 35.93, 1], ['Manbij', 37.95, 36.53, 1], ['Azaz', 37.04, 36.59, 1]],
    'Damascus': [['Damascus', 36.29, 33.51, 15], ['Homs', 36.72, 34.73, 3], ['Hama', 36.75, 35.13, 3], ['Palmyra', 38.28, 34.56, 3], ['Daraa', 36.1, 32.62, 1], ['Suwayda', 36.57, 32.71, 1]],
    'Latakia': [['Latakia', 35.78, 35.52, 3], ['Tartus', 35.89, 34.89, 1]],
    'Jazira': [['Deir ez-Zor', 40.14, 35.33, 3], ['Raqqa', 39.01, 35.95, 3], ['Qamishli', 41.22, 36.9, 1], ['Hasakah', 40.75, 36.5, 1], ['Abu Kamal', 40.92, 34.45, 1]],
    'Lebanon': [['Beirut', 35.5, 33.89, 10], ['Tripoli', 35.84, 34.44, 3], ['Sidon', 35.37, 33.56, 3], ['Tyre', 35.2, 33.27, 1], ['Baalbek', 36.21, 34.01, 1]],
  },
  GBR: {
    'Palestine': [['Jerusalem', 35.22, 31.78, 15], ['Haifa', 34.99, 32.82, 3], ['Acre', 35.08, 32.93, 3], ['Jaffa', 34.75, 32.05, 3], ['Gaza', 34.47, 31.5, 1], ['Beersheba', 34.79, 31.25, 1], ['Nablus', 35.26, 32.22, 1]],
    'Trans-Jordan': [['Amman', 35.93, 31.95, 5], ['Aqaba', 35.0, 29.53, 1], ["Ma'an", 35.73, 30.2, 1], ['Kerak', 35.7, 31.18, 1], ['Irbid', 35.85, 32.56, 1]],
    'Cyprus': [['Nicosia', 33.38, 35.17, 5], ['Famagusta', 33.94, 35.12, 3], ['Limassol', 33.04, 34.68, 1], ['Kyrenia', 33.32, 35.34, 1], ['Paphos', 32.42, 34.77, 1]],
    'Kuwait': [['Kuwait', 47.98, 29.37, 5]],
    'Bahrain': [['Manama', 50.58, 26.22, 3]],
    'Qatar': [['Doha', 51.53, 25.29, 1]],
    'Malta': [['Valletta', 14.51, 35.9, 5]],
  },
  EGY: {
    'Lower Egypt': [['Cairo', 31.24, 30.04, 30], ['Alexandria', 29.92, 31.2, 15], ['Port Said', 32.3, 31.26, 3], ['Suez', 32.55, 29.97, 5], ['Tanta', 31.0, 30.79, 1], ['Damietta', 31.81, 31.42, 3], ['Rosetta', 30.42, 31.4, 1], ['Ismailia', 32.27, 30.6, 1], ['Fayyum', 30.84, 29.31, 1]],
    'Upper Egypt': [['Asyut', 31.18, 27.18, 3], ['Luxor', 32.64, 25.69, 3], ['Aswan', 32.9, 24.09, 3], ['Minya', 30.75, 28.1, 1], ['Qena', 32.72, 26.16, 1], ['Beni Suef', 31.1, 29.07, 1], ['Sohag', 31.69, 26.56, 1]],
    'Sinai': [['El Arish', 33.8, 31.13, 1], ['Nakhl', 33.75, 29.9, 1], ['El Tor', 33.62, 28.24, 1]],
    'Western Desert': [['Mersa Matruh', 27.24, 31.35, 1], ['Siwa', 25.52, 29.2, 1], ['Kharga', 30.55, 25.45, 1], ['Sollum', 25.16, 31.56, 1], ['El Alamein', 28.95, 30.83, 1], ['Dakhla', 28.98, 25.49, 1]],
    'Red Sea Coast': [['Hurghada', 33.81, 27.26, 1], ['Quseir', 34.28, 26.1, 1], ['Berenice', 35.47, 23.91, 1]],
  },
  SAU: {
    'Hejaz': [['Mecca', 39.83, 21.42, 15], ['Medina', 39.61, 24.47, 10], ['Jeddah', 39.19, 21.49, 5], ['Taif', 40.42, 21.27, 1], ['Yanbu', 38.06, 24.09, 1], ['Tabuk', 36.57, 28.38, 1], ['Al Wajh', 36.45, 26.23, 1], ['Al-Ula', 37.92, 26.61, 1], ['Tayma', 38.55, 27.63, 1], ['Rabigh', 39.03, 22.8, 1], ['Khaybar', 39.29, 25.7, 1]],
    'Jabal Shammar': [["Ha'il", 41.69, 27.52, 3], ['Sakaka', 40.2, 29.97, 1], ['Turaif', 38.66, 31.67, 1]],
    'Nejd': [['Riyadh', 46.72, 24.69, 15], ['Buraydah', 43.97, 26.33, 1], ['Dawadmi', 44.39, 24.5, 1], ['Rafha', 43.49, 29.64, 1]],
    'Al-Hasa': [['Hofuf', 49.59, 25.38, 3], ['Dhahran', 50.11, 26.29, 3], ['Jubail', 49.66, 27.0, 1], ['Hafar al-Batin', 45.96, 28.43, 1]],
  },
  LBY: {
    'Cyrenaica': [['Benghazi', 20.07, 32.12, 5], ['Derna', 22.64, 32.76, 3], ['Tobruk', 23.96, 32.08, 3], ['Bardia', 25.09, 31.76, 1], ['Barce', 20.83, 32.49, 1], ['Ajdabiya', 20.22, 30.76, 1], ['Jalu', 21.55, 29.03, 1], ['Jaghbub', 24.52, 29.74, 1], ['Kufra', 23.31, 24.19, 1]],
    'Tripolitania': [['Misrata', 15.09, 32.38, 3], ['Sirte', 16.59, 31.21, 1], ['Al Khums', 14.27, 32.65, 1], ['Hun', 15.94, 29.13, 1], ['El Agheila', 19.2, 30.26, 1]],
    'Fezzan': [['Sabha', 14.43, 27.04, 1], ['Zawila', 15.12, 26.17, 1], ['Tazirbu', 21.13, 25.67, 1]],
  },
  ITA: { 'Southern Italy': [['Naples', 14.25, 40.85, 10], ['Bari', 16.87, 41.12, 3], ['Taranto', 17.23, 40.47, 3], ['Brindisi', 17.94, 40.63, 1], ['Otranto', 18.49, 40.15, 1], ['Reggio Calabria', 15.65, 38.11, 1], ['Catania', 15.09, 37.5, 1], ['Syracuse', 15.29, 37.07, 1], ['Foggia', 15.55, 41.46, 1]] },
  AUS: { 'Austria': [['Vienna', 16.37, 48.21, 15], ['Graz', 15.44, 47.07, 3], ['Klagenfurt', 14.31, 46.62, 1], ['Linz', 14.29, 48.31, 1]] },
  CZE: { 'Slovakia': [['Bratislava', 17.11, 48.15, 3], ['Košice', 21.26, 48.72, 1], ['Banská Bystrica', 19.15, 48.74, 1], ['Nové Zámky', 18.16, 47.99, 1]] },
  POL: { 'Poland': [] },
  SUD: { 'Nubia': [['Wadi Halfa', 31.35, 21.8, 1]] },
  AEF: { 'Tibesti': [['Bardaï', 17.0, 21.35, 1]] },
};

// ---------- fronts ----------
// The objective zones together approximate the Ottoman Empire at its height. What the boxes do:
//  - Greece is split along the Arta–Volos line (the 1832 border of the Greek kingdom, lat 39.25): the north is Rumelia and
//    belongs to the Balkan front; the south, Crete and the islands were the Kapudan Pasha's Eyalet of the Archipelago and
//    belong to the naval Aegean theatre.
//  - Iran: only the west (Tabriz, Hamadan, Kermanshah, Luristan), held by the Ottomans in 1590–1603 and 1724–36.
//  - Saudi Arabia: only the Hejaz and Jabal Shammar (west of 42.6°E) count, on the Levant front. Al-Hasa (Ottoman Lahsa)
//    is left out because a second box cannot separate it from the Nejd without also cutting western Iraq.
//  - Ukraine and Russia: only the Black Sea steppe, Crimea, Azov and the Circassian coast.
// Croatia is not an objective (Slavonia and Lika were Ottoman, Zagreb and the Dalmatian coast never were).
const AEGEAN_COAST = [[26.2, 40.05], [26.12, 39.85], [26.07, 39.48], [26.6, 39.55], [26.95, 39.55], [26.7, 39.3], [26.9, 39.05], [26.8, 38.75], [27.1, 38.45],
  [26.6, 38.4], [26.3, 38.3], [26.6, 38.1], [27.0, 38.05], [27.25, 37.85], [27.2, 37.55], [27.4, 37.3], [27.3, 37.0], [28.0, 36.95], [28.25, 36.8], [28.6, 36.7],
  [29.1, 36.6], [29.6, 36.2], [30.2, 36.25], [30.6, 36.6], [30.7, 36.85], [31.4, 36.75], [32.0, 36.5], [32.6, 36.1], [32.85, 36.05], [33.6, 36.15], [33.95, 36.3], [34.6, 36.75]];
const BLACK_SEA_COAST = [[28.03, 41.88], [28.1, 41.63], [28.68, 41.35], [29.1, 41.23], [29.6, 41.18], [30.2, 41.2], [30.7, 41.12], [31.1, 41.1], [31.4, 41.3], [31.8, 41.47],
  [32.4, 41.76], [33.0, 41.9], [33.76, 41.98], [34.9, 42.0], [35.15, 42.05], [36.0, 41.73], [36.33, 41.3], [36.95, 41.35], [37.3, 41.13], [37.88, 41.0], [38.4, 40.93],
  [39.72, 41.02], [40.5, 41.05], [41.4, 41.42]];
export const FRONTS = [
  { id: 'thr', name: 'Thracian Front', enemy: 'BUL', enemyName: 'Bulgaria',
    subs: ['Bulgaria', 'Greece', 'Macedonia', 'Albania', 'Kosovo', 'Serbia', 'Montenegro', 'Bosnia and Herz.', 'Romania', 'Moldova', 'Hungary'], box: [14, 39.25, 30.6, 49.1],
    defaultLabel: 'School', satrapy: 'Rumelia, Bosnia, the Danube & Hungary', hq: 'Çorlu' },
  { id: 'cau', name: 'Caucasus Front', enemy: 'SOV', enemyName: 'Soviet Union', subs: ['Georgia', 'Armenia', 'Azerbaijan'],
    defaultLabel: 'Family', satrapy: 'Georgia, Revan & Shirvan', hq: 'Erzurum' },
  { id: 'per', name: 'Persian Front', enemy: 'IRN', enemyName: 'Iran', subs: ['Iran'], box: [43.5, 33.0, 49.3, 39.9],
    defaultLabel: 'Partner', satrapy: 'Tabriz, Hamadan & Luristan', hq: 'Van' },
  { id: 'mes', name: 'Mesopotamian Front', enemy: 'IRQ', enemyName: 'Iraq', subs: ['Iraq', 'Kuwait'],
    defaultLabel: 'Work', satrapy: 'Mosul, Baghdad & Basra', hq: 'Diyarbakır' },
  { id: 'lev', name: 'Levant Front', enemy: 'FRA', enemyName: 'French Levant', subs: ['Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Egypt', 'Saudi Arabia'], box: [24, 20, 42.6, 37.6],
    defaultLabel: 'Health', satrapy: 'Syria, Egypt & the Hejaz', hq: 'Adana' },
  { id: 'aeg', name: 'Aegean Theatre', enemy: 'GRC', enemyName: 'Royal Hellenic Navy', naval: true, coast: AEGEAN_COAST, coastKm: 60,
    subs: ['Greece', 'Cyprus', 'N. Cyprus', 'Cyprus U.N. Buffer Zone', 'Dhekelia', 'Akrotiri', 'Libya'], box: [13, 20, 35, 39.25],
    defaultLabel: 'Friends', satrapy: 'the Archipelago, the Morea, Crete, Cyprus & Tripoli', hq: 'İzmir' },
  { id: 'bla', name: 'Black Sea Theatre', enemy: 'SOV', enemyName: 'Black Sea Fleet', naval: true, coast: BLACK_SEA_COAST, coastKm: 40,
    subs: ['Ukraine', 'Russia'], box: [28.0, 43.3, 40.6, 47.75],
    defaultLabel: 'Self', satrapy: 'the Crimea, Özi & Azov', hq: 'Samsun' },
];

// ---------- terrain. ranges: polyline + half-width in degrees ----------
export const RANGES = [
  // Anatolia
  { name: 'Pontic Mountains', w: 0.5, pts: [[36.6, 40.8], [38.0, 40.6], [39.5, 40.6], [41.0, 40.85], [42.0, 41.25]] },
  { name: 'Küre Mountains', w: 0.35, pts: [[32.2, 41.5], [33.5, 41.7], [35.0, 41.65]] },
  { name: 'Köroğlu Mountains', w: 0.35, pts: [[30.8, 40.6], [32.2, 40.6], [33.7, 40.9], [35.2, 40.9]] },
  { name: 'Western Taurus', w: 0.4, pts: [[28.9, 36.95], [29.7, 36.6], [30.35, 36.75], [30.6, 37.3]] },
  { name: 'Taurus', w: 0.5, pts: [[31.0, 37.3], [32.0, 37.0], [33.0, 36.7], [34.2, 37.1], [35.2, 37.65], [36.2, 38.0]] },
  { name: 'Anti-Taurus', w: 0.5, pts: [[36.4, 38.05], [37.8, 38.1], [39.2, 38.35], [40.8, 38.45], [42.4, 38.1], [43.6, 37.6], [44.5, 37.4]] },
  { name: 'Amanus', w: 0.25, pts: [[36.2, 36.25], [36.5, 37.2]] },
  { name: 'Munzur Mountains', w: 0.35, pts: [[38.6, 39.45], [39.6, 39.35], [40.4, 39.2]] },
  { name: 'Armenian Highlands', w: 0.8, pts: [[40.6, 39.5], [42.0, 39.5], [43.2, 39.45], [44.3, 39.6]] },
  { name: 'Kars Plateau', w: 0.3, pts: [[42.0, 40.55], [42.6, 41.25]] },
  { name: 'Istranca', w: 0.2, pts: [[27.4, 41.9], [28.1, 41.6]] },
  { name: 'Uludağ', w: 0.2, pts: [[28.9, 40.0], [29.6, 39.85]] },
  { name: 'Bozdağ', w: 0.2, pts: [[27.6, 38.35], [28.6, 38.2]] },
  // the Caucasus and Iran
  { name: 'Caucasus', w: 0.6, pts: [[37.5, 44.6], [40.0, 43.7], [42.5, 43.1], [44.5, 42.7], [46.5, 41.9], [48.5, 41.0]] },
  { name: 'Lesser Caucasus', w: 0.5, pts: [[42.3, 41.55], [44.0, 40.75], [45.5, 40.0], [46.4, 39.3]] },
  { name: 'Zagros', w: 1.0, pts: [[44.7, 37.5], [45.8, 36.0], [46.6, 34.8], [47.8, 33.6], [49.5, 32.6], [51.0, 31.2], [52, 30.3]] },
  { name: 'Alborz', w: 0.5, pts: [[48.6, 37.6], [49.5, 36.8], [51.0, 36.2], [52, 36.0]] },
  // the Balkans and the Danube lands
  { name: 'Balkan Mountains', w: 0.35, pts: [[22.4, 43.6], [23.5, 43.0], [24.8, 42.75], [26.0, 42.8], [27.4, 42.75]] },
  { name: 'Rhodope', w: 0.45, pts: [[23.4, 42.1], [23.6, 41.6], [24.8, 41.6], [25.8, 41.5]] },
  { name: 'Pindus', w: 0.45, pts: [[20.6, 40.7], [21.2, 39.8], [21.6, 39.0], [22.1, 38.5]] },
  { name: 'Taygetus', w: 0.3, pts: [[22.2, 37.9], [22.35, 37.0]] },
  { name: 'Dinaric Alps', w: 0.6, pts: [[15.5, 45.0], [16.8, 44.0], [18.2, 43.3], [19.4, 42.6], [20.2, 42.0], [20.5, 41.3]] },
  { name: 'Carpathians', w: 0.5, pts: [[19.5, 49.0], [22.5, 48.7], [24.5, 48.0], [25.3, 47.2], [26.0, 46.2], [26.2, 45.5]] },
  { name: 'Transylvanian Alps', w: 0.4, pts: [[26.2, 45.5], [25.0, 45.45], [23.5, 45.35], [22.6, 45.0]] },
  { name: 'Apuseni', w: 0.35, pts: [[22.8, 46.3], [23.0, 46.9]] },
  { name: 'Alps', w: 0.6, pts: [[14, 46.9], [15.0, 47.2], [15.8, 47.5]] },
  { name: 'Apennines', w: 0.35, pts: [[14, 41.8], [15.2, 40.9], [16.0, 40.0], [16.3, 39.2], [16.0, 38.3]] },
  { name: 'Crimean Mountains', w: 0.2, pts: [[33.7, 44.45], [34.5, 44.75], [35.2, 44.95]] },
  { name: 'White Mountains', w: 0.2, pts: [[23.9, 35.3], [25.0, 35.2], [25.8, 35.1]] },
  { name: 'Troodos', w: 0.2, pts: [[32.6, 34.95], [33.1, 34.9]] },
  // the Arab lands
  { name: 'Lebanon', w: 0.25, pts: [[35.7, 33.3], [36.1, 34.2], [36.2, 34.6]] },
  { name: 'Jabal Ansariya', w: 0.2, pts: [[36.2, 35.0], [36.25, 35.8]] },
  { name: 'Hejaz Mountains', w: 0.5, pts: [[35.3, 28.6], [36.8, 26.8], [38.2, 24.8], [39.6, 22.5], [41, 20.6]] },
  { name: 'Sinai', w: 0.35, pts: [[33.8, 28.7], [34.2, 28.3]] },
  { name: 'Red Sea Hills', w: 0.4, pts: [[32.8, 28.0], [33.8, 26.0], [34.8, 24.0], [35.8, 22.0]] },
  { name: 'Jebel Akhdar', w: 0.25, pts: [[20.6, 32.5], [22.3, 32.7]] },
  { name: 'Tibesti', w: 0.8, pts: [[16.5, 21.0], [18.5, 20.6]] },
  { name: 'Jabal Shammar', w: 0.3, pts: [[41.0, 27.3], [42.3, 27.6]] },
];
export const DESERTS = [ // [lon, lat, rx, ry, name]
  [39.5, 32.6, 3.0, 1.6, 'Syrian Desert'], [41.0, 28.6, 2.2, 1.0, 'Nafud'], [47.3, 25.5, 0.8, 2.5, 'Dahna'], [49.5, 21.6, 2.6, 1.1, 'Rub al Khali'],
  [44.6, 24.6, 2.0, 1.6, 'Nejd'], [26.6, 25.6, 3.4, 3.6, 'Libyan Desert'], [34.4, 30.3, 0.7, 0.8, 'Negev'], [17.6, 29.6, 2.6, 1.5, 'Sirtica'],
  [22.4, 27.6, 2.0, 2.0, 'Calanshio Sand Sea'], [15.4, 25.6, 1.4, 2.2, 'Fezzan'], [33.4, 21.4, 1.8, 0.9, 'Nubian Desert'], [20.5, 22.0, 4.5, 1.5, 'Sahara'],
  [49.6, 47.8, 2.2, 1.0, 'Ryn Desert'], [45.8, 30.0, 1.6, 0.8, 'Hajara'],
];
export const FORESTS = [[31.4, 40.95, 1.0, 0.35], [33.4, 41.75, 1.6, 0.25], [39.4, 40.98, 2.4, 0.22], [41.9, 41.9, 0.6, 0.5], [27.8, 41.75, 0.6, 0.2],
  [24.6, 47.3, 1.2, 0.6], [18.4, 44.2, 1.2, 0.6], [17.6, 45.5, 0.8, 0.2], [49.3, 37.2, 0.8, 0.3], [22.0, 44.1, 0.5, 0.4]];
export const MARSHES = [[47.0, 31.1, 0.8, 0.5], [31.2, 31.25, 0.9, 0.3], [29.3, 45.2, 0.5, 0.35], [38.0, 45.45, 0.5, 0.3], [36.4, 36.36, 0.2, 0.15], [34.5, 45.95, 0.6, 0.2], [32.9, 46.55, 0.4, 0.15]];

export const LAKES = [
  { name: 'Lake Van', pts: [[42.28, 38.52], [42.45, 38.76], [42.75, 38.83], [43.05, 38.97], [43.45, 38.98], [43.6, 38.8], [43.3, 38.64], [43.28, 38.45], [43.1, 38.32], [42.7, 38.36]] },
  { name: 'Lake Tuz', pts: [[33.1, 39.02], [33.38, 39.05], [33.5, 38.85], [33.68, 38.6], [33.55, 38.42], [33.3, 38.5], [33.2, 38.78]] },
  { name: 'Lake Beyşehir', pts: [[31.4, 37.95], [31.58, 37.9], [31.68, 37.7], [31.55, 37.55], [31.42, 37.7]] },
  { name: 'Lake Eğirdir', pts: [[30.75, 38.25], [30.9, 38.2], [30.9, 37.98], [30.84, 37.9], [30.76, 38.0]] },
  { name: 'Lake İznik', pts: [[29.35, 40.47], [29.7, 40.48], [29.72, 40.4], [29.36, 40.39]] },
  { name: 'Lake Çıldır', pts: [[43.15, 41.1], [43.35, 41.05], [43.3, 40.95], [43.2, 41.0]] },
  { name: 'Lake Urmia', pts: [[45.1, 38.2], [45.45, 38.3], [45.75, 37.95], [45.95, 37.55], [45.9, 37.15], [45.55, 37.1], [45.3, 37.45], [45.2, 37.8]] },
  { name: 'Lake Sevan', pts: [[44.95, 40.6], [45.2, 40.5], [45.6, 40.2], [45.5, 40.1], [45.15, 40.3]] },
  { name: 'Dead Sea', pts: [[35.45, 31.75], [35.6, 31.75], [35.55, 31.1], [35.4, 31.1]] },
  { name: 'Lake Balaton', pts: [[17.25, 46.72], [17.9, 46.96], [18.15, 47.06], [18.12, 46.98], [17.6, 46.76], [17.3, 46.67]] },
  { name: 'Lake Scutari', pts: [[19.05, 42.3], [19.35, 42.25], [19.45, 42.05], [19.25, 42.15]] },
  { name: 'Lake Ohrid', pts: [[20.65, 41.1], [20.78, 41.07], [20.78, 40.92], [20.66, 40.95]] },
];
export const RIVERS = [
  { name: 'Kızılırmak', pts: [[38.3, 39.85], [37.75, 39.88], [37.0, 39.68], [36.2, 39.3], [35.55, 38.95], [34.85, 38.72], [34.3, 38.8], [33.85, 39.25], [33.55, 39.8], [33.75, 40.35], [34.2, 40.85], [34.8, 40.97], [35.15, 41.25], [35.9, 41.55], [35.96, 41.73]] },
  { name: 'Sakarya', pts: [[31.0, 39.35], [31.6, 39.4], [32.1, 39.62], [31.85, 39.95], [31.2, 40.1], [30.5, 40.05], [30.2, 40.25], [30.3, 40.52], [30.42, 40.8], [30.65, 41.12]] },
  { name: 'Yeşilırmak', pts: [[37.5, 40.2], [36.55, 40.33], [36.08, 40.39], [35.83, 40.65], [36.2, 40.75], [36.6, 40.75], [36.73, 41.2], [36.65, 41.38]] },
  { name: 'Çoruh', pts: [[40.23, 40.26], [41.0, 40.48], [41.54, 40.82], [41.82, 41.18], [41.68, 41.36], [41.6, 41.6]] },
  { name: 'Euphrates', pts: [[41.0, 39.97], [40.7, 39.92], [40.39, 39.78], [39.49, 39.72], [39.03, 39.6], [38.5, 39.26], [38.75, 38.8], [38.7, 38.4], [39.14, 38.23], [38.8, 37.9], [38.32, 37.48], [37.98, 37.02], [38.0, 36.82], [38.2, 36.3], [38.6, 35.9], [39.0, 35.94], [40.15, 35.33], [40.92, 34.45], [41.98, 34.37], [42.38, 34.13], [42.83, 33.64], [43.3, 33.42], [43.78, 33.35], [44.4, 32.5], [45.28, 31.31], [46.26, 31.04], [47.43, 31.0], [47.83, 30.5], [48.55, 29.95]] },
  { name: 'Murat', pts: [[43.7, 39.55], [43.05, 39.7], [42.78, 39.54], [42.5, 39.15], [42.2, 39.0], [41.5, 38.85], [40.55, 38.75], [39.93, 38.69], [38.75, 38.8]] },
  { name: 'Tigris', pts: [[39.5, 38.45], [39.75, 38.25], [40.2, 37.9], [40.7, 37.82], [41.2, 37.85], [41.41, 37.71], [41.85, 37.7], [42.19, 37.33], [42.36, 37.11], [43.13, 36.34], [43.24, 35.5], [43.68, 34.6], [43.87, 34.2], [44.4, 33.33], [45.82, 32.5], [47.15, 31.85], [47.43, 31.0]] },
  { name: 'Aras', pts: [[41.4, 39.6], [41.7, 39.95], [42.17, 40.04], [43.1, 40.12], [43.66, 40.1], [44.4, 39.75], [44.8, 39.63], [45.45, 39.0], [46.2, 38.87], [46.6, 38.9], [47.3, 39.35], [48.0, 39.65], [48.4, 39.98]] },
  { name: 'Kura', pts: [[42.6, 40.85], [42.7, 41.1], [43.0, 41.6], [43.5, 41.85], [44.1, 41.98], [44.8, 41.7], [45.4, 41.4], [46.3, 41.05], [47.05, 40.77], [47.9, 40.2], [48.4, 39.98], [48.95, 39.6], [49.4, 39.35]] },
  { name: 'Seyhan', pts: [[36.3, 38.75], [35.75, 38.3], [35.5, 37.7], [35.4, 37.4], [35.33, 37.0], [34.95, 36.73]] },
  { name: 'Ceyhan', pts: [[37.2, 38.2], [36.85, 37.5], [36.3, 37.3], [35.82, 37.03], [35.63, 36.96], [35.56, 36.58]] },
  { name: 'Orontes', pts: [[36.2, 34.2], [36.7, 34.7], [36.75, 35.13], [36.35, 35.8], [36.16, 36.2], [35.96, 36.05]] },
  { name: 'Gediz', pts: [[29.6, 38.95], [28.9, 38.7], [28.15, 38.52], [27.45, 38.65], [26.82, 38.6]] },
  { name: 'Büyük Menderes', pts: [[30.15, 38.07], [29.6, 38.0], [28.92, 37.92], [28.32, 37.88], [27.85, 37.8], [27.4, 37.7], [27.2, 37.55]] },
  { name: 'Meriç', pts: [[23.7, 42.2], [24.33, 42.2], [24.75, 42.15], [25.55, 42.05], [26.2, 41.77], [26.55, 41.66], [26.58, 41.35], [26.35, 41.0], [26.2, 40.85], [26.04, 40.73]] },
  { name: 'Danube', pts: [[16.4, 48.2], [17.1, 48.14], [18.1, 47.75], [18.74, 47.8], [19.13, 47.78], [19.05, 47.5], [18.93, 46.18], [18.7, 45.99], [19.0, 45.35], [19.85, 45.25], [20.46, 44.82], [20.93, 44.67], [22.4, 44.7], [22.66, 44.62], [22.87, 43.99], [23.24, 43.83], [24.9, 43.7], [25.97, 43.87], [27.26, 44.12], [28.03, 44.34], [27.97, 45.27], [28.05, 45.44], [28.84, 45.33], [29.66, 45.15]] },
  { name: 'Sava', pts: [[14.5, 46.05], [15.98, 45.8], [16.37, 45.47], [18.0, 45.15], [19.7, 44.77], [20.46, 44.82]] },
  { name: 'Tisza', pts: [[22.3, 48.2], [21.4, 48.12], [20.2, 47.17], [20.15, 46.25], [20.3, 45.15]] },
  { name: 'Vardar', pts: [[21.43, 42.0], [21.78, 41.72], [22.5, 41.15], [22.72, 40.5]] },
  { name: 'Dniester', pts: [[26.5, 48.55], [27.8, 48.45], [28.3, 48.16], [29.0, 47.4], [29.5, 46.8], [30.2, 46.35], [30.45, 46.1]] },
  { name: 'Dnieper', pts: [[34.0, 49.0], [35.05, 48.46], [35.1, 47.85], [34.6, 47.5], [33.4, 46.75], [32.6, 46.6], [32.0, 46.55]] },
  { name: 'Don', pts: [[43.6, 48.75], [42.1, 47.65], [40.6, 47.5], [39.7, 47.22], [39.3, 47.15]] },
  { name: 'Volga', pts: [[44.6, 49.0], [44.6, 48.6], [46.2, 48.3], [47.2, 47.2], [48.05, 46.35], [47.9, 45.8]] },
  { name: 'Nile', pts: [[30.4, 20.5], [31.3, 21.8], [31.6, 22.35], [32.9, 24.09], [32.65, 25.7], [32.72, 26.16], [32.25, 26.05], [31.7, 26.55], [31.18, 27.18], [30.75, 28.1], [31.1, 29.07], [31.23, 30.05], [30.8, 30.8], [30.37, 31.46]] },
  { name: 'Nile (Damietta branch)', pts: [[31.23, 30.05], [31.25, 30.6], [31.4, 31.0], [31.82, 31.5]] },
];

// ---------- railways. stage 0 = open in 1936; 1–4 = built as the national infrastructure grows ----------
export const RAILWAYS = [
  { name: 'Oriental Railway', stage: 0, via: ['İstanbul', 'Çatalca', 'Çorlu', 'Lüleburgaz', [26.93, 41.35], 'Uzunköprü', [26.6, 41.45], 'Edirne'] },
  { name: 'Kırklareli Branch', stage: 0, via: [[27.1, 41.38], 'Kırklareli'] },
  { name: 'Anatolian Railway', stage: 0, via: [[29.02, 40.99], 'İzmit', [30.36, 40.7], [30.25, 40.45], 'Bilecik', 'Eskişehir', [31.3, 39.6], 'Polatlı', 'Ankara'] },
  { name: 'Eskişehir–Konya Line', stage: 0, via: ['Eskişehir', 'Kütahya', 'Afyon', 'Akşehir', [31.91, 38.28], 'Konya'] },
  { name: 'Baghdad Railway', stage: 0, via: ['Konya', 'Karaman', 'Ereğli', 'Ulukışla', [34.87, 37.43], [35.05, 36.98], 'Adana', [35.82, 37.03], 'Osmaniye', [36.58, 37.2], 'Islahiye', [36.75, 36.83]] },
  { name: 'Baghdad Railway (Frontier Section)', stage: 0, via: [[37.47, 36.68], [38.01, 36.86], [38.95, 36.74], [40.03, 36.88], [40.65, 37.1], 'Nusaybin'] },
  { name: 'Mersin–Adana Line', stage: 0, via: ['Mersin', 'Tarsus', [35.05, 36.98]] },
  { name: 'İskenderun Branch', stage: 0, via: ['Osmaniye', [36.2, 36.95], [36.22, 36.84], 'İskenderun'] },
  { name: 'Ankara–Sivas Line', stage: 0, via: ['Ankara', 'Kırıkkale', 'Yerköy', [35.25, 38.85], 'Kayseri', [36.0, 39.15], 'Şarkışla', 'Sivas'] },
  { name: 'Kayseri–Ulukışla Line', stage: 0, via: ['Kayseri', [35.1, 38.38], 'Niğde', 'Ulukışla'] },
  { name: 'Samsun–Sivas Line', stage: 0, via: ['Samsun', [35.66, 40.97], 'Amasya', [36.08, 40.39], [36.3, 40.1], [36.6, 39.87], 'Sivas'] },
  { name: 'Fevzipaşa–Diyarbakır Line', stage: 0, via: [[36.65, 37.1], [37.14, 37.39], [37.65, 37.78], [37.88, 38.1], 'Malatya', [38.75, 38.42], [39.33, 38.52], 'Ergani', 'Diyarbakır'] },
  { name: 'Elazığ Spur', stage: 0, via: [[39.33, 38.52], 'Elazığ'] },
  { name: 'Irmak–Zonguldak Coal Line', stage: 0, via: ['Kırıkkale', [33.42, 40.0], 'Çankırı', [33.05, 40.85], 'Karabük', [32.2, 41.4], [32.05, 41.55], 'Zonguldak'] },
  { name: 'İzmir–Afyon Line', stage: 0, via: ['İzmir', 'Manisa', [28.14, 38.48], [28.52, 38.35], 'Uşak', 'Afyon'] },
  { name: 'İzmir–Bandırma Line', stage: 0, via: ['Manisa', [27.84, 38.92], [27.61, 39.19], 'Balıkesir', [28.16, 39.91], 'Bandırma'] },
  { name: 'İzmir–Eğirdir Line', stage: 0, via: ['İzmir', [27.37, 37.95], 'Aydın', 'Nazilli', 'Denizli', [29.6, 37.98], 'Dinar', [30.5, 37.95], 'Eğirdir'] },
  { name: 'Kütahya–Balıkesir Line', stage: 0, via: ['Kütahya', [29.5, 39.55], [28.63, 39.59], 'Balıkesir'] },
  { name: 'Afyon–Isparta Line', stage: 0, via: ['Afyon', [30.27, 38.47], 'Dinar', 'Isparta'] },
  { name: 'Kars Line', stage: 0, via: ['Erzurum', 'Horasan', 'Sarıkamış', 'Kars', [43.65, 40.74]] },
  { name: 'Bursa–Mudanya Line', stage: 0, via: ['Bursa', 'Mudanya'] },
  { name: 'Sivas–Erzurum Line', stage: 1, via: ['Sivas', [37.62, 39.25], 'Divriği', 'Kemah', 'Erzincan', [40.39, 39.78], [40.7, 39.92], 'Erzurum'] },
  { name: 'Malatya–Çetinkaya Link', stage: 1, via: ['Malatya', [37.93, 38.82], [37.62, 39.25]] },
  { name: 'Diyarbakır–Kurtalan Line', stage: 2, via: ['Diyarbakır', [40.67, 37.85], [41.13, 37.88], [41.7, 37.93], 'Siirt'] },
  { name: 'Gaziantep Line', stage: 2, via: [[37.14, 37.39], 'Gaziantep', [37.8, 37.0], [38.01, 36.86]] },
  { name: 'Van Line', stage: 3, via: ['Elazığ', [39.93, 38.69], [40.56, 38.75], 'Muş', [42.28, 38.5], [42.7, 38.32], [43.1, 38.28], 'Van', [44.4, 38.48]] },
  { name: 'Trabzon Line', stage: 4, via: ['Erzincan', [39.43, 40.13], 'Gümüşhane', 'Trabzon'] },
  { name: 'Antalya Line', stage: 4, via: ['Isparta', [30.55, 37.4], 'Antalya'] },
];

export const SEA_LABELS = [
  ['BLACK SEA', 34.2, 43.3, 1.3], ['MEDITERRANEAN SEA', 24.5, 33.9, 1.2], ['AEGEAN SEA', 25.1, 38.75, 0.7, -60], ['SEA OF MARMARA', 28.2, 40.72, 0.45],
  ['CASPIAN SEA', 50.5, 42.4, 1.0, -60], ['RED SEA', 36.9, 23.9, 0.9, 58], ['PERSIAN GULF', 50.6, 27.9, 0.7, -35], ['ADRIATIC SEA', 16.5, 42.6, 0.8, 38],
  ['IONIAN SEA', 18.4, 37.6, 0.9], ['SEA OF AZOV', 36.6, 46.1, 0.55], ['Levantine Sea', 32.4, 33.9, 0.8], ['Bosphorus', 29.5, 41.38, 0.4], ['Dardanelles', 25.75, 40.02, 0.4],
];
export const COUNTRY_LABELS = [['SOV', 'SOVIET UNION', 41.0, 46.6, 19], ['IRN', 'IRAN', 49.6, 34.4, 14], ['IRQ', 'IRAQ', 43.0, 32.3, 13], ['FRA', 'SYRIA', 38.6, 35.0, 11],
  ['EGY', 'EGYPT', 29.0, 27.3, 15], ['SAU', 'SAUDI ARABIA', 43.5, 25.6, 14], ['GRC', 'GREECE', 21.9, 39.45, 9], ['BUL', 'BULGARIA', 25.3, 42.75, 10],
  ['YUG', 'YUGOSLAVIA', 19.0, 44.3, 12], ['ROM', 'ROMANIA', 25.0, 45.9, 13], ['HUN', 'HUNGARY', 19.4, 46.85, 10], ['LBY', 'ITALIAN LIBYA', 18.5, 27.5, 14],
  ['GBR', 'PALESTINE', 35.9, 30.9, 7], ['ITA', 'ITALY', 16.0, 40.7, 10], ['SUD', 'SUDAN', 31.0, 21.1, 9]];
export const HOME_LABEL = [34.3, 39.25];

// Rough outline of the Ottoman Empire at its height, c. 1683 (dashed overlay). It leaves the map on the west (Tripoli,
// Tunis, Algiers) and the south (Yemen, Habesh), where it follows the edge of the extent.
export const EMPIRE = [[17.6, 47.9], [18.4, 48.1], [20.2, 48.2], [22.0, 48.3], [24.0, 47.9], [25.6, 48.3], [26.5, 48.7], [27.8, 48.9], [29.5, 48.4], [31.5, 47.9],
  [33.5, 47.6], [36.0, 47.5], [38.5, 47.6], [39.9, 47.3], [40.4, 45.8], [40.6, 44.2], [41.6, 43.2], [43.4, 42.5], [43.7, 41.3], [43.8, 40.2], [44.6, 39.7],
  [44.3, 38.4], [44.8, 37.2], [46.0, 35.8], [45.6, 34.3], [46.2, 33.2], [47.8, 31.8], [48.6, 30.0], [48.4, 28.9], [50.2, 26.9], [51.4, 25.8], [50.8, 24.8],
  [49.2, 25.0], [47.8, 27.2], [46.4, 29.2], [44.4, 30.3], [42.0, 31.0], [40.0, 30.5], [38.6, 29.0], [40.0, 26.5], [41.0, 24.0], [41.6, 22.0], [41.9, 20.7],
  [37.0, 20.7], [36.4, 22.2], [35.6, 23.4], [34.4, 23.4], [33.2, 22.0], [31.2, 22.0], [30.0, 24.0], [29.0, 27.0], [26.6, 28.6], [24.6, 29.4], [23.0, 27.6],
  [21.0, 25.6], [17.2, 24.0], [14.2, 24.4], [14.2, 33.2], [18.4, 35.4], [20.6, 36.5], [20.5, 38.2], [20.2, 39.5], [19.2, 40.5], [19.2, 41.8], [18.5, 42.4],
  [17.5, 43.0], [16.5, 43.7], [15.8, 44.3], [15.7, 44.95], [16.6, 45.25], [17.2, 45.7], [16.9, 46.4], [17.2, 47.2]];

// where fleet counters sit: our fleets by id, and "enemy:<front id>" for the enemy squadron on each naval front
export const FLEET_AT = { north: [31.2, 42.2], south: [26.25, 38.85], 'enemy:aeg': [24.9, 36.1], 'enemy:bla': [33.4, 43.7] };

// ---------- flavour ----------
export const META = {
  name: 'Turkey',
  long: 'Republic of Turkey',
  empire: 'Ottoman Empire',
  year: 1936,
  blurb: 'Seven fronts from the Danube to the Tigris. Restore the empire of Süleyman.',
  pitch: 'a 1936 grand-strategy war map of Turkey',
  flag: { type: 'h3', colors: ['#d7141a', '#d7141a', '#d7141a'], disc: '#f4f1e8' },
  regionWord: 'Eyalet',
  // FOREIGN region → its Ottoman eyalet, sanjak or vassal principality
  regions: {
    'Sofia & the West': 'Rumeli', 'Danubian Bulgaria': 'Silistre', 'Eastern Rumelia': 'Filibe', 'Western Thrace': 'Gümülcine', 'Macedonia': 'Selanik',
    'Epirus & Thessaly': 'Yanya', 'Attica & Euboea': 'Eğriboz', 'Morea': 'Mora', 'Crete': 'Girit', 'Aegean Islands': 'Cezayir-i Bahr-i Sefid', 'Dodecanese': 'Rodos',
    'Serbia': 'Semendire', 'Vojvodina': 'Sirem', 'Kosovo': 'Kosova', 'Vardar Macedonia': 'Üsküp', 'Montenegro': 'Karadağ', 'Bosnia': 'Bosna', 'Herzegovina': 'Hersek',
    'Wallachia': 'Eflak', 'Dobruja': 'Dobruca', 'Moldavia': 'Boğdan', 'Bessarabia': 'Bender', 'Transylvania': 'Erdel', 'Banat': 'Temeşvar',
    'Buda': 'Budin', 'Transdanubia': 'Kanije', 'Great Plain': 'Eğri', 'Albania': 'Arnavutluk',
    'Georgian SSR': 'Gürcistan', 'Meskheti': 'Çıldır', 'Armenian SSR': 'Revan', 'Azerbaijan SSR': 'Şirvan', 'Nakhichevan ASSR': 'Nahçıvan',
    'Crimea': 'Kırım', 'Southern Ukraine': 'Özi', 'Budjak': 'Bucak', 'Azov': 'Azak', 'Kuban & Circassia': 'Çerkezistan',
    'Azerbaijan': 'Tebriz', 'Kurdistan': 'Erdelan', 'Kermanshah & Hamadan': 'Hemedan', 'Luristan': 'Luristan',
    'Baghdad': 'Bağdat', 'Basra': 'Basra', 'Mosul': 'Musul', 'Shahrizor': 'Şehrizor', 'Western Desert': 'Dulaym', 'Kuwait': 'Kuveyt',
    'Aleppo': 'Halep', 'Damascus': 'Şam', 'Latakia': 'Trablusşam', 'Jazira': 'Rakka', 'Lebanon': 'Sayda', 'Palestine': 'Kudüs', 'Trans-Jordan': 'Kerek',
    'Lower Egypt': 'Mısır', 'Upper Egypt': 'Said', 'Sinai': 'Tih', 'Red Sea Coast': 'Kuseyr', 'Hejaz': 'Hicaz', 'Jabal Shammar': 'Cebel-i Şammar',
    'Cyprus': 'Kıbrıs', 'Podolia & Bukovina': 'Podolya', 'Al-Hasa': 'Lahsa', 'Cyrenaica': 'Bingazi', 'Tripolitania': 'Trablusgarp', 'Fezzan': 'Fizan',
  },
  capitalFalls: 'The Grand National Assembly withdraws to Sivas. The war goes on.',
  capitalFreed: 'Ankara is free again. The Assembly returns to the capital.',
  fightsOnFrom: 'Sivas',
  honor: {
    thr: ['Trakya', 'Edirne', 'Çatalca', 'Kırklareli', 'Tekirdağ', 'Gelibolu', 'İstanbul', 'Meriç', 'Istranca', 'Lüleburgaz'],
    cau: ['Erzurum', 'Kars', 'Sarıkamış', 'Ardahan', 'Artvin', 'Aras', 'Çoruh', 'Palandöken', 'Allahuekber', 'Oltu'],
    per: ['Van', 'Hakkâri', 'Ağrı', 'Çaldıran', 'Başkale', 'Bitlis', 'Muş', 'Süphan', 'Erciş', 'Tendürek'],
    mes: ['Diyarbakır', 'Mardin', 'Siirt', 'Cizre', 'Dicle', 'Cudi', 'Midyat', 'Karacadağ', 'Silvan', 'Botan'],
    lev: ['Adana', 'Çukurova', 'Antep', 'Maraş', 'Urfa', 'Toros', 'Amanos', 'Kilis', 'Fırat', 'Seyhan'],
    aeg: ['İzmir', 'Ege', 'Çanakkale', 'Menderes', 'Gediz', 'Bodrum', 'Muğla', 'Aydın', 'Manisa', 'Kazdağı'],
    bla: ['Karadeniz', 'Samsun', 'Trabzon', 'Sinop', 'Giresun', 'Rize', 'Zonguldak', 'Kızılırmak', 'Canik', 'İnebolu'],
  },
  // invented officers; none is a historical person
  commanders: {
    thr: 'Gen. Rüştü Meriçli', cau: 'Gen. Hamdi Palandöken', per: 'Gen. Şevki Süphanoğlu', mes: 'Gen. Nazmi Dicleli',
    lev: 'Gen. Tevfik Toroslu', aeg: 'Adm. Sabri Egeli', bla: 'Adm. Hayri Karadenizli',
  },
  oob: {
    thr: ['inf', 'inf', 'arm', 'cav'], cau: ['mtn', 'inf', 'inf', 'art'], per: ['mtn', 'cav', 'inf'], mes: ['inf', 'cav', 'mtn'],
    lev: ['inf', 'inf', 'cav', 'art'], aeg: ['inf', 'mar', 'inf'], bla: ['inf', 'mar', 'mtn'],
  },
  guard: [['grd', 'Presidential Guard Regiment “Muhafız”'], ['cav', '1st Ankara Guard Cavalry Brigade']],
  officerNames: {
    first: ['Ahmet', 'Mehmet', 'Hasan', 'Hüseyin', 'İbrahim', 'Osman', 'Halil', 'Necati', 'Rıza', 'Şükrü', 'Cemal', 'Nuri', 'Hakkı', 'Ziya', 'Vehbi', 'Sıtkı'],
    last: ['Demirel', 'Yıldırım', 'Aksoy', 'Çelik', 'Öztürk', 'Kılıç', 'Arslan', 'Doğan', 'Şahin', 'Korkmaz', 'Erdem', 'Tuna', 'Sancak', 'Bozkır', 'Akıncı', 'Kayahan'],
    ranks: { div: 'Tümg.', bde: 'Alb.', guard: 'Korg.' },
  },
  wings: [
    { name: '1st Air Regiment', type: 'fighter', model: 'Curtiss Hawk II', base: 'Eskişehir', planes: 24 },
    { name: '2nd Air Regiment', type: 'cas', model: 'Breguet 19', base: 'Diyarbakır', planes: 24 },
    { name: '3rd Air Regiment', type: 'fighter', model: 'PZL P.24', base: 'İzmir', planes: 18 },
    { name: '4th Air Regiment', type: 'bomber', model: 'Breguet 19 B2', base: 'Kütahya', planes: 18 },
  ],
  newWingModels: { fighter: 'Hawker Hurricane', cas: 'Vultee V-11', bomber: 'Martin 139W' },
  fleets: [
    { id: 'north', name: 'Battle Fleet', base: 'Gölcük', sea: 'Black Sea', fronts: ['bla', 'thr', 'cau'],
      ships: [['Yavuz', 'Battlecruiser'], ['Hamidiye', 'Cruiser'], ['Adatepe', 'Destroyer'], ['Kocatepe', 'Destroyer'], ['Sakarya', 'Submarine'], ['Dumlupınar', 'Submarine'], ['Nusret', 'Minelayer']] },
    { id: 'south', name: 'Aegean Squadron', base: 'İzmir', sea: 'Aegean Sea', fronts: ['aeg', 'lev', 'mes', 'per'],
      ships: [['Mecidiye', 'Cruiser'], ['Tınaztepe', 'Destroyer'], ['Zafer', 'Destroyer'], ['Birinci İnönü', 'Submarine'], ['İkinci İnönü', 'Submarine'], ['Gür', 'Submarine'], ['Peyk', 'Torpedo Gunboat'], ['Berk', 'Torpedo Gunboat']] },
  ],
  shipNames: ['Sultanhisar', 'Demirhisar', 'Muavenet', 'Gayret', 'Saldıray', 'Atılay', 'Yıldıray', 'Batıray', 'Gelibolu', 'Giresun', 'Gaziantep', 'Preveze',
    'Barbaros', 'Turgut Reis', 'Mızrak', 'Kılıç', 'Yıldız', 'Karayel', 'Akhisar', 'Sivrihisar', 'Anadolu', 'Alçıtepe', 'Şimşek', 'Tufan'],
  operations: ['Ergenekon', 'Asena', 'Ötüken', 'Orhun', 'Malazgirt', 'Sakarya', 'Dumlupınar', 'Mohaç', 'Preveze', 'Çaldıran', 'Kızıl Elma', 'Fetih', 'Yıldırım', 'Tuğrul', 'Büyük Taarruz', 'Söğüt'],
  enemyOperations: ['Lepanto', 'Navarino', 'Chesma', 'Sinope', 'Plevna', 'Shipka', 'Zenta', 'Kahlenberg', 'Karlowitz', 'Megiddo', 'Kagul', 'Sèvres'],
  nicknames: ['Lions', 'Falcons', 'Eagles', 'Wolves', 'Ghazis', 'Akıncıs', 'Thunderbolts', 'Hawks'],
  // per state: [infrastructure 0–5, civilian factories, military factories, dockyards]
  stateStart: {
    'Thrace': [2, 1, 0, 0], 'Marmara': [3, 4, 1, 2], 'Aegean': [3, 3, 1, 1], 'Western Black Sea': [2, 2, 1, 0], 'Pontus': [1, 1, 0, 0],
    'Ankara': [3, 2, 2, 0], 'Konya': [2, 1, 0, 0], 'Cappadocia': [2, 2, 1, 0], 'Antalya': [1, 0, 0, 0], 'Çukurova': [2, 2, 0, 0],
    'Erzurum': [1, 0, 1, 0], 'Van': [0, 0, 0, 0], 'Diyarbakır': [1, 1, 0, 0],
  },
  weather: { cau: 'snow', per: 'snow', mes: 'heat', lev: 'heat' },
  enemyAdjectives: { BUL: 'Bulgarian', SOV: 'Soviet', IRN: 'Iranian', IRQ: 'Iraqi', FRA: 'French', GRC: 'Greek', GBR: 'British', YUG: 'Yugoslav', ROM: 'Romanian',
    HUN: 'Hungarian', ALB: 'Albanian', EGY: 'Egyptian', SAU: 'Saudi', LBY: 'Italian', ITA: 'Italian' },
  // the rank names of the 1935 reform
  ranks: [['Er', 'Private'], ['Onbaşı', 'Corporal'], ['Çavuş', 'Sergeant'], ['Teğmen', 'Lieutenant'], ['Yüzbaşı', 'Captain'], ['Binbaşı', 'Major'],
    ['Yarbay', 'Lieutenant Colonel'], ['Albay', 'Colonel'], ['Tümgeneral', 'Major General'], ['Korgeneral', 'Lieutenant General'], ['Orgeneral', 'General'], ['Mareşal', 'Marshal']],
  landmarks: [
    { city: 'Budapest', medal: 'Kızıl Elma', desc: 'Raise the standard over Buda, the “Red Apple” of the old campaigns' },
    { city: 'Baghdad', medal: 'Baghdad Kiosk', desc: 'Enter Baghdad, as the army did in 1638' },
  ],
  medalNames: {
    ten: 'Medal of Independence', fifty: 'Order of the Mecidiye', decisive: 'Order of the Osmaniye', week: 'Liyakat Medal', month: 'İmtiyaz Medal',
    phoenix: 'Zümrüdüanka', allfronts: 'Seven Horsetails', defender: 'Defender of Ankara', satrap: 'Beylerbeyi', comeback: 'Plevne',
    empire: 'Padişah', hundred: 'Seyahatname', elite: 'The Janissaries', kaveh: 'Sakarya', operation: 'Sancak', qanat: 'Master Builder',
  },
  masthead: 'CUMHURİYET ORDUSU',
  days: [
    { month: 10, day: 29, text: 'Cumhuriyet Bayramı kutlu olsun. The Republic keeps its birthday on every front.' },
    { month: 8, day: 30, text: 'Zafer Bayramı. Victory Day: Dumlupınar, 1922.' },
    { month: 4, day: 23, text: '23 Nisan. The Assembly first sat in Ankara on this day in 1920.' },
    { month: 5, day: 19, text: '19 Mayıs. A landing at Samsun began it all.' },
  ],
  motto: 'Yurtta sulh, cihanda sulh — “Peace at home, peace in the world.”',
};
