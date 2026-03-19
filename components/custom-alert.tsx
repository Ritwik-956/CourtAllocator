import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

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
  if (!visible) return null;

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
            <View style={styles.alertBox}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>
                  {buttons.some(b => b.style === 'destructive') ? '!' : 'i'}
                </Text>
              </View>
              
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.buttonContainer}>
                {buttons.map((btn, index) => {
                  const isDestructive = btn.style === 'destructive';
                  const isCancel = btn.style === 'cancel';
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        isDestructive ? styles.buttonDestructive : 
                        isCancel ? styles.buttonCancel : styles.buttonDefault,
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
                          isDestructive ? styles.buttonTextDestructive :
                          isCancel ? styles.buttonTextCancel : styles.buttonTextDefault
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
    backgroundColor: '#162440',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(233,196,106,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.3)',
  },
  iconText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E9C46A',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
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
  buttonDefault: {
    backgroundColor: '#2A9D8F',
  },
  buttonDestructive: {
    backgroundColor: 'rgba(230,57,70,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.3)',
  },
  buttonCancel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextDefault: {
    color: '#fff',
  },
  buttonTextDestructive: {
    color: '#E63946',
  },
  buttonTextCancel: {
    color: '#fff',
  },
});
