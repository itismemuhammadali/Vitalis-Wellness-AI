import AspirationProgressCard from "@/app/components/AspirationProgressCard";
import { useAuth } from "@/app/context/AuthContext";
import GoalsTab from "@/app/tabs/GoalsTab";
import BottomNavbar from "@/app/widgets/BottomNavbar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/context/ThemeContext";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function GoalsScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    // Goals screen initialized
  }, []);

  const bgColor = isDarkMode ? "#0F1419" : "#F5F1E8";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F1F1F";

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: textPrimary }]}>
            Goals & Progress
          </ThemedText>
        </View>

        {/* Aspiration Progress Card */}
        {user?.id && <AspirationProgressCard userId={user.id} />}

        {/* Tab Content */}
        <View style={styles.tabContent}>
          <GoalsTab />
        </View>

        {/* Spacer for navbar */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Bottom Navbar */}
      <BottomNavbar />
    </ThemedView>
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
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  tabContent: {
    marginBottom: 24,
  },
  spacer: {
    height: 20,
  },
});
