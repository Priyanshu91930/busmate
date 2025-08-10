import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
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
