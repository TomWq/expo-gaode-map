# Geometry API

Complete geometry calculation utilities API documentation.

> 💡 **Tip**: Geometry API is used to handle distance, area, and point relationship calculations on maps, supporting various practical scenarios.

## API List

| Method | Parameters | Return Value | Description |
|--------|------------|--------------|-------------|
| `distanceBetweenCoordinates` | `from: LatLng, to: LatLng` | `Promise<number>` | Calculate distance between two points (meters) |
| `calculatePolygonArea` | `coordinates: LatLng[]` | `Promise<number>` | Calculate polygon area (square meters) |
| `calculateRectangleArea` | `southWest: LatLng, northEast: LatLng` | `Promise<number>` | Calculate rectangle area (square meters) |
| `isPointInPolygon` | `point: LatLng, polygon: LatLng[]` | `Promise<boolean>` | Check if point is inside polygon |
| `isPointInCircle` | `point: LatLng, center: LatLng, radius: number` | `Promise<boolean>` | Check if point is inside circle |

## Distance Calculation

### distanceBetweenCoordinates

Calculate the straight-line distance between two coordinate points.

```tsx
import { ExpoGaodeMapModule } from '@gaomap/core';

const distance = await ExpoGaodeMapModule.distanceBetweenCoordinates(
  { latitude: 39.90923, longitude: 116.397428 }, // Tiananmen
  { latitude: 39.916527, longitude: 116.397545 }  // Forbidden City
);
console.log(`Distance: ${distance.toFixed(2)} meters`);
// Output: Distance: 823.45 meters
```

**Parameters**:
- `from`: Starting coordinate point `{ latitude: number, longitude: number }`
- `to`: Target coordinate point `{ latitude: number, longitude: number }`

**Return Value**: `Promise<number>` - Distance between two points (unit: meters)

## Area Calculation

### calculatePolygonArea

Calculate the area of any polygon, supporting triangles, quadrilaterals, and more complex polygons.

```tsx
// Calculate irregular quadrilateral area
const area = await ExpoGaodeMapModule.calculatePolygonArea([
  { latitude: 39.923, longitude: 116.391 },  // Northwest corner
  { latitude: 39.923, longitude: 116.424 },  // Northeast corner
  { latitude: 39.886, longitude: 116.424 },  // Southeast corner
  { latitude: 39.886, longitude: 116.391 },  // Southwest corner
]);
console.log(`Area: ${(area / 1000000).toFixed(2)} square kilometers`);
// Output: Area: 13.51 square kilometers

// Calculate triangle area
const triangleArea = await ExpoGaodeMapModule.calculatePolygonArea([
  { latitude: 39.923, longitude: 116.391 },
  { latitude: 39.923, longitude: 116.424 },
  { latitude: 39.886, longitude: 116.408 },
]);
```

**Parameters**:
- `coordinates`: Array of polygon vertex coordinates (at least 3 points)
  - Arranged in clockwise or counterclockwise order
  - Automatically closed, no need to repeat the first point

**Return Value**: `Promise<number>` - Polygon area (unit: square meters)

### calculateRectangleArea

Optimized method for calculating rectangle area, simpler and faster than `calculatePolygonArea`.

```tsx
const area = await ExpoGaodeMapModule.calculateRectangleArea(
  { latitude: 39.886, longitude: 116.391 },  // Southwest corner
  { latitude: 39.923, longitude: 116.424 }   // Northeast corner
);
console.log(`Rectangle area: ${(area / 1000000).toFixed(2)} square kilometers`);
// Output: Rectangle area: 13.51 square kilometers
```

**Parameters**:
- `southWest`: Southwest corner coordinates of the rectangle
- `northEast`: Northeast corner coordinates of the rectangle

**Return Value**: `Promise<number>` - Rectangle area (unit: square meters)

## Spatial Relationship Judgment

### isPointInPolygon

Determine if a point is inside a polygon region.

```tsx
// Define polygon area
const polygon = [
  { latitude: 39.923, longitude: 116.391 },
  { latitude: 39.923, longitude: 116.424 },
  { latitude: 39.886, longitude: 116.424 },
  { latitude: 39.886, longitude: 116.391 },
];

// Check if point is inside the area
const point1 = { latitude: 39.9, longitude: 116.4 };
const isInside1 = await ExpoGaodeMapModule.isPointInPolygon(point1, polygon);
console.log(`Is point (39.9, 116.4) inside: ${isInside1}`);
// Output: Is point (39.9, 116.4) inside: true

// Check point outside the area
const point2 = { latitude: 40.0, longitude: 117.0 };
const isInside2 = await ExpoGaodeMapModule.isPointInPolygon(point2, polygon);
console.log(`Is point (40.0, 117.0) inside: ${isInside2}`);
// Output: Is point (40.0, 117.0) inside: false
```

