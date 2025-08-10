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

// Predefined list of locations
const LOCATION_SUGGESTIONS = [
    "6 No. Pulia",
    "Araghar",
    "Asley Hall",
    "Badowala",
    "Balbir Road",
    "Baliwala Chowk",
    "Balliwalachowk",
    "Ballupur Chowk",
    "Bangali Kothi",
    "Bindal Pul",
    "Blood Bank",
    "CM House",
    "Chir Bagh",
    "Clock Tower",
    "Darshanlal Chowk",
    "Daudwala",
    "Dharampur",
    "Dilaram Bazar",
    "Dobhal Chowk",
    "Doiwala",
    "Dwarka Store",
    "Fountain Chowk",
    "Fountain Chowk Rispana",
    "GEU",
    "GMS Road",
    "Garhi Cant",
    "Geu",
    "Geu/Gehu",
    "Great Value",
    "Gujraunwala",
    "Harawala",
    "Harbatpur Chowk",
    "Hathibadkala",
    "ISBT",
    "IT Park",
    "Jogiwala",
    "Kargi",
    "Kargi Chowk",
    "Kishan Nagar",
    "Kuanwala",
    "Kulhal",
    "Lachiwala",
    "Ladpur",
    "Langa Road",
    "Mata Mandir",
    "Matawala Bagh",
    "Mathurawala",
    "Mehuwala",
    "Miawala",
    "Mokampur",
    "Nakrounda More",
    "Nala Paani Chowk",
    "Nanda Ki Chowki",
    "Nanni Bakery",
    "Naya Gaon Palio",
    "Nehru Colony",
    "ONGC Chowk",
    "Panditwari",
    "Post Office Nehru Gram",
    "Prem Nagar",
    "Premnagar",
    "Race Course",
    "Raipur Chowk",
    "Rajender Nagar",
    "Rajpur",
    "Ranipokhri",
    "Ring Road",
    "Rispana",
    "Saharanpur Chowk",
    "Selaqui",
    "Selaqui Chowk",
    "Shaspur",
    "Shastdhara Crossing",
    "Sudhowala",
    "Supply",
    "Survey Chowk",
    "Tehsil",
    "Telpur",
    "Vasant Vihar",
    "Vijay Coloney",
    "VikasNagar",
    "Vishnupuram",
    "Yamuna Coloney"
];

export default function StudentDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(LOCATION_SUGGESTIONS);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = LOCATION_SUGGESTIONS.filter(location => 
      location.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredLocations(filtered);
  };

  const handleLocationSelect = (location: string) => {
    router.push({
      pathname: '/student/map-view',
      params: { location }
    });
  };

  const renderLocationItem = ({ item }: { item: string }) => (
    <Pressable 
      style={styles.locationItem}
      onPress={() => handleLocationSelect(item)}
    >
      <Text style={styles.locationText}>{item}</Text>
      <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        
        <Text style={styles.headerTitle}>Bus Tracker</Text>
        
        <View style={styles.profileButton}>
          <Text style={styles.profileButtonText}>P</Text>
        </View>
      </View>

      {/* Quick Search */}
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color="#9CA3AF" 
          style={styles.searchIcon} 
        />
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
          keyExtractor={(item) => item}
          contentContainerStyle={styles.locationList}
        />
      </View>
    </SafeAreaView>
  );
}

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
    paddingVertical: 10,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileButton: {
    backgroundColor: '#3B82F6',
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 15,
    margin: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  suggestionsContainer: {
    paddingHorizontal: 15,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  locationList: {
    paddingBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationText: {
    fontSize: 16,
    color: '#1F2937',
  },
});
