declare module 'react-native-canvas' {
  import React from 'react';
    import { ViewProps } from 'react-native';

  export interface CanvasProps extends ViewProps {
    ref?: React.Ref<any>;
  }

  export const Canvas: React.ForwardRefExoticComponent<CanvasProps & React.RefAttributes<any>>;
}
