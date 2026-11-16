// Mexico, 1936. The United Mexican States under the Constitution of 1917; the formable is the First Mexican Empire
// of 1821–23 at its greatest extent: from Alta California, Nuevo México and Tejas to the province of Costa Rica.
// Coordinates are [lon, lat]. City tuple: [name, lon, lat, vp?, flags?]
// flags: P port, N naval base, A airbase, S supply hub, R refinery/oil/heavy industry, F fort, C capital
//
// Approximations against the real borders (see also the notes beside FRONTS):
//  - Mexico's 1936 border is the modern one. The Chamizal tract at El Paso (settled 1963) is far below map scale.
//  - The United States is one modern polygon cut into four objective zones with rectangles. A rectangle cannot follow
//    the Adams–Onís line of 1819 (Sabine, Red River, 100th meridian, Arkansas River, 42nd parallel), so the zones follow
//    it only roughly; the dashed empire outline shows the true line.
//  - British Honduras is modern Belize. The Panama Canal Zone lies east of the map edge.
//  - Natural Earth draws the Great Lakes as land; they are added back as LAKES.

export const ID = 'mexico';
export const HOME = 'MEX';
export const CAPITAL = 'Mexico City';
export const EXTENT = { lon0: -125.5, lon1: -80.5, lat0: 7.4, lat1: 43.2 };

// 1936 political entities built from modern polygons
export const COUNTRIES = {
  MEX: { name: 'Mexico', long: 'United Mexican States', color: '#3f8f6a', from: ['Mexico'], spacing: 0.9 },
  USA: { name: 'United States', long: 'United States of America', color: '#5d7fa8', from: ['United States of America'], spacing: 1.4 },
  GUA: { name: 'Guatemala', long: 'Republic of Guatemala', color: '#5d93a6', from: ['Guatemala'], spacing: 0.7 },
  GBR: { name: 'British Honduras', long: 'Crown Colony of British Honduras', color: '#b0586a', from: ['Belize'], spacing: 0.5 },
  ELS: { name: 'El Salvador', long: 'Republic of El Salvador', color: '#8c7ab0', from: ['El Salvador'], spacing: 0.6 },
  HON: { name: 'Honduras', long: 'Republic of Honduras', color: '#b89a5e', from: ['Honduras'], spacing: 0.75 },
  NIC: { name: 'Nicaragua', long: 'Republic of Nicaragua', color: '#6f8556', from: ['Nicaragua'], spacing: 0.75 },
  COS: { name: 'Costa Rica', long: 'Republic of Costa Rica', color: '#a86a4a', from: ['Costa Rica'], spacing: 0.65 },
  PAN: { name: 'Panama', long: 'Republic of Panama', color: '#7d7f9c', from: ['Panama'], spacing: 1.3 },
  CUB: { name: 'Cuba', long: 'Republic of Cuba', color: '#9a6f6a', from: ['Cuba'], spacing: 1.3 },
  CAN: { name: 'Canada', long: 'Dominion of Canada', color: '#a8475a', from: ['Canada'], spacing: 1.6 },
};

// Home states: the 1936 states and territories grouped into fourteen historical regions
export const HOME_STATES = {
  // Territorio Norte and Territorio Sur de la Baja California
  'Baja California': [
    ['Tijuana', -117.02, 32.52, 3, 'F'], ['Mexicali', -115.47, 32.64, 5, 'S'], ['Ensenada', -116.61, 31.86, 5, 'P'], ['San Felipe', -114.84, 31.02, 1],
    ['San Quintín', -115.94, 30.56, 1], ['Santa Rosalía', -112.27, 27.34, 3], ['Loreto', -111.34, 26.01, 1], ['La Paz', -110.28, 24.14, 5, 'P'],
    ['San José del Cabo', -109.7, 23.06, 1],
  ],
  'Sonora': [
    ['Hermosillo', -110.96, 29.07, 10, 'AS'], ['Guaymas', -110.9, 27.92, 5, 'PN'], ['Nogales', -110.94, 31.3, 3, 'F'], ['Cananea', -110.3, 30.98, 3],
    ['Ciudad Obregón', -109.94, 27.49, 3], ['Navojoa', -109.44, 27.08, 1], ['Caborca', -112.16, 30.72, 1], ['Puerto Peñasco', -113.54, 31.32, 1],
    ['San Luis Río Colorado', -114.77, 32.45, 1],
  ],
  'Sinaloa & Nayarit': [
    ['Culiacán', -107.39, 24.8, 5], ['Mazatlán', -106.42, 23.24, 10, 'PA'], ['Los Mochis', -108.99, 25.79, 3], ['El Fuerte', -108.62, 26.42, 1],
    ['Guasave', -108.47, 25.57, 1], ['Acaponeta', -105.36, 22.5, 1], ['Tepic', -104.89, 21.5, 5], ['San Blas', -105.28, 21.54, 1],
  ],
  'Chihuahua': [
    ['Chihuahua', -106.08, 28.63, 10, 'AS'], ['Ciudad Juárez', -106.49, 31.72, 10, 'F'], ['Hidalgo del Parral', -105.67, 26.93, 5], ['Jiménez', -104.92, 27.13, 1],
    ['Ojinaga', -104.42, 29.55, 1, 'F'], ['Nuevo Casas Grandes', -107.91, 30.42, 1], ['Cuauhtémoc', -106.87, 28.41, 1], ['Madera', -108.14, 29.19, 1],
    ['Creel', -107.63, 27.75, 1],
  ],
  // Coahuila and Durango, joined by the Comarca Lagunera
  'Coahuila & Durango': [
    ['Saltillo', -101.0, 25.42, 10], ['Torreón', -103.41, 25.54, 10, 'AS'], ['Monclova', -101.42, 26.9, 3], ['Piedras Negras', -100.52, 28.69, 3, 'F'],
    ['Sabinas', -101.12, 27.85, 1], ['Parras', -102.18, 25.44, 1], ['Durango', -104.67, 24.02, 10], ['Santiago Papasquiaro', -105.42, 25.04, 1],
    ['El Salto', -105.36, 23.78, 1],
  ],
  'Nuevo León & Tamaulipas': [
    ['Monterrey', -100.31, 25.67, 20, 'ASR'], ['Linares', -99.57, 24.86, 1], ['Sabinas Hidalgo', -100.18, 26.51, 1], ['Nuevo Laredo', -99.51, 27.47, 5, 'F'],
    ['Reynosa', -98.28, 26.08, 3], ['Matamoros', -97.5, 25.86, 5, 'F'], ['Ciudad Victoria', -99.14, 23.74, 5], ['Tampico', -97.86, 22.25, 15, 'PAR'],
    ['San Fernando', -98.15, 24.85, 1],
  ],
  // Zacatecas, Aguascalientes and San Luis Potosí: the old silver country
  'Zacatecas & San Luis Potosí': [
    ['Zacatecas', -102.57, 22.77, 5], ['Fresnillo', -102.87, 23.17, 3], ['Sombrerete', -103.64, 23.63, 1], ['Concepción del Oro', -101.42, 24.61, 1],
    ['Aguascalientes', -102.29, 21.88, 10], ['San Luis Potosí', -100.98, 22.15, 10, 'S'], ['Matehuala', -100.64, 23.65, 3], ['Rioverde', -99.99, 21.93, 1],
    ['Ciudad Valles', -99.01, 21.99, 1],
  ],
  'Jalisco & Colima': [
    ['Guadalajara', -103.35, 20.67, 20, 'AS'], ['Lagos de Moreno', -101.93, 21.36, 3], ['Ciudad Guzmán', -103.46, 19.7, 3], ['Ocotlán', -102.77, 20.35, 1],
    ['Autlán', -104.37, 19.77, 1], ['Puerto Vallarta', -105.23, 20.65, 1], ['Tequila', -103.84, 20.88, 1], ['Colima', -103.72, 19.24, 5],
    ['Manzanillo', -104.32, 19.05, 5, 'P'],
  ],
  // Guanajuato, Querétaro and Michoacán
  'El Bajío & Michoacán': [
    ['León', -101.68, 21.12, 10], ['Guanajuato', -101.26, 21.02, 5], ['Celaya', -100.81, 20.52, 5], ['Irapuato', -101.35, 20.68, 5],
    ['Querétaro', -100.39, 20.59, 5], ['Acámbaro', -100.72, 20.03, 1], ['Morelia', -101.19, 19.7, 10], ['Uruapan', -102.06, 19.42, 3],
    ['Apatzingán', -102.35, 19.09, 1],
  ],
  // The Federal District with México, Hidalgo, Morelos, Puebla and Tlaxcala
  'Valley of Mexico & Puebla': [
    ['Mexico City', -99.13, 19.43, 50, 'CASF'], ['Toluca', -99.66, 19.29, 5], ['Pachuca', -98.74, 20.12, 5], ['Tulancingo', -98.37, 20.08, 1],
    ['Tula', -99.34, 20.05, 1], ['Cuernavaca', -99.23, 18.92, 5], ['Cuautla', -98.95, 18.81, 1], ['Puebla', -98.2, 19.04, 20],
    ['Tehuacán', -97.39, 18.46, 3], ['Teziutlán', -97.36, 19.82, 1],
  ],
  'Veracruz': [
    ['Veracruz', -96.13, 19.18, 15, 'PNSF'], ['Xalapa', -96.92, 19.54, 5], ['Orizaba', -97.1, 18.85, 5], ['Perote', -97.24, 19.56, 1, 'F'],
    ['Tuxpan', -97.4, 20.96, 3], ['Poza Rica', -97.46, 20.53, 3, 'R'], ['Puerto México', -94.42, 18.14, 5, 'P'], ['Jesús Carranza', -95.03, 17.43, 1],
    ['Tierra Blanca', -96.35, 18.45, 1], ['San Andrés Tuxtla', -95.21, 18.45, 1],
  ],
  // Guerrero and Oaxaca
  'Oaxaca & the South': [
    ['Acapulco', -99.89, 16.86, 10, 'PNF'], ['Chilpancingo', -99.5, 17.55, 3], ['Iguala', -99.54, 18.35, 3], ['Zihuatanejo', -101.55, 17.64, 1],
    ['Oaxaca', -96.72, 17.07, 10], ['Salina Cruz', -95.2, 16.17, 5, 'P'], ['Ixtepec', -95.1, 16.56, 3, 'S'], ['Puerto Ángel', -96.49, 15.67, 1],
    ['Pinotepa Nacional', -98.05, 16.34, 1], ['Huajuapan', -97.78, 17.81, 1], ['Tuxtepec', -96.12, 18.09, 1],
  ],
  'Chiapas & Tabasco': [
    ['Tuxtla Gutiérrez', -93.12, 16.75, 5, 'S'], ['San Cristóbal de las Casas', -92.64, 16.74, 3], ['Tapachula', -92.26, 14.91, 5, 'AF'], ['Comitán', -92.13, 16.25, 1, 'F'],
    ['Tonalá', -93.75, 16.09, 1], ['Palenque', -91.98, 17.51, 1], ['Villahermosa', -92.93, 17.99, 5], ['Frontera', -92.65, 18.53, 1],
    ['Tenosique', -91.42, 17.47, 1],
  ],
  // Yucatán and Campeche with the Territory of Quintana Roo
  'Yucatán': [
    ['Mérida', -89.59, 20.97, 15, 'AS'], ['Progreso', -89.66, 21.28, 3, 'P'], ['Valladolid', -88.2, 20.69, 3], ['Peto', -88.92, 20.13, 1],
    ['Campeche', -90.53, 19.85, 5, 'F'], ['Champotón', -90.72, 19.35, 1], ['Ciudad del Carmen', -91.83, 18.65, 1], ['Chetumal', -88.3, 18.5, 3, 'PF'],
    ['Felipe Carrillo Puerto', -88.05, 19.58, 1], ['Tulum', -87.46, 20.21, 1],
  ],
};

