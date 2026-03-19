import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useGame, type Court } from '@/context/game-context';

const COURT_GREEN = '#2D6A4F';
const KITCHEN_GREEN = '#40916C';
const TEAM_A_COLOR = '#E76F51';
const TEAM_B_COLOR = '#264653';

export function CourtView({ court }: { court: Court }) {
  const { winners, setWinner } = useGame();
  const winner = winners[court.id];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.courtLabel}>Court {court.id}</Text>
      <View style={styles.court}>
        {/* Team A side */}
        <View style={styles.teamSide}>
          <View style={styles.backCourt}>
            <View style={[styles.playerBadge, { backgroundColor: TEAM_A_COLOR }]}>
              <Text style={styles.playerName}>{court.team1[0]}</Text>
            </View>
            <View style={[styles.playerBadge, { backgroundColor: TEAM_A_COLOR }]}>
              <Text style={styles.playerName}>{court.team1[1]}</Text>
            </View>
          </View>
          <View style={styles.kitchen}>
            <Text style={styles.zoneText}>NVZ</Text>
          </View>
        </View>

        {/* Net */}
        <View style={styles.net}>
          <View style={styles.netLine} />
          <Text style={styles.netText}>NET</Text>
          <View style={styles.netLine} />
        </View>

        {/* Team B side */}
        <View style={styles.teamSide}>
          <View style={styles.kitchen}>
            <Text style={styles.zoneText}>NVZ</Text>
          </View>
          <View style={styles.backCourt}>
            <View style={[styles.playerBadge, { backgroundColor: TEAM_B_COLOR }]}>
              <Text style={styles.playerName}>{court.team2[0]}</Text>
            </View>
            <View style={[styles.playerBadge, { backgroundColor: TEAM_B_COLOR }]}>
              <Text style={styles.playerName}>{court.team2[1]}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Team labels */}
      <View style={styles.teamLabels}>
        <View style={styles.teamLabelRow}>
          <View style={[styles.teamDot, { backgroundColor: TEAM_A_COLOR }]} />
          <Text style={styles.teamLabelText}>
            Team A: {court.team1[0]} & {court.team1[1]}
          </Text>
          {winner === 1 ? (
            <Text style={styles.winnerBadge}>👑 WINNER</Text>
          ) : (
            <TouchableOpacity style={styles.selectBtn} onPress={() => setWinner(court.id, 1)}>
              <Text style={styles.selectBtnText}>Select Winner</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.teamLabelRow}>
          <View style={[styles.teamDot, { backgroundColor: TEAM_B_COLOR }]} />
          <Text style={styles.teamLabelText}>
            Team B: {court.team2[0]} & {court.team2[1]}
          </Text>
          {winner === 2 ? (
            <Text style={styles.winnerBadge}>👑 WINNER</Text>
          ) : (
            <TouchableOpacity style={styles.selectBtn} onPress={() => setWinner(court.id, 2)}>
              <Text style={styles.selectBtnText}>Select Winner</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  courtLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 1,
  },
  court: {
    width: 300,
    backgroundColor: COURT_GREEN,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  teamSide: {
    // each team's half
  },
  backCourt: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  kitchen: {
    backgroundColor: KITCHEN_GREEN,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  zoneText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  net: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  netLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#fff',
  },
  netText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginHorizontal: 8,
    letterSpacing: 2,
  },
  playerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  playerName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  teamLabels: {
    marginTop: 10,
    gap: 4,
  },
  teamLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  teamLabelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  selectBtn: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  winnerBadge: {
    marginLeft: 'auto',
    color: '#0F1A2E',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: '#E9C46A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
