// Ethiopia, 1935: the Ethiopian Empire on the eve of the Italian invasion. Formable: the Aksumite Empire.
// Coordinates are [lon, lat]. City tuple: [name, lon, lat, vp?, flags?]
// flags: P port (here: lake and river landings only), N naval base, A airbase, S supply hub, R industry/mines, F fort, C capital
//
// Approximations against the real borders of 1935 (the builder assembles countries from whole modern polygons):
//  - Ethiopia is the modern polygon. The 1935 frontier with Italian Somaliland was undemarcated (the Walwal dispute)
//    and the Ogaden boundary is the later, modern line; the Ilemi Triangle and the Gambela enclave are not shown.
//  - Italian Eritrea = modern Eritrea; Italian Somaliland = modern Somalia without the Natural Earth "Somaliland"
//    polygon, which stands for British Somaliland; French Somaliland = modern Djibouti.
//  - Anglo-Egyptian Sudan = Sudan + South Sudan. Zanzibar (a separate British protectorate) is drawn with Tanganyika.
//  - The Imamate of Yemen and the Aden Colony and Protectorate share one modern polygon and are drawn as one bystander.
//  - Ethiopia was landlocked, so there is no naval front: all seven fronts are land borders, one for each neighbour.
//    The Aksumite lands in Himyar (Yemen) lie across the Red Sea and cannot be reached overland, so they are part of
//    the dashed empire outline but not of any objective zone.

export const ID = 'ethiopia';
export const HOME = 'ETH';
export const CAPITAL = 'Addis Ababa';
export const EXTENT = { lon0: 23.5, lon1: 52.5, lat0: -5.2, lat1: 22.6 };

export const COUNTRIES = {
  ETH: { name: 'Ethiopia', long: 'Ethiopian Empire', color: '#c49a3a', from: ['Ethiopia'], spacing: 0.75 },
  ERI: { name: 'Italian Eritrea', long: 'Colony of Eritrea (Kingdom of Italy)', color: '#5c8a5c', from: ['Eritrea'], spacing: 0.6 },
  ISO: { name: 'Italian Somaliland', long: 'Italian Somaliland (Kingdom of Italy)', color: '#6f9a66', from: ['Somalia'], spacing: 1.0 },
  BSO: { name: 'British Somaliland', long: 'British Somaliland Protectorate', color: '#b86a78', from: ['Somaliland'], spacing: 0.8 },
  FSO: { name: 'French Somaliland', long: 'French Somali Coast (Côte française des Somalis)', color: '#4a67a8', from: ['Djibouti'], spacing: 0.34 },
  SUD: { name: 'Anglo-Egyptian Sudan', long: 'Anglo-Egyptian Sudan (condominium)', color: '#9a6f6a', from: ['Sudan', 'S. Sudan'], spacing: 1.15 },
  KEN: { name: 'Kenya', long: 'Kenya Colony and Protectorate', color: '#a8475a', from: ['Kenya'], spacing: 1.0 },
  UGA: { name: 'Uganda', long: 'Uganda Protectorate', color: '#b0586a', from: ['Uganda'], spacing: 1.6 },
  TAN: { name: 'Tanganyika', long: 'Tanganyika Territory (British mandate) & Zanzibar', color: '#a05a70', from: ['Tanzania'], spacing: 1.7 },
  BEL: { name: 'Belgian Congo', long: 'Belgian Congo & Ruanda-Urundi', color: '#a8963c', from: ['Dem. Rep. Congo', 'Rwanda', 'Burundi'], spacing: 1.9 },
  FEA: { name: 'French Equatorial Africa', long: 'French Equatorial Africa (Ubangi-Shari & Chad)', color: '#5a70a0', from: ['Central African Rep.', 'Chad'], spacing: 1.9 },
  EGY: { name: 'Egypt', long: 'Kingdom of Egypt', color: '#a8956a', from: ['Egypt'], spacing: 1.8 },
  LIB: { name: 'Italian Libya', long: 'Italian Libya', color: '#5c8a5c', from: ['Libya'], spacing: 1.9 },
  SAU: { name: 'Saudi Arabia', long: 'Kingdom of Saudi Arabia', color: '#6f8556', from: ['Saudi Arabia'], spacing: 1.7 },
  YEM: { name: 'Yemen & Aden', long: 'Mutawakkilite Kingdom of Yemen & the Aden Protectorate', color: '#7d7f9c', from: ['Yemen'], spacing: 1.5 },
  OMA: { name: 'Muscat & Oman', long: 'Sultanate of Muscat and Oman', color: '#b0586a', from: ['Oman'], spacing: 1.9 },
};

