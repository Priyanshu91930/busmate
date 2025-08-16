import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router'; // 1. Import SplashScreen
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react'; // 2. Import useEffect
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// 3. Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({ // Also capture error for debugging
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 4. Hide the splash screen once the fonts are loaded (or an error occurs)
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // 5. Throw the error if loading failed
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // 6. Do NOT return null. Keep rendering the layout.
  // The splash screen will cover it until fonts are loaded.
  if (!loaded) {
    return null; // Or you can return a custom loading component here if you want
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            title: 'Splash' 
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            title: 'Login' 
          }} 
        />
        <Stack.Screen 
          name="driver/dashboard" 
          options={{ 
            headerShown: false,
            title: 'Driver Dashboard' 
          }} 
        />
        <Stack.Screen 
          name="driver/seat-selection" 
          options={{ 
            headerShown: false,
            title: 'Seat Selection' 
          }} 
        />
        <Stack.Screen 
          name="student/dashboard" 
          options={{ 
            headerShown: false,
            title: 'Student Dashboard' 
          }} 
        />
        <Stack.Screen 
          name="student/map-view" 
          options={{ 
            headerShown: false,
            title: 'Map View' 
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}