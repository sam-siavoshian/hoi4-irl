// Hand-authored geography: 1936 country groupings, cities, buildings, terrain, rivers, lakes, railways.
// Coordinates are [lon, lat]. City tuple: [name, lon, lat, vp?, flags?]
// flags: P port, N naval base, A airbase, S supply hub, R refinery/oil, F fort, C capital

export const EXTENT = { lon0: 24, lon1: 76, lat0: 21.5, lat1: 47 };

// 1936 political entities built from modern polygons
export const COUNTRIES = {
  IRN: { name: 'Iran', long: 'Imperial State of Iran', color: '#3f8f7a', from: ['Iran'], spacing: 0.8 },
  SOV: { name: 'Soviet Union', long: 'Union of Soviet Socialist Republics', color: '#8c2f2a',
    from: ['Russia', 'Georgia', 'Armenia', 'Azerbaijan', 'Turkmenistan', 'Uzbekistan', 'Tajikistan', 'Kyrgyzstan', 'Kazakhstan', 'Ukraine', 'Moldova', 'Baikonur'], spacing: 1.25 },
  TUR: { name: 'Turkey', long: 'Republic of Turkey', color: '#b3a376', from: ['Turkey'], spacing: 1.2 },
  IRQ: { name: 'Iraq', long: 'Kingdom of Iraq', color: '#8a7a4d', from: ['Iraq'], spacing: 1.1 },
  AFG: { name: 'Afghanistan', long: 'Kingdom of Afghanistan', color: '#5d93a6', from: ['Afghanistan'], spacing: 1.1 },
  RAJ: { name: 'British Raj', long: 'British Raj', color: '#a8475a', from: ['Pakistan', 'India', 'Siachen Glacier'], spacing: 1.3 },
  GBR: { name: 'British Protectorates', long: 'British Mandates & Protectorates', color: '#b0586a',
    from: ['Kuwait', 'Bahrain', 'Qatar', 'United Arab Emirates', 'Oman', 'Jordan', 'Israel', 'Palestine', 'Cyprus', 'N. Cyprus', 'Cyprus U.N. Buffer Zone', 'Dhekelia', 'Akrotiri'], spacing: 1.2 },
  SAU: { name: 'Saudi Arabia', long: 'Kingdom of Saudi Arabia', color: '#6f8556', from: ['Saudi Arabia'], spacing: 1.6 },
  FRA: { name: 'French Levant', long: 'French Mandate of Syria & Lebanon', color: '#4a67a8', from: ['Syria', 'Lebanon'], spacing: 1.2 },
  EGY: { name: 'Egypt', long: 'Kingdom of Egypt', color: '#b89a5e', from: ['Egypt'], spacing: 1.5 },
  GRC: { name: 'Greece', long: 'Kingdom of Greece', color: '#5a8fb8', from: ['Greece'], spacing: 1.6 },
  BUL: { name: 'Bulgaria', long: 'Tsardom of Bulgaria', color: '#5f7a4a', from: ['Bulgaria'], spacing: 1.6 },
  ROM: { name: 'Romania', long: 'Kingdom of Romania', color: '#b8a03a', from: ['Romania'], spacing: 1.6 },
  CHI: { name: 'Sinkiang', long: 'Sinkiang', color: '#7d7f9c', from: ['China'], spacing: 1.8 },
  ITA: { name: 'Italian Libya', long: 'Italian Libya', color: '#5c8a5c', from: ['Libya'], spacing: 1.8 },
  SUD: { name: 'Anglo-Egyptian Sudan', long: 'Anglo-Egyptian Sudan', color: '#9a6f6a', from: ['Sudan'], spacing: 1.8 },
};

