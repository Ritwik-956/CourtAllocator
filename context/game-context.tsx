import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type Sport = 'pickleball' | 'volleyball';

/** Minimum players needed per court for each sport */
export const MIN_PLAYERS_PER_COURT: Record<Sport, number> = {
  pickleball: 4,
  volleyball: 8,
};

/** Maximum players per court for each sport */
export const MAX_PLAYERS_PER_COURT: Record<Sport, number> = {
  pickleball: 4,
  volleyball: 12,
};

/**
 * Represents a single game court with two teams.
 * Teams are string arrays to support variable sizes (2 for pickleball, 4-6 for volleyball).
 */
export type Court = {
  id: number;
  team1: string[];
  team2: string[];
};

/**
 * Global game state and actions.
 */
type GameContextType = {
  namePool: string[];
  selectedPlayers: string[];
  courts: Court[];
  excludedPlayers: string[];
  isSimulated: boolean;
  addToPool: (name: string) => boolean;
  removeFromPool: (name: string) => void;
  toggleSelect: (name: string) => void;
  courtCount: number;
  setCourtCount: (count: number) => void;
  simulate: (seeds: number[]) => void;
  simulateNextRound: (seeds: number[]) => void;
  resetSimulation: () => void;
  getPlayersForSeeding: () => string[];
  winners: Record<number, 1 | 2>;
  setWinner: (courtId: number, team: 1 | 2) => void;
  winStreaks: Record<string, number>;
  selectedSport: Sport;
  setSelectedSport: (sport: Sport) => void;
  minPlayersPerCourt: number;
};

const GameContext = createContext<GameContextType | null>(null);

const INITIAL_POOL = ['GAURI', 'RITWIK', 'ADI', 'MONIT', 'PRACHEE', 'RANA'];
const PLAYERS_STORAGE_KEY = '@namePool';

/**
 * Creates a seeded random number generator based on the provided seeds.
 * This ensures simulation results are deterministic for a given set of seeds.
 */
function createSeededRng(seeds: number[]) {
  let state = seeds.reduce((acc, s) => (acc * 31 + s) | 0, Date.now() | 0);
  return () => {
    state = (state * 1664525 + 1013904223) | 0;
    return (state >>> 0) / 0xffffffff;
  };
}

/**
 * Shuffles an array using the provided RNG function.
 */
function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Distributes `total` players evenly across `numCourts` courts.
 * Returns an array of counts per court.
 * Example: distributeEvenly(20, 2) => [10, 10]
 * Example: distributeEvenly(21, 2) => [11, 10]
 */
function distributeEvenly(total: number, numCourts: number): number[] {
  const base = Math.floor(total / numCourts);
  const remainder = total % numCourts;
  const counts: number[] = [];
  for (let i = 0; i < numCourts; i++) {
    counts.push(base + (i < remainder ? 1 : 0));
  }
  return counts;
}

/**
 * Splits a group of players into two teams as evenly as possible.
 * If odd count, the extra player goes to a random team based on RNG.
 */
function splitIntoTeams(
  players: string[],
  rng: () => number,
): { team1: string[]; team2: string[] } {
  const shuffled = seededShuffle(players, rng);
  const half = Math.floor(shuffled.length / 2);
  const isOdd = shuffled.length % 2 !== 0;

  if (isOdd) {
    // Extra player goes to random team
    const extraToTeam1 = rng() > 0.5;
    const team1Size = extraToTeam1 ? half + 1 : half;
    return {
      team1: shuffled.slice(0, team1Size),
      team2: shuffled.slice(team1Size),
    };
  }

  return {
    team1: shuffled.slice(0, half),
    team2: shuffled.slice(half),
  };
}

// ─── Pickleball Next Round Logic ──────────────────────────────────────────────

/**
 * Core logic to transition the pickleball game state to the next round.
 *
 * Rules:
 * 1. Winning teams usually stay together unless they've won 3 times in a row.
 * 2. Players with 3+ wins are split up and put into a priority pool to play again soon but with new partners.
 * 3. Players who sat out previously have higher priority to play.
 * 4. Winners are matched against winners where possible, then against challengers.
 */
