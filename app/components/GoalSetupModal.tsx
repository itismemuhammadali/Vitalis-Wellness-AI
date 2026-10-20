import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface GoalSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
  aspirations?: string[];
}

export default function GoalSetupModal({
  visible,
  onClose,
  onStart,
  aspirations = [],
}: GoalSetupModalProps) {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';
  const inputBg = isDarkMode ? '#0F1419' : '#F5F1E8';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';
  const overlayBg = isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';

  const colorPalette = {
    red: '#FF6B6B',
    blue: '#1F9FFF',
    orange: '#FFB84D',
    purple: '#A78BFA',
    green: '#58CC02',
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await onStart();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colorPalette.green }]}>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>Complete Your Profile</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButtonContainer}>
              <Text style={[styles.closeButton, { color: '#FFFFFF' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.description, { color: textColor }]}>
                Answer a few quick questions to help us understand your current self and create personalized daily goals.
              </Text>
            </View>

            {/* Aspirations Display */}
            {aspirations.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: textColor }]}>Your Aspirations</Text>
                <View style={styles.aspirationsList}>
                  {aspirations.map((aspiration, index) => {
                    const tagColors = [colorPalette.green, colorPalette.blue, colorPalette.purple, colorPalette.orange];
                    const tagColor = tagColors[index % tagColors.length];
                    return (
                      <View
                        key={index}
                        style={[
                          styles.aspirationTag,
                          {
                            backgroundColor: tagColor + '20',
                            borderColor: tagColor,
                          },
                        ]}
                      >
                        <Text style={[styles.aspirationText, { color: tagColor }]}>
                          {aspiration}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Info Card */}
            <View style={[styles.infoCard, { backgroundColor: colorPalette.blue + '10', borderColor: colorPalette.blue }]}>
              <Ionicons name="information-circle" size={20} color={colorPalette.blue} />
              <Text style={[styles.infoText, { color: textColor }]}>
                Takes only 2-3 minutes to complete
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: 'transparent',
                  borderColor: colorPalette.red,
                  borderWidth: 2,
                },
              ]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: colorPalette.red }]}>Maybe Later</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colorPalette.green,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleStart}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Start Quiz</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 20,
    width: '100%',
    maxHeight: '95%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButtonContainer: {
    padding: 8,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: '70%',
  },
  section: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  aspirationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aspirationTag: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
  },
  aspirationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