// Iranian states (ostans, c. 1937) and their cities
export const IRAN_STATES = {
  'Azerbaijan': [
    ['Tabriz', 46.29, 38.08, 20, 'AS'], ['Urmia', 45.07, 37.55, 5], ['Ardabil', 48.29, 38.25, 5], ['Khoy', 44.95, 38.55, 1],
    ['Maku', 44.52, 39.29, 1, 'F'], ['Julfa', 45.63, 38.94, 3, 'F'], ['Maragheh', 46.24, 37.39, 1], ['Mahabad', 45.72, 36.76, 1],
    ['Mianeh', 47.71, 37.42, 1], ['Astara', 48.87, 38.43, 1, 'F'], ['Ahar', 47.07, 38.48, 1], ['Marand', 45.77, 38.43, 1],
  ],
  'Gilan': [
    ['Rasht', 49.58, 37.28, 5], ['Bandar Pahlavi', 49.46, 37.47, 5, 'PN'], ['Lahijan', 50.0, 37.2, 1], ['Zanjan', 48.48, 36.67, 3],
  ],
  'Mazandaran': [
    ['Sari', 53.06, 36.56, 3], ['Babol', 52.68, 36.55, 1], ['Chalus', 51.42, 36.65, 1], ['Amol', 52.35, 36.47, 1],
    ['Gorgan', 54.43, 36.84, 3], ['Bandar Shah', 54.07, 36.9, 3, 'P'], ['Gonbad-e Qabus', 55.17, 37.25, 1, 'F'], ['Ramsar', 50.66, 36.92, 1],
  ],
  'Tehran': [
    ['Tehran', 51.39, 35.69, 50, 'CASF'], ['Karaj', 50.99, 35.83, 3], ['Qazvin', 50.0, 36.27, 5, 'S'], ['Qom', 50.88, 34.64, 5],
    ['Semnan', 53.39, 35.57, 3], ['Damghan', 54.34, 36.17, 1], ['Shahrud', 54.97, 36.42, 1], ['Saveh', 50.36, 35.02, 1],
    ['Varamin', 51.65, 35.32, 1], ['Garmsar', 52.34, 35.22, 1],
  ],
  'Kurdistan': [
    ['Sanandaj', 47.0, 35.31, 3], ['Kermanshah', 47.07, 34.31, 10, 'AS'], ['Hamadan', 48.51, 34.8, 5], ['Saqqez', 46.27, 36.25, 1],
    ['Qasr-e Shirin', 45.58, 34.52, 1, 'F'], ['Malayer', 48.82, 34.3, 1], ['Ilam', 46.42, 33.64, 1], ['Bijar', 47.6, 35.87, 1],
  ],
  'Luristan': [
    ['Khorramabad', 48.36, 33.49, 3], ['Borujerd', 48.75, 33.9, 1], ['Arak', 49.69, 34.09, 3, 'S'], ['Golpayegan', 50.29, 33.45, 1],
  ],
  'Khuzestan': [
    ['Ahvaz', 48.68, 31.32, 10, 'AS'], ['Abadan', 48.3, 30.34, 15, 'PR'], ['Khorramshahr', 48.17, 30.44, 5, 'PNF'], ['Bandar Shahpur', 49.08, 30.43, 5, 'P'],
    ['Dezful', 48.4, 32.38, 3], ['Masjed Soleyman', 49.3, 31.94, 5, 'R'], ['Behbahan', 50.24, 30.6, 1], ['Shushtar', 48.85, 32.05, 1],
  ],
  'Isfahan': [
    ['Isfahan', 51.67, 32.65, 20, 'AS'], ['Kashan', 51.44, 33.98, 3], ['Yazd', 54.37, 31.9, 5], ['Shahreza', 51.87, 32.01, 1],
    ['Nain', 53.09, 32.86, 1], ['Shahr-e Kord', 50.86, 32.33, 1], ['Ardestan', 52.37, 33.38, 1], ['Ardakan', 54.02, 32.31, 1],
    ['Khur', 55.08, 33.78, 1], ['Jandaq', 54.41, 34.04, 1], ['Bafq', 55.4, 31.6, 1],
  ],
  'Fars': [
    ['Shiraz', 52.53, 29.61, 15, 'AS'], ['Bushehr', 50.84, 28.97, 10, 'PN'], ['Kazerun', 51.65, 29.62, 1], ['Fasa', 53.65, 28.94, 1],
    ['Jahrom', 53.56, 28.5, 1], ['Lar', 54.34, 27.68, 1], ['Abadeh', 52.65, 31.16, 1], ['Bandar Lengeh', 54.88, 26.56, 3, 'P'],
    ['Persepolis', 52.89, 29.94, 5], ['Firuzabad', 52.57, 28.84, 1], ['Darab', 54.54, 28.75, 1], ['Bandar Dayyer', 51.94, 27.84, 1],
    ['Yasuj', 51.59, 30.67, 1], ['Neyriz', 54.32, 29.2, 1],
  ],
  'Kerman': [
    ['Kerman', 57.08, 30.28, 10, 'AS'], ['Bandar Abbas', 56.27, 27.19, 10, 'PNA'], ['Rafsanjan', 55.99, 30.41, 1], ['Sirjan', 55.68, 29.45, 1],
    ['Bam', 58.36, 29.11, 3, 'F'], ['Jiroft', 57.74, 28.68, 1], ['Minab', 57.08, 27.13, 1], ['Zarand', 56.56, 30.81, 1],
    ['Jask', 57.77, 25.64, 3, 'P'], ['Shahdad', 57.7, 30.42, 1], ['Anar', 55.27, 30.87, 1], ['Baft', 56.6, 29.23, 1], ['Kahnuj', 57.7, 27.95, 1],
  ],
  'Baluchistan': [
    ['Zahedan', 60.86, 29.5, 5, 'ASF'], ['Zabol', 61.5, 31.03, 3, 'F'], ['Iranshahr', 60.69, 27.2, 3], ['Chabahar', 60.64, 25.29, 5, 'P'],
    ['Saravan', 62.33, 27.37, 1, 'F'], ['Khash', 61.2, 28.22, 1], ['Nikshahr', 60.2, 26.23, 1], ['Mirjaveh', 61.45, 29.02, 1, 'F'],
  ],
  'Khorasan': [
    ['Mashhad', 59.6, 36.3, 20, 'AS'], ['Nishapur', 58.8, 36.21, 3], ['Sabzevar', 57.68, 36.21, 1], ['Bojnurd', 57.33, 37.47, 1, 'F'],
    ['Quchan', 58.5, 37.1, 1, 'F'], ['Torbat-e Heydarieh', 59.22, 35.27, 1], ['Birjand', 59.22, 32.87, 3, 'A'], ['Tabas', 56.92, 33.6, 1],
    ['Gonabad', 58.68, 34.35, 1], ['Torbat-e Jam', 60.62, 35.24, 1, 'F'], ['Sarakhs', 61.16, 36.54, 1, 'F'], ['Qaen', 59.18, 33.73, 1],
    ['Kashmar', 58.47, 35.24, 1], ['Ferdows', 58.17, 34.02, 1], ['Nehbandan', 60.04, 31.54, 1, 'F'], ['Taybad', 60.78, 34.74, 1, 'F'],
    ['Dargaz', 59.11, 37.44, 1],
  ],
};

