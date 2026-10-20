import { Stack } from "expo-router";

export default function AuthenticationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="confirm-email" />
      <Stack.Screen name="callback" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