// The provinces of the empire as they stood in the 1930s, and their towns
export const HOME_STATES = {
  'Tigray': [
    ['Mekele', 39.47, 13.5, 5, 'S'], ['Adwa', 38.9, 14.17, 5, 'F'], ['Aksum', 38.72, 14.13, 5], ['Adigrat', 39.46, 14.28, 3],
    ['Shire', 38.28, 14.1, 1], ['Abiy Addi', 39.0, 13.62, 1], ['Amba Alagi', 39.55, 12.98, 1, 'F'], ['Maychew', 39.54, 12.78, 1],
    ['Wukro', 39.6, 13.79, 1], ['Sheraro', 37.93, 14.39, 1], ['Berhale', 40.02, 13.86, 1], ['Dallol', 40.3, 14.24, 1],
  ],
  'Begemder': [
    ['Gondar', 37.47, 12.6, 10, 'AS'], ['Debre Tabor', 38.02, 11.85, 3], ['Gorgora', 37.3, 12.24, 1, 'PN'], ['Debark', 37.9, 13.16, 1, 'F'],
    ['Metemma', 36.16, 12.96, 1, 'F'], ['Chilga', 37.07, 12.55, 1], ['Humera', 36.61, 14.28, 1], ['Nefas Mewcha', 38.47, 11.73, 1],
    ['Addis Zemen', 37.78, 12.12, 1], ['Addi Arkay', 37.94, 13.47, 1],
  ],
  'Gojjam': [
    ['Debre Markos', 37.73, 10.33, 5, 'A'], ['Bahir Dar', 37.38, 11.58, 3, 'P'], ['Dangila', 36.84, 11.26, 1], ['Bure', 37.07, 10.7, 1],
    ['Mota', 37.87, 11.08, 1], ['Dejen', 38.07, 10.17, 1], ['Bichena', 38.2, 10.45, 1], ['Dembecha', 37.48, 10.55, 1],
    ['Chagni', 36.5, 10.95, 1], ['Guba', 35.28, 11.27, 1],
  ],
  'Wollo': [
    ['Dessie', 39.63, 11.13, 10, 'AS'], ['Weldiya', 39.6, 11.83, 1], ['Lalibela', 39.04, 12.03, 3], ['Sekota', 39.03, 12.63, 1],
    ['Korem', 39.52, 12.51, 1], ['Bati', 40.02, 11.19, 1], ['Were Ilu', 39.43, 10.6, 1], ['Magdala', 39.28, 11.2, 1],
    ['Kemise', 39.87, 10.72, 1], ['Mille', 40.76, 11.42, 1], ['Asaita', 41.44, 11.56, 1], ['Sardo', 41.3, 11.96, 1],
  ],
  'Shewa': [
    ['Addis Ababa', 38.74, 9.03, 40, 'CAS'], ['Debre Berhan', 39.53, 9.68, 3], ['Ankober', 39.73, 9.59, 1], ['Debre Sina', 39.76, 9.85, 1, 'F'],
    ['Fiche', 38.73, 9.8, 1], ['Holeta', 38.5, 9.07, 1], ['Ambo', 37.86, 8.98, 1], ['Bishoftu', 38.98, 8.75, 1],
    ['Adama', 39.27, 8.54, 3], ['Awash', 40.17, 8.99, 1, 'S'], ['Welkite', 37.78, 8.28, 1], ['Butajira', 38.38, 8.12, 1],
    ['Hosaena', 37.86, 7.55, 1], ['Ziway', 38.72, 7.93, 1], ['Shashamane', 38.6, 7.2, 1], ['Shewa Robit', 39.9, 10.0, 1],
    ['Mehal Meda', 39.66, 10.31, 1], ['Gewane', 40.65, 10.17, 1],
  ],
  'Wollega': [
    ['Nekemte', 36.55, 9.09, 5], ['Gimbi', 35.83, 9.17, 1], ['Dembidolo', 34.8, 8.53, 3], ['Asosa', 34.53, 10.07, 1],
    ['Nejo', 35.5, 9.5, 1], ['Mendi', 35.1, 9.8, 1], ['Shambu', 37.1, 9.57, 1], ['Kurmuk', 34.3, 10.55, 1, 'F'],
    ['Gidami', 34.62, 8.98, 1], ['Arjo', 36.5, 8.75, 1], ['Bako', 37.05, 9.12, 1], ['Begi', 34.53, 9.35, 1], ['Yubdo', 35.45, 8.95, 1, 'R'],
  ],
  'Illubabor': [
    ['Gore', 35.54, 8.15, 5, 'S'], ['Gambela', 34.58, 8.25, 3, 'PF'], ['Bedele', 36.35, 8.45, 1], ['Masha', 35.48, 7.73, 1],
    ['Tepi', 35.42, 7.2, 1], ['Itang', 34.27, 8.2, 1], ['Jikawo', 33.8, 8.37, 1], ['Abobo', 34.55, 7.85, 1],
  ],
  'Kaffa': [
    ['Jimma', 36.83, 7.67, 10, 'AS'], ['Bonga', 36.23, 7.27, 3], ['Agaro', 36.59, 7.85, 1], ['Mizan Teferi', 35.58, 6.99, 1],
    ['Maji', 35.58, 6.2, 1, 'F'], ['Sokoru', 37.42, 7.92, 1], ['Waka', 37.18, 7.07, 1],
  ],
  'Gamo-Gofa': [
    ['Chencha', 37.57, 6.25, 3], ['Gidole', 37.48, 5.65, 1], ['Bulki', 36.8, 6.3, 1], ['Jinka', 36.57, 5.79, 1],
    ['Omorate', 36.05, 4.8, 1], ['Konso', 37.43, 5.25, 1],
  ],
  'Sidamo': [
    ['Yirgalem', 38.41, 6.75, 5, 'A'], ['Sodo', 37.75, 6.86, 3], ['Dilla', 38.31, 6.41, 1], ['Agere Maryam', 38.23, 5.63, 1],
    ['Kibre Mengist', 38.98, 5.88, 1], ['Negele', 39.57, 5.33, 3, 'S'], ['Yabelo', 38.1, 4.88, 1], ['Mega', 38.32, 4.05, 1, 'F'],
    ['Moyale', 39.05, 3.55, 1], ['Arero', 38.82, 4.75, 1], ['Filtu', 40.65, 5.1, 1], ['Dolo', 42.05, 4.19, 1, 'F'],
  ],
  'Arsi': [
    ['Asella', 39.13, 7.95, 3], ['Ticho', 39.52, 7.82, 1], ['Bekoji', 39.25, 7.53, 1], ['Kofele', 38.79, 7.07, 1],
    ['Dodola', 39.18, 6.98, 1], ['Abomsa', 39.83, 8.58, 1], ['Seru', 40.2, 7.67, 1],
  ],
  'Bale': [
    ['Goba', 39.98, 7.0, 3], ['Ginir', 40.7, 7.13, 1], ['Dolo Mena', 39.83, 6.42, 1], ['Sheikh Hussein', 40.7, 7.75, 1],
    ['Gasera', 40.2, 7.37, 1], ['Imi', 42.17, 6.47, 1], ['El Kere', 42.08, 5.83, 1],
  ],
  'Hararghe': [
    ['Harar', 42.12, 9.31, 10, 'F'], ['Dire Dawa', 41.87, 9.6, 10, 'ASR'], ['Jijiga', 42.8, 9.35, 5, 'ASF'], ['Asebe Teferi', 40.87, 9.08, 1],
    ['Afdem', 41.0, 9.47, 1], ['Erer', 41.38, 9.56, 1], ['Aysha', 42.57, 10.75, 1], ['Dewele', 42.56, 10.97, 1, 'F'],
    ['Gelemso', 40.52, 8.81, 1], ['Deder', 41.45, 9.32, 1], ['Bedeno', 41.63, 9.11, 1], ['Fik', 42.3, 8.13, 1],
    ['Tog Wajale', 43.3, 9.6, 1], ['Harshin', 43.59, 9.22, 1],
  ],
  'Ogaden': [
    ['Degehabur', 43.56, 8.22, 3], ['Gorrahei', 44.3, 6.6, 3, 'F'], ['Gode', 43.55, 5.95, 1], ['Kelafo', 44.2, 5.59, 1],
    ['Mustahil', 44.73, 5.25, 1], ['Welwel', 45.4, 7.05, 3, 'F'], ['Geladi', 46.42, 6.96, 1], ['Shilabo', 44.77, 6.09, 1],
    ['Degehamedo', 42.97, 7.98, 1], ['Aware', 44.15, 8.27, 1], ['Bokh', 46.62, 7.37, 1], ['Domo', 46.85, 7.85, 1],
    ['Segeg', 42.85, 7.67, 1], ['Hargele', 42.2, 5.25, 1],
  ],
};

