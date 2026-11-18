import { EXTRA_LEAGUES, EXTRA_CLUBS, PROMOTION_RULES } from './leaguesExtra.js';
// 2026/27 seed database: leagues and clubs.
// Club lists reflect confirmed 2026/27 promotions/relegations.
// Managers marked null are unknown/unconfirmed in the seed — run `npm run hydrate` to refresh.
//
// Club tuple: [id, name, short, stadium, capacity, city, manager, primaryColor, secondaryColor, reputation(1-100)]

const BASE_LEAGUES = [
  {
    id: 'eng1', name: 'Premier League', country: 'England', nat: 'ENG', sportsDbName: 'English Premier League',
    legs: 2, start: '2026-08-22', end: '2027-05-23', breaks: [['2026-09-05', '2026-09-13'], ['2026-10-10', '2026-10-18'], ['2026-11-14', '2026-11-22'], ['2027-03-20', '2027-03-28']],
    valueFactor: 1.35, ticket: 55, tvPerMatch: 2_600_000, prizeTop: 180_000_000, strength: 1.0, trophyQuery: 'Premier League trophy',
    wikiImage: 'Premier League',
  },
  {
    id: 'esp1', name: 'La Liga', country: 'Spain', nat: 'ESP', sportsDbName: 'Spanish La Liga',
    legs: 2, start: '2026-08-15', end: '2027-05-30', breaks: [['2026-09-05', '2026-09-13'], ['2026-10-10', '2026-10-18'], ['2026-11-14', '2026-11-22'], ['2026-12-24', '2027-01-01'], ['2027-03-20', '2027-03-28']],
    valueFactor: 1.05, ticket: 45, tvPerMatch: 1_500_000, prizeTop: 90_000_000, strength: 0.94, trophyQuery: 'La Liga trophy',
    wikiImage: 'La Liga',
  },
  {
    id: 'ita1', name: 'Serie A', country: 'Italy', nat: 'ITA', sportsDbName: 'Italian Serie A',
    legs: 2, start: '2026-08-22', end: '2027-05-30', breaks: [['2026-09-26', '2026-10-04'], ['2026-11-14', '2026-11-15'], ['2026-12-26', '2026-12-27'], ['2027-03-27', '2027-03-28']],
    valueFactor: 0.95, ticket: 35, tvPerMatch: 1_150_000, prizeTop: 70_000_000, strength: 0.9, trophyQuery: 'Serie A trophy Scudetto',
    wikiImage: 'Serie A',
  },
  {
    id: 'ger1', name: 'Bundesliga', country: 'Germany', nat: 'GER', sportsDbName: 'German Bundesliga',
    legs: 2, start: '2026-08-28', end: '2027-05-22', breaks: [['2026-12-21', '2027-01-14'], ['2026-10-10', '2026-10-16'], ['2027-03-20', '2027-03-26']],
    valueFactor: 1.0, ticket: 35, tvPerMatch: 1_250_000, prizeTop: 75_000_000, strength: 0.9, trophyQuery: 'Bundesliga Meisterschale',
    wikiImage: 'Meisterschale',
  },
  {
    id: 'fra1', name: 'Ligue 1', country: 'France', nat: 'FRA', sportsDbName: 'French Ligue 1',
    legs: 2, start: '2026-08-21', end: '2027-05-29', breaks: [['2026-12-14', '2027-01-02'], ['2026-10-10', '2026-10-16']],
    valueFactor: 0.85, ticket: 30, tvPerMatch: 650_000, prizeTop: 45_000_000, strength: 0.82, trophyQuery: 'Ligue 1 trophy Hexagoal',
    wikiImage: 'Ligue 1',
  },
  {
    id: 'svn1', name: 'Prva Liga Telemach', country: 'Slovenia', nat: 'SVN', sportsDbName: 'Slovenian PrvaLiga',
    legs: 4, start: '2026-07-17', end: '2027-05-22', breaks: [['2026-12-06', '2027-01-29']],
    valueFactor: 0.22, ticket: 8, tvPerMatch: 25_000, prizeTop: 1_200_000, strength: 0.45, trophyQuery: 'Slovenian PrvaLiga',
    wikiImage: 'Slovenian PrvaLiga',
  },
];

const C = (id, name, short, stadium, cap, city, manager, c1, c2, rep) => ({ id, name, short, stadium, capacity: cap, city, manager, colors: [c1, c2], rep });

