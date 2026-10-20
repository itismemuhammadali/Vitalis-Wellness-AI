import { Audio } from 'expo-av';
import { useCameraPermissions } from 'expo-camera';
import React, { createContext, useContext, useMemo, useState } from 'react';

interface PermissionsContextType {
  cameraPermission: boolean;
  audioPermission: boolean;
  requestCameraPermissionAsync: () => Promise<boolean>;
  requestAudioPermissionAsync: () => Promise<boolean>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [cameraPermission, setCameraPermission] = useState(false);
  const [audioPermission, setAudioPermission] = useState(false);
  const [cameraPermissionStatus, requestCameraPermission] = useCameraPermissions();

  const requestCameraPermissionAsync = async (): Promise<boolean> => {
    try {
      const result = await requestCameraPermission();
      setCameraPermission(result.granted);
      return result.granted;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const requestAudioPermissionAsync = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      setAudioPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return false;
    }
  };

  return (
    <PermissionsContext.Provider
      value={useMemo(() => ({
        cameraPermission,
        audioPermission,
        requestCameraPermissionAsync,
        requestAudioPermissionAsync,
      }), [cameraPermission, audioPermission, requestCameraPermissionAsync, requestAudioPermissionAsync])}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
