# Basic Map

Learn how to create and configure a basic map.

## Basic Display

The simplest map display:

```tsx
import { MapView } from 'expo-gaode-map';

export default function BasicMap() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    />
  );
}
```

## Map Types

Switch between different map types:

```tsx
import { MapView, MapType } from 'expo-gaode-map';
import { useState } from 'react';
import { View, Button } from 'react-native';

export default function MapWithTypes() {
  const [mapType, setMapType] = useState(MapType.Standard);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        mapType={mapType}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10,
        }}
      />
      <View style={{ position: 'absolute', top: 50, right: 10 }}>
        <Button title="Standard" onPress={() => setMapType(MapType.Standard)} />
        <Button title="Satellite" onPress={() => setMapType(MapType.Satellite)} />
        <Button title="Night" onPress={() => setMapType(MapType.Night)} />
      </View>
    </View>
  );
}
```

## Control Display

Configure map controls:

```tsx
<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  // Controls
  compassEnabled={true}
  scaleControlsEnabled={true}
  zoomControlsEnabled={true}  // Android only
  
  // Layers
  trafficEnabled={true}
  buildingsEnabled={true}
  
  // Gestures
  zoomGesturesEnabled={true}
  scrollGesturesEnabled={true}
  rotateGesturesEnabled={true}
  tiltGesturesEnabled={true}
/>
```

## Camera Control

Use ref to control camera:

```tsx
import { useRef } from 'react';
import { View, Button } from 'react-native';
import { MapView, type MapViewRef } from 'expo-gaode-map';

export default function MapWithCamera() {
  const mapRef = useRef<MapViewRef>(null);

  const moveToBeijing = () => {
    mapRef.current?.moveCamera(
      {
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 12,
      },
      1000 // Animation duration
    );
  };

  const zoomIn = async () => {
    const position = await mapRef.current?.getCameraPosition();
    if (position && position.zoom) {
      mapRef.current?.setZoom(position.zoom + 1, true);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10,
        }}
      />
      <View style={{ position: 'absolute', bottom: 50, left: 10 }}>
        <Button title="Go to Beijing" onPress={moveToBeijing} />
        <Button title="Zoom In" onPress={zoomIn} />
      </View>
    </View>
  );
}
```

## Map Events

Listen to map events:

```tsx
import { MapView } from 'expo-gaode-map';

export default function MapWithEvents() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      onLoad={() => {
        console.log('Map loaded');
      }}
      onMapPress={(e) => {
        console.log('Map pressed:', e.nativeEvent);
      }}
      onMapLongPress={(e) => {
        console.log('Map long pressed:', e.nativeEvent);
      }}
      onCameraMove={(e) => {
        console.log('Camera moving:', e.nativeEvent);
      }}
      onCameraIdle={(e) => {
        console.log('Camera idle:', e.nativeEvent);
      }}
    />
  );
}
```

## Complete Example

A complete map application with all features:

```tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { MapView, MapType, type MapViewRef } from 'expo-gaode-map';

export default function CompleteMapExample() {
  const mapRef = useRef<MapViewRef>(null);
  const [mapType, setMapType] = useState(MapType.Standard);
  const [trafficEnabled, setTrafficEnabled] = useState(false);

  const moveToShanghai = () => {
    mapRef.current?.moveCamera(
      {
        target: { latitude: 31.2, longitude: 121.5 },
        zoom: 12,
      },
      1000
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
        trafficEnabled={trafficEnabled}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10,
        }}
        compassEnabled={true}
        scaleControlsEnabled={true}
        onLoad={() => console.log('Map ready')}
      />
      
      <View style={styles.controls}>
        <Button
          title={mapType === MapType.Standard ? 'Satellite' : 'Standard'}
          onPress={() => 
            setMapType(mapType === MapType.Standard ? MapType.Satellite : MapType.Standard)
          }
        />
        <Button
          title={trafficEnabled ? 'Hide Traffic' : 'Show Traffic'}
          onPress={() => setTrafficEnabled(!trafficEnabled)}
        />
        <Button title="Go to Shanghai" onPress={moveToShanghai} />
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
    top: 50,
    right: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
  },
});
```

## Next Steps

- [Location Tracking](/en/examples/location-tracking) - Add location features
- [Overlays](/en/examples/overlays) - Add markers and shapes
- [MapView API](/en/api/mapview) - Complete API reference