// Siam, 1936. The Kingdom of Siam four years after the 1932 revolution, three years before it was renamed Thailand.
// Formable: Greater Siam — the Rattanakosin kingdom's sphere at its widest under Rama III (r. 1824–51), when Bangkok held
// suzerainty over Lan Na, the Lao kingdoms (Luang Prabang, Vientiane until 1828, Champasak), Cambodia and the northern
// Malay sultanates (Kedah, Perlis, Kelantan, Terengganu), together with the two older claims the court never gave up:
// Tenasserim (Tavoy and Mergui, Ayutthayan until the 1760s) and the trans-Salween Shan state of Kengtung (campaigns of 1849–54).
// Coordinates are [lon, lat]. City tuple: [name, lon, lat, vp?, flags?]
// flags: P port, N naval base, A airbase, S supply hub, R heavy industry, F fort, C capital

export const ID = 'siam';
export const HOME = 'THA';
export const CAPITAL = 'Bangkok';
export const EXTENT = { lon0: 88, lon1: 113.5, lat0: -0.5, lat1: 26 };

// ---- 1936 political entities built from modern polygons ----
// Approximations forced by modern borders:
//  * Siam = modern Thailand. The 1936 border is the modern one (fixed by the treaties of 1893, 1904, 1907 and 1909).
//  * British Burma = modern Myanmar. In 1936 Burma was still a province of British India; it became a separate crown
//    colony on 1 April 1937. It is drawn separately here because it is a different front and a different enemy.
//  * French Indochina = Vietnam (Tonkin, Annam, Cochinchina) + Laos + Cambodia. The leased territory of Kwangchowan
//    (Fort-Bayard) on the Chinese coast, administered from Hanoi, cannot be cut out of modern China and is shown as Chinese.
//  * British Malaya = Malaysia + Singapore (+ Brunei, which lies just east of the extent): the Straits Settlements, the
//    Federated and Unfederated Malay States, and — for want of a better home — Sarawak, in 1936 the Brooke raj under
//    British protection.
//  * British India = India + Bangladesh (Bengal, Assam and the Andaman & Nicobar Islands).
//  * China = modern China (Yunnan, Kwangsi, Kwangtung, Hainan). Hong Kong and Macau lie east of the extent.
export const COUNTRIES = {
  THA: { name: 'Siam', long: 'Kingdom of Siam', color: '#c2a046', from: ['Thailand'], spacing: 0.55 },
  BUR: { name: 'British Burma', long: 'Burma, province of British India (a separate colony from 1937)', color: '#a8475a', from: ['Myanmar'], spacing: 1.0 },
  FIC: { name: 'French Indochina', long: 'Indochinese Union (Tonkin, Annam, Cochinchina, Laos, Cambodia)', color: '#4a67a8', from: ['Vietnam', 'Laos', 'Cambodia'], spacing: 0.95 },
  MAL: { name: 'British Malaya', long: 'Straits Settlements, Malay States & Sarawak', color: '#b0586a', from: ['Malaysia', 'Singapore', 'Brunei'], spacing: 0.9 },
  RAJ: { name: 'British India', long: 'Indian Empire (Bengal, Assam, Andaman & Nicobar Islands)', color: '#9a4f6e', from: ['India', 'Bangladesh'], spacing: 1.4 },
  DEI: { name: 'Dutch East Indies', long: 'Netherlands East Indies', color: '#c4854a', from: ['Indonesia'], spacing: 1.5 },
  CHI: { name: 'China', long: 'Republic of China', color: '#7d7f9c', from: ['China'], spacing: 1.7 },
};

// ---- Siam: the monthon (administrative circles, 1897–1933) and their towns ----
// The monthon were abolished in 1933; their names were still the everyday regional geography of 1936.
export const HOME_STATES = {
  'Krung Thep': [
    ['Bangkok', 100.50, 13.75, 50, 'CPNSR'], ['Don Mueang', 100.61, 13.92, 3, 'A'], ['Paknam', 100.60, 13.59, 3, 'F'],
    ['Samut Sakhon', 100.27, 13.55, 1], ['Nakhon Pathom', 100.06, 13.82, 3], ['Suphan Buri', 100.12, 14.47, 3],
  ],
  'Ayutthaya': [
    ['Ayutthaya', 100.57, 14.35, 5], ['Lopburi', 100.62, 14.80, 5, 'A'], ['Saraburi', 100.91, 14.53, 3],
    ['Sing Buri', 100.40, 14.89, 1], ['Chai Badan', 101.13, 15.20, 1], ['Nakhon Nayok', 101.21, 14.20, 1],
  ],
  'Nakhon Sawan': [
    ['Nakhon Sawan', 100.12, 15.70, 5, 'S'], ['Chai Nat', 100.13, 15.19, 1], ['Kamphaeng Phet', 99.52, 16.48, 3],
    ['Tak', 99.13, 16.88, 3], ['Mae Sot', 98.57, 16.71, 1, 'F'], ['Umphang', 98.86, 16.02, 1], ['Phichit', 100.35, 16.44, 1],
  ],
  'Phitsanulok': [
    ['Phitsanulok', 100.26, 16.82, 5], ['Sukhothai', 99.82, 17.01, 3], ['Sawankhalok', 99.83, 17.31, 1], ['Uttaradit', 100.10, 17.63, 3],
    ['Phetchabun', 101.16, 16.42, 3], ['Lom Sak', 101.24, 16.78, 1], ['Nakhon Thai', 100.84, 17.10, 1],
  ],
  'Phayap': [
    ['Chiang Mai', 98.99, 18.79, 10, 'AS'], ['Lamphun', 99.01, 18.58, 3], ['Lampang', 99.49, 18.29, 5, 'A'], ['Chiang Rai', 99.83, 19.91, 3],
    ['Mae Hong Son', 97.97, 19.30, 1, 'F'], ['Mae Sariang', 97.93, 18.16, 1], ['Phrae', 100.14, 18.14, 3], ['Nan', 100.77, 18.78, 3],
    ['Phayao', 99.90, 19.17, 1], ['Chiang Saen', 100.08, 20.27, 1, 'F'], ['Mae Sai', 99.88, 20.43, 1], ['Chiang Khong', 100.41, 20.26, 1],
    ['Fang', 99.21, 19.92, 1], ['Den Chai', 100.05, 17.98, 1],
    ['Thoen', 99.22, 17.61, 1], ['Ngao', 99.97, 18.75, 1],
  ],
  'Udon': [
    ['Udon Thani', 102.79, 17.41, 5, 'S'], ['Nong Khai', 102.74, 17.88, 3, 'F'], ['Khon Kaen', 102.83, 16.43, 5], ['Loei', 101.72, 17.49, 1],
    ['Sakon Nakhon', 104.15, 17.16, 3], ['Nakhon Phanom', 104.78, 17.40, 3, 'F'], ['Chiang Khan', 101.67, 17.90, 1], ['Mukdahan', 104.72, 16.54, 1],
    ['Bueng Kan', 103.65, 18.36, 1], ['Chum Phae', 102.10, 16.54, 1],
    ['Kumphawapi', 103.02, 17.11, 1],
  ],
  'Ubon': [
    ['Ubon Ratchathani', 104.86, 15.23, 10, 'AS'], ['Sisaket', 104.33, 15.12, 1], ['Surin', 103.49, 14.88, 3], ['Roi Et', 103.65, 16.05, 3],
    ['Maha Sarakham', 103.30, 16.18, 1], ['Kalasin', 103.51, 16.43, 1], ['Yasothon', 104.15, 15.79, 1], ['Khemmarat', 105.21, 16.04, 1],
    ['Phibun Mangsahan', 105.23, 15.24, 1, 'F'], ['Det Udom', 105.08, 14.90, 1], ['Amnat Charoen', 104.63, 15.86, 1],
    ['Kantharalak', 104.65, 14.64, 1],
  ],
  'Nakhon Ratchasima': [
    ['Nakhon Ratchasima', 102.10, 14.97, 10, 'AS'], ['Buriram', 103.10, 15.00, 3], ['Chaiyaphum', 102.03, 15.81, 3], ['Pak Chong', 101.42, 14.71, 1],
    ['Bua Yai', 102.43, 15.59, 1], ['Phimai', 102.49, 15.22, 3], ['Nang Rong', 102.79, 14.64, 1], ['Sikhio', 101.72, 14.89, 1],
    ['Chatturat', 101.85, 15.57, 1], ['Ban Phai', 102.73, 16.06, 1],
  ],
  'Prachinburi': [
    ['Prachinburi', 101.37, 14.05, 3, 'AS'], ['Chachoengsao', 101.07, 13.69, 3], ['Aranyaprathet', 102.50, 13.69, 3, 'F'], ['Kabin Buri', 101.72, 13.98, 1],
    ['Sa Kaeo', 102.07, 13.82, 1], ['Ta Phraya', 102.80, 14.00, 1], ['Chonburi', 100.98, 13.36, 3], ['Si Racha', 100.93, 13.17, 1],
    ['Sattahip', 100.90, 12.67, 5, 'N'], ['Rayong', 101.28, 12.68, 1], ['Chanthaburi', 102.10, 12.61, 5, 'P'],
    ['Trat', 102.51, 12.24, 3, 'F'], ['Khlong Yai', 102.84, 11.90, 1],
  ],
  'Ratchaburi': [
    ['Ratchaburi', 99.82, 13.54, 5, 'S'], ['Kanchanaburi', 99.53, 14.02, 3], ['Phetchaburi', 99.95, 13.11, 3],
    ['Ban Pong', 99.87, 13.82, 1], ['Hua Hin', 99.96, 12.57, 3], ['Pran Buri', 99.91, 12.39, 1], ['Prachuap Khiri Khan', 99.80, 11.81, 3, 'A'],
    ['Bang Saphan', 99.51, 11.21, 1], ['Thong Pha Phum', 98.64, 14.74, 1], ['Sangkhla Buri', 98.46, 15.15, 1, 'F'],

  ],
  'Chumphon': [
    ['Chumphon', 99.18, 10.49, 3, 'PS'], ['Surat Thani', 99.32, 9.14, 5, 'P'], ['Ranong', 98.63, 9.97, 3, 'F'], ['Lang Suan', 99.08, 9.95, 1],
    ['Chaiya', 99.20, 9.39, 1], ['Kra Buri', 98.78, 10.41, 1], ['Khiri Rat Nikhom', 98.95, 9.03, 1], ['Ban Na San', 99.36, 8.80, 1],
  ],
  'Phuket': [
    ['Phuket', 98.39, 7.89, 5, 'PR'], ['Phang Nga', 98.53, 8.45, 1], ['Takua Pa', 98.35, 8.87, 1], ['Krabi', 98.91, 8.06, 1],
    ['Trang', 99.61, 7.56, 3], ['Kantang', 99.52, 7.41, 1, 'P'], ['Huai Yot', 99.63, 7.79, 1], ['Satun', 100.07, 6.62, 1, 'F'],
  ],
  'Nakhon Si Thammarat': [
    ['Nakhon Si Thammarat', 99.96, 8.43, 5], ['Thung Song', 99.68, 8.16, 3], ['Songkhla', 100.60, 7.20, 10, 'PNA'], ['Hat Yai', 100.47, 7.01, 5, 'S'],
    ['Phatthalung', 100.08, 7.62, 3], ['Pak Phanang', 100.20, 8.35, 1], ['Sichon', 99.90, 9.00, 1], ['Padang Besar', 100.32, 6.66, 1, 'F'],
    ['Cha-uat', 99.99, 7.97, 1],
  ],
  'Pattani': [
    ['Pattani', 101.25, 6.87, 5, 'P'], ['Yala', 101.28, 6.54, 3], ['Narathiwat', 101.82, 6.43, 3], ['Sungai Kolok', 101.97, 6.03, 1, 'F'],
    ['Betong', 101.07, 5.77, 1, 'F'], ['Rueso', 101.51, 6.38, 1], ['Thepha', 100.96, 6.83, 1],
  ],
};

