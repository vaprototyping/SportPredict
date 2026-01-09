
export interface HistoricalMatch {
  Date: string;
  League: string;
  HomeTeam: string;
  AwayTeam: string;
  FTHG: number;
  FTAG: number;
}

export interface UpcomingMatch {
  Date: string;
  League: string;
  HomeTeam: string;
  AwayTeam: string;
  AHh: number; // Home handicap: 0.0 or 0.5
  Odds_H: number;
  Odds_A: number;
}

export interface TeamStats {
  avgGoalsScored: number;
  avgGoalsConceded: number;
  matchesPlayed: number;
}

export interface PredictionResult {
  date: string;
  league: string;
  match: string;
  marketType: 'DNB' | '+0.5';
  pickSide: 'Home' | 'Away';
  handicap: number;
  odds: number;
  modelProb: number;
  ev: number;
  confidence: 'Very High' | 'High' | 'Medium' | 'Low';
}

export interface TeamMapping {
  [key: string]: string; // upcomingName -> historicalName
}

export interface RunHistoryItem {
  id: string;
  timestamp: string;
  picks: PredictionResult[];
}
