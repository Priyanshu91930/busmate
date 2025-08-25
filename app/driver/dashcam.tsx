import { Ionicons } from '@expo/vector-icons';
import { Camera as CameraType } from 'expo-camera';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define a type for the allowed quality keys
type VideoQualityKey = '_1080p' | '_720p' | '_480p';

// Define VideoQuality enum manually to match the keys
enum VideoQuality {
  '_480p' = 'low',
  '_720p' = 'medium',
  '_1080p' = 'high'
}

// Workaround for CameraType runtime value
const CameraTypeValue = {
  back: 'back',
  front: 'front'
};

export default function DashcamScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [quality, setQuality] = useState<VideoQualityKey>('_720p');
  
  const [isQualityModalVisible, setIsQualityModalVisible] = useState(false);
  const cameraRef = useRef<any>(null);

  const getPermissions = async () => {
    const { status } = await CameraType.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  useEffect(() => {
    getPermissions();
  }, []);

  const handleRecord = async () => {
    if (!isCameraReady || !cameraRef.current || isRecording) return;
    setIsRecording(true);
    
    const recordOptions = {
      quality: VideoQuality[quality],
      maxDuration: 600,
      mute: false,
    };
    console.log(`Starting recording with options:`, recordOptions);

    try {
      const videoRecordPromise = cameraRef.current.recordAsync(recordOptions);
      if (videoRecordPromise) {
        const data = await videoRecordPromise;
        console.log('Video saved to:', data.uri);
        Alert.alert("Recording Saved", `Video has been saved to your library.`);
      }
    } catch (error) {
      console.error("Failed to record video:", error);
      Alert.alert("Error", "Could not start recording.");
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const QualitySelectorModal = () => (
    <Modal
        transparent={true}
        visible={isQualityModalVisible}
        onRequestClose={() => setIsQualityModalVisible(false)}
    >
        <Pressable style={styles.modalOverlay} onPress={() => setIsQualityModalVisible(false)}>
            <View style={styles.qualityModalContainer}>
                <Text style={styles.modalTitle}>Select Video Quality</Text>
                <TouchableOpacity style={styles.qualityOption} onPress={() => { setQuality('_480p'); setIsQualityModalVisible(false); }}>
                    <Text style={styles.qualityText}>480p (Low)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qualityOption} onPress={() => { setQuality('_720p'); setIsQualityModalVisible(false); }}>
                    <Text style={styles.qualityText}>720p (HD)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qualityOption} onPress={() => { setQuality('_1080p'); setIsQualityModalVisible(false); }}>
                    <Text style={styles.qualityText}>1080p (Full HD)</Text>
                </TouchableOpacity>
            </View>
        </Pressable>
    </Modal>
  );

  // Existing render logic for permissions
  if (hasPermission === null) { 
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) { 
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={getPermissions}>
          <Text style={styles.permissionButtonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!Device.isDevice) { 
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>Camera only works on physical devices</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* @ts-ignore */}
      <CameraType
        ref={cameraRef}
        style={styles.camera}
        type={CameraTypeValue.back}
        onCameraReady={() => setIsCameraReady(true)}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => setIsQualityModalVisible(true)}>
              <Ionicons name="settings-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.recordButton, !isCameraReady && { backgroundColor: 'grey' }]}
              onPress={isRecording ? stopRecording : handleRecord}
              disabled={!isCameraReady}
            >
              <View style={isRecording ? styles.recordIconStop : styles.recordIconStart} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraType>
      <QualitySelectorModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... your existing styles
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, marginTop: 20 },
  bottomBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 30 },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 50 },
  recordButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(0,0,0,0.2)' },
  recordIconStart: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'red' },
  recordIconStop: { width: 30, height: 30, backgroundColor: 'red', borderRadius: 5 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  qualityModalContainer: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  qualityOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  qualityText: { fontSize: 16, textAlign: 'center' },

  // --- ADDED: Styles for the permission handling UI ---
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  permissionButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});