// ---- Foreign cities by country tag → region → cities. Region names are the 1936 ones; META.regions gives the Siamese names. ----
export const FOREIGN = {
  BUR: {
    'Kengtung': [['Kengtung', 99.60, 21.29, 5], ['Tachileik', 99.88, 20.47, 1], ['Mong Hsat', 99.26, 20.53, 1], ['Mong Yawng', 100.35, 21.17, 1],
      ['Mong Hpayak', 99.95, 20.88, 1], ['Mong Ping', 99.02, 21.35, 1], ['Mong Ton', 98.90, 20.30, 1], ['Mong Yang', 99.68, 21.85, 1]],
    'Shan States': [['Taunggyi', 97.04, 20.78, 5], ['Lashio', 97.75, 22.93, 3], ['Hsipaw', 97.30, 22.62, 1], ['Loilem', 97.56, 20.92, 1], ['Mong Nai', 97.87, 20.51, 1],
      ['Mong Pan', 98.36, 20.32, 1], ['Kalaw', 96.56, 20.63, 1], ['Namhkam', 97.68, 23.83, 1], ['Kunlong', 98.65, 23.42, 1], ['Mong Hsu', 98.35, 21.90, 1],
      ['Kyaukme', 97.03, 22.54, 1], ['Tangyan', 98.48, 22.49, 1], ['Kehsi Mansam', 97.72, 21.90, 1]],
    'Karenni': [['Loikaw', 97.21, 19.67, 3], ['Bawlake', 97.34, 19.17, 1], ['Mawchi', 97.17, 18.82, 1], ['Mese', 97.64, 18.63, 1]],
    'Tenasserim': [['Moulmein', 97.63, 16.49, 10], ['Tavoy', 98.20, 14.08, 5], ['Mergui', 98.60, 12.44, 5], ['Amherst', 97.57, 16.08, 1],
      ['Ye', 97.86, 15.25, 1], ['Thaton', 97.37, 16.92, 1], ['Tenasserim', 99.01, 12.09, 1], ['Myawaddy', 98.51, 16.69, 1], ['Kawkareik', 98.24, 16.56, 1],
      ['Pa-an', 97.63, 16.89, 1], ['Papun', 97.44, 18.07, 1], ['Bokpyin', 98.77, 11.26, 1], ['Palaw', 98.64, 12.97, 1], ['Payathonzu', 98.38, 15.30, 1],
      ['Kya-in Seikkyi', 98.13, 16.03, 1], ['Hlaingbwe', 97.83, 17.13, 1]],
    'Pegu': [['Rangoon', 96.16, 16.80, 30], ['Pegu', 96.48, 17.34, 5], ['Toungoo', 96.44, 18.94, 3], ['Bassein', 94.73, 16.78, 3], ['Prome', 95.22, 18.82, 3],
      ['Henzada', 95.46, 17.65, 1], ['Pyapon', 95.68, 16.29, 1], ['Tharrawaddy', 95.79, 17.65, 1]],
    'Upper Burma': [['Mandalay', 96.08, 21.97, 15], ['Maymyo', 96.47, 22.03, 1], ['Meiktila', 95.86, 20.88, 1], ['Pakokku', 95.08, 21.33, 1], ['Yenangyaung', 94.87, 20.46, 3],
      ['Magwe', 94.93, 20.15, 1], ['Myingyan', 95.39, 21.46, 1], ['Shwebo', 95.70, 22.57, 1], ['Pyinmana', 96.20, 19.74, 1], ['Thayetmyo', 95.18, 19.32, 1],
      ['Bhamo', 97.23, 24.25, 1], ['Myitkyina', 97.39, 25.38, 1], ['Katha', 96.33, 24.18, 1], ['Monywa', 95.13, 22.11, 1], ['Kalewa', 94.30, 23.20, 1],
      ['Mogok', 96.50, 22.92, 1], ['Homalin', 94.91, 24.87, 1]],
    'Arakan': [['Akyab', 92.90, 20.15, 3], ['Sandoway', 94.37, 18.46, 1], ['Kyaukpyu', 93.55, 19.43, 1], ['Maungdaw', 92.37, 20.82, 1]],
  },
  FIC: {
    // Laos
    'Luang Prabang': [['Luang Prabang', 102.14, 19.89, 10], ['Muang Sing', 101.15, 21.19, 1], ['Luang Namtha', 101.41, 20.95, 1], ['Houei Sai', 100.42, 20.29, 1],
      ['Pak Beng', 101.13, 19.89, 1], ['Sayaboury', 101.71, 19.25, 1], ['Paklay', 101.41, 18.21, 1], ['Muang Xay', 101.98, 20.69, 1], ['Phong Saly', 102.10, 21.68, 1],
      ['Nong Khiaw', 102.61, 20.57, 1], ['Sam Neua', 104.05, 20.42, 1], ['Hongsa', 101.33, 19.70, 1]],
    'Xieng Khouang': [['Xieng Khouang', 103.36, 19.33, 3], ['Ban Ban', 103.56, 19.63, 1], ['Nong Het', 104.00, 19.50, 1]],
    'Vientiane': [['Vientiane', 102.61, 17.97, 10], ['Vang Vieng', 102.45, 18.92, 1], ['Paksane', 103.66, 18.39, 1], ['Thakhek', 104.83, 17.41, 3], ['Savannakhet', 104.75, 16.56, 3],
      ['Lak Sao', 104.97, 18.18, 1], ['Tchepone', 106.23, 16.69, 1], ['Mahaxay', 105.20, 17.42, 1], ['Muang Phin', 106.02, 16.53, 1]],
    'Champasak': [['Pakse', 105.78, 15.12, 5], ['Bassac', 105.87, 14.89, 3], ['Saravane', 106.42, 15.72, 1], ['Attopeu', 106.83, 14.81, 1], ['Khong', 105.85, 14.12, 1],
      ['Paksong', 106.23, 15.18, 1], ['Khongsedone', 105.80, 15.58, 1]],
    // Cambodia
    'Battambang': [['Battambang', 103.20, 13.10, 10], ['Sisophon', 102.97, 13.59, 3], ['Poipet', 102.56, 13.66, 1], ['Pailin', 102.61, 12.85, 1], ['Pursat', 103.92, 12.54, 3],
      ['Thmar Puok', 103.05, 13.94, 1], ['Moung Russey', 103.45, 12.77, 1]],
    'Siem Reap': [['Siem Reap', 103.86, 13.36, 10], ['Samrong', 103.52, 14.18, 1], ['Anlong Veng', 104.08, 14.23, 1], ['Kralanh', 103.48, 13.59, 1],
      ['Tbeng Meanchey', 104.97, 13.82, 1], ['Choam Khsant', 104.93, 14.22, 1], ['Kompong Thom', 104.89, 12.71, 3]],
    'Cambodia': [['Phnom Penh', 104.92, 11.56, 20], ['Oudong', 104.74, 11.82, 3], ['Kompong Cham', 105.46, 12.00, 3], ['Kompong Chhnang', 104.67, 12.25, 1],
      ['Kampot', 104.18, 10.61, 3], ['Takeo', 104.80, 10.99, 1], ['Svay Rieng', 105.80, 11.09, 1], ['Prey Veng', 105.33, 11.49, 1], ['Kompong Speu', 104.52, 11.45, 1],
      ['Ream', 103.63, 10.51, 1], ['Koh Kong', 102.98, 11.61, 1], ['Sre Ambel', 103.77, 11.12, 1]],
    'Stung Treng': [['Stung Treng', 105.97, 13.52, 3], ['Kratie', 106.02, 12.49, 3], ['Lomphat', 106.98, 13.50, 1], ['Sen Monorom', 107.19, 12.45, 1], ['Veun Sai', 106.80, 13.97, 1]],
    // Vietnam
    'Cochinchina': [['Saigon', 106.70, 10.78, 30], ['My Tho', 106.36, 10.36, 3], ['Can Tho', 105.78, 10.03, 5], ['Ha Tien', 104.49, 10.38, 3], ['Rach Gia', 105.08, 10.01, 3],
      ['Ca Mau', 105.15, 9.18, 1], ['Chau Doc', 105.12, 10.70, 1], ['Long Xuyen', 105.43, 10.38, 1], ['Bac Lieu', 105.72, 9.29, 1], ['Soc Trang', 105.97, 9.60, 1],
      ['Vinh Long', 105.96, 10.25, 1], ['Tay Ninh', 106.10, 11.31, 1], ['Bien Hoa', 106.82, 10.95, 1], ['Cap Saint-Jacques', 107.08, 10.35, 3], ['Tra Vinh', 106.34, 9.93, 1],
      ['Loc Ninh', 106.59, 11.85, 1], ['Phu Quoc', 103.98, 10.22, 1]],
    'Annam': [['Hue', 107.58, 16.46, 15], ['Tourane', 108.22, 16.07, 5], ['Vinh', 105.67, 18.67, 3], ['Thanh Hoa', 105.78, 19.81, 3], ['Dong Hoi', 106.60, 17.48, 1],
      ['Quang Tri', 107.19, 16.75, 1], ['Quang Ngai', 108.80, 15.12, 1], ['Qui Nhon', 109.22, 13.78, 3], ['Nha Trang', 109.19, 12.25, 3], ['Phan Thiet', 108.10, 10.93, 1],
      ['Phan Rang', 108.99, 11.57, 1], ['Dalat', 108.44, 11.94, 3], ['Kontum', 108.00, 14.35, 1], ['Pleiku', 107.98, 13.98, 1], ['Ban Me Thuot', 108.05, 12.67, 1],
      ['Tuy Hoa', 109.30, 13.09, 1], ['Ha Tinh', 105.90, 18.34, 1]],
    'Tonkin': [['Hanoi', 105.85, 21.03, 30], ['Haiphong', 106.68, 20.86, 10], ['Nam Dinh', 106.17, 20.42, 3], ['Lang Son', 106.76, 21.85, 3], ['Cao Bang', 106.26, 22.67, 1],
      ['Lao Kay', 103.97, 22.48, 3], ['Lai Chau', 103.15, 22.07, 1], ['Dien Bien Phu', 103.02, 21.39, 1], ['Son La', 103.91, 21.33, 1], ['Ha Giang', 104.98, 22.82, 1],
      ['Thai Nguyen', 105.84, 21.59, 1], ['Yen Bay', 104.87, 21.72, 1], ['Hon Gay', 107.08, 20.95, 1], ['Mong Cai', 107.97, 21.53, 1], ['Hoa Binh', 105.34, 20.81, 1],
      ['Ninh Binh', 105.97, 20.25, 1], ['Tuyen Quang', 105.21, 21.82, 1]],
  },
  MAL: {
    'Kedah': [['Alor Star', 100.37, 6.12, 5], ['Sungai Petani', 100.49, 5.65, 1], ['Kulim', 100.56, 5.37, 1], ['Baling', 100.92, 5.68, 1], ['Changlun', 100.43, 6.43, 1]],
    'Perlis': [['Kangar', 100.20, 6.44, 3]],
    'Kelantan': [['Kota Bharu', 102.24, 6.13, 5], ['Kuala Krai', 102.20, 5.53, 1], ['Rantau Panjang', 101.98, 5.99, 1], ['Gua Musang', 101.97, 4.88, 1],
      ['Tanah Merah', 102.15, 5.81, 1], ['Jeli', 101.84, 5.70, 1]],
    'Terengganu': [['Kuala Terengganu', 103.14, 5.33, 5], ['Dungun', 103.42, 4.76, 1], ['Kemaman', 103.42, 4.23, 1], ['Besut', 102.56, 5.83, 1], ['Kuala Berang', 103.01, 5.07, 1]],
    'Penang': [['George Town', 100.33, 5.41, 10], ['Bukit Mertajam', 100.47, 5.36, 1]],
    'Perak': [['Ipoh', 101.08, 4.60, 5], ['Taiping', 100.74, 4.85, 3], ['Kuala Kangsar', 100.94, 4.77, 1], ['Grik', 101.13, 5.43, 1], ['Telok Anson', 101.02, 4.02, 1],
      ['Kroh', 101.00, 5.71, 1], ['Tanjong Malim', 101.52, 3.68, 1], ['Lumut', 100.63, 4.23, 1]],
    'Selangor': [['Kuala Lumpur', 101.69, 3.14, 15], ['Port Swettenham', 101.39, 3.00, 3], ['Seremban', 101.94, 2.73, 3], ['Kuala Kubu', 101.65, 3.56, 1], ['Port Dickson', 101.80, 2.52, 1]],
    'Pahang': [['Kuantan', 103.33, 3.81, 3], ['Kuala Lipis', 102.05, 4.18, 3], ['Pekan', 103.39, 3.49, 1], ['Raub', 101.86, 3.79, 1], ['Temerloh', 102.42, 3.45, 1],
      ['Jerantut', 102.37, 3.94, 1], ['Rompin', 103.49, 2.81, 1]],
    'Johore': [['Malacca', 102.25, 2.19, 5], ['Johore Bahru', 103.76, 1.46, 5], ['Muar', 102.57, 2.05, 1], ['Batu Pahat', 102.93, 1.85, 1], ['Kluang', 103.32, 2.03, 1],
      ['Mersing', 103.84, 2.43, 1], ['Segamat', 102.82, 2.51, 1], ['Kota Tinggi', 103.90, 1.73, 1]],
    'Singapore': [['Singapore', 103.85, 1.29, 30]],
    'Sarawak': [['Kuching', 110.35, 1.55, 5], ['Sibu', 111.83, 2.29, 3], ['Simanggang', 111.46, 1.24, 1], ['Bintulu', 113.04, 3.17, 1], ['Mukah', 112.09, 2.90, 1]],
  },
  RAJ: {
    'Andaman Islands': [['Port Blair', 92.73, 11.67, 5], ['Mayabunder', 92.90, 12.92, 1], ['Port Cornwallis', 93.02, 13.28, 1], ['Rangat', 92.93, 12.50, 1], ['Hut Bay', 92.50, 10.68, 1]],
    'Nicobar Islands': [['Nancowry', 93.50, 8.02, 1], ['Great Nicobar', 93.80, 7.10, 1]],
    'Bengal': [['Calcutta', 88.36, 22.57, 30], ['Dacca', 90.41, 23.71, 10], ['Chittagong', 91.83, 22.34, 5], ["Cox's Bazar", 91.98, 21.44, 1], ['Comilla', 91.18, 23.46, 1],
      ['Khulna', 89.56, 22.82, 1], ['Barisal', 90.37, 22.70, 1], ['Mymensingh', 90.40, 24.75, 1], ['Rajshahi', 88.60, 24.37, 1], ['Rangpur', 89.25, 25.75, 1]],
    'Assam': [['Shillong', 91.88, 25.57, 3], ['Sylhet', 91.87, 24.90, 1], ['Silchar', 92.80, 24.82, 1], ['Imphal', 93.94, 24.82, 3], ['Kohima', 94.11, 25.67, 1],
      ['Aijal', 92.72, 23.73, 1], ['Agartala', 91.28, 23.83, 1]],
  },
  DEI: {
    'Atjeh': [['Kutaradja', 95.32, 5.55, 3], ['Sigli', 95.96, 5.38, 1], ['Lhokseumawe', 97.14, 5.18, 1], ['Meulaboh', 96.13, 4.14, 1], ['Langsa', 97.97, 4.47, 1]],
    'East Coast of Sumatra': [['Medan', 98.67, 3.59, 10], ['Pematang Siantar', 99.07, 2.96, 1], ['Tanjung Balai', 99.80, 2.97, 1], ['Sibolga', 98.78, 1.74, 1],
      ['Padang Sidempuan', 99.27, 1.38, 1], ['Bagan Siapiapi', 100.81, 2.16, 1], ['Pekanbaru', 101.45, 0.53, 1], ['Dumai', 101.45, 1.67, 1]],
    'Riouw': [['Tanjung Pinang', 104.45, 0.92, 1]],
    'West Borneo': [['Pontianak', 109.33, -0.03, 5], ['Singkawang', 108.98, 0.91, 1], ['Sambas', 109.30, 1.36, 1], ['Sintang', 111.50, 0.07, 1], ['Sanggau', 110.59, 0.12, 1]],
  },
  CHI: {
    'Yunnan': [['Kunming', 102.71, 25.04, 10], ['Tali', 100.23, 25.59, 1], ['Szemao', 100.97, 22.79, 1], ['Mengtsz', 103.39, 23.37, 1], ['Cheli', 100.80, 22.01, 1], ['Tengyueh', 98.49, 25.02, 1]],
    'Kwangsi': [['Nanning', 108.32, 22.82, 5], ['Liuchow', 109.41, 24.33, 1], ['Wuchow', 111.28, 23.48, 1], ['Pakhoi', 109.12, 21.48, 1], ['Lungchow', 106.85, 22.34, 1], ['Kweilin', 110.29, 25.27, 1]],
    'Kwangtung': [['Canton', 113.26, 23.13, 20], ['Fort-Bayard', 110.39, 21.20, 1], ['Hoihow', 110.35, 20.04, 3], ['Yulin', 109.51, 18.25, 1]],
  },
};

