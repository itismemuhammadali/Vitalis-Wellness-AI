import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

export default function TrophyCircle() {
  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <MaterialCommunityIcons
          name="compass-outline"
          size={80}
          color="#00FF00"
          style={styles.compass}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  circleContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  compass: {
    zIndex: 1,
  },
});
