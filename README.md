# BusMate: Smart Campus Bus Tracking Application
<img width="200" height="500" alt="Screenshot_1755542288" src="https://github.com/user-attachments/assets/cb4a5cca-fc17-466f-ad2d-e1e575e0c865" />## 🚌 Project Overview
BusMate is an innovative mobile application designed to simplify campus transportation by providing real-time bus tracking, route information, and seamless navigation for students and drivers.



## 🌟 Key Features

## Google auth 
<img width="1344" height="2992" alt="Screenshot_1755542386" src="https://github.com/user-attachments/assets/2255b2c4-cc0a-4fea-9bfd-36c3c7016e5c" />
<img width="1344" height="2992" alt="Screenshot_1755542400" src="https://github.com/user-attachments/assets/a1e69151-6050-48aa-b56d-5a8e78db6434" />
<img width="1344" height="2992" alt="Screenshot_1755542408" src="https://github.com/user-attachments/assets/0e4d5763-2770-4c05-837e-4d6b12235b18" />

### Student Features
- **Interactive Bus Route Map**
  - Real-time bus location tracking
  - Route visualization with Google Maps integration
  - Stop inform
  - <img width="1344" height="2992" alt="Screenshot_1755542330" src="https://github.com/user-attachments/assets/38f42b0c-1f6d-4a65-a789-802da6e82617" />
ation and bus availability

- **Dashboard**
  - Search and filter bus stops
  - View available buses for each stop
  - Quick route selection
<img width="1344" height="2992" alt="Screenshot_1755542289" src="https://github.com/user-attachments/assets/8ae14021-e053-4a42-80ea-78e2607c707e" />
<img width="1344" height="2992" alt="Screenshot_1755542315" src="https://github.com/user-attachments/assets/7a178b56-6516-4b33-bd52-b2bb058979da" />


### Driver Features
- **Location Sharing**
  - Real-time GPS location updates
  - Bus status management (online/offline)
  - Route tracking and management
<img width="1344" height="2992" alt="Screenshot_1755347864" src="https://github.com/user-attachments/assets/648a7fe8-faf3-4dd4-ab4f-0b978b5ab9ed" />


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

## 🐛 Problem Fixes (Realtime)
- Improved route calculation accuracy
- Enhanced location tracking precision
- Optimized bus stop coordinate retrieval
- Fixed header layout conflicts
- Improved status bar and notification icon integration

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
```

## 📱 Build and Deployment

### Android APK
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
expo login

# Build Android APK
eas build --platform android --profile production
```

## 🔒 Security Features
- Firebase Authentication
- Role-based access control
- Secure location sharing
- Environment variable protection

## 📊 Performance Optimization
- Memoized data processing
- Efficient state management
- Minimal API calls
- Optimized rendering techniques

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License
[Your License Here - e.g., MIT]

## 📞 Contact
[9193345928]
