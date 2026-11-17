// France, 1936: the Third Republic. Formable: the First French Empire of Napoleon at its height (c. 1812).
// Coordinates are [lon, lat]. City tuple: [name, lon, lat, vp?, flags?]
// flags: P port, N naval base, A airbase, S supply hub, R heavy industry, F fort, C capital
//
// Approximations forced by building 1936 from modern (Natural Earth) polygons — kept simple and honest:
//  - Germany is the modern Federal Republic. Its 1936 eastern lands (Silesia, Pomerania, East Brandenburg) lie inside the
//    modern Polish polygon and are drawn as Poland; Breslau, Stettin and Danzig keep their 1936 names there. The Free City
//    of Danzig is not separated from Poland.
//  - Italy is modern Italy: Istria, Fiume and Zara (Italian in 1936) are drawn as Yugoslavia; Trieste and South Tyrol are
//    Italian as they were. San Marino and the Vatican are merged into Italy.
//  - Monaco is merged into France (the polygon is too small to draw). Liechtenstein is merged into Switzerland.
//  - Only the northern tip of Morocco is in the extent, so the Moroccan polygon stands for the Spanish protectorate and the
//    Tangier zone. Algeria and Tunisia are French North Africa, a separate bystander tag (the home country must be one
//    contiguous set of whole modern countries).
//  - Yugoslavia, Czechoslovakia, Hungary, Austria and Poland use modern outlines.

export const ID = 'france';
export const HOME = 'FRA';
export const CAPITAL = 'Paris';
export const EXTENT = { lon0: -10.5, lon1: 19.5, lat0: 35.6, lat1: 56.5 };

export const COUNTRIES = {
  FRA: { name: 'France', long: 'French Republic', color: '#3d5fa0', from: ['France', 'Monaco'], spacing: 0.5 },
  GER: { name: 'Germany', long: 'German Reich', color: '#646868', from: ['Germany'], spacing: 0.85 },
  BEL: { name: 'Belgium', long: 'Kingdom of Belgium', color: '#b08a3a', from: ['Belgium'], spacing: 0.55 },
  NLD: { name: 'Netherlands', long: 'Kingdom of the Netherlands', color: '#c47a3a', from: ['Netherlands'], spacing: 0.6 },
  LUX: { name: 'Luxembourg', long: 'Grand Duchy of Luxembourg', color: '#7fa0b0', from: ['Luxembourg'], spacing: 0.5 },
  SWI: { name: 'Switzerland', long: 'Swiss Confederation', color: '#a34a44', from: ['Switzerland', 'Liechtenstein'], spacing: 0.55 },
  ITA: { name: 'Italy', long: 'Kingdom of Italy', color: '#5c8a5c', from: ['Italy', 'San Marino', 'Vatican'], spacing: 0.85 },
  ESP: { name: 'Spain', long: 'Spanish Republic', color: '#b89a3e', from: ['Spain'], spacing: 1.0 },
  POR: { name: 'Portugal', long: 'Portuguese Republic', color: '#3f7f6a', from: ['Portugal'], spacing: 0.9 },
  AND: { name: 'Andorra', long: 'Valleys of Andorra', color: '#8a8ab0', from: ['Andorra'], spacing: 0.5 },
  GBR: { name: 'United Kingdom', long: 'United Kingdom of Great Britain and Northern Ireland', color: '#a8475a',
    from: ['United Kingdom', 'Jersey', 'Guernsey', 'Isle of Man', 'Gibraltar', 'Malta'], spacing: 0.9 },
  AUT: { name: 'Austria', long: 'Federal State of Austria', color: '#b7b0a0', from: ['Austria'], spacing: 0.8 },
  YUG: { name: 'Yugoslavia', long: 'Kingdom of Yugoslavia', color: '#5a6f9a', from: ['Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro'], spacing: 0.9 },
  IRL: { name: 'Ireland', long: 'Irish Free State', color: '#5f9a5a', from: ['Ireland'], spacing: 1.4 },
  DEN: { name: 'Denmark', long: 'Kingdom of Denmark', color: '#9a5a4a', from: ['Denmark'], spacing: 1.3 },
  SWE: { name: 'Sweden', long: 'Kingdom of Sweden', color: '#4f7fb0', from: ['Sweden'], spacing: 1.4 },
  POL: { name: 'Poland', long: 'Republic of Poland', color: '#b56f7f', from: ['Poland'], spacing: 1.4 },
  CZS: { name: 'Czechoslovakia', long: 'Czechoslovak Republic', color: '#4f8f9a', from: ['Czechia', 'Slovakia'], spacing: 1.3 },
  HUN: { name: 'Hungary', long: 'Kingdom of Hungary', color: '#8f6a4a', from: ['Hungary'], spacing: 1.4 },
  ALB: { name: 'Albania', long: 'Albanian Kingdom', color: '#8a4a5a', from: ['Albania'], spacing: 1.4 },
  AFN: { name: 'French North Africa', long: 'French Algeria & the Protectorate of Tunisia', color: '#6a82b8', from: ['Algeria', 'Tunisia'], spacing: 1.4 },
  MAR: { name: 'Spanish Morocco', long: 'Spanish Protectorate in Morocco & the Tangier Zone', color: '#b0a04e', from: ['Morocco'], spacing: 1.4 },
};

