import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Import the functions you need from the SDKs you need
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

// Get the centralized Firebase app instance
const app = getApp();
// Initialize Firestore
const db = getFirestore(app);


// --- Placeholder Map Screen Component ---
const MapViewScreen = () => {
    const router = useRouter();
    return (
        <View style={styles.mapScreenContainer}>
            <Pressable onPress={() => router.back()} style={styles.mapBackButton}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <Ionicons name="bus" size={80} color="#3B82F6" />
            <Text style={styles.mapScreenText}>Map View</Text>
            <Text style={styles.mapScreenSubText}>
                Student would see the driver's location here as a moving bus icon.
            </Text>
        </View>
    );
};


// Placeholder profile image (you can replace with actual image import)
const profileImage = require('../../assets/images/clg.png');

export default function DriverDashboard() {
  const router = useRouter();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false); 
  
  const locationInterval = useRef(null);

  useEffect(() => {
    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, []);

  const menuItems = [
    { icon: 'bus', label: 'Trips', color: '#10B981' },
    { icon: 'image', label: 'Gallery', color: '#F59E0B' },
    { icon: 'lock-closed', label: 'Shop', color: '#3B82F6' },
    { icon: 'stats-chart', label: 'Report', color: '#8B5CF6' },
    { icon: 'accessibility-outline', label: 'Seat', color: '#EF4444' }, // Fixed icon
    { 
      icon: isSharingLocation ? 'radio-button-on' : 'paper-plane', 
      label: isSharingLocation ? 'Stop Sharing' : 'Share Location', 
      color: isSharingLocation ? '#EF4444' : '#10B981'
    },
    { icon: 'card', label: 'Credit', color: '#0EA5E9' },
    { icon: 'map', label: 'Map', color: '#14B8A6' },
    { icon: 'calendar', label: 'Calendar', color: '#6366F1' },
  ];

  const startSharingLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied.');
      return;
    }

    setIsSharingLocation(true);
    locationInterval.current = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        console.log(`Sending to Firestore - Lat: ${latitude}, Long: ${longitude}`);

        // --- WRITING TO FIRESTORE ---
        // Using a hardcoded ID for this example. In a real app,
        // this would be the authenticated driver's unique ID.
        const driverId = "driver_123";
        const locationDocRef = doc(db, "driverLocations", driverId);
        
        await setDoc(locationDocRef, {
          latitude: latitude,
          longitude: longitude,
          timestamp: new Date(),
          active: true // Indicate that the driver is online and sharing
        });
      } catch (error) {
        console.error("Failed to get or send location:", error);
        stopSharingLocation(); // Stop if there's an error
      }
    }, 5000);
  };

  const stopSharingLocation = async () => {
    setIsSharingLocation(false);
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
    
    // --- UPDATING FIRESTORE STATUS ---
    // Mark the driver as inactive in Firestore
    const driverId = "driver_123";
    const locationDocRef = doc(db, "driverLocations", driverId);
    try {
      // Use merge: true to only update the 'active' field without overwriting location data
      await setDoc(locationDocRef, { active: false }, { merge: true });
      console.log('Stopped sharing location. Status updated in Firestore.');
    } catch (error) {
      console.error("Failed to update driver status in Firestore:", error);
    }
  };

  const handleMenuItemPress = (label: string) => {
    switch(label) {
      case 'Seat':
        router.push('/driver/seat-selection');
        break;
      case 'Share Location':
        startSharingLocation();
        break;
      case 'Stop Sharing':
        stopSharingLocation();
        break;
      case 'Map':
        setShowMap(true); 
        break;
      default:
        console.log(`Pressed ${label}`);
    }
  };
  
  if (showMap) {
      return <MapViewScreen />;
  }

  const ProfileMenu = () => {
    const menuOptions = [
      { label: 'Profile', icon: 'person', onPress: () => {} },
      { label: 'Settings', icon: 'settings', onPress: () => {} },
      { label: 'Logout', icon: 'log-out', onPress: () => router.replace('/login') }
    ];

    return (
      <Modal
        transparent={true}
        visible={isProfileMenuVisible}
        onRequestClose={() => setIsProfileMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsProfileMenuVisible(false)}
        >
          <View style={styles.profileMenuContainer}>
            {menuOptions.map((option, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.profileMenuItem}
                onPress={() => {
                  option.onPress();
                  setIsProfileMenuVisible(false);
                }}
              >
                <Ionicons name={option.icon as any} size={20} color="#333" />
                <Text style={styles.profileMenuItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        
        <Pressable 
          style={styles.profileButton}
          onPress={() => setIsProfileMenuVisible(true)}
        >
          <Text style={styles.profileButtonText}>Elina</Text>
        </Pressable>
      </View>

      {/* Profile Section */}
      <View style={styles.profileContainer}>
        <Image source={profileImage} style={styles.profileImage} />
        <Text style={styles.profileName}>Elina Watson</Text>
        <Text style={styles.profileEmail}>elina.watson@gmail.com</Text>
        
        {/* Profile Details */}
        <View style={styles.profileDetailsContainer}>
          <View style={styles.profileDetail}>
            <Text style={styles.profileDetailLabel}>Gender</Text>
            <Text style={styles.profileDetailValue}>Male</Text>
          </View>
          <View style={styles.profileDetail}>
            <Text style={styles.profileDetailLabel}>Age</Text>
            <Text style={styles.profileDetailValue}>27 Years</Text>
          </View>
          <View style={styles.profileDetail}>
            <Text style={styles.profileDetailLabel}>Country</Text>
            <Text style={styles.profileDetailValue}>Denmark</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput 
            placeholder="Searching for..." 
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput} 
          />
        </View>
      </View>

      {/* Dashboard Grid */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {menuItems.map((item, index) => (
          <Pressable 
            key={index} 
            style={[styles.gridItem, { backgroundColor: item.color }]}
            onPress={() => handleMenuItemPress(item.label)}
          >
            <Ionicons name={item.icon as any} size={24} color="white" />
            <Text style={styles.gridItemText}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Profile Menu Modal */}
      <ProfileMenu />
    </View>
  );
}

// All styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 30,
    elevation: 3,
  },
  profileButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileEmail: {
    color: '#6B7280',
    marginBottom: 15,
  },
  profileDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  profileDetail: {
    alignItems: 'center',
  },
  profileDetailLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  profileDetailValue: {
    color: '#1F2937',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 15,
    width: '90%',
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    margin: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemText: {
    color: 'white',
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  profileMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: 200,
    elevation: 5,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileMenuItemText: {
    marginLeft: 10,
    color: '#1F2937',
  },
  mapScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  mapScreenText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  mapScreenSubText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  mapBackButton: {
      position: 'absolute',
      top: 40,
      left: 20,
      padding: 10,
      backgroundColor: 'white',
      borderRadius: 25,
      elevation: 5,
  },
});