// ---- Fronts. `subs` = modern-country polygons that make up the enemy objective zone; `box` trims them. ----
// the stretches of the home coast that face each sea
const GULF_COAST = [[102.9, 11.7], [102.5, 12.1], [102.0, 12.5], [101.4, 12.6], [100.95, 12.6], [100.5, 12.45],
  [100.0, 12.5], [99.95, 12.3], [99.8, 11.8], [99.55, 11.1], [99.25, 10.5], [99.2, 9.9]];
const ANDAMAN_COAST = [[98.6, 10.0], [98.45, 9.3], [98.25, 8.7], [98.3, 7.9], [98.7, 8.1], [98.95, 7.9], [99.3, 7.3], [99.7, 6.9], [100.05, 6.5]];
export const FRONTS = [
  // British Burma north of the Thaungyin: the Shan States east of the Salween (Kengtung) and Karenni.
  { id: 'shn', name: 'Shan Front', enemy: 'BUR', enemyName: 'British Burma', subs: ['Myanmar'], box: [96.65, 18.45, 101.6, 24.05], defaultLabel: 'School',
    satrapy: 'Kengtung & the Shan States', hq: 'Chiang Mai' },
  // British Burma south of it: the Tenasserim Division (Salween, Thaton, Amherst, Tavoy and Mergui districts).
  { id: 'ten', name: 'Tenasserim Front', enemy: 'BUR', enemyName: 'British Burma', subs: ['Myanmar'], box: [96.85, 9.4, 99.7, 18.45], defaultLabel: 'Family',
    satrapy: 'Tenasserim, Tavoy & Mergui', hq: 'Ratchaburi' },
  { id: 'lao', name: 'Mekong Front', enemy: 'FIC', enemyName: 'French Indochina', subs: ['Laos'], defaultLabel: 'Partner',
    satrapy: 'Lan Xang: Luang Prabang, Vientiane & Champasak', hq: 'Udon Thani' },
  { id: 'cam', name: 'Cambodian Front', enemy: 'FIC', enemyName: 'French Indochina', subs: ['Cambodia'], defaultLabel: 'Work',
    satrapy: 'Battambang, Siem Reap & the Khmer kingdom', hq: 'Prachinburi' },
  // the peninsula only: the box keeps Sarawak out
  { id: 'mal', name: 'Malayan Front', enemy: 'MAL', enemyName: 'British Malaya', subs: ['Malaysia', 'Singapore'], box: [99, 0.5, 105, 7.2], defaultLabel: 'Health',
    satrapy: 'Kedah, Perlis, Kelantan, Terengganu & the Malay States', hq: 'Hat Yai' },
  // Cochinchina: the old Khmer–Siamese–Vietnamese battleground of Ha Tien and the delta (wars of 1833–34 and 1841–45)
  { id: 'gos', name: 'Gulf of Siam Theatre', enemy: 'FIC', enemyName: 'French Navy', naval: true, coast: GULF_COAST, coastKm: 55,
    subs: ['Vietnam'], box: [103.5, 8.3, 107.7, 11.95], defaultLabel: 'Friends', satrapy: 'Ha Tien & the Mekong Delta', hq: 'Sattahip' },
  { id: 'and', name: 'Andaman Sea Theatre', enemy: 'RAJ', enemyName: 'Royal Navy', naval: true, coast: ANDAMAN_COAST, coastKm: 55,
    subs: ['India'], box: [91.8, 6.2, 94.6, 14.2], defaultLabel: 'Self', satrapy: 'the Andaman & Nicobar Islands', hq: 'Phuket' },
];

