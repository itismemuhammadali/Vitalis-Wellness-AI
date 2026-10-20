import { Stack } from 'expo-router';

export default function PostOnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="question-1" />
      <Stack.Screen name="question-2" />
      <Stack.Screen name="question-3" />
      <Stack.Screen name="question-4" />
      <Stack.Screen name="question-5" />
      <Stack.Screen name="question-6" />
      <Stack.Screen name="question-7" />
      <Stack.Screen name="question-8" />
      <Stack.Screen name="question-9" />
      <Stack.Screen name="question-10" />
      <Stack.Screen name="question-11" />
    </Stack>
  );
}
