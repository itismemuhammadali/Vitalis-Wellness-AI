import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const PRIMARY_GREEN = '#58CC02';
const PRIMARY_ORANGE = '#FF9500';

export default function CameraScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode as string) || 'avatar';

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraFullyReady, setCameraFullyReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const bgColor = isDarkMode ? '#0F1419' : '#F5F1E8';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.text}>We need your permission to use the camera</ThemedText>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <ThemedText style={styles.buttonText}>Grant Permission</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTakePhoto = async () => {
      try {
        if (cameraRef.current) {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 1,
          });

          if (photo && photo.uri) {
            router.push({
              pathname: '/screens/camera-preview',
              params: {
                uri: photo.uri,
                type: 'photo',
                mode: mode,
              },
            });
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
      }
    };



  const toggleFacing = () => {
    setFacing(facing === 'back' ? 'front' : 'back');
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        animateShutter={false}
        onCameraReady={() => {
          console.log('Camera ready event fired');
          setCameraReady(true);
          // Wait 2 seconds after onCameraReady for Android to fully initialize
          setTimeout(() => {
            console.log('Camera fully ready after 2 second delay');
            setCameraFullyReady(true);
          }, 2000);
        }}
      />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={PRIMARY_GREEN} />
        </TouchableOpacity>
        <ThemedText style={styles.modeText}>Photo</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity onPress={() => router.back()} style={styles.bottomLeftButton}>
          <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, { backgroundColor: PRIMARY_ORANGE }]}
          onPress={handleTakePhoto}
        >
          <MaterialCommunityIcons name="camera" size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleFacing} style={[styles.bottomRightButton, { backgroundColor: 'rgba(88, 204, 2, 0.3)' }]}>
          <MaterialCommunityIcons name="camera-flip" size={28} color={PRIMARY_GREEN} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#58CC02',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  flipButton: {
    padding: 12,
    borderRadius: 8,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 10,
  },
  bottomLeftButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomRightButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    zIndex: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4B4B',
  },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  nativeCameraContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  nativeCameraContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  nativeCameraTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  nativeCameraSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  nativeCameraButtonContainer: {
    width: '100%',
    gap: 12,
  },
  nativeCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  nativeCameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