// ---- Terrain. ranges: polyline + half-width in degrees ----
export const RANGES = [
  { name: 'Tenasserim Hills', w: 0.45, pts: [[98.5, 15.6], [98.9, 14.6], [99.1, 13.5], [99.3, 12.5], [99.2, 11.5], [98.8, 10.5]] },
  { name: 'Dawna Range', w: 0.4, pts: [[97.9, 18.0], [98.3, 17.2], [98.6, 16.3], [98.5, 15.6]] },
  { name: 'Thanon Thong Chai', w: 0.5, pts: [[98.2, 19.6], [98.2, 18.8], [98.3, 18.0], [98.6, 17.2]] },
  { name: 'Daen Lao', w: 0.4, pts: [[97.9, 19.8], [98.8, 20.0], [99.6, 20.3]] },
  { name: 'Khun Tan', w: 0.3, pts: [[99.3, 19.6], [99.3, 18.8], [99.2, 18.0]] },
  { name: 'Phi Pan Nam', w: 0.35, pts: [[99.7, 19.5], [100.0, 18.6], [100.35, 17.9]] },
  { name: 'Luang Prabang Range', w: 0.45, pts: [[100.6, 19.6], [101.1, 19.0], [101.2, 18.2], [101.0, 17.6]] },
  { name: 'Phetchabun', w: 0.4, pts: [[101.6, 17.6], [101.5, 16.8], [101.5, 16.0], [101.45, 15.2]] },
  { name: 'Dong Phaya Yen', w: 0.3, pts: [[101.45, 15.2], [101.5, 14.6], [101.9, 14.3]] },
  { name: 'Sankamphaeng', w: 0.3, pts: [[101.9, 14.3], [102.5, 14.2]] },
  { name: 'Dângrêk', w: 0.25, pts: [[102.9, 14.3], [103.8, 14.35], [104.8, 14.4], [105.4, 14.4]] },
  { name: 'Phu Phan', w: 0.3, pts: [[103.2, 17.1], [103.9, 16.9], [104.5, 16.6]] },
  { name: 'Chanthaburi Range', w: 0.3, pts: [[101.8, 13.1], [102.3, 12.9]] },
  { name: 'Cardamom', w: 0.45, pts: [[102.6, 12.5], [103.0, 12.0], [103.7, 11.5]] },
  { name: 'Phuket Range', w: 0.3, pts: [[98.8, 10.4], [98.6, 9.5], [98.5, 8.6]] },
  { name: 'Nakhon Si Thammarat Range', w: 0.3, pts: [[99.6, 9.2], [99.75, 8.4], [99.9, 7.6], [100.15, 6.9]] },
  { name: 'Sankalakhiri', w: 0.3, pts: [[100.6, 6.4], [101.1, 5.9]] },
  { name: 'Main Range', w: 0.5, pts: [[101.1, 5.9], [101.3, 5.2], [101.6, 4.2], [101.9, 3.3], [102.2, 2.6]] },
  { name: 'Annamite Chain', w: 0.7, pts: [[103.8, 19.6], [104.9, 18.4], [105.8, 17.5], [106.8, 16.5], [107.6, 15.6], [108.0, 14.4], [108.3, 13.0], [108.3, 12.0]] },
  { name: 'Shan Hills', w: 1.2, pts: [[97.5, 23.5], [98.2, 22.0], [98.5, 20.8]] },
  { name: 'Arakan Yoma', w: 0.6, pts: [[94.6, 25.6], [93.8, 24.0], [93.6, 22.5], [94.2, 20.5], [94.6, 18.6], [94.7, 17.2]] },
  { name: 'Pegu Yoma', w: 0.3, pts: [[96.0, 20.3], [96.0, 19.0], [96.0, 17.8]] },
  { name: 'Uplands of Laos', w: 1.0, pts: [[101.5, 21.3], [102.5, 20.4], [103.5, 20.0]] },
  { name: 'Hoang Lien Son', w: 0.5, pts: [[103.2, 22.6], [104.0, 22.0], [104.8, 21.2]] },
  { name: 'Yunnan Plateau', w: 1.5, pts: [[98.6, 25.6], [101.0, 24.5], [103.0, 24.2], [105.5, 24.6]] },
  { name: 'Barisan', w: 0.6, pts: [[95.5, 5.4], [96.8, 4.5], [98.2, 3.0], [99.2, 1.6], [100.3, 0.2], [100.9, -0.5]] },
  { name: 'Kapuas Hulu', w: 0.5, pts: [[110.0, 1.2], [111.5, 1.0], [113.0, 1.6], [113.5, 2.5]] },
];
export const DESERTS = [];
export const FORESTS = [ // [lon, lat, rx, ry] — the teak and evergreen forests that still covered most of the hills
  [99.0, 15.4, 0.5, 0.8], [99.4, 17.6, 0.5, 0.45], [100.6, 18.35, 0.4, 0.5], [102.1, 13.25, 0.5, 0.35], [101.9, 16.9, 0.4, 0.5], [99.0, 9.2, 0.3, 0.5],
  [101.4, 6.05, 0.5, 0.3], [105.5, 13.6, 1.2, 0.6], [106.6, 15.3, 0.8, 0.8], [102.6, 4.6, 0.8, 1.0], [100.6, 1.4, 1.0, 0.7], [111.5, 0.4, 1.8, 0.7],
  [96.6, 25.0, 1.0, 0.8], [98.4, 12.8, 0.3, 1.2], [104.6, 16.0, 0.4, 0.3],
];
export const MARSHES = [[105.6, 9.6, 0.8, 0.6], [105.7, 10.8, 0.5, 0.25], [95.3, 16.2, 0.9, 0.5], [89.4, 21.95, 0.9, 0.4], [104.2, 12.95, 0.5, 0.25], [101.9, 1.1, 0.9, 0.6],
  [100.25, 7.75, 0.2, 0.3]];

