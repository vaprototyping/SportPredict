import { TeamMapping } from '../types';

export const STATIC_TEAM_LISTS: Record<string, Record<string, string[]>> = {
  'Premier League England': {
    'Arsenal': ['Arsenal FC', 'Arsenal London', 'AFC Arsenal'],
    'Aston Villa': ['Aston Villa FC', 'Villa', 'AVFC'],
    'Bournemouth': ['AFC Bournemouth', 'Bournemouth AFC', 'The Cherries'],
    'Brentford': ['Brentford FC', 'Brentford Town'],
    'Brighton': ['Brighton & Hove Albion', 'Brighton Hove', 'Brighton HA', 'BHA'],
    'Burnley': ['Burnley FC'],
    'Cardiff': ['Cardiff City', 'Cardiff City FC'],
    'Chelsea': ['Chelsea FC', 'Chelsea London'],
    'Crystal Palace': ['Crystal Palace FC', 'Palace'],
    'Everton': ['Everton FC'],
    'Fulham': ['Fulham FC'],
    'Huddersfield': ['Huddersfield Town', 'Huddersfield Town FC'],
    'Hull': ['Hull City', 'Hull City FC'],
    'Ipswich': ['Ipswich Town', 'Ipswich Town FC'],
    'Leeds': ['Leeds United', 'Leeds Utd'],
    'Leicester': ['Leicester City', 'Leicester City FC'],
    'Liverpool': ['Liverpool FC', 'LFC'],
    'Luton': ['Luton Town', 'Luton Town FC'],
    'Man City': ['Manchester City', 'Man City FC', 'Manchester City FC'],
    'Man United': ['Manchester United', 'Man Utd', 'Manchester Utd', 'MUFC'],
    'Middlesbrough': ['Middlesbrough FC', 'Boro'],
    'Newcastle': ['Newcastle United', 'Newcastle Utd'],
    'Norwich': ['Norwich City', 'Norwich City FC'],
    "Nott'm Forest": ['Nottingham Forest', 'Nott Forest', 'Nottingham Forest FC'],
    'Sheffield United': ['Sheff Utd', 'Sheffield Utd', 'Sheffield United FC'],
    'Southampton': ['Southampton FC', 'Saints'],
    'Stoke': ['Stoke City', 'Stoke City FC'],
    'Sunderland': ['Sunderland AFC'],
    'Swansea': ['Swansea City', 'Swansea City FC'],
    'Tottenham': ['Tottenham Hotspur', 'Spurs', 'Tottenham Hotspur FC'],
    'Watford': ['Watford FC'],
    'West Brom': ['West Bromwich Albion', 'West Bromwich', 'WBA'],
    'West Ham': ['West Ham United', 'West Ham Utd'],
    'Wolves': ['Wolverhampton Wanderers', 'Wolves FC', 'Wolverhampton']
  },
  'Bundesliga': {
    'Bayern Munich': ['FC Bayern Munich', 'FC Bayern München', 'Bayern München', 'Bayern'],
    'Augsburg': ['FC Augsburg', 'Augsburg FC'],
    'Darmstadt': ['SV Darmstadt 98', 'Darmstadt 98'],
    'Dortmund': ['Borussia Dortmund', 'BVB', 'BVB Dortmund'],
    'Leverkusen': ['Bayer Leverkusen', 'Bayer 04 Leverkusen'],
    'Mainz': ['FSV Mainz 05', 'Mainz 05'],
    'Werder Bremen': ['SV Werder Bremen', 'Werder Bremen FC'],
    'Stuttgart': ['VfB Stuttgart', 'Stuttgart FC'],
    'Wolfsburg': ['VfL Wolfsburg', 'Wolfsburg FC'],
    'Hertha': ['Hertha Berlin', 'Hertha BSC', 'Hertha BSC Berlin'],
    'Ein Frankfurt': ['Eintracht Frankfurt', 'Eintracht Frankfurt FC'],
    'FC Koln': ['1. FC Köln', 'FC Cologne', 'Koln'],
    'Hamburg': ['Hamburger SV', 'Hamburg SV', 'HSV'],
    'Hannover': ['Hannover 96', 'Hannover 96 FC'],
    'Hoffenheim': ['TSG 1899 Hoffenheim', 'TSG Hoffenheim', 'Hoffenheim FC'],
    'Schalke 04': ['FC Schalke 04', 'Schalke'],
    'Ingolstadt': ['FC Ingolstadt', 'FC Ingolstadt 04'],
    "M'gladbach": ['Borussia Mönchengladbach', 'Mönchengladbach', 'Gladbach'],
    'Freiburg': ['SC Freiburg', 'Freiburg FC'],
    'RB Leipzig': ['RasenBallsport Leipzig', 'RB Leipzig FC'],
    'Union Berlin': ['1. FC Union Berlin', 'Union Berlin FC'],
    'Fortuna Dusseldorf': ['Fortuna Düsseldorf', 'Fortuna Düsseldorf FC'],
    'Paderborn': ['SC Paderborn', 'SC Paderborn 07'],
    'Nurnberg': ['1. FC Nürnberg', 'FC Nurnberg', 'Nuremberg'],
    'Bochum': ['VfL Bochum', 'VfL Bochum 1848'],
    'Bielefeld': ['Arminia Bielefeld', 'DSC Arminia Bielefeld'],
    'Greuther Furth': ['SpVgg Greuther Fürth', 'Greuther Fürth'],
    'Heidenheim': ['FC Heidenheim', '1. FC Heidenheim 1846'],
    'St Pauli': ['FC St. Pauli', 'St. Pauli'],
    'Holstein Kiel': ['Holstein Kiel FC', 'KSV Holstein Kiel']
  },
  'Serie A': {
    'Atalanta': ['Atalanta BC', 'Atalanta Bergamasca Calcio'],
    'Benevento': ['Benevento Calcio', 'Benevento FC'],
    'Bologna': ['Bologna FC', 'Bologna FC 1909'],
    'Brescia': ['Brescia Calcio', 'Brescia FC'],
    'Cagliari': ['Cagliari Calcio', 'Cagliari FC'],
    'Carpi': ['Carpi FC', 'Carpi FC 1909'],
    'Chievo': ['Chievo Verona', 'AC ChievoVerona'],
    'Como': ['Como 1907', 'Como FC'],
    'Cremonese': ['US Cremonese', 'Cremonese FC'],
    'Crotone': ['FC Crotone', 'Crotone Calcio'],
    'Empoli': ['Empoli FC', 'Empoli Football Club'],
    'Fiorentina': ['ACF Fiorentina', 'Fiorentina FC'],
    'Frosinone': ['Frosinone Calcio', 'Frosinone FC'],
    'Genoa': ['Genoa CFC', 'Genoa Cricket and Football Club'],
    'Inter': ['Inter Milan', 'Internazionale', 'FC Internazionale Milano'],
    'Juventus': ['Juventus FC', 'Juve'],
    'Lazio': ['SS Lazio', 'Lazio Roma'],
    'Lecce': ['US Lecce', 'Lecce FC'],
    'Milan': ['AC Milan', 'Milan AC'],
    'Monza': ['AC Monza', 'Monza FC'],
    'Napoli': ['SSC Napoli', 'Napoli FC'],
    'Palermo': ['Palermo FC', 'Palermo Calcio'],
    'Parma': ['Parma Calcio', 'Parma Calcio 1913'],
    'Pescara': ['Pescara Calcio', 'Pescara FC'],
    'Pisa': ['Pisa SC', 'Pisa Sporting Club'],
    'Roma': ['AS Roma', 'Roma FC'],
    'Salernitana': ['US Salernitana', 'Salernitana Calcio'],
    'Sampdoria': ['UC Sampdoria', 'Sampdoria FC'],
    'Sassuolo': ['US Sassuolo', 'Sassuolo Calcio'],
    'Spal': ['SPAL', 'SPAL Ferrara'],
    'Spezia': ['Spezia Calcio', 'Spezia FC'],
    'Torino': ['Torino FC', 'Torino Football Club'],
    'Udinese': ['Udinese Calcio', 'Udinese FC'],
    'Venezia': ['Venezia FC', 'Venezia Football Club'],
    'Verona': ['Hellas Verona', 'Hellas Verona FC']
  },
  'Eredivisie': {
    'Ajax': ['AFC Ajax', 'Ajax Amsterdam', 'Ajax FC'],
    'Almere City': ['Almere City FC', 'Almere FC'],
    'AZ Alkmaar': ['AZ', 'AZ Alkmaar FC', 'Alkmaar Zaanstreek'],
    'Cambuur': ['SC Cambuur', 'Cambuur Leeuwarden'],
    'Den Haag': ['ADO Den Haag', 'ADO'],
    'Excelsior': ['Excelsior Rotterdam', 'Excelsior Rotterdam FC'],
    'FC Emmen': ['Emmen', 'FC Emmen FC'],
    'Feyenoord': ['Feyenoord Rotterdam', 'Feyenoord FC'],
    'For Sittard': ['Fortuna Sittard', 'Fortuna Sittard FC'],
    'Go Ahead Eagles': ['Go Ahead Eagles FC', 'GA Eagles'],
    'Graafschap': ['De Graafschap', 'Graafschap FC'],
    'Groningen': ['FC Groningen', 'Groningen FC'],
    'Heerenveen': ['SC Heerenveen', 'Heerenveen FC'],
    'Heracles': ['Heracles Almelo', 'Heracles Almelo FC'],
    'NAC Breda': ['NAC', 'NAC Breda FC'],
    'Nijmegen': ['NEC', 'NEC Nijmegen'],
    'PSV Eindhoven': ['PSV', 'PSV FC', 'Philips Sport Vereniging'],
    'Roda': ['Roda JC', 'Roda JC Kerkrade'],
    'Sparta Rotterdam': ['Sparta', 'Sparta Rotterdam FC'],
    'Telstar': ['SC Telstar', 'Telstar FC'],
    'Twente': ['FC Twente', 'Twente FC'],
    'Utrecht': ['FC Utrecht', 'Utrecht FC'],
    'Vitesse': ['Vitesse Arnhem', 'Vitesse FC'],
    'Volendam': ['FC Volendam', 'Volendam FC'],
    'VVV Venlo': ['VVV', 'VVV-Venlo'],
    'Waalwijk': ['RKC Waalwijk', 'RKC'],
    'Willem II': ['Willem II Tilburg', 'Willem II FC'],
    'Zwolle': ['PEC Zwolle', 'Zwolle FC']
  },
  'La Liga': {
    'Alaves': ['Deportivo Alavés', 'Alavés', 'CD Alaves'],
    'Almeria': ['UD Almería', 'Almeria FC'],
    'Ath Bilbao': ['Athletic Club', 'Athletic Bilbao', 'Athletic Club Bilbao'],
    'Ath Madrid': ['Atlético Madrid', 'Atletico Madrid', 'Atlético de Madrid'],
    'Barcelona': ['FC Barcelona', 'Barcelona FC', 'Barça'],
    'Betis': ['Real Betis', 'Real Betis Balompié', 'Betis Sevilla'],
    'Cadiz': ['Cádiz CF', 'Cadiz CF'],
    'Celta': ['Celta Vigo', 'RC Celta de Vigo', 'Celta de Vigo'],
    'Eibar': ['SD Eibar', 'Eibar FC'],
    'Elche': ['Elche CF', 'Elche FC'],
    'Espanol': ['RCD Espanyol', 'Espanyol Barcelona', 'Espanyol'],
    'Getafe': ['Getafe CF', 'Getafe FC'],
    'Girona': ['Girona FC', 'Girona Football Club'],
    'Granada': ['Granada CF', 'Granada FC'],
    'Huesca': ['SD Huesca', 'Huesca FC'],
    'La Coruna': ['Deportivo La Coruña', 'Deportivo', 'Depor'],
    'Las Palmas': ['UD Las Palmas', 'Las Palmas FC'],
    'Leganes': ['CD Leganés', 'Leganes FC'],
    'Levante': ['Levante UD', 'Levante FC'],
    'Malaga': ['Málaga CF', 'Malaga FC'],
    'Mallorca': ['RCD Mallorca', 'Mallorca FC'],
    'Osasuna': ['CA Osasuna', 'Osasuna FC'],
    'Oviedo': ['Real Oviedo', 'Oviedo FC'],
    'Real Madrid': ['Real Madrid CF', 'Real Madrid Club de Fútbol'],
    'Sevilla': ['Sevilla FC', 'Sevilla FC Sevilla'],
    'Sociedad': ['Real Sociedad', 'Real Sociedad de Fútbol'],
    'Sp Gijon': ['Sporting Gijón', 'Real Sporting de Gijón', 'Sporting Gijon'],
    'Valencia': ['Valencia CF', 'Valencia Club de Fútbol'],
    'Valladolid': ['Real Valladolid', 'Real Valladolid CF'],
    'Vallecano': ['Rayo Vallecano', 'Rayo Vallecano de Madrid'],
    'Villarreal': ['Villarreal CF', 'Villarreal Club de Fútbol']
  }
};

export const STATIC_TEAM_MAPPINGS: TeamMapping = Object.values(STATIC_TEAM_LISTS).reduce(
  (acc, leagueTeams) => {
    Object.entries(leagueTeams).forEach(([canonical, variants]) => {
      acc[canonical] = canonical;
      variants.forEach(variant => {
        acc[variant] = canonical;
      });
    });
    return acc;
  },
  {} as TeamMapping
);

export const mergeTeamMappings = (mappings: TeamMapping): TeamMapping => {
  const sanitizedMappings = Object.entries(mappings).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {} as TeamMapping);

  return {
    ...STATIC_TEAM_MAPPINGS,
    ...sanitizedMappings
  };
};
