import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// --- Step 1: Import the full bus data from your JSON file ---
import BusData from '../bus_data.json';

// Define a type for the data that will be displayed in the list
interface StopInfo {
  name: string;
  lat: number;
  lng: number;
  buses: string[]; // Array to hold bus numbers
}

export default function StudentDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // --- Step 2: Pre-process the data to link buses to stops ---
  // useMemo ensures this complex operation runs only once.
  const allStopsInfo = useMemo(() => {
    // Create a map for quick lookup: { "Stop Name": ["Bus1", "Bus2"] }
    const stopsToBusesMap = new Map<string, string[]>();

    // Populate the map by iterating through each bus route
    BusData.BUS_ROUTES.forEach(route => {
      route.stops.forEach(stopName => {
        const existingBuses = stopsToBusesMap.get(stopName) || [];
        stopsToBusesMap.set(stopName, [...existingBuses, route.busNumber]);
      });
    });

    // Create the final list by combining location data with bus numbers
    return BusData.LOCATION_SUGGESTIONS.map(location => ({
      ...location,
      buses: stopsToBusesMap.get(location.name) || [],
    }));
  }, []);

  // State to hold the locations that are currently visible in the list
  const [filteredStops, setFilteredStops] = useState<StopInfo[]>(allStopsInfo);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text) {
      const filtered = allStopsInfo.filter(stop => 
        stop.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredStops(filtered);
    } else {
      setFilteredStops(allStopsInfo);
    }
  };

  // Navigation logic remains the same
  const handleLocationSelect = (stop: StopInfo) => {
    router.push({
      pathname: '/student/map-view',
      params: { 
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng
      }
    });
  };

  // --- Step 3: Update the render function to show bus numbers ---
  const renderLocationItem = ({ item }: { item: StopInfo }) => (
    <Pressable 
      style={styles.locationItem}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        {item.buses.length > 0 && (
          <Text style={styles.busNumbers}>
            Buses: {item.buses.join(', ')}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Find Your Bus Route</Text>
        <View style={styles.profileButton}><Text style={styles.profileButtonText}>P</Text></View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Type your stop..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* List of Location Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>All Available Stops:</Text>
        <FlatList 
          data={filteredStops}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.locationList}
        />
      </View>
    </SafeAreaView>
  );
}

// --- Styles (with additions for the new text elements) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  profileButton: { 
    backgroundColor: '#3B82F6', 
    width: 35, 
    height: 35, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileButtonText: { color: 'white', fontWeight: 'bold' },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 10, 
    paddingHorizontal: 15, 
    margin: 15, 
    height: 45,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 16 },
  suggestionsContainer: { 
    flex: 1, 
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  suggestionsTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  locationList: { paddingBottom: 20 },
  locationItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 15,
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  locationInfo: {
    flex: 1,
  },
  locationName: { 
    fontSize: 16, 
    fontWeight: '500',
    color: '#1F2937' 
  },
  busNumbers: {
    fontSize: 12,
    color: '#6B7280', // Gray color for secondary info
    marginTop: 4,
  },
});