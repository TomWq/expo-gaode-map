# Web API

`expo-gaode-map-web-api` is a Gaode Map Web API service module (pure JavaScript implementation) that provides geocoding, route planning, POI search, input tips, and other service capabilities.

## Features

- ✅ **Pure JavaScript**: Cross-platform consistency, no native compilation dependencies
- ✅ **TypeScript**: Complete type definitions and error code mapping
- ✅ **V5 API**: Adapted to new route planning strategies and fields
- ✅ **Collaborative**: Works with map/navigation modules, supports parameter-free construction
- ✅ **Error Friendly**: Encapsulates `GaodeAPIError` with Chinese error code descriptions

## Implemented Features

### Geocoding Service
- ✅ Geocoding (address → coordinates)
- ✅ Reverse geocoding (coordinates → address)
- ✅ Batch geocoding / batch reverse geocoding

### Route Planning Service (V5)
- ✅ Driving (supports strategies, costs, navigation steps, coordinate strings, etc.)
- ✅ Walking (supports multiple routes, navigation steps, coordinate strings)
- ✅ Cycling / Electric bike (includes costs and navigation steps)
- ✅ Transit (includes multiple strategies, cross-city, subway map mode, entrances/exits, etc.)

### Search Service
- ✅ POI search (keyword, nearby, type, details)
- ✅ Input tips (POI/bus stops/bus lines)

## Installation

This module requires installing a base map component first (either navigation module or core map module):

```bash
# Choose one
npm install expo-gaode-map-navigation
# or
npm install expo-gaode-map

# Then install this module
npm install expo-gaode-map-web-api
```

## Quick Start

### 1. Apply for Web Service Key

Log in to [Gaode Open Platform Console](https://console.amap.com/), create an application and add a "Web Service" Key.

::: warning Note
This is a Web Service Key, not an iOS/Android Key
:::

### 2. Provide webKey during base module initialization

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key', // Key: for Web API package to read
});
```

### 3. Parameter-free construction and usage

```typescript
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// No parameters: resolve webKey from base module runtime
const api = new GaodeWebAPI();

// Reverse geocoding: coordinates → address
const result = await api.geocode.regeocode('116.481028,39.989643');
console.log(result.regeocode.formatted_address);

// Geocoding: address → coordinates
const geo = await api.geocode.geocode('北京市朝阳区阜通东大街6号');
console.log(geo.geocodes[0].location);
```

## Geocoding

### Reverse Geocoding (coordinates → address)

```typescript
// Basic usage
const result = await api.geocode.regeocode('116.481028,39.989643');
console.log(result.regeocode.formatted_address);
// 北京市朝阳区阜通东大街6号

// Using object
const result = await api.geocode.regeocode({
  longitude: 116.481028,
  latitude: 39.989643,
});

// Get detailed information
const result = await api.geocode.regeocode('116.481028,39.989643', {
  extensions: 'all', // Return detailed information
  radius: 1000, // Search radius 1000 meters
  poitype: '商务住宅|餐饮服务', // POI type
});
```

### Geocoding (address → coordinates)

```typescript
// Basic usage
const result = await api.geocode.geocode('北京市朝阳区阜通东大街6号');
console.log(result.geocodes[0].location);
// 116.481028,39.989643

// Specify city
const result = await api.geocode.geocode('阜通东大街6号', '北京');

// Batch geocoding
const result = await api.geocode.batchGeocode(
  [
    '北京市朝阳区阜通东大街6号',
    '北京市朝阳区望京SOHO',
  ],
  '北京'
);
```

## Route Planning

### Driving Route Planning

```typescript
import { DrivingStrategy } from 'expo-gaode-map-web-api';

// Basic usage
const result = await api.route.driving(
  '116.481028,39.989643',
  '116.434446,39.90816'
);

console.log(`Distance: ${result.route.paths[0].distance}m`);
console.log(`Duration: ${result.route.paths[0].duration}s`);
console.log(`Toll: ${result.route.paths[0].tolls}元`);

// Advanced usage: with waypoints and strategy
const result = await api.route.driving(
  { longitude: 116.481028, latitude: 39.989643 },
  { longitude: 116.434446, latitude: 39.90816 },
  {
    waypoints: ['116.45,39.95', '116.46,39.94'], // Waypoints
    strategy: DrivingStrategy.AVOID_JAM, // Avoid congestion
    show_fields: 'cost,navi,polyline', // Return detailed information
    plate: '京AHA322', // License plate
    cartype: 0, // Vehicle type: 0-fuel, 1-electric, 2-hybrid
  }
);
```

### Walking Route Planning

```typescript
// Basic usage
const result = await api.route.walking(
  '116.481028,39.989643',
  '116.434446,39.90816'
);