// Foreign cities by country tag → region → cities
export const FOREIGN = {
  TUR: {
    'Eastern Anatolia': [['Erzurum', 41.27, 39.9, 5], ['Van', 43.38, 38.5, 3], ['Kars', 43.1, 40.6, 3], ['Hakkari', 43.74, 37.57, 1], ['Bitlis', 42.11, 38.4, 1], ['Agri', 43.05, 39.72, 1], ['Mus', 41.49, 38.73, 1], ['Igdir', 44.04, 39.92, 1], ['Erzincan', 39.49, 39.75, 1], ['Siirt', 41.94, 37.93, 1]],
    'Pontus': [['Trabzon', 39.72, 41.0, 3], ['Samsun', 36.33, 41.29, 3], ['Rize', 40.52, 41.02, 1], ['Sinop', 35.15, 42.03, 1], ['Kastamonu', 33.78, 41.38, 1], ['Zonguldak', 31.79, 41.45, 1]],
    'Upper Mesopotamia': [['Diyarbakir', 40.23, 37.91, 3], ['Mardin', 40.74, 37.31, 1], ['Urfa', 38.79, 37.16, 1], ['Gaziantep', 37.38, 37.07, 1], ['Malatya', 38.31, 38.35, 1], ['Elazig', 39.22, 38.67, 1]],
    'Cappadocia': [['Ankara', 32.85, 39.93, 30], ['Kayseri', 35.48, 38.72, 3], ['Sivas', 37.02, 39.75, 3], ['Konya', 32.48, 37.87, 3], ['Eskisehir', 30.52, 39.78, 1]],
    'Cilicia': [['Adana', 35.32, 37.0, 5], ['Mersin', 34.63, 36.8, 1], ['Antalya', 30.7, 36.9, 3]],
    'Lydia': [['Izmir', 27.14, 38.42, 10], ['Sardis', 28.14, 38.49, 10], ['Mugla', 28.36, 37.22, 1], ['Afyon', 30.54, 38.76, 1], ['Bursa', 29.06, 40.19, 5]],
    'Thrace': [['Istanbul', 28.98, 41.01, 30], ['Edirne', 26.56, 41.68, 3]],
  },
  IRQ: {
    'Mesopotamia': [['Baghdad', 44.36, 33.31, 30], ['Babylon', 44.43, 32.48, 15], ['Karbala', 44.02, 32.62, 3], ['Najaf', 44.31, 32.0, 3], ['Kut', 45.82, 32.5, 1], ['Samarra', 43.87, 34.2, 1], ['Khanaqin', 45.38, 34.35, 1], ['Ramadi', 43.3, 33.42, 1]],
    'Basra': [['Basra', 47.78, 30.51, 10], ['Fao', 48.48, 29.97, 1], ['Nasiriyah', 46.26, 31.04, 1], ['Amarah', 47.15, 31.84, 1], ['Samawah', 45.28, 31.31, 1]],
    'Assyria': [['Mosul', 43.13, 36.34, 10], ['Kirkuk', 44.39, 35.47, 5], ['Erbil', 44.01, 36.19, 3], ['Sulaymaniyah', 45.43, 35.56, 1], ['Tikrit', 43.68, 34.6, 1]],
    'Western Desert': [['Rutbah', 40.28, 33.04, 1], ['Haditha', 42.38, 34.13, 1]],
  },
  FRA: {
    'Syria': [['Damascus', 36.29, 33.51, 15], ['Aleppo', 37.16, 36.2, 10], ['Homs', 36.72, 34.73, 3], ['Deir ez-Zor', 40.14, 35.33, 1], ['Palmyra', 38.28, 34.56, 3], ['Latakia', 35.78, 35.52, 1], ['Raqqa', 39.01, 35.95, 1], ['Qamishli', 41.22, 37.05, 1]],
    'Lebanon': [['Beirut', 35.5, 33.89, 5], ['Tripoli', 35.84, 34.44, 1]],
  },
  EGY: {
    'Lower Egypt': [['Cairo', 31.24, 30.04, 30], ['Alexandria', 29.92, 31.2, 10], ['Port Said', 32.3, 31.26, 3], ['Suez', 32.55, 29.97, 5], ['Tanta', 31.0, 30.79, 1], ['Memphis', 31.1, 29.6, 10]],
    'Upper Egypt': [['Asyut', 31.18, 27.18, 1], ['Thebes', 32.64, 25.69, 5], ['Aswan', 32.9, 24.09, 1], ['Minya', 30.75, 28.1, 1], ['Qena', 32.72, 26.16, 1]],
    'Sinai': [['El Arish', 33.8, 31.13, 1], ['Sharm el-Sheikh', 34.3, 27.9, 1]],
    'Western Desert': [['Mersa Matruh', 27.24, 31.35, 1], ['Siwa', 25.52, 29.2, 1], ['Kharga', 30.55, 25.45, 1]],
    'Red Sea Coast': [['Hurghada', 33.81, 27.26, 1]],
  },
  SOV: {
    'Azerbaijan SSR': [['Baku', 49.87, 40.41, 20], ['Ganja', 46.36, 40.68, 3], ['Nakhchivan', 45.41, 39.21, 1], ['Lankaran', 48.85, 38.75, 1], ['Stepanakert', 46.75, 39.82, 1], ['Shamakhi', 48.64, 40.63, 1], ['Yevlakh', 47.15, 40.62, 1], ['Quba', 48.51, 41.36, 1]],
    'Armenian SSR': [['Yerevan', 44.51, 40.18, 10], ['Leninakan', 43.85, 40.79, 1]],
    'Georgian SSR': [['Tbilisi', 44.8, 41.72, 15], ['Batumi', 41.64, 41.64, 3], ['Kutaisi', 42.7, 42.27, 1], ['Sukhumi', 41.02, 43.0, 1]],
    'North Caucasus': [['Makhachkala', 47.5, 42.98, 1], ['Grozny', 45.69, 43.32, 3], ['Derbent', 48.29, 42.06, 1], ['Ordzhonikidze', 44.68, 43.02, 1], ['Krasnodar', 38.98, 45.04, 1], ['Stavropol', 41.97, 45.04, 1], ['Astrakhan', 48.04, 46.35, 3], ['Novorossiysk', 37.77, 44.72, 1], ['Sochi', 39.72, 43.6, 1], ['Elista', 44.27, 46.31, 1]],
    'Crimea': [['Sevastopol', 33.52, 44.62, 5], ['Kerch', 36.47, 45.36, 1]],
    'Turkmen SSR': [['Ashgabat', 58.38, 37.95, 10], ['Krasnovodsk', 52.97, 40.02, 3], ['Merv', 61.83, 37.6, 10], ['Chardzhou', 63.57, 39.09, 1], ['Kizyl-Arvat', 56.28, 38.98, 1], ['Tejen', 60.5, 37.38, 1], ['Kushka', 62.35, 35.28, 1], ['Nebit-Dag', 54.37, 39.51, 1], ['Tashauz', 59.97, 41.84, 1], ['Kerki', 65.2, 37.83, 1]],
    'Uzbek SSR': [['Bukhara', 64.42, 39.77, 10], ['Samarkand', 66.96, 39.65, 15], ['Tashkent', 69.24, 41.31, 15], ['Khiva', 60.36, 41.38, 5], ['Termez', 67.28, 37.22, 1], ['Nukus', 59.6, 42.46, 1], ['Karshi', 65.8, 38.86, 1], ['Kokand', 70.94, 40.53, 1], ['Andijan', 72.34, 40.78, 1], ['Navoi', 65.38, 40.08, 1], ['Muynak', 59.03, 43.77, 1]],
    'Tajik SSR': [['Stalinabad', 68.78, 38.56, 5], ['Leninabad', 69.62, 40.28, 3], ['Khorog', 71.55, 37.49, 1], ['Kulob', 69.78, 37.91, 1]],
    'Kazakh SSR': [['Kzyl-Orda', 65.51, 44.85, 1], ['Chimkent', 69.6, 42.3, 1], ['Fort Shevchenko', 50.26, 44.52, 1], ['Turkestan', 68.25, 43.3, 1], ['Dzhambul', 71.37, 42.9, 1]],
    'Kirghiz SSR': [['Frunze', 74.59, 42.87, 3], ['Osh', 72.8, 40.53, 1], ['Naryn', 75.99, 41.43, 1]],
    'Ukraine': [['Odessa', 30.72, 46.48, 5]],
  },
  AFG: {
    'Herat': [['Herat', 62.2, 34.35, 15], ['Islam Qala', 61.07, 34.67, 1], ['Shindand', 62.14, 33.3, 1], ['Qala-i-Naw', 63.13, 34.99, 1]],
    'Kandahar': [['Kandahar', 65.71, 31.61, 10], ['Lashkar Gah', 64.37, 31.59, 1], ['Tarin Kot', 65.87, 32.63, 1], ['Spin Boldak', 66.4, 31.0, 1]],
    'Sistan': [['Farah', 62.11, 32.37, 1], ['Zaranj', 61.86, 30.96, 1], ['Delaram', 63.43, 32.16, 1]],
    'Kabul': [['Kabul', 69.17, 34.53, 30], ['Jalalabad', 70.45, 34.43, 3], ['Ghazni', 68.42, 33.55, 3], ['Gardez', 69.22, 33.6, 1], ['Bamiyan', 67.83, 34.82, 1], ['Chaghcharan', 65.25, 34.52, 1]],
    'Bactria': [['Balkh', 67.11, 36.71, 10], ['Kunduz', 68.87, 36.73, 1], ['Maimana', 64.78, 35.92, 1], ['Faizabad', 70.58, 37.12, 1], ['Sheberghan', 65.75, 36.67, 1], ['Baghlan', 68.7, 36.13, 1]],
  },
  RAJ: {
    'Baluchistan Agency': [['Quetta', 67.0, 30.2, 10], ['Gwadar', 62.33, 25.13, 3], ['Turbat', 63.05, 26.0, 1], ['Nok Kundi', 62.75, 28.82, 1], ['Dalbandin', 64.4, 28.89, 1], ['Kalat', 66.59, 29.03, 1], ['Panjgur', 64.1, 26.97, 1], ['Khuzdar', 66.61, 27.81, 1], ['Pasni', 63.47, 25.26, 1], ['Las Bela', 66.3, 26.23, 1], ['Sibi', 67.88, 29.54, 1], ['Fort Sandeman', 69.45, 31.34, 1], ['Chaman', 66.45, 30.92, 1], ['Ormara', 64.64, 25.21, 1], ['Kharan', 65.42, 28.58, 1]],
    'Sindh': [['Karachi', 67.01, 24.86, 20], ['Hyderabad', 68.37, 25.39, 3], ['Sukkur', 68.86, 27.7, 1], ['Jacobabad', 68.44, 28.28, 1]],
    'Punjab': [['Lahore', 74.34, 31.55, 20], ['Multan', 71.48, 30.2, 5], ['Rawalpindi', 73.05, 33.6, 5], ['Bahawalpur', 71.68, 29.4, 1], ['Lyallpur', 73.08, 31.42, 1], ['Amritsar', 74.87, 31.63, 3]],
    'North-West Frontier': [['Peshawar', 71.58, 34.01, 10], ['Dera Ismail Khan', 70.9, 31.83, 1], ['Chitral', 71.79, 35.85, 1], ['Taxila', 72.83, 33.75, 5]],
    'Kashmir': [['Srinagar', 74.8, 34.08, 3], ['Gilgit', 74.31, 35.92, 1], ['Jammu', 74.86, 32.73, 1]],
    'Rajputana': [['Jodhpur', 73.02, 26.29, 1], ['Bikaner', 73.31, 28.02, 1], ['Jaisalmer', 70.91, 26.92, 1], ['Udaipur', 73.71, 24.58, 1], ['Ajmer', 74.64, 26.45, 1]],
    'Gujarat': [['Ahmedabad', 72.57, 23.02, 5], ['Bhuj', 69.67, 23.25, 1], ['Rajkot', 70.8, 22.3, 1]],
  },
  GBR: {
    'Kuwait': [['Kuwait', 47.98, 29.37, 5]],
    'Bahrain': [['Manama', 50.58, 26.22, 5]],
    'Qatar': [['Doha', 51.53, 25.29, 3]],
    'Trucial States': [['Abu Dhabi', 54.37, 24.47, 3], ['Dubai', 55.3, 25.26, 3], ['Ras al-Khaimah', 55.94, 25.79, 1], ['Al Ain', 55.76, 24.21, 1]],
    'Muscat & Oman': [['Muscat', 58.4, 23.6, 10], ['Sohar', 56.74, 24.36, 1], ['Khasab', 56.25, 26.18, 1], ['Nizwa', 57.53, 22.93, 1], ['Sur', 59.53, 22.57, 1]],
    'Palestine': [['Jerusalem', 35.22, 31.78, 15], ['Haifa', 34.99, 32.82, 3], ['Gaza', 34.47, 31.5, 1], ['Beersheba', 34.79, 31.25, 1]],
    'Transjordan': [['Amman', 35.93, 31.95, 5], ['Aqaba', 35.0, 29.53, 1], ["Ma'an", 35.73, 30.2, 1]],
    'Cyprus': [['Nicosia', 33.38, 35.17, 3]],
  },
  SAU: {
    'Al-Hasa': [['Hofuf', 49.59, 25.38, 3], ['Dhahran', 50.11, 26.29, 5], ['Jubail', 49.66, 27.0, 1], ['Hafar al-Batin', 45.96, 28.43, 1], ['Salwa', 50.8, 24.7, 1]],
    'Nejd': [['Riyadh', 46.72, 24.69, 20], ['Buraydah', 43.97, 26.33, 1], ["Ha'il", 41.69, 27.52, 1], ['Dawadmi', 44.39, 24.5, 1], ['Rafha', 43.49, 29.64, 1], ['Sakaka', 40.2, 29.97, 1]],
    'Hejaz': [['Medina', 39.61, 24.47, 5], ['Tabuk', 36.57, 28.38, 1], ['Yanbu', 38.06, 24.09, 1], ['Al Wajh', 36.45, 26.23, 1]],
  },
  GRC: { 'Greece': [['Alexandroupoli', 25.87, 40.85, 1], ['Heraklion', 25.13, 35.34, 1], ['Rhodes', 28.22, 36.43, 1]] },
  BUL: { 'Bulgaria': [['Burgas', 27.47, 42.5, 1], ['Varna', 27.91, 43.2, 1], ['Plovdiv', 24.75, 42.14, 1]] },
  ROM: { 'Romania': [['Bucharest', 26.1, 44.43, 10], ['Constanta', 28.65, 44.18, 3]] },
  CHI: { 'Sinkiang': [['Kashgar', 75.99, 39.47, 3]] },
  ITA: { 'Cyrenaica': [['Bardia', 25.09, 31.76, 1]] },
  SUD: { 'Sudan': [] },
};

