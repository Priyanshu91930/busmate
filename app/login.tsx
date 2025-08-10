import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import clgLogo from '../assets/images/clg.png';

export default function LoginScreen() {
  const router = useRouter();

  const handleDriverSignIn = () => {
    router.push('/driver/dashboard');
  };

  const handleStudentSignIn = () => {
    router.push('/student/dashboard');
  };

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
          onPress={handleDriverSignIn}
        >
          <Text style={styles.buttonText}>Sign in as Driver</Text>
        </Pressable>
        
        <Pressable 
          style={styles.studentButton} 
          onPress={handleStudentSignIn}
        >
          <Text style={styles.buttonText}>Sign in as Student</Text>
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
});
