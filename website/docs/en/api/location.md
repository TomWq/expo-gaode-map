# Location API

Location, permissions, privacy compliance, and heading updates are exposed through `ExpoGaodeMapModule`.

## Recommended call order

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 1. On first install, sync privacy state after the user agrees
if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13',
  });
}

// 2. Only needed for Web API features
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

// 3. Check first and request only when no foreground permission exists
let permission = await ExpoGaodeMapModule.checkLocationPermission();
if (!permission.granted) {
  permission = await ExpoGaodeMapModule.requestLocationPermission();
}

// 4. Both precise and approximate permission can start location updates
if (permission.granted) {
  ExpoGaodeMapModule.start();
}
```

> ⚠️ In the current version, calling map / location APIs before privacy consent is ready throws a clear `PRIVACY_NOT_AGREED` style error in JS instead of letting the native SDK crash.

## SDK and privacy

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `initSDK` | `SDKConfig` | `void` | Initialize SDK when needed (when native keys are not configured, or when you need to provide `webKey`) |
| `isSDKInitialized` | - | `boolean` | Whether JS-side initialization has been called |
| `setPrivacyVersion` | `(version: string)` | `void` | Set a privacy policy version and invalidate older consent when it changes |
| `setPrivacyConfig` | `PrivacyConfig` | `void` | Set privacy state in one call |
| `resetPrivacyConsent` | - | `void` | Clear persisted privacy consent |
| `getPrivacyStatus` | - | `PrivacyStatus` | Get current privacy state |
| `setLoadWorldVectorMap` | `(enabled: boolean)` | `void` | Enable world vector map before initialization |
| `getVersion` | - | `string` | Get native SDK version |
| `isNativeSDKConfigured` | - | `boolean` | Whether native API keys are already configured |

> New integrations should use `setPrivacyConfig(...)` to sync privacy state. `setPrivacyShow` / `setPrivacyAgree` are no longer exposed as public JS APIs.

### `PrivacyConfig`

```ts
interface PrivacyConfig {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
  privacyVersion?: string;
}
```

### `PrivacyStatus`

```ts
interface PrivacyStatus {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
  isReady: boolean;
  privacyVersion?: string | null;
  agreedPrivacyVersion?: string | null;
  restoredFromStorage?: boolean;
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

> ⚠️ Permission checks and requests also depend on privacy state. Complete privacy consent on first install; later cold starts restore it automatically.

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
  accuracyAuthorization?: 'full' | 'reduced' | 'none';
  fineLocation?: boolean;
  coarseLocation?: boolean;
  backgroundLocation?: boolean;
  shouldShowRationale?: boolean;
  isPermanentlyDenied?: boolean;
  isAndroid14Plus?: boolean;
  message?: string;
}
```

`granted` means that usable foreground location access exists. It remains `true` when Android grants only `ACCESS_COARSE_LOCATION`, or when an iOS user turns off Precise Location.

Use `accuracyAuthorization` to distinguish the current precision:

| Value | Meaning | Recommended handling |
|-------|---------|----------------------|
| `full` | Precise location | Precision-dependent features may proceed |
| `reduced` | Approximate location | Keep maps, location, and reverse geocoding available; gate only features that truly require precision |
| `none` | No usable location permission | Request foreground permission or provide a no-location fallback |

> `accuracyAuthorization` is optional for compatibility with older native builds. Rebuild the Android/iOS app after upgrading the package so the new native implementation returns this field.

## Choosing between approximate and precise location

The default policy should be to **accept approximate location**. Do not treat `reduced` as a denial, and do not block the entire map screen when the user disables precise location. Approximate permission can still show the user-location indicator, return coordinates, and perform reverse geocoding, although the coordinate error is larger and the resulting address may only be suitable for area-level display.

Require precise location only at the entry point of a feature that genuinely depends on meter-level accuracy:

| Product scenario | Is approximate location usable? | Recommended policy |
|------------------|---------------------------------|--------------------|
| Map browsing, current-area display, city/district content | Yes | Continue normally |
| Reverse geocoding, weather, regional recommendations, broad nearby search | Yes | Continue and widen the search radius based on `location.accuracy` when needed |
| Route preview and address selection | Usually | Let the user correct the start point or select a point on the map |
| Live navigation, road matching, exact pickup or delivery points | Not recommended | Require precise location before starting that feature |
| Small-radius check-in, meter-level geofencing, arrival verification | Not recommended | Require precise location before submission or evaluation |
| Safety or emergency workflows where error creates material risk | Not recommended | Explain the reason, require precise location, and offer an exit or fallback |

When a feature requires precise location:

1. Gate only that feature, not app startup or the entire map screen.
2. Explain why precision is required and what approximate location would affect.
3. If the user declines, keep map browsing, approximate location, and unrelated features available.
4. If the status is already `reduced`, do not loop on `requestLocationPermission()` expecting an automatic upgrade. After the user confirms, call `openAppSettings()` and check permission again when the app returns.

```tsx
import { Alert } from 'react-native';
import { ExpoGaodeMapModule, type PermissionStatus } from 'expo-gaode-map';

function hasFullAccuracy(permission: PermissionStatus) {
  return permission.accuracyAuthorization === 'full' ||
    (permission.accuracyAuthorization == null && permission.fineLocation === true);
}

async function getLocationForFeature(requiresPreciseLocation: boolean) {
  let permission = await ExpoGaodeMapModule.checkLocationPermission();

  // Request only when permission is absent. Approximate is already authorized.
  if (!permission.granted) {
    permission = await ExpoGaodeMapModule.requestLocationPermission();
  }

  if (!permission.granted) {
    return null;
  }

  if (requiresPreciseLocation && !hasFullAccuracy(permission)) {
    Alert.alert(
      'Precise Location Required',
      'This feature needs meter-level accuracy. Enable Precise Location for this app in system settings.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => ExpoGaodeMapModule.openAppSettings() },
      ]
    );
    return null;
  }

  ExpoGaodeMapModule.setLocatingWithReGeocode(true);
  return ExpoGaodeMapModule.getCurrentLocation();
}

// Map location and reverse geocoding: approximate is accepted
const mapLocation = await getLocationForFeature(false);

// Meter-level check-in or live navigation: precise is required
const preciseLocation = await getLocationForFeature(true);
```

`expo-gaode-map-navigation` exposes the same `ExpoGaodeMapModule` and `PermissionStatus`; replace only the package name in the import.

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

      // Only needed for Web API features
      // ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

      let permission = await ExpoGaodeMapModule.checkLocationPermission();
      if (!permission.granted) {
        permission = await ExpoGaodeMapModule.requestLocationPermission();
      }
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