// Fronts. `subs` = modern-country polygons that make up the enemy objective zone.
export const FRONTS = [
  { id: 'afg', name: 'Afghan Front', enemy: 'AFG', enemyName: 'Afghanistan', subs: ['Afghanistan'], defaultLabel: 'School',
    satrapy: 'Bactria & Arachosia', hq: 'Mashhad' },
  { id: 'cau', name: 'Caucasus Front', enemy: 'SOV', enemyName: 'Soviet Union', subs: ['Armenia', 'Azerbaijan', 'Georgia'], defaultLabel: 'Family',
    satrapy: 'Armenia & Colchis', hq: 'Tabriz' },
  { id: 'tks', name: 'Turkestan Front', enemy: 'SOV', enemyName: 'Soviet Union', subs: ['Turkmenistan', 'Uzbekistan', 'Tajikistan'], defaultLabel: 'Partner',
    satrapy: 'Sogdia & Chorasmia', hq: 'Gorgan' },
  { id: 'irq', name: 'Mesopotamian Front', enemy: 'IRQ', enemyName: 'Iraq', subs: ['Iraq', 'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Egypt'], defaultLabel: 'Work',
    satrapy: 'Babylonia, the Levant & Egypt', hq: 'Kermanshah' },
  { id: 'raj', name: 'Baluchistan Front', enemy: 'RAJ', enemyName: 'British Raj', subs: ['Pakistan'], defaultLabel: 'Health',
    satrapy: 'Gedrosia & the Indus', hq: 'Zahedan' },
  { id: 'tur', name: 'Anatolian Front', enemy: 'TUR', enemyName: 'Turkey', subs: ['Turkey'], defaultLabel: 'Friends',
    satrapy: 'Lydia & Cappadocia', hq: 'Urmia' },
  { id: 'glf', name: 'Persian Gulf Theatre', enemy: 'GBR', enemyName: 'Royal Navy', naval: true,
    subs: ['Kuwait', 'Bahrain', 'Qatar', 'United Arab Emirates', 'Oman', 'Saudi Arabia'], defaultLabel: 'Self',
    satrapy: 'Maka & Arabia', hq: 'Bushehr' },
];

