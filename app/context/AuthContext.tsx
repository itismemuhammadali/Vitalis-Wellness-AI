import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  session: Session | null;
  user: any | null;
  loading: boolean;
  onboardingCompleted: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to check if all onboarding data exists
async function checkOnboardingDataCompletion(userId: string): Promise<boolean> {
  try {
    const [notificationsRes, aspirationsRes, capsulesRes, userDataRes] =
      await Promise.all([
        (supabase.from("fcm_tokens") as any)
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle(),
        (supabase.from("aspirations") as any)
          .select("id, deadline")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
        (supabase.from("time_capsules") as any)
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle(),
        (supabase.from("users") as any)
          .select("avatar_url, better_self_avatar_url")
          .eq("id", userId)
          .limit(1)
          .maybeSingle(),
      ]);

    const hasNotifications = !!notificationsRes.data;
    const hasAspirations = !!aspirationsRes.data;
    const hasDeadline = !!aspirationsRes.data?.deadline;
    const hasTimeCapsules = !!capsulesRes.data;
    const hasAvatar = !!userDataRes.data?.avatar_url;
    const hasBetterSelfAvatar = !!userDataRes.data?.better_self_avatar_url;

    const isComplete =
      hasNotifications &&
      hasAspirations &&
      hasDeadline &&
      hasTimeCapsules &&
      hasAvatar &&
      hasBetterSelfAvatar;

    console.log("📋 Onboarding data check:", {
      hasNotifications,
      hasAspirations,
      hasDeadline,
      hasTimeCapsules,
      hasAvatar,
      hasBetterSelfAvatar,
      isComplete,
    });

    console.log(
      isComplete ? "✅ All onboarding data exists" : "⚠️ Onboarding incomplete",
    );
    return isComplete;
  } catch (error) {
    console.error("Error checking onboarding data:", error);
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        // Check if onboarding is completed by validating actual data
        if (session?.user?.id) {
          console.log(
            "🔍 Checking onboarding data completion for user:",
            session.user.id,
          );
          const isComplete = await checkOnboardingDataCompletion(
            session.user.id,
          );
          setOnboardingCompleted(isComplete);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Check onboarding status on auth state change
      if (session?.user?.id) {
        (async () => {
          const isComplete = await checkOnboardingDataCompletion(
            session.user.id,
          );
          setOnboardingCompleted(isComplete);
        })();
      } else {
        setOnboardingCompleted(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);

      console.log("📝 Step 1: Creating auth entry for", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("❌ Auth signup failed:", error);
        throw error;
      }

      console.log("✅ Auth entry created with ID:", data?.user?.id);

      // Step 2: Create user profile in public.users table
      if (data?.user) {
        console.log("📝 Step 2: Creating user profile in public.users table");

        const userData = {
          id: data.user.id,
          email: email,
          full_name: fullName,
        };

        console.log("📊 User data to insert:", userData);

        // Wait a moment for auth to be fully established
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Try to insert with the authenticated session
        const { error: insertError } = await (
          supabase.from("users") as any
        ).insert([userData]);

        if (insertError) {
          console.error("❌ Insert failed:", insertError);
          const { error: upsertError } = await (
            supabase.from("users") as any
          ).upsert([userData], { onConflict: "id" });
          if (upsertError) {
            console.error("❌ Upsert also failed:", upsertError);
            throw new Error(
              `Failed to save user profile: ${upsertError.message}`,
            );
          }
          console.log("✅ User profile saved successfully via upsert");
        } else {
          console.log("✅ User profile saved successfully to public.users");
        }

        // Create user_preferences row
        await (supabase.from("user_preferences") as any).upsert(
          [{ user_id: data.user.id, notifications_enabled: true }],
          { onConflict: "user_id" },
        );
      }

      // Do NOT sign out — keep session so email confirmation auto signs them in
      console.log("✅ Signup complete — waiting for email confirmation");
    } catch (error: any) {
      console.error("❌ Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("✅ Sign in successful for:", email);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_APP_URL}/screens/authentication/callback`,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        onboardingCompleted,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
