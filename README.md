# BusMate: Smart Campus Bus Tracking Application

<table>
<tr>
  <td>
    <img width="200" height="500" alt="Screenshot_1755542288" src="https://github.com/user-attachments/assets/cb4a5cca-fc17-466f-ad2d-e1e575e0c865" />
  </td>
  <td>
    
  ## 🚌 Project Overview  
  BusMate is an innovative mobile application designed to simplify campus transportation  
  by providing real-time bus tracking, route information, and seamless navigation  
  for students and drivers.
  </td>
</tr>
</table>

---

## 🌟 Key Features

### 🔑 Google Authentication
<table>
<tr>
  <td>
    <img width="200" height="500" alt="Screenshot_1755542386" src="https://github.com/user-attachments/assets/2255b2c4-cc0a-4fea-9bfd-36c3c7016e5c" />
  </td>
  <td>
    Login quickly and securely with Google Authentication.  
    Smooth onboarding experience for students and drivers.  
  </td>
</tr>
<tr>
  <td>
    <img width="200" height="500" alt="Screenshot_1755542400" src="https://github.com/user-attachments/assets/a1e69151-6050-48aa-b56d-5a8e78db6434" />
  </td>
  <td>
    Session management and persistent login across devices.  
  </td>
</tr>
<tr>
  <td>
    <img width="200" height="500" alt="Screenshot_1755542408" src="https://github.com/user-attachments/assets/0e4d5763-2770-4c05-837e-4d6b12235b18" />
  </td>
  <td>
    Secure integration with Firebase Authentication.  
  </td>
</tr>
</table>

---

### 👩‍🎓 Student Features
<table>
<tr>
  <td>
    <img width="200" height="500" alt="Screenshot_1755542330" src="https://github.com/user-attachments/assets/38f42b0c-1f6d-4a65-a789-802da6e82617" />
  </td>
  <td>
    **Interactive Bus Route Map**  
    - Real-time bus location tracking  
    - Route visualization with Google Maps integration  
    - Stop information and bus availability  
  </td>
</tr>
<tr>
  <td>
    <img width="200" height="500" alt="Screenshot_1755542289" src="https://github.com/user-attachments/assets/8ae14021-e053-4a42-80ea-78e2607c707e" />
  </td>
  <td>
    **Dashboard**  
    - Search and filter bus stops  
    - View available buses for each stop  
    - Quick route selection  
  </td>
</tr>
<tr>
  <td>
    <img width="200" height="500" alt="Screenshot_1755542315" src="https://github.com/user-attachments/assets/7a178b56-6516-4b33-bd52-b2bb058979da" />
  </td>
  <td>
    Easy navigation with real-time updates.  
  </td>
</tr>
</table>

---

### 👨‍✈️ Driver Features
<table>
<tr>
  <td>
    <img width="200" height="500" alt="Screenshot_1755347864" src="https://github.com/user-attachments/assets/648a7fe8-faf3-4dd4-ab4f-0b978b5ab9ed" />
  </td>
  <td>
    **Location Sharing**  
    - Real-time GPS location updates  
    - Bus status management (online/offline)  
    - Route tracking and management  
  </td>
</tr>
</table>


## 🔧 Technical Architecture

### Technologies Used
- React Native
- Expo
- Firebase Firestore
- Google Maps API
- TypeScript

### Key APIs and Functions

#### Geocoding
- `geocodeLocation(locationName: string)`: Converts location names to geographic coordinates
- Supports dynamic route calculation based on stop names

#### Location Services
- `handleFetchUserLocation()`: Retrieves user's current location
- Reverse geocoding for address detection

#### Bus Route Management
- `fetchOnRoadRoute()`: Calculates optimal bus routes
- Dynamic waypoint optimization
- Real-time route updates

---

## 🐛 Problem Fixes (Realtime)
- Improved route calculation accuracy
- Enhanced location tracking precision
- Optimized bus stop coordinate retrieval
- Fixed header layout conflicts
- Improved status bar and notification icon integration

---

## 🚀 Upcoming Features
1. **Enhanced Notifications**
   - Push notifications for bus arrivals
   - Personalized route alerts
2. **Offline Mode**
   - Cached route information
   - Reduced data dependency
3. **Advanced Analytics**
   - Passenger count tracking
   - Route performance metrics
4. **Multi-campus Support**
   - Expandable to multiple educational institutions

---

## 🛠 Development Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for Android builds)
- Firebase Project

### Installation
```bash
# Clone the repository
git clone https://github.com/priyanshu91930/busmate.git

# Install dependencies
cd busmate
npm install

# Start development server
npx expo start