// Foreign towns by country tag → region → towns. Regions of the fronts' enemies become restorable lands of the empire.
export const FOREIGN = {
  ERI: {
    'Hamasien': [['Asmara', 38.93, 15.33, 20], ['Decamere', 39.05, 15.07, 1], ['Ghinda', 39.09, 15.44, 1]],
    'Samhar': [['Massawa', 39.45, 15.61, 10], ['Adulis', 39.66, 15.26, 10], ['Mersa Fatma', 40.31, 14.89, 1], ['Thio', 40.93, 14.68, 1]],
    'Seraye & Akele Guzai': [['Mendefera', 38.82, 14.89, 3], ['Adi Quala', 38.83, 14.63, 1], ['Adi Keyh', 39.37, 14.84, 3], ['Senafe', 39.42, 14.7, 3]],
    'Barka': [['Keren', 38.45, 15.78, 5], ['Agordat', 37.88, 15.55, 3], ['Barentu', 37.59, 15.11, 1], ['Tessenei', 36.66, 15.11, 1], ['Om Hajer', 36.65, 14.34, 1]],
    'Sahel': [['Nakfa', 38.48, 16.67, 1], ['Afabet', 38.69, 16.19, 1], ['Karora', 38.37, 17.7, 1]],
    'Dankalia': [['Assab', 42.74, 13.01, 5], ['Beilul', 42.33, 13.15, 1], ['Edd', 41.69, 13.93, 1], ['Rahayta', 43.08, 12.73, 1]],
  },
  FSO: {
    'Djibouti & the Issa Country': [['Djibouti', 43.15, 11.59, 10], ['Arta', 42.85, 11.52, 1], ['Holhol', 42.93, 11.31, 1], ['Ali Sabieh', 42.71, 11.16, 1], ['Dikhil', 42.37, 11.11, 1], ['Yoboki', 42.11, 11.5, 1]],
    'Tadjoura & Obock': [['Tadjoura', 42.88, 11.79, 3], ['Obock', 43.29, 11.96, 3], ['Dorra', 42.48, 12.15, 1], ['Khor Angar', 43.37, 12.38, 1], ['Balho', 42.2, 12.0, 1]],
  },
  BSO: {
    'Zeila & Awdal': [['Zeila', 43.48, 11.35, 3], ['Borama', 43.18, 9.94, 1], ['Lughaya', 43.95, 10.68, 1], ['Bulhar', 44.42, 10.39, 1]],
    'Berbera': [['Berbera', 45.01, 10.44, 10], ['Hargeisa', 44.07, 9.56, 5], ['Sheikh', 45.2, 9.93, 1], ['Gebiley', 43.63, 9.7, 1], ['Odweyne', 45.06, 9.41, 1]],
    'Burao & the Nogal': [['Burao', 45.53, 9.52, 3], ['Ainabo', 46.4, 8.95, 1], ['Las Anod', 47.36, 8.48, 1], ['Buhodle', 46.33, 8.23, 1], ['Taleh', 48.42, 9.15, 1]],
    'Erigavo & Makhir': [['Erigavo', 47.37, 10.62, 3], ['Heis', 46.9, 10.88, 1], ['Las Khorey', 48.2, 11.16, 1], ['El Afweyn', 47.2, 9.93, 1], ['Badhan', 48.33, 10.71, 1]],
  },
  ISO: {
    'Migiurtinia': [['Bosaso', 49.18, 11.28, 3], ['Alula', 50.76, 11.97, 1], ['Hafun', 51.26, 10.42, 3], ['Bargal', 51.07, 11.28, 1], ['Iskushuban', 50.23, 10.28, 1],
      ['Qardho', 49.09, 9.5, 1], ['Bender Beila', 50.81, 9.49, 1], ['Garoe', 48.48, 8.4, 1], ['Eyl', 49.82, 7.98, 1]],
    'Mudugh': [['Galkayo', 47.43, 6.77, 3], ['Obbia', 48.53, 5.35, 3], ['Dusa Mareb', 46.39, 5.54, 1], ['El Bur', 46.62, 4.68, 1], ['Haradere', 47.86, 4.65, 1]],
    'Hiran': [['Belet Uen', 45.2, 4.74, 3], ['Ferfer', 45.09, 5.08, 1], ['Bulo Burti', 45.57, 3.85, 1]],
    'Benadir': [['Mogadishu', 45.34, 2.05, 20], ['Merca', 44.77, 1.71, 3], ['Brava', 44.03, 1.11, 1], ['Afgoi', 45.12, 2.14, 1], ['Villabruzzi', 45.5, 2.78, 3], ['Itala', 46.32, 2.76, 1]],
    'Upper Juba': [['Baidoa', 43.65, 3.12, 3], ['Lugh Ferrandi', 42.54, 3.8, 3], ['Bardera', 42.28, 2.34, 1], ['Oddur', 43.89, 4.12, 1], ['Bur Acaba', 44.08, 2.8, 1], ['Dinsor', 42.98, 2.41, 1]],
    'Oltre Giuba': [['Kismayo', 42.54, -0.36, 5], ['Jilib', 42.77, 0.49, 1], ['Margherita', 42.75, 0.07, 1], ['Afmadu', 42.07, 0.52, 1], ['Bur Gavo', 41.84, -1.22, 1]],
  },
  KEN: {
    'Northern Frontier': [['Marsabit', 37.98, 2.33, 3], ['Wajir', 40.06, 1.75, 3], ['Mandera', 41.86, 3.94, 1], ['El Wak', 40.93, 2.8, 1], ['Garissa', 39.65, -0.45, 1],
      ['Isiolo', 37.58, 0.35, 1], ['North Horr', 37.07, 3.32, 1], ['Buna', 39.5, 2.8, 1], ['Habaswein', 39.49, 1.01, 1]],
    'Turkana': [['Lodwar', 35.6, 3.12, 1], ['Lokitaung', 35.75, 4.27, 1], ['Kakuma', 34.85, 3.72, 1], ['Maralal', 36.7, 1.1, 1], ['Kitale', 35.0, 1.02, 1]],
    'Kenya Highlands': [['Nairobi', 36.82, -1.29, 20], ['Nakuru', 36.07, -0.3, 3], ['Nyeri', 36.95, -0.42, 1], ['Eldoret', 35.27, 0.52, 3], ['Kisumu', 34.76, -0.09, 5],
      ['Nanyuki', 37.07, 0.01, 1], ['Meru', 37.65, 0.05, 1], ['Machakos', 37.26, -1.52, 1], ['Narok', 35.87, -1.08, 1], ['Kitui', 38.01, -1.37, 1], ['Magadi', 36.28, -1.9, 1]],
    'Kenya Coast': [['Mombasa', 39.66, -4.05, 10], ['Malindi', 40.12, -3.22, 3], ['Lamu', 40.88, -2.25, 3], ['Kipini', 40.5, -2.5, 1], ['Voi', 38.57, -3.4, 1], ['Taveta', 37.68, -3.4, 1]],
  },
  SUD: {
    'Kassala & Gedaref': [['Kassala', 36.4, 15.45, 5], ['Gedaref', 35.38, 14.03, 3], ['Gallabat', 36.08, 12.96, 1], ['Aroma', 36.15, 15.82, 1], ['Khashm el Girba', 35.9, 14.97, 1]],
    'Red Sea Hills': [['Port Sudan', 37.22, 19.62, 10], ['Suakin', 37.33, 19.11, 3], ['Tokar', 37.73, 18.43, 1], ['Sinkat', 36.84, 18.83, 1], ['Haiya', 36.37, 18.33, 1], ['Muhammad Qol', 37.1, 20.9, 1]],
    'Berber & Shendi': [['Meroë', 33.75, 16.94, 10], ['Atbara', 33.99, 17.7, 5], ['Berber', 33.98, 18.02, 1], ['Shendi', 33.43, 16.69, 3], ['Abu Hamed', 33.32, 19.53, 1]],
    'Khartoum & the Gezira': [['Khartoum', 32.53, 15.59, 20], ['Wad Medani', 33.52, 14.4, 5], ['Sennar', 33.6, 13.55, 3], ['Kosti', 32.66, 13.16, 1], ['Ed Dueim', 32.31, 14.0, 1],
      ['Singa', 33.93, 13.15, 1], ['Roseires', 34.38, 11.85, 1]],
    'Dongola': [['Dongola', 30.48, 19.17, 3], ['Wadi Halfa', 31.35, 21.8, 3], ['Napata', 31.83, 18.53, 5], ['Kerma', 30.41, 19.6, 1]],
    'Kordofan': [['El Obeid', 30.22, 13.18, 5], ['En Nahud', 28.43, 12.7, 1], ['Kadugli', 29.72, 11.01, 1], ['Talodi', 30.38, 10.63, 1], ['Dilling', 29.65, 12.05, 1], ['Umm Ruwaba', 31.22, 12.9, 1]],
    'Darfur': [['El Fasher', 25.35, 13.63, 5], ['Nyala', 24.88, 12.05, 1], ['Kutum', 24.67, 14.2, 1], ['Ed Daein', 26.13, 11.46, 1]],
    'Upper Nile': [['Malakal', 31.66, 9.53, 5], ['Nasir', 33.07, 8.6, 1], ['Akobo', 33.0, 7.78, 1], ['Renk', 32.79, 11.75, 1], ['Kodok', 32.12, 9.89, 1],
      ['Pibor', 33.13, 6.8, 1], ['Bor', 31.56, 6.21, 1], ['Fangak', 30.88, 9.07, 1], ['Melut', 32.2, 10.44, 1], ['Waat', 32.15, 8.18, 1]],
    'Equatoria': [['Juba', 31.58, 4.85, 5], ['Torit', 32.57, 4.41, 1], ['Kapoeta', 33.59, 4.77, 1], ['Yei', 30.68, 4.09, 1], ['Boma', 34.37, 6.18, 1], ['Maridi', 29.47, 4.92, 1], ['Yambio', 28.4, 4.57, 1]],
    'Bahr el Ghazal': [['Wau', 28.0, 7.7, 3], ['Rumbek', 29.68, 6.8, 1], ['Shambe', 30.77, 7.1, 1], ['Bentiu', 29.8, 9.25, 1], ['Tonj', 28.68, 7.27, 1], ['Aweil', 27.4, 8.77, 1], ['Raga', 25.68, 8.47, 1]],
  },
  UGA: { 'Uganda': [['Kampala', 32.58, 0.32, 5], ['Gulu', 32.3, 2.77, 1], ['Jinja', 33.2, 0.44, 1], ['Moroto', 34.67, 2.53, 1], ['Arua', 30.91, 3.02, 1], ['Mbarara', 30.65, -0.61, 1], ['Fort Portal', 30.27, 0.66, 1]] },
  TAN: { 'Tanganyika': [['Mwanza', 32.9, -2.52, 3], ['Arusha', 36.68, -3.37, 1], ['Moshi', 37.34, -3.35, 1], ['Tanga', 39.1, -5.07, 3], ['Bukoba', 31.81, -1.33, 1], ['Tabora', 32.8, -5.02, 1], ['Kigoma', 29.63, -4.88, 1], ['Shinyanga', 33.42, -3.66, 1]] },
  BEL: {
    'Orientale': [['Stanleyville', 25.19, 0.52, 5], ['Bunia', 30.25, 1.56, 1], ['Buta', 24.73, 2.79, 1], ['Niangara', 27.87, 3.7, 1]],
    'Kivu': [['Costermansville', 28.86, -2.5, 1], ['Kindu', 25.92, -2.95, 1]],
    'Ruanda-Urundi': [['Kigali', 30.06, -1.95, 1], ['Usumbura', 29.36, -3.38, 1]],
  },
  FEA: { 'Ubangi-Shari': [['Obo', 26.49, 5.4, 1], ['Zemio', 25.13, 5.03, 1]] },
  EGY: { 'Lower Nubia': [['Abu Simbel', 31.63, 22.34, 1]] },
  LIB: { 'Kufra': [] },
  SAU: {
    'Hejaz': [['Mecca', 39.83, 21.42, 10], ['Jeddah', 39.19, 21.49, 5], ['Taif', 40.42, 21.27, 1], ['Al Qunfudhah', 41.08, 19.13, 1]],
    'Asir': [['Abha', 42.5, 18.22, 1], ['Jizan', 42.55, 16.89, 3], ['Najran', 44.13, 17.49, 1], ['Bisha', 42.6, 20.0, 1]],
    'Nejd': [['Wadi ad-Dawasir', 44.7, 20.45, 1], ['Sharurah', 47.1, 17.47, 1]],
  },
  YEM: {
    'Yemen': [['Sanaa', 44.21, 15.35, 10], ['Taiz', 44.02, 13.58, 3], ['Hodeidah', 42.95, 14.8, 3], ['Mocha', 43.25, 13.32, 1], ['Saada', 43.76, 16.94, 1], ['Marib', 45.32, 15.46, 3], ['Zafar', 44.4, 14.21, 3], ['Zabid', 43.32, 14.2, 1]],
    'Aden Protectorate': [['Aden', 45.03, 12.79, 10], ['Mukalla', 49.13, 14.54, 3], ['Shibam', 48.63, 15.93, 1], ['Ataq', 46.83, 14.54, 1], ['Shuqra', 45.7, 13.36, 1], ['Al Ghaydah', 52.17, 16.21, 1]],
  },
  OMA: { 'Dhofar': [] },
};