// The historical provinces (gouvernements) of France, grouped, and their cities
export const HOME_STATES = {
  'Île-de-France': [
    ['Paris', 2.35, 48.86, 50, 'CASF'], ['Versailles', 2.13, 48.80, 5], ['Fontainebleau', 2.70, 48.40, 3], ['Beauvais', 2.08, 49.43, 3],
    ['Compiègne', 2.83, 49.42, 3], ['Soissons', 3.32, 49.38, 3], ['Laon', 3.62, 49.56, 1],
  ],
  'Normandy': [
    ['Rouen', 1.10, 49.44, 10, 'S'], ['Le Havre', 0.11, 49.49, 10, 'P'], ['Caen', -0.37, 49.18, 5], ['Cherbourg', -1.62, 49.64, 5, 'PN'],
    ['Dieppe', 1.08, 49.92, 3], ['Évreux', 1.15, 49.02, 1], ['Alençon', 0.09, 48.43, 1], ['Saint-Lô', -1.09, 49.12, 1],
  ],
  'Brittany': [
    ['Rennes', -1.68, 48.11, 10, 'S'], ['Brest', -4.49, 48.39, 10, 'PN'], ['Nantes', -1.55, 47.22, 10], ['Saint-Nazaire', -2.21, 47.27, 5, 'P'],
    ['Lorient', -3.37, 47.75, 5, 'PN'], ['Saint-Malo', -2.01, 48.65, 3], ['Quimper', -4.10, 48.00, 3], ['Saint-Brieuc', -2.76, 48.51, 1],
  ],
  'Flanders & Picardy': [
    ['Lille', 3.06, 50.63, 15, 'S'], ['Dunkirk', 2.38, 51.03, 5, 'P'], ['Calais', 1.86, 50.95, 5], ['Boulogne', 1.61, 50.73, 3],
    ['Arras', 2.78, 50.29, 5], ['Amiens', 2.30, 49.89, 10], ['Saint-Quentin', 3.29, 49.85, 3], ['Valenciennes', 3.52, 50.36, 3],
    ['Maubeuge', 3.97, 50.28, 3, 'F'],
  ],
  'Champagne': [
    ['Reims', 4.03, 49.26, 10, 'A'], ['Troyes', 4.07, 48.30, 5], ['Châlons-sur-Marne', 4.36, 48.96, 3], ['Charleville', 4.72, 49.77, 3],
    ['Sedan', 4.94, 49.70, 3], ['Chaumont', 5.14, 48.11, 1], ['Sens', 3.28, 48.20, 1],
  ],
  'Lorraine': [
    ['Nancy', 6.18, 48.69, 10, 'S'], ['Metz', 6.18, 49.12, 10, 'AF'], ['Thionville', 6.17, 49.36, 5, 'RF'], ['Verdun', 5.38, 49.16, 5, 'F'],
    ['Toul', 5.89, 48.68, 3], ['Épinal', 6.45, 48.17, 3], ['Longwy', 5.76, 49.52, 3], ['Montmédy', 5.37, 49.52, 1, 'F'],
    ['Bitche', 7.43, 49.05, 1, 'F'],
  ],
  'Alsace': [
    ['Strasbourg', 7.75, 48.58, 15, 'F'], ['Mulhouse', 7.34, 47.75, 5], ['Colmar', 7.36, 48.08, 3], ['Belfort', 6.86, 47.64, 5, 'F'],
  ],
  'Burgundy & Franche-Comté': [
    ['Dijon', 5.04, 47.32, 10, 'AS'], ['Besançon', 6.02, 47.24, 5], ['Le Creusot', 4.42, 46.80, 5, 'R'], ['Chalon-sur-Saône', 4.85, 46.78, 3],
    ['Auxerre', 3.57, 47.80, 3], ['Nevers', 3.16, 46.99, 3], ['Pontarlier', 6.36, 46.90, 1, 'F'], ['Vesoul', 6.15, 47.62, 1],
    ['Bourg-en-Bresse', 5.23, 46.21, 1],
  ],
  'Anjou & Orléanais': [
    ['Orléans', 1.91, 47.90, 10], ['Tours', 0.69, 47.39, 10, 'A'], ['Angers', -0.55, 47.47, 5], ['Le Mans', 0.20, 48.00, 5],
    ['Bourges', 2.40, 47.08, 5], ['Chartres', 1.49, 48.45, 3, 'A'], ['Blois', 1.33, 47.59, 3], ['Châteauroux', 1.69, 46.81, 3],
    ['Laval', -0.77, 48.07, 1],
  ],
  'Poitou & Limousin': [
    ['Poitiers', 0.34, 46.58, 5], ['La Rochelle', -1.15, 46.16, 5], ['Rochefort', -0.96, 45.94, 3], ['Angoulême', 0.16, 45.65, 3],
    ['Niort', -0.46, 46.32, 1], ['La Roche-sur-Yon', -1.43, 46.67, 1], ['Limoges', 1.26, 45.83, 5], ['Brive', 1.53, 45.16, 1],
  ],
  'Auvergne & Lyonnais': [
    ['Lyon', 4.84, 45.76, 20, 'AS'], ['Saint-Étienne', 4.39, 45.44, 10, 'R'], ['Clermont-Ferrand', 3.08, 45.78, 10], ['Vichy', 3.43, 46.13, 3],
    ['Moulins', 3.33, 46.57, 1], ['Aurillac', 2.44, 44.93, 1], ['Le Puy', 3.88, 45.04, 1], ['Roanne', 4.07, 46.04, 1],
  ],
  'Guyenne & Gascony': [
    ['Bordeaux', -0.58, 44.84, 15, 'PAS'], ['Bayonne', -1.47, 43.49, 5, 'F'], ['Pau', -0.37, 43.30, 3], ['Périgueux', 0.72, 45.18, 3],
    ['Agen', 0.62, 44.20, 1], ['Montauban', 1.35, 44.02, 3], ['Cahors', 1.44, 44.45, 1], ['Rodez', 2.57, 44.35, 1],
    ['Tarbes', 0.08, 43.23, 3], ['Auch', 0.59, 43.65, 1], ['Mont-de-Marsan', -0.50, 43.89, 1],
  ],
  'Languedoc & Roussillon': [
    ['Toulouse', 1.44, 43.60, 15, 'AS'], ['Montpellier', 3.88, 43.61, 10], ['Nîmes', 4.36, 43.84, 5], ['Perpignan', 2.90, 42.70, 5],
    ['Mont-Louis', 2.12, 42.51, 1, 'F'], ['Béziers', 3.22, 43.34, 3], ['Narbonne', 3.00, 43.18, 3], ['Carcassonne', 2.35, 43.21, 3],
    ['Sète', 3.70, 43.40, 3], ['Albi', 2.15, 43.93, 3], ['Mende', 3.50, 44.52, 1], ['Alès', 4.08, 44.13, 3],
  ],
  'Provence': [
    ['Marseille', 5.37, 43.30, 20, 'PS'], ['Toulon', 5.93, 43.12, 10, 'PN'], ['Nice', 7.27, 43.70, 10], ['Avignon', 4.81, 43.95, 5],
    ['Aix-en-Provence', 5.45, 43.53, 3], ['Istres', 4.99, 43.51, 3, 'A'], ['Arles', 4.63, 43.68, 3], ['Cannes', 7.01, 43.55, 3],
    ['Digne', 6.24, 44.09, 1], ['Sospel', 7.45, 43.88, 1, 'F'],
  ],
  'Dauphiné & Savoy': [
    ['Grenoble', 5.72, 45.19, 10], ['Chambéry', 5.92, 45.57, 3], ['Annecy', 6.13, 45.90, 3], ['Valence', 4.89, 44.93, 3],
    ['Briançon', 6.64, 44.90, 1, 'F'], ['Modane', 6.66, 45.20, 1, 'F'], ['Gap', 6.08, 44.56, 1],
  ],
  'Corsica': [
    ['Ajaccio', 8.74, 41.92, 3, 'P'], ['Bastia', 9.45, 42.70, 3], ['Bonifacio', 9.16, 41.39, 1],
  ],
};

