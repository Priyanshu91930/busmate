\# Google Sign-In Setup Guide

## Prerequisites
1. You have a Firebase project set up
2. You have enabled Google Sign-In in Firebase Authentication
3. You have a `.env` file in your project root

## Environment Variables Setup

### 1. Create/Update Your .env File
Make sure your `.env` file contains these variables (see `env-template.txt` for reference):

```bash
# Google Sign-In Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_actual_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=your_ios_url_scheme

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

### 2. Get Your Google Web Client ID
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bustracker-da123`
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. In the "General" tab, scroll down to "Your apps" section
6. Look for your **Web app** (if you don't have one, create it)
7. Copy the "Web client ID" field
8. Paste it as the value for `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in your `.env` file

### 3. Get Your Firebase Configuration
1. In the same Firebase Project Settings page
2. Scroll down to "Your apps" section
3. Click on your web app
4. Copy all the configuration values to your `.env` file

## Current Status
The app is now configured to read from environment variables. Make sure your `.env` file is properly set up.

## Testing
After setting up your `.env` file:
1. Run `expo start`
2. Check the debug section at the bottom of the login screen
3. It should show your actual web client ID and Firebase project ID
4. Try signing in with Google
5. You should see the Google credential manager open
6. After successful authentication, you'll be redirected to the appropriate dashboard

## Troubleshooting
- If you see "NOT SET" in the debug section, check your `.env` file
- Make sure all environment variables start with `EXPO_PUBLIC_`
- Restart your Expo development server after updating `.env`
- Verify that Google Sign-In is enabled in Firebase Authentication
- Check that your app's package name matches what's in Firebase

## Security Note
- Never commit your `.env` file to version control
- The `EXPO_PUBLIC_` prefix makes these variables available to your app
- For production, use secure environment variable management
