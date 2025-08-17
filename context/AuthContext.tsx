import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, User, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config/google';

// --- NEW: Centralized Firebase Initialization ---
// 1. Firebase configuration
const firebaseConfig = FIREBASE_CONFIG;

// 2. Initialize the Firebase app safely (prevents re-initialization)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// 3. THIS IS THE FIX: Initialize Auth with persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

// --- END OF FIX ---


// --- The rest of your context logic remains the same ---

// Define the shape of our user object with the custom role
interface AuthUser extends User {
  role?: 'student' | 'driver';
}

// Define the shape of the data our context will provide
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // MODIFIED: We no longer need to initialize auth/db here.
    // The onAuthStateChanged listener will now use the persistent auth instance created above.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔍 Auth State Changed:', {
        userExists: !!firebaseUser,
        userEmail: firebaseUser?.email
      });

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        console.log('🔍 User Document:', {
          exists: userDoc.exists(),
          data: userDoc.exists() ? userDoc.data() : 'No document'
        });

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('🔍 User Role:', userData.role);
          setUser({ 
            ...firebaseUser, 
            role: userData.role 
          });
        } else {
          console.warn('🚨 User document does not exist');
          setUser(firebaseUser as AuthUser);
        }
      } else {
        console.log('🔍 No authenticated user');
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const value = { user, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// NEW: Export the initialized instances so other files (like login.tsx) can use them
export { auth, db };