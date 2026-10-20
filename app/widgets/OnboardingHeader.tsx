import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const PRIMARY_GREEN = '#58CC02';
const BORDER_COLOR = '#2A3A4A';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
}

export default function OnboardingHeader({ currentStep, totalSteps, onBack }: OnboardingHeaderProps) {
  // For 4 screens: 0%, 25%, 50%, 75%
  // currentStep 1 = 0% (just a dot), 2 = 25%, 3 = 50%, 4 = 75%
  const progressPercentage = (currentStep - 1) * 25;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={PRIMARY_GREEN} />
      </TouchableOpacity>
      <View style={[styles.progressBar, { backgroundColor: BORDER_COLOR }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: PRIMARY_GREEN,
              width: progressPercentage === 0 ? '2%' : `${progressPercentage}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
