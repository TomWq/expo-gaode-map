# Privacy Compliance Guide

## Overview

According to Chinese laws, regulations, and AMap SDK requirements, applications must:

1. **Inform Users**: Display privacy policy to users
2. **Obtain Consent**: Users must explicitly agree to the privacy agreement
3. **Compliant Initialization**: SDK functions can only be called after user consent

## Platform Differences

- **iOS**: Uses `MAMapView.updatePrivacyAgree` and `MAMapView.updatePrivacyShow`
- **Android**: Uses `MapsInitializer.updatePrivacyAgree` and `AMapLocationClient.updatePrivacyAgree`

Both platforms require user consent before using any SDK features.

## Usage Flow

### 1. Create Privacy Agreement Dialog (Cross-Platform)

```javascript
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const PrivacyAgreement = ({ onAgreed }) => {
  useEffect(() => {
    // Show privacy agreement dialog
    Alert.alert(
      'Privacy Agreement',
      'Before using map and location features, please read and agree to our privacy policy.\n\n' +
      'We will collect your location information to provide map display, navigation services, etc.\n\n' +
      'Click "Agree" to confirm that you have read and agree to our privacy policy.',
      [
        {
          text: 'Disagree',
          onPress: () => {
            // User disagreed, exit app or limit features
            console.log('User disagreed with privacy agreement');
            // Navigate to limited functionality page
          },
          style: 'cancel',
        },
        {
          text: 'Agree',
          onPress: () => {
            // User agreed, update compliance status and initialize SDK
            ExpoGaodeMapModule.updatePrivacyCompliance(true);
            
            // Initialize SDK
            ExpoGaodeMapModule.initSDK({
              iosKey: 'your-ios-api-key',
              androidKey: 'your-android-api-key',
            });
            
            onAgreed();
          },
        },
      ],
      { cancelable: false }
    );
  }, []);

  return null;
};
```

### 2. Handle Privacy Agreement on App Startup

```javascript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { PrivacyAgreement } from './PrivacyAgreement';

export default function App() {
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [location, setLocation] = useState(null);

  const handlePrivacyAgreed = async () => {
    setPrivacyAgreed(true);
    
    // Privacy agreement agreed, SDK features can be used
    try {
      // Request location permissions
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        const result = await ExpoGaodeMapModule.requestLocationPermission();
        if (!result.granted) {
          console.log('Location permission denied');
          return;
        }
      }
      
      // Start location
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.error('Location failed:', error);
    }
  };

  if (!privacyAgreed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Waiting for user agreement to privacy policy...</Text>
        <PrivacyAgreement onAgreed={handlePrivacyAgreed} />
      </View>
    );
  }

  // Privacy agreement agreed, show main app interface
  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
      {location && (
        <Text>
          Current location: {location.latitude}, {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

### 3. Error Handling

The SDK will throw errors in the following situations:

```javascript
try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error.code === 'PRIVACY_NOT_AGREED') {
    // User hasn't agreed to privacy agreement
    Alert.alert('Notice', 'Please agree to the privacy agreement first');
  } else if (error.code === 'API_KEY_NOT_SET') {
    // API Key not set
    Alert.alert('Error', 'API Key not set');
  } else if (error.code === 'LOCATION_ERROR') {
    // Location error
    Alert.alert('Location Failed', error.message);
  }
}
```

## Android Specific Notes

### 1. Permission Declaration

Configure the plugin in `app.json` to automatically add necessary permissions:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidApiKey": "your-android-key",
          "enableLocation": true
        }
      ]
    ]
  }
}
```

The plugin will automatically add the following permissions to AndroidManifest.xml:
- `ACCESS_FINE_LOCATION` - Precise location
- `ACCESS_COARSE_LOCATION` - Approximate location
- `ACCESS_NETWORK_STATE` - Network state
- `ACCESS_WIFI_STATE` - WiFi state
- `INTERNET` - Network access

### 2. Background Location (Optional)

If background location is needed, enable it in plugin configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidApiKey": "your-android-key",
          "enableBackgroundLocation": true
        }
      ]
    ]
  }
}
```

This will automatically add:
- `ACCESS_BACKGROUND_LOCATION` - Background location permission
- `FOREGROUND_SERVICE` - Foreground service
- `FOREGROUND_SERVICE_LOCATION` - Location foreground service

## iOS Specific Notes

### 1. Info.plist Configuration

The plugin will automatically add necessary configurations:
- `AMapApiKey` - AMap API Key
- `NSLocationWhenInUseUsageDescription` - Location permission description for use during app usage
- `NSLocationAlwaysUsageDescription` - Location permission description for always usage (when background location is enabled)

## Best Practices

### 1. Privacy Policy Content

Your privacy policy should include:
- Types of information collected (location info, device info, etc.)
- Purpose of information usage (provide maps, navigation, etc.)
- Information storage and protection measures
- User rights (access, correct, delete, etc.)
- Contact information

### 2. Record User Consent

It's recommended to save user's consent choice locally:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const savePrivacyAgreement = async (agreed: boolean) => {
  try {
    await AsyncStorage.setItem('privacy_agreed', agreed.toString());
  } catch (error) {
    console.error('Failed to save privacy agreement status:', error);
  }
};

const checkPrivacyAgreement = async () => {
  try {
    const agreed = await AsyncStorage.getItem('privacy_agreed');
    return agreed === 'true';
  } catch (error) {
    console.error('Failed to read privacy agreement status:', error);
    return false;
  }
};
```

### 3. App Startup Check

```javascript
useEffect(() => {
  const initialize = async () => {
    // Check if user has agreed to privacy agreement
    const agreed = await checkPrivacyAgreement();
    
    if (agreed) {
      // Already agreed, directly update compliance status
      ExpoGaodeMapModule.updatePrivacyCompliance(true);
      
      // Initialize SDK
      ExpoGaodeMapModule.initSDK({
        iosKey: 'your-ios-api-key',
        androidKey: 'your-android-api-key',
      });
      
      setPrivacyAgreed(true);
    } else {
      // Not agreed, show privacy agreement
      // PrivacyAgreement component will handle
    }
  };
  
  initialize();
}, []);
```

## Important Notes

1. **Consent First**: All SDK features (including map display and location) require user consent before use

2. **One-time Agreement**: Privacy agreement only needs user consent once, recommend handling at app startup

3. **Clear Notification**: Clearly inform users what information will be collected and its purpose

4. **Provide Rejection Option**: Users can choose to disagree, in which case no SDK features should be used

5. **Privacy Policy Updates**: If privacy policy is updated, user consent needs to be obtained again