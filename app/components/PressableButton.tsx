import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PressableButtonProps {
  onPress: () => void;
  disabled?: boolean;
  buttonColor?: string;
  disabledColor?: string;
  children: string;
}

const DEFAULT_BUTTON_COLOR = '#58CC02';
const DEFAULT_DISABLED_COLOR = '#7A8A9A';

export default function PressableButton({
  onPress,
  disabled = false,
  buttonColor = DEFAULT_BUTTON_COLOR,
  disabledColor = DEFAULT_DISABLED_COLOR,
  children,
}: PressableButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isDisabled = disabled;
  const currentButtonColor = isDisabled ? disabledColor : buttonColor;
  const buttonOpacity = isPressed ? 0.7 : 1;

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.buttonContainer}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
    >
      {/* Main button */}
      <View
        style={[
          styles.button,
          {
            backgroundColor: currentButtonColor,
            opacity: buttonOpacity,
          },
        ]}
      >
        <Text style={styles.buttonText}>{children}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
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