**Parameters**:
- `point`: Coordinate point to test
- `polygon`: Array of polygon vertex coordinates

**Return Value**: `Promise<boolean>` - `true` means point is inside polygon, `false` means outside

### isPointInCircle

Determine if a point is inside a circular area.

```tsx
// Define circular area (centered at Tiananmen, radius 1000 meters)
const center = { latitude: 39.90923, longitude: 116.397428 };
const radius = 1000; // 1 kilometer

// Check if Forbidden City is within 1 kilometer
const gugong = { latitude: 39.916527, longitude: 116.397545 };
const isNearby = await ExpoGaodeMapModule.isPointInCircle(gugong, center, radius);
console.log(`Is Forbidden City within 1km: ${isNearby}`);
// Output: Is Forbidden City within 1km: true
```

**Parameters**:
- `point`: Coordinate point to test
- `center`: Center coordinates
- `radius`: Radius (unit: meters)

**Return Value**: `Promise<boolean>` - `true` means point is inside circle, `false` means outside

## Use Cases

### 1. Distance Calculation
- Calculate user distance to target location
- Display distance information for nearby POIs
- Estimate route planning distances

### 2. Area Calculation
- Calculate land area (farmland, construction land, etc.)
- Regional planning area statistics
- Real estate area estimation

### 3. Geofencing
- Determine if user enters/exits an area
- Check if POI is within service range
- Area collision detection

### 4. Location Analysis
- Analyze user activity range
- Count facilities within an area
- Heat map data processing

## Notes

1. **Coordinate System**: All coordinates use AMap coordinate system (GCJ-02) by default
2. **Performance Considerations**: For complex polygons (>100 vertices), calculations may take longer
3. **Precision Issues**: Due to Earth's curvature, calculations over very large areas may have errors
4. **Edge Cases**: When a point is on the polygon boundary, different platforms may return different results

## Complete Example

```tsx
import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { ExpoGaodeMapModule } from '@gaomap/core';

export default function GeometryExample() {
  const [results, setResults] = useState<string[]>([]);

  const runCalculations = async () => {
    const newResults: string[] = [];

    // 1. Calculate distance between two points
    const distance = await ExpoGaodeMapModule.distanceBetweenCoordinates(
      { latitude: 39.90923, longitude: 116.397428 },
      { latitude: 39.916527, longitude: 116.397545 }
    );
    newResults.push(`Tiananmen to Forbidden City: ${distance.toFixed(2)}m`);

    // 2. Calculate polygon area
    const polygon = [
      { latitude: 39.923, longitude: 116.391 },
      { latitude: 39.923, longitude: 116.424 },
      { latitude: 39.886, longitude: 116.424 },
      { latitude: 39.886, longitude: 116.391 },
    ];
    const polygonArea = await ExpoGaodeMapModule.calculatePolygonArea(polygon);
    newResults.push(`Polygon area: ${(polygonArea / 1000000).toFixed(2)} km²`);

    // 3. Calculate rectangle area
    const rectArea = await ExpoGaodeMapModule.calculateRectangleArea(
      { latitude: 39.886, longitude: 116.391 },
      { latitude: 39.923, longitude: 116.424 }
    );
    newResults.push(`Rectangle area: ${(rectArea / 1000000).toFixed(2)} km²`);

    // 4. Check if point is in polygon
    const testPoint = { latitude: 39.9, longitude: 116.4 };
    const isInPolygon = await ExpoGaodeMapModule.isPointInPolygon(testPoint, polygon);
    newResults.push(`Point (39.9,116.4) in polygon: ${isInPolygon}`);

    // 5. Check if point is in circle
    const center = { latitude: 39.90923, longitude: 116.397428 };
    const isInCircle = await ExpoGaodeMapModule.isPointInCircle(
      testPoint,
      center,
      10000 // 10 kilometers
    );
    newResults.push(`Point in 10km circle: ${isInCircle}`);

    setResults(newResults);
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Run Geometry Calculations" onPress={runCalculations} />
      <ScrollView style={{ marginTop: 20 }}>
        {results.map((result, index) => (
          <Text key={index} style={{ marginTop: 10 }}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
```

## Related Documentation

- [Coordinate Type Definitions](/en/api/types#latlng)
- [Location API](/en/api/location)
- [Geometry Examples](/en/examples/geometry)