// Seven land fronts, one for each neighbour of the empire. `subs` = modern polygons that make up the objective zone.
// The Sudan is one enemy on two fronts: the boxes keep each zone to the lands east of the Nile bend that Aksum's
// armies actually reached (Kasu, Noba, Alwa) and to the Sobat and Sudd country below them.
export const FRONTS = [
  { id: 'eri', name: 'Mereb Front', enemy: 'ERI', enemyName: 'Italian Eritrea', subs: ['Eritrea'], defaultLabel: 'School',
    satrapy: 'Adulis & the Land of the Sea', hq: 'Mekele' },
  { id: 'nub', name: 'Nubian Front', enemy: 'SUD', enemyName: 'Anglo-Egyptian Sudan', subs: ['Sudan'], box: [30.0, 8.0, 39.0, 22.6], defaultLabel: 'Family',
    satrapy: 'Kasu, Noba & the Beja Country', hq: 'Gondar' },
  { id: 'sdd', name: 'Baro Front', enemy: 'SUD', enemyName: 'Anglo-Egyptian Sudan', subs: ['S. Sudan'], box: [29.5, 3.0, 36.5, 12.6], defaultLabel: 'Partner',
    satrapy: 'the Sobat & the Sudd', hq: 'Gore' },
  { id: 'ken', name: 'Borana Front', enemy: 'KEN', enemyName: 'Kenya Colony', subs: ['Kenya'], defaultLabel: 'Work',
    satrapy: 'Azania', hq: 'Yirgalem' },
  { id: 'som', name: 'Ogaden Front', enemy: 'ISO', enemyName: 'Italian Somaliland', subs: ['Somalia'], defaultLabel: 'Health',
    satrapy: 'Punt & the Benadir Coast', hq: 'Degehabur' },
  { id: 'bso', name: 'Haud Front', enemy: 'BSO', enemyName: 'British Somaliland', subs: ['Somaliland'], defaultLabel: 'Friends',
    satrapy: 'the Far-Side Ports', hq: 'Jijiga' },
  { id: 'dji', name: 'Railway Front', enemy: 'FSO', enemyName: 'French Somaliland', subs: ['Djibouti'], defaultLabel: 'Self',
    satrapy: 'the Gate of Tears', hq: 'Dire Dawa' },
];