// Foreign cities by country tag → region → cities. Regions are the lands the Empire held or dominated in 1812.
export const FOREIGN = {
  GER: {
    'Rhineland': [['Cologne', 6.96, 50.94, 15], ['Aachen', 6.08, 50.78, 10], ['Koblenz', 7.60, 50.36, 5], ['Trier', 6.64, 49.76, 3]],
    'Palatinate & Saar': [['Mainz', 8.27, 50.00, 5], ['Saarbrücken', 7.00, 49.24, 5], ['Kaiserslautern', 7.77, 49.44, 1]],
    'Baden': [['Karlsruhe', 8.40, 49.01, 5], ['Freiburg', 7.85, 48.00, 3], ['Mannheim', 8.47, 49.49, 5]],
    'Württemberg': [['Stuttgart', 9.18, 48.78, 10], ['Ulm', 9.99, 48.40, 5]],
    'Bavaria': [['Munich', 11.58, 48.14, 15], ['Nuremberg', 11.08, 49.45, 10], ['Augsburg', 10.90, 48.37, 5], ['Regensburg', 12.10, 49.02, 3], ['Würzburg', 9.93, 49.79, 3]],
    'Frankfurt & Hesse': [['Frankfurt', 8.68, 50.11, 10], ['Fulda', 9.68, 50.55, 1]],
    'Berg & the Ruhr': [['Düsseldorf', 6.78, 51.23, 5], ['Essen', 7.01, 51.46, 10], ['Dortmund', 7.47, 51.51, 5], ['Münster', 7.63, 51.96, 3]],
    'Westphalia': [['Kassel', 9.48, 51.31, 5], ['Hanover', 9.73, 52.37, 10], ['Brunswick', 10.52, 52.27, 3], ['Magdeburg', 11.63, 52.13, 5]],
    'Hanse Coast': [['Hamburg', 9.99, 53.55, 20], ['Bremen', 8.80, 53.08, 10], ['Lübeck', 10.69, 53.87, 5], ['Emden', 7.21, 53.37, 1]],
    'Saxony & Thuringia': [['Dresden', 13.74, 51.05, 10], ['Leipzig', 12.37, 51.34, 10], ['Jena', 11.59, 50.93, 5], ['Erfurt', 11.03, 50.98, 3]],
    'Brandenburg': [['Berlin', 13.40, 52.52, 30], ['Frankfurt an der Oder', 14.55, 52.34, 1]],
    'Mecklenburg & Holstein': [['Kiel', 10.13, 54.32, 5], ['Rostock', 12.14, 54.09, 3], ['Stralsund', 13.09, 54.31, 1]],
  },
  BEL: {
    'Flanders': [['Bruges', 3.22, 51.21, 3], ['Ghent', 3.72, 51.05, 5], ['Ostend', 2.92, 51.23, 3], ['Ypres', 2.89, 50.85, 3], ['Kortrijk', 3.26, 50.83, 1]],
    'Brabant': [['Brussels', 4.35, 50.85, 20], ['Antwerp', 4.40, 51.22, 10], ['Waterloo', 4.40, 50.68, 10], ['Leuven', 4.70, 50.88, 1]],
    'Hainaut': [['Mons', 3.95, 50.45, 3], ['Charleroi', 4.44, 50.41, 5], ['Tournai', 3.39, 50.61, 1]],
    'Liège & Namur': [['Liège', 5.57, 50.63, 10], ['Namur', 4.87, 50.47, 5], ['Dinant', 4.91, 50.26, 1], ['Hasselt', 5.34, 50.93, 1], ['Verviers', 5.86, 50.59, 1]],
    'Belgian Ardennes': [['Bastogne', 5.72, 50.00, 1], ['Arlon', 5.82, 49.68, 1], ['Bouillon', 5.07, 49.79, 1]],
  },
  LUX: { 'Luxembourg': [['Luxembourg', 6.13, 49.61, 5], ['Esch-sur-Alzette', 5.98, 49.50, 1], ['Diekirch', 6.16, 49.87, 1]] },
  NLD: {
    'Holland': [['Amsterdam', 4.90, 52.37, 20], ['Rotterdam', 4.48, 51.92, 10], ['The Hague', 4.31, 52.08, 5], ['Utrecht', 5.12, 52.09, 3], ['Den Helder', 4.76, 52.96, 1]],
    'Zeeland & North Brabant': [['Middelburg', 3.61, 51.50, 1], ['Breda', 4.78, 51.59, 3], ['Eindhoven', 5.48, 51.44, 3], ["'s-Hertogenbosch", 5.30, 51.69, 1]],
    'Limburg': [['Maastricht', 5.69, 50.85, 5], ['Venlo', 6.17, 51.37, 1]],
    'Gelderland & Overijssel': [['Arnhem', 5.91, 51.98, 3], ['Zwolle', 6.09, 52.51, 1], ['Enschede', 6.89, 52.22, 1]],
    'Friesland & Groningen': [['Groningen', 6.57, 53.22, 5], ['Leeuwarden', 5.80, 53.20, 3]],
  },
  SWI: {
    'Romandy': [['Geneva', 6.14, 46.20, 10], ['Lausanne', 6.63, 46.52, 5], ['Neuchâtel', 6.93, 46.99, 3], ['Fribourg', 7.16, 46.80, 1]],
    'Valais': [['Sion', 7.36, 46.23, 3], ['Brig', 7.99, 46.32, 1], ['Martigny', 7.07, 46.10, 1]],
    'Basel & the Jura': [['Basel', 7.59, 47.56, 10], ['Porrentruy', 7.08, 47.42, 1], ['Biel', 7.25, 47.14, 1]],
    'Bern': [['Bern', 7.45, 46.95, 15], ['Thun', 7.63, 46.76, 1], ['Interlaken', 7.86, 46.69, 1]],
    'Zurich & Central Switzerland': [['Zurich', 8.54, 47.37, 15], ['Lucerne', 8.31, 47.05, 5], ['Aarau', 8.05, 47.39, 1], ['Schaffhausen', 8.63, 47.70, 1], ['St. Gallen', 9.38, 47.42, 3]],
    'Ticino': [['Lugano', 8.95, 46.01, 3], ['Bellinzona', 9.02, 46.19, 1], ['Andermatt', 8.59, 46.64, 1]],
    'Graubünden': [['Chur', 9.53, 46.85, 3], ['Davos', 9.84, 46.80, 1], ['St. Moritz', 9.84, 46.50, 1]],
    'Liechtenstein': [['Vaduz', 9.52, 47.14, 1]],
  },
  AUT: {
    'Tyrol & Vorarlberg': [['Innsbruck', 11.39, 47.27, 5], ['Bregenz', 9.75, 47.50, 1], ['Landeck', 10.57, 47.14, 1], ['Kufstein', 12.17, 47.58, 1], ['Lienz', 12.77, 46.83, 1]],
    'Salzburg': [['Salzburg', 13.05, 47.80, 5]],
    'Upper & Lower Austria': [['Vienna', 16.37, 48.21, 20], ['Linz', 14.29, 48.31, 5]],
    'Styria & Carinthia': [['Graz', 15.44, 47.07, 5], ['Klagenfurt', 14.31, 46.62, 3], ['Villach', 13.85, 46.61, 1]],
  },
  ITA: {
    'Piedmont': [['Turin', 7.69, 45.07, 15], ['Marengo', 8.68, 44.89, 10], ['Cuneo', 7.55, 44.39, 3], ['Aosta', 7.32, 45.74, 1]],
    'Liguria': [['Genoa', 8.93, 44.41, 15], ['Savona', 8.48, 44.31, 3], ['La Spezia', 9.82, 44.10, 5]],
    'Lombardy': [['Milan', 9.19, 45.46, 20], ['Brescia', 10.22, 45.54, 3], ['Mantua', 10.79, 45.16, 3]],
    'Venetia': [['Venice', 12.33, 45.44, 15], ['Verona', 10.99, 45.44, 5], ['Udine', 13.24, 46.07, 1], ['Trento', 11.12, 46.07, 3]],
    'Julian March': [['Trieste', 13.77, 45.65, 10]],
    'Emilia & Romagna': [['Bologna', 11.34, 44.49, 10], ['Parma', 10.33, 44.80, 3], ['Ravenna', 12.20, 44.42, 1]],
    'Tuscany': [['Florence', 11.26, 43.77, 15], ['Livorno', 10.31, 43.55, 5], ['Piombino', 10.53, 42.93, 1]],
    'Latium & Umbria': [['Rome', 12.50, 41.90, 30], ['Perugia', 12.39, 43.11, 3]],
    'Abruzzo & the Marches': [['Ancona', 13.52, 43.62, 3], ["L'Aquila", 13.40, 42.35, 1], ['Pescara', 14.21, 42.46, 1]],
    'Campania': [['Naples', 14.27, 40.85, 20], ['Gaeta', 13.57, 41.21, 3]],
    'Apulia & Calabria': [['Bari', 16.87, 41.12, 5], ['Taranto', 17.24, 40.47, 10], ['Brindisi', 17.94, 40.63, 3], ['Reggio Calabria', 15.65, 38.11, 3], ['Catanzaro', 16.59, 38.91, 1]],
    'Sicily': [['Palermo', 13.36, 38.12, 15], ['Messina', 15.55, 38.19, 5], ['Catania', 15.09, 37.50, 5], ['Syracuse', 15.29, 37.08, 3]],
    'Sardinia': [['Cagliari', 9.11, 39.22, 5], ['Sassari', 8.56, 40.73, 3], ['Olbia', 9.50, 40.92, 1]],
  },
  YUG: {
    'Carniola': [['Ljubljana', 14.51, 46.05, 10], ['Maribor', 15.65, 46.56, 1]],
    'Croatia': [['Zagreb', 15.98, 45.81, 10], ['Fiume', 14.44, 45.33, 3], ['Pola', 13.85, 44.87, 3], ['Karlovac', 15.55, 45.49, 1]],
    'Dalmatia': [['Split', 16.44, 43.51, 5], ['Zara', 15.23, 44.12, 3], ['Ragusa', 18.09, 42.65, 5]],
    'Slavonia': [['Osijek', 18.69, 45.55, 1], ['Slavonski Brod', 18.02, 45.16, 1]],
    'Bosnia': [['Sarajevo', 18.41, 43.86, 5], ['Banja Luka', 17.19, 44.77, 1], ['Mostar', 17.81, 43.34, 1]],
    'Montenegro': [['Cetinje', 18.92, 42.39, 1]],
    'Vojvodina': [['Sombor', 19.11, 45.77, 1]],
  },
  ESP: {
    'Catalonia': [['Barcelona', 2.17, 41.39, 20], ['Girona', 2.82, 41.98, 3], ['Lleida', 0.62, 41.62, 3], ['Tarragona', 1.25, 41.12, 3], ['Figueres', 2.96, 42.27, 1]],
    'Aragon': [['Zaragoza', -0.88, 41.65, 10], ['Huesca', -0.41, 42.14, 1], ['Teruel', -1.11, 40.34, 1]],
    'Navarre & the Basque Country': [['Pamplona', -1.64, 42.82, 5], ['San Sebastián', -1.98, 43.32, 5], ['Bilbao', -2.93, 43.26, 10], ['Vitoria', -2.67, 42.85, 3]],
    'Old Castile & León': [['Burgos', -3.70, 42.34, 5], ['Valladolid', -4.72, 41.65, 5], ['Santander', -3.80, 43.46, 3], ['Salamanca', -5.66, 40.97, 3], ['León', -5.57, 42.60, 3]],
    'New Castile': [['Madrid', -3.70, 40.42, 30], ['Toledo', -4.02, 39.86, 5], ['Albacete', -1.86, 38.99, 1]],
    'Galicia & Asturias': [['La Coruña', -8.40, 43.37, 5], ['Vigo', -8.72, 42.24, 3], ['Oviedo', -5.85, 43.36, 5]],
    'Extremadura': [['Badajoz', -6.97, 38.88, 3], ['Cáceres', -6.37, 39.47, 1]],
    'Valencia & Murcia': [['Valencia', -0.38, 39.47, 15], ['Alicante', -0.48, 38.35, 3], ['Cartagena', -0.98, 37.60, 5], ['Murcia', -1.13, 37.99, 3]],
    'Andalusia': [['Seville', -5.98, 37.39, 15], ['Cádiz', -6.29, 36.53, 5], ['Córdoba', -4.78, 37.89, 5], ['Granada', -3.60, 37.18, 5], ['Málaga', -4.42, 36.72, 5], ['Almería', -2.46, 36.84, 1], ['Bailén', -3.78, 38.09, 1]],
    'Balearic Islands': [['Palma', 2.65, 39.57, 3], ['Mahón', 4.27, 39.89, 1], ['Ibiza', 1.43, 38.91, 1]],
  },
  POR: {
    'Estremadura': [['Lisbon', -9.14, 38.72, 20], ['Torres Vedras', -9.26, 39.09, 3]],
    'Douro & Minho': [['Porto', -8.61, 41.15, 10], ['Braga', -8.43, 41.55, 1], ['Bragança', -6.76, 41.81, 1]],
    'Beira': [['Coimbra', -8.43, 40.21, 3], ['Guarda', -7.27, 40.54, 1]],
    'Alentejo & Algarve': [['Évora', -7.91, 38.57, 1], ['Elvas', -7.16, 38.88, 1], ['Faro', -7.93, 37.02, 1]],
  },
  AND: { 'Andorra': [['Andorra la Vella', 1.52, 42.51, 1]] },
  GBR: {
    'Kent & Sussex': [['Dover', 1.31, 51.13, 5], ['Hastings', 0.57, 50.86, 3], ['Brighton', -0.14, 50.82, 3], ['Chatham', 0.53, 51.38, 3]],
    'London': [['London', -0.12, 51.51, 40]],
    'Wessex': [['Portsmouth', -1.09, 50.80, 10], ['Southampton', -1.40, 50.90, 5], ['Salisbury', -1.79, 51.07, 1], ['Bristol', -2.59, 51.45, 10], ['Oxford', -1.26, 51.75, 3]],
    'Cornwall & Devon': [['Plymouth', -4.14, 50.38, 10], ['Exeter', -3.53, 50.72, 3], ['Falmouth', -5.07, 50.15, 1]],
    'East Anglia': [['Norwich', 1.30, 52.63, 3], ['Cambridge', 0.12, 52.21, 3], ['Ipswich', 1.16, 52.06, 1]],
    'The Midlands': [['Birmingham', -1.90, 52.48, 15], ['Nottingham', -1.15, 52.95, 3], ['Lincoln', -0.54, 53.23, 1]],
    'Lancashire & Yorkshire': [['Manchester', -2.24, 53.48, 15], ['Liverpool', -2.98, 53.41, 15], ['Leeds', -1.55, 53.80, 10], ['Sheffield', -1.47, 53.38, 5], ['Hull', -0.34, 53.74, 3], ['York', -1.08, 53.96, 3]],
    'Northumbria': [['Newcastle', -1.61, 54.98, 10], ['Carlisle', -2.94, 54.89, 1], ['Middlesbrough', -1.23, 54.57, 1]],
    'Wales': [['Cardiff', -3.18, 51.48, 5], ['Swansea', -3.94, 51.62, 3], ['Aberystwyth', -4.08, 52.41, 1], ['Caernarfon', -4.27, 53.14, 1]],
    'Scotland': [['Edinburgh', -3.19, 55.95, 15], ['Glasgow', -4.25, 55.86, 15], ['Dumfries', -3.61, 55.07, 1]],
    'Ulster': [['Belfast', -5.93, 54.60, 5], ['Londonderry', -7.31, 55.00, 1]],
    'Channel Islands': [['Saint Helier', -2.11, 49.19, 1]],
    'Malta': [['Valletta', 14.51, 35.90, 5]],
  },
  IRL: { 'Irish Free State': [['Dublin', -6.26, 53.35, 10], ['Cork', -8.47, 51.90, 3], ['Limerick', -8.63, 52.66, 1], ['Galway', -9.05, 53.27, 1], ['Waterford', -7.11, 52.26, 1]] },
  DEN: { 'Denmark': [['Copenhagen', 12.57, 55.68, 10], ['Aarhus', 10.21, 56.16, 3], ['Odense', 10.39, 55.40, 1], ['Esbjerg', 8.45, 55.47, 1]] },
  SWE: { 'Scania': [['Malmö', 13.00, 55.61, 5], ['Helsingborg', 12.69, 56.05, 1]] },
  POL: {
    'Greater Poland': [['Poznań', 16.93, 52.41, 5], ['Bydgoszcz', 18.00, 53.12, 1], ['Toruń', 18.60, 53.01, 1]],
    'Pomerania': [['Danzig', 18.65, 54.35, 5], ['Gdynia', 18.54, 54.52, 3], ['Stettin', 14.55, 53.43, 5]],
    'Silesia': [['Breslau', 17.03, 51.11, 5], ['Katowice', 19.02, 50.26, 3]],
  },
  CZS: {
    'Bohemia': [['Prague', 14.42, 50.08, 20], ['Plzeň', 13.38, 49.75, 3]],
    'Moravia': [['Brno', 16.61, 49.20, 5], ['Ostrava', 18.29, 49.84, 1]],
    'Slovakia': [['Bratislava', 17.11, 48.15, 5]],
  },
  HUN: { 'Transdanubia': [['Budapest', 19.04, 47.50, 20], ['Győr', 17.63, 47.69, 1], ['Pécs', 18.23, 46.07, 1]] },
  ALB: { 'Albania': [['Durazzo', 19.44, 41.32, 1]] },
  AFN: {
    'Algeria': [['Algiers', 3.06, 36.75, 15], ['Oran', -0.63, 35.70, 5], ['Constantine', 6.61, 36.37, 5], ['Bône', 7.77, 36.90, 3], ['Philippeville', 6.91, 36.88, 1], ['Bougie', 5.08, 36.75, 1]],
    'Tunisia': [['Tunis', 10.18, 36.80, 10], ['Bizerte', 9.87, 37.27, 5], ['Sousse', 10.64, 35.83, 1]],
  },
  MAR: { 'Spanish Morocco': [['Tangier', -5.80, 35.77, 3]] },
};

