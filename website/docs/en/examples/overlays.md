# Overlays

Learn how to add various overlays to the map.

## Markers

### Basic Marker

```tsx
import { MapView, Marker } from 'expo-gaode-map';

export default function BasicMarker() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="Beijing"
        snippet="Capital of China"
      />
    </MapView>
  );
}
```

### Custom Icon Marker

```tsx
import { Image } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';

export default function CustomIconMarker() {
  const iconUri = Image.resolveAssetSource(require('./marker.png')).uri;

  return (
    <MapView style={{ flex: 1 }}>
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        icon={iconUri}
        iconWidth={50}
        iconHeight={50}
      />
    </MapView>
  );
}
```

### Custom View Marker

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';

export default function CustomViewMarker() {
  return (
    <MapView style={{ flex: 1 }}>
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        customViewWidth={100}
        customViewHeight={40}
      >
        <View style={styles.customMarker}>
          <Text style={styles.markerText}>📍 Beijing</Text>
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  customMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  markerText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
```

### Draggable Marker

```tsx
import { useState } from 'react';
import { View, Text } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';

export default function DraggableMarker() {
  const [position, setPosition] = useState({ latitude: 39.9, longitude: 116.4 });

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }}>
        <Marker
          position={position}
          draggable={true}
          onMarkerDragEnd={(e) => {
            setPosition(e.nativeEvent);
            console.log('New position:', e.nativeEvent);
          }}
        />
      </MapView>
      <View style={{ position: 'absolute', top: 50, left: 20 }}>
        <Text>Lat: {position.latitude.toFixed(4)}</Text>
        <Text>Lng: {position.longitude.toFixed(4)}</Text>
      </View>
    </View>
  );
}
```

## Circles

```tsx
import { MapView, Circle } from 'expo-gaode-map';

export default function CircleExample() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 12,
      }}
    >
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        fillColor="#4A90E280"
        strokeColor="#4A90E2"
        strokeWidth={2}
      />
    </MapView>
  );
}
```

## Polylines

```tsx
import { MapView, Polyline } from 'expo-gaode-map';

export default function PolylineExample() {
  const route = [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.95, longitude: 116.45 },
    { latitude: 40.0, longitude: 116.5 },
    { latitude: 40.05, longitude: 116.45 },
  ];

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.975, longitude: 116.45 },
        zoom: 11,
      }}
    >
      <Polyline
        points={route}
        strokeWidth={5}
        strokeColor="#E74C3C"
      />
    </MapView>
  );
}
```

## Polygons

```tsx
import { MapView, Polygon } from 'expo-gaode-map';

export default function PolygonExample() {
  const area = [
    { latitude: 39.9, longitude: 116.3 },
    { latitude: 39.9, longitude: 116.5 },
    { latitude: 39.8, longitude: 116.5 },
    { latitude: 39.8, longitude: 116.3 },
  ];

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.85, longitude: 116.4 },
        zoom: 11,
      }}
    >
      <Polygon
        points={area}
        fillColor="#2ECC7180"
        strokeColor="#2ECC71"
        strokeWidth={2}
      />
    </MapView>
  );
}
```

## Multiple Overlays

Combine different overlay types:

```tsx
import { MapView, Marker, Circle, Polyline, Polygon } from 'expo-gaode-map';

export default function MultipleOverlays() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 11,
      }}
    >
      {/* Marker */}
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="Center Point"
      />

      {/* Circle */}
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={2000}
        fillColor="#4A90E240"
        strokeColor="#4A90E2"
        strokeWidth={1}
      />

      {/* Polyline */}
      <Polyline
        points={[
          { latitude: 39.85, longitude: 116.35 },
          { latitude: 39.95, longitude: 116.45 },
        ]}
        strokeWidth={4}
        strokeColor="#E74C3C"
      />

      {/* Polygon */}
      <Polygon
        points={[
          { latitude: 39.92, longitude: 116.38 },
          { latitude: 39.92, longitude: 116.42 },
          { latitude: 39.88, longitude: 116.42 },
        ]}
        fillColor="#2ECC7160"
        strokeColor="#2ECC71"
        strokeWidth={2}
      />
    </MapView>
  );
}
```

## Dynamic Overlays

Add and remove overlays dynamically:

```tsx
import { useState } from 'react';
import { View, Button } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';

export default function DynamicOverlays() {
  const [markers, setMarkers] = useState([]);

  const addRandomMarker = () => {
    const newMarker = {
      id: Date.now(),
      latitude: 39.9 + (Math.random() - 0.5) * 0.1,
      longitude: 116.4 + (Math.random() - 0.5) * 0.1,
    };
    setMarkers([...markers, newMarker]);
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 12,
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ latitude: marker.latitude, longitude: marker.longitude }}
          />
        ))}
      </MapView>

      <View style={{ position: 'absolute', top: 50, right: 10 }}>
        <Button title="Add Marker" onPress={addRandomMarker} />
        <Button title="Clear All" onPress={clearMarkers} />
      </View>
    </View>
  );
}
```

## Complete Example

A comprehensive overlay example:

```tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MapView, Marker, Circle, Polyline, Polygon } from 'expo-gaode-map';