// Terrain features. ranges: polyline + half-width in degrees
export const RANGES = [
  { name: 'Zagros', w: 1.1, pts: [[44.6, 37.6], [46.2, 35.6], [47.6, 34.0], [49.2, 32.8], [50.8, 31.4], [52.0, 30.0], [53.6, 28.6], [55.4, 27.8]] },
  { name: 'Alborz', w: 0.55, pts: [[48.4, 37.4], [49.6, 36.7], [51.0, 36.2], [52.5, 36.0], [54.0, 36.4], [55.5, 36.9]] },
  { name: 'Kopet Dag', w: 0.5, pts: [[55.8, 38.4], [57.5, 37.8], [59.0, 37.2], [60.4, 36.4]] },
  { name: 'Hindu Kush', w: 1.3, pts: [[63.5, 34.6], [66.0, 34.6], [68.5, 35.2], [71.0, 36.2], [74.0, 36.6], [76, 36]] },
  { name: 'Caucasus', w: 0.7, pts: [[38.5, 44.2], [41.5, 43.2], [44.5, 42.6], [47.0, 41.6], [48.8, 40.9]] },
  { name: 'Lesser Caucasus', w: 0.6, pts: [[42.0, 41.2], [44.5, 40.2], [46.3, 39.4]] },
  { name: 'Armenian Highlands', w: 1.2, pts: [[38.0, 39.2], [41.0, 39.2], [43.8, 38.6]] },
  { name: 'Taurus', w: 0.7, pts: [[29.5, 37.0], [32.5, 37.0], [35.0, 37.6], [37.5, 38.0]] },
  { name: 'Pontic', w: 0.5, pts: [[33.0, 41.3], [37.0, 40.7], [40.5, 40.6]] },
  { name: 'Pamir', w: 1.4, pts: [[70.0, 38.6], [73.0, 38.4], [75.5, 38.0]] },
  { name: 'Tian Shan', w: 1.0, pts: [[71.0, 41.8], [74.0, 41.8], [76, 42]] },
  { name: 'Sulaiman', w: 0.7, pts: [[66.8, 28.5], [68.0, 30.5], [69.8, 32.5], [70.3, 34.0]] },
  { name: 'Makran', w: 0.5, pts: [[58.5, 26.4], [61.0, 26.6], [63.5, 26.6], [65.5, 26.8]] },
  { name: 'Kerman Range', w: 0.6, pts: [[55.6, 31.0], [56.8, 29.8], [58.0, 28.6]] },
  { name: 'Hajar', w: 0.4, pts: [[56.2, 25.6], [57.0, 23.8], [58.8, 23.0]] },
  { name: 'Hejaz Mountains', w: 0.5, pts: [[35.5, 28.5], [37.5, 26.0], [39.5, 23.0]] },
  { name: 'Lebanon', w: 0.3, pts: [[35.8, 33.4], [36.3, 34.6]] },
  { name: 'Khorasan Ranges', w: 0.5, pts: [[57.0, 36.0], [59.0, 35.6], [60.4, 34.4], [59.8, 32.8]] },
];
export const DESERTS = [ // [lon, lat, rx, ry, name]
  [54.5, 34.6, 2.6, 0.9, 'Dasht-e Kavir'], [58.6, 31.0, 1.2, 1.8, 'Dasht-e Lut'], [59.5, 39.8, 4.5, 1.6, 'Karakum'],
  [63.5, 42.5, 3.2, 1.6, 'Kyzylkum'], [63.5, 30.4, 1.8, 0.9, 'Registan'], [64.5, 29.6, 2.2, 0.7, 'Kharan'], [71.0, 27.5, 2.2, 2.0, 'Thar'],
  [41.0, 32.2, 3.0, 1.5, 'Syrian Desert'], [42.0, 28.5, 3.0, 1.2, 'Nafud'], [50.5, 22.5, 5.5, 1.6, 'Rub al Khali'], [47.5, 26.3, 1.0, 2.6, 'Dahna'],
  [27.5, 26.5, 3.2, 3.6, 'Libyan Desert'], [33.6, 26.5, 1.0, 3.0, 'Eastern Desert'], [34.0, 29.8, 0.8, 0.9, 'Sinai'], [54.0, 44.5, 2.6, 1.6, 'Ustyurt'],
  [60.6, 27.9, 0.9, 0.6, 'Jaz Murian'],
];
export const FORESTS = [[50.5, 37.0, 2.2, 0.45], [53.2, 36.65, 1.6, 0.3], [40.0, 41.2, 2.2, 0.5], [41.8, 42.4, 1.2, 0.6]];
export const MARSHES = [[47.2, 31.0, 0.9, 0.6], [61.4, 31.0, 0.5, 0.4], [31.2, 31.1, 0.9, 0.4]];