// Foreign cities by country tag → region → cities. Regions are named as in 1936; META.regions gives the
// names they bore in 1821, under the Provincias Internas, the Californias and the Capitanía General de Guatemala.
export const FOREIGN = {
  USA: {
    // ---- Alta California front ----
    'Southern California': [['Los Angeles', -118.24, 34.05, 20], ['San Diego', -117.16, 32.72, 10], ['San Bernardino', -117.29, 34.11, 1], ['San Juan Capistrano', -117.66, 33.5, 1],
      ['El Centro', -115.56, 32.79, 1], ['Palm Springs', -116.55, 33.83, 1], ['Barstow', -117.02, 34.9, 1], ['Mojave', -118.17, 35.05, 1], ['Needles', -114.85, 34.85, 1],
      ['Bakersfield', -119.02, 35.37, 3], ['Furnace Creek', -116.87, 36.46, 1]],
    'Central Coast': [['Monterey', -121.89, 36.6, 10], ['Santa Barbara', -119.7, 34.42, 3], ['San Luis Obispo', -120.66, 35.28, 1], ['Santa Cruz', -122.03, 36.97, 1], ['Fresno', -119.79, 36.74, 3],
      ['Bishop', -118.39, 37.36, 1]],
    'Northern California': [['San Francisco', -122.42, 37.77, 20], ['Sacramento', -121.49, 38.58, 5], ['San José de Guadalupe', -121.89, 37.34, 3], ['Stockton', -121.29, 37.96, 1], ['Sonoma', -122.46, 38.29, 3],
      ['Fort Ross', -123.24, 38.51, 1], ['Ukiah', -123.21, 39.15, 1], ['Eureka', -124.16, 40.8, 1], ['Redding', -122.39, 40.59, 1], ['Chico', -121.84, 39.73, 1], ['Yreka', -122.63, 41.73, 1],
      ['Susanville', -120.65, 40.42, 1], ['Truckee', -120.18, 39.33, 1], ['Alturas', -120.54, 41.49, 1]],
    'Nevada': [['Reno', -119.81, 39.53, 3], ['Las Vegas', -115.14, 36.17, 3], ['Elko', -115.76, 40.83, 1], ['Winnemucca', -117.74, 40.97, 1], ['Tonopah', -117.23, 38.07, 1], ['Ely', -114.89, 39.25, 1],
      ['Battle Mountain', -116.93, 40.64, 1], ['Lovelock', -118.47, 40.18, 1], ['Fallon', -118.78, 39.47, 1], ['Pioche', -114.75, 37.93, 1]],
    // ---- Nuevo México front ----
    'Southern Arizona': [['Tucson', -110.97, 32.22, 10], ['Tubac', -111.05, 31.61, 3], ['Phoenix', -112.07, 33.45, 10], ['Yuma', -114.45, 32.69, 3], ['Bisbee', -109.93, 31.45, 1], ['Douglas', -109.55, 31.36, 1],
      ['Ajo', -112.86, 32.37, 1], ['Gila Bend', -112.72, 32.95, 1], ['Casa Grande', -111.76, 32.88, 1], ['Globe', -110.79, 33.39, 1], ['Safford', -109.71, 32.83, 1], ['Tombstone', -110.07, 31.71, 1],
      ['Wickenburg', -112.73, 33.97, 1], ['Parker', -114.25, 34.15, 1]],
    'Northern Arizona': [['Flagstaff', -111.65, 35.2, 3], ['Prescott', -112.47, 34.54, 3], ['Kingman', -114.05, 35.19, 1], ['Winslow', -110.7, 35.02, 1], ['Oraibi', -110.63, 35.88, 1], ['Tuba City', -111.24, 36.13, 1],
      ['Grand Canyon', -112.14, 36.05, 1], ['Kayenta', -110.25, 36.73, 1], ['Fort Defiance', -109.08, 35.74, 1], ['Show Low', -110.03, 34.25, 1], ['Fredonia', -112.53, 36.95, 1]],
    'New Mexico': [['Santa Fe', -105.94, 35.69, 15], ['Albuquerque', -106.65, 35.08, 10], ['Taos', -105.57, 36.41, 3], ['San Miguel del Vado', -105.46, 35.37, 1], ['Socorro', -106.89, 34.06, 1], ['Gallup', -108.71, 35.53, 1],
      ['Farmington', -108.22, 36.73, 1], ['Raton', -104.44, 36.9, 1], ['Santa Rosa', -104.68, 34.94, 1], ['Tucumcari', -103.73, 35.17, 1], ['Clovis', -103.2, 34.4, 1], ['Abiquiú', -106.32, 36.21, 1],
      ['Acoma', -107.58, 34.9, 1], ['Chama', -106.58, 36.9, 1], ['Clayton', -103.18, 36.45, 1]],
    'Southern New Mexico': [['El Paso', -106.44, 31.79, 10], ['Las Cruces', -106.78, 32.31, 3], ['Roswell', -104.52, 33.39, 3], ['Carlsbad', -104.23, 32.42, 1], ['Silver City', -108.28, 32.77, 1], ['Deming', -107.76, 32.27, 1],
      ['Alamogordo', -105.96, 32.9, 1], ['Lordsburg', -108.71, 32.35, 1], ['Hot Springs', -107.25, 33.13, 1], ['Hobbs', -103.14, 32.7, 1], ['Carrizozo', -105.88, 33.64, 1]],
    'Trans-Pecos': [['Presidio', -104.37, 29.58, 3], ['Marfa', -104.02, 30.31, 1], ['Alpine', -103.66, 30.36, 1], ['Pecos', -103.49, 31.42, 1], ['Van Horn', -104.83, 31.04, 1], ['Sierra Blanca', -105.36, 31.17, 1],
      ['Terlingua', -103.62, 29.32, 1]],
    'Utah': [['Salt Lake City', -111.89, 40.76, 15], ['Provo', -111.66, 40.23, 3], ['Ogden', -111.97, 41.22, 3], ['Logan', -111.83, 41.74, 1], ['St. George', -113.58, 37.1, 1], ['Cedar City', -113.06, 37.68, 1],
      ['Moab', -109.55, 38.57, 1], ['Price', -110.81, 39.6, 1], ['Vernal', -109.53, 40.46, 1], ['Richfield', -112.08, 38.77, 1], ['Delta', -112.58, 39.35, 1], ['Wendover', -114.04, 40.74, 1],
      ['Blanding', -109.48, 37.62, 1], ['Green River', -110.16, 38.99, 1], ['Panguitch', -112.44, 37.82, 1]],
    'Colorado': [['Denver', -104.99, 39.74, 15], ['Colorado Springs', -104.82, 38.83, 3], ['Pueblo', -104.61, 38.25, 5], ['Trinidad', -104.53, 37.17, 1], ['Silverton', -107.66, 37.81, 1], ['Cortez', -108.59, 37.35, 1],
      ['Grand Junction', -108.55, 39.06, 3], ['Alamosa', -105.87, 37.47, 1], ['Leadville', -106.29, 39.25, 1], ['Glenwood Springs', -107.32, 39.55, 1], ['Craig', -107.55, 40.52, 1], ['Montrose', -107.88, 38.48, 1],
      ['Gunnison', -106.93, 38.55, 1], ['Fort Collins', -105.08, 40.59, 1], ['Steamboat Springs', -106.83, 40.48, 1], ['La Junta', -103.54, 37.99, 1], ['Pagosa Springs', -107.01, 37.27, 1], ['Sterling', -103.21, 40.63, 1]],
    'Southern Wyoming': [['Cheyenne', -104.82, 41.14, 3], ['Laramie', -105.59, 41.31, 1], ['Rawlins', -107.24, 41.79, 1], ['Rock Springs', -109.2, 41.59, 1], ['Evanston', -110.96, 41.27, 1]],
    // ---- Texas front ----
    'San Antonio & the Hill Country': [['San Antonio', -98.49, 29.42, 15], ['Fredericksburg', -98.87, 30.27, 1], ['Uvalde', -99.79, 29.21, 1], ['Del Rio', -100.9, 29.36, 1], ['Eagle Pass', -100.5, 28.71, 1],
      ['Junction', -99.77, 30.49, 1], ['San Saba', -98.72, 31.2, 1]],
    'South Texas': [['Laredo', -99.51, 27.51, 5], ['McAllen', -98.23, 26.2, 1], ['Rio Grande City', -98.82, 26.38, 1], ['Alice', -98.07, 27.75, 1], ['Hebbronville', -98.68, 27.31, 1], ['Cotulla', -99.24, 28.44, 1],
      ['Zapata', -99.27, 26.91, 1], ['Falfurrias', -98.14, 27.23, 1]],
    'West Texas': [['Lubbock', -101.86, 33.58, 3], ['Amarillo', -101.83, 35.22, 3], ['Midland', -102.08, 32.0, 1], ['San Angelo', -100.44, 31.46, 1], ['Abilene', -99.73, 32.45, 3], ['Big Spring', -101.48, 32.25, 1],
      ['Wichita Falls', -98.49, 33.91, 1], ['Childress', -100.2, 34.43, 1], ['Dalhart', -102.51, 36.06, 1], ['Pampa', -100.96, 35.54, 1], ['Plainview', -101.71, 34.18, 1], ['Snyder', -100.92, 32.72, 1], ['Ozona', -101.2, 30.71, 1], ['Sanderson', -102.4, 30.14, 1], ['Fort Stockton', -102.88, 30.89, 1]],
    'Western Oklahoma': [['Lawton', -98.39, 34.61, 1], ['Altus', -99.33, 34.64, 1], ['Clinton', -98.97, 35.52, 1], ['Woodward', -99.39, 36.43, 1]],
    // ---- Gulf of Mexico theatre ----
    'Coastal Bend': [['Brownsville', -97.48, 25.92, 3], ['Corpus Christi', -97.4, 27.8, 3], ['Goliad', -97.39, 28.67, 3], ['Victoria', -97.0, 28.81, 1], ['Refugio', -97.28, 28.31, 1], ['Matagorda', -95.96, 28.69, 1],
      ['Port Isabel', -97.21, 26.07, 1]],
    'Brazos Valley': [['Austin', -97.74, 30.27, 5], ['Waco', -97.15, 31.55, 3], ['San Felipe de Austin', -96.1, 29.79, 1], ['Bryan', -96.37, 30.67, 1], ['Temple', -97.34, 31.1, 1], ['La Grange', -96.88, 29.91, 1]],
    'Galveston Bay': [['Houston', -95.37, 29.76, 15], ['Galveston', -94.85, 29.3, 5], ['Beaumont', -94.1, 30.08, 1], ['Liberty', -94.8, 30.06, 1], ['Freeport', -95.36, 28.95, 1], ['Huntsville', -95.55, 30.72, 1]],
    'East Texas': [['Nacogdoches', -94.66, 31.6, 5], ['Tyler', -95.3, 32.35, 1], ['Texarkana', -94.1, 33.43, 1], ['Marshall', -94.37, 32.54, 1], ['Palestine', -95.63, 31.76, 1], ['Jasper', -94.0, 30.92, 1],
      ['Paris', -95.56, 33.66, 1]],
    'North Texas': [['Dallas', -96.8, 32.78, 10], ['Fort Worth', -97.33, 32.75, 5], ['Sherman', -96.61, 33.64, 1], ['Corsicana', -96.47, 32.1, 1]],
    // ---- beyond the Adams–Onís line ----
    'Oregon Country': [['Medford', -122.87, 42.33, 1], ['Klamath Falls', -121.78, 42.22, 1], ['Burns', -119.05, 43.0, 1], ['Twin Falls', -114.46, 42.56, 1], ['Pocatello', -112.45, 42.87, 1], ['Casper', -106.31, 42.85, 1], ['Brookings', -124.28, 42.06, 1], ['Lakeview', -120.35, 42.19, 1], ['Jordan Valley', -117.05, 42.97, 1],
      ['McDermitt', -117.72, 42.2, 1], ['Malad City', -112.25, 42.19, 1], ['Montpelier', -111.3, 42.32, 1], ['Lander', -108.73, 42.83, 1], ['Big Piney', -110.11, 42.54, 1], ['Wheatland', -104.95, 42.3, 1]],
    'Great Plains': [['Oklahoma City', -97.52, 35.47, 5], ['Tulsa', -95.99, 36.15, 3], ['Wichita', -97.34, 37.69, 3], ['Dodge City', -100.02, 37.75, 1], ['Kansas City', -94.58, 39.1, 10], ['Omaha', -95.94, 41.26, 5],
      ['Topeka', -95.68, 39.05, 1], ['North Platte', -100.77, 41.12, 1], ['Alliance', -102.87, 42.1, 1], ['Lincoln', -96.68, 40.81, 1], ['Sioux City', -96.4, 42.5, 1], ['Guymon', -101.48, 36.68, 1],
      ['Goodland', -101.71, 39.35, 1], ['Lamar', -102.62, 38.09, 1], ['Chadron', -103.0, 42.83, 1], ['Lusk', -104.45, 42.76, 1]],
    'Louisiana': [['New Orleans', -90.07, 29.95, 20], ['Baton Rouge', -91.15, 30.45, 3], ['Shreveport', -93.75, 32.52, 3], ['Lake Charles', -93.22, 30.23, 1], ['Alexandria', -92.45, 31.31, 1], ['Natchitoches', -93.09, 31.76, 1],
      ['Little Rock', -92.29, 34.75, 3], ['Fort Smith', -94.4, 35.39, 1]],
    'Middle West': [['Chicago', -87.63, 41.88, 20], ['St. Louis', -90.2, 38.63, 15], ['Detroit', -83.05, 42.33, 15], ['Indianapolis', -86.16, 39.77, 5], ['Cincinnati', -84.51, 39.1, 5], ['Cleveland', -81.69, 41.5, 10],
      ['Columbus', -83.0, 39.96, 3], ['Des Moines', -93.61, 41.59, 3], ['Milwaukee', -87.91, 43.04, 5], ['Springfield', -89.65, 39.8, 1]],
    'The South': [['Memphis', -90.05, 35.15, 5], ['Nashville', -86.78, 36.16, 5], ['Louisville', -85.76, 38.25, 5], ['Atlanta', -84.39, 33.75, 10], ['Birmingham', -86.8, 33.52, 5], ['Mobile', -88.04, 30.69, 3],
      ['Montgomery', -86.3, 32.37, 1], ['Jackson', -90.18, 32.3, 1], ['Savannah', -81.1, 32.08, 1], ['Charlotte', -80.84, 35.23, 1], ['Knoxville', -83.92, 35.96, 1], ['Charleston', -81.63, 38.35, 1]],
    'Florida': [['Pensacola', -87.22, 30.42, 3], ['Tallahassee', -84.28, 30.44, 1], ['Jacksonville', -81.66, 30.33, 3], ['St. Augustine', -81.31, 29.9, 1], ['Tampa', -82.46, 27.95, 3], ['Orlando', -81.38, 28.54, 1],
      ['Fort Myers', -81.87, 26.64, 1]],
  },
  GUA: {
    'Guatemala': [['Guatemala City', -90.51, 14.63, 20], ['Antigua Guatemala', -90.73, 14.56, 5], ['Escuintla', -90.79, 14.3, 1], ['Puerto San José', -90.83, 13.95, 1]],
    'Los Altos': [['Quetzaltenango', -91.52, 14.84, 10], ['Huehuetenango', -91.47, 15.32, 3], ['San Marcos', -91.8, 14.96, 1], ['Sololá', -91.18, 14.77, 1], ['Santa Cruz del Quiché', -91.15, 15.03, 1],
      ['Nebaj', -91.15, 15.41, 1], ['Barillas', -91.32, 15.8, 1]],
    'Costa Sur': [['Mazatenango', -91.5, 14.53, 1], ['Champerico', -91.91, 14.3, 1], ['Ocós', -92.19, 14.51, 1]],
    'Verapaz': [['Cobán', -90.37, 15.47, 3], ['Salamá', -90.32, 15.1, 1], ['Cahabón', -89.81, 15.61, 1], ['Chisec', -90.29, 15.81, 1]],
    'Oriente': [['Chiquimula', -89.54, 14.8, 1], ['Jutiapa', -89.9, 14.29, 1], ['Jalapa', -89.99, 14.63, 1], ['Esquipulas', -89.35, 14.57, 1]],
    'Izabal': [['Puerto Barrios', -88.59, 15.73, 3], ['El Estor', -89.35, 15.53, 1], ['Los Amates', -89.1, 15.26, 1]],
    'Petén': [['Flores', -89.89, 16.93, 3], ['Sayaxché', -90.19, 16.53, 1], ['Poptún', -89.42, 16.33, 1], ['Uaxactún', -89.63, 17.39, 1], ['Paso Caballos', -90.25, 17.26, 1], ['Fallabón', -89.15, 17.07, 1]],
  },
  ELS: {
    'San Salvador': [['San Salvador', -89.19, 13.69, 15], ['Chalatenango', -88.94, 14.04, 1], ['San Vicente', -88.78, 13.64, 1], ['La Libertad', -89.32, 13.49, 1]],
    'Sonsonate': [['Sonsonate', -89.72, 13.72, 1], ['Santa Ana', -89.56, 13.99, 5], ['Ahuachapán', -89.85, 13.92, 1], ['Acajutla', -89.83, 13.59, 1], ['Metapán', -89.45, 14.33, 1]],
    'San Miguel': [['San Miguel', -88.18, 13.48, 3], ['La Unión', -87.84, 13.34, 1], ['Usulután', -88.44, 13.35, 1], ['San Francisco Gotera', -88.1, 13.7, 1]],
  },
  HON: {
    'Comayagua': [['Comayagua', -87.64, 14.45, 5], ['Yoro', -87.13, 15.14, 1], ['Santa Bárbara', -88.24, 14.92, 1], ['La Esperanza', -88.18, 14.31, 1]],
    'Tegucigalpa': [['Tegucigalpa', -87.21, 14.1, 15], ['Choluteca', -87.19, 13.3, 1], ['Danlí', -86.57, 14.03, 1], ['Nacaome', -87.49, 13.53, 1]],
    'Copán': [['Gracias', -88.58, 14.59, 1], ['Santa Rosa de Copán', -88.78, 14.77, 1], ['Copán', -89.14, 14.84, 3], ['Ocotepeque', -89.18, 14.44, 1]],
    'Costa Norte': [['San Pedro Sula', -88.03, 15.5, 5], ['Omoa', -88.04, 15.77, 3], ['Tela', -87.46, 15.78, 1], ['La Ceiba', -86.79, 15.76, 3], ['Trujillo', -85.95, 15.92, 3], ['Olanchito', -86.57, 15.48, 1]],
    'Olancho': [['Juticalpa', -86.22, 14.67, 1], ['Catacamas', -85.89, 14.85, 1], ['Dulce Nombre de Culmí', -85.53, 15.1, 1]],
    'Mosquitia': [['Caratasca', -83.77, 15.27, 1], ['Brus Laguna', -84.54, 15.75, 1], ['Iriona', -85.18, 15.94, 1], ['Wampusirpi', -84.62, 15.17, 1]],
  },
  NIC: {
    'León': [['León de Nicaragua', -86.85, 12.44, 10], ['Chinandega', -87.13, 12.63, 3], ['El Sauce', -86.54, 12.89, 1]],
    'Granada': [['Managua', -86.25, 12.14, 15], ['Granada', -85.96, 11.93, 5], ['Rivas', -85.83, 11.44, 1]],
    'Segovia': [['Ocotal', -86.48, 13.63, 1], ['Estelí', -86.35, 13.09, 1], ['Matagalpa', -85.92, 12.93, 3], ['Quilalí', -86.03, 13.57, 1]],
    'Chontales': [['Juigalpa', -85.37, 12.11, 1], ['Boaco', -85.66, 12.47, 1], ['San Carlos', -84.75, 11.13, 1], ['El Castillo', -84.4, 11.02, 1]],
    'Mosquito Coast': [['Bluefields', -83.77, 12.01, 3], ['Puerto Cabezas', -83.38, 14.03, 1], ['San Juan del Norte', -83.71, 10.93, 1], ['Prinzapolka', -83.56, 13.41, 1], ['Siuna', -84.78, 13.73, 1],
      ['Waspam', -83.97, 14.74, 1], ['Rama', -84.22, 12.16, 1], ['Cabo Gracias a Dios', -83.2, 14.98, 1], ['La Cruz de Río Grande', -84.19, 13.11, 1]],
  },
  COS: {
    'Meseta Central': [['San José', -84.08, 9.93, 15], ['Cartago', -83.92, 9.86, 5], ['San Ramón', -84.47, 10.09, 1], ['Turrialba', -83.68, 9.9, 1]],
    'Guanacaste': [['Liberia', -85.44, 10.63, 1], ['Nicoya', -85.45, 10.15, 1], ['La Cruz de Guanacaste', -85.63, 11.07, 1]],
    'Puntarenas': [['Puntarenas', -84.84, 9.98, 3], ['Quepos', -84.16, 9.43, 1], ['Buenos Aires', -83.33, 9.17, 1], ['San Isidro de El General', -83.7, 9.37, 1], ['Puerto Jiménez', -83.3, 8.53, 1]],
    'Limón': [['Limón', -83.03, 10.0, 3], ['Guápiles', -83.78, 10.21, 1], ['Sixaola', -82.62, 9.51, 1], ['Villa Quesada', -84.43, 10.32, 1], ['Sarapiquí', -84.01, 10.46, 1], ['Barra del Colorado', -83.59, 10.77, 1]],
  },
  GBR: {
    'Northern District': [['Corozal', -88.39, 18.39, 1], ['Orange Walk', -88.56, 18.08, 1]],
    'Belize': [['Belize', -88.19, 17.5, 5], ['El Cayo', -89.07, 17.16, 1], ['Stann Creek', -88.22, 16.97, 1], ['Punta Gorda', -88.81, 16.1, 1]],
  },
  PAN: { 'Chiriquí': [['David', -82.43, 8.43, 3], ['Puerto Armuelles', -82.87, 8.28, 1], ['Almirante', -82.4, 9.3, 1], ['Santiago de Veraguas', -80.97, 8.1, 1]] },
  CUB: { 'Occidente': [['Havana', -82.36, 23.13, 20], ['Pinar del Río', -83.67, 22.42, 3], ['Matanzas', -81.61, 23.05, 3], ['Colón', -80.91, 22.72, 1]] },
  CAN: { 'Ontario': [['Windsor', -83.03, 42.3, 3], ['London', -81.25, 42.98, 3], ['Sarnia', -82.4, 42.97, 1]] },
};

