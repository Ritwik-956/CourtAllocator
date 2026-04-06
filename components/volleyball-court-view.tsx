import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useGame, type Court } from '@/context/game-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const COURT_ORANGE = '#FCA311';
const PADDING_BLUE = '#00509D';
const LINE_WHITE = '#FFFFFF';
const TEAM_A_COLOR = '#E76F51';
const TEAM_B_COLOR = '#264653';

// Formations for 4, 5, 6 players per team side
const SIDE_FORMATIONS: Record<number, { left: string; top: string }[]> = {
  4: [
    { left: '25%', top: '35%' }, { left: '75%', top: '35%' }, // Front row
    { left: '25%', top: '75%' }, { left: '75%', top: '75%' }, // Back row
  ],
  5: [
    { left: '20%', top: '35%' }, { left: '50%', top: '35%' }, { left: '80%', top: '35%' }, // Front row
    { left: '30%', top: '75%' }, { left: '70%', top: '75%' }, // Back row
  ],
  6: [
    { left: '23%', top: '35%' }, { left: '50%', top: '35%' }, { left: '77%', top: '35%' }, // Front row
    { left: '23%', top: '75%' }, { left: '50%', top: '75%' }, { left: '77%', top: '75%' }, // Back row
  ]
};

export function VolleyballCourtView({ court }: { court: Court }) {
  const { winners, setWinner } = useGame();
  const winner = winners[court.id];
  const theme = useThemeColor();

  const renderTeamSide = (players: string[], color: string, isTop: boolean) => {
    const count = players.length;
    const formation = SIDE_FORMATIONS[count as keyof typeof SIDE_FORMATIONS] || SIDE_FORMATIONS[6];
    
    return (
      <View style={[styles.teamSide, isTop ? styles.topSide : styles.bottomSide]}>
        {/* Attack Line (3m line) */}
        <View style={[styles.attackLine, isTop ? { bottom: '33.3%' } : { top: '33.3%' }]} />
        
        {players.map((player, index) => {
          const pos = formation[index] || { left: '50%', top: '50%' };
          // For the top side, we can just let it be top-down. 
          // For the bottom side, the "front row" is at the top of the side (near net).
          // Our formation top: 35% is near the top of the container.
          return (
            <View 
              key={index} 
              style={[
                styles.playerBadge, 
                { 
                  backgroundColor: color, 
                  left: pos.left as any, 
                  top: pos.top as any 
                }
              ]}
            >
              <Text style={styles.playerName} numberOfLines={1}>{player}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.courtLabel, { color: theme.text }]}>Volleyball Court {court.id}</Text>
      
      {/* Outer Padding (Blue) */}
      <View style={styles.outerCourt}>
        {/* Inner Court (Orange) */}
        <View style={styles.innerCourt}>
          {renderTeamSide(court.team1, TEAM_A_COLOR, true)}
          
          {/* Net Line */}
          <View style={styles.netLineContainer}>
             <View style={styles.netHorizontalLine} />
             <Text style={styles.netText}>--- NET ---</Text>
             <View style={styles.netHorizontalLine} />
             <View style={styles.netPoleTop} />
             <View style={styles.netPoleBottom} />
          </View>

          {renderTeamSide(court.team2, TEAM_B_COLOR, false)}
        </View>
      </View>

      {/* Team labels and winner selection */}
      <View style={styles.teamLabels}>
        <View style={styles.teamLabelRow}>
          <View style={[styles.teamDot, { backgroundColor: TEAM_A_COLOR }]} />
          <View style={styles.teamInfo}>
            <Text style={[styles.teamLabelText, { color: theme.textSecondary }]}>
              Team A ({court.team1.length} players)
            </Text>
            <Text style={[styles.playerListText, { color: theme.textSecondary }]}>
              {court.team1.join(', ')}
            </Text>
          </View>
          {winner === 1 ? (
             <Text style={styles.winnerBadge}>👑 WINNER</Text>
          ) : (
            <TouchableOpacity 
              style={[styles.selectBtn, { backgroundColor: theme.overlayLow, borderColor: theme.overlayHigh }]} 
              onPress={() => setWinner(court.id, 1)}
            >
              <Text style={[styles.selectBtnText, { color: theme.textSecondary }]}>Select</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.teamLabelRow}>
          <View style={[styles.teamDot, { backgroundColor: TEAM_B_COLOR }]} />
          <View style={styles.teamInfo}>
            <Text style={[styles.teamLabelText, { color: theme.textSecondary }]}>
              Team B ({court.team2.length} players)
            </Text>
            <Text style={[styles.playerListText, { color: theme.textSecondary }]}>
              {court.team2.join(', ')}
            </Text>
          </View>
          {winner === 2 ? (
            <Text style={styles.winnerBadge}>👑 WINNER</Text>
          ) : (
            <TouchableOpacity 
              style={[styles.selectBtn, { backgroundColor: theme.overlayLow, borderColor: theme.overlayHigh }]} 
              onPress={() => setWinner(court.id, 2)}
            >
              <Text style={[styles.selectBtnText, { color: theme.textSecondary }]}>Select</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  courtLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  outerCourt: {
    width: '100%',
    aspectRatio: 0.65,
    maxWidth: 380,
    backgroundColor: PADDING_BLUE,
    borderRadius: 8,
    padding: 12, // Mimics the blue border area in the image
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  innerCourt: {
    width: '100%',
    height: '100%',
    backgroundColor: COURT_ORANGE,
    borderWidth: 2,
    borderColor: LINE_WHITE,
    position: 'relative',
  },
  teamSide: {
    flex: 1,
    position: 'relative',
  },
  attackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: LINE_WHITE,
    opacity: 0.8,
  },
  topSide: {
    justifyContent: 'flex-start',
  },
  bottomSide: {
    justifyContent: 'flex-end',
  },
  netLineContainer: {
    height: 24,
    width: '100%',
    position: 'relative',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  netHorizontalLine: {
    width: '100%',
    height: 1,
    backgroundColor: LINE_WHITE,
    opacity: 0.5,
  },
  netText: {
    color: LINE_WHITE,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
  },
  netPoleTop: {
    position: 'absolute',
    top: 7,
    left: -14,
    width: 6,
    height: 10,
    backgroundColor: LINE_WHITE,
    borderRadius: 3,
  },
  netPoleBottom: {
    position: 'absolute',
    top: 7,
    right: -14,
    width: 6,
    height: 10,
    backgroundColor: LINE_WHITE,
    borderRadius: 3,
  },
  playerBadge: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -40 }, { translateY: -12 }],
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playerName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamLabels: {
    marginTop: 20,
    width: '100%',
    maxWidth: 380,
    gap: 12,
    paddingHorizontal: 16,
  },
  teamLabelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  teamDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  teamInfo: {
    flex: 1,
  },
  teamLabelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerListText: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  selectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  winnerBadge: {
    color: '#0F1A2E',
    fontSize: 11,
    fontWeight: '900',
    backgroundColor: '#E9C46A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
