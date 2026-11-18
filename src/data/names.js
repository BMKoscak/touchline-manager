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
};

export const NAT_LABEL = {
  ENG: 'England', ESP: 'Spain', ITA: 'Italy', GER: 'Germany', FRA: 'France', SVN: 'Slovenia', BRA: 'Brazil', POR: 'Portugal',
  NED: 'Netherlands', CRO: 'Croatia', SRB: 'Serbia', AFR: 'Africa', ARG: 'Argentina', SCA: 'Scandinavia', NOR: 'Norway',
  SWE: 'Sweden', DEN: 'Denmark', BEL: 'Belgium', SUI: 'Switzerland', AUT: 'Austria', USA: 'USA', CAN: 'Canada', MEX: 'Mexico',
  URU: 'Uruguay', ECU: 'Ecuador', COL: 'Colombia', EGY: 'Egypt', MAR: 'Morocco', ALG: 'Algeria', CMR: 'Cameroon', CIV: "Côte d'Ivoire",
  GHA: 'Ghana', GUI: 'Guinea', COD: 'DR Congo', BFA: 'Burkina Faso', GAB: 'Gabon', TUR: 'Turkey', GEO: 'Georgia', HUN: 'Hungary',
  POL: 'Poland', SVK: 'Slovakia', CZE: 'Czechia', UZB: 'Uzbekistan', SCO: 'Scotland', KVX: 'Kosovo', WAL: 'Wales', IRL: 'Ireland',
};