export const LAKES = [
  { name: 'Lake Urmia', pts: [[45.1, 38.2], [45.45, 38.3], [45.75, 37.95], [45.95, 37.55], [45.9, 37.15], [45.55, 37.1], [45.3, 37.45], [45.2, 37.8]] },
  { name: 'Lake Van', pts: [[42.3, 38.6], [42.8, 38.95], [43.4, 38.95], [43.6, 38.6], [43.25, 38.3], [42.7, 38.35]] },
  { name: 'Lake Sevan', pts: [[44.95, 40.6], [45.2, 40.5], [45.6, 40.2], [45.5, 40.1], [45.15, 40.3]] },
  { name: 'Aral Sea', pts: [[58.3, 44.0], [58.4, 45.4], [59.3, 46.4], [60.6, 46.8], [61.6, 46.5], [61.9, 45.6], [61.3, 44.6], [60.9, 43.8], [59.8, 43.5], [58.9, 43.5]] },
  { name: 'Hamun', pts: [[60.9, 31.5], [61.2, 31.6], [61.3, 31.2], [61.15, 30.75], [60.9, 30.9]] },
  { name: 'Namak Lake', pts: [[51.4, 34.7], [51.95, 34.75], [52.05, 34.4], [51.6, 34.3]] },
  { name: 'Dead Sea', pts: [[35.45, 31.75], [35.6, 31.75], [35.55, 31.1], [35.4, 31.1]] },
  { name: 'Issyk-Kul', pts: [[76.0, 42.5], [76.0, 42.2], [75.6, 42.3]] },
  { name: 'Lake Tuz', pts: [[33.2, 39.0], [33.6, 38.9], [33.6, 38.5], [33.3, 38.5]] },
  { name: 'Bakhtegan', pts: [[53.4, 29.6], [53.9, 29.5], [54.1, 29.25], [53.6, 29.3]] },
];
export const RIVERS = [
  { name: 'Tigris', pts: [[40.2, 37.9], [41.2, 37.5], [42.4, 37.1], [43.1, 36.35], [43.3, 35.3], [43.8, 34.3], [44.4, 33.35], [45.3, 32.6], [46.4, 32.3], [47.15, 31.85], [47.45, 31.0]] },
  { name: 'Euphrates', pts: [[39.3, 39.0], [38.8, 38.0], [38.0, 37.0], [38.3, 36.2], [39.0, 35.9], [40.15, 35.3], [41.0, 34.4], [42.4, 34.1], [43.3, 33.4], [44.3, 32.5], [45.3, 31.3], [46.3, 31.0], [47.45, 31.0], [47.9, 30.5], [48.5, 29.95]] },
  { name: 'Karun', pts: [[50.5, 32.0], [49.6, 32.0], [48.9, 32.05], [48.7, 31.3], [48.2, 30.45]] },
  { name: 'Aras', pts: [[42.5, 40.0], [43.7, 40.1], [44.5, 39.7], [45.6, 38.95], [46.5, 38.9], [47.5, 39.4], [48.3, 39.6], [48.4, 39.95], [49.3, 39.4]] },
  { name: 'Kura', pts: [[43.0, 41.4], [44.8, 41.7], [46.0, 41.1], [47.2, 40.6], [48.4, 39.95]] },
  { name: 'Amu Darya', pts: [[71.5, 37.0], [69.5, 37.2], [68.0, 37.1], [66.5, 37.4], [65.2, 37.9], [63.6, 39.1], [62.2, 40.4], [61.0, 41.4], [60.0, 42.3], [59.2, 43.5]] },
  { name: 'Syr Darya', pts: [[72.5, 40.9], [70.5, 40.6], [69.3, 40.3], [68.5, 41.3], [68.2, 42.6], [67.0, 43.9], [65.5, 44.85], [63.0, 45.5], [61.5, 46.2]] },
  { name: 'Indus', pts: [[76, 34.2], [74.6, 35.6], [73.0, 34.6], [72.2, 33.9], [71.5, 32.5], [70.9, 31.0], [70.6, 29.4], [69.6, 28.0], [68.8, 27.6], [68.3, 26.0], [68.3, 25.3], [67.6, 24.0]] },
  { name: 'Helmand', pts: [[68.3, 34.3], [66.5, 33.0], [65.2, 32.2], [64.4, 31.55], [63.0, 30.6], [61.9, 30.3], [61.6, 31.0]] },
  { name: 'Nile', pts: [[32.9, 21.6], [32.9, 24.1], [32.7, 25.7], [32.7, 26.2], [31.2, 27.2], [30.8, 28.1], [31.2, 30.05], [31.0, 30.8], [30.4, 31.45]] },
  { name: 'Nile E', pts: [[31.2, 30.05], [31.4, 30.9], [31.8, 31.5]] },
  { name: 'Sefid Rud', pts: [[47.3, 36.2], [48.3, 37.0], [49.4, 36.8], [49.9, 37.4]] },
  { name: 'Zayandeh', pts: [[50.3, 32.6], [51.2, 32.5], [51.7, 32.65], [52.6, 32.3]] },
  { name: 'Hari Rud', pts: [[66.0, 34.5], [64.0, 34.4], [62.2, 34.3], [61.1, 34.7], [61.2, 35.6], [61.2, 36.6]] },
  { name: 'Kizilirmak', pts: [[37.8, 39.9], [36.0, 39.4], [34.8, 38.7], [33.9, 39.4], [34.0, 40.6], [35.9, 41.7]] },
];

