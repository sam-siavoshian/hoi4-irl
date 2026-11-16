// Peru, 1936. Restore Tawantinsuyu, the Inca realm of the four quarters, at its height (c. 1525).
// Coordinates are [lon, lat]. City tuple: [name, lon, lat, vp?, flags?]
// flags: P port, N naval base, A airbase, S supply hub, R refinery/oil/heavy industry, F fort, C capital
//
// Borders: Natural Earth modern polygons. Approximations against 1936, all deliberate:
//  - Peru–Ecuador: in 1936 the whole frontier from the Zarumilla to the Putumayo was in dispute (the Lima Act of July
//    1936 only froze a status quo line). The modern line of the 1942 Rio Protocol is used; it is close to the 1936
//    line of actual possession.
//  - Peru–Colombia: the Salomón–Lozano line (in force from 1928, confirmed by the 1934 Rio de Janeiro Protocol after
//    the Leticia conflict) is the modern border. Leticia is Colombian.
//  - Peru–Chile: Tacna came back to Peru in 1929, Arica stayed Chilean; this is the modern border.
//  - Bolivia–Paraguay: the Chaco War ended in June 1935 and the border was only fixed in 1938; the modern (1938)
//    line is used.
//  - Brazilian federal territories (Acre, later Guaporé and Rio Branco) are simply part of Brazil.
//  - British Guiana and Surinam are the modern Guyana and Suriname polygons. The Galápagos lie west of the map.

export const ID = 'peru';
export const HOME = 'PER';
export const CAPITAL = 'Lima';
export const EXTENT = { lon0: -88.5, lon1: -55, lat0: -37.5, lat1: 5.2 };

export const COUNTRIES = {
  PER: { name: 'Peru', long: 'Republic of Peru', color: '#b5483f', from: ['Peru'], spacing: 0.8 },
  ECU: { name: 'Ecuador', long: 'Republic of Ecuador', color: '#c2a546', from: ['Ecuador'], spacing: 0.75 },
  COL: { name: 'Colombia', long: 'Republic of Colombia', color: '#b08a3c', from: ['Colombia'], spacing: 1.0 },
  BRA: { name: 'Brazil', long: 'Republic of the United States of Brazil', color: '#5f9463', from: ['Brazil'], spacing: 1.5 },
  BOL: { name: 'Bolivia', long: 'Republic of Bolivia', color: '#7f9a4e', from: ['Bolivia'], spacing: 1.0 },
  CHL: { name: 'Chile', long: 'Republic of Chile', color: '#5b78a8', from: ['Chile'], spacing: 0.85 },
  ARG: { name: 'Argentina', long: 'Argentine Republic', color: '#7fa9c9', from: ['Argentina'], spacing: 1.3 },
  PRY: { name: 'Paraguay', long: 'Republic of Paraguay', color: '#a86a5a', from: ['Paraguay'], spacing: 1.7 },
  URY: { name: 'Uruguay', long: 'Oriental Republic of Uruguay', color: '#8f8fb5', from: ['Uruguay'], spacing: 1.8 },
  VEN: { name: 'Venezuela', long: 'United States of Venezuela', color: '#a8914f', from: ['Venezuela'], spacing: 1.8 },
  BGU: { name: 'British Guiana', long: 'Colony of British Guiana', color: '#b0586a', from: ['Guyana'], spacing: 1.8 },
  DGU: { name: 'Surinam', long: 'Colony of Surinam (Netherlands)', color: '#c98a4a', from: ['Suriname'], spacing: 1.8 },
};

// The departments of 1936, grouped. Pasco was still part of Junín (until 1944) and Ucayali part of Loreto (until 1980);
// Callao is counted with Lima. Tumbes was a littoral province.
export const HOME_STATES = {
  'Piura & Tumbes': [
    ['Piura', -80.63, -5.19, 10, 'AS'], ['Talara', -81.27, -4.58, 10, 'PR'], ['Paita', -81.11, -5.09, 5, 'PN'], ['Tumbes', -80.45, -3.57, 3],
    ['Zarumilla', -80.27, -3.5, 1, 'F'], ['Sullana', -80.69, -4.9, 3], 
    ['Suyo', -80.0, -4.51, 1, 'F'], ['Ayabaca', -79.71, -4.64, 1], ['Huancabamba', -79.45, -5.24, 1], ['Sechura', -80.82, -5.56, 1],
    
  ],
  'Lambayeque & La Libertad': [
    ['Trujillo', -79.03, -8.11, 15], ['Chiclayo', -79.84, -6.77, 10, 'AS'], ['Salaverry', -78.98, -8.22, 3, 'P'], 
    ['Pacasmayo', -79.57, -7.4, 3, 'P'], ['Chepén', -79.43, -7.23, 1], ['Olmos', -79.75, -5.99, 1], 
    ['Ascope', -79.11, -7.71, 1], ['Otuzco', -78.57, -7.9, 1], ['Huamachuco', -78.05, -7.81, 3], 
    ['Tayabamba', -77.3, -8.28, 1],
  ],
  'Cajamarca & Amazonas': [
    ['Cajamarca', -78.51, -7.16, 10], ['Jaén', -78.81, -5.71, 3], ['San Ignacio', -79.0, -5.15, 1, 'F'], ['Chota', -78.65, -6.56, 1],
    ['Celendín', -78.14, -6.87, 1], ['Cajabamba', -78.05, -7.62, 1], 
    ['Chachapoyas', -77.87, -6.23, 5], ['Bagua', -78.53, -5.64, 1], ['Santa María de Nieva', -77.87, -4.59, 1],
    
  ],
  'San Martín': [
    ['Moyobamba', -76.97, -6.03, 5], ['Tarapoto', -76.37, -6.49, 3], ['Juanjuí', -76.73, -7.18, 1],
    ['Tocache', -76.51, -8.19, 1],
  ],
  'Loreto': [
    ['Iquitos', -73.25, -3.75, 15, 'PNAS'], ['Nauta', -73.58, -4.51, 1], ['Requena', -73.86, -5.06, 1], ['Yurimaguas', -76.09, -5.9, 3],
    ['Pucallpa', -74.55, -8.38, 3, 'S'], ['Contamana', -75.01, -7.35, 1], 
    ['Atalaya', -73.76, -10.73, 1], ['San Lorenzo', -76.56, -4.83, 1],
    ['Borja', -77.55, -4.47, 1, 'F'], ['Andoas', -76.4, -2.9, 1, 'F'], ['Santa Clotilde', -73.68, -2.49, 1],
    ['Pantoja', -75.21, -0.97, 1, 'F'], ['Güeppí', -75.25, -0.12, 1, 'F'], ['El Estrecho', -72.67, -2.45, 1, 'F'], ['Pebas', -71.86, -3.32, 1],
    ['Caballococha', -70.52, -3.91, 1, 'F'], ['Esperanza', -70.72, -9.77, 1],
  ],
  'Ancash': [
    ['Huaraz', -77.53, -9.53, 5], ['Chimbote', -78.58, -9.08, 3, 'P'], ['Casma', -78.3, -9.47, 1], ['Caraz', -77.81, -9.05, 1],
    ['Huarmey', -78.15, -10.07, 1], ['Chavín de Huántar', -77.18, -9.59, 3], ['Pomabamba', -77.46, -8.82, 1], 
    
  ],
  'Huánuco': [
    ['Huánuco', -76.24, -9.93, 5], ['Tingo María', -76.0, -9.3, 1], ['Puerto Inca', -74.96, -9.38, 1],
    ['Pozuzo', -75.55, -10.07, 1],
  ],
  'Junín': [
    ['Huancayo', -75.21, -12.07, 10, 'S'], ['Cerro de Pasco', -76.26, -10.68, 10, 'R'], ['La Oroya', -75.9, -11.52, 5, 'R'], ['Jauja', -75.5, -11.78, 3],
    ['Tarma', -75.69, -11.42, 3], ['Junín', -75.99, -11.16, 1], ['San Ramón', -75.35, -11.12, 1, 'A'], ['Oxapampa', -75.4, -10.58, 1],
    ['Satipo', -74.64, -11.25, 1], 
  ],
  'Lima': [
    ['Lima', -77.04, -12.05, 50, 'CAS'], ['Callao', -77.15, -12.06, 15, 'PNF'], ['Ancón', -77.17, -11.77, 1, 'A'], ['Huacho', -77.61, -11.11, 3],
    ['Chancay', -77.27, -11.56, 1], ['Barranca', -77.76, -10.75, 1], 
    ['Canta', -76.62, -11.47, 1], ['Matucana', -76.38, -11.84, 1], 
    ['Cañete', -76.39, -13.08, 3], 
  ],
  'Ica & Huancavelica': [
    ['Ica', -75.73, -14.07, 5], ['Pisco', -76.2, -13.71, 3, 'P'], ['Chincha Alta', -76.13, -13.41, 3], 
    ['Nazca', -74.94, -14.83, 3], ['San Juan de Marcona', -75.16, -15.36, 1], ['Huancavelica', -74.97, -12.79, 5], 
    
  ],
  'Ayacucho & Apurímac': [
    ['Ayacucho', -74.22, -13.16, 10], ['Puquio', -74.12, -14.69, 1],
    ['Coracora', -73.78, -15.02, 1], ['Abancay', -72.88, -13.63, 5], ['Andahuaylas', -73.39, -13.66, 3], ['Chalhuanca', -73.24, -14.29, 1],
    
  ],
  'Cuzco & Madre de Dios': [
    ['Cuzco', -71.97, -13.52, 20, 'AS'], ['Ollantaytambo', -72.26, -13.26, 3], ['Machu Picchu', -72.55, -13.16, 5], ['Quillabamba', -72.69, -12.86, 1],
    ['Sicuani', -71.23, -14.27, 3], 
    ['Yauri', -71.41, -14.79, 1], ['Quince Mil', -70.75, -13.23, 1], ['Manu', -71.37, -12.27, 1], ['Puerto Maldonado', -69.18, -12.6, 3, 'S'],
    ['Iñapari', -69.59, -10.95, 1, 'F'], ['Puerto Heath', -68.75, -12.52, 1, 'F'],
  ],
  'Arequipa': [
    ['Arequipa', -71.54, -16.4, 20, 'AS'], ['Mollendo', -72.02, -17.03, 5, 'P'], ['Camaná', -72.71, -16.62, 3], 
    ['Chivay', -71.6, -15.64, 1], ['Cotahuasi', -72.89, -15.21, 1], ['Caravelí', -73.37, -15.77, 1], 
    ['Chala', -74.25, -15.87, 1], 
  ],
  'Puno': [
    ['Puno', -70.02, -15.84, 10], ['Juliaca', -70.13, -15.49, 5, 'S'], ['Ayaviri', -70.59, -14.88, 1], 
    ['Moho', -69.5, -15.36, 1], ['Juli', -69.46, -16.21, 1],
    ['Yunguyo', -69.09, -16.25, 1], ['Desaguadero', -69.04, -16.57, 1, 'F'], ['Macusani', -70.43, -14.07, 1],
    ['Sandia', -69.47, -14.32, 1],
  ],
  'Moquegua & Tacna': [
    ['Tacna', -70.25, -18.01, 10, 'AF'], ['Moquegua', -70.93, -17.19, 3], ['Ilo', -71.34, -17.64, 3, 'P'], ['Tarata', -70.03, -17.47, 1, 'F'],
    ['Palca', -69.96, -17.78, 1], ['Locumba', -70.76, -17.61, 1], 
  ],
};