export const LAKES = [
  { name: 'Tonlé Sap', pts: [[103.62, 13.28], [103.85, 13.22], [104.1, 13.0], [104.3, 12.8], [104.5, 12.55], [104.45, 12.42], [104.25, 12.5], [104.0, 12.75], [103.8, 12.95], [103.6, 13.12]] },
  { name: 'Songkhla Lake', pts: [[100.2, 7.75], [100.33, 7.7], [100.42, 7.45], [100.55, 7.25], [100.5, 7.15], [100.38, 7.2], [100.28, 7.45], [100.15, 7.6]] },
  { name: 'Inle Lake', pts: [[96.88, 20.65], [96.95, 20.6], [96.95, 20.42], [96.88, 20.45]] },
  { name: 'Lake Toba', pts: [[98.55, 2.9], [98.75, 2.85], [98.95, 2.6], [99.1, 2.4], [98.95, 2.35], [98.75, 2.55], [98.6, 2.7]] },
  { name: 'Erhai', pts: [[100.1, 25.95], [100.2, 25.9], [100.28, 25.65], [100.2, 25.6]] },
];
export const RIVERS = [
  { name: 'Chao Phraya', pts: [[100.13, 15.70], [100.15, 15.4], [100.18, 15.15], [100.33, 14.95], [100.45, 14.6], [100.55, 14.35], [100.52, 14.0], [100.50, 13.75], [100.55, 13.65], [100.59, 13.54]] },
  { name: 'Ping', pts: [[98.95, 19.6], [98.97, 19.1], [99.0, 18.79], [98.95, 18.4], [98.7, 18.1], [98.9, 17.5], [99.12, 16.88], [99.5, 16.48], [99.85, 16.0], [100.13, 15.70]] },
  { name: 'Yom', pts: [[100.3, 19.2], [100.2, 18.6], [100.14, 18.14], [99.8, 17.6], [99.83, 17.3], [99.82, 17.0], [100.1, 16.6], [100.2, 16.1], [100.25, 15.85]] },
  { name: 'Nan', pts: [[101.05, 19.4], [100.78, 18.78], [100.6, 18.2], [100.5, 17.75], [100.1, 17.63], [100.26, 16.82], [100.35, 16.44], [100.3, 15.9], [100.13, 15.70]] },
  { name: 'Pa Sak', pts: [[101.3, 17.1], [101.2, 16.4], [101.1, 15.6], [101.0, 15.0], [100.95, 14.55], [100.58, 14.35]] },
  { name: 'Mae Klong', pts: [[98.85, 15.6], [99.05, 14.9], [99.2, 14.4], [99.53, 14.02], [99.75, 13.75], [99.82, 13.54], [100.0, 13.38]] },
  { name: 'Tapi', pts: [[99.5, 8.3], [99.3, 8.6], [99.2, 8.9], [99.3, 9.1], [99.35, 9.2]] },
  { name: 'Mun', pts: [[101.9, 14.5], [102.2, 15.0], [102.5, 15.25], [103.1, 15.3], [103.7, 15.3], [104.3, 15.3], [104.86, 15.22], [105.2, 15.25], [105.47, 15.32]] },
  { name: 'Chi', pts: [[101.6, 16.0], [102.0, 15.85], [102.4, 16.3], [102.85, 16.4], [103.3, 16.2], [103.65, 16.0], [104.1, 15.75], [104.4, 15.4], [104.65, 15.2]] },
  { name: 'Lancang', pts: [[99.2, 25.6], [99.9, 24.2], [100.4, 22.8], [100.9, 22.0], [101.15, 21.55], [100.6, 20.85], [100.08, 20.35]] },
  { name: 'Mekong', pts: [[100.08, 20.35], [100.41, 20.3], [101.13, 19.87], [102.14, 19.89], [101.75, 19.0], [101.4, 18.2], [101.67, 17.93], [102.6, 17.93], [103.1, 18.07], [103.65, 18.4], [104.1, 18.2], [104.8, 17.4]] },
  { name: 'Lower Mekong', pts: [[104.8, 17.4], [104.75, 16.55], [105.2, 16.07], [105.6, 15.7], [105.5, 15.32], [105.8, 15.12], [105.88, 14.9], [105.85, 14.1], [105.95, 13.52], [106.02, 12.49], [105.46, 12.0], [104.95, 11.56]] },
  { name: 'Mekong Delta', pts: [[104.95, 11.56], [105.25, 11.0], [105.65, 10.5], [106.36, 10.33], [106.75, 10.2]] },
  { name: 'Tonlé Sap River', pts: [[104.48, 12.5], [104.7, 12.2], [104.82, 11.9], [104.93, 11.57]] },
  { name: 'Salween', pts: [[98.85, 25.9], [98.9, 24.8], [98.7, 23.9], [98.65, 23.4], [98.5, 22.4], [98.4, 21.3], [98.45, 20.5], [97.75, 19.8], [97.5, 19.0], [97.7, 18.3], [97.72, 17.85], [97.6, 17.2], [97.63, 16.89], [97.6, 16.5]] },
  { name: 'Irrawaddy', pts: [[97.4, 25.4], [97.2, 24.25], [96.33, 24.18], [96.0, 23.0], [96.05, 21.97], [95.4, 21.6], [95.08, 21.33], [94.85, 20.45], [95.2, 18.82], [95.45, 17.65], [95.3, 16.6], [95.1, 15.8]] },
  { name: 'Red River', pts: [[102.6, 23.8], [103.97, 22.5], [104.9, 21.7], [105.4, 21.3], [105.85, 21.03], [106.3, 20.5], [106.55, 20.25]] },
];

