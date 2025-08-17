import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, Alert, ActivityIndicator } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getFirestore, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../context/AuthContext';
import { GOOGLE_CONFIG } from '../config/google';

// Use require for the image to avoid TypeScript issues
const clgLogo = require('../assets/images/clg.png');

// Define the roles
type UserRole = 'student' | 'driver';

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState('Checking...');

  useEffect(() => {
    console.log('🔍 LoginScreen useEffect - Checking configuration...');
    console.log('🔍 GOOGLE_CONFIG.WEB_CLIENT_ID:', GOOGLE_CONFIG.WEB_CLIENT_ID);
    
    // Validate that required environment variables are loaded
    if (!GOOGLE_CONFIG.WEB_CLIENT_ID) {
      console.error('❌ Google Web Client ID is missing!');
      setConfigStatus('❌ MISSING - Check .env file');
      Alert.alert(
        "Configuration Error", 
        "Google Web Client ID is missing. Please check your .env file and ensure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set.",
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('✅ Google Web Client ID found, configuring Google Sign-In...');
    setConfigStatus('✅ LOADED');
    
    // Configure Google Sign-In with your Firebase project's web client ID
    GoogleSignin.configure({
      webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
    
    console.log('✅ Google Sign-In configured successfully');
  }, []);

  const handleGoogleSignIn = async (role: UserRole) => {
    console.log('🚀 Starting Google Sign-In Process');
    console.log('🔍 Configuration Details:', {
      webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
      androidPackageName: GOOGLE_CONFIG.ANDROID_PACKAGE_NAME,
      role: role
    });

    setIsLoading(true);
    
    try {
      // Comprehensive Play Services Check
      console.log('🔍 Checking Google Play Services...');
      await GoogleSignin.hasPlayServices({
        showIfNotAvailable: true,
        showPlayServicesUpdateDialog: true
      });
      console.log('✅ Google Play Services Available');

      // Detailed Google Sign-In Configuration
      console.log('🔍 Configuring Google Sign-In...');
      await GoogleSignin.configure({
        webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email']
      });
      console.log('✅ Google Sign-In Configured Successfully');

      // Attempt Sign-In
      console.log('🔍 Initiating Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ User Info Received:', JSON.stringify(userInfo, null, 2));

      // Get Tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('✅ Tokens Received:', JSON.stringify(tokens, null, 2));

      // Firebase Credential - IMPORTANT: Use idToken, not accessToken
      const googleCredential = GoogleAuthProvider.credential(tokens.idToken);
      console.log('✅ Firebase Credential Created');

      // Firebase Sign-In
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;
      console.log('✅ Successfully signed in to Firebase:', user.email);

      // Check if user already exists and has a role
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const existingRole = userDoc.data().role;
        if (existingRole !== role) {
          Alert.alert(
            'Role Mismatch',
            `You are already registered as a ${existingRole}. You cannot sign in as a ${role}.`,
            [{ text: 'OK' }]
          );
          // Sign out from both Google and Firebase
          await GoogleSignin.signOut();
          await auth.signOut();
          return;
        }
        console.log('User exists with matching role, proceeding...');
      } else {
        // Create new user document with the selected role
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role,
          createdAt: new Date(),
        });
        console.log('New user created with role:', role);
      }

      // IMPORTANT: Explicitly update the user's role in Firestore
      await setDoc(userDocRef, { role: role }, { merge: true });
      console.log('User role updated to:', role);

      // Explicit console log for navigation debugging
      console.log('🚀 NAVIGATION ATTEMPT:', {
        role: role,
        userEmail: user.email,
        userId: user.uid
      });

    } catch (error: any) {
      console.error('❌ COMPREHENSIVE Sign-In Error:', {
        errorType: error.constructor.name,
        code: error.code || 'NO_CODE',
        message: error.message,
        nativeErrorCode: error.nativeErrorCode,
        nativeErrorMessage: error.nativeErrorMessage,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      });
      
      // Extremely Detailed Error Handling
      const errorMessage = error.message || 'Unknown error occurred';
      Alert.alert(
        'Sign-In Error', 
        `Detailed Error:\n${errorMessage}\n\nPlease check your configuration and try again.\n\nError Code: ${error.code || 'N/A'}`,
        [{ 
          text: 'OK', 
          onPress: () => console.log('Full Error Details:', JSON.stringify(error, null, 2)) 
        }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      await auth.signOut();
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Please wait...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.logoContainer}>
        <Image 
          source={clgLogo} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>
      
      <Text style={styles.title}>Select User Type</Text>
      
      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.driverButton} 
          onPress={() => handleGoogleSignIn('driver')}
        >
          <Text style={styles.buttonText}>Sign in as Driver</Text>
        </Pressable>
        
        <Pressable 
          style={styles.studentButton} 
          onPress={() => handleGoogleSignIn('student')}
        >
          <Text style={styles.buttonText}>Sign in as Student</Text>
        </Pressable>
      </View>

      {/* Debug Section - Remove in production */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Web Client ID: {GOOGLE_CONFIG.WEB_CLIENT_ID ? `${GOOGLE_CONFIG.WEB_CLIENT_ID.substring(0, 20)}...` : 'NOT SET'}
        </Text>
        <Text style={styles.debugText}>
          Firebase Project: {process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET'}
        </Text>
        <Text style={styles.debugText}>
          Config Status: {configStatus}
        </Text>
        
        {/* Temporary bypass for testing */}
        <Pressable 
          style={[styles.debugButton]} 
          onPress={() => {
            console.log('🚀 Bypass button pressed - testing navigation');
            Alert.alert('Bypass', 'This will test navigation. Remove in production.');
          }}
        >
          <Text style={styles.debugButtonText}>🚀 TEST Navigation</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: 'black',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  driverButton: {
    backgroundColor: '#1E40AF', // Blue color for driver
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  studentButton: {
    backgroundColor: '#10B981', // Green color for student
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#333',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  debugText: {
    fontSize: 14,
    color: '#333',
  },
  debugButton: {
    marginTop: 10,
    backgroundColor: '#4285F4', // Google blue color
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