// The stretches of the home coast that the two naval theatres face
const CHANNEL_COAST = [[2.45, 51.06], [1.85, 50.98], [1.58, 50.87], [1.57, 50.70], [1.55, 50.40], [1.50, 50.20], [1.08, 49.94], [0.37, 49.77], [0.08, 49.52],
  [0.05, 49.36], [-0.30, 49.30], [-1.05, 49.39], [-1.26, 49.67], [-1.62, 49.66], [-1.94, 49.72], [-1.79, 49.37], [-1.60, 48.84], [-1.51, 48.64],
  [-2.00, 48.66], [-2.32, 48.68], [-2.72, 48.54], [-3.04, 48.80], [-3.45, 48.82], [-3.98, 48.73], [-4.60, 48.60], [-4.78, 48.36]];
const MED_COAST = [[3.17, 42.44], [3.10, 42.52], [3.04, 42.70], [3.05, 42.92], [3.17, 43.15], [3.50, 43.28], [3.70, 43.40], [4.13, 43.53], [4.43, 43.45],
  [4.85, 43.33], [5.35, 43.28], [5.60, 43.17], [5.93, 43.08], [6.15, 43.03], [6.68, 43.20], [6.75, 43.42], [7.02, 43.54], [7.27, 43.69], [7.52, 43.77],
  [9.40, 43.00], [9.46, 42.70], [9.55, 42.10], [9.30, 41.60], [9.16, 41.38], [8.80, 41.60], [8.74, 41.90], [8.60, 42.30], [8.75, 42.57], [9.30, 42.75]];

// Fronts. `subs` = modern-country polygons that make up the objective zone; together they approximate the Empire of 1812
// and its client states (Confederation of the Rhine, Kingdoms of Italy, Naples and Spain, Helvetia, the Illyrian Provinces),
// plus Britain, the enemy the Empire never reached.
// Italy is split at 41.55°N: the north and centre (Kingdom of Italy and the annexed departments down to Rome) belong to the
// Alpine Front, the south and the islands (Kingdom of Naples, Sicily, Sardinia) to the Mediterranean Theatre.
export const FRONTS = [
  { id: 'rhi', name: 'Rhine Front', enemy: 'GER', enemyName: 'Germany', subs: ['Germany'], defaultLabel: 'School',
    satrapy: 'the Confederation of the Rhine', hq: 'Nancy' },
  { id: 'low', name: 'Flanders Front', enemy: 'BEL', enemyName: 'Belgium', subs: ['Belgium', 'Netherlands', 'Luxembourg'], defaultLabel: 'Family',
    satrapy: 'the Low Countries', hq: 'Lille' },
  { id: 'alp', name: 'Alpine Front', enemy: 'ITA', enemyName: 'Italy', subs: ['Italy', 'San Marino', 'Vatican', 'Slovenia', 'Croatia'], box: [6.0, 41.55, 19.5, 47.6], defaultLabel: 'Partner',
    satrapy: 'the Kingdom of Italy & the Illyrian Provinces', hq: 'Grenoble' },
  { id: 'jur', name: 'Jura Front', enemy: 'SWI', enemyName: 'Switzerland', subs: ['Switzerland', 'Liechtenstein', 'Austria'], box: [5.5, 45.5, 13.2, 48.0], defaultLabel: 'Work',
    satrapy: 'Helvetia & the Tyrol', hq: 'Besançon' },
  { id: 'pyr', name: 'Pyrenees Front', enemy: 'ESP', enemyName: 'Spain', subs: ['Spain', 'Portugal', 'Andorra'], defaultLabel: 'Health',
    satrapy: 'the Kingdom of Spain & Portugal', hq: 'Toulouse' },
  { id: 'man', name: 'Channel Theatre', enemy: 'GBR', enemyName: 'Royal Navy', naval: true, coast: CHANNEL_COAST, coastKm: 60,
    subs: ['United Kingdom', 'Jersey', 'Guernsey', 'Isle of Man'], defaultLabel: 'Friends',
    satrapy: 'Albion', hq: 'Cherbourg' },
  { id: 'med', name: 'Mediterranean Theatre', enemy: 'ITA', enemyName: 'Regia Marina', naval: true, coast: MED_COAST, coastKm: 60,
    subs: ['Italy', 'Malta'], box: [7.5, 35.6, 19.5, 41.55], defaultLabel: 'Self',
    satrapy: 'the Kingdom of Naples & the Islands', hq: 'Toulon' },
];