// Foreign cities by country tag → region → cities. Regions are the units that are restored (see META.regions for
// the names they carried, or might have carried, under the Inca).
export const FOREIGN = {
  ECU: {
    'Pichincha & the Northern Sierra': [['Quito', -78.51, -0.22, 20], ['Latacunga', -78.62, -0.93, 3], ['Ambato', -78.62, -1.24, 3], ['Riobamba', -78.65, -1.67, 5],
      ['Guaranda', -79.0, -1.59, 1], ['Ibarra', -78.12, 0.35, 3], ['Otavalo', -78.26, 0.23, 1], ['Tulcán', -77.72, 0.81, 1]],
    'Azuay & Loja': [['Cuenca', -79.0, -2.9, 10], ['Ingapirca', -78.87, -2.54, 3], ['Alausí', -78.85, -2.2, 1], ['Loja', -79.2, -3.99, 5], ['Saraguro', -79.24, -3.62, 1],
      ['Zaruma', -79.61, -3.69, 1], ['Macará', -79.94, -4.38, 1], ['Zamora', -78.95, -4.07, 1]],
    'Guayas & El Oro': [['Guayaquil', -79.89, -2.19, 20], ['Machala', -79.96, -3.26, 3], ['Santa Rosa', -79.96, -3.45, 1], ['Huaquillas', -80.23, -3.48, 1],
      ['Salinas', -80.96, -2.21, 1], ['Naranjal', -79.62, -2.67, 1], ['Babahoyo', -79.53, -1.8, 1]],
    'Manabí & Esmeraldas': [['Manta', -80.72, -0.95, 3], ['Portoviejo', -80.45, -1.05, 3], ['Jipijapa', -80.58, -1.35, 1], ['Bahía de Caráquez', -80.42, -0.6, 1],
      ['Chone', -80.09, -0.7, 1], ['Quevedo', -79.46, -1.02, 1], ['Santo Domingo de los Colorados', -79.17, -0.25, 1], ['Esmeraldas', -79.65, 0.96, 3]],
    'Oriente': [['Tena', -77.82, -0.99, 1], ['Baeza', -77.89, -0.46, 1], ['Puyo', -78.0, -1.49, 1], ['Sarayacu', -77.48, -1.73, 1], ['Montalvo', -76.98, -2.07, 1],
      ['Macas', -78.12, -2.31, 1], ['Méndez', -78.31, -2.71, 1], ['Gualaquiza', -78.57, -3.4, 1], ['Nuevo Rocafuerte', -75.42, -0.92, 1], ['Puerto El Carmen', -75.86, 0.12, 1]],
  },
  COL: {
    'Nariño': [['Pasto', -77.28, 1.21, 10], ['Ipiales', -77.64, 0.83, 3], ['Túquerres', -77.62, 1.09, 1], ['Barbacoas', -78.14, 1.67, 1], ['Tumaco', -78.79, 1.8, 3]],
    'Putumayo': [['Mocoa', -76.65, 1.15, 1], ['Puerto Asís', -76.5, 0.51, 1], ['Puerto Ospina', -75.87, 0.12, 1], ['Caucayá', -74.78, -0.19, 3], ['El Encanto', -73.21, -1.75, 1],
      ['La Chorrera', -73.02, -1.45, 1]],
    'Caquetá': [['Florencia', -75.61, 1.61, 3], ['Tres Esquinas', -75.24, 0.74, 1], ['Araracuara', -72.4, -0.6, 1], ['La Pedrera', -69.58, -1.32, 1], ['San Vicente del Caguán', -74.77, 2.11, 1]],
    'Amazonas Trapeze': [['Leticia', -69.94, -4.21, 5], ['Puerto Nariño', -70.36, -3.77, 1], ['Tarapacá del Putumayo', -69.74, -2.89, 1]],
    'Vaupés': [['Mitú', -70.23, 1.25, 1], ['San José del Guaviare', -72.64, 2.57, 1]],
    'Cauca & Huila': [['Popayán', -76.61, 2.44, 5], ['Cali', -76.53, 3.45, 10], ['Buenaventura', -77.07, 3.88, 3], ['Neiva', -75.28, 2.93, 3], ['Garzón', -75.63, 2.2, 1], ['Buga', -76.3, 3.9, 1]],
    'Cundinamarca': [['Bogotá', -74.07, 4.71, 30], ['Ibagué', -75.23, 4.44, 3], ['Girardot', -74.8, 4.3, 1], ['Villavicencio', -73.63, 4.15, 1]],
  },
  BRA: {
    'Acre': [['Rio Branco', -67.81, -9.97, 5], ['Cruzeiro do Sul', -72.67, -7.63, 3], ['Sena Madureira', -68.66, -9.07, 1], ['Xapuri', -68.5, -10.65, 1], ['Brasiléia', -68.75, -11.01, 1],
      ['Tarauacá', -70.77, -8.16, 1], ['Feijó', -70.35, -8.16, 1], ['Plácido de Castro', -67.19, -10.33, 1], ['Boca do Acre', -67.4, -8.75, 1]],
    'Alto Solimões': [['Tabatinga', -69.94, -4.25, 3], ['Benjamin Constant', -70.03, -4.38, 1], ['São Paulo de Olivença', -68.87, -3.38, 1], ['Santo Antônio do Içá', -67.94, -3.1, 1],
      ['Fonte Boa', -66.09, -2.51, 1], ['Eirunepé', -69.87, -6.66, 1], ['Ipixuna', -71.69, -7.05, 1], ['Carauari', -66.9, -4.88, 1]],
    'Amazonas': [['Manaus', -60.02, -3.12, 15], ['Tefé', -64.71, -3.35, 1], ['Coari', -63.14, -4.09, 1], ['Itacoatiara', -58.44, -3.14, 1], ['Parintins', -56.74, -2.63, 1], ['Lábrea', -64.8, -7.26, 1],
      ['Humaitá', -63.02, -7.51, 1], ['Manicoré', -61.3, -5.81, 1], ['Barcelos', -62.92, -0.97, 1], ['São Gabriel da Cachoeira', -67.09, -0.13, 1], ['Boa Vista', -60.67, 2.82, 1]],
    'Mato Grosso': [['Cuiabá', -56.1, -15.6, 5], ['Porto Velho', -63.9, -8.76, 3], ['Guajará-Mirim', -65.34, -10.78, 1], ['Corumbá', -57.65, -19.01, 3], ['Cáceres', -57.68, -16.07, 1],
      ['Vila Bela', -59.95, -15.0, 1], ['Porto Murtinho', -57.88, -21.7, 1], ['Aquidauana', -55.79, -20.47, 1]],
    'Pará': [['Óbidos', -55.52, -1.9, 1], ['Itaituba', -55.98, -4.28, 1]],
    'Rio Grande do Sul': [['Uruguaiana', -57.09, -29.76, 1], ['Alegrete', -55.79, -29.78, 1]],
  },
  BOL: {
    'La Paz & Lake Titicaca': [['La Paz', -68.15, -16.5, 20], ['Tiwanaku', -68.67, -16.56, 10], ['Copacabana', -69.09, -16.17, 3], ['Guaqui', -68.85, -16.6, 1], ['Achacachi', -68.66, -16.05, 1],
      ['Puerto Acosta', -69.25, -15.52, 1], ['Sorata', -68.65, -15.77, 1], ['Viacha', -68.3, -16.65, 1], ['Corocoro', -68.45, -17.17, 1], ['Charaña', -69.45, -17.59, 1],
      ['Coroico', -67.73, -16.19, 1], ['Apolo', -68.42, -14.72, 1]],
    'Oruro': [['Oruro', -67.11, -17.97, 5], ['Challapata', -66.77, -18.9, 1], ['Curahuara de Carangas', -68.42, -17.84, 1], ['Sabaya', -68.37, -19.02, 1]],
    'Cochabamba': [['Cochabamba', -66.16, -17.39, 10], ['Pocona', -65.37, -17.66, 3], ['Aiquile', -65.18, -18.2, 1], ['Independencia', -66.82, -17.08, 1]],
    'Chuquisaca': [['Sucre', -65.26, -19.04, 10], ['Camargo', -65.21, -20.64, 1], ['Padilla', -64.3, -19.3, 1]],
    'Potosí': [['Potosí', -65.75, -19.58, 10], ['Uyuni', -66.83, -20.46, 3], ['Llallagua', -66.58, -18.42, 1], ['Tupiza', -65.72, -21.44, 1], ['Villazón', -65.59, -22.09, 1],
      ['San Pablo de Lípez', -66.62, -21.68, 1]],
    'Tarija': [['Tarija', -64.73, -21.53, 5], ['Bermejo', -64.34, -22.73, 1], ['Villamontes', -63.47, -21.26, 1], ['Yacuiba', -63.68, -22.02, 1]],
    'Santa Cruz': [['Santa Cruz de la Sierra', -63.18, -17.78, 5], ['Samaipata', -63.87, -18.18, 3], ['Vallegrande', -64.11, -18.49, 1], ['Camiri', -63.52, -20.04, 1],
      ['San José de Chiquitos', -60.74, -17.85, 1], ['Roboré', -59.76, -18.33, 1], ['Puerto Suárez', -57.8, -18.95, 1], ['San Ignacio de Velasco', -60.96, -16.37, 1]],
    'Beni & Pando': [['Trinidad', -64.9, -14.83, 3], ['Riberalta', -66.07, -10.99, 1], ['Cobija', -68.77, -11.03, 1], ['Rurrenabaque', -67.53, -14.44, 1], ['Guayaramerín', -65.36, -10.82, 1],
      ['Santa Ana de Yacuma', -65.43, -13.74, 1], ['Magdalena', -64.05, -13.26, 1], ['Ixiamas', -68.13, -13.77, 1]],
  },
  CHL: {
    'Arica & Tarapacá': [['Arica', -70.31, -18.48, 5], ['Putre', -69.56, -18.2, 1], ['Pisagua', -70.22, -19.6, 1], ['Iquique', -70.15, -20.21, 5], ['Pica', -69.33, -20.49, 1]],
    'Antofagasta': [['Antofagasta', -70.4, -23.65, 10], ['Tocopilla', -70.2, -22.09, 1], ['Calama', -68.93, -22.46, 3], ['San Pedro de Atacama', -68.2, -22.91, 3], ['Ollagüe', -68.25, -21.22, 1],
      ['Mejillones', -70.45, -23.1, 1], ['Taltal', -70.48, -25.41, 1]],
    'Atacama': [['Copiapó', -70.33, -27.37, 5], ['Chañaral', -70.62, -26.35, 1], ['Caldera', -70.82, -27.07, 1], ['Potrerillos', -69.47, -26.43, 1], ['Vallenar', -70.76, -28.58, 1]],
    'Coquimbo': [['La Serena', -71.25, -29.9, 5], ['Vicuña', -70.71, -30.03, 1], ['Ovalle', -71.2, -30.6, 1], ['Illapel', -71.17, -31.63, 1], ['Los Vilos', -71.51, -31.91, 1]],
    'Aconcagua & Santiago': [['Santiago', -70.65, -33.45, 30], ['Valparaíso', -71.63, -33.05, 15], ['San Felipe', -70.72, -32.75, 1], ['La Ligua', -71.23, -32.45, 1], ['San Antonio', -71.61, -33.59, 1],
      ['Rancagua', -70.74, -34.17, 3]],
    'Colchagua & Maule': [['San Fernando', -70.99, -34.59, 1], ['Pichilemu', -72.0, -34.39, 1], ['Curicó', -71.24, -34.98, 1], ['Talca', -71.66, -35.43, 5], ['Constitución', -72.41, -35.33, 1],
      ['Linares', -71.6, -35.85, 1], ['Cauquenes', -72.32, -35.97, 1]],
    'Ñuble & Biobío': [['Concepción', -73.05, -36.83, 10], ['Chillán', -72.1, -36.61, 3], ['Los Ángeles', -72.35, -37.3, 1]],
  },
  ARG: {
    'Jujuy & Salta': [['Salta', -65.41, -24.79, 10], ['San Salvador de Jujuy', -65.3, -24.19, 3], ['Humahuaca', -65.35, -23.21, 1], ['La Quiaca', -65.59, -22.11, 1],
      ['San Antonio de los Cobres', -66.32, -24.22, 1], ['Cafayate', -65.98, -26.07, 1], ['Orán', -64.32, -23.13, 1], ['Tartagal', -63.8, -22.52, 1]],
    'Tucumán': [['San Miguel de Tucumán', -65.22, -26.82, 10], ['Tafí del Valle', -65.71, -26.85, 1], ['Aguilares', -65.61, -27.43, 1]],
    'Catamarca & La Rioja': [['Catamarca', -65.78, -28.47, 3], ['Andalgalá', -66.32, -27.6, 1], ['Belén', -67.03, -27.65, 1], ['Tinogasta', -67.56, -28.06, 1], ['La Rioja', -66.85, -29.41, 3],
      ['Chilecito', -67.5, -29.16, 1]],
    'Cuyo': [['Mendoza', -68.84, -32.89, 10], ['Uspallata', -69.35, -32.59, 1], ['San Juan', -68.54, -31.54, 5], ['Jáchal', -68.75, -30.24, 1], ['San Luis', -66.34, -33.3, 3],
      ['San Rafael', -68.33, -34.62, 1], ['Malargüe', -69.58, -35.47, 1]],
    'Córdoba & Santiago del Estero': [['Córdoba', -64.18, -31.42, 15], ['Santiago del Estero', -64.26, -27.79, 3], ['Cruz del Eje', -64.81, -30.73, 1], ['Río Cuarto', -64.35, -33.12, 1],
      ['Villa María', -63.24, -32.41, 1], ['Villa Mercedes', -65.46, -33.68, 1]],
    'Chaco & Formosa': [['Resistencia', -58.99, -27.45, 3], ['Formosa', -58.18, -26.18, 1], ['Presidencia Roque Sáenz Peña', -60.44, -26.79, 1], ['Las Lomitas', -60.59, -24.71, 1]],
    'Litoral': [['Rosario', -60.65, -32.95, 15], ['Santa Fe', -60.7, -31.63, 5], ['Corrientes', -58.83, -27.49, 3], ['Posadas', -55.9, -27.37, 1], ['Concordia', -58.02, -31.39, 1],
      ['Reconquista', -59.65, -29.15, 1]],
    'Buenos Aires & the Pampa': [['Buenos Aires', -58.38, -34.6, 30], ['La Plata', -57.95, -34.92, 5], ['Pergamino', -60.57, -33.89, 1], ['Azul', -59.86, -36.78, 1], ['Dolores', -57.68, -36.31, 1],
      ['General Pico', -63.76, -35.66, 1], ['Santa Rosa de Toay', -64.29, -36.62, 1]],
  },
  PRY: { 'Paraguay': [['Asunción', -57.63, -25.28, 10], ['Villarrica', -56.43, -25.75, 1], ['Encarnación', -55.87, -27.33, 1], ['Pilar', -58.3, -26.86, 1], ['Pedro Juan Caballero', -55.73, -22.55, 1]],
    'Chaco Boreal': [['Mariscal Estigarribia', -60.62, -22.03, 1], ['Fuerte Olimpo', -57.87, -21.04, 1], ['Filadelfia', -60.03, -22.35, 1]] },
  URY: { 'Uruguay': [['Montevideo', -56.19, -34.9, 15], ['Salto', -57.96, -31.39, 1], ['Paysandú', -58.08, -32.32, 1], ['Colonia del Sacramento', -57.84, -34.47, 1], ['Tacuarembó', -55.98, -31.71, 1],
    ['Durazno', -56.52, -33.38, 1], ['Artigas', -56.47, -30.4, 1]] },
  VEN: { 'Amazonas Territory': [['San Fernando de Atabapo', -67.7, 4.05, 1], ['San Carlos de Río Negro', -67.06, 1.92, 1], ['La Esmeralda', -65.54, 3.17, 1]],
    'Gran Sabana': [['Santa Elena de Uairén', -61.11, 4.6, 1]] },
  BGU: { 'Rupununi': [['Lethem', -59.8, 3.38, 1]] },
  DGU: { 'Surinam': [] },
};

