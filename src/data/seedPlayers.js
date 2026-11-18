// Seeded key players (best-known squads as of mid-2026; summer 2026 moves may be missing).
// Anything not listed here is generated. Run `npm run hydrate` to pull live rosters.
// Row: [name, positions ('/'-separated codes), age, nationality, currentAbility(1-200), potentialAbility(1-200)]
// Position codes: GK DR DC DL DMC MR MC ML AMR AMC AML FC

export const SEED_PLAYERS = {
  arsenal: [
    ['David Raya', 'GK', 30, 'ESP', 160, 162], ['William Saliba', 'DC', 25, 'FRA', 172, 180], ['Gabriel Magalhães', 'DC', 28, 'BRA', 168, 170],
    ['Jurriën Timber', 'DR/DC', 25, 'NED', 160, 168], ['Riccardo Calafiori', 'DL/DC', 24, 'ITA', 155, 166], ['Ben White', 'DR', 28, 'ENG', 154, 155],
    ['Declan Rice', 'DMC/MC', 27, 'ENG', 173, 176], ['Martín Zubimendi', 'DMC', 27, 'ESP', 166, 168], ['Martin Ødegaard', 'AMC/MC', 27, 'NOR', 168, 170],
    ['Bukayo Saka', 'AMR/MR', 24, 'ENG', 175, 182], ['Eberechi Eze', 'AMC/AML', 28, 'ENG', 162, 163], ['Gabriel Martinelli', 'AML', 25, 'BRA', 158, 162],
    ['Noni Madueke', 'AMR', 24, 'ENG', 154, 162], ['Kai Havertz', 'FC/AMC', 27, 'GER', 160, 162], ['Viktor Gyökeres', 'FC', 28, 'SWE', 166, 167],
    ['Myles Lewis-Skelly', 'DL/MC', 19, 'ENG', 145, 176], ['Ethan Nwaneri', 'AMC/AMR', 19, 'ENG', 142, 180],
  ],
  liverpool: [
    ['Alisson', 'GK', 33, 'BRA', 162, 162], ['Giorgi Mamardashvili', 'GK', 25, 'GEO', 152, 165], ['Virgil van Dijk', 'DC', 35, 'NED', 160, 160],
    ['Jeremie Frimpong', 'DR/MR', 25, 'NED', 155, 160], ['Milos Kerkez', 'DL', 22, 'HUN', 152, 168], ['Ryan Gravenberch', 'DMC/MC', 24, 'NED', 162, 170],
    ['Alexis Mac Allister', 'MC', 27, 'ARG', 165, 166], ['Dominik Szoboszlai', 'MC/AMC', 25, 'HUN', 162, 166], ['Florian Wirtz', 'AMC', 23, 'GER', 170, 186],
    ['Mohamed Salah', 'AMR', 34, 'EGY', 165, 165], ['Cody Gakpo', 'AML', 27, 'NED', 160, 161], ['Alexander Isak', 'FC', 26, 'SWE', 168, 172],
    ['Hugo Ekitiké', 'FC', 24, 'FRA', 160, 170],
  ],
  'man-city': [
    ['Gianluigi Donnarumma', 'GK', 27, 'ITA', 166, 170], ['Rúben Dias', 'DC', 29, 'POR', 164, 164], ['Joško Gvardiol', 'DC/DL', 24, 'CRO', 164, 172],
    ['Abdukodir Khusanov', 'DC', 22, 'UZB', 148, 168], ['Nico O\'Reilly', 'DL/MC', 21, 'ENG', 145, 170], ['Matheus Nunes', 'DR/MC', 27, 'POR', 150, 152],
    ['Rodri', 'DMC', 30, 'ESP', 168, 168], ['Tijjani Reijnders', 'MC', 28, 'NED', 160, 161], ['Phil Foden', 'AMC/AMR', 26, 'ENG', 165, 168],
    ['Rayan Cherki', 'AMC', 22, 'FRA', 155, 180], ['Jérémy Doku', 'AML', 24, 'BEL', 156, 164], ['Omar Marmoush', 'FC/AML', 27, 'EGY', 158, 159],
    ['Erling Haaland', 'FC', 26, 'NOR', 182, 186],
  ],
  chelsea: [
    ['Robert Sánchez', 'GK', 28, 'ESP', 150, 152], ['Reece James', 'DR', 26, 'ENG', 158, 162], ['Levi Colwill', 'DC', 23, 'ENG', 155, 168],
    ['Wesley Fofana', 'DC', 25, 'FRA', 150, 158], ['Trevoh Chalobah', 'DC', 27, 'ENG', 150, 151], ['Marc Cucurella', 'DL', 27, 'ESP', 155, 156],
    ['Moisés Caicedo', 'DMC', 24, 'ECU', 166, 172], ['Enzo Fernández', 'MC', 25, 'ARG', 162, 166], ['Cole Palmer', 'AMC/AMR', 24, 'ENG', 170, 178],
    ['Pedro Neto', 'AMR/AML', 26, 'POR', 156, 158], ['Estêvão', 'AMR', 19, 'BRA', 150, 186], ['João Pedro', 'FC/AMC', 24, 'BRA', 158, 164],
    ['Liam Delap', 'FC', 23, 'ENG', 148, 162],
  ],
  'man-utd': [
    ['Senne Lammens', 'GK', 24, 'BEL', 145, 160], ['Diogo Dalot', 'DR/DL', 27, 'POR', 150, 151], ['Leny Yoro', 'DC', 20, 'FRA', 148, 178],
    ['Matthijs de Ligt', 'DC', 26, 'NED', 155, 158], ['Lisandro Martínez', 'DC/DL', 28, 'ARG', 155, 155], ['Patrick Dorgu', 'DL/ML', 21, 'DEN', 145, 165],
    ['Kobbie Mainoo', 'MC', 21, 'ENG', 148, 172], ['Bruno Fernandes', 'AMC/MC', 31, 'POR', 164, 164], ['Bryan Mbeumo', 'AMR', 26, 'CMR', 158, 160],
    ['Amad Diallo', 'AMR', 23, 'CIV', 152, 162], ['Matheus Cunha', 'AML/FC', 27, 'BRA', 158, 159], ['Benjamin Šeško', 'FC', 23, 'SVN', 155, 176],
  ],
  tottenham: [
    ['Guglielmo Vicario', 'GK', 29, 'ITA', 155, 156], ['Pedro Porro', 'DR', 26, 'ESP', 155, 158], ['Cristian Romero', 'DC', 28, 'ARG', 160, 160],
    ['Micky van de Ven', 'DC', 25, 'NED', 160, 165], ['Destiny Udogie', 'DL', 23, 'ITA', 150, 162], ['Rodrigo Bentancur', 'MC/DMC', 29, 'URU', 150, 150],
    ['Lucas Bergvall', 'MC', 20, 'SWE', 145, 175], ['Archie Gray', 'MC/DR', 20, 'ENG', 142, 172], ['James Maddison', 'AMC', 29, 'ENG', 154, 154],
    ['Xavi Simons', 'AMC/AML', 23, 'NED', 158, 172], ['Mohammed Kudus', 'AMR', 25, 'GHA', 158, 164], ['Dominic Solanke', 'FC', 28, 'ENG', 152, 152],
  ],
  newcastle: [
    ['Nick Pope', 'GK', 34, 'ENG', 150, 150], ['Tino Livramento', 'DR/DL', 23, 'ENG', 152, 166], ['Malick Thiaw', 'DC', 24, 'GER', 152, 162],
    ['Sven Botman', 'DC', 26, 'NED', 152, 158], ['Dan Burn', 'DC/DL', 34, 'ENG', 145, 145], ['Lewis Hall', 'DL', 21, 'ENG', 148, 168],
    ['Sandro Tonali', 'DMC/MC', 26, 'ITA', 162, 166], ['Bruno Guimarães', 'MC', 28, 'BRA', 164, 165], ['Joelinton', 'MC', 29, 'BRA', 150, 150],
    ['Anthony Gordon', 'AML', 25, 'ENG', 158, 162], ['Harvey Barnes', 'AML/AMR', 28, 'ENG', 148, 148], ['Nick Woltemade', 'FC/AMC', 24, 'GER', 155, 165],
    ['Yoane Wissa', 'FC', 29, 'COD', 152, 152],
  ],
  'aston-villa': [
    ['Emiliano Martínez', 'GK', 33, 'ARG', 158, 158], ['Matty Cash', 'DR', 28, 'POL', 148, 148], ['Ezri Konsa', 'DC', 28, 'ENG', 152, 152],
    ['Pau Torres', 'DC', 29, 'ESP', 152, 152], ['Lucas Digne', 'DL', 32, 'FRA', 145, 145], ['Boubacar Kamara', 'DMC', 26, 'FRA', 154, 158],
    ['Youri Tielemans', 'MC', 29, 'BEL', 154, 154], ['John McGinn', 'MC/AML', 31, 'SCO', 150, 150], ['Morgan Rogers', 'AMC/AML', 23, 'ENG', 158, 172],
    ['Ollie Watkins', 'FC', 30, 'ENG', 156, 156],
  ],
  'real-madrid': [
    ['Thibaut Courtois', 'GK', 34, 'BEL', 166, 166], ['Trent Alexander-Arnold', 'DR', 27, 'ENG', 160, 162], ['Éder Militão', 'DC', 28, 'BRA', 158, 158],
    ['Dean Huijsen', 'DC', 21, 'ESP', 155, 180], ['Álvaro Carreras', 'DL', 23, 'ESP', 152, 166], ['Aurélien Tchouaméni', 'DMC', 26, 'FRA', 162, 166],
    ['Federico Valverde', 'MC/DR', 27, 'URU', 168, 170], ['Eduardo Camavinga', 'MC/DL', 23, 'FRA', 158, 170], ['Jude Bellingham', 'AMC/MC', 23, 'ENG', 175, 186],
    ['Arda Güler', 'AMC/AMR', 21, 'TUR', 155, 182], ['Rodrygo', 'AMR/AML', 25, 'BRA', 160, 164], ['Franco Mastantuono', 'AMR', 18, 'ARG', 140, 184],
    ['Vinícius Júnior', 'AML', 25, 'BRA', 176, 180], ['Kylian Mbappé', 'FC/AML', 27, 'FRA', 184, 188],
  ],
  barcelona: [
    ['Joan García', 'GK', 25, 'ESP', 158, 168], ['Jules Koundé', 'DR/DC', 27, 'FRA', 162, 163], ['Pau Cubarsí', 'DC', 19, 'ESP', 158, 186],
    ['Ronald Araújo', 'DC', 27, 'URU', 155, 156], ['Eric García', 'DC/DMC', 25, 'ESP', 150, 152], ['Alejandro Balde', 'DL', 22, 'ESP', 155, 168],
    ['Frenkie de Jong', 'MC/DMC', 29, 'NED', 162, 162], ['Pedri', 'MC', 23, 'ESP', 172, 182], ['Gavi', 'MC', 21, 'ESP', 155, 178],
    ['Fermín López', 'AMC/MC', 23, 'ESP', 152, 164], ['Dani Olmo', 'AMC', 28, 'ESP', 158, 158], ['Lamine Yamal', 'AMR', 18, 'ESP', 178, 198],
    ['Raphinha', 'AML/AMR', 29, 'BRA', 168, 168], ['Ferran Torres', 'FC/AML', 26, 'ESP', 152, 154],
  ],
  atletico: [
    ['Jan Oblak', 'GK', 33, 'SVN', 160, 160], ['Marcos Llorente', 'DR/MC', 31, 'ESP', 152, 152], ['José María Giménez', 'DC', 31, 'URU', 150, 150],
    ['Robin Le Normand', 'DC', 29, 'ESP', 152, 152], ['David Hancko', 'DL/DC', 28, 'SVK', 152, 153], ['Johnny Cardoso', 'DMC', 24, 'USA', 148, 160],
    ['Koke', 'MC', 34, 'ESP', 145, 145], ['Pablo Barrios', 'MC', 23, 'ESP', 152, 168], ['Thiago Almada', 'AMC', 25, 'ARG', 150, 156],
    ['Álex Baena', 'AML/AMC', 25, 'ESP', 155, 160], ['Giuliano Simeone', 'AMR', 23, 'ARG', 148, 160], ['Julián Álvarez', 'FC', 26, 'ARG', 168, 172],
    ['Alexander Sørloth', 'FC', 30, 'NOR', 150, 150],
  ],
  inter: [
    ['Josep Martínez', 'GK', 28, 'ESP', 148, 152], ['Denzel Dumfries', 'DR/MR', 30, 'NED', 152, 152], ['Yann Bisseck', 'DC', 25, 'GER', 150, 158],
    ['Alessandro Bastoni', 'DC/DL', 27, 'ITA', 165, 166], ['Federico Dimarco', 'DL/ML', 28, 'ITA', 158, 158], ['Hakan Çalhanoğlu', 'DMC', 32, 'TUR', 156, 156],
    ['Nicolò Barella', 'MC', 29, 'ITA', 163, 163], ['Davide Frattesi', 'MC', 26, 'ITA', 150, 152], ['Lautaro Martínez', 'FC', 28, 'ARG', 168, 168],
    ['Marcus Thuram', 'FC', 29, 'FRA', 160, 160], ['Francesco Pio Esposito', 'FC', 21, 'ITA', 140, 172],
  ],
  milan: [
    ['Mike Maignan', 'GK', 31, 'FRA', 162, 162], ['Alexis Saelemaekers', 'DR/AMR', 27, 'BEL', 148, 150], ['Fikayo Tomori', 'DC', 28, 'ENG', 150, 150],
    ['Strahinja Pavlović', 'DC', 25, 'SRB', 150, 156], ['Youssouf Fofana', 'MC/DMC', 27, 'FRA', 152, 153], ['Adrien Rabiot', 'MC', 31, 'FRA', 155, 155],
    ['Ardon Jashari', 'MC/DMC', 23, 'SUI', 148, 162], ['Christian Pulisic', 'AMR/AML', 27, 'USA', 158, 158], ['Rafael Leão', 'AML', 27, 'POR', 162, 164],
    ['Christopher Nkunku', 'FC/AMC', 28, 'FRA', 152, 152], ['Santiago Giménez', 'FC', 25, 'MEX', 150, 156],
  ],
  juventus: [
    ['Michele Di Gregorio', 'GK', 29, 'ITA', 150, 152], ['Pierre Kalulu', 'DC/DR', 26, 'FRA', 150, 154], ['Gleison Bremer', 'DC', 29, 'BRA', 158, 158],
    ['Andrea Cambiaso', 'DL/DR', 26, 'ITA', 155, 158], ['Manuel Locatelli', 'DMC', 28, 'ITA', 152, 152], ['Khéphren Thuram', 'MC', 25, 'FRA', 152, 160],
    ['Teun Koopmeiners', 'MC/AMC', 28, 'NED', 150, 150], ['Francisco Conceição', 'AMR', 23, 'POR', 152, 164], ['Kenan Yıldız', 'AML/AMC', 21, 'TUR', 160, 184],
    ['Jonathan David', 'FC', 26, 'CAN', 155, 158], ['Loïs Openda', 'FC', 26, 'BEL', 150, 154],
  ],
  napoli: [
    ['Alex Meret', 'GK', 29, 'ITA', 150, 150], ['Giovanni Di Lorenzo', 'DR', 32, 'ITA', 150, 150], ['Amir Rrahmani', 'DC', 32, 'KVX', 150, 150],
    ['Alessandro Buongiorno', 'DC', 27, 'ITA', 155, 158], ['Stanislav Lobotka', 'DMC', 31, 'SVK', 155, 155], ['Frank Anguissa', 'MC', 30, 'CMR', 152, 152],
    ['Scott McTominay', 'MC/AMC', 29, 'SCO', 162, 162], ['Kevin De Bruyne', 'AMC', 35, 'BEL', 156, 156], ['David Neres', 'AMR', 29, 'BRA', 150, 150],
    ['Matteo Politano', 'AMR', 32, 'ITA', 146, 146], ['Rasmus Højlund', 'FC', 23, 'DEN', 152, 166], ['Romelu Lukaku', 'FC', 33, 'BEL', 148, 148],
  ],
  bayern: [
    ['Jonas Urbig', 'GK', 22, 'GER', 145, 170], ['Konrad Laimer', 'DR/MC', 29, 'AUT', 152, 152], ['Dayot Upamecano', 'DC', 27, 'FRA', 160, 162],
    ['Jonathan Tah', 'DC', 30, 'GER', 158, 158], ['Alphonso Davies', 'DL', 25, 'CAN', 156, 160], ['Joshua Kimmich', 'DMC/DR', 31, 'GER', 166, 166],
    ['Aleksandar Pavlović', 'DMC/MC', 22, 'GER', 152, 176], ['Jamal Musiala', 'AMC', 23, 'GER', 175, 188], ['Michael Olise', 'AMR', 24, 'FRA', 170, 178],
    ['Luis Díaz', 'AML', 29, 'COL', 162, 162], ['Serge Gnabry', 'AML/AMR', 30, 'GER', 150, 150], ['Lennart Karl', 'AMR/AMC', 18, 'GER', 138, 180],
    ['Harry Kane', 'FC', 32, 'ENG', 174, 174],
  ],
  dortmund: [
    ['Gregor Kobel', 'GK', 28, 'SUI', 158, 160], ['Julian Ryerson', 'DR/DL', 28, 'NOR', 148, 148], ['Nico Schlotterbeck', 'DC', 26, 'GER', 158, 162],
    ['Waldemar Anton', 'DC', 29, 'GER', 150, 150], ['Ramy Bensebaini', 'DL', 31, 'ALG', 145, 145], ['Felix Nmecha', 'MC', 25, 'GER', 152, 160],
    ['Marcel Sabitzer', 'MC', 32, 'AUT', 148, 148], ['Jobe Bellingham', 'MC/AMC', 20, 'ENG', 145, 175], ['Karim Adeyemi', 'AML/AMR', 24, 'GER', 152, 160],
    ['Maximilian Beier', 'FC', 23, 'GER', 148, 160], ['Serhou Guirassy', 'FC', 30, 'GUI', 160, 160],
  ],
  leverkusen: [
    ['Mark Flekken', 'GK', 32, 'NED', 148, 148], ['Edmond Tapsoba', 'DC', 27, 'BFA', 152, 155], ['Alejandro Grimaldo', 'DL/ML', 30, 'ESP', 156, 156],
    ['Robert Andrich', 'DMC', 31, 'GER', 148, 148], ['Exequiel Palacios', 'MC', 27, 'ARG', 152, 154], ['Malik Tillman', 'AMC', 24, 'USA', 150, 160],
    ['Ibrahim Maza', 'AMC', 20, 'ALG', 140, 172], ['Patrik Schick', 'FC', 30, 'CZE', 152, 152],
  ],
  psg: [
    ['Lucas Chevalier', 'GK', 24, 'FRA', 155, 170], ['Achraf Hakimi', 'DR', 27, 'MAR', 166, 166], ['Marquinhos', 'DC', 32, 'BRA', 156, 156],
    ['Willian Pacho', 'DC', 24, 'ECU', 158, 166], ['Lucas Beraldo', 'DC/DL', 22, 'BRA', 145, 165], ['Nuno Mendes', 'DL', 24, 'POR', 165, 172],
    ['Vitinha', 'MC/DMC', 26, 'POR', 170, 172], ['João Neves', 'MC', 21, 'POR', 165, 186], ['Fabián Ruiz', 'MC', 30, 'ESP', 155, 155],
    ['Warren Zaïre-Emery', 'MC/DR', 20, 'FRA', 152, 176], ['Désiré Doué', 'AMR/AML', 21, 'FRA', 162, 186], ['Khvicha Kvaratskhelia', 'AML', 25, 'GEO', 170, 174],
    ['Bradley Barcola', 'AML', 23, 'FRA', 158, 168], ['Ousmane Dembélé', 'FC/AMR', 29, 'FRA', 172, 172], ['Gonçalo Ramos', 'FC', 25, 'POR', 150, 156],
  ],
  marseille: [
    ['Gerónimo Rulli', 'GK', 34, 'ARG', 148, 148], ['Leonardo Balerdi', 'DC', 27, 'ARG', 150, 152], ['Pierre-Emile Højbjerg', 'DMC', 30, 'DEN', 152, 152],
    ['Mason Greenwood', 'AMR/FC', 24, 'ENG', 160, 166], ['Igor Paixão', 'AML', 26, 'BRA', 150, 154], ['Amine Gouiri', 'FC', 26, 'ALG', 150, 154],
  ],
  deportivo: [
    ['Leo Román', 'GK', 25, 'ESP', 125, 140], ['Angeliño', 'DL', 29, 'ESP', 135, 135], ['Pierre-Emerick Aubameyang', 'FC', 37, 'GAB', 135, 135],
  ],
};