// ---- Railways. stage 0 = the State Railway of Siam as it stood in 1936; later stages follow what was built (or planned) afterwards ----
export const RAILWAYS = [
  { name: 'Northern Line', stage: 0, via: ['Bangkok', 'Don Mueang', 'Ayutthaya', [100.72, 14.45], 'Lopburi', [100.34, 15.26], 'Nakhon Sawan', 'Phichit', 'Phitsanulok', 'Uttaradit', 'Den Chai',
    [99.75, 18.2], 'Lampang', [99.23, 18.47], 'Lamphun', 'Chiang Mai'] },
  { name: 'Sawankhalok Branch', stage: 0, via: [[100.12, 17.38], 'Sawankhalok'] },
  { name: 'North-eastern Line', stage: 0, via: [[100.72, 14.45], 'Saraburi', 'Pak Chong', 'Sikhio', 'Nakhon Ratchasima', 'Buriram', 'Surin', 'Sisaket', 'Ubon Ratchathani'] },
  { name: 'Khon Kaen Line', stage: 0, via: ['Nakhon Ratchasima', [102.25, 15.25], 'Bua Yai', 'Ban Phai', 'Khon Kaen'] },
  { name: 'Eastern Line', stage: 0, via: ['Bangkok', 'Chachoengsao', 'Prachinburi', 'Kabin Buri', 'Sa Kaeo', 'Aranyaprathet'] },
  { name: 'Paknam Railway', stage: 0, via: ['Bangkok', 'Paknam'] },
  { name: 'Southern Line', stage: 0, via: ['Bangkok', 'Nakhon Pathom', 'Ban Pong', 'Ratchaburi', 'Phetchaburi', 'Hua Hin', 'Pran Buri', 'Prachuap Khiri Khan', 'Bang Saphan', 'Chumphon',
    'Lang Suan', 'Chaiya', [99.18, 9.11], 'Ban Na San', 'Thung Song', 'Cha-uat', 'Phatthalung', 'Hat Yai', 'Padang Besar'] },
  { name: 'Sungai Kolok Line', stage: 0, via: ['Hat Yai', 'Thepha', [101.1, 6.73], 'Yala', 'Rueso', [101.75, 6.25], 'Sungai Kolok'] },
  { name: 'Kantang Branch', stage: 0, via: ['Thung Song', 'Huai Yot', 'Trang', 'Kantang'] },
  { name: 'Nakhon Si Thammarat Branch', stage: 0, via: [[99.78, 8.1], 'Nakhon Si Thammarat'] },
  { name: 'Songkhla Branch', stage: 0, via: ['Hat Yai', 'Songkhla'] },
  { name: 'Udon Extension', stage: 1, via: ['Khon Kaen', 'Kumphawapi', 'Udon Thani'] },                                   // opened 1941
  { name: 'Three Pagodas Line', stage: 2, via: ['Ban Pong', 'Kanchanaburi', [99.1, 14.25], 'Thong Pha Phum', 'Sangkhla Buri'] },   // 1943
  { name: 'Kra Isthmus Line', stage: 2, via: ['Chumphon', 'Kra Buri'] },                                                  // 1943
  { name: 'Nong Khai Extension', stage: 2, via: ['Udon Thani', 'Nong Khai'] },                                            // 1955–58
  { name: 'Khiri Rat Branch', stage: 3, via: ['Surat Thani', [99.18, 9.11], 'Khiri Rat Nikhom'] },          // 1956
  { name: 'Lam Narai Cut-off', stage: 3, via: ['Saraburi', 'Chai Badan', 'Chatturat', 'Bua Yai'] },                       // 1967
  { name: 'Eastern Seaboard Line', stage: 4, via: ['Chachoengsao', 'Chonburi', 'Si Racha', 'Sattahip'] },                 // 1989
  { name: 'Chiang Rai Line', stage: 4, via: ['Den Chai', 'Phrae', 'Ngao', 'Phayao', 'Chiang Rai'] },                      // long planned
];

