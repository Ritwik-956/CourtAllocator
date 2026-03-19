import { CourtView } from '@/components/court-view';
import { useGame } from '@/context/game-context';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Phase = 'idle' | 'seeding' | 'result';

export default function CourtsScreen() {
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
  } = useGame();

  const [phase, setPhase] = useState<Phase>('idle');
  const [seedPlayers, setSeedPlayers] = useState<string[]>([]);
  const [seedValues, setSeedValues] = useState<Record<string, string>>({});
  const [isNextRound, setIsNextRound] = useState(false);

  const canSimulate = courtCount >= 1;
  const maxCourts = Math.floor(selectedPlayers.length / 4);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Courts</Text>
            <Text style={styles.subtitle}>
              Simulate random court allocations
            </Text>
          </View>

          {/* Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Selected Players</Text>
              <Text style={styles.statusValue}>{selectedPlayers.length}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Courts to Use</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={[
                    styles.countBtn,
                    courtCount <= 0 && styles.countBtnDisabled,
                  ]}
                  onPress={() => setCourtCount(Math.max(0, courtCount - 1))}
                  disabled={courtCount <= 0}
                >
                  <Text style={styles.countBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.countDisplay}>
                  <Text style={styles.statusValue}>{courtCount}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.countBtn,
                    courtCount >= maxCourts && styles.countBtnDisabled,
                  ]}
                  onPress={() =>
                    setCourtCount(Math.min(maxCourts, courtCount + 1))
                  }
                  disabled={courtCount >= maxCourts}
                >
                  <Text style={styles.countBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            {selectedPlayers.length - courtCount * 4 > 0 && courtCount >= 0 && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Will Sit Out</Text>
                <Text style={[styles.statusValue, { color: '#E9C46A' }]}>
                  {selectedPlayers.length - courtCount * 4}
                </Text>
              </View>
            )}
          </View>

          {/* Selected players list */}
          {selectedPlayers.length > 0 && (
            <View style={styles.selectedList}>
              <Text style={styles.sectionTitle}>Selected</Text>
              <View style={styles.chipRow}>
                {selectedPlayers.map(name => (
                  <View key={name} style={styles.chip}>
                    <Text style={styles.chipText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Phase: idle */}
          {phase === 'idle' && !canSimulate && (
            <View style={styles.messageBox}>
              <View style={styles.messageIconContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#E9C46A" />
              </View>
              <Text style={styles.messageTitle}>Not Ready Yet</Text>
              <Text style={styles.messageText}>
                Select at least 4 players from the Players tab to simulate
                courts.
              </Text>
            </View>
          )}

          {phase === 'idle' && canSimulate && (
            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={handleStartSimulation}
            >
              <Text style={styles.simulateBtnText}>Simulate Courts</Text>
            </TouchableOpacity>
          )}

          {/* Phase: seeding */}
          {phase === 'seeding' && (
            <View style={styles.seedingSection}>
              <Text style={styles.seedingTitle}>Enter Random Numbers</Text>
              <Text style={styles.seedingSubtitle}>
                To increase randomness, ask these players to pick a number!
              </Text>

              {seedPlayers.map(player => (
                <View key={player} style={styles.seedRow}>
                  <Text style={styles.seedLabel}>{player}</Text>
                  <TextInput
                    style={styles.seedInput}
                    placeholder="1 – 999"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    value={seedValues[player] || ''}
                    onChangeText={(text: string) =>
                      setSeedValues(prev => ({ ...prev, [player]: text }))
                    }
                    maxLength={4}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[styles.goBtn, !allSeedsFilled && styles.goBtnDisabled]}
                onPress={handleRunSimulation}
                disabled={!allSeedsFilled}
              >
                <Text style={styles.goBtnText}>Shuffle & Allocate!</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Phase: result */}
          {phase === 'result' && (
            <View style={styles.resultSection}>
              {courts.map(court => (
                <CourtView key={court.id} court={court} />
              ))}

              {excludedPlayers.length > 0 && (
                <View style={styles.excludedBox}>
                  <Text style={styles.excludedTitle}>
                    Sitting Out This Round
                  </Text>
                  <View style={styles.chipRow}>
                    {excludedPlayers.map(name => (
                      <View key={name} style={styles.excludedChip}>
                        <Text style={styles.excludedChipText}>{name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.nextRoundBtn, !allWinnersSelected && styles.nextRoundBtnDisabled]}
                  onPress={handleStartNextRound}
                  disabled={!allWinnersSelected}
                >
                  <Text style={styles.nextRoundBtnText}>Simulate Next Round</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reshuffleBtnHalf}
                  onPress={handleStartSimulation}
                >
                  <Text style={styles.reshuffleBtnText}>Re-Shuffle All</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#0F1A2E',
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
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  statusCard: {
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countBtnDisabled: {
    opacity: 0.3,
  },
  countBtnText: {
    color: '#fff',
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
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: 'rgba(42,157,143,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(42,157,143,0.4)',
  },
  chipText: {
    color: '#2A9D8F',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBox: {
    margin: 20,
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(233,196,106,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.15)',
    borderStyle: 'dashed',
  },
  messageIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(233,196,106,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  messageIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  messageTitle: {
    color: '#E9C46A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  messageText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 240,
  },
  simulateBtn: {
    marginHorizontal: 20,
    backgroundColor: '#E9C46A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  simulateBtnText: {
    color: '#0F1A2E',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seedingSection: {
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  seedingTitle: {
    color: '#E9C46A',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  seedingSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  seedLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  seedInput: {
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  goBtn: {
    backgroundColor: '#2A9D8F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  goBtnDisabled: {
    opacity: 0.4,
  },
  goBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  excludedBox: {
    backgroundColor: 'rgba(233,196,106,0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.2)',
  },
  excludedTitle: {
    color: '#E9C46A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  excludedChip: {
    backgroundColor: 'rgba(233,196,106,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.3)',
  },
  excludedChipText: {
    color: '#E9C46A',
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
    backgroundColor: '#2A9D8F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextRoundBtnDisabled: {
    opacity: 0.4,
  },
  nextRoundBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  reshuffleBtnHalf: {
    flex: 1,
    backgroundColor: '#E9C46A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reshuffleBtnText: {
    color: '#0F1A2E',
    fontSize: 15,
    fontWeight: '800',
  },
  resetBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  resetBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
});
