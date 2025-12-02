# Usage Examples

English | [简体中文](./EXAMPLES.md)

Complete usage examples and best practices.

> 📖 **Recommended Reading**: [Initialization Guide](./INITIALIZATION.en.md) - Detailed initialization process and permission handling

## Table of Contents

- [Complete Application Example](#complete-application-example)
- [Basic Map Application](#basic-map-application)
- [Location Tracking Application](#location-tracking-application)
- [Overlay Examples](#overlay-examples)
- [Advanced Usage](#advanced-usage)

## Complete Application Example

Complete example with permission management, error handling, and loading states:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Alert, Linking, Platform } from 'react-native';
import {
  MapView,
  initSDK,
  checkLocationPermission,
  requestLocationPermission,
  getCurrentLocation,
  type LatLng,
} from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState<{
    target: LatLng;
    zoom: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Initialize SDK
        initSDK({
          androidKey: 'your-android-api-key',
          iosKey: 'your-ios-api-key',
        });
        
        // 2. Check permission
        const status = await checkLocationPermission();
        
        // 3. Request permission if needed
        if (!status.granted) {
          const result = await requestLocationPermission();
          
          if (!result.granted) {
            // Permission denied
            setInitialPosition({
              target: { latitude: 39.9, longitude: 116.4 },
              zoom: 10
            });
            
            // Guide user to settings
            if (!result.canAskAgain) {
              Alert.alert(
                'Location Permission Required',
                'Please enable location permission in settings',
                [
                  { text: 'Cancel' },
                  { text: 'Settings', onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  }}
                ]
              );
            }
            return;
          }
        }
        
        // 4. Get location
        const location = await getCurrentLocation();
        setInitialPosition({
          target: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          zoom: 15
        });
        
      } catch (err) {
        console.error('Initialization failed:', err);
        setError('Initialization failed');
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10
        });
      }
    };

    initialize();
  }, []);

  // Loading state
  if (!initialPosition && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition!}
      myLocationEnabled={true}
      onLoad={() => console.log('Map loaded')}
    />
  );
}
```

## Basic Map Application

```tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { 
  MapView, 
  initSDK,
  Circle,
  Marker,
  Polyline,
  Polygon,
  type MapViewRef 
} from 'expo-gaode-map';