export default function OverlaysExample() {
  const [selectedOverlay, setSelectedOverlay] = useState('all');

  const center = { latitude: 39.9, longitude: 116.4 };
  
  const route = [
    { latitude: 39.85, longitude: 116.35 },
    { latitude: 39.95, longitude: 116.45 },
    { latitude: 40.0, longitude: 116.4 },
  ];

  const area = [
    { latitude: 39.92, longitude: 116.38 },
    { latitude: 39.92, longitude: 116.42 },
    { latitude: 39.88, longitude: 116.40 },
  ];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: center,
          zoom: 11,
        }}
      >
        {(selectedOverlay === 'all' || selectedOverlay === 'marker') && (
          <Marker
            position={center}
            title="Beijing"
            snippet="Center Point"
          />
        )}

        {(selectedOverlay === 'all' || selectedOverlay === 'circle') && (
          <Circle
            center={center}
            radius={2000}
            fillColor="#4A90E240"
            strokeColor="#4A90E2"
            strokeWidth={2}
          />
        )}

        {(selectedOverlay === 'all' || selectedOverlay === 'polyline') && (
          <Polyline
            points={route}
            strokeWidth={4}
            strokeColor="#E74C3C"
          />
        )}

        {(selectedOverlay === 'all' || selectedOverlay === 'polygon') && (
          <Polygon
            points={area}
            fillColor="#2ECC7160"
            strokeColor="#2ECC71"
            strokeWidth={2}
          />
        )}
      </MapView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, selectedOverlay === 'all' && styles.buttonActive]}
          onPress={() => setSelectedOverlay('all')}
        >
          <Text style={styles.buttonText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, selectedOverlay === 'marker' && styles.buttonActive]}
          onPress={() => setSelectedOverlay('marker')}
        >
          <Text style={styles.buttonText}>Marker</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, selectedOverlay === 'circle' && styles.buttonActive]}
          onPress={() => setSelectedOverlay('circle')}
        >
          <Text style={styles.buttonText}>Circle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, selectedOverlay === 'polyline' && styles.buttonActive]}
          onPress={() => setSelectedOverlay('polyline')}
        >
          <Text style={styles.buttonText}>Polyline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, selectedOverlay === 'polygon' && styles.buttonActive]}
          onPress={() => setSelectedOverlay('polygon')}
        >
          <Text style={styles.buttonText}>Polygon</Text>
        </TouchableOpacity>
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
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

## Advanced Overlays

### Cluster

Display large amounts of data points and automatically group them.

```tsx
import { MapView, Cluster } from 'expo-gaode-map';

export default function ClusterExample() {
  const points = Array.from({ length: 100 }).map((_, i) => ({
    latitude: 39.9 + (Math.random() - 0.5) * 0.1,
    longitude: 116.4 + (Math.random() - 0.5) * 0.1,
    properties: { id: i }
  }));

  return (
    <MapView style={{ flex: 1 }}>
      <Cluster
        points={points}
        radius={30}
        minClusterSize={1}
        clusterBuckets={[
            { minPoints: 1, backgroundColor: '#00BFFF' },
            { minPoints: 5, backgroundColor: '#FFA500' },
            { minPoints: 10, backgroundColor: '#FF4500' }
        ]}
        onClusterPress={(e) => console.log(e.nativeEvent)}
      />
    </MapView>
  );
}
```

### MultiPoint

High-performance display of massive point markers.

```tsx
import { MapView, MultiPoint } from 'expo-gaode-map';
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./point.png')).uri;

export default function MultiPointExample() {
  const points = Array.from({ length: 1000 }).map((_, i) => ({
    latitude: 39.9 + (Math.random() - 0.5) * 0.2,
    longitude: 116.4 + (Math.random() - 0.5) * 0.2,
    title: `Point ${i}`
  }));

  return (
    <MapView style={{ flex: 1 }}>
      <MultiPoint
        points={points}
        icon={iconUri}
        iconWidth={20}
        iconHeight={20}
        onMultiPointPress={(e) => console.log('Clicked:', e.nativeEvent.index)}
      />
    </MapView>
  );
}
```

### HeatMap

Display data density distribution.

```tsx
import { MapView, HeatMap } from 'expo-gaode-map';

export default function HeatMapExample() {
  const points = Array.from({ length: 500 }).map(() => ({
    latitude: 39.9 + (Math.random() - 0.5) * 0.1,
    longitude: 116.4 + (Math.random() - 0.5) * 0.1,
    count: Math.random() * 10
  }));

  return (
    <MapView style={{ flex: 1 }}>
      <HeatMap
        data={points}
        radius={40}
        opacity={0.7}
        gradient={{
          colors: ['#0000FF', '#00FF00', '#FF0000'],
          startPoints: [0.1, 0.5, 0.9]
        }}
      />
    </MapView>
  );
}
```

## Next Steps

- [Overlays API](/en/api/overlays) - Complete overlays API reference
- [MapView API](/en/api/mapview) - Map configuration
- [Basic Map](/en/examples/basic-map) - Map basics