import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('🚨 FULL NAVIGATION DEBUG:', {
      user: user ? {
        uid: user.uid,
        email: user.email,
        role: user.role,
        displayName: user.displayName
      } : null,
      isAuthLoading,
      segments: segments,
      currentGroup: segments[0] ?? 'NO_GROUP'
    });

    if (isAuthLoading) {
      console.log('🕒 Auth is still loading, waiting...');
      return;
    }

    // Detailed group checking
    const currentGroup = segments[0] ?? '';
    const inStudentGroup = currentGroup === 'student';
    const inDriverGroup = currentGroup === 'driver';

    console.log('🔍 Group Detailed Check:', {
      currentGroup,
      inStudentGroup,
      inDriverGroup,
      userRole: user?.role
    });

    if (user) {
      // Explicit role-based navigation with detailed logging
      if (user.role === 'student') {
        console.log('🚀 STUDENT ROLE DETECTED - Attempting Navigation');
        if (!inStudentGroup) {
          console.log('🚀 FORCE NAVIGATING TO STUDENT DASHBOARD');
          router.replace('/student/dashboard');
        } else {
          console.log('🟢 Already in Student Group');
        }
      } else if (user.role === 'driver') {
        console.log('🚀 DRIVER ROLE DETECTED - Attempting Navigation');
        if (!inDriverGroup) {
          console.log('🚀 FORCE NAVIGATING TO DRIVER DASHBOARD');
          router.replace('/driver/dashboard');
        } else {
          console.log('🟢 Already in Driver Group');
        }
      } else {
        console.warn('⚠️ UNKNOWN USER ROLE:', user.role);
      }
    } else {
      console.log('🚫 NO USER - Redirecting to Login');
      router.replace('/login');
    }
  }, [user, isAuthLoading, segments]);

  if (isAuthLoading) {
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

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

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