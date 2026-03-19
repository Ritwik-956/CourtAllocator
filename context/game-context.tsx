import React, { createContext, useCallback, useContext, useState } from 'react';

/**
 * Represents a single game court with two teams.
 */
export type Court = {
  id: number;
  team1: [string, string];
  team2: [string, string];
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
};

const GameContext = createContext<GameContextType | null>(null);

const INITIAL_POOL = ['RITWIK', 'GAURI', 'PRACHEE', 'MONIT'];

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
 * Core logic to transition the game state to the next round.
 * 
 * Rules:
 * 1. Winning teams usually stay together unless they've won 3 times in a row.
 * 2. Players with 3+ wins are split up and put into a priority pool to play again soon but with new partners.
 * 3. Players who sat out previously have higher priority to play.
 * 4. Winners are matched against winners where possible, then against challengers.
 */
export function computeNextRoundState({
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
  const winningTeams: [string, string][] = [];
  const priorityPool: string[] = []; // Players who won 3+ times and are now split
  const previousPartners = new Map<string, string>(); // To prevent immediate re-pairing

  // Process current court results
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
      // Regular winners stay together
      winningTeams.push([p1, p2]);
      nextWinStreaks[p1] = p1Streak;
      nextWinStreaks[p2] = p2Streak;
    }
  });

  // Identify all players currently busy (winners or split priority players)
  const activePlayers = new Set<string>();
  winningTeams.forEach(t => {
    activePlayers.add(t[0]);
    activePlayers.add(t[1]);
  });
  priorityPool.forEach(p => activePlayers.add(p));

  const availablePlayers = selectedPlayers.filter(p => !activePlayers.has(p));
  const shuffledAvailable = seededShuffle(availablePlayers, rng);
  shuffledAvailable.sort((a, b) => (sitOutCount[b] || 0) - (sitOutCount[a] || 0));

  const shuffledPriority = seededShuffle(priorityPool, rng);
  const rankedChallengers = [...shuffledPriority, ...shuffledAvailable];

  const neededCount = (courtCount * 4) - (winningTeams.length * 2);
  const playingChallengers = rankedChallengers.slice(0, neededCount);
  const remainingChallengers = rankedChallengers.slice(neededCount);

  // Randomize the order of chosen challengers
  let finalChallengers = seededShuffle(playingChallengers, rng);

  /**
   * Helper to pick a team from the available pool.
   * Ensures team members weren't partners in the previous round if possible.
   */
  const pullTeam = (): [string, string] => {
    const p1 = finalChallengers.shift()!;
    let p2Idx = 0;
    while (p2Idx < finalChallengers.length && previousPartners.get(p1) === finalChallengers[p2Idx]) {
      p2Idx++;
    }
    if (p2Idx >= finalChallengers.length) p2Idx = 0;
    const p2 = finalChallengers.splice(p2Idx, 1)[0];
    return [p1, p2];
  };

  const nextCourts: Court[] = [];
  let courtIndex = 1;

  // Shuffle winning teams to randomize which court they end up on
  const shuffledWinners = seededShuffle(winningTeams, rng);

  // Match winning teams against each other first
  while (shuffledWinners.length >= 2) {
    const team1 = shuffledWinners.pop()!;
    const team2 = shuffledWinners.pop()!;
    nextCourts.push({
      id: courtIndex++,
      team1,
      team2,
    });
  }

  // If there's one winning team left over, match them with a challenger team
  if (shuffledWinners.length === 1) {
    const team1 = shuffledWinners.pop()!;
    const team2 = pullTeam();
    nextCourts.push({
      id: courtIndex++,
      team1,
      team2,
    });
  }

  // Fill remaining courts with challenger teams
  while (courtIndex <= courtCount) {
    const team1 = pullTeam();
    const team2 = pullTeam();
    nextCourts.push({
      id: courtIndex++,
      team1,
      team2,
    });
  }

  const nextSitOutCount = { ...sitOutCount };
  remainingChallengers.forEach(p => {
    nextSitOutCount[p] = (nextSitOutCount[p] || 0) + 1;
  });

  return { nextCourts, nextWinStreaks, nextSitOutCount, remainingChallengers };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  // --- Game State ---
  const [namePool, setNamePool] = useState<string[]>(INITIAL_POOL); // All potential players
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]); // Players participating in current session
  const [courtCount, setCourtCount] = useState(0); // Number of available courts
  const [courts, setCourts] = useState<Court[]>([]); // Current round court mappings
  const [excludedPlayers, setExcludedPlayers] = useState<string[]>([]); // Players sitting out this round
  const [isSimulated, setIsSimulated] = useState(false); // Whether a simulation has started
  const [winners, setWinners] = useState<Record<number, 1 | 2>>({}); // Map of court ID to winning team index
  const [winStreaks, setWinStreaks] = useState<Record<string, number>>({}); // Track consecutive wins per player
  const [sitOutCount, setSitOutCount] = useState<Record<string, number>>({}); // Track how many rounds a player has sat out

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
      setCourtCount(Math.floor(next.length / 4));
      return next;
    });
    setCourts([]);
    setExcludedPlayers([]);
    setIsSimulated(false);
    setWinners({});
    setWinStreaks({});
    setSitOutCount({});
  }, []);

  const toggleSelect = useCallback((name: string) => {
    setSelectedPlayers(prev => {
      const next = prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name];
      setCourtCount(Math.floor(next.length / 4));
      return next;
    });
    setCourts([]);
    setExcludedPlayers([]);
    setIsSimulated(false);
    setWinners({});
    setWinStreaks({});
    setSitOutCount({});
  }, []);

  const getPlayersForSeeding = useCallback((): string[] => {
    const count = selectedPlayers.length >= 3 ? 3 : 2;
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }, [selectedPlayers]);

  /**
   * Starts the first round of the simulation.
   * Shuffles selected players and assigns them to courts.
   */
  const simulate = useCallback(
    (seeds: number[]) => {
      const rng = createSeededRng(seeds);
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
      excluded.forEach(p => { newSitOut[p] = 1; });
      setSitOutCount(newSitOut);
      setWinners({});
      setWinStreaks({});
      setIsSimulated(true);
    },
    [selectedPlayers, courtCount],
  );

  const resetSimulation = useCallback(() => {
    setCourts([]);
    setExcludedPlayers([]);
    setIsSimulated(false);
    setWinners({});
    setWinStreaks({});
    setSitOutCount({});
  }, []);

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
      });

      setCourts(nextCourts);
      setWinStreaks(nextWinStreaks);
      setWinners({});
      setExcludedPlayers(remainingChallengers);
      setSitOutCount(nextSitOutCount);
      setIsSimulated(true);
    },
    [courts, winners, winStreaks, selectedPlayers, courtCount, sitOutCount]
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