// Railways (Iran). level: 1 built by 1936–38, 2..4 planned (built as national infrastructure grows)
export const RAILWAYS = [
  { name: 'Trans-Iranian Railway (South)', stage: 0, via: ['Bandar Shahpur', 'Ahvaz', [48.35, 32.46], [49.06, 33.49], 'Arak', 'Qom', 'Tehran'] },
  { name: 'Trans-Iranian Railway (North)', stage: 0, via: ['Tehran', 'Garmsar', [52.77, 35.76], [53.06, 36.12], 'Sari', 'Bandar Shah'] },
  { name: 'Tabriz–Julfa Line', stage: 0, via: ['Tabriz', 'Marand', 'Julfa'] },
  { name: 'Zahedan–Quetta Line', stage: 0, via: ['Zahedan', 'Mirjaveh'] },
  { name: 'Tehran–Tabriz Line', stage: 1, via: ['Tehran', 'Karaj', 'Qazvin', 'Zanjan', 'Mianeh', 'Maragheh', 'Tabriz'] },
  { name: 'Khorasan Line', stage: 2, via: ['Garmsar', 'Semnan', 'Damghan', 'Shahrud', 'Sabzevar', 'Nishapur', 'Mashhad'] },
  { name: 'Kerman Line', stage: 3, via: ['Qom', 'Kashan', 'Ardestan', 'Nain', 'Ardakan', 'Yazd', 'Bafq', 'Zarand', 'Kerman'] },
  { name: 'Khorramshahr Spur', stage: 1, via: ['Ahvaz', 'Khorramshahr'] },
  { name: 'Fars Line', stage: 4, via: ['Isfahan', 'Shahreza', 'Abadeh', 'Persepolis', 'Shiraz', 'Kazerun', 'Bushehr'] },
  { name: 'Isfahan Link', stage: 3, via: ['Kashan', 'Isfahan'] },
  { name: 'Baluchistan Line', stage: 4, via: ['Kerman', 'Bam', 'Zahedan'] },
];

