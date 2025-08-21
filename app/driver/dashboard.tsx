import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

// Firebase
import { getApp } from 'firebase/app';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

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

  // --- Fetch driver data ---
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

          const bus = BusData.BUS_ROUTES.find(
            b => b.registration === profileData.assignedBusRegistration
          );
          if (bus) {
            const routeString =
              bus.stops.length > 1
                ? `${bus.stops[0]} - ${bus.stops[bus.stops.length - 1]}`
                : bus.stops[0] || 'N/A';
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
    { icon: 'bus', label: 'Trips', color: '#10B981' },
    { icon: 'image', label: 'Gallery', color: '#F59E0B' },
    { icon: 'lock-closed', label: 'Shop', color: '#3B82F6' },
    { icon: 'stats-chart', label: 'Report', color: '#8B5CF6' },
    { icon: 'accessibility-outline', label: 'Seat', color: '#EF4444' },
    {
      icon: isSharingLocation ? 'radio-button-on' : 'paper-plane',
      label: isSharingLocation ? 'Stop Sharing' : 'Share Location',
      color: isSharingLocation ? '#EF4444' : '#10B981'
    },
    { icon: 'card', label: 'Credit', color: '#0EA5E9' },
    { icon: 'map', label: 'Map', color: '#14B8A6' },
    { icon: 'calendar', label: 'Calendar', color: '#6366F1' }
  ];

  // --- Location Sharing ---
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

        if (user) {
          const locationDocRef = doc(db, 'driverLocations', user.uid);
          await setDoc(locationDocRef, {
            latitude,
            longitude,
            timestamp: new Date(),
            active: true
          });
        }
      } catch (error) {
        console.error('Failed to send location:', error);
        stopSharingLocation();
      }
    }, 5000);
  };

  const stopSharingLocation = async () => {
    setIsSharingLocation(false);
    if (locationInterval.current) clearInterval(locationInterval.current);

    if (user) {
      const locationDocRef = doc(db, 'driverLocations', user.uid);
      try {
        await setDoc(locationDocRef, { active: false }, { merge: true });
      } catch (error) {
        console.error('Failed to update status in Firestore:', error);
      }
    }
  };

  const handleMenuItemPress = (label: string) => {
    switch (label) {
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

  // --- Loading & Error States ---
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
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

  // --- Profile Menu ---
  const ProfileMenu = () => {
    const menuOptions = [
      { label: 'Profile', icon: 'person-outline', onPress: () => {} },
      { label: 'Settings', icon: 'settings-outline', onPress: () => {} },
      { label: 'Logout', icon: 'log-out-outline', onPress: () => auth.signOut() }
    ];
    return (
      <Modal
        transparent
        visible={isProfileMenuVisible}
        onRequestClose={() => setIsProfileMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsProfileMenuVisible(false)}>
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
                <Ionicons
                  name={option.icon as any}
                  size={22}
                  color={option.label === 'Logout' ? '#EF4444' : '#333'}
                />
                <Text
                  style={[
                    styles.profileMenuItemText,
                    option.label === 'Logout' && { color: '#EF4444' }
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    );
  };

  // --- Render UI ---
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <Pressable style={styles.settingsButton} onPress={() => setIsProfileMenuVisible(true)}>
          <Ionicons name="settings-outline" size={24} color="black" />
        </Pressable>
      </View>

      <ScrollView>
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <Image source={{ uri: driverProfile.profilePhotoUrl }} style={styles.profileImage} />
          <Text style={styles.profileName}>{driverProfile.fullName}</Text>
          <Text style={styles.profileEmail}>{driverProfile.email}</Text>

          <View style={styles.profileDetailsContainer}>
            <View style={styles.profileDetail}>
              <Text style={styles.profileDetailLabel}>Gender</Text>
              <Text style={styles.profileDetailValue}>{driverProfile.gender}</Text>
            </View>
            <View style={styles.profileDetail}>
              <Text style={styles.profileDetailLabel}>Phone</Text>
              <Text style={styles.profileDetailValue}>{driverProfile.phoneNumber}</Text>
            </View>
            <View style={styles.profileDetail}>
              <Text style={styles.profileDetailLabel}>Bus No.</Text>
              <Text style={styles.profileDetailValue}>#{assignedBus?.number || 'N/A'}</Text>
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
  profileContainer: { alignItems: 'center', paddingVertical: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  profileEmail: { color: '#6B7280', marginBottom: 15 },
  profileDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15
  },
  profileDetail: { alignItems: 'center' },
  profileDetailLabel: { color: '#6B7280', fontSize: 12 },
  profileDetailValue: { color: '#1F2937', fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 15,
    width: '90%',
    height: 45
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 20
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    margin: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gridItemText: { color: 'white', marginTop: 5, fontSize: 12, textAlign: 'center' },
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
  mapBackButton: { position: 'absolute', top: 40, left: 20, padding: 10, backgroundColor: 'white', borderRadius: 25, elevation: 5 }
});
