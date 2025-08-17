import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import BusData from '../bus_data.json';
const decode = require('polyline-decode');

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Get the centralized Firebase app instance
const app = getApp();
const db = getFirestore(app);

// --- TYPE DEFINITIONS & CONSTANTS ---
interface Coords {
  latitude: number;
  longitude: number;
}
interface LocationPoint extends Coords {
  name: string;
}
interface BusRoute {
  registration: string;
  busNumber: string;
  stops: string[];
}
const PANEL_HEIGHT = 400;
const DESTINATION_NAME = BusData.GRAPHIC_ERA_UNIVERSITY.name;

export default function MapViewWithBusSelection() {
  const params = useLocalSearchParams();
  const { name: initialStartName } = params;

  // --- STATE MANAGEMENT (Unchanged) ---
  const [isMapReady, setIsMapReady] = useState(false);
  const [startLocationName, setStartLocationName] = useState<string | null>(null);
  const [startCoords, setStartCoords] = useState<Coords | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coords | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(true);
  const [routePolyline, setRoutePolyline] = useState<Coords[]>([]);
  const [relevantBuses, setRelevantBuses] = useState<BusRoute[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusRoute | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [busLocation, setBusLocation] = useState<LocationPoint | null>(null);
  const [busStatus, setBusStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [stopCoordinates, setStopCoordinates] = useState<LocationPoint[]>([]);

  // --- Geocoding Function (Unchanged) ---
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
      } else {
        console.warn(`Geocoding failed for "${fullAddress}": ${json.status}`);
        return null;
      }
    } catch (error) { console.error("Failed to geocode location:", error); return null; }
  };

  // 1. Initial Location Setup (Unchanged)
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
        if (busesForStop.length > 0) {
          setSelectedBus(busesForStop[0]);
        }
      }
    };
    setupInitialLocations().finally(() => setIsGeocoding(false));
  }, [initialStartName]);

  // 2. Geocode all stops for the selected bus (Unchanged)
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

  // ======================== FIX STARTS HERE ========================

  // *** MODIFIED: 3. This effect now correctly triggers the route fetch when all necessary data is available. ***
  useEffect(() => {
    // We proceed only if we have a selected bus, a start name, and the list of stop coordinates has been fully populated.
    if (selectedBus && startLocationName && stopCoordinates.length > 0) {
      fetchOnRoadRoute();
    }
  }, [startLocationName, selectedBus, stopCoordinates]); // Dependencies are now more precise

  // *** MODIFIED: This function now correctly uses STOP NAMES to build the route, which is much more reliable. ***
  const fetchOnRoadRoute = async () => {
    if (!GOOGLE_MAPS_API_KEY || !selectedBus || !startLocationName || stopCoordinates.length === 0) {
        setRoutePolyline([]); // Clear the route if we don't have enough data
        return;
    }

    // Find the user's starting point within the bus's list of stops using its NAME.
    const startIndex = selectedBus.stops.findIndex(stop => stop.toLowerCase() === startLocationName.toLowerCase());

    // If the start stop isn't part of this route, we can't draw a bus-specific path.
    if (startIndex === -1) {
        console.warn("Start location is not on the selected bus route.");
        setRoutePolyline([]); // Clear the polyline
        return;
    }

    // The origin is the geocoded coordinate of the user's start stop.
    const origin = stopCoordinates.find(s => s.name.toLowerCase() === startLocationName.toLowerCase());
    
    // The destination is the geocoded coordinate of the VERY LAST stop in the route.
    const finalStop = stopCoordinates[stopCoordinates.length - 1];

    if (!origin || !finalStop) {
        console.error("Could not find coordinates for origin or final stop.");
        return;
    }

    // Waypoints are all the stops BETWEEN the origin and the final destination.
    const intermediateWaypoints = stopCoordinates
      .slice(startIndex + 1, stopCoordinates.length - 1) // Exclude start and final stops
      .map(p => `${p.latitude},${p.longitude}`)
      .join('|');

    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${finalStop.latitude},${finalStop.longitude}`;
    
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}`;
    if (intermediateWaypoints.length > 0) {
      url += `&waypoints=optimize:true|${intermediateWaypoints}`;
    }

    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.routes.length > 0) {
        const points = decode(json.routes[0].overview_polyline.points).map((point: number[]) => ({
          latitude: point[0], longitude: point[1]
        }));
        setRoutePolyline(points);
      } else {
        console.warn("Directions API returned no routes for the given waypoints.");
        setRoutePolyline([]);
      }
    } catch (error) {
      console.error("Failed to fetch directions:", error);
    }
  };

  // ========================= FIX ENDS HERE =========================

  // Other functions and hooks remain unchanged.
  // 4. Live bus location listener (Unchanged)
  useEffect(() => {
    const driverId = "driver_123"; 
    const docRef = doc(db, "driverLocations", driverId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBusLocation({ name: "Live Bus", latitude: data.latitude, longitude: data.longitude });
        setBusStatus(data.active ? 'online' : 'offline');
      } else { setBusStatus('offline'); }
    });
    return () => unsubscribe();
  }, []);

  // 5. GPS Button Handler (Unchanged)
  const handleFetchUserLocation = async () => {
    setIsFetchingLocation(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable location services.');
      setIsFetchingLocation(false);
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({});
      setStartCoords(location.coords);
      let address = await Location.reverseGeocodeAsync(location.coords);
      setStartLocationName(address[0]?.name || 'My Current Location');
    } catch (error) { Alert.alert("Error", "Could not fetch your location."); } 
    finally { setIsFetchingLocation(false); }
  };
  
  // --- All your UI Rendering and Animation Logic is Unchanged ---
  const panelY = useSharedValue(0);
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: { startY: number }) => { ctx.startY = panelY.value; },
    onActive: (event, ctx) => { const newY = ctx.startY + event.translationY; panelY.value = Math.max(0, newY); },
    onEnd: (event) => { if (event.translationY > PANEL_HEIGHT / 2) { panelY.value = withSpring(PANEL_HEIGHT - 80); } else { panelY.value = withSpring(0); }},
  });
  const animatedPanelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: panelY.value }] }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 30.3165, longitude: 78.0322,
            latitudeDelta: 0.12, longitudeDelta: 0.12,
          }}
          onMapReady={() => setIsMapReady(true)}
        >
          {routePolyline.length > 0 && (
            <Polyline coordinates={routePolyline} strokeColor="#FFD700" strokeWidth={5} zIndex={1} />
          )}
          
          {startCoords && <Marker coordinate={startCoords} title={startLocationName || 'Start'} pinColor="green" zIndex={3} />}
          {destinationCoords && <Marker coordinate={destinationCoords} title={DESTINATION_NAME} pinColor="red" zIndex={3} />}
          
          {stopCoordinates.map((stop, index) => (
            <Marker key={index} coordinate={stop} title={stop.name} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
              <View style={styles.stopMarker}><View style={styles.stopMarkerCore} /></View>
            </Marker>
          ))}
          
          {busLocation && (
            <Marker coordinate={busLocation} anchor={{ x: 0.5, y: 0.5 }} zIndex={99}>
              <View style={[styles.statusIndicator, busStatus === 'online' ? styles.online : styles.offline]}>
                <View style={styles.busMarker}><Text style={styles.busMarkerIcon}>🚌</Text></View>
              </View>
            </Marker>
          )}
        </MapView>
        
        {/* Your UI remains unchanged */}
        <View style={styles.locationInputContainer}>
          <View style={styles.inputRow}>
            <Text style={styles.locationIcon}>🟢</Text>
            <Text style={styles.inputText} numberOfLines={1}>
              {startLocationName ? startLocationName : 'Choose starting point'}
            </Text>
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

// --- Your Stylesheet is Unchanged ---
const styles = StyleSheet.create({
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
    statusIndicator: { borderRadius: 30, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 6 },
    online: { backgroundColor: '#4CAF50' },
    offline: { backgroundColor: '#F44336' },
    busMarker: { backgroundColor: 'white', padding: 6, borderRadius: 20 },
    busMarkerIcon: { fontSize: 20 },
    noBusText: { textAlign: 'center', color: 'gray', marginTop: 20, fontSize: 16 }
});