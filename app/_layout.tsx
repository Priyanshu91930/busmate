import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // --- STEP 1: Wait until all loading is complete ---
    if (isAuthLoading) {
      return; // Do nothing until we know the auth state
    }

    const currentSegment = segments[0] ?? '';
    const inStudentSection = currentSegment === 'student';
    const inDriverSection = currentSegment === 'driver';

    // --- STEP 2: Handle LOGGED-IN users ---
    if (user) {
      // Once logged in, hide the native splash immediately.
      SplashScreen.hideAsync();
      
      if (user.role === 'student' && !inStudentSection) {
        console.log('🚀 LOGGED IN as STUDENT -> NAVIGATING to dashboard');
        router.replace('/student/dashboard');
      } else if (user.role === 'driver' && !inDriverSection) {
        console.log('🚀 LOGGED IN as DRIVER -> NAVIGATING to dashboard');
        router.replace('/driver/dashboard');
      }
      return; // End the effect here for logged-in users
    }

    // --- STEP 3: Handle LOGGED-OUT users ---
    // If we reach this point, it means user is null.
    
    // If they are trying to access a protected page, kick them out instantly.
    if (inStudentSection || inDriverSection) {
      console.log('🚫 LOGGED OUT user in protected area -> REDIRECTING to login');
      router.replace('/login');
      return;
    }

    // If they are at the entry point (index.tsx), handle the custom splash screen timer.
    if (segments.length === 0) { // segments is empty only at the root ('/')
      console.log('🕒 LOGGED OUT at root -> Showing custom splash screen');
      // 1. Hide the native splash to show our custom JS splash screen.
      SplashScreen.hideAsync();
      
      // 2. Wait for 5 seconds on the custom splash.
      const timer = setTimeout(() => {
        console.log('🚀 Splash timer finished -> NAVIGATING to login');
        router.replace('/login');
      }, 5000); // 5-second delay

      return () => clearTimeout(timer); // Cleanup timer
    }

  }, [user, isAuthLoading, segments]);


  if (isAuthLoading) {
    // This spinner is only visible for a moment between font loading and auth check.
    // The native splash covers most of it.
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  // Define the navigator using the actual directory structure
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="student" options={{ headerShown: false }} />
      <Stack.Screen name="driver" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // This layout no longer hides the splash screen itself.
  // The InitialLayout now has full control.
  // useEffect(() => {
  //   if (loaded) SplashScreen.hideAsync(); // This line is removed
  // }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}