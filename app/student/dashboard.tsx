import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// --- FIX: Data structure is now an array of objects with coordinates ---
interface Location {
  name: string;
  lat: number;
  lng: number;
}

const LOCATION_SUGGESTIONS: Location[] = [
    { name: "6 No. Pulia", lat: 30.2917, lng: 78.0470 },
    { name: "Araghar", lat: 30.3060, lng: 78.0331 },
    { name: "Asley Hall", lat: 30.3275, lng: 78.0400 },
    { name: "Badowala", lat: 30.2701, lng: 78.0055 },
    { name: "Balbir Road", lat: 30.3288, lng: 78.0515 },
    { name: "Baliwala Chowk", lat: 30.3168, lng: 77.9942 },
    { name: "Balliwalachowk", lat: 30.3168, lng: 77.9942 },
    { name: "Ballupur Chowk", lat: 30.3396, lng: 78.0142 },
    { name: "Bangali Kothi", lat: 30.3625, lng: 78.0620 }, // Approx. on Rajpur Road
    { name: "Bindal Pul", lat: 30.3218, lng: 78.0267 },
    { name: "Blood Bank", lat: 30.3295, lng: 78.0450 }, // Approx. IMA Blood Bank
    { name: "CM House", lat: 30.3340, lng: 78.0540 },
    { name: "Chir Bagh", lat: 30.3150, lng: 78.0450 }, // Approx. near Race Course
    { name: "Clock Tower", lat: 30.3256, lng: 78.0437 },
    { name: "Darshanlal Chowk", lat: 30.3223, lng: 78.0371 },
    { name: "Daudwala", lat: 30.3015, lng: 77.9980 },
    { name: "Dharampur", lat: 30.2982, lng: 78.0305 },
    { name: "Dilaram Bazar", lat: 30.3300, lng: 78.0445 },
    { name: "Dobhal Chowk", lat: 30.2780, lng: 78.0120 },
    { name: "Doiwala", lat: 30.1843, lng: 78.1158 },
    { name: "Dwarka Store", lat: 30.3422, lng: 78.0255 }, // Approx. in Garhi Cantt
    { name: "Fountain Chowk", lat: 30.2910, lng: 78.0530 }, // Assumed near Rispana
    { name: "Fountain Chowk Rispana", lat: 30.2910, lng: 78.0530 },
    { name: "GEU", lat: 30.2749, lng: 77.9967 },
    { name: "GMS Road", lat: 30.3195, lng: 78.0160 }, // Central point on the road
    { name: "Garhi Cant", lat: 30.3360, lng: 78.0250 },
    { name: "Geu", lat: 30.2749, lng: 77.9967 },
    { name: "Geu/Gehu", lat: 30.2749, lng: 77.9967 },
    { name: "Great Value", lat: 30.3590, lng: 78.0610 }, // On Rajpur Road
    { name: "Gujraunwala", lat: 30.2900, lng: 78.0000 }, // Approx. near ISBT
    { name: "Harawala", lat: 30.2820, lng: 78.1100 },
    { name: "Harbatpur Chowk", lat: 30.4500, lng: 77.7400 },
    { name: "Hathibadkala", lat: 30.3400, lng: 78.0580 },
    { name: "ISBT", lat: 30.2867, lng: 77.9963 },
    { name: "IT Park", lat: 30.3540, lng: 78.0560 },
    { name: "Jogiwala", lat: 30.2871, lng: 78.0645 },
    { name: "Kargi", lat: 30.2811, lng: 78.0163 },
    { name: "Kargi Chowk", lat: 30.2811, lng: 78.0163 },
    { name: "Kishan Nagar", lat: 30.3310, lng: 78.0180 },
    { name: "Kuanwala", lat: 30.2580, lng: 78.1050 },
    { name: "Kulhal", lat: 30.4300, lng: 77.6300 },
    { name: "Lachiwala", lat: 30.2100, lng: 78.1100 },
    { name: "Ladpur", lat: 30.3000, lng: 78.0700 },
    { name: "Langa Road", lat: 30.3600, lng: 77.9500 }, // Likely Langha Road
    { name: "Mata Mandir", lat: 30.2950, lng: 78.0350 }, // Approx. on Mata Mandir Road
    { name: "Matawala Bagh", lat: 30.3050, lng: 78.0380 }, // Approx. near Araghar
    { name: "Mathurawala", lat: 30.2500, lng: 78.0200 },
    { name: "Mehuwala", lat: 30.2750, lng: 78.0000 },
    { name: "Miawala", lat: 30.2650, lng: 78.0900 },
    { name: "Mokampur", lat: 30.2700, lng: 78.0750 },
    { name: "Nakrounda More", lat: 30.2900, lng: 78.0950 },
    { name: "Nala Paani Chowk", lat: 30.3150, lng: 78.0650 },
    { name: "Nanda Ki Chowki", lat: 30.3600, lng: 77.9700 },
    { name: "Nanni Bakery", lat: 30.3380, lng: 78.0150 }, // In Ballupur
    { name: "Naya Gaon Palio", lat: 30.2700, lng: 77.9800 }, // Approx. Nayagaon
    { name: "Nehru Colony", lat: 30.2934, lng: 78.0439 },
    { name: "ONGC Chowk", lat: 30.3350, lng: 78.0280 },
    { name: "Panditwari", lat: 30.3500, lng: 77.9900 },
    { name: "Post Office Nehru Gram", lat: 30.2900, lng: 78.0700 },
    { name: "Prem Nagar", lat: 30.3414, lng: 77.9634 },
    { name: "Premnagar", lat: 30.3414, lng: 77.9634 },
    { name: "Race Course", lat: 30.3090, lng: 78.0440 },
    { name: "Raipur Chowk", lat: 30.3013, lng: 78.0592 },
    { name: "Rajender Nagar", lat: 30.2950, lng: 78.0100 },
    { name: "Rajpur", lat: 30.3879, lng: 78.0706 },
    { name: "Ranipokhari", lat: 30.2000, lng: 78.1300 },
    { name: "Ring Road", lat: 30.2900, lng: 78.0600 }, // Central point on the road
    { name: "Rispana", lat: 30.2910, lng: 78.0530 },
    { name: "Saharanpur Chowk", lat: 30.3129, lng: 78.0249 },
    { name: "Selaqui", lat: 30.3660, lng: 77.8580 },
    { name: "Selaqui Chowk", lat: 30.3660, lng: 77.8580 },
    { name: "Shaspur", lat: 30.3800, lng: 77.8100 },
    { name: "Shastdhara Crossing", lat: 30.3450, lng: 78.0750 },
    { name: "Sudhowala", lat: 30.3400, lng: 77.9300 },
    { name: "Supply", lat: 30.3050, lng: 78.0650 }, // Approx. near Raipur Road
    { name: "Survey Chowk", lat: 30.3200, lng: 78.0490 },
    { name: "Tehsil", lat: 30.3230, lng: 78.0340 }, // Approx. Tehsil Chowk
    { name: "Telpur", lat: 30.3550, lng: 77.9650 }, // Near Premnagar
    { name: "Vasant Vihar", lat: 30.3300, lng: 77.9950 },
    { name: "Vijay Coloney", lat: 30.3450, lng: 78.0100 },
    { name: "VikasNagar", lat: 30.4700, lng: 77.7800 },
    { name: "Vishnupuram", lat: 30.2960, lng: 78.0450 }, // Approx. near Nehru Colony
    { name: "Yamuna Coloney", lat: 30.3200, lng: 77.9900 },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  // --- FIX: State now holds an array of Location objects ---
  const [filteredLocations, setFilteredLocations] = useState<Location[]>(LOCATION_SUGGESTIONS);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = LOCATION_SUGGESTIONS.filter(location => 
      // --- FIX: Search by location.name ---
      location.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredLocations(filtered);
  };

  // --- FIX: This function now receives the full location object ---
  const handleLocationSelect = (location: Location) => {
    router.push({
      pathname: '/student/map-view',
      // --- FIX: Pass name, lat, and lng as parameters ---
      params: { 
        name: location.name,
        lat: location.lat,
        lng: location.lng
      }
    });
  };

  // --- FIX: The render function now handles a Location object ---
  const renderLocationItem = ({ item }: { item: Location }) => (
    <Pressable 
      style={styles.locationItem}
      onPress={() => handleLocationSelect(item)} // Pass the whole item
    >
      <Text style={styles.locationText}>{item.name}</Text> 
      <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header (unchanged) */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text style={styles.headerTitle}>Bus Tracker</Text>
        <View style={styles.profileButton}><Text style={styles.profileButtonText}>P</Text></View>
      </View>

      {/* Quick Search (unchanged) */}
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

      {/* Location Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Location Suggestions:</Text>
        <FlatList 
          data={filteredLocations}
          renderItem={renderLocationItem}
          // --- FIX: Use item.name for the key ---
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.locationList}
        />
      </View>
    </SafeAreaView>
  );
}

// --- Styles (unchanged) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, },
  backButton: { padding: 10 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  profileButton: { backgroundColor: '#3B82F6', width: 35, height: 35, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  profileButtonText: { color: 'white', fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 15, margin: 15, height: 45 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%' },
  suggestionsContainer: { flex: 1, paddingHorizontal: 15 }, // Added flex: 1 to make the list scrollable
  suggestionsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  locationList: { paddingBottom: 20 },
  locationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  locationText: { fontSize: 16, color: '#1F2937' },
});