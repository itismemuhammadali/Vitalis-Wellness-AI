import { profileQuestionService } from '@/services/profileQuestionService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface CompleteProfileModalProps {
  visible: boolean;
  onStartNow: () => void;
  onAskMeLater: () => void;
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  visible,
  onStartNow,
  onAskMeLater,
}) => {
  const handleAskMeLater = async () => {
    // Store the timestamp for 24 hours from now
    await profileQuestionService.muteProfileQuestion();
    onAskMeLater();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={[
          styles.modalContent,
          Platform.OS === 'ios' ? {
            shadowColor: '#A78BFA',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
          } : {
            elevation: 12,
          }
        ]}>
          {/* Header Bar */}
          <View style={styles.headerBar} />

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
            <MaterialCommunityIcons
              name="clipboard-check"
              size={60}
              color="#A78BFA"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Complete Your Profile</Text>

          {/* Description */}
          <Text style={styles.description}>
            Answer a few quick questions to personalize your experience and get
            better recommendations.
          </Text>

          {/* Start Now Button */}
          <TouchableOpacity
            style={[
              styles.startButton,
              Platform.OS === 'ios' ? {
                shadowColor: '#58CC02',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              } : {
                elevation: 6,
              }
            ]}
            onPress={onStartNow}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Now</Text>
          </TouchableOpacity>

          {/* Ask Me Later Button */}
          <TouchableOpacity
            style={styles.askLaterButton}
            onPress={handleAskMeLater}
            activeOpacity={0.8}
          >
            <Text style={styles.askLaterButtonText}>Ask Me Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a2332',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    overflow: 'hidden',
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#A78BFA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#58CC02',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  askLaterButton: {
    borderWidth: 2,
    borderColor: '#A78BFA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  askLaterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A78BFA',
  },
});

export default CompleteProfileModal;