// Fronts. `subs` = modern-country polygons that make up the enemy objective zone; `box` cuts the United States.
// The four United States boxes do not overlap:
//   Alta California  lon −125.5…−114.6, lat 32…42      California and Nevada
//   Nuevo México     lon −114.6…−103,   lat 28.5…42    Arizona, New Mexico, Utah, Colorado, southern Wyoming, the Trans-Pecos
//   Texas            lon −103…−97.8,    lat 25.5…36.5  West and South Texas, the Panhandle, San Antonio (and western Oklahoma)
//   Gulf             lon −97.8…−93.75,  lat 25.5…34.2  the Texas coast, the Brazos, Galveston Bay, Nacogdoches
// Utah falls on the Nuevo México front, not with Alta California, because a rectangle cannot hold Utah without Arizona.
// El Paso and the Trans-Pecos go with Nuevo México, as they did in 1821 (El Paso del Norte was never part of Tejas).
// The boxes overreach the Adams–Onís line in eastern Colorado, south-eastern Wyoming and western Oklahoma, and fall
// short of it in the Oklahoma Panhandle and south-western Kansas.
const GULF_COAST = [[-97.15, 25.9], [-97.55, 24.6], [-97.75, 23.5], [-97.8, 22.3], [-97.35, 21.3], [-97.1, 20.5], [-96.45, 19.7], [-96.1, 19.15], [-95.75, 18.75], [-95.0, 18.6], [-94.4, 18.17]];
const CARIBBEAN_COAST = [[-87.9, 21.55], [-87.1, 21.55], [-86.75, 21.1], [-86.9, 20.7], [-87.4, 20.2], [-87.45, 19.6], [-87.6, 19.0], [-87.75, 18.35], [-88.25, 18.5]];
const PACIFIC_COAST = [[-99.9, 16.82], [-98.6, 16.3], [-97.8, 15.95], [-96.5, 15.65], [-95.3, 16.05], [-94.3, 16.15], [-93.5, 15.6], [-92.8, 15.1], [-92.25, 14.55]];
export const FRONTS = [
  { id: 'cal', name: 'Alta California Front', enemy: 'USA', enemyName: 'United States', subs: ['United States of America'], box: [-125.5, 32, -114.6, 42],
    defaultLabel: 'School', satrapy: 'Alta California', hq: 'Mexicali' },
  { id: 'nmx', name: 'Nuevo México Front', enemy: 'USA', enemyName: 'United States', subs: ['United States of America'], box: [-114.6, 28.5, -103, 42],
    defaultLabel: 'Family', satrapy: 'Santa Fe de Nuevo México & the Pimería Alta', hq: 'Chihuahua' },
  { id: 'tex', name: 'Texas Front', enemy: 'USA', enemyName: 'United States', subs: ['United States of America'], box: [-103, 25.5, -97.8, 36.5],
    defaultLabel: 'Partner', satrapy: 'Tejas & the Llano Estacado', hq: 'Monterrey' },
  { id: 'gua', name: 'Guatemala Front', enemy: 'GUA', enemyName: 'Guatemala', subs: ['Guatemala', 'El Salvador'],
    defaultLabel: 'Work', satrapy: 'Guatemala & San Salvador', hq: 'Tuxtla Gutiérrez' },
  { id: 'glf', name: 'Gulf of Mexico Theatre', enemy: 'USA', enemyName: 'United States Navy', naval: true, subs: ['United States of America'], box: [-97.8, 25.5, -93.75, 34.2],
    coast: GULF_COAST, coastKm: 60, defaultLabel: 'Health', satrapy: 'the coast of Tejas, Galveston & Nacogdoches', hq: 'Tampico' },
  { id: 'car', name: 'Caribbean Theatre', enemy: 'GBR', enemyName: 'Royal Navy', naval: true, subs: ['Belize', 'Honduras'],
    coast: CARIBBEAN_COAST, coastKm: 60, defaultLabel: 'Friends', satrapy: 'Walis, Comayagua & the Bay of Honduras', hq: 'Mérida' },
  { id: 'pac', name: 'Pacific Theatre', enemy: 'NIC', enemyName: 'Nicaragua & Costa Rica', naval: true, subs: ['Nicaragua', 'Costa Rica'],
    coast: PACIFIC_COAST, coastKm: 60, defaultLabel: 'Self', satrapy: 'León, Granada & Costa Rica', hq: 'Acapulco' },
];

