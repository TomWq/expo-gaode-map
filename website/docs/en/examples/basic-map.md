# Basic Map

Examples for building a basic map screen.

> ⚠️ The examples below assume privacy compliance is already completed:
> - `ExpoGaodeMapModule.setPrivacyShow(true, true)`
> - `ExpoGaodeMapModule.setPrivacyAgree(true)`

## Simple map

```tsx
import { MapView } from 'expo-gaode-map';

export default function SimpleMap() {
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

## Map with location

```tsx
import { useEffect } from 'react';
import { ExpoGaodeMapModule, MapView } from 'expo-gaode-map';

export default function MapWithLocation() {
  useEffect(() => {
    ExpoGaodeMapModule.setPrivacyShow(true, true);
    ExpoGaodeMapModule.setPrivacyAgree(true);
    ExpoGaodeMapModule.initSDK({
      webKey: 'your-web-api-key',
    });
  }, []);

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      myLocationEnabled
    />
  );
}
```

## Full featured map

```tsx
import { useRef } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import {
  Circle,
  MapView,
  Marker,
  Polyline,
  type MapViewRef,
} from 'expo-gaode-map';

export default function FullFeaturedMap() {
  const mapRef = useRef<MapViewRef | null>(null);

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
        myLocationEnabled
        trafficEnabled
        onMapPress={(e) => console.log('Map press', e.nativeEvent)}
      >
        <Circle
          center={{ latitude: 39.9, longitude: 116.4 }}
          radius={1000}
          fillColor="#8800FF00"
        />

        <Marker
          position={{ latitude: 39.95, longitude: 116.45 }}
          title="Marker"
        />

        <Polyline
          points={[
            { latitude: 39.9, longitude: 116.4 },
            { latitude: 39.95, longitude: 116.45 },
          ]}
          strokeWidth={5}
          strokeColor="#FFFF0000"
        />
      </MapView>

      <View style={styles.controls}>
        <Button title="Move Camera" onPress={handleMoveCamera} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
```

## Related

- [MapView API](/en/api/mapview)
- [Location Tracking](/en/examples/location-tracking)
- [Overlays](/en/examples/overlays)