// Terrain. ranges: polyline + half-width in degrees
export const RANGES = [
  { name: 'Ethiopian Highlands', w: 0.7, pts: [[39.4, 14.6], [39.5, 13.2], [39.45, 12.0], [39.4, 10.8], [39.4, 9.8], [38.9, 9.2]] },
  { name: 'Simien Mountains', w: 0.5, pts: [[37.8, 13.4], [38.4, 13.25], [38.9, 13.0]] },
  { name: 'Lasta', w: 0.45, pts: [[38.3, 12.0], [38.8, 12.1], [39.2, 11.8]] },
  { name: 'Choke Mountains', w: 0.45, pts: [[37.2, 11.0], [37.9, 10.7], [38.3, 10.4]] },
  { name: 'Western Highlands', w: 0.7, pts: [[35.6, 9.6], [36.0, 8.6], [36.2, 7.6], [36.0, 6.6], [35.7, 6.0]] },
  { name: 'Gurage & Gamo Highlands', w: 0.45, pts: [[38.1, 8.4], [37.8, 7.6], [37.5, 6.6], [37.4, 5.6]] },
  { name: 'Bale Mountains', w: 0.6, pts: [[39.2, 8.0], [39.5, 7.3], [39.9, 6.85], [40.5, 6.9]] },
  { name: 'Ahmar Mountains', w: 0.4, pts: [[40.2, 8.9], [41.0, 9.1], [41.9, 9.35], [42.6, 9.5]] },
  { name: 'Eritrean Highlands', w: 0.5, pts: [[38.3, 17.2], [38.7, 16.0], [39.0, 15.3], [39.3, 14.7]] },
  { name: 'Red Sea Hills', w: 0.6, pts: [[35.6, 22.3], [36.5, 20.5], [36.6, 19.2], [37.2, 18.0], [37.8, 17.4]] },
  { name: 'Golis Mountains', w: 0.4, pts: [[43.6, 10.0], [45.0, 10.0], [46.5, 10.5], [48.0, 10.9], [49.5, 11.1], [50.8, 11.6]] },
  { name: 'Asir', w: 0.5, pts: [[39.6, 22.4], [41.0, 20.3], [42.4, 18.3], [43.3, 17.0]] },
  { name: 'Yemen Highlands', w: 0.6, pts: [[43.6, 16.8], [44.0, 15.4], [44.1, 14.0], [44.4, 13.3]] },
  { name: 'Hadhramaut', w: 0.5, pts: [[46.5, 14.6], [48.5, 15.2], [50.5, 15.8]] },
  { name: 'Nuba Mountains', w: 0.6, pts: [[29.8, 11.9], [30.4, 11.0]] },
  { name: 'Jebel Marra', w: 0.5, pts: [[24.2, 13.4], [24.5, 12.7]] },
  { name: 'Kenya Highlands', w: 0.6, pts: [[35.5, 1.1], [35.9, 0.0], [36.6, -0.5], [37.3, -0.15]] },
  { name: 'Ruwenzori & Virunga', w: 0.5, pts: [[29.9, 0.6], [29.6, -0.6], [29.3, -1.6], [29.2, -3.0]] },
  { name: 'Imatong Mountains', w: 0.35, pts: [[32.6, 4.1], [33.6, 3.9]] },
  { name: 'Kilimanjaro', w: 0.35, pts: [[36.7, -3.2], [37.4, -3.07]] },
  { name: 'Mount Elgon & Karamoja', w: 0.35, pts: [[34.5, 1.1], [34.6, 2.6]] },
];
export const DESERTS = [ // [lon, lat, rx, ry, name]
  [41.0, 12.6, 1.2, 1.9, 'Danakil'], [44.5, 6.6, 2.4, 1.5, 'Ogaden'], [45.6, 8.5, 2.0, 0.7, 'Haud'], [33.5, 20.6, 2.6, 1.5, 'Nubian Desert'],
  [32.3, 18.0, 1.2, 0.9, 'Bayuda'], [26.5, 19.5, 3.0, 3.0, 'Libyan Desert'], [27.8, 16.2, 3.4, 1.6, 'Wadi Howar'], [37.3, 3.0, 0.9, 0.5, 'Chalbi Desert'],
  [44.6, 10.65, 1.7, 0.3, 'Guban'], [48.6, 8.6, 1.4, 0.9, 'Nogal'], [47.4, 5.2, 1.6, 1.5, 'Mudugh'], [42.95, 15.6, 0.4, 2.0, 'Tihama'],
  [48.5, 18.8, 4.0, 1.7, 'Rub al Khali'], [40.0, 2.2, 1.6, 1.2, 'Northern Frontier'], [35.9, 3.4, 0.7, 0.9, 'Turkana'],
];
export const FORESTS = [[35.7, 7.5, 0.8, 0.9], [39.7, 6.4, 0.5, 0.3], [27.5, 1.2, 3.6, 2.4], [25.6, -2.6, 2.0, 2.4], [28.6, 4.8, 1.5, 0.6], [31.6, 0.9, 0.8, 0.6]];
export const MARSHES = [[30.6, 7.9, 1.2, 1.5], [33.2, 9.35, 0.6, 0.5], [34.0, 8.1, 0.5, 0.3], [39.6, 0.8, 0.4, 0.3], [41.6, 11.3, 0.3, 0.25], [43.1, 0.6, 0.5, 0.4], [33.0, 1.5, 0.6, 0.3]];