// Seven fronts. Objective zones (modern polygons, trimmed with boxes) together approximate Tawantinsuyu:
// Ecuador and Nariño (northern Chinchaysuyu), highland Bolivia and north-west Argentina (Collasuyu), Chile to the Maule.
// The Amazon front is the one zone the Inca never held: it stands for Antisuyu and its legends.
// Argentina does not touch Peru, so its Inca north-west is reached through the Bolivian front.
export const FRONTS = [
  { id: 'ecu', name: 'Zarumilla Front', enemy: 'ECU', enemyName: 'Ecuador', subs: ['Ecuador'], box: [-82, -5.6, -74.5, -2.0], defaultLabel: 'School',
    satrapy: 'Tumipampa & the Huancavilca coast', hq: 'Piura' },
  { id: 'qui', name: 'Napo Front', enemy: 'ECU', enemyName: 'Ecuador', subs: ['Ecuador'], box: [-82, -2.0, -74.5, 2.0], defaultLabel: 'Family',
    satrapy: 'Quitu, the northern seat of Chinchaysuyu', hq: 'Iquitos' },
  { id: 'col', name: 'Putumayo Front', enemy: 'COL', enemyName: 'Colombia', subs: ['Colombia'], box: [-79.6, -4.6, -69.3, 1.9], defaultLabel: 'Partner',
    satrapy: 'the land of the Pastos, to the Ancasmayu', hq: 'Pebas' },
  { id: 'bra', name: 'Amazon Front', enemy: 'BRA', enemyName: 'Brazil', subs: ['Brazil'], box: [-74.3, -11.3, -66.2, -1.4], defaultLabel: 'Work',
    satrapy: 'Antisuyu beyond the Yavarí', hq: 'Pucallpa' },
  { id: 'bol', name: 'Collao Front', enemy: 'BOL', enemyName: 'Bolivia', subs: ['Bolivia', 'Argentina'], box: [-71, -33.7, -64.5, -12.3], defaultLabel: 'Health',
    satrapy: 'Collasuyu: Charcas & Tucumán', hq: 'Puno' },
  { id: 'chi', name: 'Tarapacá Front', enemy: 'CHL', enemyName: 'Chile', subs: ['Chile'], box: [-73, -27.9, -66.5, -17], defaultLabel: 'Friends',
    satrapy: 'Tarapacá, Atacama & Copayapu', hq: 'Tacna' },
  { id: 'pac', name: 'Pacific Theatre', enemy: 'CHL', enemyName: 'Chilean Navy', naval: true, subs: ['Chile'], box: [-74.5, -36.2, -69, -27.9], defaultLabel: 'Self',
    satrapy: 'Coquimbo, Mapocho & the Maule', hq: 'Mollendo',
    // the southern coast, from the bay of San Juan to Ilo: the stretch that faces the Chilean squadron
    coast: [[-75.25, -15.3], [-74.6, -15.75], [-74.25, -15.9], [-73.65, -16.25], [-72.75, -16.65], [-72.05, -17.05], [-71.5, -17.35], [-71.37, -17.68]], coastKm: 60 },
];

