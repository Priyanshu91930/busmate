import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

import clgLogo from '../assets/images/clg.png';
import shapeBg1 from '../assets/images/Ellipse 18.png';
import shapeBg2 from '../assets/images/Ellipse 19.png';
import shapeBg3 from '../assets/images/Ellipse 20.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const phoneWidth = Math.min(screenWidth * 0.9, 360);
const phoneHeight = Math.min(screenHeight * 0.95, 800);

// Splash Content Component
const SplashContent = () => {
  return (
    <View style={styles.contentContainer}>
      <Image source={clgLogo} style={styles.clgLogo} resizeMode="contain" />
      <Text style={styles.title}>
        BUS TRACKER
      </Text>
    </View>
  );
};

// Main Splash Screen Component
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.phoneContainer}>
        <View style={[styles.backgroundContainer, styles.shapeClipper]}>
          {/* Main card shadow (Ellipse 18) */}
          <Image source={shapeBg1} style={{ position: 'absolute', top: 123, left: 0, width: '100%', height: '69%', zIndex: -4 }} resizeMode="stretch" />
          {/* Main card (Ellipse 19) */}
          <Image source={shapeBg2} style={{ position: 'absolute', top: 175, left: 0, width: '100%', height: '52%', zIndex: 1 }} resizeMode="stretch" />
          {/* Floating shape (Ellipse 20) */}
          <Image source={shapeBg3} style={{ position: 'absolute', top: 20.352, left: 284.256, width: 99.36, height: 99.36, zIndex: 3 }} resizeMode="contain" />
        </View>
        <View style={styles.centerContent}>
          <SplashContent />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c4a6e',
  },
  phoneContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0c4a6e',
    borderRadius: 0,
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shapeClipper: {
    borderRadius: 0,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    transform: [{ rotate: '0deg' }],
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    letterSpacing: 0,
    lineHeight: 28,
    fontFamily: 'System',
    marginTop: 0,
  },
  clgLogo: {
    width: 120,
    height: 120,
    marginBottom: 16,
    alignSelf: 'center',
    marginTop: 0,
  },
});