// Terrain. ranges: polyline + half-width in degrees
export const RANGES = [
  { name: 'Alps', w: 0.5, pts: [[7.3, 44.05], [6.95, 44.6], [6.95, 45.2], [6.9, 45.85]] },
  { name: 'Alps', w: 0.65, pts: [[6.9, 45.85], [7.8, 46.0], [8.6, 46.5], [9.8, 46.6], [10.5, 46.8], [11.5, 47.0], [12.7, 47.1], [13.8, 47.3], [14.8, 47.4]] },
  { name: 'Dolomites', w: 0.4, pts: [[11.2, 46.4], [12.3, 46.5], [13.6, 46.4], [14.3, 46.35]] },
  { name: 'Jura', w: 0.3, pts: [[5.7, 46.0], [6.0, 46.5], [6.5, 47.0], [7.2, 47.35]] },
  { name: 'Vosges', w: 0.25, pts: [[6.85, 47.8], [7.1, 48.3], [7.25, 48.8], [7.5, 49.1]] },
  { name: 'Massif Central', w: 0.5, pts: [[2.9, 45.8], [2.75, 45.15], [3.3, 44.6], [3.7, 44.25], [3.0, 43.65]] },
  { name: 'Forez', w: 0.25, pts: [[3.8, 45.75], [4.15, 45.0], [4.2, 44.6]] },
  { name: 'Pyrenees', w: 0.4, pts: [[-1.6, 43.1], [-0.6, 42.85], [0.6, 42.7], [1.6, 42.6], [2.4, 42.45], [3.0, 42.45]] },
  { name: 'Corsican Mountains', w: 0.3, pts: [[8.9, 42.5], [9.1, 42.1], [9.2, 41.7]] },
  { name: 'Cantabrian Mountains', w: 0.4, pts: [[-7.0, 43.0], [-5.0, 43.05], [-3.5, 43.0], [-2.2, 43.0]] },
  { name: 'Sistema Central', w: 0.35, pts: [[-6.2, 40.3], [-5.0, 40.3], [-3.9, 40.85], [-3.2, 41.1]] },
  { name: 'Sistema Ibérico', w: 0.4, pts: [[-3.0, 42.0], [-1.8, 41.0], [-1.0, 40.3]] },
  { name: 'Sierra Morena', w: 0.3, pts: [[-6.5, 37.95], [-4.5, 38.35], [-3.0, 38.45]] },
  { name: 'Sierra Nevada', w: 0.4, pts: [[-5.2, 36.75], [-3.3, 37.05], [-2.0, 37.6], [-0.9, 38.4]] },
  { name: 'Apennines', w: 0.4, pts: [[8.6, 44.45], [9.6, 44.4], [10.8, 44.15], [12.0, 43.7], [13.1, 42.9], [13.8, 42.2], [14.6, 41.5], [15.6, 40.6], [16.2, 39.8], [16.4, 38.9], [15.9, 38.2]] },
  { name: 'Dinaric Alps', w: 0.6, pts: [[14.6, 45.3], [15.8, 44.4], [17.0, 43.6], [18.4, 42.9], [19.4, 42.4]] },
  { name: 'Black Forest', w: 0.25, pts: [[7.95, 47.8], [8.2, 48.3], [8.4, 48.7]] },
  { name: 'Harz', w: 0.25, pts: [[10.3, 51.8], [11.1, 51.7]] },
  { name: 'Bohemian Forest', w: 0.3, pts: [[12.4, 49.9], [13.2, 49.2], [13.9, 48.7]] },
  { name: 'Ore Mountains', w: 0.25, pts: [[12.4, 50.3], [13.5, 50.6], [14.3, 50.85]] },
  { name: 'Sudetes', w: 0.3, pts: [[15.2, 50.8], [16.3, 50.5], [17.2, 50.1]] },
  { name: 'Carpathians', w: 0.5, pts: [[17.5, 48.6], [18.6, 49.2], [19.5, 49.25]] },
  { name: 'Pennines', w: 0.3, pts: [[-2.0, 53.2], [-2.2, 54.2], [-2.5, 54.9]] },
  { name: 'Cambrian Mountains', w: 0.35, pts: [[-3.6, 51.9], [-3.7, 52.6], [-3.9, 53.05]] },
  { name: 'Southern Uplands', w: 0.3, pts: [[-4.2, 55.2], [-2.8, 55.45]] },
  { name: 'Tell Atlas', w: 0.4, pts: [[0.5, 35.9], [3.0, 36.35], [5.0, 36.4], [7.5, 36.4], [9.0, 36.5]] },
];
export const DESERTS = [];
export const FORESTS = [ // [lon, lat, rx, ry]
  [5.3, 50.0, 1.0, 0.35], [6.6, 50.3, 0.5, 0.3], [5.0, 49.1, 0.2, 0.4], [-0.8, 44.2, 0.6, 0.7], [1.9, 47.5, 0.5, 0.3], [4.0, 47.15, 0.35, 0.4],
  [10.7, 50.6, 0.7, 0.25], [9.3, 48.4, 0.8, 0.2], [13.0, 49.0, 0.5, 0.4], [7.5, 49.3, 0.5, 0.25], [8.5, 51.2, 0.6, 0.35],
];
export const MARSHES = [[4.55, 43.5, 0.3, 0.15], [-1.0, 46.35, 0.35, 0.15], [12.3, 44.9, 0.25, 0.2], [13.0, 41.45, 0.2, 0.12], [-6.3, 37.0, 0.3, 0.25], [0.1, 52.6, 0.4, 0.3]];