// Terrain. Ranges are polylines with a half-width in degrees.
export const RANGES = [
  { name: 'Cordillera Occidental', w: 0.6, pts: [[-79.55, -4.9], [-79.1, -6.2], [-78.6, -7.2], [-78.0, -8.3], [-77.3, -10.2], [-76.5, -11.2], [-76.05, -12.0], [-75.4, -13.1], [-74.6, -14.2], [-73.5, -15.0], [-72.3, -15.5], [-71.3, -16.1], [-70.5, -16.9], [-69.9, -17.6]] },
  { name: 'Cordillera Blanca', w: 0.35, pts: [[-77.85, -8.7], [-77.6, -9.2], [-77.3, -9.7], [-77.0, -10.2]] },
  { name: 'Cordillera Central', w: 0.55, pts: [[-77.9, -5.9], [-77.6, -7.0], [-77.0, -8.3], [-76.4, -9.4], [-75.8, -10.5], [-75.1, -11.6], [-74.5, -12.6], [-73.6, -13.2], [-72.8, -13.2]] },
  { name: 'Cordillera de Vilcanota', w: 0.55, pts: [[-72.8, -13.2], [-71.8, -13.35], [-71.0, -13.8], [-70.3, -14.2], [-69.6, -14.5]] },
  { name: 'Cordillera Real', w: 0.55, pts: [[-69.6, -14.5], [-69.0, -15.1], [-68.5, -15.8], [-67.9, -16.5], [-67.2, -17.2], [-66.2, -17.4], [-65.5, -18.3], [-65.3, -19.6], [-65.2, -21.5]] },
  { name: 'Cordillera del Cóndor', w: 0.3, pts: [[-78.35, -3.3], [-78.5, -3.9], [-78.7, -4.6]] },
  { name: 'Andes of Quito', w: 0.6, pts: [[-79.4, -4.4], [-79.1, -3.3], [-78.85, -2.3], [-78.65, -1.3], [-78.45, -0.3], [-78.1, 0.6], [-77.4, 1.2], [-76.7, 2.2], [-76.0, 3.4], [-75.5, 4.8]] },
  { name: 'Cordillera Oriental', w: 0.5, pts: [[-76.2, 1.5], [-75.3, 2.6], [-74.5, 3.8], [-73.7, 5.2]] },
  { name: 'Andes', w: 0.65, pts: [[-69.9, -17.6], [-69.2, -18.6], [-68.6, -20.0], [-68.2, -21.6], [-67.8, -23.0], [-68.2, -24.6], [-68.6, -26.2], [-69.3, -27.8], [-69.8, -29.5], [-70.2, -31.2], [-70.1, -33.0], [-70.3, -34.6], [-70.7, -36.0], [-71.1, -37.5]] },
  { name: 'Puna', w: 0.5, pts: [[-65.2, -21.5], [-65.5, -23.0], [-66.0, -24.6], [-66.2, -26.4], [-66.6, -28.0], [-67.6, -29.4]] },
  { name: 'Sierras de Córdoba', w: 0.35, pts: [[-64.7, -30.6], [-64.9, -31.8], [-65.0, -32.8]] },
  { name: 'Pacaraima', w: 0.5, pts: [[-65.0, 3.9], [-63.2, 4.0], [-61.6, 4.7], [-60.6, 5.2]] },
];
export const DESERTS = [ // [lon, lat, rx, ry, name]
  [-80.45, -5.85, 0.75, 0.6, 'Sechura Desert'], [-81.0, -4.5, 0.45, 0.6], [-79.75, -7.0, 0.4, 0.6], [-78.85, -8.5, 0.4, 0.6], [-78.2, -9.9, 0.35, 0.7],
  [-77.45, -11.3, 0.3, 0.6], [-76.5, -12.9, 0.3, 0.5], [-75.85, -14.2, 0.55, 0.75, 'Ica Desert'], [-74.9, -15.3, 0.6, 0.45], [-73.4, -16.15, 0.9, 0.35],
  [-71.9, -16.9, 0.7, 0.4], [-70.7, -17.75, 0.6, 0.4], [-69.85, -20.3, 0.5, 1.9, 'Pampa del Tamarugal'], [-69.7, -24.2, 0.9, 2.6, 'Atacama Desert'],
  [-70.4, -27.6, 0.6, 1.2], [-67.5, -20.2, 0.75, 0.5, 'Salar de Uyuni'], [-67.6, -31.6, 0.9, 1.9, 'Monte'], [-66.0, -30.0, 0.6, 0.6, 'Salinas Grandes'],
];
export const FORESTS = [
  [-74.6, -4.3, 3.7, 3.3, 'Selva'], [-73.6, -9.6, 1.7, 2.3], [-70.9, -11.9, 2.1, 1.5], [-76.2, -7.4, 0.8, 1.6], [-76.6, -1.4, 1.5, 1.6], [-73.5, 0.6, 4.6, 2.3],
  [-63.5, -4.5, 8.6, 6.4, 'Amazonia'], [-58.0, -9.5, 3.4, 4.6], [-66.0, -12.6, 3.0, 2.2], [-63.0, 2.6, 6.5, 2.4], [-61.0, -22.5, 2.4, 3.4, 'Gran Chaco'],
  [-55.7, -25.4, 1.2, 2.2], [-78.6, 1.3, 0.7, 1.2], [-79.4, 0.5, 0.6, 0.6], [-64.6, -23.4, 0.5, 1.4, 'Yungas'], [-72.8, -37.0, 0.6, 0.5],
];
export const MARSHES = [[-74.7, -5.25, 0.85, 0.45], [-65.2, -14.2, 1.2, 0.9], [-57.4, -18.0, 1.0, 1.9], [-57.2, -28.4, 0.8, 0.6], [-79.8, -2.3, 0.3, 0.3]];