export default function App() {
  const mapRef = useRef<MapViewRef>(null);

  useEffect(() => {
    const initialize = async () => {
      initSDK({
        androidKey: 'your-android-api-key',
        iosKey: 'your-ios-api-key',
      });
      
      // Check and request permission
      const status = await checkLocationPermission();
      if (!status.granted) {
        await requestLocationPermission();
      }
    };
    
    initialize();
  }, []);

  const handleMoveCamera = async () => {
    await mapRef.current?.moveCamera(
      {
        target: { latitude: 40.0, longitude: 116.5 },
        zoom: 15,
      },
      1000
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10,
        }}
        myLocationEnabled={true}
        followUserLocation={false}
        trafficEnabled={true}
        onMapPress={(e) => console.log('Map pressed', e.nativeEvent)}
        onLoad={() => console.log('Map loaded')}
      >
        {/* Circle overlay */}
        <Circle
          center={{ latitude: 39.9, longitude: 116.4 }}
          radius={1000}
          fillColor="#8800FF00"
          strokeColor="#FFFF0000"
          strokeWidth={2}
        />

        {/* Marker */}
        <Marker
          position={{ latitude: 39.95, longitude: 116.45 }}
          title="This is a marker"
          draggable={true}
        />

        {/* Polyline */}
        <Polyline
          points={[
            { latitude: 39.9, longitude: 116.4 },
            { latitude: 39.95, longitude: 116.45 },
            { latitude: 40.0, longitude: 116.5 },
          ]}
          width={5}
          color="#FF0000FF"
        />

        {/* Polygon */}
        <Polygon
          points={[
            { latitude: 39.85, longitude: 116.35 },
            { latitude: 39.85, longitude: 116.45 },
            { latitude: 39.75, longitude: 116.40 },
          ]}
          fillColor="#880000FF"
          strokeColor="#FFFF0000"
          strokeWidth={2}
        />
      </MapView>

      <View style={styles.controls}>
        <Button title="Move Camera" onPress={handleMoveCamera} />
      </View>
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
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
```

## Location Tracking Application

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { 
  MapView,
  initSDK,
  configure,
  start,
  stop,
  getCurrentLocation,
  addLocationListener,
  type Location,
} from 'expo-gaode-map';

export default function LocationApp() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Initialize SDK
      initSDK({
        androidKey: 'your-android-api-key',
        iosKey: 'your-ios-api-key',
      });

      // Check and request permission
      const status = await checkLocationPermission();
      if (!status.granted) {
        await requestLocationPermission();
      }

      // Configure location parameters
      configure({
        withReGeocode: true,
        mode: 0,
        interval: 2000,
      });

      // Listen to location updates
      const subscription = addLocationListener((loc) => {
        console.log('Location update:', loc);
        setLocation(loc);
      });

      return () => subscription.remove();
    };

    initialize();
  }, []);

  const handleStartTracking = () => {
    start();
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    stop();
    setIsTracking(false);
  };

  const handleGetLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.error('Get location failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        myLocationEnabled={true}
        followUserLocation={isTracking}
        initialCameraPosition={{
          target: { 
            latitude: location?.latitude || 39.9, 
            longitude: location?.longitude || 116.4 
          },
          zoom: 15,
        }}
      />

      {location && (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            Latitude: {location.latitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            Longitude: {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            Accuracy: {location.accuracy.toFixed(2)} m
          </Text>
          {location.address && (
            <Text style={styles.infoText}>
              Address: {location.address}
            </Text>
          )}
        </View>
      )}

      <View style={styles.controls}>
        <Button 
          title="Get Location" 
          onPress={handleGetLocation} 
        />
        <View style={{ height: 10 }} />
        <Button 
          title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
          color={isTracking ? '#FF3B30' : '#007AFF'}
        />
      </View>
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
    marginBottom: 5,
    color: '#333',
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});
```

## Overlay Examples

### Circle

**Declarative usage:**
```tsx
<MapView style={{ flex: 1 }}>
  <Circle
    center={{ latitude: 39.9, longitude: 116.4 }}
    radius={1000}
    fillColor="#8800FF00"
    strokeColor="#FFFF0000"
    strokeWidth={2}
    onPress={(e) => console.log('Circle pressed')}
  />
</MapView>
```


### Marker

**Declarative usage - Basic marker:**
```tsx
<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="Title"
    snippet="Description"
    draggable={true}
    onPress={(e) => console.log('Marker pressed')}
    onDragEnd={(e) => console.log('Drag ended', e.nativeEvent)}
  />
</MapView>
```

**Declarative usage - Custom icon:**
```tsx
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./assets/marker-icon.png')).uri;

<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="Custom Icon"
    icon={iconUri}
    iconWidth={50}
    iconHeight={50}
    onPress={(e) => console.log('Custom icon marker pressed')}
  />
</MapView>
```

**Declarative usage - Custom view:**
```tsx
import { View, Text, StyleSheet } from 'react-native';

<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    customViewWidth={120}
    customViewHeight={40}
    onPress={(e) => console.log('Custom view marker pressed')}
  >
    <View style={styles.markerContainer}>
      <Text style={styles.markerText}>Custom Content</Text>
    </View>
  </Marker>
</MapView>

const styles = StyleSheet.create({
  markerContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  markerText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
```

> **Important Notes**:
> - **Custom Icon**: Use `icon` property with `iconWidth` and `iconHeight` to control icon size
> - **Custom View**: Use `children` with `customViewWidth` and `customViewHeight` to control custom view size
> - `iconWidth/iconHeight` only apply to `icon` property, not `children`
> - `customViewWidth/customViewHeight` only apply to `children` property, not `icon`

**Imperative usage:**
```tsx
await mapRef.current?.addMarker('marker1', {
  position: { latitude: 39.9, longitude: 116.4 },
  title: 'Title',
  snippet: 'Description',
  draggable: true,
});

await mapRef.current?.updateMarker('marker1', {
  position: { latitude: 40.0, longitude: 116.5 },
});

await mapRef.current?.removeMarker('marker1');
```

> **⚠️ Limitation**: Markers added via imperative API **do not support event callbacks** (onPress, onDragEnd, etc.). Use declarative `<Marker>` component for event handling.

### Polyline

**Declarative usage - Normal polyline:**
```tsx
<MapView style={{ flex: 1 }}>
  <Polyline
    points={[
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.95, longitude: 116.45 },
      { latitude: 40.0, longitude: 116.5 },
    ]}
    width={5}
    color="#FFFF0000"
    onPress={(e) => console.log('Polyline pressed')}
  />
</MapView>
```

**Declarative usage - Textured polyline:**
```tsx
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./assets/arrow.png')).uri;

<MapView style={{ flex: 1 }}>
  <Polyline
    points={[
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.95, longitude: 116.45 },
      { latitude: 40.0, longitude: 116.5 },
    ]}
    width={20}
    color="#FFFF0000"
    texture={iconUri}
    onPress={(e) => console.log('Textured polyline pressed')}
  />
</MapView>
```

> **Note**:
> - Color format uses ARGB (`#AARRGGBB`), e.g., `#FFFF0000` for opaque red
> - `texture` supports network images (http/https) and local files (file://)
> - Texture tiles along the polyline direction
> - Recommend larger `width` values (e.g., 20) for better texture display
> - **Segment Texture Limitation**: Single Polyline can only have one texture. For different textures on segments, create multiple Polyline components

### Polygon

**Declarative usage:**
```tsx
<MapView style={{ flex: 1 }}>
  <Polygon
    points={[
      { latitude: 39.9, longitude: 116.3 },
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.8, longitude: 116.4 },
    ]}
    fillColor="#8800FF00"
    strokeColor="#FFFF0000"
    strokeWidth={2}
    onPress={(e) => console.log('Polygon pressed')}
  />
</MapView>
```

**Imperative usage:**
```tsx
await mapRef.current?.addPolygon('polygon1', {
  points: [
    { latitude: 39.9, longitude: 116.3 },
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.8, longitude: 116.4 },
  ],
  fillColor: 0x8800FF00,
  strokeColor: 0xFFFF0000,
  strokeWidth: 2,
});
```

## Advanced Usage

### Custom Location Blue Dot

```tsx
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./assets/location-icon.png')).uri;

<MapView
  myLocationEnabled={true}
  userLocationRepresentation={{
    showsAccuracyRing: true,
    fillColor: '#4285F4',
    strokeColor: '#1967D2',
    lineWidth: 2,
    image: iconUri,
    imageWidth: 40,
    imageHeight: 40,
  }}
/>
```


### Zoom Level Limits

```tsx
<MapView
  maxZoom={18}
  minZoom={5}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
/>
```

### Heading Updates (iOS)

```tsx
import { startUpdatingHeading, stopUpdatingHeading } from 'expo-gaode-map';

// Start heading updates
startUpdatingHeading();

// Stop heading updates
stopUpdatingHeading();