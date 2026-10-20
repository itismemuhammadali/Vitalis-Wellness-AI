import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProfilePictureOptionsModalProps {
  visible: boolean;
  imageUri: string;
  onUseAsProfilePicture: () => void;
  onUseAsAvatar: () => void;
  onCancel: () => void;
}

const PRIMARY_GREEN = '#58CC02';

export default function ProfilePictureOptionsModal({
  visible,
  imageUri,
  onUseAsProfilePicture,
  onUseAsAvatar,
  onCancel,
}: ProfilePictureOptionsModalProps) {
  const { isDarkMode } = useTheme();

  const bgColor = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';
  const overlayBg = isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: textColor }]}>
              Use This Photo
            </ThemedText>
            <TouchableOpacity onPress={onCancel} style={styles.closeButtonContainer}>
              <ThemedText style={[styles.closeButton, { color: subtitleColor }]}>
                ✕
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Image Preview */}
          <View style={[styles.imagePreview, { borderColor }]}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Use as Profile Picture */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: PRIMARY_GREEN,
                },
              ]}
              onPress={onUseAsProfilePicture}
            >
              <MaterialCommunityIcons
                name="account-circle"
                size={24}
                color="#FFFFFF"
                style={styles.optionIcon}
              />
              <View style={styles.optionTextContainer}>
                <ThemedText style={[styles.optionTitle, { color: '#FFFFFF' }]}>
                  Use as Profile Picture
                </ThemedText>
                <ThemedText style={[styles.optionSubtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                  Show on profile & home
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Use as Avatar */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: 'transparent',
                  borderColor: PRIMARY_GREEN,
                  borderWidth: 2,
                },
              ]}
              onPress={onUseAsAvatar}
            >
              <MaterialCommunityIcons
                name="image-multiple"
                size={24}
                color={PRIMARY_GREEN}
                style={styles.optionIcon}
              />
              <View style={styles.optionTextContainer}>
                <ThemedText style={[styles.optionTitle, { color: textColor }]}>
                  Use as Avatar
                </ThemedText>
                <ThemedText style={[styles.optionSubtitle, { color: subtitleColor }]}>
                  Track your transformation
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                borderColor: borderColor,
              },
            ]}
            onPress={onCancel}
          >
            <ThemedText style={[styles.cancelButtonText, { color: subtitleColor }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    marginRight: 4,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
