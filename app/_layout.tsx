import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { LogBox, Text, View } from "react-native";
import "react-native-reanimated";

// Suppress keep-awake errors and route warnings
LogBox.ignoreLogs([
  "Unable to activate keep awake",
  "Route",
  "missing the required default export",
]);

// Suppress keep-awake errors
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: any[]) => {
  const message = String(args[0] || "");
  if (
    message.includes("Unable to activate keep awake") ||
    message.includes("Route") ||
    message.includes("missing the required default export")
  ) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args: any[]) => {
  const message = String(args[0] || "");
  if (
    message.includes("Unable to activate keep awake") ||
    message.includes("Route") ||
    message.includes("missing the required default export")
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Also suppress the error globally
if (typeof global !== "undefined") {
  const originalErrorHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
  if ((global as any).ErrorUtils) {
    (global as any).ErrorUtils.setGlobalHandler(
      (error: any, isFatal: boolean) => {
        const message = String(error?.message || "");
        if (message.includes("Unable to activate keep awake")) {
          return;
        }
        if (originalErrorHandler) {
          originalErrorHandler(error, isFatal);
        }
      },
    );
  }
}

// Keep splash screen visible while app initializes
SplashScreen.preventAutoHideAsync();

import { AuthProvider } from "@/app/context/AuthContext";
import { GamificationProvider } from "@/app/context/GamificationContext";
import { AvatarProvider } from "@/context/AvatarContext";
import { AvatarUpdateProvider } from "@/context/AvatarUpdateContext";
import { OnboardingAvatarProvider } from "@/context/OnboardingAvatarContext";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { PostOnboardingProvider } from "@/context/PostOnboardingContext";
import { ThemeProvider as CustomThemeProvider } from "@/context/ThemeContext";
import { TimeCapsuleProvider } from "@/context/TimeCapsuleContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Linking from "expo-linking";

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🔴 App Error:", error);
    console.error("Error Info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000",
          }}
        >
          <View
            style={{
              padding: 20,
              backgroundColor: "#1a1a1a",
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, marginBottom: 10 }}>
              App Error
            </Text>
            <Text style={{ color: "#ff6b6b", fontSize: 12 }}>
              {this.state.error?.message || "Unknown error"}
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    // Hide splash screen once layout is mounted
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    // Handle deep links
    const handleDeepLink = async ({ url }: { url: string }) => {
      console.log("🔗 Deep link received:", url);
      try {
        // Supabase sends tokens in the hash fragment: kyvo://#access_token=...
        const hashIndex = url.indexOf("#");
        const queryIndex = url.indexOf("?");

        let paramString = "";
        if (hashIndex !== -1) {
          paramString = url.substring(hashIndex + 1);
        } else if (queryIndex !== -1) {
          paramString = url.substring(queryIndex + 1);
        }

        if (!paramString) return;

        const params = Object.fromEntries(new URLSearchParams(paramString));
        console.log("🔗 Parsed params type:", params.type);

        if (params.access_token || params.token_hash || params.type === "signup" || params.type === "recovery") {
          console.log("🔗 Routing to callback");
          
          // Store params in AsyncStorage so callback screen can access them
          const AsyncStorage = await import("@react-native-async-storage/async-storage");
          await AsyncStorage.default.setItem("auth_callback_params", JSON.stringify(params));
          
          // Navigate to callback screen
          router.replace("/screens/authentication/callback");
        }
      } catch (error) {
        console.error("Deep link error:", error);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle cold start deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🔗 Initial URL:", url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <AuthProvider>
      <CustomThemeProvider>
        <PermissionsProvider>
          <TimeCapsuleProvider>
            <AvatarProvider>
              <OnboardingAvatarProvider>
                <AvatarUpdateProvider>
                  <PostOnboardingProvider>
                    <GamificationProvider>
                      <ThemeProvider
                        value={
                          colorScheme === "dark" ? DarkTheme : DefaultTheme
                        }
                      >
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="index" />
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen
                            name="modal"
                            options={{ presentation: "modal" }}
                          />
                          <Stack.Screen name="screens" />
                        </Stack>
                        <StatusBar style="auto" />
                      </ThemeProvider>
                    </GamificationProvider>
                  </PostOnboardingProvider>
                </AvatarUpdateProvider>
              </OnboardingAvatarProvider>
            </AvatarProvider>
          </TimeCapsuleProvider>
        </PermissionsProvider>
      </CustomThemeProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RootLayoutContent />
    </ErrorBoundary>
  );
}
