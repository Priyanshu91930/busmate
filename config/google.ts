// Google Sign-In Configuration
// These values are loaded from your .env file

export const GOOGLE_CONFIG = {
  // Web Client ID from Firebase Console > Project Settings > General > Your Apps > Web App
  WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  
  // iOS URL Scheme (for iOS deep linking)
  IOS_URL_SCHEME: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME || '',
  
  // Android Package Name (should match your app.json)
  ANDROID_PACKAGE_NAME: process.env.EXPO_PUBLIC_ANDROID_PACKAGE_NAME || 'com.anonymous.bus_tracker',
};

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};
