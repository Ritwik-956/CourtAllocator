import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useGame, Sport } from '@/context/game-context';
import { CustomAlert, AlertButton } from '@/components/custom-alert';
import { useThemeColor } from '@/hooks/use-theme-color';

const SPORTS: { key: Sport; label: string; icon: string }[] = [
  { key: 'pickleball', label: 'Pickleball', icon: 'table-tennis' },
  { key: 'volleyball', label: 'Volleyball', icon: 'volleyball' },
];

export default function PlayersScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const numColumns = width > 1024 ? 3 : width > 600 ? 2 : 1;
  const theme = useThemeColor();

  const { namePool, selectedPlayers, addToPool, removeFromPool, toggleSelect, selectedSport, setSelectedSport, minPlayersPerCourt } = useGame();
  const [newName, setNewName] = useState('');
  
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default', onPress: closeAlert }]
    });
  };

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));


  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const success = addToPool(trimmed);
    if (success) {
      setNewName('');
    } else {
      showAlert('Duplicate', `"${trimmed.toUpperCase()}" is already in the pool.`);
    }
  };

  const handleDelete = (name: string) => {
    showAlert('Remove Player', `Remove "${name}" from the pool?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromPool(name) },
    ]);
  };

  const isSelected = (name: string) => selectedPlayers.includes(name);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>FairCourt</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage your player pool</Text>
        </View>

        {/* Sport Selection */}
        <View style={styles.sportSection}>
          {SPORTS.map((sport) => {
            const isActive = selectedSport === sport.key;
            return (
              <TouchableOpacity
                key={sport.key}
                activeOpacity={0.7}
                onPress={() => setSelectedSport(sport.key)}
                style={[
                  styles.sportButton,
                  {
                    backgroundColor: isActive ? `${theme.primary}18` : theme.card,
                    borderColor: isActive ? theme.primary : theme.cardBorder,
                  },
                ]}
              >
                <View style={[
                  styles.sportIconWrap,
                  { backgroundColor: isActive ? theme.primary : theme.overlayLow },
                ]}>
                  <MaterialCommunityIcons
                    name={sport.icon as any}
                    size={18}
                    color={isActive ? '#fff' : theme.textSecondary}
                  />
                </View>
                <Text style={[
                  styles.sportLabel,
                  { color: isActive ? theme.primary : theme.textSecondary },
                ]}>
                  {sport.label}
                </Text>
                {isActive && (
                  <View style={[styles.sportCheck, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Player Input */}
        <View style={styles.addSection}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.inputBorder,
              color: theme.text
            }]}
            placeholder="Enter player name..."
            placeholderTextColor={theme.textSecondary}
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
            autoCapitalize="characters"
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addButton, !newName.trim() && styles.addButtonDisabled, { backgroundColor: theme.primary }]}
            onPress={handleAdd}
            disabled={!newName.trim()}>
            <Text style={[styles.addButtonText, { color: '#fff' }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Selection Counter */}
        <View style={styles.counterRow}>
          <Text style={[styles.counterText, { color: theme.textSecondary }]}>
            Pool: {namePool.length} players
          </Text>
          <View style={[styles.selectedBadge, { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}40` }]}>
            <Text style={[styles.selectedBadgeText, { color: theme.primary }]}>
              {selectedPlayers.length} selected
            </Text>
          </View>
        </View>

        {/* Name Pool List */}
        <FlatList
          key={`list-${numColumns}`}
          data={namePool}
          numColumns={numColumns}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          renderItem={({ item }) => {
            const selected = isSelected(item);
            return (
              <View style={[
                styles.playerCard, 
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
                selected && { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}50` }
              ]}>
                <View style={styles.playerInfo}>
                  <View style={[
                    styles.avatar, 
                    { backgroundColor: theme.overlayLow },
                    selected && { backgroundColor: theme.primary }
                  ]}>
                    <Text style={[styles.avatarText, { color: selected ? '#fff' : theme.text }]}>{item[0]}</Text>
                  </View>
                  <Text style={[
                    styles.playerName, 
                    { color: theme.text },
                    selected && { color: theme.primary }
                  ]}>
                    {item}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.selectBtn, 
                      { backgroundColor: `${theme.primary}20`, borderColor: `${theme.primary}40` },
                      selected && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => toggleSelect(item)}>
                    <Text style={[styles.selectBtnText, { color: selected ? '#fff' : theme.primary }]}>{selected ? '✓' : '+'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: `${theme.danger}15`, borderColor: `${theme.danger}30` }]}
                    onPress={() => handleDelete(item)}>
                    <Text style={[styles.deleteBtnText, { color: theme.danger }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No players in the pool yet.</Text>
              <Text style={[styles.emptySubtext, { color: `${theme.text}40` }]}>Add players above to get started!</Text>
            </View>
          }
          ListFooterComponent={
            <View style={[styles.instructionContainer, { borderTopColor: theme.cardBorder }]}>
              <Text style={[styles.instructionTitle, { color: theme.textSecondary }]}>How It Works</Text>
              <View style={[styles.instructionList, isTablet && styles.instructionListTablet]}>
                <Text style={[styles.instructionText, isTablet && styles.instructionTextTablet, { color: theme.textSecondary }]}>• Select ≥4 players for courts; extras sit out.</Text>
                <Text style={[styles.instructionText, isTablet && styles.instructionTextTablet, { color: theme.textSecondary }]}>• Players are randomly paired into teams.</Text>
                <Text style={[styles.instructionText, isTablet && styles.instructionTextTablet, { color: theme.textSecondary }]}>• Winning teams stay together (split after 3 wins).</Text>
                <Text style={[styles.instructionText, isTablet && styles.instructionTextTablet, { color: theme.textSecondary }]}>• Players sitting out get priority next round.</Text>
                <Text style={[styles.instructionText, isTablet && styles.instructionTextTablet, { color: theme.textSecondary }]}>• Winners play winners or top challengers.</Text>
              </View>
            </View>
          }
        />

        {/* Bottom hint */}
        {selectedPlayers.length > 0 && selectedPlayers.length < minPlayersPerCourt && (
          <View style={[styles.hint, { backgroundColor: `${theme.accent}15`, borderTopColor: `${theme.accent}30` }]}>
            <Ionicons name="information-circle" size={20} color={theme.accent} style={styles.hintIcon} />
            <Text style={[styles.hintText, { color: theme.accent }]}>
              Select {minPlayersPerCourt - selectedPlayers.length} more player{minPlayersPerCourt - selectedPlayers.length !== 1 ? 's' : ''} to simulate a court
            </Text>
          </View>
        )}
        {selectedPlayers.length >= minPlayersPerCourt && (
          <View style={[styles.readyHint, { backgroundColor: `${theme.success}15`, borderTopColor: `${theme.success}30` }]}>
            <Ionicons name="checkmark-circle" size={20} color={theme.success} style={styles.hintIcon} />
            <Text style={[styles.readyHintText, { color: theme.success }]}>
              Ready! Go to the Courts tab to simulate
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
      </View>
      <CustomAlert {...alertConfig} onClose={closeAlert} />
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
  tabletWrapper: {
    maxWidth: 1000,
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
  sportSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  sportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  sportIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sportCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  addSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  addButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  columnWrapper: {
    gap: 8,
  },
  playerCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  playerName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  selectBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  instructionContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  instructionList: {
    gap: 6,
  },
  instructionListTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  instructionTextTablet: {
    width: '48%',
  },
  hint: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    gap: 8,
  },
  hintIcon: {
    marginRight: 4,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  readyHint: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    gap: 8,
  },
  readyHintText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