// Terrain. ranges: polyline + half-width in degrees
export const RANGES = [
  { name: 'Sierra Madre Occidental', w: 1.0, pts: [[-109.0, 30.8], [-108.3, 29.2], [-107.6, 27.6], [-106.8, 26.0], [-105.9, 24.6], [-105.0, 23.2], [-104.3, 22.0]] },
  { name: 'Sierra Madre Oriental', w: 0.6, pts: [[-102.4, 28.6], [-101.5, 27.0], [-100.7, 25.6], [-100.2, 24.6], [-99.7, 23.4], [-99.3, 22.2], [-98.8, 21.0], [-98.0, 20.2], [-97.3, 19.4]] },
  { name: 'Eje Neovolcánico', w: 0.5, pts: [[-104.6, 20.2], [-103.6, 19.5], [-102.3, 19.5], [-101.2, 19.55], [-100.0, 19.3], [-99.0, 19.1], [-98.3, 19.25], [-97.3, 19.05]] },
  { name: 'Sierra Madre del Sur', w: 0.6, pts: [[-103.8, 18.8], [-102.3, 18.3], [-100.8, 17.7], [-99.5, 17.2], [-98.0, 16.9], [-96.8, 16.4], [-95.9, 16.4]] },
  { name: 'Sierra Madre de Oaxaca', w: 0.4, pts: [[-97.2, 18.5], [-96.6, 17.6], [-95.9, 17.1]] },
  { name: 'Sierra Madre de Chiapas', w: 0.4, pts: [[-94.0, 16.4], [-93.2, 15.8], [-92.4, 15.2], [-91.6, 14.8], [-90.6, 14.5], [-89.6, 14.3]] },
  { name: 'Altos de Chiapas', w: 0.4, pts: [[-93.0, 17.0], [-92.3, 16.7], [-91.7, 16.25]] },
  { name: 'Cuchumatanes', w: 0.4, pts: [[-91.9, 15.6], [-91.0, 15.5], [-90.2, 15.3], [-89.4, 15.2]] },
  { name: 'Sierra de Baja California', w: 0.32, pts: [[-116.3, 32.4], [-115.6, 31.0], [-114.6, 29.5], [-113.3, 28.1], [-112.2, 26.8], [-111.2, 25.5], [-110.3, 24.1], [-109.95, 23.3]] },
  { name: 'Sierra Nevada', w: 0.6, pts: [[-121.2, 40.2], [-120.2, 39.0], [-119.3, 37.7], [-118.4, 36.4], [-118.3, 35.4]] },
  { name: 'Coast Ranges', w: 0.3, pts: [[-123.6, 41.6], [-123.3, 40.0], [-122.8, 38.9]] },
  { name: 'Santa Lucia & Transverse Ranges', w: 0.3, pts: [[-121.6, 36.3], [-120.4, 35.2], [-119.4, 34.6], [-117.8, 34.3], [-116.8, 34.1]] },
  { name: 'Cascades', w: 0.45, pts: [[-122.2, 43.2], [-122.2, 41.6], [-121.6, 40.6]] },
  { name: 'Toiyabe Range', w: 0.35, pts: [[-117.2, 39.7], [-117.0, 38.6]] },
  { name: 'Ruby Mountains', w: 0.3, pts: [[-115.4, 40.9], [-115.5, 40.0]] },
  { name: 'Wasatch', w: 0.45, pts: [[-111.6, 41.9], [-111.6, 40.4], [-111.8, 39.2], [-112.4, 38.0], [-113.0, 37.5]] },
  { name: 'Uinta', w: 0.35, pts: [[-111.2, 40.75], [-109.6, 40.75]] },
  { name: 'Rocky Mountains', w: 0.9, pts: [[-106.4, 41.3], [-106.2, 39.6], [-106.4, 38.4], [-105.6, 37.2], [-105.5, 36.0], [-105.6, 35.4]] },
  { name: 'San Juan Mountains', w: 0.5, pts: [[-108.2, 37.9], [-107.0, 37.6], [-106.4, 37.2]] },
  { name: 'Wind River Range', w: 0.45, pts: [[-110.6, 43.2], [-109.4, 42.6]] },
  { name: 'Mogollon Rim', w: 0.4, pts: [[-112.6, 34.9], [-111.4, 34.4], [-110.0, 34.0], [-108.8, 33.5]] },
  { name: 'Sacramento & Davis Mountains', w: 0.35, pts: [[-105.8, 33.4], [-105.4, 32.6], [-104.9, 31.8], [-104.2, 30.7], [-103.4, 29.6]] },
  { name: 'Ozarks', w: 0.5, pts: [[-94.2, 35.9], [-92.6, 36.6]] },
  { name: 'Appalachians', w: 0.7, pts: [[-86.2, 33.8], [-84.2, 35.2], [-82.6, 36.2], [-81.2, 37.4], [-80.5, 38.4]] },
  { name: 'Honduran Highlands', w: 0.55, pts: [[-88.8, 14.75], [-87.6, 14.6], [-86.6, 14.4]] },
  { name: 'Cordillera Isabelia', w: 0.4, pts: [[-86.4, 13.6], [-85.6, 13.3], [-85.0, 12.7]] },
  { name: 'Cordillera de Talamanca', w: 0.35, pts: [[-85.3, 10.8], [-84.4, 10.25], [-83.8, 9.7], [-83.2, 9.2], [-82.6, 8.85], [-81.6, 8.55]] },
  { name: 'Maya Mountains', w: 0.25, pts: [[-89.0, 16.4], [-88.6, 16.9]] },
];
export const DESERTS = [ // [lon, lat, rx, ry, name]
  [-113.0, 31.2, 2.3, 1.7, 'Sonoran Desert'], [-104.6, 29.4, 2.3, 2.4, 'Chihuahuan Desert'], [-103.5, 26.8, 1.2, 1.2, 'Bolsón de Mapimí'],
  [-113.6, 27.6, 1.0, 0.7, 'Vizcaíno Desert'], [-114.5, 29.6, 0.7, 0.9, 'Desierto Central'], [-101.5, 23.6, 1.0, 0.9, 'El Salado'],
  [-116.2, 35.2, 1.6, 0.9, 'Mojave Desert'], [-115.6, 33.2, 0.7, 0.6, 'Colorado Desert'], [-116.2, 39.6, 2.3, 1.7, 'Great Basin'],
  [-113.6, 40.6, 0.8, 0.8, 'Great Salt Lake Desert'], [-110.8, 36.0, 1.2, 0.7, 'Painted Desert'], [-106.6, 33.0, 0.5, 0.9, 'Jornada del Muerto'],
];
export const FORESTS = [
  [-91.2, 16.6, 0.8, 0.6], [-90.0, 17.0, 1.3, 0.8], [-89.1, 18.9, 1.7, 1.0], [-94.4, 17.1, 0.7, 0.5], [-95.1, 18.4, 0.4, 0.3], [-98.6, 21.3, 0.5, 0.6],
  [-84.5, 14.6, 1.3, 1.1], [-84.3, 12.2, 0.7, 1.0], [-83.8, 10.5, 0.6, 0.5], [-94.6, 31.5, 0.9, 1.4], [-123.7, 40.9, 0.5, 1.4], [-88.5, 32.0, 3.5, 1.2],
];
export const MARSHES = [
  [-92.4, 18.3, 0.7, 0.35], [-91.4, 18.3, 0.6, 0.35], [-105.5, 22.2, 0.3, 0.4], [-87.7, 19.6, 0.3, 0.5], [-114.95, 32.0, 0.3, 0.4],
  [-90.6, 29.6, 1.2, 0.5], [-81.0, 25.8, 0.6, 0.7], [-83.7, 13.0, 0.35, 1.2], [-81.4, 22.4, 0.5, 0.2],
];

