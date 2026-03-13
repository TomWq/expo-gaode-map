# Location API

Location, permissions, privacy compliance, and heading updates are exposed through `ExpoGaodeMapModule`.

## Recommended call order

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 1. Sync privacy status after the user agrees
ExpoGaodeMapModule.setPrivacyShow(true, true);
ExpoGaodeMapModule.setPrivacyAgree(true);

// Or set all privacy state at once
ExpoGaodeMapModule.setPrivacyConfig({
  hasShow: true,
  hasContainsPrivacy: true,
  hasAgree: true,
});

// 2. Initialize SDK
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key',
});

// 3. Request permission
await ExpoGaodeMapModule.requestLocationPermission();

// 4. Start location updates
ExpoGaodeMapModule.start();
```

> ⚠️ In the current version, calling map / location APIs before privacy consent is ready throws a clear `PRIVACY_NOT_AGREED` style error in JS instead of letting the native SDK crash.

## SDK and privacy

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `initSDK` | `SDKConfig` | `void` | Initialize SDK; native keys can be omitted when using Config Plugin |
| `isSDKInitialized` | - | `boolean` | Whether JS-side initialization has been called |
| `setPrivacyShow` | `(hasShow: boolean, hasContainsPrivacy: boolean)` | `void` | Sync privacy notice display status |
| `setPrivacyAgree` | `(hasAgree: boolean)` | `void` | Sync user privacy consent |
| `setPrivacyConfig` | `PrivacyConfig` | `void` | Set privacy state in one call |
| `getPrivacyStatus` | - | `PrivacyStatus` | Get current privacy state |
| `setLoadWorldVectorMap` | `(enabled: boolean)` | `void` | Enable world vector map before initialization |
| `getVersion` | - | `string` | Get native SDK version |
| `isNativeSDKConfigured` | - | `boolean` | Whether native API keys are already configured |

### `PrivacyConfig`

```ts
interface PrivacyConfig {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
}
```

### `PrivacyStatus`

```ts
interface PrivacyStatus {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
  isReady: boolean;
}
```

## Location control

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `start` | - | `void` | Start continuous location |
| `stop` | - | `void` | Stop location |
| `isStarted` | - | `Promise<boolean>` | Whether location is active |
| `getCurrentLocation` | - | `Promise<Coordinates \| ReGeocode>` | Get a single location result |
| `coordinateConvert` | `(coordinate, type)` | `Promise<LatLng>` | Convert between coordinate systems |
| `addLocationListener` | `(listener)` | `{ remove(): void }` | Listen for location updates |

> `addLocationListener` now accepts a single callback only. Do not pass an event name anymore.

## Permission management

> ⚠️ Permission checks and requests also depend on privacy state. Call `setPrivacyShow` / `setPrivacyAgree` first.

### `useLocationPermissions` (recommended)

```tsx
import { useEffect } from 'react';
import { Button } from 'react-native';
import { ExpoGaodeMapModule, useLocationPermissions } from 'expo-gaode-map';

export default function PermissionExample() {
  const [status, requestPermission] = useLocationPermissions();

  useEffect(() => {
    ExpoGaodeMapModule.setPrivacyConfig({
      hasShow: true,
      hasContainsPrivacy: true,
      hasAgree: true,
    });
  }, []);

  return (
    <Button
      title={status?.granted ? 'Authorized' : 'Request Permission'}
      onPress={requestPermission}
    />
  );
}
```

### Permission methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `checkLocationPermission` | - | `Promise<PermissionStatus>` | Check foreground location permission |
| `requestLocationPermission` | - | `Promise<PermissionStatus>` | Request foreground location permission |
| `requestBackgroundLocationPermission` | - | `Promise<PermissionStatus>` | Request background location permission |
| `openAppSettings` | - | `void` | Open the system settings page |

### `PermissionStatus`

```ts
interface PermissionStatus {
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined';
  fineLocation?: boolean;
  coarseLocation?: boolean;
  backgroundLocation?: boolean;
  shouldShowRationale?: boolean;
  isPermanentlyDenied?: boolean;
  isAndroid14Plus?: boolean;
  message?: string;
}
```

## Location configuration

### Common

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLocatingWithReGeocode` | `(enabled: boolean)` | Whether to include reverse geocoding |
| `setInterval` | `(interval: number)` | Location interval in milliseconds |
| `setGeoLanguage` | `('DEFAULT' \| 'EN' \| 'ZH')` | Reverse geocode language |

