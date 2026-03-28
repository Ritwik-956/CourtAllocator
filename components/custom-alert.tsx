import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface AlertButton {
  text: string;
  style?: 'cancel' | 'destructive' | 'default';
  onPress?: () => void;
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onClose: () => void;
}

export function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onClose,
}: CustomAlertProps) {
  const theme = useThemeColor();
  if (!visible) return null;

  // Manual dark/light override for the card background to be more specific than theme.card
  const cardBg = theme.background === '#0F1A2E' ? '#162440' : '#FFFFFF';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.alertBox, { backgroundColor: cardBg, borderColor: theme.cardBorder }]}>
              <View style={[styles.iconContainer, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}>
                <Text style={[styles.iconText, { color: theme.accent }]}>
                  {buttons.some(b => b.style === 'destructive') ? '!' : 'i'}
                </Text>
              </View>
              
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
              
              <View style={styles.buttonContainer}>
                {buttons.map((btn, index) => {
                  const isDestructive = btn.style === 'destructive';
                  const isCancel = btn.style === 'cancel';
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        isDestructive ? { backgroundColor: `${theme.danger}15`, borderWidth: 1, borderColor: `${theme.danger}30` } : 
                        isCancel ? { backgroundColor: theme.overlayLow } : { backgroundColor: theme.primary },
                        buttons.length === 2 && styles.buttonHalf
                      ]}
                      onPress={() => {
                        onClose();
                        if (btn.onPress) {
                           // small delay to allow modal to close before executing action
                           setTimeout(btn.onPress, 100);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isDestructive ? { color: theme.danger } :
                          isCancel ? { color: theme.text } : { color: '#fff' }
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  iconText: {
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
