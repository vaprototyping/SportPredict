
import { HistoricalMatch, TeamStats, TeamMapping } from '../types';

export function getTeamForm(matches: HistoricalMatch[], teamName: string, lookback: number = 10): TeamStats {
  // Filter matches involving the team and sort by date descending
  const teamMatches = matches
    .filter(m => m.HomeTeam === teamName || m.AwayTeam === teamName)
    .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
    .slice(0, lookback);

  if (teamMatches.length === 0) {
    return { avgGoalsScored: 0, avgGoalsConceded: 0, matchesPlayed: 0 };
  }

  let scored = 0;
  let conceded = 0;

  teamMatches.forEach(m => {
    if (m.HomeTeam === teamName) {
      scored += m.FTHG;
      conceded += m.FTAG;
    } else {
      scored += m.FTAG;
      conceded += m.FTHG;
    }
  });

  return {
    avgGoalsScored: scored / teamMatches.length,
    avgGoalsConceded: conceded / teamMatches.length,
    matchesPlayed: teamMatches.length
  };
}

export function parseCSVDate(dateStr: string): string {
  // Handle various formats: DD/MM/YYYY, YYYY-MM-DD
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts[2].length === 2) parts[2] = '20' + parts[2];
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

export function findMissingTeams(upcomingTeams: string[], historicalTeams: string[], mappings: TeamMapping): string[] {
  const allHistorical = new Set(historicalTeams);
  return upcomingTeams.filter(team => !allHistorical.has(team) && !mappings[team]);
}

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/fc|cf|afc|ac/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function suggestTeamMatches(
  teamName: string,
  historicalTeams: string[],
  limit: number = 4
): string[] {
  const normalizedTarget = normalizeTeamName(teamName);
  if (!normalizedTarget) return [];
  const targetTokens = new Set(normalizedTarget.split(' ').filter(Boolean));

  const scored = historicalTeams.map(candidate => {
    const normalizedCandidate = normalizeTeamName(candidate);
    const candidateTokens = new Set(normalizedCandidate.split(' ').filter(Boolean));
    let overlap = 0;
    targetTokens.forEach(token => {
      if (candidateTokens.has(token)) overlap += 1;
    });
    const containsBonus = normalizedCandidate.includes(normalizedTarget) || normalizedTarget.includes(normalizedCandidate) ? 2 : 0;
    const score = overlap + containsBonus;
    return { candidate, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.candidate);
}
