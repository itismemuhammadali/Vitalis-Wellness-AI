import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
    Alert,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface EditProfilePictureModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected?: (uri: string) => void;
}

const PRIMARY_GREEN = '#58CC02';

export default function EditProfilePictureModal({
  visible,
  onClose,
  onImageSelected,
}: EditProfilePictureModalProps) {
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const bgColor = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';
  const overlayBg = isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';

  const handleTakePhoto = async () => {
    try {
      // Launch native camera directly
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        console.log('Profile picture taken via native camera:', photo.uri);
        
        // Navigate to camera-preview screen
        onClose();
        router.push({
          pathname: '/screens/camera-preview',
          params: {
            uri: photo.uri,
            type: 'photo',
            mode: 'profile-picture',
          },
        });
      } else {
        console.log('User cancelled camera');
      }
    } catch (error: any) {
      console.error('ERROR in native camera:', error);
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Denied', 'We need permission to access your gallery');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        onImageSelected?.(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: textColor }]}>
              Update Profile Picture
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
              <ThemedText style={[styles.closeButton, { color: subtitleColor }]}>
                ✕
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Take Photo Option */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: 'transparent',
                  borderColor: PRIMARY_GREEN,
                  borderWidth: 2,
                },
              ]}
              onPress={handleTakePhoto}
            >
              <MaterialCommunityIcons
                name="camera"
                size={32}
                color={PRIMARY_GREEN}
                style={styles.optionIcon}
              />
              <ThemedText style={[styles.optionTitle, { color: textColor }]}>
                Take Photo
              </ThemedText>
              <ThemedText style={[styles.optionSubtitle, { color: subtitleColor }]}>
                Use your camera
              </ThemedText>
            </TouchableOpacity>

            {/* Choose from Gallery Option */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: PRIMARY_GREEN,
                },
              ]}
              onPress={handleChooseFromGallery}
            >
              <MaterialCommunityIcons
                name="image-multiple"
                size={32}
                color="#FFFFFF"
                style={styles.optionIcon}
              />
              <ThemedText style={[styles.optionTitle, { color: '#FFFFFF' }]}>
                Choose from Gallery
              </ThemedText>
              <ThemedText style={[styles.optionSubtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                Select from your photos
              </ThemedText>
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
            onPress={onClose}
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
    marginBottom: 24,
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
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    marginBottom: 12,
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
