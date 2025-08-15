import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// --- Fixed Destination ---
const GRAPHIC_ERA_UNIVERSITY = {
  name: "Graphic Era University",
  coords: { latitude: 30.2749, longitude: 77.9967 }
};

// --- NEW, LIVE-TRACKING MAP HTML ---
const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Live Route Map</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style> html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; } </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      // --- FIX: Re-configure Leaflet's default icon paths to use a CDN ---
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map('map').setView([30.29, 78.02], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      
      let routeLayer = L.layerGroup().addTo(map);
      let busMarker; // Variable to hold the moving bus marker

      // --- NEW: Function to create a custom bus icon ---
      function createBusIcon() {
        const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FF5733" width="35" height="35"><path d="M128 32C110.7 32 96 46.7 96 64V288H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V352h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V352h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V352h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V352h32c17.7 0 32-14.3 32-32s-14.3-32-32-32H416V64c0-17.3-14.3-32-32-32H128zM80 160a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm272 0a32 32 0 1 1 0-64 32 32 0 1 1 0 64z"/></svg>\`;
        return L.divIcon({ html: svg, className: 'bus-marker', iconSize: [35, 35], iconAnchor: [17, 35] });
      }

      function drawRoute(start, end) {
        routeLayer.clearLayers();
        const startCoords = [start.lat, start.lng];
        const endCoords = [end.lat, end.lng];
        L.marker(startCoords).addTo(routeLayer).bindPopup("<b>Pickup:</b><br>" + start.name);
        L.marker(endCoords).addTo(routeLayer).bindPopup("<b>Destination:</b><br>" + end.name);
        const latlngs = [startCoords, endCoords];
        L.polyline(latlngs, { color: '#007AFF', weight: 5, opacity: 0.7 }).addTo(routeLayer);
        map.fitBounds(latlngs, { padding: [50, 50] });
      }

      // --- NEW: Function to update the bus's position ---
      function updateBusLocation(lat, lng) {
        const busCoords = [lat, lng];
        if (busMarker) {
          busMarker.setLatLng(busCoords); // Move the existing marker
        } else {
          // Create the marker for the first time
          busMarker = L.marker(busCoords, { icon: createBusIcon() }).addTo(map);
          busMarker.bindPopup("<b>Bus Location</b>");
        }
      }

      window.addEventListener("message", function(event) {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'DRAW_ROUTE') {
            drawRoute(message.payload.start, message.payload.end);
          } else if (message.type === 'UPDATE_BUS_LOCATION') {
            updateBusLocation(message.payload.lat, message.payload.lng);
          }
        } catch (e) {}
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
    </script>
  </body>
  </html>
`;

// --- The Main Screen Component ---
export default function LiveRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webviewRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // --- NEW: State to hold the live bus location ---
  const [busLocation, setBusLocation] = useState(null);

  // The pickup location is still set from the dashboard parameters
  const pickupLocation = {
    name: (params.name as string) || 'Select a location',
    coords: {
      latitude: parseFloat(params.lat as string) || 30.3165,
      longitude: parseFloat(params.lng as string) || 78.0322,
    },
  };

  // This effect draws the initial route when the map is ready
  useEffect(() => {
    if (isMapReady && params.lat) {
      const startPayload = { lat: pickupLocation.coords.latitude, lng: pickupLocation.coords.longitude, name: pickupLocation.name };
      const endPayload = { lat: GRAPHIC_ERA_UNIVERSITY.coords.latitude, lng: GRAPHIC_ERA_UNIVERSITY.coords.longitude, name: GRAPHIC_ERA_UNIVERSITY.name };
      const message = { type: 'DRAW_ROUTE', payload: { start: startPayload, end: endPayload } };
      webviewRef.current?.postMessage(JSON.stringify(message));
    }
  }, [isMapReady, params]);

  // --- NEW: This effect simulates fetching the live bus location ---
  useEffect(() => {
    // Start the simulation only after the initial route is drawn
    if (isMapReady && params.lat) {
      // Set the initial bus location to be the same as the pickup stop
      let currentLat = pickupLocation.coords.latitude;
      let currentLng = pickupLocation.coords.longitude;
      setBusLocation({ lat: currentLat, lng: currentLng });

      // In a real app, you would fetch data here. We will simulate it.
      const interval = setInterval(() => {
        // Simulate the bus moving towards the destination
        currentLat += 0.0001; // Move slightly north
        currentLng -= 0.0001; // Move slightly west
        setBusLocation({ lat: currentLat, lng: currentLng });
      }, 5000); // Update every 5 seconds

      // Clean up the interval when the screen is closed to prevent memory leaks
      return () => clearInterval(interval);
    }
  }, [isMapReady, params]);

  // --- NEW: This effect sends the updated bus location to the map ---
  useEffect(() => {
    if (isMapReady && busLocation) {
      const message = { type: 'UPDATE_BUS_LOCATION', payload: busLocation };
      webviewRef.current?.postMessage(JSON.stringify(message));
    }
  }, [busLocation]); // This runs every time the busLocation state changes

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={(event) => {
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === 'MAP_READY') { setIsMapReady(true); }
        }}
      />
      
      {/* --- UI is the same as the previous correct version --- */}
      <View style={styles.header}>
        <View style={styles.locationInputContainer}>
          <View style={styles.inputBox}><Ionicons name="ellipse" color="green" size={12} style={styles.locationIcon} /><TextInput style={styles.textInput} value={pickupLocation.name} editable={false} /></View>
          <View style={styles.inputSeparator} />
          <View style={styles.inputBox}><Ionicons name="ellipse" color="red" size={12} style={styles.locationIcon} /><TextInput style={styles.textInput} value={GRAPHIC_ERA_UNIVERSITY.name} editable={false} /></View>
        </View>
      </View>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="black" /></TouchableOpacity>
      <TouchableOpacity style={styles.gpsButton}><MaterialCommunityIcons name="crosshairs-gps" size={24} color="black" /></TouchableOpacity>
      <View style={styles.bottomSheet}>
        <Text style={styles.bottomSheetTitle}>Live Bus Tracking</Text>
        <Text style={styles.bottomSheetText}>The bus location will update automatically.</Text>
        <TouchableOpacity style={styles.actionButton}><Text style={styles.actionButtonText}>View Bus Stops</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Styles (unchanged) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  map: { flex: 1 },
  header: { position: 'absolute', top: 50, left: 20, right: 20 },
  locationInputContainer: { backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 8, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
  inputBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, },
  textInput: { fontSize: 14, color: '#000', flex: 1, marginLeft: 10, fontWeight: '500' },
  inputSeparator: { height: 1, backgroundColor: '#eee', marginVertical: 4, },
  locationIcon: {},
  backButton: { position: 'absolute', top: 155, left: 20, backgroundColor: 'white', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  gpsButton: { position: 'absolute', top: 155, right: 20, backgroundColor: 'white', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, elevation: 10, shadowColor: '#000' },
  bottomSheetTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  bottomSheetText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  actionButton: { backgroundColor: '#FFC107', paddingVertical: 15, borderRadius: 10, alignItems: 'center', },
  actionButtonText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});