export const LAKES = [
  { name: 'Lake Titicaca', pts: [[-69.97, -15.52], [-69.84, -15.36], [-69.58, -15.44], [-69.32, -15.62], [-69.02, -15.82], [-68.85, -16.02], [-68.74, -16.19], [-68.63, -16.31],
    [-68.67, -16.44], [-68.9, -16.47], [-69.0, -16.53], [-68.98, -16.36], [-68.85, -16.24], [-68.96, -16.08], [-69.2, -16.12], [-69.41, -16.14], [-69.6, -15.96], [-69.84, -15.9], [-69.94, -15.76]] },
  { name: 'Lake Poopó', pts: [[-67.2, -18.45], [-66.95, -18.6], [-66.88, -19.0], [-67.1, -19.15], [-67.3, -18.9]] },
  { name: 'Lake Junín', pts: [[-76.22, -10.94], [-76.08, -10.97], [-76.03, -11.1], [-76.14, -11.1]] },
];

export const RIVERS = [
  { name: 'Amazon', pts: [[-73.45, -4.45], [-73.2, -3.75], [-72.7, -3.38], [-71.86, -3.36], [-70.9, -3.85], [-70.45, -3.85], [-69.95, -4.23], [-68.87, -3.42], [-67.94, -3.14], [-66.77, -2.74], [-66.09, -2.55],
    [-64.71, -3.3], [-63.14, -4.05], [-62.06, -3.84], [-60.62, -3.3], [-60.02, -3.16], [-58.44, -3.18], [-56.74, -2.63], [-55.52, -1.94], [-55.0, -2.1]] },
  { name: 'Marañón', pts: [[-76.7, -10.3], [-76.85, -9.4], [-77.3, -8.5], [-77.75, -7.6], [-78.05, -6.8], [-78.35, -6.1], [-78.55, -5.5], [-78.2, -5.0], [-77.87, -4.62], [-77.55, -4.5], [-76.56, -4.86],
    [-75.6, -4.9], [-74.6, -4.75], [-73.58, -4.54], [-73.45, -4.45]] },
  { name: 'Ucayali', pts: [[-73.76, -10.73], [-74.0, -9.9], [-74.31, -8.63], [-74.55, -8.4], [-74.9, -7.8], [-75.01, -7.38], [-75.15, -6.9], [-74.8, -6.0], [-74.05, -5.3], [-73.86, -5.08], [-73.45, -4.45]] },
  { name: 'Huallaga', pts: [[-76.2, -10.6], [-76.24, -9.95], [-76.0, -9.3], [-76.4, -8.6], [-76.51, -8.19], [-76.73, -7.2], [-76.3, -6.6], [-76.09, -5.92], [-75.68, -5.25], [-75.6, -4.9]] },
  { name: 'Apurímac', pts: [[-71.7, -15.5], [-71.45, -14.8], [-71.9, -14.0], [-72.55, -13.6], [-73.2, -13.3], [-73.75, -12.65], [-74.0, -12.25], [-74.2, -11.6], [-74.25, -11.17], [-73.76, -10.73]] },
  { name: 'Mantaro', pts: [[-76.1, -11.05], [-75.9, -11.5], [-75.5, -11.8], [-75.2, -12.1], [-74.95, -12.55], [-74.45, -12.6], [-74.0, -12.25]] },
  { name: 'Urubamba', pts: [[-70.98, -14.48], [-71.23, -14.25], [-71.6, -13.75], [-72.12, -13.3], [-72.55, -13.18], [-72.69, -12.88], [-72.82, -12.25], [-73.05, -11.6], [-73.1, -11.15], [-73.76, -10.73]] },
  { name: 'Madre de Dios', pts: [[-71.37, -12.3], [-70.4, -12.6], [-69.18, -12.62], [-68.67, -12.5], [-67.5, -11.6], [-66.07, -11.0], [-65.35, -10.4]] },
  { name: 'Madeira', pts: [[-65.35, -10.4], [-65.3, -9.7], [-63.9, -8.76], [-63.02, -7.51], [-61.3, -5.81], [-59.6, -4.39], [-58.8, -3.4]] },
  { name: 'Putumayo', pts: [[-76.95, 1.15], [-76.5, 0.5], [-75.87, 0.1], [-75.25, -0.12], [-74.78, -0.22], [-74.0, -1.0], [-73.2, -1.8], [-72.67, -2.42], [-71.75, -2.2], [-70.9, -2.3], [-70.05, -2.72], [-69.74, -2.92], [-68.8, -3.0], [-67.94, -3.14]] },
  { name: 'Napo', pts: [[-77.8, -1.02], [-76.98, -0.47], [-76.2, -0.45], [-75.3, -0.95], [-74.6, -1.6], [-73.68, -2.52], [-73.1, -3.3], [-72.7, -3.38]] },
  { name: 'Pastaza', pts: [[-78.4, -1.4], [-77.9, -1.75], [-77.0, -2.4], [-76.4, -2.93], [-76.45, -4.0], [-76.4, -4.88]] },
  { name: 'Yavarí', pts: [[-73.75, -7.1], [-73.6, -6.4], [-73.15, -5.7], [-72.9, -5.15], [-72.2, -4.75], [-71.3, -4.5], [-70.6, -4.2], [-70.0, -4.35]] },
  { name: 'Caquetá', pts: [[-76.6, 1.1], [-75.9, 0.95], [-75.25, 0.7], [-73.8, 0.1], [-72.4, -0.6], [-70.9, -1.1], [-69.58, -1.32], [-68.0, -1.7], [-66.5, -1.9], [-65.0, -3.1]] },
  { name: 'Juruá', pts: [[-72.7, -9.4], [-72.67, -7.63], [-71.69, -7.05], [-69.87, -6.66], [-68.3, -6.0], [-66.9, -4.88], [-66.0, -3.2], [-65.7, -2.7]] },
  { name: 'Purús', pts: [[-70.72, -9.77], [-69.6, -9.3], [-68.66, -9.0], [-67.4, -8.75], [-66.0, -7.9], [-64.8, -7.26], [-63.3, -5.6], [-62.0, -4.6], [-61.5, -3.75]] },
  { name: 'Santa', pts: [[-77.28, -10.12], [-77.5, -9.55], [-77.8, -9.05], [-77.9, -8.75], [-78.25, -8.65], [-78.64, -8.97]] },
  { name: 'Rímac', pts: [[-76.2, -11.6], [-76.38, -11.84], [-76.7, -11.94], [-77.04, -12.03], [-77.15, -12.03]] },
  { name: 'Desaguadero', pts: [[-69.0, -16.53], [-68.7, -17.0], [-68.2, -17.5], [-67.5, -17.95], [-67.2, -18.45]] },
  { name: 'Beni', pts: [[-67.6, -15.5], [-67.53, -14.44], [-67.3, -13.0], [-66.6, -11.8], [-66.07, -11.0]] },
  { name: 'Mamoré', pts: [[-64.8, -16.8], [-64.9, -14.83], [-65.2, -13.0], [-65.3, -11.6], [-65.35, -10.4]] },
  { name: 'Pilcomayo', pts: [[-65.9, -19.3], [-64.9, -20.6], [-63.47, -21.26], [-62.3, -22.3], [-60.6, -23.8], [-59.0, -24.7], [-57.65, -25.3]] },
  { name: 'Paraguay', pts: [[-57.7, -16.1], [-57.65, -19.0], [-57.9, -21.0], [-57.45, -23.4], [-57.63, -25.28], [-58.3, -26.86], [-58.6, -27.3]] },
  { name: 'Paraná', pts: [[-55.0, -26.6], [-55.55, -27.1], [-56.0, -27.33], [-57.2, -27.45], [-58.6, -27.3], [-59.2, -28.6], [-59.6, -29.9], [-60.55, -31.7], [-60.65, -32.95], [-59.3, -33.9], [-58.45, -34.25]] },
];

