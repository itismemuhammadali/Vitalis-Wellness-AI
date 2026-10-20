import { formatCountdown } from "@/app/lib/countdownFormatter";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TimeCapsuleCardProps {
  userId: string;
}

interface TimeCapsule {
  id: string;
  message_type: "text" | "voice" | "video";
  unlock_date: string;
  is_unlocked: boolean;
}

export default function TimeCapsuleCard({ userId }: TimeCapsuleCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nearestCapsule, setNearestCapsule] = useState<TimeCapsule | null>(
    null,
  );
  const [totalCapsules, setTotalCapsules] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    fetchCapsules();
  }, [userId]);

  const fetchCapsules = async () => {
    try {
      setLoading(true);

      const { data: capsules, error } = await (
        supabase.from("time_capsules") as any
      )
        .select("id, message_type, unlock_date, is_unlocked")
        .eq("user_id", userId)
        .order("unlock_date", { ascending: true });

      if (error) {
        console.error("Error fetching capsules:", error);
        return;
      }

      if (!capsules || capsules.length === 0) {
        setTotalCapsules(0);
        setUnlockedCount(0);
        setNearestCapsule(null);
        return;
      }

      setTotalCapsules(capsules.length);

      // Count unlocked capsules
      const now = new Date();
      const unlocked = capsules.filter((c: TimeCapsule) => {
        const unlockDate = new Date(c.unlock_date);
        return c.is_unlocked || unlockDate <= now;
      });
      setUnlockedCount(unlocked.length);

      // Find nearest locked capsule
      const locked = capsules.filter((c: TimeCapsule) => {
        const unlockDate = new Date(c.unlock_date);
        return !c.is_unlocked && unlockDate > now;
      });

      if (locked.length > 0) {
        setNearestCapsule(locked[0]);
      } else {
        setNearestCapsule(null);
      }
    } catch (error) {
      console.error("Error in fetchCapsules:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCountdown = (unlockDate: string): string => {
    try {
      return formatCountdown(unlockDate);
    } catch (error) {
      console.error("Error in calculateCountdown:", error);
      const now = new Date();
      const unlock = new Date(unlockDate);
      const diff = unlock.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return `${days} days`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const typeLabels: { [key: string]: string } = {
    text: "Text Message",
    voice: "Voice Message",
    video: "Video Message",
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#9D4EDD" }]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: "#9D4EDD", borderColor: "#9D4EDD" },
        Platform.OS === "ios" && {
          shadowColor: "#9D4EDD",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        Platform.OS === "android" && {
          elevation: 8,
        },
      ]}
      onPress={() => router.push("/screens/sealed-capsules")}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>
        TIME CAPSULE
      </Text>
      <MaterialCommunityIcons
        name="lock-clock"
        size={40}
        color="#FFFFFF"
        style={styles.icon}
      />

      {nearestCapsule ? (
        <>
          <Text style={[styles.messageType, { color: "#FFFFFF" }]}>
            {typeLabels[nearestCapsule.message_type]}
          </Text>
          <Text style={[styles.countdown, { color: "rgba(255,255,255,0.95)" }]}>
            {calculateCountdown(nearestCapsule.unlock_date)}
          </Text>
          <Text style={[styles.date, { color: "rgba(255,255,255,0.8)" }]}>
            {formatDate(nearestCapsule.unlock_date)}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.messageType, { color: "#FFFFFF" }]}>
            {totalCapsules} Capsule{totalCapsules !== 1 ? "s" : ""}
          </Text>
          <Text style={[styles.countdown, { color: "rgba(255,255,255,0.95)" }]}>
            {unlockedCount} Unlocked
          </Text>
          <Text style={[styles.date, { color: "rgba(255,255,255,0.8)" }]}>
            {totalCapsules === 0 ? "Create your first" : "View capsules"}
          </Text>
        </>
      )}

      <View style={styles.arrow}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#FFFFFF"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0.5,
    height: 240,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    position: "relative",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  icon: {
    marginBottom: 12,
  },
  messageType: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  countdown: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    fontWeight: "500",
  },
  arrow: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
});
