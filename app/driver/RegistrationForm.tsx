import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc } from 'firebase/firestore';
// --- FIX 1 of 4: Import useMemo for better performance ---
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// Make sure these paths are correct for your project structure
import { useRouter } from 'expo-router';
import { db, useAuth } from '../../context/AuthContext';
import BusData from '../bus_data.json'; // Import the full bus data


// --- FIX 2 of 4: Update the interface to match your data ---
interface DriverFormData {
  fullName: string;
  phoneNumber: string;
  gender: 'Male' | 'Female' | null;
  address: string;
  assignedBusRegistration: string | null; // Changed from assignedBusId
  profilePhotoUrl: string | null;
}

export default function DriverRegistrationForm() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<DriverFormData>({
    fullName: '',
    phoneNumber: '',
    gender: null,
    address: '',
    assignedBusRegistration: null, // Changed from assignedBusId
    profilePhotoUrl: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- FIX 3 of 4: Replace the useEffect with this more efficient and correct logic ---
  const filteredBusRoutes = useMemo(() => {
    // This helper function creates a readable route string from the stops array
    const getRouteString = (stops: string[]) => {
      if (!stops || stops.length === 0) return 'N/A';
      if (stops.length === 1) return stops[0];
      return `${stops[0]} - ${stops[stops.length - 1]}`;
    };

    // First, map your raw data to a more usable format
    const allRoutes = BusData.BUS_ROUTES.map(bus => ({
      ...bus,
      routeDisplay: getRouteString(bus.stops),
    }));

    if (searchQuery.trim() === '') {
      return allRoutes;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    // Now, filter based on the correct properties: busNumber and the new routeDisplay
    return allRoutes.filter(bus =>
      bus.busNumber.toLowerCase().includes(lowercasedQuery) ||
      bus.routeDisplay.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery]);


  const handleInputChange = (field: keyof DriverFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to the camera to take a profile picture.");
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!pickerResult.canceled) {
      handleInputChange('profilePhotoUrl', pickerResult.assets[0].uri);
    }
  };
  
  const isFormComplete = () => {
      return (
          formData.fullName.trim() !== '' &&
          formData.phoneNumber.trim().length > 9 &&
          formData.gender !== null &&
          formData.address.trim() !== '' &&
          formData.assignedBusRegistration !== null && // Changed from assignedBusId
          formData.profilePhotoUrl !== null
      );
  };

  const handleSave = async () => {
      if (!isFormComplete()) {
          Alert.alert("Incomplete Form", "Please fill out all fields and upload a photo before saving.");
          return;
      }
      if (!user) {
          Alert.alert("Authentication Error", "No user is signed in.");
          return;
      }
      setIsLoading(true);
      try {
        const driverProfileData = {
            ...formData,
            email: user.email,
            uid: user.uid,
            createdAt: new Date(),
        };
        const driverDocRef = doc(db, 'drivers', user.uid);
        await setDoc(driverDocRef, driverProfileData);
        Alert.alert("Success", "Your profile has been saved!", [
          { text: "OK", onPress: () => router.replace('/driver/dashboard') }
        ]);
      } catch (error) {
        console.error("Error saving driver profile: ", error);
        Alert.alert("Error", "Could not save your profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
  };

  const handleClear = () => {
    setFormData({
      fullName: '', phoneNumber: '', gender: null, address: '',
      assignedBusRegistration: null, profilePhotoUrl: null, // Changed from assignedBusId
    });
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Driver Registration</Text>
        <Text style={styles.headerSubtitle}>Please complete your profile</Text>
        
        {/* Photo Section */}
        <View style={styles.photoSection}>
            <TouchableOpacity onPress={takePhoto} style={styles.profileImageContainer}>
                {formData.profilePhotoUrl ? (
                    <Image source={{ uri: formData.profilePhotoUrl }} style={styles.profileImage} />
                ) : (
                    <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="camera" size={40} color="#A9A9A9" />
                        <Text style={styles.placeholderText}>Take Photo</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>

        {/* Form Fields Section */}
        <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Full Name" value={formData.fullName} onChangeText={(text) => handleInputChange('fullName', text)} />
            <TextInput style={styles.input} placeholder="Phone Number" value={formData.phoneNumber} onChangeText={(text) => handleInputChange('phoneNumber', text)} keyboardType="phone-pad" />
            <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>Gender:</Text>
                <TouchableOpacity style={[styles.genderButton, formData.gender === 'Male' && styles.genderButtonSelected]} onPress={() => handleInputChange('gender', 'Male')}>
                    <Text style={[styles.genderText, formData.gender === 'Male' && styles.genderTextSelected]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.genderButton, formData.gender === 'Female' && styles.genderButtonSelected]} onPress={() => handleInputChange('gender', 'Female')}>
                    <Text style={[styles.genderText, formData.gender === 'Female' && styles.genderTextSelected]}>Female</Text>
                </TouchableOpacity>
            </View>
            <TextInput style={styles.inputDisabled} value={user?.email || 'Email not found'} editable={false} />
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Address" value={formData.address} onChangeText={(text) => handleInputChange('address', text)} multiline />
            
            {/* Bus Selection with Search Bar */}
            <View style={styles.busSelector}>
                <Text style={styles.busLabel}>Assign Bus Route:</Text>
                <View style={styles.searchBarContainer}>
                    <Ionicons name="search" size={20} color="#A9A9A9" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search by bus number or route..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <ScrollView style={styles.busList}>
                    {/* --- FIX 4 of 4: Update the UI to use the correct data properties --- */}
                    {filteredBusRoutes.map(bus => (
                        <TouchableOpacity
                            key={bus.registration} // Use 'registration' for the key
                            style={[
                                styles.busOption, 
                                formData.assignedBusRegistration === bus.registration && styles.busOptionSelected // Check against 'assignedBusRegistration'
                            ]}
                            onPress={() => handleInputChange('assignedBusRegistration', bus.registration)} // Save the 'registration'
                        >
                            <Text style={[styles.busText, formData.assignedBusRegistration === bus.registration && styles.busTextSelected]}>
                                {`Bus #${bus.busNumber} (${bus.routeDisplay})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
        
        {/* Action Buttons Section */}
        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, !isFormComplete() && styles.disabledButton]} 
                onPress={handleSave}
                disabled={!isFormComplete() || isLoading}
            >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={20} color="#fff" />}
                <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={handleClear}>
                <Ionicons name="refresh-outline" size={20} color="#333" />
                <Text style={[styles.buttonText, { color: '#333' }]}>All Clear</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Your STYLESHEET is unchanged ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FC' },
    scrollContainer: { padding: 20, paddingBottom: 50 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A2E4C', textAlign: 'center' },
    headerSubtitle: { fontSize: 16, color: '#5A6B8C', textAlign: 'center', marginBottom: 20 },
    photoSection: { alignItems: 'center', marginBottom: 20 },
    profileImageContainer: {
        width: 140, height: 140, borderRadius: 70, backgroundColor: '#E8E8E8',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
        borderWidth: 3, borderColor: '#FFFFFF', elevation: 5,
    },
    profileImage: { width: '100%', height: '100%' },
    profileImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
    placeholderText: { marginTop: 5, color: '#A9A9A9' },
    form: { marginBottom: 20 },
    input: {
        backgroundColor: '#FFFFFF', height: 50, paddingHorizontal: 15,
        borderRadius: 10, fontSize: 16, marginBottom: 15,
        borderWidth: 1, borderColor: '#D1D9E6',
    },
    inputDisabled: {
        backgroundColor: '#E9ECEF', color: '#6C757D', height: 50,
        paddingHorizontal: 15, borderRadius: 10, fontSize: 16, marginBottom: 15,
        borderWidth: 1, borderColor: '#D1D9E6',
    },
    genderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    genderLabel: { fontSize: 16, color: '#5A6B8C', marginRight: 10 },
    genderButton: {
        paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20,
        borderWidth: 1, borderColor: '#D1D9E6', marginRight: 10,
    },
    genderButtonSelected: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
    genderText: { fontSize: 16, color: '#5A6B8C' },
    genderTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
    busSelector: {
        backgroundColor: '#FFFFFF', padding: 15, borderRadius: 10,
        borderWidth: 1, borderColor: '#D1D9E6',
    },
    busLabel: { fontSize: 16, fontWeight: '600', color: '#1A2E4C', marginBottom: 10 },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F7FC',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#D1D9E6',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchBar: {
        flex: 1,
        height: 40,
        fontSize: 16,
    },
    busList: {
        maxHeight: 150, // Limit the height of the scrollable list
    },
    busOption: { padding: 12, borderRadius: 8, marginBottom: 5, borderWidth: 1, borderColor: '#E8E8E8' },
    busOptionSelected: { backgroundColor: '#E0EFFF', borderColor: '#4285F4' },
    busText: { fontSize: 16, color: '#5A6B8C' },
    busTextSelected: { color: '#4285F4', fontWeight: 'bold' },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-around' },
    actionButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 10, width: '45%',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 3,
    },
    saveButton: { backgroundColor: '#28A745' },
    clearButton: { backgroundColor: '#FFC107' },
    disabledButton: { backgroundColor: '#A9A9A9' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});