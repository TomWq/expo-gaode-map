# Location Tracking

Learn how to implement location tracking features.

## Request Permission

Before using location features, request permission:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

export default function LocationPermission() {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const granted = await ExpoGaodeMapModule.hasLocationPermission();
    setHasPermission(granted);
  };

  const requestPermission = async () => {
    const granted = await ExpoGaodeMapModule.requestLocationPermission();
    if (granted) {
      setHasPermission(true);
      Alert.alert('Success', 'Location permission granted');
    } else {
      Alert.alert('Error', 'Location permission denied');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text>Permission Status: {hasPermission ? 'Granted' : 'Not Granted'}</Text>
      {!hasPermission && (
        <Button title="Request Permission" onPress={requestPermission} />
      )}
    </View>
  );
}
```

## Display User Location

Show user location on map:

```tsx
import { MapView } from 'expo-gaode-map';

export default function MapWithLocation() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 15,
      }}
      myLocationEnabled={true}
      followUserLocation={true}
    />
  );
}
```

## Continuous Location Updates

Listen to location updates:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpoGaodeMapModule, MapView } from 'expo-gaode-map';

export default function ContinuousLocation() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Configure location
    ExpoGaodeMapModule.setLocatingWithReGeocode(true);
    ExpoGaodeMapModule.setInterval(2000);

    // Start location
    ExpoGaodeMapModule.start();

    // Listen to updates
    const subscription = ExpoGaodeMapModule.addLocationListener(
      'onLocationUpdate',
      (loc) => {
        console.log('Location updated:', loc);
        setLocation(loc);
      }
    );

    return () => {
      subscription.remove();
      ExpoGaodeMapModule.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        myLocationEnabled={true}
        followUserLocation={true}
      />
      {location && (
        <View style={styles.info}>
          <Text>Latitude: {location.latitude.toFixed(6)}</Text>
          <Text>Longitude: {location.longitude.toFixed(6)}</Text>
          <Text>Accuracy: {location.accuracy.toFixed(2)}m</Text>
          {location.address && <Text>Address: {location.address}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  info: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
```

## Single Location Request

Get location once:

```tsx
import { useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

export default function SingleLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={loading ? 'Getting Location...' : 'Get My Location'}
        onPress={getCurrentLocation}
        disabled={loading}
      />
      {location && (
        <View style={styles.result}>
          <Text style={styles.title}>Current Location:</Text>
          <Text>Latitude: {location.latitude}</Text>
          <Text>Longitude: {location.longitude}</Text>
          <Text>Accuracy: {location.accuracy}m</Text>
          {location.address && <Text>Address: {location.address}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  result: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
```

## Custom Location Marker

Customize the location marker style:

```tsx
<MapView
  style={{ flex: 1 }}
  myLocationEnabled={true}
  userLocationRepresentation={{
    showsAccuracyRing: true,
    fillColor: '#4A90E2',
    strokeColor: '#FFFFFF',
    lineWidth: 2,
    enablePulseAnimation: true,
  }}
/>
```

## Complete Example

A complete location tracking app:

```tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { MapView, ExpoGaodeMapModule } from 'expo-gaode-map';

export default function LocationTrackingExample() {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      // Initialize SDK
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-key',
        iosKey: 'your-ios-key',
      });

      // Request permission
      const granted = await ExpoGaodeMapModule.requestLocationPermission();
      if (granted) {
        setIsReady(true);
      } else {
        Alert.alert('Permission Required', 'Location permission is required');
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  const startTracking = () => {
    ExpoGaodeMapModule.setLocatingWithReGeocode(true);
    ExpoGaodeMapModule.setInterval(2000);
    
    const subscription = ExpoGaodeMapModule.addLocationListener(
      'onLocationUpdate',
      setLocation
    );

    ExpoGaodeMapModule.start();
    setIsTracking(true);

    return subscription;
  };

  const stopTracking = (subscription) => {
    subscription?.remove();
    ExpoGaodeMapModule.stop();
    setIsTracking(false);
  };

  useEffect(() => {
    if (!isReady) return;

    const subscription = startTracking();
    return () => stopTracking(subscription);
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text>Initializing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        myLocationEnabled={true}
        followUserLocation={isTracking}
        initialCameraPosition={{
          target: location || { latitude: 39.9, longitude: 116.4 },
          zoom: 15,
        }}
      />
      
      {location && (
        <View style={styles.locationInfo}>
          <Text style={styles.infoText}>
            📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            🎯 Accuracy: {location.accuracy.toFixed(2)}m
          </Text>
          {location.address && (
            <Text style={styles.infoText}>📮 {location.address}</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isTracking && styles.buttonActive]}
        onPress={() => {
          if (isTracking) {
            ExpoGaodeMapModule.stop();
            setIsTracking(false);
          } else {
            ExpoGaodeMapModule.start();
            setIsTracking(true);
          }
        }}
      >
        <Text style={styles.buttonText}>
          {isTracking ? '⏸ Stop Tracking' : '▶️ Start Tracking'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    marginVertical: 2,
  },
  button: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonActive: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

## Next Steps

- [Location API](/en/api/location) - Complete location API reference
- [MapView API](/en/api/mapview) - Map configuration options
- [Overlays](/en/examples/overlays) - Add markers and shapes