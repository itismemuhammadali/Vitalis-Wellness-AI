import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("Confirming your email...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Listen for auth state change - Supabase fires SIGNED_IN after email confirmation
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("� Confirm email auth event:", event, "session:", !!session);

      if (event === "SIGNED_IN" && session) {
        setStatus("Email confirmed! Redirecting...");
        setTimeout(() => {
          router.replace("/screens/authentication/login");
        }, 1500);
      } else if (event === "INITIAL_SESSION" && !session) {
        // No session yet, still waiting for confirmation
        setStatus("Confirming your email...");
      }
    });

    // Also check if already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("Email confirmed! Redirecting...");
        setTimeout(() => {
          router.replace("/screens/authentication/login");
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!isError && <ActivityIndicator size="large" color="#58CC02" />}
        <Text style={[styles.text, { color: isError ? "#FF6B6B" : "#58CC02" }]}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F1419",
  },
  content: {
    alignItems: "center",
    gap: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