// Railways. stage 0 = running in 1936; 1–4 = the long-debated extensions, built as national infrastructure grows.
export const RAILWAYS = [
  { name: 'Ferrocarril Central', stage: 0, via: ['Callao', 'Lima', [-76.7, -11.94], 'Matucana', [-76.19, -11.6], 'La Oroya', 'Jauja', 'Huancayo'] },
  { name: 'Cerro de Pasco Railway', stage: 0, via: ['La Oroya', 'Junín', 'Cerro de Pasco'] },
  { name: 'Huancayo–Huancavelica Railway', stage: 0, via: ['Huancayo', [-75.05, -12.45], 'Huancavelica'] },
  { name: 'Ferrocarril del Sur', stage: 0, via: ['Mollendo', [-71.75, -16.7], 'Arequipa', [-71.1, -15.9], [-70.6, -15.75], 'Juliaca', 'Puno'] },
  { name: 'Ferrocarril del Sur (Cuzco line)', stage: 0, via: ['Juliaca', 'Ayaviri', [-70.98, -14.48], 'Sicuani', [-71.6, -13.75], 'Cuzco'] },
  { name: 'Cuzco–Santa Ana Railway', stage: 0, via: ['Cuzco', 'Ollantaytambo', 'Machu Picchu'] },
  { name: 'Ferrocarril Noroeste', stage: 0, via: ['Lima', 'Ancón', 'Chancay', 'Huacho'] },
  { name: 'Paita–Piura Railway', stage: 0, via: ['Paita', 'Sullana', 'Piura'] },
  { name: 'Pacasmayo Railway', stage: 0, via: ['Pacasmayo', 'Chepén'] },
  { name: 'Trujillo Railway', stage: 0, via: ['Salaverry', 'Trujillo', 'Ascope'] },
  { name: 'Chimbote–Huallanca Railway', stage: 0, via: ['Chimbote', [-78.2, -8.68], [-77.87, -8.82]] },
  { name: 'Pisco–Ica Railway', stage: 0, via: ['Pisco', 'Ica'] },
  { name: 'Tacna–Arica Railway', stage: 0, via: ['Tacna', [-70.33, -18.3]] },
  { name: 'Ilo–Moquegua Railway', stage: 0, via: ['Ilo', 'Moquegua'] },
  { name: 'Santa Valley Extension', stage: 1, via: [[-77.87, -8.82], 'Caraz', 'Huaraz'] },
  { name: 'Quillabamba Extension', stage: 1, via: ['Machu Picchu', 'Quillabamba'] },
  { name: 'Northern Coast Line', stage: 2, via: ['Huacho', 'Barranca', 'Huarmey', 'Casma', 'Chimbote', [-78.75, -8.41], 'Salaverry'] },
  { name: 'Southern Coast Line', stage: 2, via: ['Lima', [-76.63, -12.66], 'Cañete', 'Chincha Alta', 'Pisco'] },
  { name: 'Cajamarca Line', stage: 3, via: ['Ascope', 'Pacasmayo', 'Chiclayo', 'Olmos', 'Piura'] },
  { name: 'Pucallpa Line', stage: 3, via: ['Cerro de Pasco', 'Huánuco', 'Tingo María', [-75.3, -8.9], 'Pucallpa'] },
  { name: 'Ayacucho–Cuzco Line', stage: 4, via: ['Huancavelica', 'Ayacucho', 'Andahuaylas', 'Abancay', 'Cuzco'] },
  { name: 'Tacna Line', stage: 4, via: ['Arequipa', 'Moquegua', 'Locumba', 'Tacna'] },
];

