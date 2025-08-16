import React, { useEffect, useState } from "react"; // Import useEffect
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// --- DUMMY DATA ---

const INITIAL_USER_LOCATION = {
  name: "Your Location",
  latitude: 30.3165,
  longitude: 78.0322,
};

const INITIAL_DESTINATION = {
  name: "Graphic Era Hill University",
  latitude: 30.4022,
  longitude: 78.0742,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

// --- NEW: Starting position for the bus ---
const INITIAL_BUS_LOCATION = {
  latitude: 30.35,
  longitude: 78.05,
};

const availableBuses = [
  { id: 'bus1', name: 'Bus No. 42', route: 'Express Route', timeAway: '5 mins away' },
  { id: 'bus2', name: 'Bus No. 18', route: 'City Circle', timeAway: '8 mins away' },
  { id: 'bus3', name: 'GEHU Shuttle', route: 'University Shuttle', timeAway: '12 mins away' },
];

const dummySuggestions = [
  { id: '1', name: 'Dehradun Railway Station' },
  { id: '2', name: 'Clock Tower, Dehradun' },
  { id: '3', name: 'Pacific Mall' },
];

const PANEL_HEIGHT = 400; // Height of the draggable panel

export default function App() {
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  
  // --- NEW: State to hold the live location of the bus ---
  const [busLocation, setBusLocation] = useState(INITIAL_BUS_LOCATION);

  const [startLocation, setStartLocation] = useState(INITIAL_USER_LOCATION);
  const [destination, setDestination] = useState(INITIAL_DESTINATION);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<'start' | 'destination' | null>(null);

  // --- NEW: useEffect to simulate the bus moving in real-time ---
  useEffect(() => {
    const interval = setInterval(() => {
      setBusLocation(prevLocation => {
        const newLat = prevLocation.latitude + 0.0005;
        const newLon = prevLocation.longitude + 0.0002;

        if (newLat >= INITIAL_DESTINATION.latitude) {
          clearInterval(interval);
          return prevLocation;
        }
        return { latitude: newLat, longitude: newLon };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const panelY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: { startY: number }) => { ctx.startY = panelY.value; },
    onActive: (event, ctx) => { const newY = ctx.startY + event.translationY; panelY.value = Math.max(0, newY); },
    onEnd: (event) => { if (event.translationY > PANEL_HEIGHT / 2) { panelY.value = withSpring(PANEL_HEIGHT - 80); } else { panelY.value = withSpring(0); }},
  });

  const animatedPanelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: panelY.value }] }));
  
  const openLocationSearch = (type: 'start' | 'destination') => { setEditingLocation(type); setModalVisible(true); };
  
  const handleSelectLocation = (location: {id: string, name: string}) => {
    const newLocation = { name: location.name, ...INITIAL_USER_LOCATION };
    if (editingLocation === 'start') { setStartLocation(newLocation); } else { setDestination(newLocation); }
    setModalVisible(false);
  };

  const selectedBusDetails = availableBuses.find(bus => bus.id === selectedBus);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={INITIAL_DESTINATION}
          onMapReady={() => setIsMapReady(true)}
        >
          {/* User and Destination Markers */}
          <Marker coordinate={startLocation} title={startLocation.name} />
          <Marker coordinate={destination} title={destination.name} pinColor="blue" />

          {/* --- NEW: Live Bus Marker --- */}
          <Marker coordinate={busLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.busMarker}>
              <Text style={styles.busMarkerIcon}>🚌</Text>
            </View>
          </Marker>
        </MapView>

        {/* --- UI Panels --- */}
        <View style={styles.locationContainer}>
          <TouchableOpacity onPress={() => openLocationSearch('start')}>
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>🟢</Text>
              <Text style={styles.locationText} numberOfLines={1}>{startLocation.name}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity onPress={() => openLocationSearch('destination')}>
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>🔴</Text>
              <Text style={styles.locationText} numberOfLines={1}>{destination.name}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Draggable Bottom Bus Selection Panel - Content Restored */}
        <Animated.View style={[styles.bottomContainer, animatedPanelStyle]}>
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </Animated.View>
          </PanGestureHandler>
          <Text style={styles.panelTitle}>Available Buses</Text>
          <ScrollView>
            {availableBuses.map((bus) => (
              <TouchableOpacity key={bus.id} style={[styles.busRow, selectedBus === bus.id && styles.selectedBusRow]} onPress={() => setSelectedBus(bus.id)}>
                <Text style={styles.busIcon}>🚌</Text>
                <View style={styles.busDetails}>
                  <Text style={styles.busName}>{bus.name}</Text>
                  <Text style={styles.busRoute}>{bus.route}</Text>
                </View>
                <Text style={styles.busTime}>{bus.timeAway}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.bookButton, !selectedBus && styles.disabledButton]} disabled={!selectedBus}>
            <Text style={styles.bookButtonText}>{selectedBus ? `Confirm ${selectedBusDetails?.name}` : 'Select a Bus'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Location Search Modal */}
        <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <SafeAreaView style={{flex: 1}}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Search Location</Text>
              <TextInput style={styles.searchInput} placeholder="Enter address or landmark..." />
              <FlatList
                data={dummySuggestions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.suggestionRow} onPress={() => handleSelectLocation(item)}>
                    <Text>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
               <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </SafeAreaView>
        </Modal>

        {!isMapReady && (<View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007BFF" /><Text>Loading Map...</Text></View>)}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  // All previous styles...
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)'},
  locationContainer: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: 'white', borderRadius: 10, padding: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5},
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  locationIcon: { marginRight: 10, fontSize: 16 },
  locationText: { fontSize: 16, flex: 1 },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 5 },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: PANEL_HEIGHT, backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10, paddingHorizontal: 20, paddingTop: 10 },
  dragHandleContainer: { alignItems: 'center', paddingVertical: 10, },
  dragHandle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, },
  panelTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, },
  busRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  selectedBusRow: { borderColor: '#FFD700', backgroundColor: '#FFFBEA' },
  busIcon: { fontSize: 24, marginRight: 15 },
  busDetails: { flex: 1 },
  busName: { fontSize: 16, fontWeight: 'bold' },
  busRoute: { fontSize: 14, color: 'gray' },
  busTime: { fontSize: 14, fontWeight: '600', color: '#333' },
  bookButton: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20, },
  disabledButton: { backgroundColor: '#E0E0E0' },
  bookButtonText: { fontSize: 18, fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  searchInput: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20 },
  suggestionRow: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  
  // --- NEW: Styles for the custom bus marker ---
  busMarker: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 20,
    borderColor: 'black',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  busMarkerIcon: {
    fontSize: 20,
  },
});