export const LAKES = [
  { name: 'Lake Geneva', pts: [[6.15, 46.21], [6.24, 46.38], [6.50, 46.51], [6.63, 46.51], [6.84, 46.46], [6.93, 46.40], [6.80, 46.39], [6.59, 46.40], [6.48, 46.38], [6.33, 46.37], [6.23, 46.30]] },
  { name: 'Lake Constance', pts: [[9.17, 47.66], [9.03, 47.81], [9.30, 47.70], [9.48, 47.65], [9.68, 47.54], [9.74, 47.51], [9.49, 47.48], [9.38, 47.56], [9.18, 47.65]] },
  { name: 'Lake Neuchâtel', pts: [[6.64, 46.78], [6.93, 46.99], [7.05, 47.01], [6.95, 46.90], [6.70, 46.78]] },
  { name: 'Lake Maggiore', pts: [[8.80, 46.17], [8.73, 46.05], [8.60, 45.95], [8.55, 45.80], [8.58, 45.72], [8.65, 45.80], [8.68, 45.97], [8.82, 46.10]] },
  { name: 'Lake Como', pts: [[9.38, 46.17], [9.42, 46.13], [9.30, 45.98], [9.39, 45.86], [9.36, 45.85], [9.26, 45.96], [9.09, 45.81], [9.06, 45.83], [9.22, 46.00], [9.33, 46.15]] },
  { name: 'Lake Garda', pts: [[10.85, 45.88], [10.72, 45.63], [10.75, 45.45], [10.60, 45.44], [10.54, 45.50], [10.63, 45.62], [10.78, 45.80]] },
  { name: 'Lake Balaton', pts: [[17.25, 46.72], [17.60, 46.90], [18.15, 47.05], [18.17, 46.98], [17.75, 46.80], [17.30, 46.70]] },
];
export const RIVERS = [
  { name: 'Seine', pts: [[4.72, 47.49], [4.57, 47.86], [4.07, 48.30], [3.72, 48.52], [2.96, 48.38], [2.66, 48.54], [2.35, 48.86], [1.72, 48.99], [1.41, 49.25], [1.10, 49.44], [0.73, 49.52], [0.20, 49.45]] },
  { name: 'Marne', pts: [[5.33, 47.80], [5.14, 48.11], [4.95, 48.64], [4.58, 48.72], [4.36, 48.96], [3.95, 49.04], [3.40, 49.05], [2.88, 48.96], [2.41, 48.82]] },
  { name: 'Loire', pts: [[4.22, 44.84], [3.95, 45.05], [4.25, 45.50], [4.07, 46.04], [3.98, 46.48], [3.16, 46.99], [2.92, 47.41], [2.63, 47.69], [1.91, 47.90], [1.33, 47.59], [0.69, 47.39], [-0.08, 47.26], [-0.55, 47.40], [-1.55, 47.21], [-2.18, 47.28]] },
  { name: 'Upper Rhône', pts: [[8.37, 46.57], [7.99, 46.32], [7.36, 46.23], [7.07, 46.10], [6.90, 46.38]] },
  { name: 'Rhône', pts: [[6.15, 46.20], [5.83, 46.10], [5.80, 45.75], [5.35, 45.88], [4.84, 45.75], [4.87, 45.52], [4.89, 44.93], [4.75, 44.56], [4.80, 43.95], [4.63, 43.68], [4.84, 43.33]] },
  { name: 'Saône', pts: [[6.18, 48.09], [5.59, 47.45], [5.39, 47.19], [4.85, 46.78], [4.83, 46.31], [4.83, 45.74]] },
  { name: 'Garonne', pts: [[0.75, 42.70], [0.72, 43.11], [1.00, 43.22], [1.44, 43.60], [1.10, 44.05], [0.62, 44.20], [0.17, 44.50], [-0.25, 44.55], [-0.57, 44.84], [-0.53, 45.04], [-0.75, 45.20], [-1.05, 45.58]] },
  { name: 'Dordogne', pts: [[2.81, 45.53], [2.50, 45.40], [1.94, 45.09], [1.48, 44.89], [0.48, 44.85], [-0.24, 44.92], [-0.53, 45.04]] },
  { name: 'Somme', pts: [[3.29, 49.85], [2.93, 49.93], [2.30, 49.89], [1.83, 50.11], [1.60, 50.22]] },
  { name: 'Meuse', pts: [[5.63, 48.00], [5.70, 48.36], [5.59, 48.76], [5.38, 49.16], [5.19, 49.49], [4.94, 49.70], [4.72, 49.77], [4.82, 50.14], [4.91, 50.26], [4.87, 50.47], [5.57, 50.64], [5.69, 50.85], [5.99, 51.19], [6.17, 51.37], [5.88, 51.73], [5.30, 51.75], [4.70, 51.72]] },
  { name: 'Moselle', pts: [[6.88, 47.89], [6.59, 48.02], [6.45, 48.17], [5.89, 48.68], [6.13, 48.76], [6.18, 49.12], [6.17, 49.36], [6.37, 49.47], [6.64, 49.76], [7.07, 49.92], [7.17, 50.15], [7.60, 50.36]] },
  { name: 'Alpine Rhine', pts: [[9.20, 46.66], [9.53, 46.85], [9.50, 47.10], [9.65, 47.50]] },
  { name: 'Rhine', pts: [[9.17, 47.66], [8.63, 47.70], [8.21, 47.62], [7.59, 47.56], [7.58, 48.03], [7.80, 48.58], [8.18, 48.97], [8.45, 49.32], [8.46, 49.49], [8.27, 50.00], [7.90, 49.97], [7.60, 50.36], [7.10, 50.73], [6.96, 50.94], [6.77, 51.23], [6.62, 51.66], [6.25, 51.83], [5.90, 51.90], [5.00, 51.90], [4.48, 51.92], [4.10, 51.98]] },
  { name: 'Danube', pts: [[8.50, 47.95], [9.99, 48.40], [11.43, 48.76], [12.10, 49.02], [13.46, 48.57], [14.29, 48.31], [16.37, 48.21], [17.11, 48.15], [18.12, 47.74], [19.00, 47.78], [19.04, 47.50], [18.95, 46.60], [18.90, 45.90], [19.40, 45.25]] },
  { name: 'Elbe', pts: [[14.47, 50.35], [13.74, 51.05], [12.65, 51.87], [11.63, 52.13], [11.75, 53.00], [9.99, 53.55], [8.70, 53.87]] },
  { name: 'Po', pts: [[7.10, 44.70], [7.69, 45.07], [8.45, 45.13], [9.20, 45.14], [9.69, 45.05], [10.02, 45.13], [10.80, 45.05], [11.60, 44.90], [12.40, 44.97]] },
  { name: 'Ebro', pts: [[-4.14, 43.00], [-2.95, 42.69], [-2.45, 42.47], [-1.60, 42.06], [-0.88, 41.65], [0.30, 41.37], [0.52, 40.81], [0.86, 40.72]] },
  { name: 'Tagus', pts: [[-1.90, 40.30], [-3.60, 40.03], [-4.02, 39.86], [-4.83, 39.96], [-6.88, 39.72], [-8.20, 39.46], [-8.68, 39.23], [-9.10, 38.70]] },
  { name: 'Thames', pts: [[-1.26, 51.75], [-0.97, 51.45], [-0.61, 51.48], [-0.12, 51.51], [0.36, 51.45], [0.85, 51.48]] },
];

// Railways. The whole French network existed in 1936; the great radial trunk lines out of Paris are stage 0, and the
// cross-country and strategic lines stand for the later stages (in the game: doubled, electrified and brought up to
// military capacity as national infrastructure grows).
export const RAILWAYS = [
  { name: 'Ligne du Nord (Paris–Lille)', stage: 0, via: ['Paris', [2.47, 49.26], 'Amiens', 'Arras', 'Lille', 'Dunkirk'] },
  { name: 'Ligne de l’Est (Paris–Strasbourg)', stage: 0, via: ['Paris', [3.40, 49.05], [3.95, 49.04], 'Châlons-sur-Marne', [5.16, 48.77], 'Toul', 'Nancy', [7.05, 48.73], 'Strasbourg'] },
  { name: 'PLM (Paris–Lyon–Méditerranée)', stage: 0, via: ['Paris', 'Fontainebleau', 'Sens', [3.50, 47.97], 'Dijon', 'Chalon-sur-Saône', [4.83, 46.31], 'Lyon', 'Valence', 'Avignon', 'Arles', 'Marseille', 'Toulon', 'Cannes', 'Nice'] },
  { name: 'Paris–Orléans–Bordeaux', stage: 0, via: ['Paris', [2.16, 48.43], 'Orléans', 'Blois', 'Tours', 'Poitiers', 'Angoulême', 'Bordeaux', [-1.05, 43.71], 'Bayonne'] },
  { name: 'Paris–Le Havre', stage: 0, via: ['Paris', [1.72, 48.99], 'Rouen', 'Le Havre'] },
  { name: 'Paris–Brest', stage: 0, via: ['Paris', 'Versailles', 'Chartres', 'Le Mans', 'Laval', 'Rennes', 'Saint-Brieuc', 'Brest'] },
  { name: 'Paris–Toulouse', stage: 0, via: ['Orléans', [2.07, 47.22], 'Châteauroux', 'Limoges', 'Brive', 'Cahors', 'Montauban', 'Toulouse'] },
  { name: 'Rocade du Nord-Est (Lille–Metz)', stage: 1, via: ['Lille', 'Valenciennes', [4.08, 49.92], 'Charleville', 'Sedan', 'Montmédy', 'Longwy', 'Thionville', 'Metz', 'Nancy'] },
  { name: 'Ligne du Midi (Bordeaux–Sète)', stage: 1, via: ['Bordeaux', 'Agen', 'Montauban', 'Toulouse', 'Carcassonne', 'Narbonne', 'Béziers', 'Sète', 'Montpellier', 'Nîmes', 'Avignon'] },
  { name: 'Rhin–Rhône (Dijon–Strasbourg)', stage: 2, via: ['Dijon', 'Besançon', 'Belfort', 'Mulhouse', 'Colmar', 'Strasbourg'] },
  { name: 'Transversale de la Loire (Saint-Nazaire–Chalon)', stage: 3, via: ['Saint-Nazaire', 'Nantes', 'Angers', 'Tours', [2.07, 47.22], 'Bourges', 'Nevers', 'Le Creusot', 'Chalon-sur-Saône'] },
  { name: 'Ligne de la Maurienne (Lyon–Mont-Cenis)', stage: 4, via: ['Lyon', 'Chambéry', [6.35, 45.28], 'Modane'] },
];

