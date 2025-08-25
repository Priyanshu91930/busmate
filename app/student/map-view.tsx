import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal, // <-- MODIFIED
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getApp } from 'firebase/app';
// --- MODIFIED: Added collection and query for multi-document listening ---
import { collection, getFirestore, onSnapshot, query } from 'firebase/firestore';
import BusData from '../bus_data.json';
const decode = require('polyline-decode');

import { auth, useAuth } from '../../context/AuthContext';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const app = getApp();
const db = getFirestore(app);

// --- TYPE DEFINITIONS & CONSTANTS ---
interface Coords { latitude: number; longitude: number; }
interface LocationPoint extends Coords { name: string; }
interface BusRoute { registration: string; busNumber: string; stops: string[]; }

// --- ADDED: Type definition for a live bus from Firestore ---
interface LiveBus {
  id: string; // Document ID from Firestore
  latitude: number;
  longitude: number;
  active: boolean;
  driverName: string;
  busNumber: string;
  route: string;
  lastUpdate: {
    seconds: number;
    nanoseconds: number;
  };
}

const PANEL_HEIGHT = 400;
const DESTINATION_NAME = BusData.GRAPHIC_ERA_UNIVERSITY.name;

export default function MapViewWithBusSelection() {
  const params = useLocalSearchParams();
  const { name: initialStartName } = params;

  const { user } = useAuth();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  // --- Original states ---
  const [isMapReady, setIsMapReady] = useState(false);
  const [startLocationName, setStartLocationName] = useState<string | null>(null);
  const [startCoords, setStartCoords] = useState<Coords | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coords | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(true);
  const [routePolyline, setRoutePolyline] = useState<Coords[]>([]);
  const [relevantBuses, setRelevantBuses] = useState<BusRoute[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusRoute | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [stopCoordinates, setStopCoordinates] = useState<LocationPoint[]>([]);

  // --- NEW STATE: To hold all live bus data from Firestore ---
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);

  // --- NEW STATE: To control the bus details modal ---
  const [selectedBusDetails, setSelectedBusDetails] = useState<LiveBus | null>(null);

  // --- Original functions (geocodeLocation, etc.) are unchanged ---
  const geocodeLocation = async (locationName: string): Promise<Coords | null> => {
    if (!GOOGLE_MAPS_API_KEY) { console.error("Google Maps API Key is missing."); return null; }
    const fullAddress = `${locationName}, Dehradun, India`;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === 'OK' && json.results.length > 0) {
        const { lat, lng } = json.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      } else { console.warn(`Geocoding failed for "${fullAddress}": ${json.status}`); return null; }
    } catch (error) { console.error("Failed to geocode location:", error); return null; }
  };
  
  // --- This useEffect is completely new and replaces the old one for a single driver ---
  useEffect(() => {
    const driverLocationsRef = collection(db, "driverLocations");
    const q = query(driverLocationsRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const buses: LiveBus[] = [];
      querySnapshot.forEach((doc) => {
        // Here we cast the document data to our LiveBus type
        buses.push({ id: doc.id, ...doc.data() } as LiveBus);
      });
      setLiveBuses(buses); // Update state with all buses
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);


  // --- All other original useEffects and functions are preserved ---
  useEffect(() => {
    const setupInitialLocations = async () => {
      setIsGeocoding(true);
      const destGeocoded = await geocodeLocation(DESTINATION_NAME);
      setDestinationCoords(destGeocoded);

      if (initialStartName && typeof initialStartName === 'string') {
        setStartLocationName(initialStartName);
        const startGeocoded = await geocodeLocation(initialStartName);
        setStartCoords(startGeocoded);

        const busesForStop = BusData.BUS_ROUTES.filter(route => 
          route.stops.some(stop => stop.toLowerCase() === initialStartName.toLowerCase())
        );
        setRelevantBuses(busesForStop);
        if (busesForStop.length > 0) { setSelectedBus(busesForStop[0]); }
      }
    };
    setupInitialLocations().finally(() => setIsGeocoding(false));
  }, [initialStartName]);

  useEffect(() => {
    const geocodeAllStops = async () => {
        if (!selectedBus) { setStopCoordinates([]); return; }
        const geocodedStopsPromises = selectedBus.stops.map(async (stopName) => {
            const coords = await geocodeLocation(stopName);
            return coords ? { name: stopName, ...coords } : null;
        });
        const geocodedStops = (await Promise.all(geocodedStopsPromises)).filter((stop): stop is LocationPoint => stop !== null);
        setStopCoordinates(geocodedStops);
    };
    geocodeAllStops();
  }, [selectedBus]);

  useEffect(() => {
    if (selectedBus && startLocationName && stopCoordinates.length > 0) { fetchOnRoadRoute(); }
  }, [startLocationName, selectedBus, stopCoordinates]);

  const fetchOnRoadRoute = async () => {
    if (!GOOGLE_MAPS_API_KEY || !selectedBus || !startLocationName || stopCoordinates.length === 0) { setRoutePolyline([]); return; }
    const startIndex = selectedBus.stops.findIndex(stop => stop.toLowerCase() === startLocationName.toLowerCase());
    if (startIndex === -1) { console.warn("Start location is not on the selected bus route."); setRoutePolyline([]); return; }
    const origin = stopCoordinates.find(s => s.name.toLowerCase() === startLocationName.toLowerCase());
    const finalStop = stopCoordinates[stopCoordinates.length - 1];
    if (!origin || !finalStop) { console.error("Could not find coordinates for origin or final stop."); return; }
    const intermediateWaypoints = stopCoordinates.slice(startIndex + 1, stopCoordinates.length - 1).map(p => `${p.latitude},${p.longitude}`).join('|');
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${finalStop.latitude},${finalStop.longitude}`;
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}`;
    if (intermediateWaypoints.length > 0) { url += `&waypoints=optimize:true|${intermediateWaypoints}`; }
    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.routes.length > 0) {
        const points = decode(json.routes[0].overview_polyline.points).map((point: number[]) => ({ latitude: point[0], longitude: point[1] }));
        setRoutePolyline(points);
      } else { console.warn("Directions API returned no routes."); setRoutePolyline([]); }
    } catch (error) { console.error("Failed to fetch directions:", error); }
  };

  const handleFetchUserLocation = async () => {
    setIsFetchingLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable location services.');
      setIsFetchingLocation(false); return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({});
      setStartCoords(location.coords);
      let address = await Location.reverseGeocodeAsync(location.coords);
      setStartLocationName(address[0]?.name || 'My Current Location');
    } catch (error) { Alert.alert("Error", "Could not fetch your location."); } 
    finally { setIsFetchingLocation(false); }
  };
  
  const panelY = useSharedValue(0);
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: { startY: number }) => { ctx.startY = panelY.value; },
    onActive: (event, ctx) => { const newY = ctx.startY + event.translationY; panelY.value = Math.max(0, newY); },
    onEnd: (event) => { if (event.translationY > PANEL_HEIGHT / 2) { panelY.value = withSpring(PANEL_HEIGHT - 80); } else { panelY.value = withSpring(0); }},
  });
  const animatedPanelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: panelY.value }] }));

  const ProfileMenu = () => {
    if (!user) return null;
    return (
      <Modal animationType="fade" transparent={true} visible={isProfileMenuVisible} onRequestClose={() => setIsProfileMenuVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsProfileMenuVisible(false)}>
          <View style={styles.profileMenuContainer}>
            <View style={styles.profileMenuHeader}>
              <Image source={{ uri: user.photoURL || undefined }} style={styles.profileMenuImage} />
              <Text style={styles.profileMenuName}>{user.displayName}</Text>
              <Text style={styles.profileMenuEmail}>{user.email}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={() => { setIsProfileMenuVisible(false); auth.signOut(); }}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  };

  // --- ADDED: The Bus Details Modal component ---
  const BusDetailsModal = () => {
    if (!selectedBusDetails) return null;

    // Convert Firestore timestamp to a readable date string
    const lastUpdateDate = selectedBusDetails.lastUpdate 
      ? new Date(selectedBusDetails.lastUpdate.seconds * 1000).toLocaleString()
      : 'N/A';
  
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedBusDetails}
        onRequestClose={() => setSelectedBusDetails(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBusDetails(null)}>
          <View style={styles.detailsModalContainer}>
            <Text style={styles.detailsModalTitle}>Bus Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Driver:</Text>
              <Text style={styles.detailValue}>{selectedBusDetails.driverName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bus No:</Text>
              <Text style={styles.detailValue}>{selectedBusDetails.busNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Route:</Text>
              <Text style={styles.detailValue}>{selectedBusDetails.route}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, { color: selectedBusDetails.active ? '#4CAF50' : '#F44336' }]}>
                {selectedBusDetails.active ? 'Online' : 'Offline'}
              </Text>
            </View>
             <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Update:</Text>
              <Text style={styles.detailValue}>{lastUpdateDate}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedBusDetails(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bus Route</Text>
          <TouchableOpacity style={styles.profileButton} onPress={() => setIsProfileMenuVisible(true)}>
            {user?.photoURL ? ( <Image source={{ uri: user.photoURL }} style={styles.profileImage} /> ) : ( <Ionicons name="person-circle-outline" size={32} color="#4285F4" /> )}
          </TouchableOpacity>
        </View>

        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{ latitude: 30.3165, longitude: 78.0322, latitudeDelta: 0.12, longitudeDelta: 0.12 }}
          onMapReady={() => setIsMapReady(true)}
        >
          {routePolyline.length > 0 && <Polyline coordinates={routePolyline} strokeColor="#FFD700" strokeWidth={5} zIndex={1} />}
          {startCoords && <Marker coordinate={startCoords} title={startLocationName || 'Start'} pinColor="green" zIndex={3} />}
          {destinationCoords && <Marker coordinate={destinationCoords} title={DESTINATION_NAME} pinColor="red" zIndex={3} />}
          {stopCoordinates.map((stop, index) => (
            <Marker key={index} coordinate={stop} title={stop.name} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
              <View style={styles.stopMarker}><View style={styles.stopMarkerCore} /></View>
            </Marker>
          ))}
          
          {/* --- MODIFIED: Map over all live buses to render markers --- */}
          {liveBuses.map((bus) => (
            <Marker
              key={bus.id}
              coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={99}
              onPress={() => setSelectedBusDetails(bus)} // <-- Open modal on tap
            >
              <View style={[styles.statusIndicator, bus.active ? styles.online : styles.offline]}>
                 <Ionicons name="bus" size={20} color="white" />
              </View>
            </Marker>
          ))}
        </MapView>
        
        <View style={[styles.locationInputContainer, { top: 110 }]}>
          <View style={styles.inputRow}>
            <Text style={styles.locationIcon}>🟢</Text>
            <Text style={styles.inputText} numberOfLines={1}>{startLocationName || 'Choose starting point'}</Text>
            <TouchableOpacity style={styles.gpsButton} onPress={handleFetchUserLocation}>
              {isFetchingLocation ? <ActivityIndicator size="small" color="#3B82F6" /> : <Ionicons name="locate" size={22} color="#3B82F6" />}
            </TouchableOpacity>
          </View>
          <View style={styles.separator} />
          <View style={styles.inputRow}>
            <Text style={styles.locationIcon}>🔴</Text>
            <Text style={styles.inputText}>{DESTINATION_NAME}</Text>
          </View>
        </View>

        <Animated.View style={[styles.bottomContainer, animatedPanelStyle]}>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={styles.dragHandleContainer}><View style={styles.dragHandle} /></Animated.View>
          </PanGestureHandler>
          <Text style={styles.panelTitle}>Available Buses</Text>
          <ScrollView>
            {relevantBuses.length > 0 ? relevantBuses.map((bus) => (
              <TouchableOpacity key={bus.registration} style={[styles.busRow, selectedBus?.registration === bus.registration && styles.selectedBusRow]} onPress={() => setSelectedBus(bus)}>
                <Text style={styles.busIcon}>🚌</Text>
                <View style={styles.busDetails}>
                  <Text style={styles.busName}>Bus No. {bus.busNumber}</Text>
                  <Text style={styles.busRoute}>{`${bus.stops[0]} - ${bus.stops[bus.stops.length - 1]}`}</Text>
                </View>
                <Text style={styles.busTime}>{Math.floor(Math.random() * 10) + 5} mins away</Text>
              </TouchableOpacity>
            )) : <Text style={styles.noBusText}>No buses found for this stop.</Text>}
          </ScrollView>
          <TouchableOpacity style={[styles.bookButton, !selectedBus && styles.disabledButton]} disabled={!selectedBus}>
            <Text style={styles.bookButtonText}>{selectedBus ? `Confirm Bus No. ${selectedBus.busNumber}` : 'Select a Bus'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <ProfileMenu />
        
        {/* --- ADDED: Render the Bus Details Modal --- */}
        <BusDetailsModal />

        {(!isMapReady || isGeocoding) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text>{isGeocoding ? 'Finding locations...' : 'Loading Map...'}</Text>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
    // --- All original styles preserved ---
    container: { flex: 1, backgroundColor: '#fff' },
    map: { flex: 1 },
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)'},
    stopMarker: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255, 0, 0, 0.3)', justifyContent: 'center', alignItems: 'center' },
    stopMarkerCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 0, 0, 0.9)' },
    locationInputContainer: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
    inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    locationIcon: { fontSize: 16, marginRight: 10 },
    inputText: { flex: 1, fontSize: 16, color: '#333' },
    gpsButton: { padding: 5, marginLeft: 10 },
    separator: { height: 1, backgroundColor: '#f0f0f0' },
    bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: PANEL_HEIGHT, backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10, paddingHorizontal: 20, paddingTop: 10 },
    dragHandleContainer: { alignItems: 'center', paddingVertical: 10, },
    dragHandle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, },
    panelTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, },
    busRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    selectedBusRow: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    busIcon: { fontSize: 24, marginRight: 15 },
    busDetails: { flex: 1 },
    busName: { fontSize: 16, fontWeight: 'bold' },
    busRoute: { fontSize: 14, color: 'gray' },
    busTime: { fontSize: 14, fontWeight: '600', color: '#333' },
    bookButton: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20, },
    disabledButton: { backgroundColor: '#E0E0E0' },
    bookButtonText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    noBusText: { textAlign: 'center', color: 'gray', marginTop: 20, fontSize: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', elevation: 5 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    profileButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#4285F4' },
    profileImage: { width: '100%', height: '100%' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    profileMenuContainer: { width: '80%', maxWidth: 300, backgroundColor: 'white', borderRadius: 15, alignItems: 'center', paddingTop: 20, elevation: 10 },
    profileMenuHeader: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
    profileMenuImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
    profileMenuName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    profileMenuEmail: { fontSize: 14, color: '#666', marginTop: 4 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, width: '100%', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    logoutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '600', marginLeft: 8 },

    // --- MODIFIED & NEW STYLES for Bus Markers and Details Modal ---
    statusIndicator: { 
      width: 40, height: 40, borderRadius: 20, 
      justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.3, shadowRadius: 3, elevation: 6,
    },
    online: { backgroundColor: '#4CAF50' },
    offline: { backgroundColor: '#F44336' },
    detailsModalContainer: {
      width: '90%',
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 25,
      elevation: 10,
    },
    detailsModalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    detailLabel: {
      fontSize: 16,
      color: '#666',
      fontWeight: '600',
    },
    detailValue: {
      fontSize: 16,
      color: '#333',
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'right'
    },
    closeButton: {
      backgroundColor: '#3B82F6',
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
    },
});