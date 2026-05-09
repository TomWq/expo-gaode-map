# Components & Hooks

Beyond the core `MapView` component, the library also provides helper components and Hooks to make map-driven UI easier to build.

## `useMap`

`useMap` is a custom Hook that gives child components inside `MapView` access to the map instance (`MapViewRef`).

### Why use it?

In small screens you can usually keep a single `ref` at the page level. In deeper component trees, passing that ref through multiple layers becomes awkward. `useMap` uses React Context so any component inside `MapView` can access the map controller directly.

### Usage

1. Make sure the component is rendered inside `MapView`.
2. Call `useMap()` to get the map instance.

```tsx
import { MapUI, MapView, useMap } from 'expo-gaode-map';
import { Button, View } from 'react-native';

function ZoomControls() {
  const map = useMap();

  const handleZoomIn = async () => {
    const status = await map.getCameraPosition();
    if (status.zoom) {
      map.setZoom(status.zoom + 1, true);
    }
  };

  return (
    <View>
      <Button title="Zoom In" onPress={handleZoomIn} />
    </View>
  );
}

export default function App() {
  return (
    <MapView style={{ flex: 1 }}>
      <MapUI>
        <ZoomControls />
      </MapUI>
    </MapView>
  );
}
```

### API

```ts
function useMap(): MapViewRef
```

- **Returns**: a `MapViewRef` with methods such as `setZoom`, `moveCamera`, and `getCameraPosition`
- **Note**: it must be called inside the `MapView` subtree, otherwise it throws

---

## `MapUI`

`MapUI` is a helper container for ordinary React UI elements that should float above the map instead of becoming native overlays.

### Why use it?

Direct `MapView` children are often treated as map overlays such as markers or polylines. If you place a normal `View` there, it may not render as expected. `MapUI` makes it explicit that the wrapped content is UI, not map data.

### Usage

```tsx
import { MapUI, MapView, Marker } from 'expo-gaode-map';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <MapView style={{ flex: 1 }}>
      <Marker position={{ latitude: 39.9, longitude: 116.4 }} />

      <MapUI>
        <View style={{ position: 'absolute', bottom: 50, right: 20 }}>
          <Text style={{ backgroundColor: 'white', padding: 10 }}>
            Floating UI layer
          </Text>
        </View>
      </MapUI>
    </MapView>
  );
}
```

### Features

- **Layering**: content inside `MapUI` is rendered above the map
- **Interaction**: touch events still work normally
- **Layout**: usually combined with `position: 'absolute'`

### Best practice

Put floating UI such as search bars, locate buttons, and legend panels inside `MapUI` to keep the tree clear and avoid mixing native map layers with app UI.
