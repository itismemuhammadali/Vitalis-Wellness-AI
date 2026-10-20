import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

interface SuccessConfirmationPopupProps {
  visible: boolean;
  message: string;
  isDarkMode: boolean;
  onDismiss: () => void;
  duration?: number;
}

export default function SuccessConfirmationPopup({
  visible,
  message,
  isDarkMode,
  onDismiss,
  duration = 2000,
}: SuccessConfirmationPopupProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <View style={[styles.popup, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
          <Text style={[styles.message, { color: isDarkMode ? '#fff' : '#000' }]}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popup: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
