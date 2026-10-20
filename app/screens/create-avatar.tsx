import { SuccessConfirmationPopup } from '@/app/components/GamificationComponents';
import { useAuth } from '@/app/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

const PRIMARY_GREEN = '#58CC02';
const PRIMARY_ORANGE = '#FF9500';

export default function CreateAvatarScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [userAspirations, setUserAspirations] = useState<string[]>([]);
  const [showGeneratedAvatar, setShowGeneratedAvatar] = useState(false);

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const cardBg = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const textSecondary = isDarkMode ? '#B0B0B0' : '#757575';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';

  useEffect(() => {
    if (params?.imageUri) {
      setSelectedImage(params.imageUri as string);
    }
  }, [params?.imageUri]);

  useEffect(() => {
    fetchUserAspirations();
  }, [user?.id]);

  // Handle success popup redirect
  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => {
        console.log('🏠 Redirecting to home screen...');
        router.push('/?showGoalSetup=true');
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup, router]);

  const fetchUserAspirations = async () => {
    try {
      if (!user?.id) {
        console.log('⚠️ No user ID available');
        return;
      }

      console.log('📝 Fetching aspirations for user:', user.id);
      const { data, error } = await (supabase.from('aspirations') as any)
        .select('description')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error fetching aspirations:', error);
        setUserAspirations([]);
      } else if (data && data.length > 0) {
        const aspirations = data.map((item: any) => item.description);
        console.log('✅ Aspirations loaded:', aspirations);
        setUserAspirations(aspirations);
      } else {
        console.log('ℹ️ No aspirations found');
        setUserAspirations([]);
      }
    } catch (err) {
      console.error('🚨 Error in fetchUserAspirations:', err);
      setUserAspirations([]);
    }
  };

  const handleTakePhoto = () => {
    router.push({
      pathname: '/screens/camera',
      params: { mode: 'photo' },
    });
  };

  const handleChooseFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'We need permission to access your gallery');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleUsePhoto = async () => {
    if (selectedImage) {
      try {
        setGeneratingAvatar(true);
        console.log('🎨 Starting avatar generation...');
        console.log('📝 User ID:', user?.id);
        console.log('🎯 Aspirations:', userAspirations);
        
        // Call generate-avatar edge function
        const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-avatar`;
        console.log('🔗 Calling URL:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user?.id,
            aspirations: userAspirations,
            userName: user?.email?.split('@')[0] || 'User',
          }),
        });

        console.log('📊 Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Error response:', errorData);
          throw new Error(errorData.error || 'Failed to generate avatar');
        }

        const data = await response.json();
        console.log('✅ Avatar generated successfully');
        console.log('🖼️ Image URL:', data.imageUrl);
        
        setGeneratedAvatarUrl(data.imageUrl);
        setShowGeneratedAvatar(true);
        setGeneratingAvatar(false);
      } catch (error) {
        setGeneratingAvatar(false);
        console.error('🚨 Avatar generation error:', error);
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate avatar');
      }
    } else {
      Alert.alert('No Photo', 'Please select or take a photo first');
    }
  };

  const handleConfirmAvatar = async () => {
    console.log('🔘 Accept Avatar button clicked!');
    if (!user?.id) {
      console.log('❌ No user ID');
      return;
    }

    try {
      setSaving(true);
      console.log('🎨 Accept Avatar clicked - checking if avatar exists...');
      
      // First, check if avatar already exists
      const { data: userData, error: fetchError } = await (supabase.from('users') as any)
        .select('better_self_avatar_url')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching user:', fetchError);
        throw fetchError;
      }

      // If avatar already exists, just save it
      if (userData?.better_self_avatar_url) {
        console.log('✅ Avatar already exists, using existing avatar');
        setShowSuccessPopup(true);
        return;
      }

      // If no avatar exists, generate one
      console.log('🎨 No avatar exists, generating new avatar...');
      console.log('📝 User ID:', user.id);
      console.log('🎯 Aspirations:', userAspirations);
      
      const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-avatar`;
      console.log('🔗 Calling URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId: user.id,
          aspirations: userAspirations,
          userName: user?.email?.split('@')[0] || 'User',
        }),
      });

      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate avatar');
      }

      const data = await response.json();
      console.log('✅ Avatar generated successfully');
      console.log('🖼️ Image URL:', data.imageUrl);
      
      // Save the generated avatar to database
      const { error: updateError } = await (supabase.from('users') as any)
        .update({ better_self_avatar_url: data.imageUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Database error:', updateError);
        throw updateError;
      }

      console.log('✅ Avatar saved successfully to database');
      setShowSuccessPopup(true);
    } catch (error) {
      setSaving(false);
      console.error('🚨 Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to process avatar');
    }
  };

  const handleRegenerateAvatar = () => {
    setShowGeneratedAvatar(false);
    setGeneratedAvatarUrl(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={PRIMARY_GREEN} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: textPrimary }]}>
            {showGeneratedAvatar ? 'Your Better Self' : 'Create Your Avatar'}
          </ThemedText>
          <View style={{ width: 28 }} />
        </View>

        {/* Generated Avatar Display */}
        {showGeneratedAvatar && generatedAvatarUrl ? (
          <>
            {/* Avatar Preview */}
            <View
              style={[
                styles.photoPreview,
                {
                  backgroundColor: cardBg,
                  borderColor: PRIMARY_GREEN,
                  borderWidth: 2,
                },
              ]}
            >
              <Image
                source={{ uri: generatedAvatarUrl }}
                style={styles.previewImage}
              />
            </View>

            {/* Success Message */}
            <View
              style={[
                styles.successMessage,
                {
                  backgroundColor: PRIMARY_GREEN + '20',
                  borderColor: PRIMARY_GREEN,
                },
              ]}
            >
              <MaterialCommunityIcons name="check-circle" size={24} color={PRIMARY_GREEN} />
              <ThemedText style={[styles.successText, { color: PRIMARY_GREEN }]}>
                Avatar generated successfully!
              </ThemedText>
            </View>

            {/* Confirmation Buttons */}
            <TouchableOpacity
              style={[
                styles.usePhotoButton,
                {
                  backgroundColor: PRIMARY_GREEN,
                  opacity: saving ? 0.7 : 1,
                },
              ]}
              onPress={handleConfirmAvatar}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  ✨ Accept Avatar
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.usePhotoButton,
                {
                  backgroundColor: PRIMARY_ORANGE,
                  opacity: generatingAvatar ? 0.7 : 1,
                },
              ]}
              onPress={handleRegenerateAvatar}
              disabled={generatingAvatar}
            >
              <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                🔄 Regenerate
              </ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Photo Preview */}
            <View
              style={[
                styles.photoPreview,
                {
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                },
              ]}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.placeholderContent}>
                  <View style={styles.iconContainer}>
                    <ThemedText style={styles.placeholderIcon}>
                      🖼️
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.placeholderText, { color: textSecondary }]}>
                    No photo selected
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Linked Goal Card */}
            <View
              style={[
                styles.linkedGoalCard,
                {
                  backgroundColor: 'transparent',
                  borderColor: PRIMARY_GREEN,
                },
              ]}
            >
              <ThemedText style={[styles.linkedGoalLabel, { color: textSecondary }]}>
                Linked Goal
              </ThemedText>
              <ThemedText style={[styles.linkedGoalTitle, { color: PRIMARY_GREEN }]}>
                My Avatar
              </ThemedText>
              <ThemedText style={[styles.linkedGoalSubtitle, { color: textSecondary }]}>
                Track my transformation
              </ThemedText>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[
                styles.takePhotoButton,
                {
                  backgroundColor: PRIMARY_ORANGE,
                },
              ]}
              onPress={handleTakePhoto}
            >
              <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Take Photo
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.galleryButton,
                {
                  backgroundColor: PRIMARY_GREEN,
                },
              ]}
              onPress={handleChooseFromGallery}
            >
              <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Choose from Gallery
              </ThemedText>
            </TouchableOpacity>

            {selectedImage && (
              <TouchableOpacity
                style={[
                  styles.usePhotoButton,
                  {
                    backgroundColor: PRIMARY_GREEN,
                    opacity: generatingAvatar ? 0.7 : 1,
                  },
                ]}
                onPress={handleUsePhoto}
                disabled={generatingAvatar}
              >
                {generatingAvatar ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <ThemedText style={[styles.buttonText, { color: '#FFFFFF', marginLeft: 8 }]}>
                      Generating...
                    </ThemedText>
                  </>
                ) : (
                  <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    ✨ Create Avatar
                  </ThemedText>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Success Popup */}
      <SuccessConfirmationPopup
        visible={showSuccessPopup}
        message="🎉 Avatar created successfully!"
        isDarkMode={isDarkMode}
        onDismiss={() => setShowSuccessPopup(false)}
        duration={2000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 40,
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
  photoPreview: {
    borderRadius: 16,
    borderWidth: 1,
    height: 300,
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderIcon: {
    fontSize: 70,
    lineHeight: 80,
  },
  placeholderText: {
    fontSize: 16,
  },
  linkedGoalCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 24,
  },
  linkedGoalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  linkedGoalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  linkedGoalSubtitle: {
    fontSize: 14,
  },
  takePhotoButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  galleryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  usePhotoButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