export const SEA_LABELS = [
  ['GULF OF SIAM', 101.7, 10.2, 1.1], ['ANDAMAN SEA', 95.8, 10.6, 1.2], ['BAY OF BENGAL', 90.4, 16.6, 1.3], ['SOUTH CHINA SEA', 110.3, 8.6, 1.3],
  ['GULF OF TONKIN', 107.7, 19.5, 0.8], ['Strait of Malacca', 99.7, 4.2, 0.6, 42], ['Gulf of Martaban', 96.5, 15.6, 0.55], ['Bight of Bangkok', 100.45, 13.0, 0.45],
];
export const COUNTRY_LABELS = [['BUR', 'BRITISH BURMA', 95.6, 22.4, 13], ['FIC', 'FRENCH INDOCHINA', 106.6, 14.2, 13], ['MAL', 'BRITISH MALAYA', 102.4, 4.3, 10],
  ['DEI', 'DUTCH EAST INDIES', 99.6, 1.9, 9], ['CHI', 'CHINA', 107.0, 24.2, 17], ['RAJ', 'BRITISH INDIA', 90.3, 24.2, 13]];
export const HOME_LABEL = [101.5, 15.9];

// Greater Siam: Rama III's tributary sphere plus the Tenasserim and Kengtung claims (see the note at the top). Sea stretches run offshore.
export const EMPIRE = [[97.3, 18.4], [97.5, 19.4], [98.2, 20.4], [98.6, 21.5], [99.3, 22.1], [100.2, 21.9], [101.1, 21.7], [101.8, 22.4], [102.6, 22.5], [103.5, 21.9],
  [104.7, 20.9], [105.0, 19.8], [104.5, 19.0], [105.1, 18.4], [105.9, 17.5], [106.8, 16.6], [107.4, 15.9], [107.6, 14.8], [107.5, 13.6], [107.4, 12.4], [106.5, 11.7],
  [106.0, 10.9], [105.1, 10.8], [104.5, 10.3], [103.7, 9.6], [103.4, 7.6], [103.8, 5.6], [103.7, 4.1], [102.8, 4.3], [101.9, 4.6], [101.3, 5.3], [100.8, 5.1],
  [100.1, 5.1], [99.6, 6.2], [98.6, 7.0], [97.9, 7.8], [97.7, 9.8], [97.5, 11.6], [97.5, 13.6], [97.2, 15.0], [97.2, 16.3], [97.1, 17.3]];

// where fleet counters sit: our fleets by id, and "enemy:<front id>" for the enemy squadron on a naval front
export const FLEET_AT = { gulf: [100.75, 12.0], andaman: [97.6, 8.5], 'enemy:gos': [103.4, 8.9], 'enemy:and': [94.9, 11.3] };