export const SEA_LABELS = [
  ['PACIFIC OCEAN', -83.5, -14.5, 1.5], ['Mar de Grau', -79.3, -12.2, 0.8, 38], ['Gulf of Guayaquil', -81.6, -3.0, 0.55], ['Golfo de Arica', -72.3, -19.0, 0.55],
  ['SOUTH PACIFIC', -79.0, -29.5, 1.2], ['Río de la Plata', -56.6, -35.6, 0.55], ['to the Galápagos', -87.0, -0.8, 0.5],
];
export const COUNTRY_LABELS = [['BRA', 'BRAZIL', -61.0, -8.6, 19], ['BOL', 'BOLIVIA', -63.6, -16.3, 14], ['CHL', 'CHILE', -69.7, -25.4, 10], ['ARG', 'ARGENTINA', -63.3, -29.6, 16],
  ['ECU', 'ECUADOR', -78.2, -1.9, 10], ['COL', 'COLOMBIA', -73.0, 2.4, 14], ['PRY', 'PARAGUAY', -58.6, -22.9, 11], ['VEN', 'VENEZUELA', -65.2, 4.4, 10], ['URY', 'URUGUAY', -56.2, -32.8, 9]];
export const HOME_LABEL = [-74.6, -9.2];

// Tawantinsuyu at the death of Huayna Capac, c. 1525: from the Ancasmayu north of Pasto to the Maule, and from the
// Pacific to the edge of the forest and the Chaco.
export const EMPIRE = [[-77.0, 1.6], [-78.1, 1.3], [-79.3, 0.1], [-80.7, -0.6], [-81.3, -2.2], [-80.7, -3.3], [-81.6, -4.5], [-81.5, -6.0], [-80.2, -7.0], [-79.1, -8.6], [-78.1, -10.4],
  [-77.5, -12.2], [-76.7, -13.9], [-75.5, -15.6], [-73.3, -16.75], [-71.6, -17.75], [-70.7, -18.6], [-70.5, -21.0], [-70.85, -24.0], [-71.2, -27.0], [-71.8, -30.0], [-72.0, -33.0], [-72.75, -35.4],
  [-71.0, -35.75], [-70.0, -35.2], [-69.0, -34.0], [-68.2, -33.2], [-67.5, -31.0], [-66.4, -29.0], [-65.2, -27.4], [-64.8, -25.5], [-64.5, -23.0], [-64.0, -21.5], [-63.6, -19.5], [-63.7, -18.0],
  [-65.0, -17.0], [-66.8, -15.8], [-68.0, -14.3], [-69.3, -13.4], [-70.8, -12.9], [-72.3, -12.3], [-73.6, -11.8], [-74.6, -10.8], [-75.4, -9.5], [-76.2, -8.2], [-76.6, -6.6], [-77.2, -5.6],
  [-77.9, -4.6], [-78.1, -3.2], [-77.8, -1.6], [-77.5, -0.3], [-76.9, 0.8]];

// The Amazon flotilla has no open sea: its counter sits on the river off Iquitos.
export const FLEET_AT = { pacific: [-78.6, -12.9], amazon: [-73.0, -3.2], 'enemy:pac': [-73.6, -31.5] };

