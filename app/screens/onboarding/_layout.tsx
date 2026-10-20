import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="notification-permission" />
      <Stack.Screen name="aspiration" />
      <Stack.Screen name="deadline" />
      <Stack.Screen name="avatar-creation" />
      <Stack.Screen name="time-capsule" />
    </Stack>
  );
}
