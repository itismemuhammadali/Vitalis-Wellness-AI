import { ThemedText } from '@/components/themed-text';
import { useAvatars } from '@/context/AvatarContext';
import { useAvatarUpdate } from '@/context/AvatarUpdateContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AvatarTab() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { avatars, deleteAvatar } = useAvatars();
  const { profilePicture, setProfilePictureFromAvatar } = useAvatarUpdate();

  const cardBg = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const textSecondary = isDarkMode ? '#B0B0B0' : '#757575';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';

  const handleDelete = (id: string) => {
    Alert.alert('Delete Avatar', 'Are you sure you want to delete this avatar?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => deleteAvatar(id),
        style: 'destructive',
      },
    ]);
  };

  const handleSetAsProfilePicture = async (avatarId: string) => {
    try {
      await setProfilePictureFromAvatar(avatarId);
      Alert.alert('Success', 'Avatar set as profile picture');
    } catch (error) {
      Alert.alert('Error', 'Failed to set avatar as profile picture');
    }
  };

  const isProfilePicture = (avatarId: string) => {
    return profilePicture?.type === 'avatar' && profilePicture?.avatarId === avatarId;
  };

  return (
    <View>
      <ThemedText style={[styles.sectionTitle, { color: textPrimary }]}>
        Your AI Avatar
      </ThemedText>

      {avatars.length === 0 ? (
        <>
          {/* Avatar Placeholder */}
          <View
            style={[
              styles.avatarPlaceholder,
              {
                backgroundColor: cardBg,
                borderColor: borderColor,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <ThemedText style={styles.placeholderIcon}>
                👤
              </ThemedText>
            </View>
            <ThemedText style={[styles.placeholderTitle, { color: textPrimary }]}>
              No Avatar Yet
            </ThemedText>
            <ThemedText style={[styles.placeholderSubtitle, { color: textSecondary }]}>
              Create an avatar to visualize your progress
            </ThemedText>
          </View>

          {/* Create Avatar Button */}
          <TouchableOpacity
            style={[
              styles.createAvatarButton,
              {
                backgroundColor: '#58CC02',
              },
            ]}
            onPress={() => router.push('/screens/create-avatar')}
          >
            <ThemedText style={[styles.createAvatarButtonText, { color: '#FFFFFF' }]}>
              + Create Avatar
            </ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <FlatList
            data={avatars}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.avatarCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: isProfilePicture(item.id) ? '#58CC02' : borderColor,
                    borderWidth: isProfilePicture(item.id) ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.avatarImageContainer}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.avatarImage}
                  />
                  {isProfilePicture(item.id) && (
                    <View style={styles.profileBadge}>
                      <ThemedText style={styles.profileBadgeText}>✓</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.avatarInfo}>
                  <ThemedText style={[styles.avatarDate, { color: textSecondary }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleSetAsProfilePicture(item.id)}
                    style={[
                      styles.profileButton,
                      {
                        backgroundColor: isProfilePicture(item.id) ? '#58CC02' : 'transparent',
                        borderColor: '#58CC02',
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.profileButtonText,
                        { color: isProfilePicture(item.id) ? '#FFFFFF' : '#58CC02' },
                      ]}
                    >
                      {isProfilePicture(item.id) ? '✓' : '📷'}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteButton}
                  >
                    <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <TouchableOpacity
            style={[
              styles.createAvatarButton,
              {
                backgroundColor: '#58CC02',
              },
            ]}
            onPress={() => router.push('/screens/create-avatar')}
          >
            <ThemedText style={[styles.createAvatarButtonText, { color: '#FFFFFF' }]}>
              + Create New Avatar
            </ThemedText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    minHeight: 320,
  },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  placeholderIcon: {
    fontSize: 90,
    lineHeight: 100,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  createAvatarButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createAvatarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatarCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImageContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  profileBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  avatarInfo: {
    flex: 1,
  },
  avatarDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
});
