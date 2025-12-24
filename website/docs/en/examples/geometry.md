# Geometry Calculation Examples

This example demonstrates how to use the geometry calculation functions provided by `expo-gaode-map`, including distance calculation, area calculation, and point relationship judgment.

## Basic Usage

```typescript
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import {ExpoGaodeMapModule} from 'expo-gaode-map';

export default function GeometryUtilsExample() {
  const [results, setResults] = useState<string[]>([]);

  const runCalculations = async () => {
    const newResults: string[] = [];

    try {
      // 1. Calculate distance between two points
      const distance = await ExpoGaodeMapModule.distanceBetweenCoordinates(
        { latitude: 39.90923, longitude: 116.397428 }, // Tiananmen
        { latitude: 39.916527, longitude: 116.397545 }  // Forbidden City
      );
      newResults.push(`Tiananmen to Forbidden City: ${distance.toFixed(2)} meters`);

      // 2. Calculate polygon area
      const polygon = [
        { latitude: 39.923, longitude: 116.391 },
        { latitude: 39.923, longitude: 116.424 },
        { latitude: 39.886, longitude: 116.424 },
        { latitude: 39.886, longitude: 116.391 },
      ];
      const polygonArea = await ExpoGaodeMapModule.calculatePolygonArea(polygon);
      newResults.push(`Polygon area: ${(polygonArea / 1000000).toFixed(2)} square kilometers`);

      // 3. Calculate rectangle area
      const rectArea = await ExpoGaodeMapModule.calculateRectangleArea(
        { latitude: 39.886, longitude: 116.391 },
        { latitude: 39.923, longitude: 116.424 }
      );
      newResults.push(`Rectangle area: ${(rectArea / 1000000).toFixed(2)} square kilometers`);

      // 4. Check if point is in polygon
      const testPoint = { latitude: 39.9, longitude: 116.4 };
      const isInPolygon = await ExpoGaodeMapModule.isPointInPolygon(testPoint, polygon);
      newResults.push(`Point (39.9, 116.4) in polygon: ${isInPolygon ? 'Yes' : 'No'}`);

      // 5. Check if point is in circle
      const center = { latitude: 39.90923, longitude: 116.397428 };
      const isInCircle = await ExpoGaodeMapModule.isPointInCircle(
        testPoint,
        center,
        10000 // 10 kilometers
      );
      newResults.push(`Point in 10km circle: ${isInCircle ? 'Yes' : 'No'}`);

      setResults(newResults);
    } catch (error) {
      console.error('Calculation failed:', error);
      newResults.push(`Error: ${error.message}`);
      setResults(newResults);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Run Geometry Calculations" onPress={runCalculations} />
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            • {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultText: {
    fontSize: 14,
    marginVertical: 5,
    lineHeight: 20,
  },
});
```

## Practical Use Cases

### 1. Nearby Shops Distance Display

```typescript
async function calculateNearbyShops(userLocation: LatLng, shops: Shop[]) {
  const shopsWithDistance = await Promise.all(
    shops.map(async (shop) => {
      const distance = await ExpoGaodeMapModule.distanceBetweenCoordinates(
        userLocation,
        shop.location
      );
      return {
        ...shop,
        distance,
        distanceText: distance < 1000 
          ? `${Math.round(distance)}m` 
          : `${(distance / 1000).toFixed(1)}km`
      };
    })
  );

  // Sort by distance
  return shopsWithDistance.sort((a, b) => a.distance - b.distance);
}
```

### 2. Geofencing (Enter/Exit Area Detection)

```typescript
function useGeofencing(location: LatLng, area: LatLng[]) {
  const [isInside, setIsInside] = useState(false);

  useEffect(() => {
    const checkLocation = async () => {
      const inside = await ExpoGaodeMapModule.isPointInPolygon(
        location,
        area
      );
      
      if (inside !== isInside) {
        setIsInside(inside);
        // Trigger enter or exit event
        if (inside) {
          console.log('User entered the area');
        } else {
          console.log('User left the area');
        }
      }
    };

    checkLocation();
  }, [location]);

  return isInside;
}
```

### 3. Land Area Measurement Tool

```typescript
function LandAreaCalculator() {
  const [points, setPoints] = useState<LatLng[]>([]);
  const [area, setArea] = useState<number>(0);

  const addPoint = (point: LatLng) => {
    setPoints([...points, point]);
  };

  const calculateArea = async () => {
    if (points.length < 3) {
      alert('At least 3 points are required to calculate area');
      return;
    }

    const calculatedArea = await ExpoGaodeMapModule.calculatePolygonArea(points);
    setArea(calculatedArea);
  };

  const clearPoints = () => {
    setPoints([]);
    setArea(0);
  };

  return (
    <View>
      <Text>Marked {points.length} points</Text>
      {area > 0 && (
        <Text>
          Area: {(area / 1000000).toFixed(2)} km²
          ({(area / 10000).toFixed(2)} hectares)
        </Text>
      )}
      <Button title="Calculate Area" onPress={calculateArea} />
      <Button title="Clear" onPress={clearPoints} />
    </View>
  );
}
```

### 4. Delivery Range Check

```typescript
async function isInDeliveryRange(
  userLocation: LatLng,
  shopLocation: LatLng,
  maxDistance: number
): Promise<boolean> {
  const isInRange = await ExpoGaodeMapModule.isPointInCircle(
    userLocation,
    shopLocation,
    maxDistance
  );
  
  if (!isInRange) {
    const distance = await ExpoGaodeMapModule.distanceBetweenCoordinates(
      userLocation,
      shopLocation
    );
    console.log(`Out of delivery range ${(distance / 1000).toFixed(1)}km, max delivery distance ${(maxDistance / 1000).toFixed(1)}km`);
  }
  
  return isInRange;
}
```

## Performance Optimization Tips

1. **Batch Calculations**: For multiple point distance calculations, consider using Promise.all for parallel processing
2. **Result Caching**: Cache judgment results for fixed areas to avoid redundant calculations
3. **Precision Control**: Choose appropriate precision based on actual needs to avoid over-calculation

```typescript
// Batch distance calculation example
async function batchCalculateDistances(
  origin: LatLng,
  destinations: LatLng[]
) {
  return Promise.all(
    destinations.map(dest => 
      ExpoGaodeMapModule.distanceBetweenCoordinates(origin, dest)
    )
  );
}

// Result caching example
const areaCache = new Map<string, boolean>();

async function isInAreaCached(
  point: LatLng,
  polygon: LatLng[]
): Promise<boolean> {
  const key = `${point.latitude},${point.longitude}`;
  
  if (areaCache.has(key)) {
    return areaCache.get(key)!;
  }
  
  const result = await ExpoGaodeMapModule.isPointInPolygon(point, polygon);
  areaCache.set(key, result);
  return result;
}
```

## Related Documentation

- [Geometry API Documentation](/en/api/geometry)
- [Location API](/en/api/location)
- [Coordinate Type Definitions](/en/api/types)