const BASE_CLUBS = {
  eng1: [
    C('arsenal', 'Arsenal', 'ARS', 'Emirates Stadium', 60704, 'London', 'Mikel Arteta', '#EF0107', '#FFFFFF', 93),
    C('aston-villa', 'Aston Villa', 'AVL', 'Villa Park', 42640, 'Birmingham', 'Unai Emery', '#670E36', '#95BFE5', 82),
    C('bournemouth', 'AFC Bournemouth', 'BOU', 'Vitality Stadium', 11307, 'Bournemouth', null, '#DA291C', '#000000', 70),
    C('brentford', 'Brentford', 'BRE', 'Gtech Community Stadium', 17250, 'London', 'Keith Andrews', '#E30613', '#FFFFFF', 69),
    C('brighton', 'Brighton & Hove Albion', 'BHA', 'Amex Stadium', 31876, 'Brighton', 'Fabian Hürzeler', '#0057B8', '#FFFFFF', 74),
    C('chelsea', 'Chelsea', 'CHE', 'Stamford Bridge', 40343, 'London', null, '#034694', '#FFFFFF', 88),
    C('coventry', 'Coventry City', 'COV', 'Coventry Building Society Arena', 32609, 'Coventry', 'Frank Lampard', '#77B0E3', '#FFFFFF', 60),
    C('crystal-palace', 'Crystal Palace', 'CRY', 'Selhurst Park', 25486, 'London', null, '#1B458F', '#C4122E', 72),
    C('everton', 'Everton', 'EVE', 'Hill Dickinson Stadium', 52888, 'Liverpool', 'David Moyes', '#003399', '#FFFFFF', 70),
    C('fulham', 'Fulham', 'FUL', 'Craven Cottage', 29589, 'London', 'Marco Silva', '#FFFFFF', '#000000', 68),
    C('hull', 'Hull City', 'HUL', 'MKM Stadium', 25586, 'Hull', null, '#F5A12D', '#000000', 57),
    C('ipswich', 'Ipswich Town', 'IPS', 'Portman Road', 29813, 'Ipswich', 'Kieran McKenna', '#0044A9', '#FFFFFF', 60),
    C('leeds', 'Leeds United', 'LEE', 'Elland Road', 37645, 'Leeds', 'Daniel Farke', '#FFFFFF', '#1D428A', 66),
    C('liverpool', 'Liverpool', 'LIV', 'Anfield', 61276, 'Liverpool', 'Arne Slot', '#C8102E', '#F6EB61', 92),
    C('man-city', 'Manchester City', 'MCI', 'Etihad Stadium', 61470, 'Manchester', null, '#6CABDD', '#1C2C5B', 92),
    C('man-utd', 'Manchester United', 'MUN', 'Old Trafford', 74197, 'Manchester', null, '#DA291C', '#FBE122', 84),
    C('newcastle', 'Newcastle United', 'NEW', "St James' Park", 52305, 'Newcastle', 'Eddie Howe', '#241F20', '#FFFFFF', 83),
    C('nottm-forest', 'Nottingham Forest', 'NFO', 'City Ground', 30404, 'Nottingham', null, '#DD0000', '#FFFFFF', 70),
    C('sunderland', 'Sunderland', 'SUN', 'Stadium of Light', 49000, 'Sunderland', 'Régis Le Bris', '#EB172B', '#FFFFFF', 64),
    C('tottenham', 'Tottenham Hotspur', 'TOT', 'Tottenham Hotspur Stadium', 62850, 'London', null, '#FFFFFF', '#132257', 82),
  ],
  esp1: [
    C('alaves', 'Deportivo Alavés', 'ALA', 'Mendizorrotza', 19840, 'Vitoria-Gasteiz', null, '#0761AF', '#FFFFFF', 60),
    C('athletic', 'Athletic Club', 'ATH', 'San Mamés', 53289, 'Bilbao', null, '#EE2523', '#FFFFFF', 76),
    C('atletico', 'Atlético Madrid', 'ATM', 'Riyadh Air Metropolitano', 70460, 'Madrid', 'Diego Simeone', '#CB3524', '#FFFFFF', 86),
    C('barcelona', 'FC Barcelona', 'BAR', 'Spotify Camp Nou', 62000, 'Barcelona', 'Hansi Flick', '#A50044', '#004D98', 94),
    C('betis', 'Real Betis', 'BET', 'Estadio Benito Villamarín', 60720, 'Seville', 'Manuel Pellegrini', '#00954C', '#FFFFFF', 74),
    C('celta', 'Celta Vigo', 'CEL', 'Abanca-Balaídos', 24870, 'Vigo', 'Claudio Giráldez', '#8AC3EE', '#FFFFFF', 66),
    C('deportivo', 'Deportivo La Coruña', 'DEP', 'Abanca-Riazor', 32490, 'A Coruña', null, '#0067B1', '#FFFFFF', 58),
    C('elche', 'Elche CF', 'ELC', 'Estadio Martínez Valero', 31388, 'Elche', 'Eder Sarabia', '#05642C', '#FFFFFF', 56),
    C('espanyol', 'RCD Espanyol', 'ESP', 'RCDE Stadium', 40000, 'Barcelona', 'Manolo González', '#007FC8', '#FFFFFF', 62),
    C('getafe', 'Getafe CF', 'GET', 'Coliseum', 16500, 'Getafe', 'José Bordalás', '#005999', '#FFFFFF', 60),
    C('levante', 'Levante UD', 'LEV', 'Estadio Ciutat de València', 26354, 'Valencia', null, '#B4053F', '#004C97', 56),
    C('malaga', 'Málaga CF', 'MAL', 'La Rosaleda', 30044, 'Málaga', null, '#3E8FDE', '#FFFFFF', 56),
    C('osasuna', 'CA Osasuna', 'OSA', 'El Sadar', 23576, 'Pamplona', null, '#D91A21', '#0A346F', 61),
    C('racing', 'Racing Santander', 'RAC', 'El Sardinero', 22222, 'Santander', null, '#007A3D', '#FFFFFF', 55),
    C('rayo', 'Rayo Vallecano', 'RAY', 'Estadio de Vallecas', 14708, 'Madrid', null, '#FFFFFF', '#E53027', 60),
    C('real-madrid', 'Real Madrid', 'RMA', 'Santiago Bernabéu', 83186, 'Madrid', 'José Mourinho', '#FFFFFF', '#FEBE10', 96),
    C('real-sociedad', 'Real Sociedad', 'RSO', 'Reale Arena', 39500, 'San Sebastián', null, '#0067B1', '#FFFFFF', 72),
    C('sevilla', 'Sevilla FC', 'SEV', 'Ramón Sánchez-Pizjuán', 43883, 'Seville', null, '#FFFFFF', '#D4021D', 70),
    C('valencia', 'Valencia CF', 'VAL', 'Mestalla', 49430, 'Valencia', null, '#FFFFFF', '#EE3524', 68),
    C('villarreal', 'Villarreal CF', 'VIL', 'Estadio de la Cerámica', 23500, 'Villarreal', 'Marcelino', '#FFE667', '#005187', 77),
  ],
  ita1: [
    C('atalanta', 'Atalanta', 'ATA', 'Gewiss Stadium', 24950, 'Bergamo', 'Maurizio Sarri', '#1E71B8', '#000000', 78),
    C('bologna', 'Bologna', 'BOL', "Stadio Renato Dall'Ara", 36462, 'Bologna', 'Domenico Tedesco', '#1A2F48', '#A21C26', 72),
    C('cagliari', 'Cagliari', 'CAG', 'Unipol Domus', 16416, 'Cagliari', null, '#B01028', '#002350', 58),
    C('como', 'Como 1907', 'COM', 'Stadio Giuseppe Sinigaglia', 13602, 'Como', 'Cesc Fàbregas', '#003DA5', '#FFFFFF', 74),
    C('fiorentina', 'Fiorentina', 'FIO', 'Stadio Artemio Franchi', 43147, 'Florence', null, '#482E92', '#FFFFFF', 70),
    C('frosinone', 'Frosinone', 'FRO', 'Stadio Benito Stirpe', 16227, 'Frosinone', null, '#FFDB00', '#004B87', 52),
    C('genoa', 'Genoa', 'GEN', 'Stadio Luigi Ferraris', 33205, 'Genoa', null, '#A41E34', '#002B5C', 60),
    C('inter', 'Inter', 'INT', 'San Siro', 75817, 'Milan', 'Cristian Chivu', '#0068A8', '#000000', 89),
    C('juventus', 'Juventus', 'JUV', 'Allianz Stadium', 41507, 'Turin', null, '#FFFFFF', '#000000', 85),
    C('lazio', 'Lazio', 'LAZ', 'Stadio Olimpico', 70634, 'Rome', null, '#87D8F7', '#FFFFFF', 74),
    C('lecce', 'Lecce', 'LEC', 'Stadio Via del Mare', 31533, 'Lecce', null, '#FFED00', '#D71920', 54),
    C('milan', 'AC Milan', 'MIL', 'San Siro', 75817, 'Milan', null, '#FB090B', '#000000', 85),
    C('monza', 'Monza', 'MON', 'U-Power Stadium', 16917, 'Monza', null, '#E30613', '#FFFFFF', 54),
    C('napoli', 'Napoli', 'NAP', 'Stadio Diego Armando Maradona', 54726, 'Naples', null, '#12A0D7', '#FFFFFF', 85),
    C('parma', 'Parma', 'PAR', 'Stadio Ennio Tardini', 22352, 'Parma', null, '#FFDD00', '#1E3D7D', 58),
    C('roma', 'AS Roma', 'ROM', 'Stadio Olimpico', 70634, 'Rome', 'Gian Piero Gasperini', '#8E1F2F', '#F0BC42', 80),
    C('sassuolo', 'Sassuolo', 'SAS', 'Mapei Stadium', 21584, 'Reggio Emilia', null, '#00A752', '#000000', 58),
    C('torino', 'Torino', 'TOR', 'Stadio Olimpico Grande Torino', 27958, 'Turin', null, '#8A1E03', '#FFFFFF', 62),
    C('udinese', 'Udinese', 'UDI', 'Bluenergy Stadium', 25144, 'Udine', 'Kosta Runjaić', '#FFFFFF', '#000000', 60),
    C('venezia', 'Venezia', 'VEN', 'Stadio Pier Luigi Penzo', 11150, 'Venice', 'Giovanni Stroppa', '#F28C00', '#00563F', 54),
  ],
  ger1: [
    C('augsburg', 'FC Augsburg', 'FCA', 'WWK Arena', 30660, 'Augsburg', null, '#BA3733', '#46714D', 60),
    C('bayern', 'Bayern Munich', 'FCB', 'Allianz Arena', 75024, 'Munich', 'Vincent Kompany', '#DC052D', '#FFFFFF', 95),
    C('dortmund', 'Borussia Dortmund', 'BVB', 'Signal Iduna Park', 81365, 'Dortmund', 'Niko Kovač', '#FDE100', '#000000', 85),
    C('elversberg', 'SV Elversberg', 'SVE', 'Ursapharm-Arena an der Kaiserlinde', 10000, 'Spiesen-Elversberg', null, '#000000', '#FFFFFF', 50),
    C('frankfurt', 'Eintracht Frankfurt', 'SGE', 'Deutsche Bank Park', 58000, 'Frankfurt', null, '#E1000F', '#000000', 74),
    C('freiburg', 'SC Freiburg', 'SCF', 'Europa-Park Stadion', 34700, 'Freiburg', 'Julian Schuster', '#E2001A', '#000000', 68),
    C('gladbach', 'Borussia Mönchengladbach', 'BMG', 'Borussia-Park', 54042, 'Mönchengladbach', null, '#FFFFFF', '#000000', 64),
    C('hamburg', 'Hamburger SV', 'HSV', 'Volksparkstadion', 57000, 'Hamburg', 'Merlin Polzin', '#0A3F86', '#FFFFFF', 62),
    C('hoffenheim', 'TSG Hoffenheim', 'TSG', 'PreZero Arena', 30150, 'Sinsheim', 'Christian Ilzer', '#1961B5', '#FFFFFF', 64),
    C('koln', '1. FC Köln', 'KOE', 'RheinEnergieStadion', 50000, 'Cologne', 'Lukas Kwasniok', '#ED1C24', '#FFFFFF', 60),
    C('leipzig', 'RB Leipzig', 'RBL', 'Red Bull Arena', 47069, 'Leipzig', 'Ole Werner', '#DD0741', '#FFFFFF', 80),
    C('leverkusen', 'Bayer Leverkusen', 'B04', 'BayArena', 30210, 'Leverkusen', null, '#E32221', '#000000', 81),
    C('mainz', 'Mainz 05', 'M05', 'Mewa Arena', 33305, 'Mainz', 'Urs Fischer', '#C3141E', '#FFFFFF', 62),
    C('paderborn', 'SC Paderborn 07', 'SCP', 'Home Deluxe Arena', 15000, 'Paderborn', null, '#005CA9', '#000000', 50),
    C('schalke', 'Schalke 04', 'S04', 'Veltins-Arena', 62271, 'Gelsenkirchen', null, '#004D9D', '#FFFFFF', 64),
    C('stuttgart', 'VfB Stuttgart', 'VFB', 'MHPArena', 60449, 'Stuttgart', 'Sebastian Hoeneß', '#FFFFFF', '#E32219', 76),
    C('union-berlin', 'Union Berlin', 'FCU', 'Stadion An der Alten Försterei', 22012, 'Berlin', 'Steffen Baumgart', '#EB1923', '#FFFFFF', 60),
    C('werder', 'Werder Bremen', 'SVW', 'Weserstadion', 42100, 'Bremen', 'Horst Steffen', '#1D9053', '#FFFFFF', 62),
  ],
  fra1: [
    C('angers', 'Angers SCO', 'ANG', 'Stade Raymond Kopa', 19800, 'Angers', null, '#000000', '#FFFFFF', 52),
    C('auxerre', 'AJ Auxerre', 'AUX', "Stade de l'Abbé-Deschamps", 18541, 'Auxerre', null, '#FFFFFF', '#0057A5', 52),
    C('brest', 'Stade Brestois', 'BRE29', 'Stade Francis-Le Blé', 15220, 'Brest', null, '#E30613', '#FFFFFF', 60),
    C('le-havre', 'Le Havre AC', 'HAC', 'Stade Océane', 25178, 'Le Havre', null, '#7AB2E6', '#00264D', 52),
    C('le-mans', 'Le Mans FC', 'LMF', 'MMArena', 25064, 'Le Mans', null, '#E30613', '#FFD700', 48),
    C('lens', 'RC Lens', 'RCL', 'Stade Bollaert-Delelis', 38223, 'Lens', null, '#FFD700', '#E30613', 70),
    C('lille', 'LOSC Lille', 'LIL', 'Decathlon Arena Pierre-Mauroy', 50186, 'Lille', null, '#E01E13', '#20325F', 72),
    C('lorient', 'FC Lorient', 'LOR', 'Stade du Moustoir', 18110, 'Lorient', null, '#F58113', '#000000', 52),
    C('lyon', 'Olympique Lyonnais', 'OL', 'Groupama Stadium', 59186, 'Lyon', null, '#FFFFFF', '#DA0812', 74),
    C('marseille', 'Olympique de Marseille', 'OM', 'Orange Vélodrome', 67394, 'Marseille', null, '#2FAEE0', '#FFFFFF', 76),
    C('monaco', 'AS Monaco', 'ASM', 'Stade Louis II', 16360, 'Monaco', null, '#E51B22', '#FFFFFF', 74),
    C('nice', 'OGC Nice', 'NIC', 'Allianz Riviera', 36178, 'Nice', null, '#C8102E', '#000000', 64),
    C('paris-fc', 'Paris FC', 'PFC', 'Stade Jean-Bouin', 19904, 'Paris', null, '#1F2A44', '#FFFFFF', 56),
    C('psg', 'Paris Saint-Germain', 'PSG', 'Parc des Princes', 47929, 'Paris', 'Luis Enrique', '#004170', '#DA291C', 95),
    C('rennes', 'Stade Rennais', 'REN', 'Roazhon Park', 29778, 'Rennes', null, '#E13327', '#000000', 66),
    C('strasbourg', 'RC Strasbourg', 'RCS', 'Stade de la Meinau', 26109, 'Strasbourg', null, '#009FE3', '#FFFFFF', 64),
    C('toulouse', 'Toulouse FC', 'TFC', 'Stadium de Toulouse', 33150, 'Toulouse', null, '#5B2C83', '#FFFFFF', 58),
    C('troyes', 'ES Troyes AC', 'ETR', "Stade de l'Aube", 21684, 'Troyes', null, '#005DA4', '#FFFFFF', 48),
  ],
  svn1: [
    C('aluminij', 'NK Aluminij', 'ALU', 'Športni park Aluminij', 2000, 'Kidričevo', null, '#FFD700', '#000000', 34),
    C('bravo', 'NK Bravo', 'BRA', 'Stadion ŽŠD Ljubljana', 1700, 'Ljubljana', null, '#E30613', '#FFFFFF', 36),
    C('brinje', 'NK Brinje Grosuplje', 'BRI', 'Stadion Brinje', 1500, 'Grosuplje', null, '#00843D', '#FFFFFF', 30),
    C('celje', 'NK Celje', 'CEL', 'Stadion Z\'dežele', 13059, 'Celje', null, '#0055A4', '#FFD700', 44),
    C('koper', 'FC Koper', 'KOP', 'Stadion Bonifika', 4047, 'Koper', null, '#0057B8', '#FFD700', 40),
    C('maribor', 'NK Maribor', 'MAR', 'Ljudski vrt', 11709, 'Maribor', 'Darko Milanič', '#5B2C83', '#FFFFFF', 46),
    C('mura', 'NŠ Mura', 'MUR', 'Stadion Fazanerija', 4506, 'Murska Sobota', null, '#000000', '#FFFFFF', 36),
    C('nafta', 'NK Nafta 1903', 'NAF', 'Športni park Lendava', 2000, 'Lendava', null, '#000000', '#FFD700', 30),
    C('olimpija', 'NK Olimpija Ljubljana', 'OLI', 'Stadion Stožice', 16038, 'Ljubljana', null, '#00843D', '#FFFFFF', 46),
    C('radomlje', 'NK Kalcer Radomlje', 'RAD', 'Športni park Radomlje', 1500, 'Radomlje', null, '#FFD700', '#00843D', 32),
  ],
};

