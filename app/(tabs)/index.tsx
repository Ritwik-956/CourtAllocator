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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '@/context/game-context';

export default function PlayersScreen() {
  const { namePool, selectedPlayers, addToPool, removeFromPool, toggleSelect } = useGame();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const success = addToPool(trimmed);
    if (success) {
      setNewName('');
    } else {
      Alert.alert('Duplicate', `"${trimmed.toUpperCase()}" is already in the pool.`);
    }
  };

  const handleDelete = (name: string) => {
    Alert.alert('Remove Player', `Remove "${name}" from the pool?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromPool(name) },
    ]);
  };

  const isSelected = (name: string) => selectedPlayers.includes(name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Court Allocator</Text>
          <Text style={styles.subtitle}>Manage your player pool</Text>
        </View>

        {/* Add Player Input */}
        <View style={styles.addSection}>
          <TextInput
            style={styles.input}
            placeholder="Enter player name..."
            placeholderTextColor="#999"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
            autoCapitalize="characters"
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addButton, !newName.trim() && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={!newName.trim()}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Selection Counter */}
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            Pool: {namePool.length} players
          </Text>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>
              {selectedPlayers.length} selected
            </Text>
          </View>
        </View>

        {/* Name Pool List */}
        <FlatList
          data={namePool}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const selected = isSelected(item);
            return (
              <View style={[styles.playerCard, selected && styles.playerCardSelected]}>
                <View style={styles.playerInfo}>
                  <View style={[styles.avatar, selected && styles.avatarSelected]}>
                    <Text style={styles.avatarText}>{item[0]}</Text>
                  </View>
                  <Text style={[styles.playerName, selected && styles.playerNameSelected]}>
                    {item}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.selectBtn, selected && styles.deselectBtn]}
                    onPress={() => toggleSelect(item)}>
                    <Text style={styles.selectBtnText}>{selected ? '✓' : '+'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No players in the pool yet.</Text>
              <Text style={styles.emptySubtext}>Add players above to get started!</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionTitle}>How It Works</Text>
              <View style={styles.instructionList}>
                <Text style={styles.instructionText}>• Select ≥4 players for courts; extras sit out.</Text>
                <Text style={styles.instructionText}>• Players are randomly paired into teams.</Text>
                <Text style={styles.instructionText}>• Winning teams stay together (split after 3 wins).</Text>
                <Text style={styles.instructionText}>• Players sitting out get priority next round.</Text>
                <Text style={styles.instructionText}>• Winners play winners or top challengers.</Text>
              </View>
            </View>
          }
        />

        {/* Bottom hint */}
        {selectedPlayers.length > 0 && selectedPlayers.length < 4 && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              Select {4 - selectedPlayers.length} more player{4 - selectedPlayers.length !== 1 ? 's' : ''} to simulate a court
            </Text>
          </View>
        )}
        {selectedPlayers.length >= 4 && (
          <View style={styles.readyHint}>
            <Text style={styles.readyHintText}>
              Ready! Go to the Courts tab to simulate
            </Text>
          </View>
        )}
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
  addSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  addButton: {
    backgroundColor: '#2A9D8F',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    color: '#fff',
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
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedBadge: {
    backgroundColor: 'rgba(42,157,143,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(42,157,143,0.4)',
  },
  selectedBadgeText: {
    color: '#2A9D8F',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  playerCardSelected: {
    backgroundColor: 'rgba(42,157,143,0.12)',
    borderColor: 'rgba(42,157,143,0.3)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSelected: {
    backgroundColor: '#2A9D8F',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  playerName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  playerNameSelected: {
    color: '#2A9D8F',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(42,157,143,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(42,157,143,0.4)',
  },
  deselectBtn: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  selectBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(230,57,70,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.3)',
  },
  deleteBtnText: {
    color: '#E63946',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 14,
    marginTop: 4,
  },
  instructionContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  instructionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  instructionList: {
    gap: 6,
  },
  instructionText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    lineHeight: 18,
  },
  hint: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(233,196,106,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(233,196,106,0.2)',
  },
  hintText: {
    color: '#E9C46A',
    fontSize: 14,
    fontWeight: '600',
  },
  readyHint: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(42,157,143,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(42,157,143,0.2)',
  },
  readyHintText: {
    color: '#2A9D8F',
    fontSize: 14,
    fontWeight: '600',
  },
});
