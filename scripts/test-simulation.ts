import assert from 'assert';
import { computeNextRoundState, Court } from '../context/game-context';

console.log('--- Running FairCourt Simulation Tests ---');

// Setup generic valid RNG seed
const seeds = [12345];

function test3WinSplit() {
  console.log('Test 1: 3-Win Streak Split Rule');

  // Set up 1 active court with winners "GAURI" and "SAIKANTH"
  const courts: Court[] = [
    { id: 1, team1: ['GAURI', 'SAIKANTH'], team2: ['MONIT', 'PRACHEE'] },
  ];

  const winners = { 1: 1 as const }; // Team 1 won

  // They both have 2 wins already, so this win makes it 3.
  const winStreaks = { GAURI: 2, SAIKANTH: 2, MONIT: 0, PRACHEE: 0 };

  // Players in the pool
  const selectedPlayers = [
    'GAURI',
    'SAIKANTH',
    'MONIT',
    'PRACHEE',
    'RITWIK',
    'ANNA',
    'JOHN',
    'DOE',
  ];
  const sitOutCount = {}; // No one has priority over anyone else for sitting out
  const courtCount = 2; // Needs 8 players

  const { nextCourts, nextWinStreaks, remainingChallengers } =
    computeNextRoundState({
      seeds,
      courts,
      winners,
      winStreaks,
      selectedPlayers,
      courtCount,
      sitOutCount,
      sport: 'pickleball' as const,
    });

  // Verify that their streak reset to 0
  assert(nextWinStreaks['GAURI'] === 0, 'GAURI streak should reset');
  assert(nextWinStreaks['SAIKANTH'] === 0, 'SAIKANTH streak should reset');

  // Verify that they are NOT in the same team
  let areTheyPaired = false;
  for (const court of nextCourts) {
    const isPairedT1 =
      court.team1.includes('GAURI') && court.team1.includes('SAIKANTH');
    const isPairedT2 =
      court.team2.includes('GAURI') && court.team2.includes('SAIKANTH');
    if (isPairedT1 || isPairedT2) {
      areTheyPaired = true;
    }
  }

  assert(
    !areTheyPaired,
    'GAURI and SAIKANTH should be split up because of their 3-win streak',
  );
  console.log(
    '✅ Passed: 3-Win players are successfully split up and not paired together',
  );
}

function testStarvationPrevention() {
  console.log('\nTest 2: Starvation Prevention Policy');

  const courts: Court[] = [
    { id: 1, team1: ['PLAYER_A', 'PLAYER_B'], team2: ['PLAYER_C', 'PLAYER_D'] },
  ];
  const winners = { 1: 1 as const };
  const winStreaks = { PLAYER_A: 1, PLAYER_B: 1 };

  // 6 players total, meaning 2 sit out every round since there's 1 court.
  const selectedPlayers = [
    'PLAYER_A',
    'PLAYER_B',
    'PLAYER_C',
    'PLAYER_D',
    'STARVED_1',
    'STARVED_2',
  ];

  // STARVED players have high sit out counts
  const sitOutCount = { STARVED_1: 4, STARVED_2: 3, PLAYER_C: 0, PLAYER_D: 0 };
  const courtCount = 1; // Needs 4 players total (2 winners + 2 challengers)

  const { remainingChallengers } = computeNextRoundState({
    seeds,
    courts,
    winners,
    winStreaks,
    selectedPlayers,
    courtCount,
    sitOutCount,
    sport: 'pickleball' as const,
  });

  // Since courtCount=1, we only need 2 challengers to face the winners.
  // There are 4 available players. If starvation prevention works, the STARVED players play.
  // This means they should NOT be in the remainingChallengers (sitting out) list.

  assert(
    !remainingChallengers.includes('STARVED_1'),
    'STARVED_1 must be prioritized and should not sit out.',
  );
  assert(
    !remainingChallengers.includes('STARVED_2'),
    'STARVED_2 must be prioritized and should not sit out.',
  );

  console.log(
    '✅ Passed: Starvation mapping strictly prioritizes players with highest sit-out rate.',
  );
}

try {
  test3WinSplit();
  testStarvationPrevention();
  console.log('\nAll simulations executed successfully!');
} catch (e: any) {
  console.error('\n❌ Test failed:');
  console.error(e.message);
  process.exit(1);
}
