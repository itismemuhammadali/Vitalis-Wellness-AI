import React from 'react';
import { Image, View } from 'react-native';

export function PaletteIcon({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={require('@/images1.png')}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
}