function computePickleballNextRound({
  seeds,
  courts,
  winners,
  winStreaks,
  selectedPlayers,
  courtCount,
  sitOutCount,
}: {
  seeds: number[];
  courts: Court[];
  winners: Record<number, 1 | 2>;
  winStreaks: Record<string, number>;
  selectedPlayers: string[];
  courtCount: number;
  sitOutCount: Record<string, number>;
}) {
  const rng = createSeededRng(seeds);

  const nextWinStreaks: Record<string, number> = {};
  const winningTeams: string[][] = [];
  const priorityPool: string[] = [];
  const previousPartners = new Map<string, string>();

  courts.forEach(court => {
    const winnerTeamId = winners[court.id];
    if (!winnerTeamId) return;

    const winningPlayers = winnerTeamId === 1 ? court.team1 : court.team2;

    const p1 = winningPlayers[0];
    const p1Streak = (winStreaks[p1] || 0) + 1;
    const p2 = winningPlayers[1];
    const p2Streak = (winStreaks[p2] || 0) + 1;

    if (p1Streak >= 3 && p2Streak >= 3) {
      priorityPool.push(p1, p2);
      nextWinStreaks[p1] = 0;
      nextWinStreaks[p2] = 0;
      previousPartners.set(p1, p2);
      previousPartners.set(p2, p1);
    } else {
      winningTeams.push([p1, p2]);
      nextWinStreaks[p1] = p1Streak;
      nextWinStreaks[p2] = p2Streak;
    }
  });

  const activePlayers = new Set<string>();
  winningTeams.forEach(t => {
    t.forEach(p => activePlayers.add(p));
  });
  priorityPool.forEach(p => activePlayers.add(p));

  const availablePlayers = selectedPlayers.filter(p => !activePlayers.has(p));
  const shuffledAvailable = seededShuffle(availablePlayers, rng);
  shuffledAvailable.sort(
    (a, b) => (sitOutCount[b] || 0) - (sitOutCount[a] || 0),
  );

  const shuffledPriority = seededShuffle(priorityPool, rng);
  const rankedChallengers = [...shuffledPriority, ...shuffledAvailable];

  const neededCount = courtCount * 4 - winningTeams.length * 2;
  const playingChallengers = rankedChallengers.slice(0, neededCount);
  const remainingChallengers = rankedChallengers.slice(neededCount);

  let finalChallengers = seededShuffle(playingChallengers, rng);

  const pullTeam = (): string[] => {
    const p1 = finalChallengers.shift()!;
    let p2Idx = 0;
    while (
      p2Idx < finalChallengers.length &&
      previousPartners.get(p1) === finalChallengers[p2Idx]
    ) {
      p2Idx++;
    }
    if (p2Idx >= finalChallengers.length) p2Idx = 0;
    const p2 = finalChallengers.splice(p2Idx, 1)[0];
    return [p1, p2];
  };

  const nextCourts: Court[] = [];
  let courtIndex = 1;

  const shuffledWinners = seededShuffle(winningTeams, rng);

  while (shuffledWinners.length >= 2) {
    const team1 = shuffledWinners.pop()!;
    const team2 = shuffledWinners.pop()!;
    nextCourts.push({ id: courtIndex++, team1, team2 });
  }

  if (shuffledWinners.length === 1) {
    const team1 = shuffledWinners.pop()!;
    const team2 = pullTeam();
    nextCourts.push({ id: courtIndex++, team1, team2 });
  }

  while (courtIndex <= courtCount) {
    const team1 = pullTeam();
    const team2 = pullTeam();
    nextCourts.push({ id: courtIndex++, team1, team2 });
  }

  const nextSitOutCount = { ...sitOutCount };
  remainingChallengers.forEach(p => {
    nextSitOutCount[p] = (nextSitOutCount[p] || 0) + 1;
  });

  return { nextCourts, nextWinStreaks, nextSitOutCount, remainingChallengers };
}

// ─── Volleyball Next Round Logic ──────────────────────────────────────────────

/**
 * Core logic to transition the volleyball game state to the next round.
 *
 * Rules:
 * 1. Winning teams stay together unless all members have 3+ consecutive wins.
 * 2. Players with 3+ wins are split up into a priority pool.
 * 3. Players who sat out previously have higher priority to play.
 * 4. Players are distributed evenly across courts.
 */