export const META = {
  name: 'Peru',
  long: 'Republic of Peru',
  empire: 'Tawantinsuyu',
  year: 1936,
  blurb: 'Seven frontiers from the Putumayo to Tacna. Restore the Inca realm of the four quarters.',
  pitch: 'a 1936 grand-strategy war map of Peru',
  flag: { type: 'v3', colors: ['#c0392f', '#efeadb', '#c0392f'] },
  regionWord: 'Wamani', // an Inca province; the four suyus were the quarters that the wamanis made up
  regions: {
    'Pichincha & the Northern Sierra': 'Quitu', 'Azuay & Loja': 'Tumipampa', 'Guayas & El Oro': 'Huancavilca', 'Manabí & Esmeraldas': 'Manta', 'Oriente': 'Quijos',
    'Nariño': 'Pastu', 'Putumayo': 'Mocoa', 'Amazonas Trapeze': 'Ticuna',
    'Acre': 'Paititi', 'Alto Solimões': 'Omagua',
    'La Paz & Lake Titicaca': 'Umasuyu', 'Oruro': 'Carangas', 'Cochabamba': 'Cochapampa', 'Chuquisaca': 'Charcas', 'Potosí': 'Qaraqara', 'Tarija': 'Chichas', 'Santa Cruz': 'Samaipata',
    'Jujuy & Salta': 'Chicoana', 'Tucumán': 'Tucma', 'Catamarca & La Rioja': 'Quire-Quire', 'Cuyo': 'Cuyo',
    'Arica & Tarapacá': 'Tarapacá', 'Antofagasta': 'Atacama', 'Atacama': 'Copayapu', 'Coquimbo': 'Coquimpu', 'Aconcagua & Santiago': 'Mapocho', 'Colchagua & Maule': 'Purumauca',
  },
  capitalFalls: 'The government leaves Lima for the sierra and sits at Cuzco. The war goes on.',
  capitalFreed: 'Lima is free again. The government comes down from the sierra to the City of the Kings.',
  fightsOnFrom: 'Cuzco',
  honor: {
    ecu: ['Tumbes', 'Piura', 'Zarumilla', 'Sullana', 'Paita', 'Ayabaca', 'Huancabamba', 'Chira', 'Sechura', 'Lambayeque'],
    qui: ['Napo', 'Marañón', 'Pastaza', 'Jaén', 'Maynas', 'Chachapoyas', 'Cajamarca', 'Moyobamba', 'Tigre', 'Santiago'],
    col: ['Loreto', 'Putumayo', 'Iquitos', 'Güeppí', 'Pebas', 'Amazonas', 'Nauta', 'Caballococha', 'Ucayali', 'Yaguas'],
    bra: ['Ucayali', 'Yavarí', 'Pucallpa', 'Purús', 'Huallaga', 'Huánuco', 'Madre de Dios', 'Contamana', 'Requena', 'Tahuamanu'],
    bol: ['Puno', 'Cuzco', 'Titicaca', 'Collao', 'Azángaro', 'Ayaviri', 'Sicuani', 'Carabaya', 'Apurímac', 'Vilcanota'],
    chi: ['Tacna', 'Arequipa', 'Moquegua', 'Tarata', 'Misti', 'Locumba', 'Ilo', 'Sama', 'Caylloma', 'Alto de la Alianza'],
    pac: ['Callao', 'Mollendo', 'Islay', 'Camaná', 'Pisco', 'Chala', 'Paracas', 'Ica', 'San Lorenzo', 'Chorrillos'],
  },
  commanders: {
    ecu: 'Gen. Eusebio Zevallos Larrea', qui: 'Gen. Teodoro Arrunátegui Salcedo', col: 'Gen. Nicanor Palomino Rázuri', bra: 'Gen. Wenceslao Mendiola Carrillo',
    bol: 'Gen. Demetrio Quispe Valdivia', chi: 'Gen. Hipólito Tudela Villanueva', pac: 'Adm. Baltazar Olaechea Huamán',
  },
  oob: {
    ecu: ['inf', 'inf', 'cav', 'art'], qui: ['inf', 'mtn', 'inf'], col: ['inf', 'inf', 'mar'], bra: ['inf', 'inf', 'cav'],
    bol: ['mtn', 'mtn', 'inf', 'art'], chi: ['inf', 'cav', 'mot', 'art'], pac: ['mar', 'inf', 'art'],
  },
  guard: [['grd', '1st Guard Division “Húsares de Junín”'], ['arm', 'Lima Tank Company']],
  officerNames: {
    first: ['Abelardo', 'Aurelio', 'Baltazar', 'Belisario', 'Celestino', 'Demetrio', 'Eleodoro', 'Eusebio', 'Fermín', 'Hipólito', 'Leoncio', 'Melchor', 'Nicanor', 'Saturnino', 'Teodoro', 'Wenceslao'],
    last: ['Quispe', 'Huamán', 'Mamani', 'Condori', 'Yupanqui', 'Zevallos', 'Arrunátegui', 'Palomino', 'Salcedo', 'Valdivia', 'Larrea', 'Mendiola', 'Tudela', 'Carrillo', 'Rázuri', 'Olaechea'],
    ranks: { div: 'Gral. Brig.', bde: 'Crnl.', guard: 'Gral. Div.' },
  },
  // Aircraft of the Cuerpo de Aviación del Perú in 1936. Lima's field is Las Palmas; Ancón and Iquitos (Itaya) were seaplane stations.
  wings: [
    { name: '1st Fighter Squadron', type: 'fighter', model: 'Curtiss Hawk II', base: 'Lima', planes: 18 },
    { name: '2nd Fighter Squadron', type: 'fighter', model: 'Caproni Ca.114', base: 'Chiclayo', planes: 12 },
    { name: '1st Observation & Attack Squadron', type: 'cas', model: 'Douglas O-38P', base: 'Iquitos', planes: 9 },
    { name: '1st Bomber Squadron', type: 'bomber', model: 'Caproni Ca.111', base: 'Lima', planes: 12 },
  ],
  newWingModels: { fighter: 'North American NA-50', cas: 'Douglas 8A-3P', bomber: 'Caproni Ca.135' },
  fleets: [
    { id: 'pacific', name: 'Pacific Squadron', base: 'Callao', sea: 'Pacific Ocean', fronts: ['pac', 'chi', 'ecu', 'bol'],
      ships: [['Almirante Grau', 'Cruiser'], ['Coronel Bolognesi', 'Cruiser'], ['Almirante Villar', 'Destroyer'], ['Almirante Guise', 'Destroyer'], ['Teniente Rodríguez', 'Torpedo Boat'],
        ['R-1', 'Submarine'], ['R-2', 'Submarine'], ['R-3', 'Submarine'], ['R-4', 'Submarine'], ['Rímac', 'Transport']] },
    { id: 'amazon', name: 'Amazon River Flotilla', base: 'Iquitos', sea: 'Amazon', fronts: ['qui', 'col', 'bra'],
      ships: [['Amazonas', 'River Gunboat'], ['Loreto', 'River Gunboat'], ['América', 'River Gunboat'], ['Napo', 'River Gunboat'], ['Iquitos', 'River Launch']] },
  ],
  shipNames: ['Huáscar', 'Unión', 'Independencia', 'Pilcomayo', 'Atahualpa', 'Manco Cápac', 'Angamos', 'Pachitea', 'Ucayali', 'Marañón', 'Yavarí', 'Ollanta', 'Chalaco', 'Apurímac',
    'Islay', 'Arica', 'Pacocha', 'Casma', 'Abtao', 'Dos de Mayo', 'Tumbes', 'Paita', 'Chimbote', 'Urubamba'],
  operations: ['Inti', 'Viracocha', 'Illapa', 'Pachamama', 'Amaru', 'Cóndor', 'Puma', 'Chasqui', 'Qhapaq Ñan', 'Sacsayhuamán', 'Ollantay', 'Tumi', 'Ayacucho', 'Junín', 'Dos de Mayo', 'Angamos'],
  enemyOperations: ['Pichincha', 'Tarqui', 'Chimborazo', 'Cotopaxi', 'Boyacá', 'Güepí', 'Ipiranga', 'Riachuelo', 'Ingavi', 'Illimani', 'Chacabuco', 'Maipú'],
  nicknames: ['Condors', 'Pumas', 'Jaguars', 'Falcons', 'Hussars', 'Sentinels', 'Chasquis', 'Sons of the Sun'],
  stateStart: {
    'Piura & Tumbes': [2, 2, 0, 1], 'Lambayeque & La Libertad': [3, 2, 0, 0], 'Cajamarca & Amazonas': [1, 0, 0, 0], 'San Martín': [0, 0, 0, 0], 'Loreto': [1, 1, 0, 1],
    'Ancash': [1, 0, 0, 0], 'Huánuco': [1, 0, 0, 0], 'Junín': [3, 2, 1, 0], 'Lima': [4, 4, 2, 2], 'Ica & Huancavelica': [2, 1, 0, 0], 'Ayacucho & Apurímac': [1, 0, 0, 0],
    'Cuzco & Madre de Dios': [2, 1, 0, 0], 'Arequipa': [3, 2, 1, 0], 'Puno': [2, 0, 0, 0], 'Moquegua & Tacna': [2, 0, 0, 0],
  },
  // 'snow': the Altiplano winter (June–August here); 'heat': the rains and floods of the selva and the Atacama summer (December–February here)
  weather: { south: true, bol: 'snow', qui: 'heat', col: 'heat', bra: 'heat', chi: 'heat' },
  enemyAdjectives: { ECU: 'Ecuadorian', COL: 'Colombian', BRA: 'Brazilian', BOL: 'Bolivian', CHL: 'Chilean', ARG: 'Argentine', PRY: 'Paraguayan', URY: 'Uruguayan', VEN: 'Venezuelan', BGU: 'British', DGU: 'Dutch' },
  ranks: [['Soldado', 'Private'], ['Cabo', 'Corporal'], ['Sargento', 'Sergeant'], ['Subteniente', 'Second Lieutenant'], ['Teniente', 'Lieutenant'], ['Capitán', 'Captain'],
    ['Mayor', 'Major'], ['Teniente Coronel', 'Lieutenant Colonel'], ['Coronel', 'Colonel'], ['General de Brigada', 'Brigadier General'], ['General de División', 'Major General'],
    ['Mariscal del Perú', 'Marshal of Peru']],
  landmarks: [
    { city: 'Quito', medal: 'Chasqui’s Quipu', desc: 'Enter Quito, the northern end of the Qhapaq Ñan' },
    { city: 'Tiwanaku', medal: 'Gate of the Sun', desc: 'Reach Tiwanaku and stand before the Gate of the Sun' },
  ],
  medalNames: {
    ten: 'Order of the Sun of Peru', fifty: 'Order of Ayacucho', decisive: 'Cross of Junín', week: 'Quipucamayoc', month: 'Order of the Mascaypacha',
    phoenix: 'Wings of the Condor', allfronts: 'The Four Suyus', defender: 'Defender of Lima', satrap: 'Apu', comeback: 'Dos de Mayo', thirty: 'Quipu Chronicle',
    empire: 'Sapa Inca', elite: 'The Orejones', hundred: 'Royal Commentaries', hundreddays: 'Order of Inti', marshal: 'Marshal’s Baton',
  },
  masthead: 'EL CENTINELA DEL PERÚ',
  days: [
    { month: 6, day: 24, text: 'Inti Raymi. The sun turns back toward us on every front.' },
    { month: 7, day: 28, text: 'Felices Fiestas Patrias. Firme y feliz por la unión.' },
    { month: 10, day: 8, text: 'Angamos Day. The Navy remembers the Huáscar.' },
    { month: 12, day: 9, text: 'Ayacucho Day. The Army keeps the field it won in 1824.' },
  ],
  motto: 'Ama sua, ama llulla, ama qella — “Do not steal, do not lie, do not be idle.”',
};