// Merge in the lower English divisions, Scotland, Wales, Northern Ireland, Ireland, USA and Canada.
for (const lg of BASE_LEAGUES) { lg.tier = 1; lg.cycle = 'eu'; }
const ORDER = ['eng1', 'eng2', 'eng3', 'eng4', 'eng5', 'eng6n', 'eng6s', 'sco1', 'sco2', 'sco3', 'sco4', 'wal1', 'nir1', 'irl1', 'irl2',
  'esp1', 'ita1', 'ger1', 'fra1', 'svn1', 'usa1e', 'usa1w', 'usa2e', 'usa2w', 'can1'];
const ALL = [...BASE_LEAGUES, ...EXTRA_LEAGUES.map((l) => ({ cycle: 'eu', ...l }))];
export const LEAGUES = ORDER.map((id) => ALL.find((l) => l.id === id));
export const CLUBS = { ...BASE_CLUBS, ...EXTRA_CLUBS };
export { PROMOTION_RULES };
BASE_LEAGUES.find((l) => l.id === 'eng1').cont = [4, 'Champions League'];
BASE_LEAGUES.find((l) => l.id === 'esp1').cont = [4, 'Champions League'];
BASE_LEAGUES.find((l) => l.id === 'ita1').cont = [4, 'Champions League'];
BASE_LEAGUES.find((l) => l.id === 'ger1').cont = [4, 'Champions League'];
BASE_LEAGUES.find((l) => l.id === 'fra1').cont = [3, 'Champions League'];
BASE_LEAGUES.find((l) => l.id === 'svn1').cont = [1, 'Champions League'];
export const COUNTRIES = [...new Set(LEAGUES.map((l) => l.country))];
export const leaguesOf = (country) => LEAGUES.filter((l) => l.country === country);