function computeVolleyballNextRound({
  seeds,
  courts,
  winners,
  winStreaks,
  selectedPlayers,
  courtCount,
  sitOutCount,
}: {
  seeds: number[];
  courts: Court[];
  winners: Record<number, 1 | 2>;
  winStreaks: Record<string, number>;
  selectedPlayers: string[];
  courtCount: number;
  sitOutCount: Record<string, number>;
}) {
  const rng = createSeededRng(seeds);

  const nextWinStreaks: Record<string, number> = {};
  const winningTeams: string[][] = [];
  const priorityPool: string[] = [];

  courts.forEach(court => {
    const winnerTeamId = winners[court.id];
    if (!winnerTeamId) return;

    const winningPlayers = winnerTeamId === 1 ? court.team1 : court.team2;

    // Check if ALL players in the winning team have 3+ win streaks
    const allHighStreak = winningPlayers.every(
      p => ((winStreaks[p] || 0) + 1) >= 3,
    );

    if (allHighStreak) {
      // Split the team — all go to priority pool
      winningPlayers.forEach(p => {
        priorityPool.push(p);
        nextWinStreaks[p] = 0;
      });
    } else {
      // Team stays together
      winningTeams.push([...winningPlayers]);
      winningPlayers.forEach(p => {
        nextWinStreaks[p] = (winStreaks[p] || 0) + 1;
      });
    }
  });

  // Collect all active (winning) players
  const activePlayers = new Set<string>();
  winningTeams.forEach(t => t.forEach(p => activePlayers.add(p)));
  priorityPool.forEach(p => activePlayers.add(p));

  const availablePlayers = selectedPlayers.filter(p => !activePlayers.has(p));
  const shuffledAvailable = seededShuffle(availablePlayers, rng);
  shuffledAvailable.sort(
    (a, b) => (sitOutCount[b] || 0) - (sitOutCount[a] || 0),
  );

  const shuffledPriority = seededShuffle(priorityPool, rng);
  const allChallengers = [...shuffledPriority, ...shuffledAvailable];

  // Calculate how many players we need total
  const winnerPlayerCount = winningTeams.reduce((sum, t) => sum + t.length, 0);
  const maxTotal = courtCount * MAX_PLAYERS_PER_COURT.volleyball;

  // We want to use as many players as possible up to maxTotal
  const targetTotal = Math.min(
    winnerPlayerCount + allChallengers.length,
    maxTotal,
  );
  const neededChallengers = Math.max(0, targetTotal - winnerPlayerCount);
  const playingChallengers = allChallengers.slice(0, neededChallengers);
  const remainingChallengers = allChallengers.slice(neededChallengers);

  // All playing players
  const allPlaying = [
    ...winningTeams.flat(),
    ...playingChallengers,
  ];

  // Distribute evenly across courts
  const courtSizes = distributeEvenly(allPlaying.length, courtCount);

  // Build courts: try to keep winning teams together on one side
  const nextCourts: Court[] = [];
  let challengerPool = seededShuffle(playingChallengers, rng);
  let winnerTeamsPool = seededShuffle(winningTeams, rng);

  for (let i = 0; i < courtCount; i++) {
    const courtSize = courtSizes[i];
    
    // Determine target sizes for team1 and team2
    const isTeam1Extra = rng() > 0.5;
    const t1Target = isTeam1Extra ? Math.ceil(courtSize / 2) : Math.floor(courtSize / 2);
    const t2Target = courtSize - t1Target;
    
    let team1: string[] = [];
    let team2: string[] = [];

    // 1. Try to fill team1
    if (winnerTeamsPool.length > 0 && winnerTeamsPool[0].length <= t1Target) {
      team1 = winnerTeamsPool.shift()!;
    }
    // Fill remaining spots in team1 from challenger pool
    while (team1.length < t1Target && challengerPool.length > 0) {
      team1.push(challengerPool.shift()!);
    }

    // 2. Try to fill team2
    if (winnerTeamsPool.length > 0 && winnerTeamsPool[0].length <= t2Target) {
      team2 = winnerTeamsPool.shift()!;
    }
    // Fill remaining spots in team2 from challenger pool
    while (team2.length < t2Target && challengerPool.length > 0) {
      team2.push(challengerPool.shift()!);
    }
    
    // Any leftover winners that couldn't fit into target sizes (rare)
    // they will be broken up into challenger pool for the next court or this one
    if (winnerTeamsPool.length > 0 && team1.length < t1Target) {
        const winTeam = winnerTeamsPool.shift()!;
        while (winTeam.length > 0 && team1.length < t1Target) {
            team1.push(winTeam.shift()!);
        }
        if (winTeam.length > 0) challengerPool.push(...winTeam);
    }
    
    // Final defensive fill
    while (team1.length < t1Target && challengerPool.length > 0) team1.push(challengerPool.shift()!);
    while (team2.length < t2Target && challengerPool.length > 0) team2.push(challengerPool.shift()!);

    nextCourts.push({ 
      id: i + 1, 
      team1: seededShuffle(team1, rng), 
      team2: seededShuffle(team2, rng) 
    });
  }

  const nextSitOutCount = { ...sitOutCount };
  remainingChallengers.forEach(p => {
    nextSitOutCount[p] = (nextSitOutCount[p] || 0) + 1;
  });

  return { nextCourts, nextWinStreaks, nextSitOutCount, remainingChallengers };
}

