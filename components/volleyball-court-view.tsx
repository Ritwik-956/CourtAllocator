import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useGame, type Court } from '@/context/game-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const COURT_ORANGE = '#FCA311';
const PADDING_BLUE = '#00509D';
const LINE_WHITE = '#FFFFFF';
const TEAM_A_COLOR = '#E76F51';
const TEAM_B_COLOR = '#264653';

// Formations for 4, 5, 6 players per team side
// 'top' here is defined as distance from the NET.
const SIDE_FORMATIONS: Record<number, { left: string; top: string }[]> = {
  4: [
    { left: '25%', top: '25%' }, { left: '75%', top: '25%' }, // Front row
    { left: '25%', top: '70%' }, { left: '75%', top: '70%' }, // Back row
  ],
  5: [
    { left: '18%', top: '25%' }, { left: '50%', top: '25%' }, { left: '82%', top: '25%' }, // Front row
    { left: '30%', top: '70%' }, { left: '70%', top: '70%' }, // Back row
  ],
  6: [
    { left: '22%', top: '25%' }, { left: '50%', top: '25%' }, { left: '78%', top: '25%' }, // Front row
    { left: '22%', top: '70%' }, { left: '50%', top: '70%' }, { left: '78%', top: '70%' }, // Back row
  ]
};

// LANDSCAPE formations: 'left' here is defined as distance from the NET.
const LANDSCAPE_SIDE_FORMATIONS: Record<number, { left: string; top: string }[]> = {
  4: [
    { left: '28%', top: '25%' }, { left: '28%', top: '75%' }, // Front row
    { left: '72%', top: '25%' }, { left: '72%', top: '75%' }, // Back row
  ],
  5: [
    { left: '28%', top: '20%' }, { left: '28%', top: '50%' }, { left: '28%', top: '80%' }, // Front row
    { left: '72%', top: '30%' }, { left: '72%', top: '70%' }, // Back row
  ],
  6: [
    { left: '28%', top: '22%' }, { left: '28%', top: '50%' }, { left: '28%', top: '78%' }, // Front row
    { left: '72%', top: '22%' }, { left: '72%', top: '50%' }, { left: '72%', top: '78%' }, // Back row
  ]
};

export function VolleyballCourtView({ court }: { court: Court }) {
  const { winners, setWinner } = useGame();
  const winner = winners[court.id];
  const theme = useThemeColor();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const renderTeamSide = (players: string[], color: string, isSideA: boolean) => {
    const count = players.length;
    let formationTemplate = isLandscape 
      ? LANDSCAPE_SIDE_FORMATIONS[count] || LANDSCAPE_SIDE_FORMATIONS[6]
      : SIDE_FORMATIONS[count] || SIDE_FORMATIONS[6];

    return (
      <View style={[
        styles.teamSide, 
        isLandscape ? styles.landscapeSide : (isSideA ? styles.topSide : styles.bottomSide)
      ]}>
        {/* Attack Line (3m line) */}
        {!isLandscape ? (
            <View style={[styles.attackLine, isSideA ? { bottom: '33.3%' } : { top: '33.3%' }]} />
        ) : (
            <View style={[styles.attackLineVer, isSideA ? { right: '33.3%' } : { left: '33.3%' }]} />
        )}
        
        {players.map((player, index) => {
          let pos = formationTemplate[index] || { left: '50%', top: '50%' };
          
          let dynamicStyle: any = {};
          
          if (!isLandscape) {
              // Portrait: distance from NET
              dynamicStyle.left = pos.left;
              if (isSideA) {
                  // Net is at bottom of Side A container
                  dynamicStyle.bottom = pos.top;
              } else {
                  // Net is at top of Side B container
                  dynamicStyle.top = pos.top;
              }
          } else {
              // Landscape: distance from NET
              dynamicStyle.top = pos.top;
              if (isSideA) {
                  // Net is at right of Side A container
                  dynamicStyle.right = pos.left;
              } else {
                  // Net is at left of Side B container
                  dynamicStyle.left = pos.left;
              }
          }

          return (
            <View 
              key={index} 
              style={[
                styles.playerBadge, 
                dynamicStyle,
                { backgroundColor: color }
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
      <View style={[styles.outerCourt, isLandscape && styles.outerCourtLandscape]}>
        {/* Inner Court (Orange) */}
        <View style={[styles.innerCourt, isLandscape && styles.innerCourtLandscape]}>
          {renderTeamSide(court.team1, TEAM_A_COLOR, true)}
          
          {/* Net Line */}
          <View style={[styles.netLineContainer, isLandscape && styles.netLineContainerLandscape]}>
             <View style={[isLandscape ? styles.netVerLine : styles.netHorizLine]} />
             <Text style={[styles.netText, isLandscape && styles.netTextLandscape]}>
                {isLandscape ? 'N\nE\nT' : '--- NET ---'}
             </Text>
             <View style={[isLandscape ? styles.netVerLine : styles.netHorizLine]} />
             
             {!isLandscape ? (
                 <>
                    <View style={styles.netPoleTop} />
                    <View style={styles.netPoleBottom} />
                 </>
             ) : (
                 <>
                    <View style={styles.netPoleLeft} />
                    <View style={styles.netPoleRight} />
                 </>
             )}
          </View>

          {renderTeamSide(court.team2, TEAM_B_COLOR, false)}
        </View>
      </View>

      {/* Team labels and winner selection */}
      <View style={[styles.teamLabels, isLandscape && styles.teamLabelsLandscape]}>
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
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  outerCourtLandscape: {
    aspectRatio: 2.0,
    width: '100%',
    maxWidth: '100%',
  },
  innerCourt: {
    width: '100%',
    height: '100%',
    backgroundColor: COURT_ORANGE,
    borderWidth: 2,
    borderColor: LINE_WHITE,
    position: 'relative',
    flexDirection: 'column',
  },
  innerCourtLandscape: {
    flexDirection: 'row',
  },
  teamSide: {
    flex: 1,
    position: 'relative',
  },
  landscapeSide: {
    flexDirection: 'row',
  },
  attackLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: LINE_WHITE,
    opacity: 0.8,
  },
  attackLineVer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
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
  netLineContainerLandscape: {
    height: '100%',
    width: 24,
    flexDirection: 'column',
  },
  netHorizLine: {
    width: '100%',
    height: 1,
    backgroundColor: LINE_WHITE,
    opacity: 0.5,
  },
  netVerLine: {
    height: '100%',
    width: 1,
    backgroundColor: LINE_WHITE,
    opacity: 0.5,
  },
  netText: {
    color: LINE_WHITE,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  netTextLandscape: {
    fontSize: 8,
    letterSpacing: 1,
    lineHeight: 12,
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
  netPoleLeft: {
    position: 'absolute',
    top: -14,
    left: 7,
    width: 10,
    height: 6,
    backgroundColor: LINE_WHITE,
    borderRadius: 3,
  },
  netPoleRight: {
    position: 'absolute',
    bottom: -14,
    left: 7,
    width: 10,
    height: 6,
    backgroundColor: LINE_WHITE,
    borderRadius: 3,
  },
  playerBadge: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 80,
    maxWidth: 100, // Added to ensure gap between players
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -40 }, { translateY: -12 }], // Center based on minWidth/approximate height
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
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  teamLabels: {
    marginTop: 20,
    width: '100%',
    maxWidth: 380,
    gap: 12,
    paddingHorizontal: 16,
  },
  teamLabelsLandscape: {
    maxWidth: '100%',
    flexDirection: 'row',
    paddingHorizontal: 0,
  },
  teamLabelRow: {
    flex: 1,
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