export const LAKES = [
  { name: 'Lake Chapala', pts: [[-103.42, 20.28], [-103.2, 20.33], [-102.95, 20.32], [-102.72, 20.27], [-102.7, 20.15], [-102.95, 20.13], [-103.25, 20.17], [-103.42, 20.2]] },
  { name: 'Lake Cuitzeo', pts: [[-101.3, 19.98], [-101.0, 19.99], [-100.85, 19.92], [-101.0, 19.88], [-101.3, 19.9]] },
  { name: 'Lake Pátzcuaro', pts: [[-101.7, 19.68], [-101.6, 19.67], [-101.58, 19.55], [-101.66, 19.55]] },
  { name: 'Lake Texcoco', pts: [[-99.03, 19.55], [-98.93, 19.56], [-98.92, 19.43], [-99.02, 19.42]] },
  { name: 'Lake Nicaragua', pts: [[-85.95, 11.92], [-85.6, 12.05], [-85.2, 11.75], [-84.85, 11.35], [-84.78, 11.1], [-85.1, 11.05], [-85.5, 11.2], [-85.8, 11.45], [-85.92, 11.7]] },
  { name: 'Lake Managua', pts: [[-86.6, 12.45], [-86.3, 12.5], [-86.1, 12.3], [-86.2, 12.2], [-86.45, 12.25]] },
  { name: 'Lake Izabal', pts: [[-89.4, 15.55], [-89.1, 15.62], [-88.95, 15.5], [-89.15, 15.37], [-89.38, 15.42]] },
  { name: 'Lake Petén Itzá', pts: [[-89.95, 16.98], [-89.7, 17.03], [-89.68, 16.96], [-89.9, 16.93]] },
  { name: 'Great Salt Lake', pts: [[-112.9, 41.6], [-112.4, 41.7], [-112.1, 41.3], [-112.0, 40.8], [-112.3, 40.7], [-112.7, 41.0], [-112.9, 41.3]] },
  { name: 'Utah Lake', pts: [[-111.9, 40.35], [-111.72, 40.3], [-111.75, 40.1], [-111.9, 40.1]] },
  { name: 'Lake Tahoe', pts: [[-120.15, 39.24], [-120.0, 39.24], [-119.95, 39.0], [-120.1, 38.95]] },
  { name: 'Pyramid Lake', pts: [[-119.65, 40.2], [-119.5, 40.2], [-119.45, 39.9], [-119.6, 39.9]] },
  { name: 'Salton Sea', pts: [[-116.1, 33.5], [-115.85, 33.45], [-115.6, 33.2], [-115.7, 33.1], [-115.95, 33.25]] },
  { name: 'Lake Pontchartrain', pts: [[-90.4, 30.1], [-90.3, 30.3], [-90.0, 30.35], [-89.8, 30.2], [-90.0, 30.05]] },
  { name: 'Lake Okeechobee', pts: [[-81.1, 26.95], [-80.75, 27.15], [-80.62, 26.95], [-80.7, 26.72], [-80.95, 26.75]] },
  { name: 'Lake Michigan', pts: [[-87.8, 43.25], [-87.85, 42.5], [-87.6, 41.85], [-87.3, 41.62], [-86.9, 41.75], [-86.5, 42.2], [-86.25, 42.8], [-86.4, 43.25]] },
  { name: 'Lake Erie', pts: [[-83.45, 41.72], [-83.15, 42.03], [-82.5, 41.97], [-81.8, 42.25], [-81.2, 42.65], [-80.45, 42.6], [-80.45, 42.0], [-81.7, 41.5], [-82.7, 41.45]] },
  { name: 'Lake St. Clair', pts: [[-82.9, 42.35], [-82.7, 42.65], [-82.45, 42.55], [-82.45, 42.33]] },
  { name: 'Lake Huron', pts: [[-82.42, 43.0], [-82.5, 43.25], [-81.72, 43.25], [-81.9, 43.05]] },
];
export const RIVERS = [
  { name: 'Río Bravo del Norte', pts: [[-106.9, 37.75], [-105.9, 37.45], [-105.72, 36.5], [-106.1, 35.9], [-106.65, 35.08], [-106.9, 34.06], [-107.2, 33.15], [-106.8, 32.3], [-106.5, 31.75],
    [-105.85, 31.28], [-104.9, 30.6], [-104.4, 29.55], [-103.6, 29.15], [-103.15, 28.97], [-102.85, 29.25], [-102.3, 29.85], [-101.4, 29.75], [-100.9, 29.35], [-100.5, 28.7],
    [-99.5, 27.5], [-99.1, 26.4], [-98.3, 26.07], [-97.5, 25.87], [-97.15, 25.96]] },
  { name: 'Río Colorado', pts: [[-105.85, 40.3], [-106.4, 40.05], [-107.32, 39.55], [-108.55, 39.07], [-109.57, 38.6], [-109.93, 38.19], [-110.4, 37.85], [-111.59, 36.87], [-112.1, 36.1],
    [-113.3, 36.2], [-114.0, 36.1], [-114.74, 36.02], [-114.6, 34.85], [-114.3, 34.15], [-114.6, 33.6], [-114.62, 32.72], [-114.95, 32.3], [-114.8, 31.8]] },
  { name: 'Gila', pts: [[-108.5, 33.2], [-108.9, 32.7], [-109.7, 32.85], [-110.8, 33.1], [-111.4, 33.05], [-112.2, 33.35], [-112.7, 33.0], [-113.6, 32.9], [-114.6, 32.72]] },
  { name: 'Pecos', pts: [[-105.5, 35.6], [-104.68, 34.94], [-104.4, 33.4], [-104.2, 32.4], [-103.5, 31.4], [-102.4, 31.06], [-101.8, 30.7], [-101.37, 29.7]] },
  { name: 'Río Conchos', pts: [[-107.5, 27.8], [-106.6, 27.55], [-105.8, 27.45], [-105.4, 27.55], [-105.17, 27.69], [-105.4, 28.2], [-105.4, 28.45], [-105.0, 29.0], [-104.87, 29.44], [-104.42, 29.57]] },
  { name: 'Río Yaqui', pts: [[-108.9, 30.5], [-109.2, 30.1], [-109.25, 29.6], [-109.35, 29.0], [-109.6, 28.5], [-109.9, 28.0], [-110.1, 27.65], [-110.6, 27.66]] },
  { name: 'Río Fuerte', pts: [[-107.8, 27.0], [-108.2, 26.75], [-108.62, 26.42], [-109.0, 25.9], [-109.42, 25.82]] },
  { name: 'Río Nazas', pts: [[-105.45, 25.4], [-105.0, 25.6], [-104.5, 25.3], [-104.1, 25.23], [-103.43, 25.55], [-103.0, 25.78], [-102.55, 25.75]] },
  { name: 'Río Lerma', pts: [[-99.52, 19.2], [-99.7, 19.6], [-99.95, 19.85], [-100.72, 20.03], [-101.2, 20.57], [-101.6, 20.35], [-102.03, 20.35], [-102.55, 20.28], [-102.72, 20.22]] },
  { name: 'Río Grande de Santiago', pts: [[-102.78, 20.33], [-103.15, 20.55], [-103.3, 20.85], [-103.75, 21.05], [-104.25, 21.3], [-104.7, 21.75], [-105.1, 21.8], [-105.45, 21.63]] },
  { name: 'Río Balsas', pts: [[-98.25, 19.25], [-98.3, 18.75], [-98.75, 18.2], [-99.6, 17.93], [-100.2, 18.1], [-100.67, 18.35], [-101.3, 18.25], [-101.9, 18.3], [-102.15, 17.95]] },
  { name: 'Río Pánuco', pts: [[-99.35, 20.05], [-99.3, 20.8], [-98.95, 21.1], [-98.8, 21.27], [-98.55, 21.75], [-98.18, 22.05], [-97.87, 22.2], [-97.78, 22.27]] },
  { name: 'Río Papaloapan', pts: [[-96.9, 18.0], [-96.12, 18.09], [-95.8, 18.37], [-95.66, 18.61], [-95.76, 18.78]] },
  { name: 'Río Coatzacoalcos', pts: [[-94.7, 16.95], [-95.03, 17.43], [-94.75, 17.7], [-94.55, 17.98], [-94.42, 18.15]] },
  { name: 'Río Grijalva', pts: [[-91.7, 15.5], [-92.1, 15.9], [-92.8, 16.4], [-93.02, 16.7], [-93.6, 17.2], [-93.4, 17.75], [-92.93, 17.99], [-92.65, 18.4], [-92.65, 18.58]] },
  { name: 'Río Usumacinta', pts: [[-90.55, 16.47], [-90.97, 16.9], [-91.3, 17.25], [-91.42, 17.47], [-91.77, 17.74], [-92.14, 18.09], [-92.5, 18.3], [-92.65, 18.4]] },
  { name: 'Río Motagua', pts: [[-91.0, 14.95], [-90.3, 14.9], [-89.55, 14.98], [-89.1, 15.25], [-88.6, 15.55], [-88.25, 15.72]] },
  { name: 'Río Coco', pts: [[-86.5, 13.55], [-85.82, 13.62], [-85.2, 14.2], [-84.6, 14.7], [-83.97, 14.74], [-83.15, 15.0]] },
  { name: 'Río San Juan', pts: [[-84.78, 11.1], [-84.4, 11.02], [-83.95, 10.75], [-83.7, 10.93]] },
  { name: 'Sacramento', pts: [[-122.4, 40.6], [-122.0, 39.7], [-121.5, 38.58], [-121.9, 38.05]] },
  { name: 'San Joaquin', pts: [[-119.7, 37.0], [-120.5, 36.95], [-120.9, 37.35], [-121.3, 37.95], [-121.9, 38.05]] },
  { name: 'Arkansas', pts: [[-106.3, 39.25], [-106.0, 38.53], [-105.2, 38.45], [-104.6, 38.27], [-103.55, 38.0], [-102.0, 38.05], [-100.0, 37.75], [-98.75, 38.35], [-97.33, 37.69], [-95.98, 36.15],
    [-94.4, 35.39], [-92.27, 34.75], [-91.07, 33.78]] },
  { name: 'Red River', pts: [[-101.8, 34.95], [-100.0, 34.56], [-98.5, 34.1], [-96.55, 33.8], [-95.0, 33.9], [-94.05, 33.55], [-93.75, 32.5], [-92.45, 31.3], [-91.75, 31.0]] },
  { name: 'Sabine', pts: [[-95.5, 32.6], [-94.4, 32.4], [-94.0, 31.97], [-93.6, 31.0], [-93.85, 29.75]] },
  { name: 'Brazos', pts: [[-99.0, 33.0], [-98.0, 32.6], [-97.13, 31.55], [-96.5, 30.6], [-96.0, 29.7], [-95.35, 28.9]] },
  { name: 'Colorado of Texas', pts: [[-100.5, 31.9], [-98.9, 31.2], [-97.74, 30.27], [-96.5, 29.6], [-96.0, 28.65]] },
  { name: 'Nueces', pts: [[-100.1, 29.9], [-99.24, 28.44], [-98.2, 28.4], [-97.6, 27.85]] },
  { name: 'Mississippi', pts: [[-91.2, 43.2], [-90.6, 41.5], [-91.4, 40.4], [-90.2, 38.63], [-89.15, 37.0], [-90.07, 35.15], [-91.1, 33.3], [-90.9, 32.35], [-91.4, 31.55], [-91.19, 30.45], [-90.07, 29.95], [-89.25, 29.15]] },
  { name: 'Missouri', pts: [[-96.4, 42.5], [-95.93, 41.26], [-94.6, 39.1], [-92.2, 38.6], [-90.2, 38.8]] },
  { name: 'Ohio', pts: [[-80.6, 40.6], [-81.6, 39.3], [-82.6, 38.5], [-84.5, 39.1], [-85.75, 38.25], [-87.6, 37.9], [-89.15, 37.0]] },
];