// ─── Exported computeNextRoundState (sport-aware wrapper) ─────────────────────

export function computeNextRoundState(params: {
  seeds: number[];
  courts: Court[];
  winners: Record<number, 1 | 2>;
  winStreaks: Record<string, number>;
  selectedPlayers: string[];
  courtCount: number;
  sitOutCount: Record<string, number>;
  sport: Sport;
}) {
  if (params.sport === 'volleyball') {
    return computeVolleyballNextRound(params);
  }
  return computePickleballNextRound(params);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  // --- Game State ---
  const [namePool, setNamePool] = useState<string[]>(INITIAL_POOL);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [courtCount, setCourtCount] = useState(0);
  const [selectedSport, setSelectedSportState] = useState<Sport>('pickleball');
  const minPlayersPerCourt = MIN_PLAYERS_PER_COURT[selectedSport];
  const [courts, setCourts] = useState<Court[]>([]);
  const [excludedPlayers, setExcludedPlayers] = useState<string[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [winners, setWinners] = useState<Record<number, 1 | 2>>({});
  const [winStreaks, setWinStreaks] = useState<Record<string, number>>({});
  const [sitOutCount, setSitOutCount] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);
        if (stored) {
          setNamePool(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load initial pool:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        await AsyncStorage.setItem(
          PLAYERS_STORAGE_KEY,
          JSON.stringify(namePool),
        );
      } catch (err) {
        console.error('Failed to save name pool:', err);
      }
    })();
  }, [namePool, isLoaded]);

  const addToPool = useCallback(
    (name: string): boolean => {
      const normalized = name.trim().toUpperCase();
      if (!normalized) return false;
      if (namePool.includes(normalized)) return false;
      setNamePool(prev => [...prev, normalized]);
      return true;
    },
    [namePool],
  );

  const removeFromPool = useCallback((name: string) => {
    setNamePool(prev => prev.filter(n => n !== name));
    setSelectedPlayers(prev => {
      const next = prev.filter(n => n !== name);
      setCourtCount(Math.floor(next.length / minPlayersPerCourt));
      return next;
    });
    setCourts([]);
    setExcludedPlayers([]);
    setIsSimulated(false);
    setWinners({});
    setWinStreaks({});
    setSitOutCount({});
  }, [minPlayersPerCourt]);

  const toggleSelect = useCallback((name: string) => {
    setSelectedPlayers(prev => {
      const next = prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name];
      setCourtCount(Math.floor(next.length / minPlayersPerCourt));
      return next;
    });
    setCourts([]);
    setExcludedPlayers([]);
    setIsSimulated(false);
    setWinners({});
    setWinStreaks({});
    setSitOutCount({});
  }, [minPlayersPerCourt]);

  const getPlayersForSeeding = useCallback((): string[] => {
    const count = selectedPlayers.length >= 3 ? 3 : 2;
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }, [selectedPlayers]);

  /**
   * Starts the first round of the simulation.
   * Branches on selectedSport for sport-specific allocation.
   */
  const simulate = useCallback(
    (seeds: number[]) => {
      const rng = createSeededRng(seeds);

      if (selectedSport === 'volleyball') {
        // --- Volleyball simulation ---
        const maxTotal = courtCount * MAX_PLAYERS_PER_COURT.volleyball;
        const numPlaying = Math.min(selectedPlayers.length, maxTotal);

        const shuffled = seededShuffle(selectedPlayers, rng);
        const playing = shuffled.slice(0, numPlaying);
        const excluded = shuffled.slice(numPlaying);

        // Distribute players evenly across courts
        const courtSizes = distributeEvenly(playing.length, courtCount);
        const assigned = seededShuffle(playing, rng);

        const newCourts: Court[] = [];
        let offset = 0;
        for (let i = 0; i < courtCount; i++) {
          const size = courtSizes[i];
          const courtPlayers = assigned.slice(offset, offset + size);
          offset += size;

          const { team1, team2 } = splitIntoTeams(courtPlayers, rng);
          newCourts.push({ id: i + 1, team1, team2 });
        }

        setCourts(newCourts);
        setExcludedPlayers(excluded);

        const newSitOut: Record<string, number> = {};
        excluded.forEach(p => {
          newSitOut[p] = 1;
        });
        setSitOutCount(newSitOut);
        setWinners({});
        setWinStreaks({});
        setIsSimulated(true);
      } else {
        // --- Pickleball simulation (existing logic) ---
        const numPlaying = courtCount * 4;

        const shuffled = seededShuffle(selectedPlayers, rng);
        const playing = shuffled.slice(0, numPlaying);
        const excluded = shuffled.slice(numPlaying);

        const assigned = seededShuffle(playing, rng);

        const newCourts: Court[] = [];
        for (let i = 0; i < courtCount; i++) {
          newCourts.push({
            id: i + 1,
            team1: [assigned[i * 4], assigned[i * 4 + 1]],
            team2: [assigned[i * 4 + 2], assigned[i * 4 + 3]],
          });
        }

        setCourts(newCourts);
        setExcludedPlayers(excluded);

        const newSitOut: Record<string, number> = {};
        excluded.forEach(p => {
          newSitOut[p] = 1;
        });
        setSitOutCount(newSitOut);
        setWinners({});
        setWinStreaks({});
        setIsSimulated(true);
      }
    },
    [selectedPlayers, courtCount, selectedSport],
  );

  const resetSimulation = useCallback(() => {
    setCourts([]);
    setExcludedPlayers([]);
    setIsSimulated(false);
    setWinners({});
    setWinStreaks({});
    setSitOutCount({});
  }, []);

  const setSelectedSport = useCallback((sport: Sport) => {
    setSelectedSportState(sport);
    const ppc = MIN_PLAYERS_PER_COURT[sport];
    setCourtCount(Math.floor(selectedPlayers.length / ppc));
    setCourts([]);
    setExcludedPlayers([]);
    setIsSimulated(false);
    setWinners({});
    setWinStreaks({});
    setSitOutCount({});
  }, [selectedPlayers]);

  const setWinner = useCallback((courtId: number, team: 1 | 2) => {
    setWinners(prev => ({ ...prev, [courtId]: team }));
  }, []);

  /**
   * Calculates and sets the state for the next round based on current results.
   */
  const simulateNextRound = useCallback(
    (seeds: number[]) => {
      const {
        nextCourts,
        nextWinStreaks,
        nextSitOutCount,
        remainingChallengers,
      } = computeNextRoundState({
        seeds,
        courts,
        winners,
        winStreaks,
        selectedPlayers,
        courtCount,
        sitOutCount,
        sport: selectedSport,
      });

      setCourts(nextCourts);
      setWinStreaks(nextWinStreaks);
      setWinners({});
      setExcludedPlayers(remainingChallengers);
      setSitOutCount(nextSitOutCount);
      setIsSimulated(true);
    },
    [courts, winners, winStreaks, selectedPlayers, courtCount, sitOutCount, selectedSport],
  );

  return (
    <GameContext.Provider
      value={{
        namePool,
        selectedPlayers,
        courts,
        excludedPlayers,
        isSimulated,
        courtCount,
        setCourtCount,
        addToPool,
        removeFromPool,
        toggleSelect,
        simulate,
        simulateNextRound,
        resetSimulation,
        getPlayersForSeeding,
        winners,
        setWinner,
        winStreaks,
        selectedSport,
        setSelectedSport,
        minPlayersPerCourt,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
