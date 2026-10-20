import { useAuth } from '@/app/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { useAvatars } from '@/context/AvatarContext';
import { useAvatarUpdate } from '@/context/AvatarUpdateContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const PRIMARY_GREEN = '#58CC02';

export default function CameraPreviewScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { addAvatar } = useAvatars();
  const { setProfilePictureCustom } = useAvatarUpdate();
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const uri = params.uri as string;
  const type = params.type as 'photo' | 'video';
  const mode = params.mode as string;

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const cardBg = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';

  const handleUseAsProfilePicture = async () => {
    try {
      // Save to database
      if (user?.id) {
        const { error: updateError } = await (supabase.from('users') as any)
          .update({ avatar_url: uri })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating avatar in database:', updateError);
          Alert.alert('Error', 'Failed to save profile picture');
          return;
        }
        console.log('✅ Profile picture saved to database');
      }

      // Also save to AsyncStorage
      await setProfilePictureCustom(uri);
      setShowOptionsModal(false);
      router.replace('/screens/profile');
    } catch (error) {
      Alert.alert('Error', 'Failed to set profile picture');
    }
  };

  const handleUseAsAvatar = async () => {
    try {
      await addAvatar(uri);
      setShowOptionsModal(false);
      router.replace('/screens/goals?tab=avatar');
    } catch (error) {
      Alert.alert('Error', 'Failed to save avatar');
    }
  };

  const handleUse = async () => {
    if (mode === 'profile-picture') {
      // Use for both profile picture and avatar
      try {
        // Save to database
        if (user?.id) {
          const { error: updateError } = await (supabase.from('users') as any)
            .update({ avatar_url: uri })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating avatar in database:', updateError);
            Alert.alert('Error', 'Failed to save picture');
            return;
          }
          console.log('✅ Profile picture saved to database');
        }

        // Also save to AsyncStorage
        await setProfilePictureCustom(uri);
        await addAvatar(uri);
        router.replace('/screens/profile');
      } catch (error) {
        Alert.alert('Error', 'Failed to save picture');
      }
    } else if (mode === 'photo' || mode === 'avatar') {
      try {
        await addAvatar(uri);
        router.replace('/screens/goals?tab=avatar');
      } catch (error) {
        Alert.alert('Error', 'Failed to save avatar');
      }
    } else if (mode === 'timecapsule' || mode === 'video') {
      // Return to time capsule onboarding with the video URI and duration
      router.push({
        pathname: '/screens/onboarding/time-capsule',
        params: { 
          videoUri: uri,
          videoDuration: videoDuration.toString(),
        },
      });
    }
  };

  const handleRetake = () => {
    router.back();
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={PRIMARY_GREEN} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: textPrimary }]}>
            Preview
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {/* Media Preview */}
        <View style={[styles.previewContainer, { backgroundColor: cardBg }]}>
          {type === 'photo' ? (
            <Image source={{ uri }} style={styles.preview} />
          ) : (
            <Video
              source={{ uri }}
              style={styles.preview}
              useNativeControls
              resizeMode={'contain' as any}
              isLooping
              onLoad={(data) => {
                console.log('Video duration:', data.durationMillis);
                setVideoDuration(data.durationMillis);
              }}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: 'transparent',
                borderColor: PRIMARY_GREEN,
                borderWidth: 2,
              },
            ]}
            onPress={handleRetake}
          >
            <ThemedText style={[styles.buttonText, { color: PRIMARY_GREEN }]}>
              Retake
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: PRIMARY_GREEN,
              },
            ]}
            onPress={handleUse}
          >
            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Use {type === 'photo' ? 'Photo' : 'Video'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Picture Options Modal */}
      {/* Removed - now using picture for both profile and avatar automatically */}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  previewContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
