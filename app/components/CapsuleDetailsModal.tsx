import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { useTimeCapsule } from '@/context/TimeCapsuleContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface CapsuleDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  capsule: {
    icon: string;
    title: string;
    type: string;
    unlocksIn: string;
    date: string;
    createdAt: Date;
    unlocksAt: Date;
  };
}

export default function CapsuleDetailsModal({
  visible,
  onClose,
  capsule,
}: CapsuleDetailsModalProps) {
  const { isDarkMode } = useTheme();
  const { unlockTime, getUnlockDate, customDate, calculateCountdown } = useTimeCapsule();
  const [countdown, setCountdown] = useState('');
  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const cardBg = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const textSecondary = isDarkMode ? '#B0B0B0' : '#757575';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';

  useEffect(() => {
    if (!visible || !unlockTime) return;

    // Use the context's calculateCountdown function
    const calculatedCountdown = calculateCountdown(unlockTime, customDate);
    setCountdown(calculatedCountdown);
  }, [visible, unlockTime, customDate, calculateCountdown]);

  // Animation effect
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const formatTimestamp = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: cardBg,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ThemedText style={[styles.closeIcon, { color: textPrimary }]}>
              ✕
            </ThemedText>
          </TouchableOpacity>



          {/* Icon */}
          <ThemedText style={styles.modalIcon}>{capsule.icon}</ThemedText>

          {/* Type */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              Type
            </ThemedText>
            <ThemedText style={[styles.value, { color: textPrimary }]}>
              {capsule.type}
            </ThemedText>
          </View>

          {/* Lock Status */}
          <View style={styles.section}>
            <View style={styles.lockStatusRow}>
              <MaterialCommunityIcons
                name="lock"
                size={20}
                color="#58CC02"
              />
              <ThemedText style={[styles.lockStatus, { color: '#58CC02' }]}>
                Locked
              </ThemedText>
            </View>
          </View>

          {/* Unlock Date */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              Unlocks Until
            </ThemedText>
            <ThemedText style={[styles.value, { color: textPrimary }]}>
              {unlockTime ? getUnlockDate(unlockTime, customDate) : capsule.date}
            </ThemedText>
          </View>

          {/* Countdown */}
          <View style={[styles.section, styles.countdownSection]}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              Time Remaining
            </ThemedText>
            <ThemedText style={[styles.countdown, { color: '#58CC02' }]}>
              {countdown}
            </ThemedText>
          </View>

          {/* Created Timestamp */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>
              Created At
            </ThemedText>
            <ThemedText style={[styles.timestamp, { color: textPrimary }]}>
              {formatTimestamp(new Date())}
            </ThemedText>
          </View>

          {/* Capsule Progress Badge */}
          <View style={[styles.capsuleProgressBadge, { backgroundColor: 'rgba(88, 204, 2, 0.15)', borderColor: '#58CC02' }]}>
            <MaterialCommunityIcons name="lock-clock" size={20} color="#58CC02" />
            <ThemedText style={[styles.capsuleProgressText, { color: '#58CC02' }]}>
              Waiting to Unlock
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 24,
    marginTop: 50,
    lineHeight: 65,
  },
  section: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  lockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  countdown: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
    fontWeight: '500',
  },
  gamificationBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  gamificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  capsuleProgressBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
  },
  capsuleProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countdownSection: {
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#58CC02',
  },
  gamificationFooter: {
    width: '100%',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
