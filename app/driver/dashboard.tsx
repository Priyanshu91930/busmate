import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// MODIFICATION: Added 'collection' and 'addDoc' for logging
import { getApp } from 'firebase/app';
import { addDoc, collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

// Auth + BusData
import { auth, useAuth } from '../../context/AuthContext';
import BusData from '../bus_data.json';

// Firebase init
const app = getApp();
const db = getFirestore(app);

// --- Driver profile type ---
interface DriverProfile {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: 'Male' | 'Female';
  address: string;
  assignedBusRegistration: string;
  profilePhotoUrl: string;
}

// --- Map Screen ---
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

export default function DriverDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [assignedBus, setAssignedBus] = useState<{ number: string; route: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const locationInterval = useRef<any>(null);

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const driverDocRef = doc(db, 'drivers', user.uid);
        const driverDoc = await getDoc(driverDocRef);
        if (driverDoc.exists()) {
          const profileData = driverDoc.data() as DriverProfile;
          setDriverProfile(profileData);
          const bus = BusData.BUS_ROUTES.find(b => b.registration === profileData.assignedBusRegistration);
          if (bus) {
            const routeString = bus.stops.length > 1 ? `${bus.stops[0]} - ${bus.stops[bus.stops.length - 1]}` : bus.stops[0] || 'N/A';
            setAssignedBus({ number: bus.busNumber, route: routeString });
          }
        } else {
          router.replace('/driver/RegistrationForm');
        }
      } catch (error) {
        console.error('Failed to fetch driver data:', error);
        Alert.alert('Error', 'Could not load profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDriverData();
    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [user]);

  const menuItems = [
    { icon: 'shield-checkmark-outline', label: 'SOS', color: '#EF4444', action: 'SOS' },
    // --- ICON FIX: Replaced invalid icon name ---
    { icon: 'car-sport-outline', label: 'Accident Alert', color: '#F59E0B', action: 'Accident Alert' },
    { icon: 'videocam-outline', label: 'Dashcam', color: '#3B82F6', action: 'Dashcam' },
    { icon: 'people-outline', label: 'Contact Buses', color: '#8B5CF6', action: 'Contact Buses' },
    { icon: 'map-outline', label: 'Map View', color: '#14B8A6', action: 'Map' },
    { icon: 'document-text-outline', label: 'Reports', color: '#059669', action: 'Reports' },
  ];

  const startSharingLocation = async () => {
    if (!user) {
      Alert.alert("Authentication Error", "Cannot share location without being logged in.");
      return;
    }

    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location access is needed to share the bus position. Please enable it in your phone settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    setIsSharingLocation(true);
    Alert.alert("Trip Started", "Your location is now being shared.");

    locationInterval.current = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const driverId = user.uid;
        
        const locationDocRef = doc(db, 'driverLocations', driverId);
        const logCollectionRef = collection(db, 'driverLocations', driverId, 'logs');

        const liveLocationData = {
          latitude, longitude,
          timestamp: new Date(),
          active: true,
          busNumber: assignedBus?.number || 'N/A',
          route: assignedBus?.route || 'N/A',
          driverName: driverProfile?.fullName || 'Unknown Driver'
        };

        const logData = {
            latitude, longitude,
            timestamp: new Date(),
        };

        // This will now work because of the new security rules
        await Promise.all([
            setDoc(locationDocRef, liveLocationData),
            addDoc(logCollectionRef, logData)
        ]);

      } catch (error) {
        console.error('Failed to send location:', error);
        stopSharingLocation();
      }
    }, 5000);
  };

  const stopSharingLocation = async () => {
    setIsSharingLocation(false);
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
    }
    if (user) {
      const driverId = user.uid;
      const locationDocRef = doc(db, 'driverLocations', driverId);
      try {
        await setDoc(locationDocRef, { active: false }, { merge: true });
        Alert.alert("Trip Ended", "Location sharing has been stopped.");
      } catch (error) {
        console.error('Failed to update status in Firestore:', error);
      }
    }
  };

  const handleMenuItemPress = (label: string) => {
    switch (label) {
      case 'Map': setShowMap(true); break;
      case 'Dashcam': router.push('/driver/dashcam'); break;
      case 'SOS': Alert.alert('SOS Activated', 'Emergency services have been notified.'); break;
      case 'Accident Alert': Alert.alert('Accident Detection', 'This feature is under development.'); break;
      case 'Contact Buses': Alert.alert('Contact Buses', 'This feature is under development.'); break;
      case 'Reports': Alert.alert('Reports', 'This feature is under development.'); break;
      default: console.log(`Pressed ${label}`);
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (!driverProfile) {
    return (
      <View style={styles.center}>
        <Text>Could not load driver profile.</Text>
        <TouchableOpacity onPress={() => auth.signOut()} style={{ marginTop: 20 }}>
          <Text style={{ color: 'red' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showMap) return <MapViewScreen />;

  const ProfileMenu = () => {
    const menuOptions = [
      { label: 'Profile', icon: 'person-outline', onPress: () => {} },
      { label: 'Settings', icon: 'settings-outline', onPress: () => {} },
      { label: 'Logout', icon: 'log-out-outline', onPress: () => auth.signOut() }
    ];
    return (
      <Modal transparent visible={isProfileMenuVisible} onRequestClose={() => setIsProfileMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsProfileMenuVisible(false)}>
          <View style={styles.profileMenuContainer}>
            {menuOptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.profileMenuItem} onPress={() => { option.onPress(); setIsProfileMenuVisible(false); }}>
                <Ionicons name={option.icon as any} size={22} color={option.label === 'Logout' ? '#EF4444' : '#333'} />
                <Text style={[styles.profileMenuItemText, option.label === 'Logout' && { color: '#EF4444' }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <Pressable style={styles.settingsButton} onPress={() => setIsProfileMenuVisible(true)}>
          <Ionicons name="settings-outline" size={24} color="black" />
        </Pressable>
      </View>

      <ScrollView>
        <View style={styles.profileContainer}>
          <Image source={{ uri: driverProfile.profilePhotoUrl }} style={styles.profileImage} />
          <Text style={styles.profileName}>{driverProfile.fullName}</Text>
          <Text style={styles.profileEmail}>{driverProfile.email}</Text>
          <View style={styles.profileDetailsContainer}>
            <View style={styles.profileDetail}><Text style={styles.profileDetailLabel}>Gender</Text><Text style={styles.profileDetailValue}>{driverProfile.gender}</Text></View>
            <View style={styles.profileDetail}><Text style={styles.profileDetailLabel}>Phone</Text><Text style={styles.profileDetailValue}>{driverProfile.phoneNumber}</Text></View>
            <View style={styles.profileDetail}><Text style={styles.profileDetailLabel}>Bus No.</Text><Text style={styles.profileDetailValue}>#{assignedBus?.number || 'N/A'}</Text></View>
          </View>
        </View>

        <View style={styles.locationButtonContainer}>
          <TouchableOpacity style={[styles.locationButton, { backgroundColor: isSharingLocation ? '#D32F2F' : '#388E3C' }]} onPress={isSharingLocation ? stopSharingLocation : startSharingLocation}>
            <Ionicons name={isSharingLocation ? "stop-circle-outline" : "navigate-circle-outline"} size={24} color="white" />
            <Text style={styles.locationButtonText}>{isSharingLocation ? 'Stop Sharing Location' : 'Start Sharing Location'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {menuItems.map((item, index) => (
            <Pressable key={index} style={[styles.gridItem, { backgroundColor: item.color }]} onPress={() => handleMenuItemPress(item.action || item.label)}>
              <Ionicons name={item.icon as any} size={32} color="white" />
              <Text style={styles.gridItemText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ProfileMenu />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  settingsButton: { padding: 5 },
  profileContainer: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  profileEmail: { color: '#6B7280', marginBottom: 15 },
  profileDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 5
  },
  profileDetail: { alignItems: 'center' },
  profileDetailLabel: { color: '#6B7280', fontSize: 12 },
  profileDetailValue: { color: '#1F2937', fontWeight: '600' },

  locationButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  gridItemText: {
      color: 'white',
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center'
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20
  },
  profileMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: 200,
    elevation: 5
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  profileMenuItemText: { marginLeft: 10, color: '#1F2937' },
  mapScreenContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  mapScreenText: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  mapScreenSubText: { fontSize: 16, color: '#6B7280', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  mapBackButton: { position: 'absolute', top: 40, left: 20, padding: 10, backgroundColor: 'white', borderRadius: 25, elevation: 5 },
});