export const LAKES = [
  { name: 'Lake Tana', pts: [[37.02, 11.95], [37.08, 12.17], [37.25, 12.2], [37.48, 12.22], [37.62, 11.98], [37.5, 11.72], [37.38, 11.63], [37.15, 11.72]] },
  { name: 'Lake Rudolf', pts: [[35.85, 4.45], [36.15, 4.6], [36.2, 4.0], [36.6, 3.4], [36.75, 2.8], [36.65, 2.4], [36.45, 2.45], [36.3, 3.1], [35.95, 3.6], [35.8, 4.0]] },
  { name: 'Lake Stefanie', pts: [[36.75, 4.9], [36.95, 4.9], [36.95, 4.45], [36.8, 4.45]] },
  { name: 'Lake Abaya', pts: [[37.75, 6.6], [37.95, 6.55], [38.05, 6.2], [37.95, 5.95], [37.75, 6.05], [37.7, 6.35]] },
  { name: 'Lake Chamo', pts: [[37.5, 5.95], [37.65, 5.9], [37.65, 5.7], [37.5, 5.7]] },
  { name: 'Lake Ziway', pts: [[38.77, 8.1], [38.92, 8.05], [38.94, 7.88], [38.8, 7.85], [38.76, 7.97]] },
  { name: 'Lake Langano', pts: [[38.7, 7.68], [38.85, 7.65], [38.8, 7.52], [38.7, 7.55]] },
  { name: 'Lake Shala', pts: [[38.4, 7.55], [38.65, 7.52], [38.68, 7.4], [38.45, 7.4]] },
  { name: 'Lake Abbe', pts: [[41.65, 11.25], [41.9, 11.2], [41.85, 11.05], [41.7, 11.05]] },
  { name: 'Lake Victoria', pts: [[31.75, -0.5], [32.3, 0.1], [33.2, 0.33], [34.0, 0.2], [34.2, -0.3], [34.72, -0.15], [34.7, -0.45], [34.05, -0.6], [34.0, -1.2], [33.6, -1.9], [33.3, -2.15], [33.05, -2.3], [32.85, -2.4],
    [32.3, -2.5], [31.9, -2.2], [31.88, -1.3]] },
  { name: 'Lake Albert', pts: [[30.4, 1.1], [30.85, 1.7], [31.35, 2.3], [31.3, 2.05], [31.0, 1.5], [30.6, 1.05]] },
  { name: 'Lake Edward', pts: [[29.4, -0.2], [29.75, -0.15], [29.7, -0.6], [29.4, -0.6]] },
  { name: 'Lake Kivu', pts: [[29.0, -1.65], [29.3, -1.75], [29.2, -2.3], [28.92, -2.4]] },
  { name: 'Lake Tanganyika', pts: [[29.15, -3.42], [29.42, -3.48], [29.58, -5.2], [29.2, -5.2]] },
];
export const RIVERS = [
  { name: 'Abay (Blue Nile)', pts: [[37.38, 11.6], [37.6, 11.47], [37.9, 11.2], [38.35, 11.0], [38.6, 10.6], [38.2, 10.07], [37.6, 9.85], [36.9, 9.95], [36.3, 10.15], [35.65, 10.1], [35.3, 10.6], [35.1, 11.2],
    [34.38, 11.85], [33.95, 12.6], [33.6, 13.55], [33.52, 14.4], [33.0, 15.1], [32.52, 15.6]] },
  { name: 'White Nile', pts: [[31.4, 2.3], [32.05, 3.6], [31.6, 4.85], [31.55, 6.2], [30.8, 7.1], [30.5, 9.5], [31.45, 9.37], [31.65, 9.53], [32.1, 9.9], [32.8, 11.75], [32.66, 13.16], [32.3, 14.0], [32.52, 15.6]] },
  { name: 'Nile', pts: [[32.52, 15.6], [32.9, 16.3], [33.43, 16.69], [33.72, 16.95], [33.98, 17.7], [33.98, 18.02], [33.32, 19.53], [32.4, 19.0], [31.85, 18.55], [30.95, 18.05], [30.48, 19.17], [30.4, 19.6],
    [30.35, 20.6], [31.35, 21.8], [31.5, 22.6]] },
  { name: 'Victoria Nile', pts: [[33.2, 0.42], [32.95, 1.3], [32.1, 1.7], [31.7, 2.28], [31.4, 2.3]] },
  { name: 'Atbara', pts: [[37.0, 12.6], [36.5, 12.8], [36.1, 12.95], [35.95, 13.6], [35.88, 14.25], [35.9, 14.97], [35.2, 16.1], [34.4, 17.2], [33.98, 17.7]] },
  { name: 'Tekezé', pts: [[39.1, 12.1], [38.75, 12.45], [38.7, 13.2], [38.4, 13.75], [37.9, 13.9], [37.3, 14.2], [36.6, 14.3], [35.88, 14.25]] },
  { name: 'Mereb', pts: [[38.75, 15.1], [38.75, 14.6], [38.2, 14.55], [37.6, 14.75], [37.0, 15.0], [36.5, 15.3], [36.4, 15.9]] },
  { name: 'Awash', pts: [[38.0, 9.1], [38.6, 8.75], [39.15, 8.4], [39.7, 8.6], [40.17, 8.99], [40.4, 9.6], [40.65, 10.17], [40.6, 11.0], [40.95, 11.68], [41.44, 11.56], [41.75, 11.15]] },
  { name: 'Omo', pts: [[37.1, 9.0], [37.55, 8.25], [37.5, 7.6], [37.55, 7.05], [37.35, 6.65], [36.8, 6.45], [36.2, 6.2], [35.95, 5.5], [36.05, 4.8], [36.0, 4.6]] },
  { name: 'Didessa', pts: [[36.1, 8.0], [36.3, 8.9], [35.9, 9.6], [35.65, 10.1]] },
  { name: 'Baro & Sobat', pts: [[35.5, 8.1], [34.58, 8.25], [34.27, 8.2], [33.8, 8.37], [33.07, 8.6], [32.3, 8.9], [31.45, 9.37]] },
  { name: 'Shebelle', pts: [[39.3, 7.0], [40.0, 7.45], [40.9, 7.4], [42.17, 6.47], [43.55, 5.95], [44.2, 5.6], [44.73, 5.25], [45.2, 4.74], [45.57, 3.85], [45.5, 2.78], [45.12, 2.14], [44.6, 1.85], [43.9, 1.2], [43.2, 0.5]] },
  { name: 'Genale & Juba', pts: [[39.0, 6.5], [39.7, 5.7], [40.5, 5.45], [41.4, 4.75], [42.07, 4.17], [42.54, 3.8], [42.28, 2.34], [42.77, 0.49], [42.6, -0.25]] },
  { name: 'Dawa', pts: [[38.7, 5.75], [39.3, 5.0], [39.9, 4.45], [40.8, 4.2], [41.5, 4.0], [42.07, 4.17]] },
  { name: 'Tana', pts: [[37.3, -0.6], [38.0, -0.1], [39.0, -0.15], [39.65, -0.45], [40.1, -1.8], [40.53, -2.53]] },
];

// The one railway of 1935 is the Franco-Ethiopian line from Djibouti. The rest are planned lines (several follow
// routes that were surveyed or proposed in the period), built as the empire's infrastructure grows.
export const RAILWAYS = [
  { name: 'Franco-Ethiopian Railway', stage: 0, via: [[43.15, 11.59], [42.93, 11.31], 'Dewele', 'Aysha', 'Dire Dawa', 'Erer', 'Afdem', [40.75, 9.23], 'Awash', [39.7, 8.72], 'Adama', 'Bishoftu', 'Addis Ababa'] },
  { name: 'Dessie Line', stage: 1, via: ['Addis Ababa', 'Debre Berhan', 'Debre Sina', 'Shewa Robit', 'Kemise', 'Dessie'] },
  { name: 'Jimma Line', stage: 1, via: ['Addis Ababa', 'Welkite', 'Sokoru', 'Jimma'] },
  { name: 'Harar & Jijiga Spur', stage: 2, via: ['Dire Dawa', 'Harar', 'Jijiga'] },
  { name: 'Northern Line', stage: 2, via: ['Dessie', 'Weldiya', 'Korem', 'Maychew', 'Amba Alagi', 'Mekele', 'Wukro', 'Adigrat'] },
  { name: 'Rift Valley Line', stage: 2, via: ['Adama', 'Ziway', 'Shashamane', 'Yirgalem', 'Dilla'] },
  { name: 'Gojjam & Lake Tana Line', stage: 3, via: ['Addis Ababa', 'Fiche', 'Dejen', 'Debre Markos', 'Dembecha', 'Bure', 'Dangila', 'Bahir Dar', 'Addis Zemen', 'Gondar'] },
  { name: 'Western Line', stage: 3, via: ['Addis Ababa', 'Holeta', 'Ambo', 'Bako', 'Nekemte', 'Gimbi'] },
  { name: 'Aussa Line', stage: 3, via: ['Dessie', 'Bati', 'Mille', 'Sardo'] },
  { name: 'Ogaden Line', stage: 4, via: ['Jijiga', 'Degehabur', 'Gorrahei', 'Gode'] },
  { name: 'Baro Line', stage: 4, via: ['Jimma', 'Agaro', 'Bedele', 'Gore', 'Gambela'] },
  { name: 'Borana Line', stage: 4, via: ['Dilla', 'Agere Maryam', 'Yabelo', 'Mega', 'Moyale'] },
];

