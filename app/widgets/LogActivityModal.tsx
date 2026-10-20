import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface LogActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: { activity: string }) => void;
}

function LogActivityModalContent({ visible, onClose, onSubmit }: LogActivityModalProps) {
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;

  const [activity, setActivity] = useState('');

  const bgColor = isDark ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDark ? '#B0B0B0' : '#757575';
  const inputBg = isDark ? '#0F1419' : '#F5F1E8';
  const borderColor = isDark ? '#2A3142' : '#E0E0E0';
  const overlayBg = isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';

  // Gamification colors
  const colorPalette = {
    blue: '#1F9FFF',
    green: '#58CC02',
    red: '#FF6B6B',
  };

  const handleSubmit = () => {
    if (!activity.trim()) {
      alert('Please describe what you did');
      return;
    }
    onSubmit?.({ activity });
    handleClose();
  };

  const handleClose = () => {
    setActivity('');
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
          <View style={[styles.header, { backgroundColor: colorPalette.blue }]}>
            <View style={styles.headerContent}>
              <Text style={styles.headerIcon}>📝</Text>
              <Text style={[styles.title, { color: '#FFFFFF' }]}>Log Progress</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButtonContainer}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Activity Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>
                📌 What did you accomplish?
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    color: textColor,
                    borderColor: colorPalette.blue,
                  },
                ]}
                placeholder="Share your progress, achievements, or what you worked on..."
                placeholderTextColor={subtitleColor}
                value={activity}
                onChangeText={setActivity}
                multiline
                numberOfLines={5}
              />
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
            >
              <Text style={[styles.buttonText, { color: colorPalette.red }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colorPalette.green,
                },
                Platform.OS === 'ios' && {
                  shadowColor: colorPalette.green,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
                Platform.OS === 'android' && {
                  elevation: 5,
                }
              ]}
              onPress={handleSubmit}
            >
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Log Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default LogActivityModalContent;

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
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButtonContainer: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: '70%',
  },
  section: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activityButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flexDirection: 'row',
  },
  activityIcon: {
    fontSize: 20,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