// Railways. stage 0 = running in 1936; 1–4 = built later (most of them in fact were, between 1940 and 1961).
export const RAILWAYS = [
  { name: 'Ferrocarril Mexicano', stage: 0, via: ['Mexico City', [-98.14, 19.42], [-97.4, 18.88], 'Orizaba', [-96.93, 18.89], [-96.55, 18.95], 'Veracruz'] },
  { name: 'Ferrocarril Interoceánico', stage: 0, via: ['Mexico City', 'Puebla', 'Perote', 'Xalapa', 'Veracruz'] },
  { name: 'Ferrocarril Central Mexicano', stage: 0, via: ['Mexico City', 'Tula', [-100.0, 20.39], 'Querétaro', 'Celaya', 'Irapuato', 'León', 'Lagos de Moreno', 'Aguascalientes', 'Zacatecas', 'Fresnillo',
    [-102.75, 23.6], [-103.1, 24.5], 'Torreón', [-103.62, 25.9], [-104.35, 26.75], 'Jiménez', [-105.17, 27.69], [-105.47, 28.19], 'Chihuahua', [-106.51, 30.62], 'Ciudad Juárez'] },
  { name: 'Ferrocarril Nacional de México', stage: 0, via: ['Mexico City', 'Toluca', [-99.87, 19.8], 'Acámbaro', 'Celaya', [-100.74, 20.91], [-100.93, 21.16], 'San Luis Potosí', [-101.11, 23.13], [-100.95, 23.88],
    'Saltillo', 'Monterrey', [-100.43, 26.5], [-100.52, 27.03], 'Nuevo Laredo'] },
  { name: 'Ferrocarril Sud-Pacífico de México', stage: 0, via: ['Nogales', [-110.96, 30.63], 'Hermosillo', 'Guaymas', 'Ciudad Obregón', 'Navojoa', [-108.76, 26.08], [-108.08, 25.46], 'Culiacán', [-106.89, 23.92], 'Mazatlán',
    [-105.78, 22.83], 'Acaponeta', 'Tepic', [-104.37, 21.03], 'Tequila', 'Guadalajara'] },
  { name: 'Ferrocarril Nacional de Tehuantepec', stage: 0, via: ['Puerto México', 'Jesús Carranza', [-95.04, 16.88], 'Ixtepec', 'Salina Cruz'] },
  { name: 'Ferrocarril Panamericano', stage: 0, via: ['Ixtepec', 'Tonalá', [-93.21, 15.69], 'Tapachula'] },
  { name: 'Ferrocarril de Veracruz al Istmo', stage: 0, via: ['Veracruz', 'Tierra Blanca', [-95.4, 18.0], 'Jesús Carranza'] },
  { name: 'Ferrocarril Internacional Mexicano', stage: 0, via: ['Durango', [-103.95, 24.75], 'Torreón', [-102.2, 25.9], 'Monclova', 'Sabinas', 'Piedras Negras'] },
  { name: 'Guadalajara & Manzanillo Line', stage: 0, via: ['Irapuato', [-102.03, 20.34], 'Ocotlán', 'Guadalajara', 'Ciudad Guzmán', 'Colima', 'Manzanillo'] },
  { name: 'Ferrocarril del Golfo', stage: 0, via: ['Matamoros', 'Reynosa', 'Monterrey', [-99.83, 25.19], 'Linares', 'Ciudad Victoria', [-98.6, 22.75], 'Tampico'] },
  { name: 'San Luis Potosí & Tampico Line', stage: 0, via: ['Aguascalientes', [-101.71, 22.63], 'San Luis Potosí', [-99.65, 22.0], 'Ciudad Valles', [-98.4, 22.15], 'Tampico'] },
  { name: 'Ferrocarril Mexicano del Sur', stage: 0, via: ['Puebla', 'Tehuacán', [-97.07, 18.13], [-96.95, 17.7], 'Oaxaca'] },
  { name: 'Cuernavaca & Balsas Line', stage: 0, via: ['Mexico City', 'Cuernavaca', 'Iguala'] },
  { name: 'Michoacán Line', stage: 0, via: ['Acámbaro', 'Morelia', [-101.61, 19.51], 'Uruapan'] },
  { name: 'Kansas City, México y Oriente', stage: 0, via: ['Ojinaga', 'Chihuahua', 'Cuauhtémoc', 'Creel'] },
  { name: 'Ferrocarril Noroeste de México', stage: 0, via: ['Ciudad Juárez', 'Nuevo Casas Grandes', 'Madera', [-107.48, 28.55], 'Cuauhtémoc'] },
  { name: 'Ferrocarriles Unidos de Yucatán', stage: 0, via: ['Campeche', [-90.0, 20.58], 'Mérida', [-89.02, 20.93], 'Valladolid'] },
  { name: 'Progreso & Peto Lines', stage: 0, via: ['Progreso', 'Mérida', [-89.53, 20.4], 'Peto'] },
  { name: 'Coahuila y Pacífico', stage: 0, via: ['Torreón', 'Parras', 'Saltillo'] },
  { name: 'Durango & Zacatecas Line', stage: 0, via: ['Fresnillo', 'Sombrerete', [-103.98, 23.73], 'Durango'] },
  { name: 'Ferrocarril del Sureste', stage: 1, via: ['Puerto México', [-93.37, 18.0], [-93.12, 17.51], 'Palenque', 'Tenosique', [-90.74, 18.61], 'Champotón', 'Campeche'] },
  { name: 'Tijuana & Mexicali Line', stage: 1, via: ['Tijuana', [-116.63, 32.56], [-116.0, 32.6], 'Mexicali'] },
  { name: 'Apatzingán Extension', stage: 1, via: ['Uruapan', 'Apatzingán'] },
  { name: 'Ferrocarril Sonora–Baja California', stage: 2, via: ['Mexicali', 'San Luis Río Colorado', 'Puerto Peñasco', 'Caborca', [-111.1, 30.17], 'Hermosillo'] },
  { name: 'Huasteca Line', stage: 2, via: ['Mexico City', 'Pachuca', 'Tulancingo', [-98.05, 20.18], 'Poza Rica', 'Tuxpan', [-97.6, 21.5], 'Tampico'] },
  { name: 'Ferrocarril Chihuahua al Pacífico', stage: 3, via: ['Creel', [-108.26, 27.27], 'El Fuerte', 'Los Mochis'] },
  { name: 'Acapulco Line', stage: 3, via: ['Iguala', 'Chilpancingo', 'Acapulco'] },
  { name: 'Durango–Mazatlán Line', stage: 4, via: ['Durango', 'El Salto', [-105.9, 23.5], 'Mazatlán'] },
  { name: 'Quintana Roo Line', stage: 4, via: ['Peto', 'Felipe Carrillo Puerto', [-88.39, 18.68], 'Chetumal'] },
  { name: 'Balsas Coast Line', stage: 4, via: ['Apatzingán', [-102.29, 18.36], [-102.2, 18.0]] },
];

