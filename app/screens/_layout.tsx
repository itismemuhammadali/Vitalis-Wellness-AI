import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="authentication" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="home" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="create-avatar" />
      <Stack.Screen name="sealed-capsules" />
      <Stack.Screen name="time-capsules" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="camera-preview" />
      <Stack.Screen name="better-self-chat" />
    </Stack>
  );
}
