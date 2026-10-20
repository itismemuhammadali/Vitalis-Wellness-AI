import { useAuth } from "@/app/context/AuthContext";
import * as Linking from "expo-linking";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
  const { session, loading, onboardingCompleted } = useAuth();
  const [checkingDeepLink, setCheckingDeepLink] = useState(true);

  useEffect(() => {
    // Check if app was opened via a deep link (email confirmation)
    Linking.getInitialURL().then((url) => {
      if (url && (url.includes("access_token") || url.includes("token_hash") || url.includes("type=signup") || url.includes("type=recovery"))) {
        // Deep link with auth tokens — let the callback screen handle it
        // Don't redirect, just wait
        setCheckingDeepLink(true);
      } else {
        setCheckingDeepLink(false);
      }
    });
  }, []);

  if (loading || checkingDeepLink) {
    return null; // Stay on splash while deep link or auth loads
  }

  if (!session) {
    return <Redirect href="/screens/authentication/login" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/screens/onboarding/welcome" />;
  }

  return <Redirect href="/screens/home" />;
}