export const SEA_LABELS = [
  ['GULF OF MEXICO', -90.3, 25.2, 1.4], ['PACIFIC OCEAN', -113.5, 18.5, 1.5], ['CARIBBEAN SEA', -83.6, 18.3, 1.2], ['Gulf of California', -110.9, 26.7, 0.6, 48],
  ['Bay of Campeche', -94.4, 20.2, 0.8], ['Gulf of Tehuantepec', -94.8, 14.9, 0.7], ['Gulf of Honduras', -87.3, 16.75, 0.55], ['Yucatán Channel', -85.7, 21.6, 0.55],
  ['Straits of Florida', -82.2, 24.1, 0.55],
];
export const COUNTRY_LABELS = [['USA', 'UNITED STATES', -99.5, 39.4, 19], ['GUA', 'GUATEMALA', -90.3, 15.95, 8], ['HON', 'HONDURAS', -86.6, 15.0, 9], ['NIC', 'NICARAGUA', -85.1, 12.9, 9],
  ['COS', 'COSTA RICA', -84.3, 10.5, 7], ['CUB', 'CUBA', -82.6, 22.65, 9], ['CAN', 'CANADA', -81.6, 42.85, 8]];
export const HOME_LABEL = [-102.6, 24.3];

// The First Mexican Empire, 1822: north to the 42nd parallel and the Adams–Onís line, south to the province of Costa Rica
export const EMPIRE = [[-124.4, 42.0], [-118, 42.0], [-112, 42.0], [-106.35, 42.0], [-106.3, 39.25], [-106.0, 38.53], [-104.6, 38.27], [-103.55, 38.0], [-102.0, 38.05], [-100.0, 37.75],
  [-100.0, 34.56], [-98.5, 34.1], [-96.55, 33.8], [-95.0, 33.9], [-94.05, 33.55], [-94.05, 32.0], [-93.6, 31.0], [-93.85, 29.7], [-94.6, 28.7], [-96.4, 27.3], [-96.7, 25.2],
  [-97.1, 23.0], [-96.9, 21.0], [-95.5, 19.2], [-93.8, 19.0], [-92.0, 19.3], [-91.1, 20.5], [-90.6, 21.6], [-88.5, 22.0], [-86.4, 21.8], [-86.3, 20.0], [-87.2, 18.5], [-87.5, 17.0],
  [-87.9, 16.4], [-86.0, 16.75], [-84.0, 16.3], [-82.8, 15.2], [-82.9, 13.0], [-83.3, 11.0], [-82.4, 9.7], [-82.95, 8.9], [-82.75, 8.0], [-84.0, 8.1], [-86.2, 9.5], [-86.3, 11.0],
  [-88.0, 12.6], [-90.5, 13.3], [-92.8, 14.0], [-95.0, 15.4], [-97.5, 15.3], [-100.5, 16.5], [-103.5, 17.8], [-105.5, 19.0], [-106.2, 21.0], [-107.6, 22.6], [-109.6, 22.4],
  [-111.2, 23.3], [-113.0, 24.9], [-115.5, 27.5], [-116.5, 29.5], [-117.7, 32.0], [-119.5, 33.2], [-121.5, 34.3], [-122.5, 36.5], [-123.4, 38.0], [-124.6, 40.3]];

export const FLEET_AT = { gulf: [-95.3, 20.3], pacific: [-100.6, 15.9], 'enemy:glf': [-94.6, 27.7], 'enemy:car': [-86.4, 17.9], 'enemy:pac': [-88.3, 11.5] };

