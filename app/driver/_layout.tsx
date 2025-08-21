import { Stack } from 'expo-router';
import { getAuth } from 'firebase/auth';

export default function DriverLayout() {
  const auth = getAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RegistrationForm" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="seat-selection" />
    </Stack>
  );
}
