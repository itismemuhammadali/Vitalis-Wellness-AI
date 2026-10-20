import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState("Confirming your email...");

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Try to get params from AsyncStorage first (set by _layout.tsx)
      const storedParamsStr = await AsyncStorage.getItem("auth_callback_params");
      let accessToken: string | undefined;
      let refreshToken: string | undefined;
      let type: string | undefined;

      if (storedParamsStr) {
        console.log("✅ Found params in AsyncStorage");
        const storedParams = JSON.parse(storedParamsStr);
        accessToken = storedParams.access_token;
        refreshToken = storedParams.refresh_token;
        type = storedParams.type;
        
        // Clear the stored params
        await AsyncStorage.removeItem("auth_callback_params");
      } else {
        // Fallback to URL params (shouldn't happen but just in case)
        console.log("⚠️ No params in AsyncStorage, trying useLocalSearchParams");
        accessToken = params.access_token as string;
        refreshToken = params.refresh_token as string;
        type = params.type as string;
      }

      console.log("🔐 Callback type:", type);
      console.log("🔐 Has access token:", !!accessToken);

      if (type === "recovery") {
        // Password reset
        console.log("🔐 Recovery flow detected");
        if (accessToken && refreshToken) {
          console.log("🔐 Setting session for password reset");
          const { error } = await supabase.auth.setSession({ 
            access_token: accessToken, 
            refresh_token: refreshToken 
          });
          
          if (error) {
            console.error("❌ Session error:", error);
          } else {
            console.log("✅ Session set successfully");
          }
        }
        console.log("🔐 Navigating to reset-password screen");
        router.replace("/screens/authentication/reset-password");
        return;
      }

      if (accessToken && refreshToken) {
        // Set the session using the tokens from the email link
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("❌ Session error:", error.message);
          router.replace("/screens/authentication/login?toast=email_confirmed");
          return;
        }

        if (data.session) {
          setStatus("Email confirmed! ✓ Taking you in...");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          router.replace("/screens/onboarding/welcome");
          return;
        }
      }

      // Fallback
      console.log("⚠️ No valid params found, redirecting to login");
      router.replace("/screens/authentication/login?toast=email_confirmed");
    } catch (err) {
      console.error("Callback error:", err);
      router.replace("/screens/authentication/login");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0F1419",
        gap: 16,
      }}
    >
      <ActivityIndicator size="large" color="#58CC02" />
      <Text style={{ fontSize: 18, color: "#FFFFFF", fontWeight: "600", textAlign: "center", paddingHorizontal: 32 }}>
        {status}
      </Text>
    </View>
  );
}