export const META = {
  name: 'Mexico',
  long: 'United Mexican States',
  empire: 'Mexican Empire',
  year: 1936,
  blurb: 'Seven fronts from Alta California to Costa Rica. Restore the empire of the Three Guarantees.',
  pitch: 'a 1936 grand-strategy war map of Mexico',
  flag: { type: 'v3', colors: ['#2f7d55', '#efeadb', '#c0392b'], disc: '#8a6a3a' },
  regionWord: 'Provincia',
  // 1936 region → what it was called in 1821, under the Californias, the Provincias Internas and the Capitanía General de Guatemala
  regions: {
    'Southern California': 'San Diego y Los Ángeles', 'Central Coast': 'Monterey', 'Northern California': 'San Francisco y Sonoma', 'Nevada': 'la Tierra Adentro de California',
    'Southern Arizona': 'la Pimería Alta', 'Northern Arizona': 'Moqui', 'New Mexico': 'Santa Fe de Nuevo México', 'Southern New Mexico': 'El Paso del Norte', 'Trans-Pecos': 'Presidio del Norte',
    'Utah': 'la Laguna de los Timpanogos', 'Colorado': 'la Sierra de las Grullas', 'Southern Wyoming': 'el Río Verde',
    'San Antonio & the Hill Country': 'San Antonio de Béxar', 'South Texas': 'Nuevo Santander', 'West Texas': 'el Llano Estacado', 'Western Oklahoma': 'el Río Rojo',
    'Coastal Bend': 'La Bahía del Espíritu Santo', 'Brazos Valley': 'los Brazos de Dios', 'Galveston Bay': 'Galveston', 'East Texas': 'Nacogdoches', 'North Texas': 'el Río Trinidad',
    'Guatemala': 'Santiago de Guatemala', 'Los Altos': 'Quetzaltenango', 'Costa Sur': 'Suchitepéquez', 'Verapaz': 'la Verapaz', 'Oriente': 'Chiquimula de la Sierra', 'Izabal': 'el Golfo Dulce', 'Petén': 'el Petén',
    'San Salvador': 'San Salvador', 'Sonsonate': 'Sonsonate', 'San Miguel': 'San Miguel',
    'Comayagua': 'Comayagua', 'Tegucigalpa': 'Tegucigalpa', 'Copán': 'Gracias a Dios', 'Costa Norte': 'Omoa y Trujillo', 'Olancho': 'Olancho', 'Mosquitia': 'la Taguzgalpa',
    'León': 'León', 'Granada': 'Granada', 'Segovia': 'Nueva Segovia', 'Chontales': 'Chontales', 'Mosquito Coast': 'la Tologalpa',
    'Meseta Central': 'Cartago', 'Guanacaste': 'Nicoya', 'Puntarenas': 'Esparza', 'Limón': 'Matina',
    'Northern District': 'el Río Hondo', 'Belize': 'Walis',
  },
  capitalFalls: 'The government withdraws to Querétaro. The war goes on.',
  capitalFreed: 'Mexico City is free again. The government returns to the National Palace.',
  fightsOnFrom: 'Querétaro',
  honor: {
    cal: ['Baja California', 'Tijuana', 'Mexicali', 'Ensenada', 'La Paz', 'Tecate', 'Loreto', 'San Felipe', 'Santa Rosalía', 'Cortés'],
    nmx: ['Chihuahua', 'Sonora', 'Ciudad Juárez', 'Hermosillo', 'Parral', 'Nogales', 'Casas Grandes', 'Cananea', 'Tarahumara', 'Ojinaga'],
    tex: ['Nuevo León', 'Coahuila', 'Tamaulipas', 'Monterrey', 'Saltillo', 'Matamoros', 'Nuevo Laredo', 'Piedras Negras', 'Monclova', 'La Laguna'],
    gua: ['Chiapas', 'Tabasco', 'Soconusco', 'Tuxtla', 'Comitán', 'Tapachula', 'San Cristóbal', 'Tenosique', 'Grijalva', 'Usumacinta'],
    glf: ['Veracruz', 'Tampico', 'Tuxpan', 'Huasteca', 'Papaloapan', 'Xalapa', 'Alvarado', 'Sotavento', 'Pánuco', 'Ulúa'],
    car: ['Yucatán', 'Campeche', 'Quintana Roo', 'Mérida', 'Chetumal', 'Valladolid', 'Progreso', 'Bacalar', 'Mayab', 'Tulum'],
    pac: ['Guerrero', 'Oaxaca', 'Acapulco', 'Tehuantepec', 'Salina Cruz', 'Costa Chica', 'Mixteca', 'Juchitán', 'Costa Grande', 'Istmo'],
  },
  commanders: {
    cal: 'Gen. Anselmo Bringas Oseguera', nmx: 'Gen. Rodolfo Urquidi Luján', tex: 'Gen. Eusebio Cantú Arredondo', gua: 'Gen. Crisóforo Balderas Montaño',
    glf: 'Adm. Leandro Zamudio Rentería', car: 'Adm. Hilario Pech Novelo', pac: 'Adm. Teodoro Villaseñor Galindo',
  },
  oob: {
    cal: ['inf', 'cav', 'art'], nmx: ['inf', 'cav', 'cav', 'mtn'], tex: ['inf', 'inf', 'cav', 'mot'], gua: ['inf', 'mtn', 'inf', 'art'],
    glf: ['mar', 'inf', 'art'], car: ['mar', 'inf', 'cav'], pac: ['mar', 'mtn', 'inf'],
  },
  guard: [['grd', '1st Presidential Guards Division “Guardias Presidenciales”'], ['arm', '1st Mechanised Brigade “Chapultepec”']],
  officerNames: {
    first: ['Anselmo', 'Rodolfo', 'Eusebio', 'Crisóforo', 'Leandro', 'Hilario', 'Teodoro', 'Gumersindo', 'Macario', 'Librado', 'Epifanio', 'Nicanor', 'Refugio', 'Aurelio', 'Ponciano', 'Fidencio'],
    last: ['Bringas', 'Urquidi', 'Cantú', 'Balderas', 'Zamudio', 'Pech', 'Villaseñor', 'Arredondo', 'Rentería', 'Luján', 'Oseguera', 'Montaño', 'Galindo', 'Novelo', 'Tamez', 'Xicoténcatl'],
    ranks: { div: 'Gral. Brig.', bde: 'Cor.', guard: 'Gral. de Div.' },
  },
  // the Fuerza Aérea Mexicana of 1936 flew two air regiments of Corsairs and Douglas observation bombers from Balbuena
  wings: [
    { name: '1er Regimiento Aéreo (Balbuena)', type: 'fighter', model: 'Vought O2U-4A Corsair', base: 'Mexico City', planes: 24 },
    { name: '2º Regimiento Aéreo', type: 'bomber', model: 'Douglas O-2M', base: 'Guadalajara', planes: 12 },
    { name: 'Escuadrón Aéreo del Norte', type: 'cas', model: 'Azcárate O-E-1', base: 'Monterrey', planes: 12 },
    { name: 'Escuadrón Aéreo del Sureste', type: 'cas', model: 'Vought O2U-4A Corsair', base: 'Mérida', planes: 12 },
  ],
  newWingModels: { fighter: 'Republic P-47D Thunderbolt', cas: 'North American AT-6 Texan', bomber: 'Douglas A-24B Banshee' },
  fleets: [
    { id: 'gulf', name: 'Flota del Golfo', base: 'Veracruz', sea: 'Gulf of Mexico', fronts: ['glf', 'car', 'tex', 'gua'],
      ships: [['Anáhuac', 'Coastal defence ship'], ['Querétaro', 'Gunboat'], ['Guanajuato', 'Gunboat'], ['Nicolás Bravo', 'Gunboat'], ['G-20', 'Coast guard cutter'], ['G-21', 'Coast guard cutter'], ['G-22', 'Coast guard cutter']] },
    { id: 'pacific', name: 'Flota del Pacífico', base: 'Acapulco', sea: 'Pacific Ocean', fronts: ['pac', 'cal', 'nmx'],
      ships: [['Durango', 'Transport gunboat'], ['Potosí', 'Gunboat'], ['Progreso', 'Transport'], ['G-25', 'Coast guard cutter'], ['G-26', 'Coast guard cutter'], ['G-27', 'Coast guard cutter']] },
  ],
  shipNames: ['Zaragoza', 'Tampico', 'Veracruz', 'Sonora', 'Chihuahua', 'Yucatán', 'Tabasco', 'Jalisco', 'Oaxaca', 'Guerrero', 'Morelos', 'Hidalgo', 'Allende', 'Aldama', 'Matamoros', 'Mina',
    'Galeana', 'Cuauhtémoc', 'Netzahualcóyotl', 'Cuitláhuac', 'Independencia', 'Libertad', 'Tehuantepec', 'Usumacinta'],
  operations: ['Águila', 'Quetzalcóatl', 'Huitzilopochtli', 'Tenochtitlan', 'Anáhuac', 'Chapultepec', 'Cinco de Mayo', 'Grito de Dolores', 'Trigarante', 'Iguala', 'Aztlán', 'Tezcatlipoca',
    'Nopal', 'Serpiente Emplumada', 'Popocatépetl', 'Quinto Sol'],
  enemyOperations: ['Rattlesnake', 'Lone Star', 'Bear Flag', 'Buena Vista', 'Rough Rider', 'Mesquite', 'Longhorn', 'Sabine', 'Bluebonnet', 'Union Jack', 'Mahogany', 'Quetzal'],
  nicknames: ['Águilas', 'Jaguares', 'Dorados', 'Leones', 'Coyotes', 'Centauros', 'Serpientes', 'Lobos'],
  // [infrastructure 0–5, civilian factories, military factories, dockyards]
  stateStart: {
    'Baja California': [1, 0, 0, 0], 'Sonora': [2, 1, 0, 0], 'Sinaloa & Nayarit': [2, 1, 0, 0], 'Chihuahua': [2, 1, 0, 0], 'Coahuila & Durango': [3, 1, 0, 0],
    'Nuevo León & Tamaulipas': [3, 3, 1, 1], 'Zacatecas & San Luis Potosí': [3, 1, 0, 0], 'Jalisco & Colima': [3, 2, 1, 0], 'El Bajío & Michoacán': [3, 2, 0, 0],
    'Valley of Mexico & Puebla': [4, 5, 3, 0], 'Veracruz': [3, 2, 0, 1], 'Oaxaca & the South': [1, 0, 0, 1], 'Chiapas & Tabasco': [1, 0, 0, 0], 'Yucatán': [2, 1, 0, 0],
  },
  weather: { cal: 'heat', nmx: 'snow', tex: 'heat', gua: 'heat', car: 'heat', pac: 'heat' },
  enemyAdjectives: { USA: 'American', GUA: 'Guatemalan', GBR: 'British', NIC: 'Nicaraguan', ELS: 'Salvadoran', HON: 'Honduran', COS: 'Costa Rican' },
  ranks: [['Soldado', 'Private'], ['Cabo', 'Corporal'], ['Sargento', 'Sergeant'], ['Subteniente', 'Second Lieutenant'], ['Teniente', 'Lieutenant'], ['Capitán', 'Captain'], ['Mayor', 'Major'],
    ['Teniente Coronel', 'Lieutenant Colonel'], ['Coronel', 'Colonel'], ['General Brigadier', 'Brigadier General'], ['General de Brigada', 'Brigade General'], ['General de División', 'Divisional General']],
  landmarks: [
    { city: 'San Antonio', medal: 'Cruz de Béxar', desc: 'Enter San Antonio de Béxar' },
    { city: 'Santa Fe', medal: 'Camino Real', desc: 'Reach Santa Fe, the northern end of the Camino Real de Tierra Adentro' },
  ],
  medalNames: {
    first: 'Bautismo de Fuego', ten: 'Cruz de Guerra', fifty: 'Legión de Honor', decisive: 'Valor Heroico', week: 'Mérito Militar', month: 'Condecoración de Perseverancia',
    abroad: 'Más Allá del Bravo', phoenix: 'Serpiente Emplumada', allfronts: 'Siete Estandartes', defender: 'Defensor de Chapultepec', satrap: 'Jefe Político',
    comeback: 'Sitio de Cuautla', thirty: 'Crónica de Hierro', empire: 'Orden Imperial de Guadalupe', orders7: 'Colegio Militar', haftkhan: 'Chicomoztoc',
    rasti: 'Palabra de Honor', quiet14: 'El Frente Olvidado', qanat: 'Chinampero', hundred: 'Códice', hundreddays: 'Piedra del Sol', year: 'Fuego Nuevo',
    operation: 'Estandarte de Guerra', elite: 'Caballeros Águila', kaveh: 'El Águila sobre el Nopal',
  },
  masthead: 'EL HERALDO DEL EJÉRCITO',
  days: [
    { month: 9, day: 16, text: '¡Viva México! Independence Day on every front.' },
    { month: 5, day: 5, text: 'Cinco de Mayo. Puebla held in 1862; the line holds today.' },
    { month: 2, day: 24, text: 'Día de la Bandera. The tricolour of Iguala flies over every front.' },
    { month: 11, day: 20, text: 'Revolution Day. The army parades through the Zócalo.' },
  ],
  motto: 'Religión, Independencia, Unión — the Three Guarantees of Iguala, 1821.',
};