export const SEA_LABELS = [
  ['ATLANTIC OCEAN', -8.0, 46.5, 1.4], ['BAY OF BISCAY', -4.2, 45.2, 1.1], ['ENGLISH CHANNEL', -2.2, 49.95, 0.9, -8], ['NORTH SEA', 3.6, 54.6, 1.3],
  ['MEDITERRANEAN SEA', 5.2, 38.4, 1.3], ['Gulf of Lion', 4.2, 42.75, 0.7], ['TYRRHENIAN SEA', 12.2, 39.9, 1.0], ['ADRIATIC SEA', 15.3, 43.0, 0.9, 38],
  ['Ligurian Sea', 9.0, 43.6, 0.6], ['BALTIC SEA', 16.2, 55.3, 1.0], ['Irish Sea', -4.8, 53.7, 0.6], ['Strait of Dover', 1.5, 51.05, 0.5], ['Ionian Sea', 18.0, 38.2, 0.8],
];
export const HOME_LABEL = [2.5, 46.6];
export const COUNTRY_LABELS = [['GER', 'GERMANY', 10.4, 51.0, 17], ['ITA', 'ITALY', 11.6, 43.2, 14], ['ESP', 'SPAIN', -3.6, 39.9, 17], ['GBR', 'UNITED KINGDOM', -1.6, 52.9, 13],
  ['BEL', 'BELGIUM', 4.6, 50.6, 8], ['NLD', 'NETHERLANDS', 5.6, 52.3, 8], ['SWI', 'SWITZERLAND', 8.2, 46.8, 8], ['POR', 'PORTUGAL', -8.1, 39.6, 9],
  ['AUT', 'AUSTRIA', 14.4, 47.6, 9], ['YUG', 'YUGOSLAVIA', 17.4, 44.5, 10], ['POL', 'POLAND', 17.6, 52.6, 12], ['CZS', 'CZECHOSLOVAKIA', 16.0, 49.6, 9],
  ['IRL', 'IRELAND', -8.0, 53.2, 10], ['AFN', 'ALGERIA', 3.2, 36.1, 10], ['HUN', 'HUNGARY', 18.4, 47.0, 9], ['DEN', 'DENMARK', 9.3, 56.0, 8]];

// where the fleet counters sit: our two squadrons, and the enemy squadron on each naval front
export const FLEET_AT = { ponant: [-5.9, 47.7], levant: [5.6, 42.5], 'enemy:man': [-2.9, 50.05], 'enemy:med': [11.6, 40.4] };

// The French Empire in 1812 with its client states: the 130 departments from Hamburg to Rome, the Confederation of the
// Rhine, Helvetia, the Kingdoms of Italy, Naples and Spain and the Illyrian Provinces. Not drawn: the Duchy of Warsaw
// (mostly east of the extent and cut off from the rest by Prussia), and Portugal, which the Empire never held for long.
export const EMPIRE = [[-4.9, 48.4], [-3.5, 48.95], [-1.9, 49.8], [0.0, 49.8], [1.6, 51.0], [3.4, 51.6], [4.4, 52.5], [4.7, 53.1], [6.5, 53.6], [8.3, 54.0], [8.9, 54.0],
  [10.9, 54.0], [11.5, 54.2], [12.5, 54.45], [13.0, 54.2], [13.8, 53.5], [13.0, 53.2], [11.6, 53.1], [11.8, 52.6], [11.8, 52.1], [12.9, 52.05], [13.9, 52.0], [14.7, 51.95],
  [15.0, 51.3], [15.0, 50.9], [14.3, 50.9], [13.0, 50.4], [12.2, 50.3], [12.5, 49.8], [13.6, 48.9], [13.8, 48.5], [13.5, 48.0], [13.1, 47.6], [12.3, 47.3], [13.0, 47.0],
  [14.0, 46.75], [15.0, 46.1], [16.4, 45.5], [15.8, 45.2], [16.0, 44.2], [16.5, 43.9], [17.5, 43.2], [18.5, 42.6], [18.8, 42.3], [18.7, 40.1], [18.0, 39.6], [16.9, 39.9],
  [17.3, 38.9], [16.2, 37.8], [15.6, 37.9], [15.6, 38.4], [15.9, 39.3], [14.9, 40.1], [14.0, 40.7], [13.3, 41.1], [12.1, 41.7], [11.0, 42.3], [10.0, 42.6], [9.8, 41.3],
  [8.4, 41.3], [8.3, 42.6], [7.0, 43.2], [5.9, 42.9], [4.5, 43.2], [3.3, 42.3], [3.4, 41.8], [2.3, 41.2], [1.0, 40.5], [-0.1, 39.4], [0.3, 38.7], [-0.7, 37.5],
  [-2.2, 36.6], [-4.4, 36.6], [-5.4, 36.0], [-6.4, 36.4], [-7.4, 37.1], [-7.5, 37.6], [-6.9, 38.2], [-7.3, 39.0], [-6.9, 39.7], [-6.8, 41.0], [-6.2, 41.6], [-6.6, 41.95],
  [-8.2, 42.0], [-8.9, 41.9], [-9.4, 43.0], [-8.0, 43.9], [-5.0, 43.7], [-2.0, 43.5], [-1.6, 44.5], [-1.4, 46.0], [-2.6, 47.2], [-4.5, 47.7]];

