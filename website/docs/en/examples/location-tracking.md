# Location Tracking

Examples for requesting permission, reading location, and tracking updates.

## Basic location

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { ExpoGaodeMapModule, type ReGeocode } from 'expo-gaode-map';

export default function BasicLocation() {
  const [location, setLocation] = useState<ReGeocode | null>(null);

  useEffect(() => {
    ExpoGaodeMapModule.setPrivacyShow(true, true);
    ExpoGaodeMapModule.setPrivacyAgree(true);
    ExpoGaodeMapModule.initSDK({
      webKey: 'your-web-api-key',
    });
  }, []);

  const getLocation = async () => {
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(loc as ReGeocode);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Get Location" onPress={getLocation} />
      {location && (
        <Text>
          Location: {location.latitude}, {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

## Continuous tracking

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { ExpoGaodeMapModule, type ReGeocode } from 'expo-gaode-map';

export default function ContinuousLocation() {
  const [location, setLocation] = useState<ReGeocode | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    ExpoGaodeMapModule.setPrivacyShow(true, true);
    ExpoGaodeMapModule.setPrivacyAgree(true);
    ExpoGaodeMapModule.initSDK({
      webKey: 'your-web-api-key',
    });

    ExpoGaodeMapModule.setLocatingWithReGeocode(true);
    ExpoGaodeMapModule.setInterval(2000);

    const subscription = ExpoGaodeMapModule.addLocationListener((loc) => {
      setLocation(loc as ReGeocode);
    });

    return () => subscription.remove();
  }, []);

  const startTracking = () => {
    ExpoGaodeMapModule.start();
    setIsTracking(true);
  };

  const stopTracking = () => {
    ExpoGaodeMapModule.stop();
    setIsTracking(false);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
        onPress={isTracking ? stopTracking : startTracking}
      />
      {location && (
        <View>
          <Text>Latitude: {location.latitude.toFixed(6)}</Text>
          <Text>Longitude: {location.longitude.toFixed(6)}</Text>
          <Text>Accuracy: {location.accuracy.toFixed(2)} m</Text>
          {location.address && <Text>Address: {location.address}</Text>}
        </View>
      )}
    </View>
  );
}
```

## Map tracking

```tsx
import { useEffect, useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import {
  ExpoGaodeMapModule,
  MapView,
  type ReGeocode,
} from 'expo-gaode-map';

export default function MapLocationTracking() {
  const [location, setLocation] = useState<ReGeocode | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    ExpoGaodeMapModule.setPrivacyShow(true, true);
    ExpoGaodeMapModule.setPrivacyAgree(true);
    ExpoGaodeMapModule.initSDK({
      webKey: 'your-web-api-key',
    });

    ExpoGaodeMapModule.setLocatingWithReGeocode(true);
    ExpoGaodeMapModule.setInterval(2000);

    const subscription = ExpoGaodeMapModule.addLocationListener((result) => {
      setLocation(result as ReGeocode);
    });

    return () => {
      subscription.remove();
      ExpoGaodeMapModule.stop();
    };
  }, []);

  const toggleTracking = () => {
    if (isTracking) {
      ExpoGaodeMapModule.stop();
    } else {
      ExpoGaodeMapModule.start();
    }
    setIsTracking(!isTracking);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: {
            latitude: location?.latitude || 39.9,
            longitude: location?.longitude || 116.4,
          },
          zoom: 15,
        }}
        myLocationEnabled
        followUserLocation={isTracking}
      />

      <View style={styles.controls}>
        <Button
          title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
          onPress={toggleTracking}
          color={isTracking ? '#FF3B30' : '#007AFF'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});
```

## Related

- [Location API](/en/api/location)
- [Initialization Guide](/en/guide/initialization)
- [Basic Map](/en/examples/basic-map)