export const META = {
  name: 'Siam',
  long: 'Kingdom of Siam',
  empire: 'Greater Siam',
  year: 1936,
  blurb: 'Seven fronts from the Shan hills to the Malay sultanates. Restore the tributary realm of the early Chakri kings.',
  pitch: 'a 1936 grand-strategy war map of Siam',
  // the Trairanga (1917) has five stripes, red-white-blue-white-red; three bands can only suggest it
  flag: { type: 'h3', colors: ['#a51931', '#2d2a4a', '#a51931'] },
  regionWord: 'Monthon',
  // 1936 region → the name it bore in the Bangkok chronicles
  regions: {
    'Kengtung': 'Chiang Tung', 'Shan States': 'Ngiao', 'Karenni': 'Yang Daeng', 'Tenasserim': 'Tanaosi', 'Pegu': 'Hongsawadi', 'Upper Burma': 'Angwa', 'Arakan': 'Yakhai',
    'Luang Prabang': 'Luang Phrabang', 'Xieng Khouang': 'Muang Phuan', 'Vientiane': 'Wiang Chan', 'Champasak': 'Nakhon Champasak',
    'Battambang': 'Phra Tabong', 'Siem Reap': 'Siemmarat', 'Cambodia': 'Kamphucha', 'Stung Treng': 'Chiang Taeng', 'Cochinchina': 'Banthaimat & Saigon',
    'Kedah': 'Saiburi', 'Perlis': 'Palit', 'Kelantan': 'Kalantan', 'Terengganu': 'Trangkanu', 'Penang': 'Ko Mak', 'Perak': 'Perak', 'Singapore': 'Singkhapo',
    'Andaman Islands': 'Andaman', 'Nicobar Islands': 'Nakkhawari',
  },
  capitalFalls: 'The government withdraws up the Chao Phraya to Phitsanulok. The war goes on.',
  capitalFreed: 'Bangkok is free again. The tricolour flies over the Grand Palace.',
  fightsOnFrom: 'Phitsanulok',
  honor: {
    shn: ['Phayap', 'Chiang Mai', 'Lampang', 'Chiang Rai', 'Mae Hong Son', 'Lamphun', 'Phrae', 'Nan', 'Doi Suthep', 'Lan Na'],
    ten: ['Ratchaburi', 'Kanchanaburi', 'Phetchaburi', 'Tak', 'Three Pagodas', 'Mae Klong', 'Prachuap', 'Khwae', 'Suphan Buri', 'Nakhon Chaisi'],
    lao: ['Udon', 'Nong Khai', 'Nakhon Phanom', 'Sakon Nakhon', 'Loei', 'Khon Kaen', 'Isan', 'Phu Phan', 'Mukdahan', 'Kalasin'],
    cam: ['Burapha', 'Prachinburi', 'Korat', 'Ubon', 'Surin', 'Buriram', 'Aranyaprathet', 'Sisaket', 'Chanthaburi', 'Phanom Rung'],
    mal: ['Pattani', 'Songkhla', 'Yala', 'Narathiwat', 'Ligor', 'Hat Yai', 'Phatthalung', 'Nakhon Si Thammarat', 'Satun', 'Trang'],
    gos: ['Chonburi', 'Sattahip', 'Rayong', 'Trat', 'Paknam', 'Chumphon', 'Bang Pakong', 'Si Racha', 'Hua Hin', 'Chao Phraya'],
    and: ['Phuket', 'Ranong', 'Krabi', 'Phang Nga', 'Thalang', 'Takua Pa', 'Kantang', 'Kra', 'Surat', 'Chaiya'],
  },
  commanders: {
    shn: 'Gen. Charoen Rattanawong', ten: 'Gen. Sanit Phromsuwan', lao: 'Gen. Thawin Saengthong', cam: 'Gen. Chalerm Intharaprasit',
    mal: 'Gen. Bunchu Phetcharat', gos: 'Adm. Sawat Nakprasit', and: 'Adm. Kamon Ruangsri',
  },
  oob: {
    shn: ['mtn', 'inf', 'inf', 'art'], ten: ['mtn', 'inf', 'cav'], lao: ['inf', 'inf', 'cav', 'art'], cam: ['inf', 'inf', 'mot', 'art'],
    mal: ['inf', 'inf', 'art'], gos: ['mar', 'inf', 'art'], and: ['mar', 'inf', 'mtn'],
  },
  guard: [['grd', '1st Division, King’s Guard “Mahat Lek”'], ['arm', 'Royal Guard Tank Battalion']],
  // after the 1932 revolution the army promoted no generals for some years: colonels commanded its largest formations
  officerNames: {
    first: ['Charoen', 'Sanit', 'Chalerm', 'Sawat', 'Thawin', 'Bunchu', 'Prasert', 'Somboon', 'Wichit', 'Thongdi', 'Chamnan', 'Sanguan', 'Kamon', 'Udom', 'Mongkol', 'Prayun'],
    last: ['Rattanawong', 'Sukkasem', 'Phromsuwan', 'Intharaprasit', 'Srisawat', 'Bunyarat', 'Kanchanawat', 'Phetcharat', 'Chanthawong', 'Kaewmani', 'Saengthong',
      'Ruangsri', 'Thepsuwan', 'Nakprasit', 'Chaisiri', 'Yotsombat'],
    ranks: { div: 'Col.', bde: 'Lt. Col.', guard: 'Col.' },
  },
  wings: [
    { name: '1st Wing', type: 'fighter', model: 'Curtiss Hawk III', base: 'Don Mueang', planes: 24 },
    { name: '2nd Wing', type: 'cas', model: 'Vought V-93S Corsair', base: 'Lopburi', planes: 24 },
    { name: '3rd Wing', type: 'fighter', model: 'Boeing 100E', base: 'Nakhon Ratchasima', planes: 12 },
    { name: '5th Wing', type: 'bomber', model: 'Boripatra', base: 'Prachuap Khiri Khan', planes: 9 },
  ],
  newWingModels: { fighter: 'Curtiss Hawk 75N', cas: 'Mitsubishi Ki-30 Nagoya', bomber: 'Martin 139W' },
  fleets: [
    { id: 'gulf', name: 'Gulf Squadron', base: 'Sattahip', sea: 'Gulf of Siam', fronts: ['gos', 'cam', 'mal'],
      ships: [['Ratanakosindra', 'Coastal defence gunboat'], ['Sukhothai', 'Coastal defence gunboat'], ['Phra Ruang', 'Destroyer'], ['Trad', 'Torpedo boat'],
        ['Puket', 'Torpedo boat'], ['Chao Phraya', 'Sloop'], ['Bangrachan', 'Minelayer'], ['Nhong Sarhai', 'Minelayer']] },
    { id: 'andaman', name: 'Andaman Flotilla', base: 'Phuket', sea: 'Andaman Sea', fronts: ['and', 'ten'],
      ships: [['Suriya Monthon', 'Gunboat'], ['Sua Khamronsin', 'Torpedo-boat destroyer'], ['Sua Thayanchon', 'Torpedo-boat destroyer'], ['Klongyai', 'Coastal torpedo boat']] },
  ],
  shipNames: ['Sri Ayudhya', 'Dhonburi', 'Tachin', 'Maeklong', 'Matchanu', 'Wirun', 'Sinsamut', 'Phlai Chumphon', 'Pattani', 'Surasdra', 'Chandaburi', 'Rayong',
    'Chumporn', 'Chonburi', 'Songkhla', 'Kantang', 'Takbai', 'Sarasin', 'Thiew Uthok', 'Trawane Vari', 'Sichang', 'Pangan', 'Chang', 'Samui'],
  operations: ['Naresuan', 'Nong Sarai', 'Hanuman', 'Phra Ram', 'Erawan', 'Khrut', 'Bang Rachan', 'Ramkhamhaeng', 'White Elephant', 'Suriyothai', 'Phra Ruang',
    'Phra Lak', 'Emerald Buddha', 'Chakri', 'Nine Gems', 'Sukhothai Dawn'],
  enemyOperations: ['Thotsakan', 'Kumphakan', 'Inthorachit', 'Longka', 'Maiyarap', 'Hongsawadi', 'Monsoon', 'Ironwood', 'Typhoon', 'Banyan', 'Cobra', 'Tidewater'],
  nicknames: ['Tigers', 'Elephants', 'Cobras', 'Garudas', 'Nagas', 'Lions', 'Hawks', 'Buffaloes'],
  // [infrastructure 0–5, civilian factories, military factories, dockyards]
  stateStart: {
    'Krung Thep': [4, 4, 2, 1], 'Ayutthaya': [3, 1, 1, 0], 'Nakhon Sawan': [2, 1, 0, 0], 'Phitsanulok': [2, 1, 0, 0], 'Phayap': [2, 1, 0, 0], 'Udon': [1, 0, 0, 0],
    'Ubon': [1, 1, 0, 0], 'Nakhon Ratchasima': [2, 1, 1, 0], 'Prachinburi': [2, 1, 0, 1], 'Ratchaburi': [2, 1, 0, 0], 'Chumphon': [2, 0, 0, 0], 'Phuket': [1, 1, 0, 0],
    'Nakhon Si Thammarat': [2, 1, 0, 0], 'Pattani': [1, 0, 0, 0],
  },
  weather: { ten: 'heat', lao: 'heat', cam: 'heat', mal: 'heat', gos: 'heat', and: 'heat' },   // the Shan plateau is spared the worst of it
  enemyAdjectives: { BUR: 'Burma', FIC: 'French Colonial', MAL: 'Malayan', RAJ: 'British Indian', DEI: 'Dutch Colonial', CHI: 'Chinese' },
  ranks: [['Phon Thahan', 'Private'], ['Sip Tri', 'Lance Corporal'], ['Sip Ek', 'Sergeant'], ['Cha Sip Ek', 'Sergeant Major'], ['Roi Tri', 'Second Lieutenant'],
    ['Roi Ek', 'Captain'], ['Phan Tri', 'Major'], ['Phan Ek', 'Colonel'], ['Phon Tri', 'Major General'], ['Phon Tho', 'Lieutenant General'], ['Phon Ek', 'General'],
    ['Chom Phon', 'Field Marshal']],
  landmarks: [
    { city: 'Siem Reap', medal: 'Towers of Angkor', desc: 'Enter Siem Reap, beneath the towers of Angkor' },
    { city: 'Luang Prabang', medal: 'Guardian of the Phra Bang', desc: 'Reach Luang Prabang, the royal city on the upper Mekong' },
  ],
  medalNames: {
    ten: 'Order of the Crown of Siam', fifty: 'Order of the White Elephant', decisive: 'Order of Rama', week: 'Chakra Mala Medal', month: 'Order of Chula Chom Klao',
    abroad: 'Across the Frontier', phoenix: 'Hong', defender: 'Defender of Bangkok', satrap: 'Chao Mueang', comeback: 'Broken Rice Pots', empire: 'Chakkraphat',
    haftkhan: 'Seven Banners', qanat: 'Khlong Digger', hundred: 'Ramakien', hundreddays: 'Order of the Nine Gems', year: 'Order of the Royal House of Chakri',
    operation: 'Thong Chai Chaloemphon', elite: 'Thahan Suea', kaveh: 'Dap Hak, the Broken Sword', rasti: 'Satcha',
  },
  masthead: 'KHAO THAP SAYAM',
  calendar: 'buddhist',
  days: [
    { month: 4, day: 6, text: 'Chakri Day. The dynasty and the city are of one age; hold every front.' },
    { month: 4, day: 13, text: 'Sawatdi Pi Mai. Songkran: water for the elders, a new year on every front.' },
    { month: 10, day: 23, text: 'Chulalongkorn Day. Remember the king who kept the kingdom whole.' },
    { month: 12, day: 10, text: 'Constitution Day. The charter of 1932 is four years old.' },
  ],
  motto: 'Nai nam mi pla, nai na mi khao — “There are fish in the water and rice in the fields.”',
};
