# LBS Scenario Recommendations

This guide shows how to combine `expo-gaode-map` (map rendering) and `expo-gaode-map-web-api` (data services) to implement common production scenarios.

## Component Responsibilities

Before choosing a feature path, split responsibilities clearly:

- `expo-gaode-map` (Core): UI rendering layer for map view, camera, overlays, gestures, and location display.
- `expo-gaode-map-web-api` (Web API): data/service layer for geocoding, route planning, POI search, and input tips.

---

## Recommended Scenarios

### 1. Location + Geocoding

| Feature | Core + Web API Flow | Typical Use Case |
| :--- | :--- | :--- |
| Precise location display | Core gets coordinates -> Core updates camera and blue dot | Ride-hailing and delivery app home screen |
| Reverse geocoding | Core gets coordinates -> Web API resolves readable address -> UI shows address | Check-in, pickup confirmation |
| Geocoding | User enters address -> Web API resolves coordinates -> Core jumps and marks | Destination input and address picker |
| Drag-to-pick | Core keeps center marker fixed -> user drags map -> Web API resolves center address | Pickup fine-tuning |

### 2. Search + POI Discovery

| Feature | Core + Web API Flow | Typical Use Case |
| :--- | :--- | :--- |
| Keyword search | User enters keyword -> Web API returns POIs -> Core renders markers | Restaurant/hotel search |
| Nearby search | Core gets current center -> Web API searches nearby category -> Core renders list and markers | Nearby facility lookup |
| Input tips | User types -> Web API returns suggestion list -> click to jump on map | Search UX optimization |
| Polygon area search | Core draws Polygon -> Web API searches POIs inside polygon | Business district analysis |

### 3. Routing + Navigation

| Feature | Core + Web API Flow | Typical Use Case |
| :--- | :--- | :--- |
| Driving route planning | Web API computes route -> Core renders `Polyline` | Trip preview |
| Multi-strategy comparison | Web API returns multiple routes -> Core renders color-coded polylines | User route choice |
| Traffic visualization | Web API returns traffic segments -> Core renders red/yellow/green sections | Congestion awareness |
| Transit planning | Web API computes transit plan -> Core renders segmented path | Public transport planning |
| Walking/cycling planning | Web API computes short-distance path -> Core renders key turns | Last-mile guidance |

### 4. Advanced Visualization

| Feature | Core + Web API Flow | Typical Use Case |
| :--- | :--- | :--- |
| Massive point clustering | Web API returns large data set -> Core `Cluster` renders aggregated markers | Bike sharing, real estate |
| Heatmap | Web API returns density data -> Core renders HeatMap layer | Visitor flow and business analysis |
| Geofence and service area | Web API returns boundary data -> Core renders `Polygon` | Delivery area, restricted zones |
| Track playback | Backend stores coordinate sequence -> Core animates marker and route trace | Fitness and fleet tracking |

### 5. Industry Scenarios

| Feature | Core + Web API Flow | Typical Use Case |
| :--- | :--- | :--- |
| Real estate and school district map | Web API searches schools -> Core renders points and district polygons | Property app |
| Logistics route optimization | Web API performs multi-stop route calculation -> Core renders optimized sequence | Courier and delivery |
| Grid-based governance | Web API returns administrative boundaries -> Core renders status-colored polygons | Smart city |
| Location attendance | Core gets location + Web API reverse geocode + in-polygon check | Field workforce management |

### 6. UX Enhancements

| Feature | Core + Web API Flow | Typical Use Case |
| :--- | :--- | :--- |
| Smooth marker movement | Web API returns updated coordinates -> Core animates marker/camera | Real-time vehicle tracking |
| Auto-fit viewport | Web API returns result set -> Core computes bounds -> map fits all points | Search results display |
| Custom callouts | Tap marker -> Core callout displays live data from Web API | Restaurant queue info |

### 7. Utility Tools

| Feature | Core + Web API Flow | Typical Use Case |
| :--- | :--- | :--- |
| Distance measurement | Core records clicked points -> geometry/Web API computes length -> UI displays result | Outdoor planning |
| Area measurement | Core records polygon points -> geometry computes area -> UI displays result | Land and renovation estimation |

---

## Best-Practice Example: Ride-Hailing Flow

```tsx
// 1. Get current location
const location = await ExpoGaodeMapModule.getCurrentLocation();

// 2. Reverse geocode current location
const regeo = await api.geocode.regeocode({
  latitude: location.latitude,
  longitude: location.longitude
});
console.log('Current location:', regeo.regeocode.formatted_address);

// 3. Search destination
const pois = await api.poi.search('Beijing West Railway Station', { city: 'Beijing' });
const destination = pois.pois[0];

// 4. Plan driving route
const route = await api.route.driving(
  `${location.longitude},${location.latitude}`,
  `${destination.location}`
);
```