### Android only

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLocationMode` | `(mode: LocationMode)` | Location mode |
| `setOnceLocation` | `(enabled: boolean)` | Single-shot location |
| `setSensorEnable` | `(enabled: boolean)` | Enable device sensors |
| `setWifiScan` | `(enabled: boolean)` | Allow Wi‑Fi scan |
| `setGpsFirst` | `(enabled: boolean)` | Prefer GPS first |
| `setOnceLocationLatest` | `(enabled: boolean)` | Wait for refreshed Wi‑Fi list before returning |
| `setLocationCacheEnable` | `(enabled: boolean)` | Enable location cache |
| `setHttpTimeOut` | `(timeout: number)` | Network timeout in milliseconds |
| `setLocationProtocol` | `('HTTP' \| 'HTTPS')` | Network protocol |

### iOS only

| Method | Parameters | Description |
|--------|------------|-------------|
| `setDesiredAccuracy` | `(accuracy: LocationAccuracy)` | Desired location accuracy |
| `setLocationTimeout` | `(seconds: number)` | Location timeout |
| `setReGeocodeTimeout` | `(seconds: number)` | Reverse geocode timeout |
| `setDistanceFilter` | `(meters: number)` | Minimum distance filter |
| `setPausesLocationUpdatesAutomatically` | `(enabled: boolean)` | Allow the system to pause updates automatically |
| `setAllowsBackgroundLocationUpdates` | `(enabled: boolean)` | Enable background location updates |
| `startUpdatingHeading` | - | Start heading updates |
| `stopUpdatingHeading` | - | Stop heading updates |

## Event listeners

### Listen to location updates

```tsx
const subscription = ExpoGaodeMapModule.addLocationListener((location) => {
  console.log('Location updated:', location);
});

subscription.remove();
```

### Listen to heading updates (iOS)

Heading updates use the native event subscription API, not `addLocationListener`:

```tsx
const subscription = ExpoGaodeMapModule.addListener('onHeadingUpdate', (heading) => {
  console.log('Heading updated:', heading);
});

ExpoGaodeMapModule.startUpdatingHeading();

subscription.remove();
ExpoGaodeMapModule.stopUpdatingHeading();
```

## Coordinate conversion

```tsx
import { CoordinateType, ExpoGaodeMapModule } from 'expo-gaode-map';

const converted = await ExpoGaodeMapModule.coordinateConvert(
  { latitude: 39.9, longitude: 116.4 },
  CoordinateType.GPS
);
```

## Main types

### `Coordinates`

```ts
interface Coordinates {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  heading: number;
  speed: number;
  timestamp: number;
  isAvailableCoordinate?: boolean;
  address?: string;
}
```

### `ReGeocode`

```ts
interface ReGeocode extends Coordinates {
  address: string;
  country: string;
  province: string;
  city: string;
  district: string;
  cityCode: string;
  adCode: string;
  street: string;
  streetNumber: string;
  poiName: string;
  aoiName: string;
  description?: string;
  coordType?: 'GCJ02' | 'WGS84';
  buildingId?: string;
}
```

### `LocationMode`

```ts
enum LocationMode {
  HighAccuracy = 1,
  BatterySaving = 2,
  DeviceSensors = 3,
}
```

### `LocationAccuracy`

```ts
enum LocationAccuracy {
  BestForNavigation = 0,
  Best = 1,
  NearestTenMeters = 2,
  HundredMeters = 3,
  Kilometer = 4,
  ThreeKilometers = 5,
}
```

## Complete example

```tsx
import { useEffect, useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';
import {
  ExpoGaodeMapModule,
  LocationMode,
  type ReGeocode,
} from 'expo-gaode-map';

export default function LocationExample() {
  const [location, setLocation] = useState<ReGeocode | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      ExpoGaodeMapModule.setPrivacyConfig({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
      });

      ExpoGaodeMapModule.initSDK({});

      const permission = await ExpoGaodeMapModule.requestLocationPermission();
      if (!permission.granted) return;

      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setLocationMode(LocationMode.HighAccuracy);
      ExpoGaodeMapModule.setInterval(2000);

      const sub = ExpoGaodeMapModule.addLocationListener((result) => {
        setLocation(result as ReGeocode);
      });

      ExpoGaodeMapModule.start();
      startedRef.current = true;

      return () => {
        sub.remove();
        if (startedRef.current) {
          ExpoGaodeMapModule.stop();
        }
      };
    };

    const cleanup = run();
    return () => {
      cleanup.then((fn) => fn?.()).catch(() => {});
    };
  }, []);

  return (
    <View>
      <Button
        title="Get Current Location"
        onPress={async () => {
          const current = await ExpoGaodeMapModule.getCurrentLocation();
          console.log(current);
        }}
      />
      <Text>{location ? location.address : 'Waiting for location...'}</Text>
    </View>
  );
}
```
