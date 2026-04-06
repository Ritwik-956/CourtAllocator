import { CourtView } from '@/components/court-view';
import { VolleyballCourtView } from '@/components/volleyball-court-view';
import { useGame, MAX_PLAYERS_PER_COURT } from '@/context/game-context';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/use-theme-color';

type Phase = 'idle' | 'seeding' | 'result';

export default function CourtsScreen() {
  const theme = useThemeColor();
  const {
    selectedPlayers,
    courts,
    excludedPlayers,
    isSimulated,
    courtCount,
    setCourtCount,
    simulate,
    simulateNextRound,
    winners,
    resetSimulation,
    getPlayersForSeeding,
    minPlayersPerCourt,
    selectedSport,
  } = useGame();

  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const isTablet = width > 600;

  const [phase, setPhase] = useState<Phase>('idle');
  const [seedPlayers, setSeedPlayers] = useState<string[]>([]);
  const [seedValues, setSeedValues] = useState<Record<string, string>>({});
  const [isNextRound, setIsNextRound] = useState(false);

  const canSimulate = courtCount >= 1;
  const maxCourts = Math.floor(selectedPlayers.length / minPlayersPerCourt);
  const allWinnersSelected = courts.length > 0 && courts.every(c => winners[c.id] !== undefined);

  useEffect(() => {
    if (!isSimulated) {
      setPhase('idle');
    }
  }, [isSimulated]);

  const handleStartSimulation = () => {
    const players = getPlayersForSeeding();
    setSeedPlayers(players);
    setSeedValues({});
    setIsNextRound(false);
    setPhase('seeding');
  };

  const handleStartNextRound = () => {
    const players = getPlayersForSeeding();
    setSeedPlayers(players);
    setSeedValues({});
    setIsNextRound(true);
    setPhase('seeding');
  };

  const handleRunSimulation = () => {
    const seeds = seedPlayers.map(p => {
      const val = parseInt(seedValues[p] || '0', 10);
      return isNaN(val) ? 0 : val;
    });
    if (isNextRound) {
      simulateNextRound(seeds);
    } else {
      simulate(seeds);
    }
    setPhase('result');
    setIsNextRound(false);
  };

  const handleReset = () => {
    resetSimulation();
    setIsNextRound(false);
    setPhase('idle');
  };

  const allSeedsFilled = seedPlayers.every(
    p => seedValues[p] && seedValues[p].trim() !== '',
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.mainWrapper, isWide && styles.wideWrapper]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Courts</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Simulate random court allocations
            </Text>
          </View>

          {/* Status */}
          <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Selected Players</Text>
              <Text style={[styles.statusValue, { color: theme.text }]}>{selectedPlayers.length}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Courts to Use</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={[
                    styles.countBtn,
                    { backgroundColor: theme.overlayLow, borderColor: theme.overlayHigh },
                    courtCount <= 0 && styles.countBtnDisabled,
                  ]}
                  onPress={() => setCourtCount(Math.max(0, courtCount - 1))}
                  disabled={courtCount <= 0}
                >
                  <Text style={[styles.countBtnText, { color: theme.text }]}>−</Text>
                </TouchableOpacity>
                <View style={styles.countDisplay}>
                  <Text style={[styles.statusValue, { color: theme.text }]}>{courtCount}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.countBtn,
                    { backgroundColor: theme.overlayLow, borderColor: theme.overlayHigh },
                    courtCount >= maxCourts && styles.countBtnDisabled,
                  ]}
                  onPress={() =>
                    setCourtCount(Math.min(maxCourts, courtCount + 1))
                  }
                  disabled={courtCount >= maxCourts}
                >
                  <Text style={[styles.countBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {courtCount >= 1 && (
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Will Sit Out</Text>
                <Text style={[styles.statusValue, { color: theme.accent }]}>
                  {Math.max(0, selectedPlayers.length - courtCount * MAX_PLAYERS_PER_COURT[selectedSport])}
                </Text>
              </View>
            )}
          </View>

          {/* Selected players list */}
          {selectedPlayers.length > 0 && (
            <View style={styles.selectedList}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Selected</Text>
              <View style={styles.chipRow}>
                {selectedPlayers.map(name => (
                  <View key={name} style={[styles.chip, { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}40` }]}>
                    <Text style={[styles.chipText, { color: theme.primary }]}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Phase: idle */}
          {phase === 'idle' && !canSimulate && (
            <View style={[styles.messageBox, { backgroundColor: `${theme.accent}05`, borderColor: `${theme.accent}20` }]}>
              <View style={[styles.messageIconContainer, { backgroundColor: `${theme.accent}15` }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.accent} />
              </View>
              <Text style={[styles.messageTitle, { color: theme.accent }]}>Not Ready Yet</Text>
              <Text style={[styles.messageText, { color: theme.textSecondary }]}>
                Select at least {minPlayersPerCourt} players from the Players tab to simulate
                courts.
              </Text>
            </View>
          )}

          {phase === 'idle' && canSimulate && (
            <TouchableOpacity
              style={[styles.simulateBtn, { backgroundColor: theme.primary }]}
              onPress={handleStartSimulation}
            >
              <Text style={[styles.simulateBtnText, { color: '#fff' }]}>Simulate Courts</Text>
            </TouchableOpacity>
          )}

          {/* Phase: seeding */}
          {phase === 'seeding' && (
            <View style={[styles.seedingSection, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.seedingTitle, { color: theme.accent }]}>Enter Random Numbers</Text>
              <Text style={[styles.seedingSubtitle, { color: theme.textSecondary }]}>
                To increase randomness, ask these players to pick a number!
              </Text>

              <View style={isTablet && styles.seedingGrid}>
              {seedPlayers.map(player => (
                <View key={player} style={[styles.seedRow, isTablet && styles.seedRowGrid]}>
                  <Text style={[styles.seedLabel, { color: theme.text }]} numberOfLines={1}>{player}</Text>
                  <TextInput
                    style={[styles.seedInput, { 
                      backgroundColor: theme.inputBackground, 
                      borderColor: theme.inputBorder,
                      color: theme.text
                    }]}
                    placeholder="1–999"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    value={seedValues[player] || ''}
                    onChangeText={(text: string) =>
                      setSeedValues(prev => ({ ...prev, [player]: text }))
                    }
                    maxLength={4}
                  />
                </View>
              ))}
              </View>

              <TouchableOpacity
                style={[styles.goBtn, !allSeedsFilled && styles.goBtnDisabled, { backgroundColor: theme.primary }]}
                onPress={handleRunSimulation}
                disabled={!allSeedsFilled}
              >
                <Text style={[styles.goBtnText, { color: '#fff' }]}>Shuffle & Allocate!</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Phase: result */}
          {phase === 'result' && (
            <View style={styles.resultSection}>
              <View style={(isTablet && selectedSport !== 'volleyball') && styles.courtGrid}>
                {courts.map(court => (
                  <View key={court.id} style={(isTablet && selectedSport !== 'volleyball') && styles.courtItem}>
                    {selectedSport === 'volleyball' ? (
                      <VolleyballCourtView court={court} />
                    ) : (
                      <CourtView court={court} />
                    )}
                  </View>
                ))}
              </View>

              {excludedPlayers.length > 0 && (
                <View style={[styles.excludedBox, { backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}20` }]}>
                  <Text style={[styles.excludedTitle, { color: theme.accent }]}>
                    Sitting Out This Round
                  </Text>
                  <View style={styles.chipRow}>
                    {excludedPlayers.map(name => (
                      <View key={name} style={[styles.excludedChip, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}>
                        <Text style={[styles.excludedChipText, { color: theme.accent }]}>{name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.nextRoundBtn, !allWinnersSelected && styles.nextRoundBtnDisabled, { backgroundColor: theme.primary }]}
                  onPress={handleStartNextRound}
                  disabled={!allWinnersSelected}
                >
                  <Text style={[styles.nextRoundBtnText, { color: '#fff' }]}>Simulate Next Round</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reshuffleBtnHalf, { backgroundColor: theme.accent }]}
                  onPress={handleStartSimulation}
                >
                  <Text style={[styles.reshuffleBtnText, { color: '#fff' }]}>Re-Shuffle All</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.resetBtn, { backgroundColor: theme.overlayLow, borderColor: theme.overlayHigh }]} onPress={handleReset}>
                <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
  },
  wideWrapper: {
    maxWidth: 1000,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statusCard: {
    margin: 20,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  countBtnDisabled: {
    opacity: 0.3,
  },
  countBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  countDisplay: {
    minWidth: 24,
    alignItems: 'center',
  },
  selectedList: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageBox: {
    margin: 20,
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  messageIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 240,
  },
  simulateBtn: {
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  simulateBtnText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seedingSection: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  seedingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  seedingSubtitle: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  seedingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  seedRowGrid: {
    width: '48%',
    marginBottom: 8,
  },
  seedLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  seedInput: {
    width: 100,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
  },
  goBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  goBtnDisabled: {
    opacity: 0.4,
  },
  goBtnText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  courtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  courtItem: {
    width: '48%',
    marginBottom: 10,
  },
  excludedBox: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  excludedTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  excludedChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  excludedChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  nextRoundBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextRoundBtnDisabled: {
    opacity: 0.4,
  },
  nextRoundBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  reshuffleBtnHalf: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reshuffleBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  resetBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