export const META = {
  name: 'France',
  long: 'French Republic',
  empire: 'French Empire',
  year: 1936,
  blurb: 'Seven frontiers from the Rhine to the Pyrenees. Restore the empire of Napoleon.',
  pitch: 'a 1936 grand-strategy war map of France',
  // the real flag in use in the scenario's year (icons/flags/README.md has its source and licence); `colors` are its main paints
  flag: { image: 'icons/flags/france.png', sizes: { 64: 'icons/flags/france-64.png', 128: 'icons/flags/france-128.png', 320: 'icons/flags/france.png' }, ratio: 1.5, colors: ['#002654', '#ffffff', '#ce1126'] },
  regionWord: 'Province',
  // FOREIGN region → the name it bore under the Empire: the French departments of 1812 where the land was annexed, the
  // client state where it was not
  regions: {
    'Rhineland': 'the Roer', 'Palatinate & Saar': 'Mont-Tonnerre', 'Frankfurt & Hesse': 'Frankfurt', 'Berg & the Ruhr': 'Berg',
    'Hanse Coast': 'the Bouches-de-l’Elbe', 'Saxony & Thuringia': 'Saxony', 'Mecklenburg & Holstein': 'Mecklenburg',
    'Flanders': 'the Lys', 'Brabant': 'the Dyle', 'Hainaut': 'Jemmapes', 'Liège & Namur': 'the Ourthe', 'Belgian Ardennes': 'Sambre-et-Meuse', 'Luxembourg': 'the Forêts',
    'Holland': 'the Zuyderzée', 'Zeeland & North Brabant': 'the Bouches-du-Rhin', 'Limburg': 'the Meuse-Inférieure', 'Gelderland & Overijssel': 'the Yssel-Supérieur', 'Friesland & Groningen': 'Frise',
    'Romandy': 'Léman', 'Valais': 'the Simplon', 'Basel & the Jura': 'Mont-Terrible', 'Zurich & Central Switzerland': 'Helvetia', 'Graubünden': 'Rhaetia', 'Tyrol & Vorarlberg': 'the Tyrol',
    'Piedmont': 'the Pô', 'Liguria': 'Gênes', 'Lombardy': 'the Olona', 'Venetia': 'the Adriatico', 'Julian March': 'Istria', 'Emilia & Romagna': 'the Reno', 'Tuscany': 'the Arno',
    'Latium & Umbria': 'Rome', 'Abruzzo & the Marches': 'the Metauro', 'Campania': 'Naples', 'Carniola': 'Carniola', 'Croatia': 'Civil Croatia', 'Dalmatia': 'Dalmatia & Ragusa',
    'Catalonia': 'Montserrat', 'Navarre & the Basque Country': 'Biscay',
  },
  capitalFalls: 'The government leaves for Bordeaux. The war goes on.',
  capitalFreed: 'Paris is free again. The government returns to the capital.',
  fightsOnFrom: 'Bordeaux',
  honor: {
    rhi: ['Lorraine', 'Alsace', 'Metz', 'Nancy', 'Strasbourg', 'Vosges', 'Moselle', 'Verdun', 'Meuse', 'Champagne'],
    low: ['Flandre', 'Artois', 'Picardie', 'Lille', 'Ardennes', 'Hainaut', 'Cambrésis', 'Somme', 'Thiérache', 'Boulonnais'],
    alp: ['Dauphiné', 'Savoie', 'Provence', 'Briançon', 'Maurienne', 'Tarentaise', 'Nice', 'Queyras', 'Ubaye', 'Vercors'],
    jur: ['Franche-Comté', 'Jura', 'Bourgogne', 'Besançon', 'Doubs', 'Bresse', 'Belfort', 'Morvan', 'Gex', 'Lyonnais'],
    pyr: ['Gascogne', 'Béarn', 'Roussillon', 'Navarre', 'Bigorre', 'Languedoc', 'Guyenne', 'Foix', 'Toulouse', 'Pays Basque'],
    man: ['Normandie', 'Bretagne', 'Cotentin', 'Finistère', 'Saint-Malo', 'Cornouaille', 'Caux', 'Léon', 'Boulogne', 'Dunkerque'],
    med: ['Marseille', 'Toulon', 'Corse', 'Camargue', 'Sète', 'Hyères', 'Ajaccio', 'Estérel', 'Maures', 'Bastia'],
  },
  // invented names, not historical officers
  commanders: {
    rhi: 'Gen. Auguste Delormel', low: 'Gen. Octave Desrosiers', alp: 'Gen. Fernand Bressolier', jur: 'Gen. Émile Grandvaux',
    pyr: 'Gen. Raymond Etcheverry', man: 'Adm. Hervé Le Bozec', med: 'Adm. Honoré Castellan',
  },
  oob: {
    rhi: ['inf', 'inf', 'art', 'mot'], low: ['inf', 'mot', 'cav', 'arm'], alp: ['mtn', 'mtn', 'inf', 'art'], jur: ['inf', 'mtn', 'art'],
    pyr: ['mtn', 'inf', 'cav'], man: ['mar', 'inf', 'inf'], med: ['mar', 'inf', 'art'],
  },
  guard: [['grd', 'Garde républicaine de Paris'], ['arm', '1re Division Légère Mécanique']],
  officerNames: {
    first: ['Henri', 'Louis', 'Marcel', 'André', 'Georges', 'Pierre', 'Jean', 'René', 'Lucien', 'Émile', 'Fernand', 'Gaston', 'Raymond', 'Maurice', 'Étienne', 'Albert'],
    last: ['Marchand', 'Delmas', 'Roussel', 'Fabre', 'Lemoine', 'Perrin', 'Gauthier', 'Chevallier', 'Bonnet', 'Vasseur', 'Mercier', 'Aubert', 'Renaud', 'Guérin', 'Barbier', 'Morel'],
    ranks: { div: 'Gén.', bde: 'Col.', guard: 'Gén. de div.' },
  },
  wings: [
    { name: '4e Escadre de Chasse', type: 'fighter', model: 'Dewoitine D.500', base: 'Reims', planes: 36 },
    { name: '7e Escadre de Chasse', type: 'fighter', model: 'Dewoitine D.510', base: 'Dijon', planes: 24 },
    { name: '35e Escadre de Reconnaissance', type: 'cas', model: 'Potez 25', base: 'Lyon', planes: 24 },
    { name: '38e Escadre de Bombardement', type: 'bomber', model: 'Amiot 143', base: 'Metz', planes: 24 },
  ],
  newWingModels: { fighter: 'Morane-Saulnier MS.406', cas: 'Breguet 693', bomber: 'Lioré et Olivier LeO 45' },
  fleets: [
    { id: 'ponant', name: 'Escadre de l’Atlantique', base: 'Brest', sea: 'Atlantic & Channel', fronts: ['man', 'low', 'pyr'],
      ships: [['Bretagne', 'Battleship'], ['Provence', 'Battleship'], ['Émile Bertin', 'Light Cruiser'], ['Le Fantasque', 'Destroyer'], ['Le Terrible', 'Destroyer'], ['Bourrasque', 'Destroyer'], ['Surcouf', 'Submarine']] },
    { id: 'levant', name: 'Escadre de la Méditerranée', base: 'Toulon', sea: 'Mediterranean', fronts: ['med', 'alp'],
      ships: [['Lorraine', 'Battleship'], ['Algérie', 'Heavy Cruiser'], ['Dupleix', 'Heavy Cruiser'], ['Foch', 'Heavy Cruiser'], ['La Galissonnière', 'Light Cruiser'], ['Vauquelin', 'Destroyer'], ['Guépard', 'Destroyer'], ['Redoutable', 'Submarine']] },
  ],
  shipNames: ['Dunkerque', 'Strasbourg', 'Richelieu', 'Jean Bart', 'Clemenceau', 'Gascogne', 'Georges Leygues', 'Gloire', 'Montcalm', 'De Grasse', 'Mogador', 'Volta',
    'Le Hardi', 'Fleuret', 'Épée', 'Casabianca', 'Sfax', 'Le Triomphant', 'L’Indomptable', 'Kléber', 'Marceau', 'Desaix', 'Joffre', 'Painlevé'],
  operations: ['Austerlitz', 'Marengo', 'Valmy', 'Jeanne d’Arc', 'Roland', 'Durandal', 'Charlemagne', 'Bouvines', 'Vercingétorix', 'Oriflamme', 'Montjoie', 'Fleurus',
    'Rivoli', 'Bayard', 'Marianne', 'Mélusine'],
  enemyOperations: ['Siegfried', 'Nibelungen', 'Lorelei', 'Rheingold', 'Trafalgar', 'Agincourt', 'Crécy', 'Aquila', 'Tevere', 'Cid', 'Winkelried', 'Oranje'],
  nicknames: ['Grognards', 'Eagles', 'Lions', 'Wolves', 'Blue Devils', 'Boars', 'Cuirassiers', 'Lancers'],
  stateStart: {
    'Île-de-France': [5, 7, 3, 0], 'Normandy': [4, 3, 1, 1], 'Brittany': [3, 1, 0, 2], 'Flanders & Picardy': [5, 5, 1, 1], 'Champagne': [3, 2, 0, 0],
    'Lorraine': [4, 4, 2, 0], 'Alsace': [4, 2, 1, 0], 'Burgundy & Franche-Comté': [3, 2, 2, 0], 'Anjou & Orléanais': [3, 2, 1, 0], 'Poitou & Limousin': [2, 1, 1, 0],
    'Auvergne & Lyonnais': [4, 4, 2, 0], 'Guyenne & Gascony': [3, 2, 1, 1], 'Languedoc & Roussillon': [3, 2, 1, 0], 'Provence': [3, 3, 0, 2],
    'Dauphiné & Savoy': [3, 2, 0, 0], 'Corsica': [1, 0, 0, 0],
  },
  weather: { alp: 'snow', jur: 'snow', pyr: 'snow', rhi: 'snow', med: 'heat' },
  enemyAdjectives: { GER: 'German', BEL: 'Belgian', NLD: 'Dutch', LUX: 'Luxembourg', ITA: 'Italian', SWI: 'Swiss', AUT: 'Austrian', ESP: 'Spanish', POR: 'Portuguese',
    AND: 'Andorran', GBR: 'British', YUG: 'Yugoslav' },
  ranks: [['Soldat', 'Private'], ['Caporal', 'Corporal'], ['Sergent', 'Sergeant'], ['Adjudant', 'Warrant Officer'], ['Sous-lieutenant', 'Second Lieutenant'],
    ['Lieutenant', 'Lieutenant'], ['Capitaine', 'Captain'], ['Commandant', 'Major'], ['Colonel', 'Colonel'], ['Général de brigade', 'Brigadier General'],
    ['Général de division', 'Major General'], ['Maréchal de France', 'Marshal of France']],
  landmarks: [
    { city: 'Marengo', medal: 'Sabre of Marengo', desc: 'Win the field of Marengo, beyond the Alps' },
    { city: 'Waterloo', medal: 'Eagle of the Old Guard', desc: 'Hold the field of Waterloo and change the ending' },
  ],
  medalNames: {
    ten: 'Croix de Guerre', fifty: 'Médaille militaire', decisive: 'Légion d’honneur', week: 'Palmes of the Week', month: 'Ordre du Mérite',
    phoenix: 'Phénix', allfronts: 'Seven Tricolours', defender: 'Defender of Paris', satrap: 'Préfet', comeback: 'Le Sursaut', empire: 'Empereur des Français',
    elite: 'The Old Guard', marshal: 'Marshal’s Baton',
  },
  masthead: 'L’ÉCHO DE L’ARMÉE',
  days: [
    { month: 7, day: 14, text: 'Fête nationale. The tricolour flies on every front.' },
    { month: 11, day: 11, text: 'Armistice Day. Remember the men of 1918.' },
    { month: 12, day: 2, text: 'The sun of Austerlitz rose on this day in 1805.' },
  ],
  motto: 'Impossible n’est pas français. — “Impossible is not French.”',
};
