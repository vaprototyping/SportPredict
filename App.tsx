
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  HistoricalMatch, UpcomingMatch, PredictionResult, 
  TeamMapping, RunHistoryItem 
} from './types';
import { getTeamForm, parseCSVDate, findMissingTeams, suggestTeamMatches } from './services/dataProcessor';
import { calculateOutcomeProbs, calculateAsianProbs } from './services/mathUtils';
import { db } from './services/db';
import { 
  Upload, Table, Activity, History as HistoryIcon, 
  Settings, Download, Trash2, CheckCircle2, AlertTriangle, Info,
  Search, ChevronRight, LayoutDashboard, Database, Save
} from 'lucide-react';

// Use standard JS/Browser APIs for CSV parsing
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(header => header.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i]?.trim();
    });
    return obj;
  });
};

const safeLocalStorageGet = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (error) {
    console.warn(`Unable to access localStorage for ${key}.`, error);
    return fallback;
  }
};

const safeLocalStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Unable to persist ${key} to localStorage.`, error);
  }
};

const App: React.FC = () => {
  // --- State ---
  const [historicalData, setHistoricalData] = useState<HistoricalMatch[]>([]);
  const [upcomingData, setUpcomingData] = useState<UpcomingMatch[]>([]);
  const [teamMappings, setTeamMappings] = useState<TeamMapping>(() => {
    const saved = safeLocalStorageGet('teamMappings', '');
    return saved ? JSON.parse(saved) : {};
  });
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>(() => {
    const saved = safeLocalStorageGet('runHistory', '');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'upload' | 'mapping' | 'analysis' | 'history'>('upload');
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [mappingSearch, setMappingSearch] = useState('');
  const [upcomingErrors, setUpcomingErrors] = useState<string[]>([]);
  const [upcomingWarnings, setUpcomingWarnings] = useState<string[]>([]);
  const suggestedEvThreshold = 0.05;
  const suggestedProbThreshold = 0.5;
  const suggestedMaxPicks = 5;
  const [maxPicks, setMaxPicks] = useState(suggestedMaxPicks);
  
  // Settings
  const [evThreshold, setEvThreshold] = useState(suggestedEvThreshold); // 5% EV
  const [probThreshold, setProbThreshold] = useState(suggestedProbThreshold); // 50% Win Prob

  const historicalTeams = useMemo(() => (
    Array.from(new Set(historicalData.flatMap(m => [m.HomeTeam, m.AwayTeam])))
  ), [historicalData]);

  const historicalSummary = useMemo(() => {
    if (historicalData.length === 0) {
      return { teams: 0, dateRange: '—' };
    }
    const sortedDates = historicalData
      .map(match => match.Date)
      .filter(Boolean)
      .sort();
    const start = sortedDates[0];
    const end = sortedDates[sortedDates.length - 1];
    return {
      teams: historicalTeams.length,
      dateRange: `${start} → ${end}`
    };
  }, [historicalData, historicalTeams.length]);

  const upcomingTeams = useMemo(() => (
    Array.from(new Set(upcomingData.flatMap(m => [m.HomeTeam, m.AwayTeam])))
  ), [upcomingData]);

  // --- Effects ---
  // Load Historical Data from IndexedDB on Mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        await db.init();
        const savedMatches = await db.getAllMatches();
        setHistoricalData(savedMatches);
      } catch (err) {
        console.error("Failed to initialize database:", err);
      } finally {
        setIsDbLoading(false);
      }
    };
    loadSavedData();
  }, []);

  useEffect(() => {
    safeLocalStorageSet('teamMappings', JSON.stringify(teamMappings));
  }, [teamMappings]);

  useEffect(() => {
    safeLocalStorageSet('runHistory', JSON.stringify(runHistory));
  }, [runHistory]);

  // --- Logic ---
  const handleHistoricalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsLoading(true);
    const files = Array.from(e.target.files) as File[];
    let newMatches: HistoricalMatch[] = [];

    for (const file of files) {
      const text = await file.text();
      const parsed = parseCSV(text);
      // Fixed: Explicitly type the map result to HistoricalMatch[]
      const matches = parsed.map((m: any) => ({
        Date: parseCSVDate(m.Date),
        League: m.League || m.Div,
        HomeTeam: m.HomeTeam,
        AwayTeam: m.AwayTeam,
        FTHG: parseInt(m.FTHG),
        FTAG: parseInt(m.FTAG)
      })).filter(m => m.HomeTeam && !isNaN(m.FTHG)) as HistoricalMatch[];
      newMatches = [...newMatches, ...matches];
    }

    try {
      await db.saveMatches(newMatches);
      const allMatches = await db.getAllMatches();
      setHistoricalData(allMatches);
    } catch (err) {
      alert("Error saving to persistent storage.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpcomingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const text = await file.text();
    const parsed = parseCSV(text);
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredHeaders = ['Date', 'League', 'HomeTeam', 'AwayTeam', 'AHh', 'Odds_H', 'Odds_A'];
    if (parsed.length === 0) {
      errors.push('No rows detected. Confirm the CSV has a header row and data.');
    } else {
      const headers = Object.keys(parsed[0]);
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      }
    }

    const matches: UpcomingMatch[] = parsed.map((m: any, index: number) => {
      const ahh = parseFloat(m.AHh);
      const oddsH = parseFloat(m.Odds_H);
      const oddsA = parseFloat(m.Odds_A);
      if (Number.isNaN(ahh) || ![0, 0.5].includes(ahh)) {
        warnings.push(`Row ${index + 2}: AHh must be 0.0 or 0.5. Skipped.`);
        return null;
      }
      if (Number.isNaN(oddsH) || Number.isNaN(oddsA)) {
        warnings.push(`Row ${index + 2}: Missing odds. Skipped.`);
        return null;
      }
      return {
        Date: String(m.Date || ''),
        League: String(m.League || ''),
        HomeTeam: String(m.HomeTeam || ''),
        AwayTeam: String(m.AwayTeam || ''),
        AHh: ahh,
        Odds_H: oddsH,
        Odds_A: oddsA
      };
    }).filter(Boolean) as UpcomingMatch[];
    
    setUpcomingErrors(errors);
    setUpcomingWarnings(warnings);
    
    setUpcomingData(matches);
    
    // Check for missing mappings
    const histTeams = Array.from(new Set(historicalData.map(m => m.HomeTeam))) as string[];
    const upcomingTeams: string[] = [
      ...matches.map(m => m.HomeTeam), 
      ...matches.map(m => m.AwayTeam)
    ];
    const missing = findMissingTeams(
      upcomingTeams,
      histTeams,
      teamMappings
    );
    if (missing.length > 0) setActiveTab('mapping');
  };

  const runAnalysis = () => {
    setIsLoading(true);
    setTimeout(() => {
      const allPicks: PredictionResult[] = [];

      upcomingData.forEach(match => {
        const hName = teamMappings[match.HomeTeam] || match.HomeTeam;
        const aName = teamMappings[match.AwayTeam] || match.AwayTeam;

        const homeStats = getTeamForm(historicalData, hName);
        const awayStats = getTeamForm(historicalData, aName);

        if (homeStats.matchesPlayed < 5 || awayStats.matchesPlayed < 5) return;

        const lambdaHome = (homeStats.avgGoalsScored + awayStats.avgGoalsConceded) / 2;
        const lambdaAway = (awayStats.avgGoalsScored + homeStats.avgGoalsConceded) / 2;

        const outcomeProbs = calculateOutcomeProbs(lambdaHome, lambdaAway);
        const asianProbs = calculateAsianProbs(outcomeProbs);

        const evaluations: any[] = [];

        if (match.AHh === 0.0) {
          evaluations.push({
            side: 'Home',
            market: 'DNB',
            handicap: 0,
            prob: asianProbs.homeDNB,
            odds: match.Odds_H
          });
          evaluations.push({
            side: 'Away',
            market: 'DNB',
            handicap: 0,
            prob: asianProbs.awayDNB,
            odds: match.Odds_A
          });
        }

        if (match.AHh === 0.5) {
          evaluations.push({
            side: 'Home',
            market: '+0.5',
            handicap: 0.5,
            prob: asianProbs.homePlus05,
            odds: match.Odds_H
          });
        } else if (match.AHh === -0.5) {
          evaluations.push({
            side: 'Away',
            market: '+0.5',
            handicap: 0.5,
            prob: asianProbs.awayPlus05,
            odds: match.Odds_A
          });
        }
        
        evaluations.forEach(ev => {
          const expectedValue = (ev.prob * ev.odds) - 1;
          if (expectedValue >= evThreshold && ev.prob >= probThreshold) {
            let label: 'Very High' | 'High' | 'Medium' | 'Low' = 'Low';
            if (expectedValue > 0.15 && ev.prob > 0.65) label = 'Very High';
            else if (expectedValue > 0.10 && ev.prob > 0.60) label = 'High';
            else if (expectedValue > 0.05) label = 'Medium';

            allPicks.push({
              date: match.Date,
              league: match.League,
              match: `${match.HomeTeam} vs ${match.AwayTeam}`,
              marketType: ev.market,
              pickSide: ev.side,
              handicap: ev.handicap,
              odds: ev.odds,
              modelProb: ev.prob,
              ev: expectedValue,
              confidence: label
            });
          }
        });
      });

      const topPicks = allPicks
        .sort((a, b) => b.ev - a.ev)
        .slice(0, maxPicks);

      setResults(topPicks);
      
      const newHistoryItem: RunHistoryItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        picks: topPicks
      };
      setRunHistory(prev => [newHistoryItem, ...prev]);
      
      setIsLoading(false);
      setActiveTab('analysis');
    }, 1500);
  };

  const exportPicks = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Date,League,Match,Market,Side,Handicap,Odds,Prob,EV,Confidence", ...results.map(r => 
        `${r.date},${r.league},${r.match},${r.marketType},${r.pickSide},${r.handicap},${r.odds},${(r.modelProb*100).toFixed(1)}%,${(r.ev*100).toFixed(1)}%,${r.confidence}`
      )].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `picks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const clearHistorical = async () => {
    if (confirm("Are you sure you want to permanently delete ALL historical data from this browser? This cannot be undone.")) {
      await db.clearAll();
      setHistoricalData([]);
    }
  };

  const downloadUpcomingTemplate = () => {
    const template = [
      'Date,League,HomeTeam,AwayTeam,AHh,Odds_H,Odds_A',
      '2026-01-17,EPL,Manchester United,Manchester City,0.5,1.825,2.025',
      '2026-01-18,EPL,Sunderland,Crystal Palace,0.0,1.950,1.900'
    ].join('\n');
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'upcoming_events_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Sub-components ---
  const SidebarItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
        activeTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 space-y-8">
        <div className="flex items-center space-x-2 text-indigo-600">
          <Activity size={32} strokeWidth={2.5} />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">FootyValue <span className="text-indigo-600">Pro</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem id="upload" label="Data Sources" icon={Database} />
          <SidebarItem id="mapping" label="Team Mapping" icon={Settings} />
          <SidebarItem id="analysis" label="Run Analysis" icon={LayoutDashboard} />
          <SidebarItem id="history" label="Run History" icon={HistoryIcon} />
        </nav>

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <div className="flex items-center space-x-2">
              <Save size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Local Storage</span>
            </div>
            <div className={`h-2 w-2 rounded-full ${isDbLoading ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`} />
          </div>
          <p className="text-[10px] text-indigo-600 leading-relaxed font-medium">
            Historical data is saved "once and forever" in this browser's IndexedDB.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
            <p className="text-slate-500">Football value detection engine for serious testing (no guarantees).</p>
          </div>
          <div className="flex space-x-3">
             {historicalData.length > 0 && upcomingData.length > 0 && (
                <button 
                  onClick={runAnalysis}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center space-x-2 shadow-sm disabled:opacity-50 transition-all"
                >
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white" /> : <Activity size={18} />}
                  <span>{isLoading ? 'Processing...' : 'Run Analysis'}</span>
                </button>
             )}
          </div>
        </header>

        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <Database size={20} className="text-indigo-600" />
                    <span>Historical Data</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Persistent Storage</span>
                </div>
                {historicalData.length > 0 && (
                   <button
                     onClick={clearHistorical}
                     className="text-red-600 hover:text-red-700 transition-colors bg-red-50 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
                     title="Clear All Persistent Data"
                   >
                     <AlertTriangle size={14} />
                     <span>Delete All</span>
                   </button>
                )}
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group relative">
                <Upload size={40} className="text-slate-400 mb-4 group-hover:text-indigo-500 transition-colors" />
                <p className="text-sm text-slate-600 mb-2 font-medium">Add New Seasons</p>
                <p className="text-[10px] text-slate-400 mb-4">Matches will be merged with existing records</p>
                <input 
                  type="file" 
                  multiple 
                  onChange={handleHistoricalUpload}
                  className="hidden" 
                  id="hist-upload" 
                />
                <label htmlFor="hist-upload" className="cursor-pointer bg-white border border-slate-300 px-6 py-2 rounded-lg text-sm font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm">
                  Browse CSV Files
                </label>
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                    <div className="flex items-center space-x-3 text-indigo-600 font-bold">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600/30 border-t-indigo-600" />
                      <span>Syncing DB...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-slate-500">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Total Matches in DB:</span>
                </div>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {isDbLoading ? '...' : historicalData.length.toLocaleString()}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="uppercase text-[10px] font-bold text-slate-400">Teams</span>
                  <div className="text-sm font-semibold text-slate-700 mt-1">{historicalSummary.teams}</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="uppercase text-[10px] font-bold text-slate-400">Date Span</span>
                  <div className="text-xs font-semibold text-slate-700 mt-1">{historicalSummary.dateRange}</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center space-x-2">
                  <Table size={20} className="text-indigo-600" />
                  <span>Weekly Odds Input</span>
                </h3>
                <button
                  onClick={downloadUpcomingTemplate}
                  className="text-xs font-bold uppercase tracking-wider text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Download Template
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group">
                <Upload size={40} className="text-slate-400 mb-4 group-hover:text-indigo-500 transition-colors" />
                <p className="text-sm text-slate-600 mb-2 font-medium">Upload upcoming_events.csv</p>
                <p className="text-[10px] text-slate-400 mb-4 text-center">Contains fresh matches & market odds</p>
                <input 
                  type="file" 
                  onChange={handleUpcomingUpload}
                  className="hidden" 
                  id="up-upload" 
                />
                <label htmlFor="up-upload" className="cursor-pointer bg-white border border-slate-300 px-6 py-2 rounded-lg text-sm font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm">
                  Upload CSV
                </label>
              </div>
              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-slate-500">Session Matches:</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{upcomingData.length}</span>
              </div>
              {upcomingErrors.length > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 space-y-1">
                  {upcomingErrors.map((error, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <AlertTriangle size={14} className="mt-0.5" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}
              {upcomingWarnings.length > 0 && (
                <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 space-y-1">
                  {upcomingWarnings.slice(0, 4).map((warning, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <Info size={14} className="mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                  {upcomingWarnings.length > 4 && (
                    <div className="text-[10px] font-bold uppercase text-amber-700">+ {upcomingWarnings.length - 4} more warnings</div>
                  )}
                </div>
              )}
            </div>

            <div className="col-span-full bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start space-x-4 shadow-sm">
              <AlertTriangle className="text-amber-600 mt-1 shrink-0" />
              <div>
                <h4 className="font-bold text-amber-900 mb-1">Persistence Note</h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Your historical database is stored locally in this browser. You can refresh the page, close your browser, or work offline—the data will stay. 
                  However, clearing your browser's "Cookies and Site Data" for this domain will delete your saved matches.
                </p>
              </div>
            </div>
            <div className="col-span-full bg-white border border-slate-200 p-6 rounded-2xl flex items-start space-x-4 shadow-sm">
              <Info className="text-slate-400 mt-1 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Responsible Use Reminder</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This tool is for analytical testing and value detection only. Outcomes are uncertain, 
                  past performance is not predictive, and there are no guaranteed returns.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mapping' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="relative w-72">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                 <input
                   type="text"
                   value={mappingSearch}
                   onChange={(e) => setMappingSearch(e.target.value)}
                   placeholder="Search teams..."
                   className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 />
              </div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Team Name Reconciliation</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 text-left">Upcoming Dataset Name</th>
                    <th className="px-6 py-4 text-center w-24">Link</th>
                    <th className="px-6 py-4 text-left">Historical Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingData.map((m, idx) => (
                    [m.HomeTeam, m.AwayTeam].map((team, tIdx) => {
                      if (mappingSearch && !team.toLowerCase().includes(mappingSearch.toLowerCase())) {
                        return null;
                      }
                      const suggestions = suggestTeamMatches(team, historicalTeams);
                      return (
                        <tr key={`${idx}-${tIdx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-700">{team}</td>
                          <td className="px-6 py-4 text-center">
                            <ChevronRight size={16} className="mx-auto text-slate-300" />
                          </td>
                          <td className="px-6 py-4 space-y-2">
                            <input 
                              type="text"
                              value={teamMappings[team] || ''}
                              onChange={(e) => setTeamMappings({...teamMappings, [team]: e.target.value})}
                              placeholder="Enter historical team name..."
                              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                            {suggestions.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {suggestions.map(suggestion => (
                                  <button
                                    key={suggestion}
                                    onClick={() => setTeamMappings({...teamMappings, [team]: suggestion})}
                                    className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )).flat().filter(Boolean).filter((v, i, a) => a.findIndex(t => t.key === v.key) === i)}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Unmapped teams: {findMissingTeams(upcomingTeams, historicalTeams, teamMappings).length}</span>
              <span>Mappings stored locally for future uploads.</span>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm font-medium">EV Filter Threshold</span>
                  <span className="text-xs font-semibold text-indigo-500">
                    Suggested: {(suggestedEvThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <input 
                    type="range" min="0" max="0.3" step="0.01" value={evThreshold} 
                    onChange={(e) => setEvThreshold(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="font-bold text-indigo-600 w-12 text-right">{(evThreshold * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm font-medium">Min Probability Threshold</span>
                  <span className="text-xs font-semibold text-indigo-500">
                    Suggested: {(suggestedProbThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <input 
                    type="range" min="0.3" max="0.8" step="0.01" value={probThreshold} 
                    onChange={(e) => setProbThreshold(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="font-bold text-indigo-600 w-12 text-right">{(probThreshold * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg flex flex-col justify-center">
                <span className="text-white/80 text-sm font-medium">Selected Picks (A Mode)</span>
                <span className="text-3xl font-bold text-white mt-1">{results.length} / {maxPicks}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm font-medium">Max Picks (A Mode)</span>
                  <span className="text-xs font-semibold text-indigo-500">
                    Suggested: {suggestedMaxPicks}
                  </span>
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <input 
                    type="range" min="3" max="5" step="1" value={maxPicks} 
                    onChange={(e) => setMaxPicks(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="font-bold text-indigo-600 w-12 text-right">{maxPicks}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-sm font-medium">Matches Evaluated</span>
                <div className="mt-2 text-2xl font-bold text-slate-800">{upcomingData.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-sm font-medium">Team Mapping Gaps</span>
                <div className="mt-2 text-2xl font-bold text-slate-800">
                  {findMissingTeams(upcomingTeams, historicalTeams, teamMappings).length}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">Generated Predictions</h3>
                 <button 
                  onClick={exportPicks}
                  className="text-slate-600 hover:text-indigo-600 flex items-center space-x-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-100 transition-all"
                 >
                   <Download size={16} />
                   <span>Export CSV</span>
                 </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left">Date / League</th>
                        <th className="px-6 py-4 text-left">Matchup</th>
                        <th className="px-6 py-4 text-left">Market Pick</th>
                        <th className="px-6 py-4 text-right">Handicap</th>
                        <th className="px-6 py-4 text-right">Odds</th>
                        <th className="px-6 py-4 text-right">Model Prob</th>
                        <th className="px-6 py-4 text-right">EV</th>
                        <th className="px-6 py-4 text-center">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                             No picks found matching current thresholds. Adjust sliders or upload more data.
                          </td>
                        </tr>
                      ) : results.map((r, i) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{r.date}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-tighter">{r.league}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">{r.match}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold mr-2">{r.marketType}</span>
                             <span className="text-indigo-600 font-bold">{r.pickSide}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-slate-600">{r.handicap.toFixed(1)}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{r.odds.toFixed(3)}</td>
                          <td className="px-6 py-4 text-right text-slate-600">{(r.modelProb * 100).toFixed(1)}%</td>
                          <td className="px-6 py-4 text-right">
                             <span className="text-emerald-600 font-bold">+{(r.ev * 100).toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                              r.confidence === 'Very High' ? 'bg-emerald-500 text-white' :
                              r.confidence === 'High' ? 'bg-emerald-100 text-emerald-700' :
                              r.confidence === 'Medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {r.confidence}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {runHistory.length === 0 ? (
               <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                 <HistoryIcon size={48} className="mx-auto mb-4 text-slate-200" />
                 <p className="font-medium text-lg">No run history yet.</p>
                 <p className="text-sm">Run an analysis to save your first set of picks.</p>
               </div>
            ) : runHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 flex justify-between items-center border-b border-slate-100">
                  <div className="flex items-center space-x-3 text-slate-600">
                    <HistoryIcon size={16} />
                    <span className="text-xs font-bold">{new Date(item.timestamp).toLocaleString()}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{item.picks.length} Picks</span>
                  </div>
                  <button 
                    onClick={() => setRunHistory(prev => prev.filter(h => h.id !== item.id))}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {item.picks.map((p, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{p.league}</span>
                          <span className="text-xs font-bold text-emerald-600">EV +{(p.ev * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate mb-1">{p.match}</p>
                        <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-600">{p.marketType} {p.pickSide} {p.handicap.toFixed(1)}</span>
                        <span className="text-xs font-mono font-bold text-slate-500">@{p.odds.toFixed(2)}</span>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