export const SEA_LABELS = [
  ['RED SEA', 39.6, 18.9, 1.1, 52], ['GULF OF ADEN', 47.6, 12.6, 1.0, -8], ['INDIAN OCEAN', 48.6, 1.2, 1.3], ['Bab el-Mandeb', 43.9, 12.25, 0.5],
];
export const COUNTRY_LABELS = [['SUD', 'ANGLO-EGYPTIAN SUDAN', 29.3, 15.6, 15], ['KEN', 'KENYA', 37.9, 0.9, 14], ['ISO', 'ITALIAN SOMALILAND', 46.3, 3.7, 10], ['BSO', 'BR. SOMALILAND', 46.0, 9.7, 8],
  ['ERI', 'ERITREA', 38.0, 16.0, 9], ['YEM', 'YEMEN & ADEN', 46.6, 15.4, 10], ['SAU', 'SAUDI ARABIA', 44.6, 20.6, 13], ['UGA', 'UGANDA', 32.4, 1.7, 10], ['BEL', 'BELGIAN CONGO', 26.6, 0.4, 13],
  ['TAN', 'TANGANYIKA', 34.8, -4.3, 11], ['FEA', 'FRENCH EQ. AFRICA', 24.8, 6.9, 8], ['EGY', 'EGYPT', 28.6, 22.3, 9]];
export const HOME_LABEL = [40.4, 7.9];

// Rough outline of the Aksumite Empire at its height (4th–6th century): the northern highlands and the coast of
// Adulis, the Beja country and the Nile at Meroë after the campaigns against Kasu and Noba, and Himyar across the sea.
export const EMPIRE = [[37.3, 20.8], [35.2, 19.6], [33.5, 18.0], [33.2, 16.6], [32.6, 15.4], [33.6, 14.2], [35.0, 13.0], [36.2, 11.8], [37.4, 10.9], [38.8, 10.6],
  [40.2, 10.6], [41.6, 10.8], [43.3, 10.8], [44.4, 11.4], [45.6, 12.4], [47.4, 13.3], [49.6, 14.4], [50.6, 15.4], [49.4, 16.9], [47.0, 17.6],
  [44.6, 17.9], [43.0, 17.6], [42.0, 17.0], [40.6, 17.2], [39.2, 18.3], [38.2, 19.6]];

// Ethiopia had no navy in 1935: the "fleets" are a lake flotilla and a river flotilla. No naval fronts.
export const FLEET_AT = { tana: [37.3, 11.93], baro: [34.15, 8.33] };