// Transfer windows (repeat every year).
export const TRANSFER_WINDOWS = [
  ['06-15', '09-01'],
  ['01-02', '02-02'],
];
export const inTransferWindow = (iso) => { const md = iso.slice(5); return TRANSFER_WINDOWS.some(([a, b]) => md >= a && md <= b); };

// Season helpers: 'eu' leagues run Aug–May (base 2026), 'cal' leagues run Feb–Nov (base 2027).
export const baseYear = (lg) => (lg.cycle === 'cal' ? 2027 : 2026);
export function seasonDef(lg, year) {
  const off = year - baseYear(lg);
  const sh = (iso) => (off ? `${Number(iso.slice(0, 4)) + off}${iso.slice(4)}` : iso);
  return { ...lg, start: sh(lg.start), end: sh(lg.end), breaks: lg.breaks.map(([a, b]) => [sh(a), sh(b)]) };
}
export const seasonLabel = (lg, year) => (lg.cycle === 'cal' ? String(year) : `${year}/${String((year + 1) % 100).padStart(2, '0')}`);

export const GAME_START_DATE = '2026-07-01';
export const CAL_START_DATE = '2027-01-04'; // careers in calendar-year leagues (Ireland, USL, CPL) start here
export const SEASON_LABEL = '2026/27';

export function allClubs() {
  const out = [];
  for (const lg of LEAGUES) for (const c of CLUBS[lg.id]) out.push({ ...c, league: lg.id });
  return out;
}
