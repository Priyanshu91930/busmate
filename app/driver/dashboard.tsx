import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

// Placeholder profile image (you can replace with actual image import)
const profileImage = require('../../assets/images/clg.png');

export default function DriverDashboard() {
  const router = useRouter();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  // Dashboard menu items with icons and labels
  const menuItems = [
    { icon: 'bus', label: 'Trips', color: '#10B981' },     // Green
    { icon: 'image', label: 'Gallery', color: '#F59E0B' }, // Orange
    { icon: 'lock-closed', label: 'Shop', color: '#3B82F6' }, // Blue
    { icon: 'stats-chart', label: 'Report', color: '#8B5CF6' }, // Purple
    { icon: 'seat', label: 'Seat', color: '#EF4444' }, // Red (changed from Favorite)
    { icon: 'paper-plane', label: 'Share', color: '#10B981' }, // Green
    { icon: 'card', label: 'Credit', color: '#0EA5E9' }, // Cyan
    { icon: 'map', label: 'Map', color: '#14B8A6' }, // Teal
    { icon: 'calendar', label: 'Calendar', color: '#6366F1' }, // Indigo
  ];

  const handleMenuItemPress = (label: string) => {
    switch(label) {
      case 'Seat':
        router.push('/driver/seat-selection');
        break;
      default:
        console.log(`Pressed ${label}`);
    }
  };

  const ProfileMenu = () => {
    const menuOptions = [
      { label: 'Profile', icon: 'person', onPress: () => { /* Navigate to profile */ } },
      { label: 'Settings', icon: 'settings', onPress: () => { /* Navigate to settings */ } },
      { label: 'Logout', icon: 'log-out', onPress: () => router.replace('/login') }
    ];

    return (
      <Modal
        transparent={true}
        visible={isProfileMenuVisible}
        onRequestClose={() => setIsProfileMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsProfileMenuVisible(false)}
        >
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
                <Ionicons name={option.icon as any} size={20} color="#333" />
                <Text style={styles.profileMenuItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        
        <Pressable 
          style={styles.profileButton}
          onPress={() => setIsProfileMenuVisible(true)}
        >
          <Text style={styles.profileButtonText}>Elina</Text>
        </Pressable>
      </View>

      {/* Profile Section */}
      <View style={styles.profileContainer}>
        <Image source={profileImage} style={styles.profileImage} />
        <Text style={styles.profileName}>Elina Watson</Text>
        <Text style={styles.profileEmail}>elina.watson@gmail.com</Text>
        
        {/* Profile Details */}
        <View style={styles.profileDetailsContainer}>
          <View style={styles.profileDetail}>
            <Text style={styles.profileDetailLabel}>Gender</Text>
            <Text style={styles.profileDetailValue}>Male</Text>
          </View>
          <View style={styles.profileDetail}>
            <Text style={styles.profileDetailLabel}>Age</Text>
            <Text style={styles.profileDetailValue}>27 Years</Text>
          </View>
          <View style={styles.profileDetail}>
            <Text style={styles.profileDetailLabel}>Country</Text>
            <Text style={styles.profileDetailValue}>Denmark</Text>
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

      {/* Profile Menu Modal */}
      <ProfileMenu />
    </View>
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
    backgroundColor: 'white',
    elevation: 2, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileEmail: {
    color: '#6B7280',
    marginBottom: 15,
  },
  profileDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  profileDetail: {
    alignItems: 'center',
  },
  profileDetailLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  profileDetailValue: {
    color: '#1F2937',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 15,
    width: '90%',
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    margin: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemText: {
    color: 'white',
    marginTop: 5,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  profileMenuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileMenuItemText: {
    marginLeft: 10,
    color: '#1F2937',
  },
});
