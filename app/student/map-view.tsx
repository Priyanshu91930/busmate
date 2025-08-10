import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from 'react-native';

// Placeholder for Google Maps image (you'd replace this with actual map rendering)
const PLACEHOLDER_MAP = require('../../assets/images/icon.png');

export default function MapViewScreen() {
  const router = useRouter();
  const { location } = useLocalSearchParams<{ location: string }>();

  // Predefined location details (you'd fetch these dynamically in a real app)
  const locationDetails = {
    'Clock Tower': {
      description: 'Central location in the city',
      busNumber: '#18',
      startPoint: 'Gandhi Rd, Lakkhi Bagh',
      endPoint: 'Western Union, Shri Ra.',
      walkTime: '30 min',
      walkDistance: '2.1 km',
      busTime: '11 min',
      busDistance: '3.4 km'
    }
  };

  const currentLocation = locationDetails[location] || locationDetails['Clock Tower'];

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
        
        <Text style={styles.headerTitle}>Map View</Text>
      </View>

      {/* Location Details */}
      <View style={styles.locationContainer}>
        <Text style={styles.locationName}>{location}</Text>
        <Text style={styles.locationDescription}>
          {currentLocation.description}
        </Text>
        <View style={styles.busInfoContainer}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.busIcon} 
          />
          <Text style={styles.busNumber}>Bus {currentLocation.busNumber}</Text>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <Image 
          source={PLACEHOLDER_MAP} 
          style={styles.mapImage} 
          resizeMode="cover" 
        />
      </View>

      {/* Route Details */}
      <View style={styles.routeDetailsContainer}>
        <View style={styles.routeDetail}>
          <Ionicons name="location-outline" size={24} color="#3B82F6" />
          <View style={styles.routeTextContainer}>
            <Text style={styles.routeStartPoint}>{currentLocation.startPoint}</Text>
            <Text style={styles.routeEndPoint}>{currentLocation.endPoint}</Text>
          </View>
        </View>

        <View style={styles.timeDistanceContainer}>
          <View style={styles.timeDistanceItem}>
            <Ionicons name="walk-outline" size={24} color="#10B981" />
            <Text style={styles.timeDistanceText}>
              {currentLocation.walkTime} | {currentLocation.walkDistance}
            </Text>
          </View>
          <View style={styles.timeDistanceItem}>
            <Ionicons name="bus-outline" size={24} color="#8B5CF6" />
            <Text style={styles.timeDistanceText}>
              {currentLocation.busTime} | {currentLocation.busDistance}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Get Directions</Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Bus Routes</Text>
        </Pressable>
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
    marginLeft: 10,
  },
  locationContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  locationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  busInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  busIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  mapContainer: {
    height: 300,
    backgroundColor: '#F3F4F6',
    marginVertical: 15,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  routeDetailsContainer: {
    paddingHorizontal: 15,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeTextContainer: {
    marginLeft: 15,
  },
  routeStartPoint: {
    fontSize: 14,
    color: '#1F2937',
  },
  routeEndPoint: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeDistanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeDistanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeDistanceText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
