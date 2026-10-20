import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/context/ThemeContext";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialDesignIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface NavItem {
  name: string;
  icon: string;
  iconName?: string;
  iconType?: "ionicons" | "material" | "fontawesome";
  route: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Home",
    icon: "🏠",
    iconName: "home",
    iconType: "ionicons",
    route: "/screens/home",
    color: "#58CC02",
  },
  {
    name: "Goals",
    icon: "📈",
    iconName: "chart-timeline-variant-shimmer",
    iconType: "material",
    route: "/screens/goals",
    color: "#FFD700",
  },
  {
    name: "Profile",
    icon: "👤",
    iconName: "user-alt",
    iconType: "fontawesome",
    route: "/screens/profile",
    color: "#FF6B6B",
  },
  {
    name: "Settings",
    icon: "⚙️",
    iconName: "settings-sharp",
    iconType: "ionicons",
    route: "/screens/settings",
    color: "#5B9BD5",
  },
];

export const BottomNavbar = React.memo(function BottomNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useTheme();

  const backgroundColor = isDarkMode ? "#1A1F2E" : "#F5F1E8";
  const borderColor = isDarkMode ? "#2A3142" : "#E0E0E0";

  const isActive = (route: string) => {
    if (route === "/screens/profile") {
      return (
        pathname === route ||
        pathname === "/screens/sealed-capsules" ||
        pathname.includes("/screens/capsule-detail")
      );
    }
    return pathname === route;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderTopColor: borderColor },
      ]}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.route);
        const itemColor = active
          ? item.color
          : isDarkMode
            ? "#B0B0B0"
            : "#757575";

        return (
          <TouchableOpacity
            key={item.route}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            {item.iconName && item.iconType === "material" ? (
              <MaterialDesignIcons
                name={item.iconName as any}
                size={24}
                color={itemColor}
                style={styles.icon}
              />
            ) : item.iconName && item.iconType === "fontawesome" ? (
              <FontAwesome5
                name={item.iconName as any}
                size={24}
                color={itemColor}
                style={styles.icon}
              />
            ) : item.iconName ? (
              <Ionicons
                name={item.iconName as any}
                size={24}
                color={itemColor}
                style={styles.icon}
              />
            ) : (
              <ThemedText style={[styles.icon, { color: itemColor }]}>
                {item.icon}
              </ThemedText>
            )}
            <ThemedText
              style={[
                styles.label,
                {
                  color: itemColor,
                  fontWeight: active ? "600" : "400",
                },
              ]}
            >
              {item.name}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: 20,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
  },
});

export default BottomNavbar;
