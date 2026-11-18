// Name pools used to generate fictional squad fillers per nationality.
export const NAME_POOLS = {
  ENG: {
    first: ['Jack', 'Harry', 'Oliver', 'George', 'Charlie', 'Alfie', 'Tom', 'Sam', 'Joe', 'Callum', 'Lewis', 'Ryan', 'Jordan', 'Kieran', 'Connor', 'Ben', 'Max', 'Reece', 'Jamie', 'Luke', 'Dan', 'Josh', 'Owen', 'Tyler', 'Mason', 'Kai', 'Rhys', 'Ethan'],
    last: ['Smith', 'Walker', 'Taylor', 'Brown', 'Wright', 'Hughes', 'Clarke', 'Palmer', 'Turner', 'Hill', 'Cooper', 'Ward', 'Morris', 'Bennett', 'Price', 'Barker', 'Harrison', 'Fletcher', 'Marsh', 'Doyle', 'Holloway', 'Shaw', 'Ellis', 'Grant', 'Pearce', 'Lowe', 'Carver', 'Hutchinson', 'Mills', 'Booth'],
  },
  ESP: {
    first: ['Pablo', 'Javier', 'Sergio', 'Álvaro', 'Iker', 'Diego', 'Raúl', 'Marcos', 'Hugo', 'Adrián', 'Carlos', 'Dani', 'Rubén', 'Óscar', 'Unai', 'Mikel', 'Jon', 'Aitor', 'Íñigo', 'Nico', 'Rodrigo', 'Mario'],
    last: ['García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández', 'Ruiz', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Gil', 'Vázquez', 'Serrano', 'Ramos', 'Blanco', 'Molina', 'Ortega', 'Iglesias', 'Arrieta', 'Zubeldia', 'Etxeberria'],
  },
  ITA: {
    first: ['Lorenzo', 'Matteo', 'Andrea', 'Alessandro', 'Federico', 'Davide', 'Simone', 'Riccardo', 'Gianluca', 'Marco', 'Nicolò', 'Tommaso', 'Giacomo', 'Stefano', 'Luca', 'Francesco', 'Daniele', 'Mattia'],
    last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Caruso', 'Santoro', 'Ferri'],
  },
  GER: {
    first: ['Lukas', 'Jonas', 'Leon', 'Finn', 'Niklas', 'Tim', 'Felix', 'Paul', 'Jan', 'Moritz', 'Florian', 'Maximilian', 'Kevin', 'Julian', 'Tobias', 'Marvin', 'Nico', 'Dennis', 'Yannick', 'Robin'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Zimmermann', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Vogt'],
  },
  FRA: {
    first: ['Lucas', 'Hugo', 'Théo', 'Louis', 'Nathan', 'Enzo', 'Mathis', 'Clément', 'Maxime', 'Antoine', 'Kylian', 'Yanis', 'Rayan', 'Quentin', 'Alexis', 'Florian', 'Romain', 'Bastien', 'Moussa', 'Ibrahim', 'Amine', 'Wesley'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'Diallo', 'Traoré', 'Koné', 'Camara', 'Sissoko', 'Mendy'],
  },
  SVN: {
    first: ['Luka', 'Žan', 'Nejc', 'Jan', 'Matic', 'Rok', 'Tilen', 'Jaka', 'Nik', 'Gašper', 'Miha', 'Tim', 'Aljaž', 'Domen', 'Blaž', 'Žiga', 'Lovro', 'Anže', 'Urban', 'Jure', 'Mark', 'Vid', 'Tadej', 'Timotej'],
    last: ['Novak', 'Horvat', 'Kovačič', 'Krajnc', 'Zupančič', 'Potočnik', 'Kovač', 'Mlakar', 'Kos', 'Vidmar', 'Golob', 'Turk', 'Božič', 'Kralj', 'Korošec', 'Zupan', 'Bizjak', 'Hribar', 'Kotnik', 'Rozman', 'Petek', 'Kastelic', 'Kolar', 'Žagar', 'Koščak', 'Pavlin', 'Štrukelj', 'Majcen', 'Jerman', 'Dolenc', 'Vovk', 'Ferk', 'Lesjak', 'Medved', 'Zorko', 'Rupnik', 'Pečnik', 'Gregorič', 'Hrovat', 'Kokalj', 'Leban', 'Logar', 'Oblak', 'Ramšak', 'Sever', 'Šuštar', 'Tomažič', 'Verbič', 'Zajc', 'Žnidaršič', 'Bergant', 'Cimerman', 'Erjavec', 'Furlan', 'Gorenc', 'Jamnik', 'Klemenčič', 'Lipovšek', 'Mavrič', 'Omerzu'],
  },
  BRA: {
    first: ['Gabriel', 'Lucas', 'Matheus', 'Vitor', 'Rafael', 'João', 'Pedro', 'Thiago', 'Bruno', 'Igor', 'Caio', 'Wesley', 'Douglas', 'Felipe'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ribeiro', 'Almeida', 'Carvalho', 'Gomes', 'Rocha', 'Martins', 'Araújo'],
  },
  POR: {
    first: ['Tiago', 'Rúben', 'Diogo', 'Gonçalo', 'André', 'Rafael', 'Nuno', 'Rui', 'Francisco', 'Miguel', 'Hugo'],
    last: ['Pereira', 'Ferreira', 'Rodrigues', 'Costa', 'Gonçalves', 'Mendes', 'Carvalho', 'Pinto', 'Moreira', 'Teixeira'],
  },
  NED: {
    first: ['Daan', 'Sem', 'Bram', 'Thijs', 'Jesse', 'Ruben', 'Stijn', 'Kevin', 'Joey', 'Mats', 'Lars'],
    last: ['de Jong', 'Jansen', 'de Vries', 'van Dijk', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos', 'Vos', 'Peters'],
  },
  CRO: {
    first: ['Ivan', 'Marko', 'Luka', 'Josip', 'Ante', 'Mario', 'Filip', 'Domagoj', 'Nikola'],
    last: ['Horvat', 'Kovačević', 'Babić', 'Marić', 'Jurić', 'Novak', 'Knežević', 'Vuković', 'Perić', 'Pavić', 'Blažević', 'Božić', 'Grgić', 'Lovrić', 'Matić', 'Petrović', 'Šimić', 'Tomić', 'Vidović', 'Zebec'],
  },
  SRB: {
    first: ['Nemanja', 'Stefan', 'Aleksandar', 'Miloš', 'Dušan', 'Lazar', 'Vladimir', 'Uroš'],
    last: ['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević', 'Stojanović', 'Ilić', 'Pavlović', 'Milošević', 'Lazić', 'Savić', 'Ristić', 'Kostić', 'Živković', 'Mitrović', 'Popović'],
  },
  AFR: {
    first: ['Moussa', 'Ibrahima', 'Cheikh', 'Kofi', 'Yaw', 'Samuel', 'Victor', 'Emmanuel', 'Youssef', 'Achraf', 'Sadio', 'Ismaïla'],
    last: ['Diop', 'Ndiaye', 'Mensah', 'Boateng', 'Osei', 'Okafor', 'Eze', 'Bamba', 'Touré', 'Sow', 'Fofana', 'Kamara', 'Aidoo'],
  },
  ARG: {
    first: ['Facundo', 'Matías', 'Nicolás', 'Lautaro', 'Gonzalo', 'Franco', 'Valentín', 'Tomás', 'Joaquín'],
    last: ['González', 'Rodríguez', 'Fernández', 'López', 'Gómez', 'Acosta', 'Medina', 'Herrera', 'Sosa', 'Benítez'],
  },
  SCO: {
    first: ['Callum', 'Lewis', 'Ross', 'Scott', 'Craig', 'Euan', 'Kyle', 'Fraser', 'Jamie', 'Ryan', 'Liam', 'Calum', 'Grant', 'Stuart', 'Blair', 'Lyall', 'Kieran', 'Aidan', 'Murray', 'Finlay'],
    last: ['MacDonald', 'McLean', 'Campbell', 'Stewart', 'Robertson', 'Paterson', 'Fraser', 'McKenzie', 'Murray', 'Henderson', 'McGregor', 'Ferguson', 'Sinclair', 'Kerr', 'Gallagher', 'McLaughlin', 'Hamilton', 'Docherty', 'Boyle', 'Cameron', 'Watt', 'Reid', 'Shankland', 'Craig', 'McInnes'],
  },
  WAL: {
    first: ['Rhys', 'Dylan', 'Gethin', 'Owain', 'Iwan', 'Ieuan', 'Cai', 'Osian', 'Gareth', 'Aaron', 'Tom', 'Joel', 'Ellis', 'Morgan', 'Lloyd', 'Jac'],
    last: ['Jones', 'Davies', 'Williams', 'Evans', 'Thomas', 'Roberts', 'Hughes', 'Lewis', 'Morgan', 'Griffiths', 'Price', 'Pritchard', 'Rees', 'Owen', 'Jenkins', 'Powell', 'Vaughan', 'Llewellyn', 'Parry', 'Bowen'],
  },
  IRL: {
    first: ['Conor', 'Sean', 'Darragh', 'Cian', 'Eoin', 'Ciarán', 'Oisín', 'Aaron', 'Jack', 'Dylan', 'Killian', 'Niall', 'Ronan', 'Fionn', 'Shane', 'Padraig', 'Mark', 'Adam'],
    last: ["O'Brien", 'Murphy', 'Kelly', "O'Sullivan", 'Walsh', 'Byrne', 'Ryan', "O'Connor", 'Doyle', 'McCarthy', 'Gallagher', 'Doherty', 'Kennedy', 'Lynch', 'Quinn', 'Brennan', 'Keane', 'Farrell', 'Dunne', 'Nolan', 'Kavanagh', 'Duffy'],
  },
  NIR: {
    first: ['Conor', 'Jamie', 'Ryan', 'Shea', 'Jordan', 'Matthew', 'Ben', 'Callum', 'Ross', 'Daniel', 'Paddy', 'Josh', 'Chris', 'Kirk'],
    last: ['McAllister', 'Smyth', 'Millar', 'Campbell', 'McCann', 'Graham', 'Boyd', 'McKeown', 'Kane', 'Donnelly', 'Stewart', 'Wilson', 'Thompson', 'Hughes', 'McGinn', 'Devlin', 'Ferris', 'Larmour'],
  },
  USA: {
    first: ['Tyler', 'Brandon', 'Jordan', 'Austin', 'Cole', 'Ethan', 'Hunter', 'Logan', 'Chris', 'Mason', 'Caden', 'Diego', 'Luis', 'Carlos', 'Gianluca', 'Brenden', 'DeAndre', 'Malik', 'Jesus', 'Bryce'],
    last: ['Johnson', 'Miller', 'Davis', 'Anderson', 'Jackson', 'Martinez', 'Rodriguez', 'Hernandez', 'Moore', 'Clark', 'Lewis', 'Robinson', 'Reyna', 'Adams', 'Morris', 'Turner', 'Parker', 'Collins', 'Ramirez', 'Flores', 'Harris', 'Bennett'],
  },
  CAN: {
    first: ['Liam', 'Noah', 'Ethan', 'Owen', 'Jacob', 'Alexandre', 'Mathieu', 'Kwasi', 'Tajon', 'Ali', 'Kyle', 'Marco', 'Jayden', 'Samuel', 'Olivier'],
    last: ['Tremblay', 'Gagnon', 'Roy', 'Côté', 'Bouchard', 'Smith', 'Brown', 'Wilson', 'MacDonald', 'Campbell', 'Davies', 'Larin', 'Osorio', 'Fraser', 'Bergeron', 'Morin', 'Lavoie', 'Singh'],
  },
  MEX: {
    first: ['José', 'Luis', 'Carlos', 'Diego', 'Alejandro', 'Jesús', 'Miguel', 'Eduardo', 'Rodrigo', 'Andrés', 'Santiago', 'Héctor', 'Ángel', 'Javier'],
    last: ['Hernández', 'García', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Vargas', 'Castillo', 'Ortiz', 'Morales'],
  },
  SCA: {
    first: ['Erik', 'Magnus', 'Oscar', 'Emil', 'Viktor', 'Anders', 'Jonas', 'Mikkel', 'Sander'],
    last: ['Hansen', 'Johansson', 'Nielsen', 'Larsen', 'Andersen', 'Berg', 'Lindqvist', 'Eriksen', 'Holm'],
  },
};

// Nationality mix per league (weights) for generated players.
export const LEAGUE_NAT_MIX = {
  eng1: [['ENG', 50], ['FRA', 6], ['ESP', 5], ['BRA', 6], ['NED', 5], ['POR', 5], ['AFR', 9], ['SCA', 6], ['ARG', 4], ['GER', 4]],
  esp1: [['ESP', 70], ['ARG', 6], ['BRA', 6], ['FRA', 5], ['POR', 4], ['AFR', 5], ['NED', 2], ['CRO', 2]],
  ita1: [['ITA', 55], ['ARG', 6], ['BRA', 6], ['FRA', 5], ['SRB', 5], ['CRO', 5], ['AFR', 8], ['SCA', 5], ['NED', 5]],
  ger1: [['GER', 58], ['NED', 6], ['FRA', 7], ['SCA', 7], ['AFR', 8], ['CRO', 5], ['SRB', 4], ['BRA', 5]],
  fra1: [['FRA', 62], ['AFR', 20], ['BRA', 5], ['POR', 5], ['ESP', 3], ['NED', 2], ['ARG', 3]],
  svn1: [['SVN', 72], ['CRO', 10], ['SRB', 7], ['BRA', 4], ['AFR', 5], ['ITA', 2]],
  eng2: [['ENG', 62], ['SCO', 5], ['WAL', 5], ['IRL', 6], ['AFR', 7], ['NED', 3], ['SCA', 3], ['FRA', 3], ['POR', 2], ['ESP', 2], ['USA', 2]],
  eng3: [['ENG', 72], ['SCO', 4], ['WAL', 5], ['IRL', 6], ['NIR', 2], ['AFR', 7], ['SCA', 2], ['NED', 2]],
  eng4: [['ENG', 76], ['SCO', 4], ['WAL', 5], ['IRL', 6], ['NIR', 2], ['AFR', 7]],
  eng5: [['ENG', 82], ['IRL', 5], ['WAL', 4], ['SCO', 3], ['AFR', 6]],
  eng6n: [['ENG', 84], ['IRL', 4], ['WAL', 5], ['SCO', 3], ['AFR', 4]],
  eng6s: [['ENG', 86], ['IRL', 4], ['WAL', 3], ['AFR', 7]],
  sco1: [['SCO', 52], ['ENG', 14], ['IRL', 6], ['NIR', 4], ['AFR', 6], ['SCA', 6], ['NED', 4], ['USA', 3], ['AUS', 0], ['POR', 2], ['FRA', 3]],
  sco2: [['SCO', 74], ['ENG', 12], ['IRL', 5], ['NIR', 4], ['AFR', 5]],
  sco3: [['SCO', 84], ['ENG', 8], ['IRL', 4], ['NIR', 4]],
  sco4: [['SCO', 88], ['ENG', 6], ['IRL', 3], ['NIR', 3]],
  wal1: [['WAL', 78], ['ENG', 18], ['IRL', 2], ['SCO', 2]],
  nir1: [['NIR', 76], ['IRL', 8], ['SCO', 8], ['ENG', 8]],
  irl1: [['IRL', 72], ['NIR', 6], ['ENG', 8], ['SCO', 4], ['AFR', 5], ['USA', 3], ['FRA', 2]],
  irl2: [['IRL', 84], ['NIR', 5], ['ENG', 6], ['AFR', 5]],
  usa1e: [['USA', 40], ['ARG', 9], ['BRA', 7], ['MEX', 7], ['CAN', 7], ['ENG', 4], ['AFR', 7], ['ESP', 4], ['FRA', 3], ['GER', 3], ['SCA', 3], ['POR', 3], ['NED', 3]],
  usa1w: [['USA', 40], ['ARG', 9], ['BRA', 7], ['MEX', 9], ['CAN', 6], ['ENG', 4], ['AFR', 7], ['ESP', 4], ['FRA', 3], ['GER', 3], ['SCA', 3], ['POR', 3]],
  usa2e: [['USA', 58], ['ENG', 8], ['AFR', 9], ['MEX', 8], ['BRA', 4], ['CAN', 4], ['IRL', 3], ['SCA', 2], ['ESP', 2], ['ARG', 2]],
  usa2w: [['USA', 56], ['ENG', 7], ['AFR', 8], ['MEX', 12], ['BRA', 4], ['CAN', 4], ['IRL', 3], ['ESP', 3], ['ARG', 3]],
  can1: [['CAN', 70], ['ENG', 5], ['FRA', 5], ['AFR', 8], ['MEX', 4], ['USA', 4], ['BRA', 4]],
};

export const NAT_LABEL = {
  ENG: 'England', ESP: 'Spain', ITA: 'Italy', GER: 'Germany', FRA: 'France', SVN: 'Slovenia', BRA: 'Brazil', POR: 'Portugal',
  NED: 'Netherlands', CRO: 'Croatia', SRB: 'Serbia', AFR: 'Africa', ARG: 'Argentina', SCA: 'Scandinavia', NOR: 'Norway',
  SWE: 'Sweden', DEN: 'Denmark', BEL: 'Belgium', SUI: 'Switzerland', AUT: 'Austria', USA: 'USA', CAN: 'Canada', MEX: 'Mexico',
  URU: 'Uruguay', ECU: 'Ecuador', COL: 'Colombia', EGY: 'Egypt', MAR: 'Morocco', ALG: 'Algeria', CMR: 'Cameroon', CIV: "Côte d'Ivoire",
  GHA: 'Ghana', GUI: 'Guinea', COD: 'DR Congo', BFA: 'Burkina Faso', GAB: 'Gabon', TUR: 'Turkey', GEO: 'Georgia', HUN: 'Hungary',
  POL: 'Poland', NIR: 'Northern Ireland', JPN: 'Japan', KOR: 'South Korea', AUS: 'Australia', UKR: 'Ukraine', GRE: 'Greece', ROU: 'Romania', SVK: 'Slovakia', CZE: 'Czechia', UZB: 'Uzbekistan', SCO: 'Scotland', KVX: 'Kosovo', WAL: 'Wales', IRL: 'Ireland',
};
