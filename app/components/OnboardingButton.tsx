import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OnboardingButtonProps {
  onPress: () => void;
  disabled?: boolean;
  buttonColor?: string;
  disabledColor?: string;
  shadowColor?: string;
  disabledShadowColor?: string;
  children: string;
}

const DEFAULT_BUTTON_COLOR = '#58CC02';
const DEFAULT_DISABLED_COLOR = '#7A8A9A';
const DEFAULT_SHADOW_COLOR = '#58CC02';
const DEFAULT_DISABLED_SHADOW_COLOR = '#7A8A9A';

export default function OnboardingButton({
  onPress,
  disabled = false,
  buttonColor = DEFAULT_BUTTON_COLOR,
  disabledColor = DEFAULT_DISABLED_COLOR,
  shadowColor = DEFAULT_SHADOW_COLOR,
  disabledShadowColor = DEFAULT_DISABLED_SHADOW_COLOR,
  children,
}: OnboardingButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isDisabled = disabled;
  const currentButtonColor = isDisabled ? disabledColor : buttonColor;
  const currentShadowColor = isDisabled ? disabledShadowColor : shadowColor;
  const buttonOpacity = isPressed ? 0.7 : 1;

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  return (
    <View style={styles.container}>
      {/* Main button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: currentButtonColor,
            shadowColor: currentShadowColor,
            opacity: buttonOpacity,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
      >
        <Text style={styles.buttonText}>{children}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
    position: 'relative',
  },
  button: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 15,
    zIndex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