export const META = {
  name: 'Ethiopia',
  long: 'Ethiopian Empire',
  empire: 'Aksumite Empire',
  year: 1935,
  blurb: 'Seven frontiers around the mountain empire, every one of them a colony. Restore Aksum from the Nile to the Red Sea.',
  pitch: 'a 1935 grand-strategy war map of Ethiopia',
  flag: { type: 'h3', colors: ['#2f8f4e', '#f2c230', '#c8342c'] },
  regionWord: 'Tributary Kingdom',
  // FOREIGN region → the name it bore in Aksumite inscriptions, the Periplus of the Erythraean Sea or older tradition
  regions: {
    'Hamasien': 'the Land of the Sea', 'Samhar': 'Adulis', 'Seraye & Akele Guzai': 'Koloe', 'Barka': 'the Baria Marches', 'Sahel': 'the Northern Beja Country', 'Dankalia': 'the Salt Coast',
    'Djibouti & the Issa Country': 'the Gate of Tears', 'Tadjoura & Obock': 'the Straits',
    'Zeila & Awdal': 'Avalites', 'Berbera': 'Malao', 'Burao & the Nogal': 'the Incense Country', 'Erigavo & Makhir': 'Mundus',
    'Migiurtinia': 'the Cape of Spices', 'Mudugh': 'Punt', 'Hiran': 'the Upper Shebelle', 'Benadir': 'Sarapion', 'Upper Juba': 'the Land between the Rivers', 'Oltre Giuba': 'Nikon',
    'Northern Frontier': 'the Southern Marches', 'Turkana': 'the Jade Sea', 'Kenya Highlands': 'the Highlands of Azania', 'Kenya Coast': 'Azania',
    'Kassala & Gedaref': 'the Beja Country', 'Red Sea Hills': 'the Land of the Blemmyes', 'Berber & Shendi': 'Kasu', 'Khartoum & the Gezira': 'Alwa', 'Dongola': 'Noba', 'Kordofan': 'the Western Noba',
    'Upper Nile': 'the Sobat', 'Equatoria': 'the Upper Nile', 'Bahr el Ghazal': 'the Sudd',
  },
  capitalFalls: 'The government withdraws to Gore in the western highlands. The war goes on.',
  capitalFreed: 'Addis Ababa is free again. The Emperor returns to the capital.',
  fightsOnFrom: 'Gore',
  honor: {
    eri: ['Tigray', 'Adwa', 'Aksum', 'Mekele', 'Agame', 'Tembien', 'Enderta', 'Shire', 'Adigrat', 'Raya'],
    nub: ['Begemder', 'Gondar', 'Simien', 'Dembiya', 'Qwara', 'Wolkait', 'Gojjam', 'Metemma', 'Debre Tabor', 'Damot'],
    sdd: ['Wollega', 'Illubabor', 'Gore', 'Nekemte', 'Sayo', 'Beni Shangul', 'Gambela', 'Leqa', 'Gimbi', 'Baro'],
    ken: ['Sidamo', 'Borana', 'Kaffa', 'Gamo', 'Wolayta', 'Jimma', 'Konso', 'Gofa', 'Maji', 'Yirgalem'],
    som: ['Ogaden', 'Bale', 'Arsi', 'Gorrahei', 'Negele', 'Shebelle', 'Ginir', 'Welwel', 'Genale', 'Degehabur'],
    bso: ['Harar', 'Jijiga', 'Chercher', 'Hararghe', 'Gursum', 'Haud', 'Deder', 'Garamuleta', 'Fafen', 'Babile'],
    dji: ['Shewa', 'Wollo', 'Aussa', 'Dire Dawa', 'Awash', 'Ankober', 'Menz', 'Yifat', 'Dessie', 'Bulga'],
  },
  // invented, period-plausible; titles as borne by provincial commanders of the levy
  commanders: {
    eri: 'Ras Hagos Gebre Medhin', nub: 'Dejazmach Tadesse Wondimu', sdd: 'Dejazmach Fayisa Gemechu', ken: 'Dejazmach Shiferaw Negatu',
    som: 'Ras Demissie Welde Amanuel', bso: 'Dejazmach Girma Ayele', dji: 'Fitawrari Mesfin Welde Maryam',
  },
  // the provincial levies: foot, highland infantry and horse. No armour at the front.
  oob: {
    eri: ['mtn', 'mtn', 'inf', 'cav'], nub: ['mtn', 'inf', 'cav'], sdd: ['inf', 'inf', 'cav'], ken: ['inf', 'cav', 'cav'],
    som: ['inf', 'cav', 'inf', 'art'], bso: ['inf', 'cav', 'mtn'], dji: ['inf', 'inf', 'art'],
  },
  guard: [['grd', '1st Imperial Guard Division “Kebur Zabagna”'], ['arm', 'Imperial Guard Armoured Car Squadron']],
  officerNames: {
    first: ['Tadesse', 'Girma', 'Mesfin', 'Tesfaye', 'Bekele', 'Alemayehu', 'Worku', 'Demissie', 'Hagos', 'Gebre Medhin', 'Fayisa', 'Shiferaw', 'Negash', 'Welde Maryam', 'Asfaw', 'Kidane'],
    last: ['Wondimu', 'Gemechu', 'Negatu', 'Tekle Maryam', 'Welde Giyorgis', 'Gebre Selassie', 'Ayele', 'Birhanu', 'Tola', 'Zewde', 'Abera', 'Gurmu', 'Welde Amanuel', 'Tsegaye', 'Lemma', 'Gebre Kidan'],
    ranks: { div: 'Dejazmach', bde: 'Fitawrari', guard: 'Ras' },
  },
  // the handful of aircraft the Imperial Ethiopian Air Force really had
  wings: [
    { name: '1st Imperial Flight', type: 'cas', model: 'Potez 25', base: 'Addis Ababa', planes: 6 },
    { name: '2nd Imperial Flight', type: 'bomber', model: 'Fokker F.VIIa/3m', base: 'Dire Dawa', planes: 3 },
    { name: '3rd Imperial Flight', type: 'fighter', model: 'Potez 25 A2', base: 'Dessie', planes: 4 },
    { name: 'Courier Flight', type: 'cas', model: 'Junkers W 33', base: 'Jijiga', planes: 3 },
  ],
  newWingModels: { fighter: 'Gloster Gauntlet', cas: 'Hawker Hart', bomber: 'Junkers Ju 52/3m' },
  // invented: armed launches and reed boats (tankwa) on Lake Tana, and a steamer landing at Gambela on the Baro
  fleets: [
    { id: 'tana', name: 'Lake Tana Flotilla', base: 'Gorgora', sea: 'Lake Tana', fronts: ['eri', 'nub', 'dji', 'bso'],
      ships: [['Tana Kirkos', 'Armed Launch'], ['Dek', 'Armed Launch'], ['Daga', 'Tankwa Squadron'], ['Zege', 'Tankwa Squadron']] },
    { id: 'baro', name: 'Baro River Flotilla', base: 'Gambela', sea: 'Baro River', fronts: ['sdd', 'ken', 'som'],
      ships: [['Baro', 'River Steamer'], ['Sobat', 'Armed Launch'], ['Gilo', 'Armed Launch']] },
  ],
  shipNames: ['Abay', 'Tekezé', 'Awash', 'Omo', 'Genale', 'Shebelle', 'Gibe', 'Didessa', 'Mereb', 'Tis Issat', 'Narga', 'Kibran', 'Rema', 'Debre Maryam', 'Mitsraha', 'Gabaza',
    'Adulis', 'Aksum', 'Yeha', 'Lalibela', 'Gondar', 'Zion', 'Lion of Judah', 'Enkutatash'],
  operations: ['Adwa', 'Makeda', 'Tabot', 'Kebra Nagast', 'Lion of Judah', 'Zion', 'Stele', 'Meskel', 'Timkat', 'Gundet', 'Gura', 'Dogali', 'Ras Dashen', 'Abay', 'Yeha', 'Negarit'],
  enemyOperations: ['Aquila', 'Littorio', 'Scirocco', 'Vesuvio', 'Tevere', 'Ghibli', 'Bersagliere', 'Khamsin', 'Monsoon', 'Sirdar', 'Mistral', 'Tricolore'],
  nicknames: ['Lions', 'Leopards', 'Eagles', 'Spears', 'Shields', 'Thunderbolts', 'Wolves', 'Buffaloes'],
  stateStart: {
    'Shewa': [3, 3, 1, 0], 'Hararghe': [3, 2, 1, 0], 'Wollo': [2, 1, 1, 0], 'Tigray': [1, 1, 0, 0], 'Begemder': [1, 1, 0, 1], 'Gojjam': [1, 1, 0, 0], 'Wollega': [1, 1, 0, 0],
    'Illubabor': [1, 0, 0, 0], 'Kaffa': [1, 1, 0, 0], 'Sidamo': [1, 1, 0, 0], 'Arsi': [1, 0, 0, 0], 'Gamo-Gofa': [0, 0, 0, 0], 'Bale': [0, 0, 0, 0], 'Ogaden': [0, 0, 0, 0],
  },
  weather: { nub: 'heat', sdd: 'heat', som: 'heat', bso: 'heat', dji: 'heat' },
  enemyAdjectives: { ERI: 'Italian', ISO: 'Italian', BSO: 'British', FSO: 'French', SUD: 'Anglo-Egyptian', KEN: 'British' },
  ranks: [['Wotader', 'Soldier'], ['Asir Aleqa', 'Leader of Ten'], ['Hamsa Aleqa', 'Leader of Fifty'], ['Meto Aleqa', 'Leader of a Hundred'], ['Shaleqa', 'Leader of a Thousand'],
    ['Balambaras', 'Commander of the Fortress'], ['Grazmach', 'Commander of the Left Wing'], ['Qegnazmach', 'Commander of the Right Wing'], ['Fitawrari', 'Commander of the Vanguard'],
    ['Dejazmach', 'Commander of the Gate'], ['Ras', 'Head of an Army'], ['Ras Bitwoded', 'Beloved Ras, First Lord of the Realm']],
  landmarks: [
    { city: 'Adulis', medal: 'Throne of Adulis', desc: 'Reach Adulis, the lost port of Aksum on the Red Sea' },
    { city: 'Meroë', medal: 'Stele of Meroë', desc: 'Enter Meroë, the city of the kings of Kush, where an Aksumite king once raised his inscription' },
  ],
  medalNames: { ten: 'Order of the Star of Ethiopia', fifty: 'Order of Menelik II', decisive: 'Order of the Holy Trinity', week: 'Order of the Queen of Sheba', month: 'Order of Solomon’s Seal',
    defender: 'Defender of Addis Ababa', satrap: 'Bahr Negash', empire: 'Negusa Nagast' },
  masthead: 'YE-TOR BERHAN',
  calendar: 'ethiopic',
  days: [
    { month: 9, day: 11, text: 'Melkam Addis Amet. Enkutatash: a new year on every front.' },
    { month: 3, day: 2, text: 'Adwa Day. The empire remembers the first of March 1896.' },
    { month: 1, day: 7, text: 'Melkam Genna. A quiet Christmas on the line.' },
    { month: 9, day: 27, text: 'Meskel. The bonfires are lit along the whole front.' },
  ],
  motto: 'Moʼa Anbessa Zeʼimnegede Yihuda — “The Lion of the Tribe of Judah has conquered.”',
};