export const SEA_LABELS = [
  ['CASPIAN SEA', 51.0, 41.2, 1.3], ['PERSIAN GULF', 51.4, 27.0, 1.0, -28], ['GULF OF OMAN', 59.6, 24.5, 0.9], ['ARABIAN SEA', 63.5, 22.6, 1.3],
  ['BLACK SEA', 35.0, 43.2, 1.3], ['MEDITERRANEAN SEA', 29.5, 33.6, 1.2], ['RED SEA', 36.2, 24.6, 0.9, 58], ['Strait of Hormuz', 56.6, 26.45, 0.55],
];

// Rough outline of the Achaemenid Empire at its height (for the overlay)
export const ACHAEMENID = [[26.0, 41.8], [29.5, 41.6], [35, 42.2], [41.5, 41.8], [44, 43.0], [48.5, 42.2], [50, 40.4], [53, 40.6], [56, 43.4], [59.5, 44.4],
  [64, 43.6], [68.5, 43.2], [72.5, 41.2], [74, 38], [74.5, 34.5], [72.5, 31], [70.5, 27.5], [68.6, 23.6], [66, 25], [61, 24.9], [57.5, 25.3],
  [59.8, 22.4], [57, 22.6], [55.5, 24.5], [52, 24.2], [50, 26.5], [48, 29.4], [45, 29.5], [41, 29.5], [37, 27.5], [35, 28.5], [34.5, 26],
  [33.5, 23.5], [33, 21.6], [30, 21.6], [29.5, 26], [25, 29.5], [24.2, 32], [29, 31.2], [32.5, 31.4], [34.5, 32.5], [35.5, 36], [32, 36], [28, 36.4], [26, 38.5]];
