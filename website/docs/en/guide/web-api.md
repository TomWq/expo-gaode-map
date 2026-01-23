# Web API

`expo-gaode-map-web-api` is a pure JavaScript package that wraps AMap Web Service APIs (geocode, route planning, POI search, input tips, etc.).

## Installation

```bash
bun add expo-gaode-map-web-api
# or
yarn add expo-gaode-map-web-api
# or
npm install expo-gaode-map-web-api
```

## Configuration

You need an AMap Web Service Key.

Set it during SDK initialization so the Web API package can read it:

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map';

ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key',
});
```

## Create an API Instance

```ts
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

const api = new GaodeWebAPI();
```

Or pass the key explicitly with advanced options:

```ts
const api = new GaodeWebAPI({ 
  key: 'your-web-api-key',
  maxRetries: 3,     // Retry 3 times on failure
  enableCache: true, // Enable memory cache
});
```

## Advanced Features

### 1. Request Cancellation

Use `AbortController` to cancel pending requests, useful for search suggestions.

```typescript
const controller = new AbortController();

api.inputTips.getTips('KFC', {
  city: 'Beijing',
  signal: controller.signal
});

// Cancel request
controller.abort();
```

### 2. Auto Retry

The SDK automatically retries requests on network errors or rate limiting (QPS) errors.
Default is 3 retries with exponential backoff.

### 3. Caching

Enable LRU caching to improve performance for frequent requests.

```typescript
const api = new GaodeWebAPI({ enableCache: true });

// First call: Network request
await api.geocode.regeocode('116.48,39.99');

// Second call: Returns from cache
await api.geocode.regeocode('116.48,39.99');
```

## Common Use Cases

Geocode:

```ts
const result = await api.geocode.geocode('No.6 Futong East Street, Chaoyang, Beijing');
console.log(result.geocodes[0].location);
```

Reverse geocode:

```ts
const result = await api.geocode.regeocode('116.481028,39.989643');
console.log(result.regeocode.formatted_address);
```

Driving route:

```ts
import { DrivingStrategy } from 'expo-gaode-map-web-api';

const result = await api.route.driving(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    strategy: DrivingStrategy.AVOID_JAM,
    show_fields: 'cost,navi,polyline',
  }
);
```

POI search:

```ts
const result = await api.poi.search('KFC', {
  city: 'Beijing',
  offset: 20,
  page: 1,
});
```

Input tips:

```ts
const tips = await api.inputTips.getTips('Tiananmen', { city: 'Beijing' });
```

## Related Documentation

- [Web API Reference](/en/api/web-api)
- [Navigation Guide](/en/guide/navigation)