// Multiple routes + detailed information
const result = await api.route.walking(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    alternative_route: 3, // Return 3 routes
    show_fields: 'cost,navi,polyline',
  }
);
```

### Cycling Route Planning

```typescript
// Basic usage
const result = await api.route.bicycling(
  '116.481028,39.989643',
  '116.434446,39.90816'
);

// Electric bike route planning
const result = await api.route.electricBike(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    alternative_route: 3,
    show_fields: 'cost,navi,polyline'
  }
);
```

### Transit Route Planning

```typescript
import { TransitStrategy } from 'expo-gaode-map-web-api';

// Same-city transit (V5 API: city1 and city2 required, use citycode)
const result = await api.route.transit(
  '116.481028,39.989643',
  '116.434446,39.90816',
  '010', // Origin city citycode (Beijing)
  '010', // Destination city citycode (Beijing)
  {
    strategy: TransitStrategy.RECOMMENDED, // Recommended mode
    show_fields: 'cost,polyline',
    AlternativeRoute: 3, // Return 3 routes
  }
);

// Cross-city transit
const result = await api.route.transit(
  '116.481028,39.989643',
  '121.472644,31.231706',
  '010', // Beijing
  '021', // Shanghai
  {
    strategy: TransitStrategy.TIME_FIRST, // Shortest time
    nightflag: 1, // Consider night buses
  }
);
```

## POI Search

```typescript
// Keyword search
const result = await api.poi.search('肯德基', {
  city: '北京',
  offset: 20,
  page: 1,
});

// Nearby search
const result = await api.poi.searchAround('116.481028,39.989643', {
  keywords: '餐饮',
  radius: 1000,
});

// Get details
const detail = await api.poi.getDetail('B000A83M2Z');
```

## Input Tips

```typescript
// Basic tips
const tips = await api.inputTips.getTips('天安门', {
  city: '北京',
});

// POI type tips
const tips = await api.inputTips.getPOITips('餐饮', {
  city: '北京',
  type: '餐饮服务',
});

// Bus stop tips
const tips = await api.inputTips.getBusTips('望京', {
  city: '北京',
});

// Bus line tips
const tips = await api.inputTips.getBuslineTips('地铁15号线', {
  city: '北京',
});
```

## Driving Strategies (V5 API)

| Strategy | Description |
|----------|-------------|
| `DrivingStrategy.DEFAULT` (32) | Default, Gaode recommended |
| `DrivingStrategy.AVOID_JAM` (33) | Avoid congestion |
| `DrivingStrategy.HIGHWAY_FIRST` (34) | Highway priority |
| `DrivingStrategy.NO_HIGHWAY` (35) | No highways |
| `DrivingStrategy.LESS_TOLL` (36) | Less toll |
| `DrivingStrategy.MAIN_ROAD_FIRST` (37) | Main road priority |
| `DrivingStrategy.FASTEST` (38) | Fastest |

## Transit Strategies (V5 API)

| Strategy | Description |
|----------|-------------|
| `TransitStrategy.RECOMMENDED` (0) | Recommended mode (default) |
| `TransitStrategy.CHEAPEST` (1) | Most economical |
| `TransitStrategy.LEAST_TRANSFER` (2) | Least transfers |
| `TransitStrategy.LEAST_WALK` (3) | Least walking |
| `TransitStrategy.TIME_FIRST` (8) | Shortest time |

## Error Handling

```typescript
try {
  const result = await api.geocode.regeocode('116.481028,39.989643');
  console.log(result.regeocode.formatted_address);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // Possible errors:
    // - "API Error: INVALID_USER_KEY (code: 10001)" - Invalid key
    // - "API Error: DAILY_QUERY_OVER_LIMIT (code: 10003)" - Daily limit exceeded
  }
}
```

## Notes

1. **Key Type**: Must use Web Service Key (not iOS/Android Key)
2. **Initialization**: Recommended to provide via `initSDK({ webKey })` in base module
3. **Quota Limits**: Refer to Gaode console for quota and QPS limits
4. **Coordinate Format**: Longitude first, latitude second (longitude,latitude)
5. **Network Requests**: Requires network connection, cannot work offline

## Related Documentation

- [Navigation API](/en/api/navigation) - Navigation module guide
- [Search API](/en/api/search) - Native search module
- [Gaode Web API Documentation](https://lbs.amap.com/api/webservice/summary)