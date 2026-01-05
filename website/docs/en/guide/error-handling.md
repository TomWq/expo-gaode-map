# Error Handling

expo-gaode-map provides a structured error system to help you quickly locate
issues and apply the correct fix.

## What You Get

- Friendly error messages with clear action items
- A consistent `GaodeMapError` type
- `ErrorType` enums for reliable branching
- Helper factory methods via `ErrorHandler`

## Core Types

The core package exports:

- `GaodeMapError`
- `ErrorType`
- `ErrorHandler`
- `ErrorLogger`

Example import:

```ts
import {
  GaodeMapError,
  ErrorType,
  ErrorHandler,
  ErrorLogger,
} from 'expo-gaode-map';
```

## Basic Pattern

Use `try/catch` and handle `GaodeMapError` explicitly:

```ts
import { ExpoGaodeMapModule, GaodeMapError, ErrorType } from 'expo-gaode-map';

async function loadCurrentLocation() {
  try {
    const location = await ExpoGaodeMapModule.getCurrentLocation();
    return location;
  } catch (error) {
    if (error instanceof GaodeMapError) {
      switch (error.type) {
        case ErrorType.SDK_NOT_INITIALIZED:
          break;
        case ErrorType.PERMISSION_DENIED:
          break;
        case ErrorType.INVALID_API_KEY:
          break;
      }
    }
    throw error;
  }
}
```

## Common Error Types

### SDK_NOT_INITIALIZED

You called a map/location API before SDK initialization.

Typical fix:

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map';

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});
```

If you use the Config Plugin, native API Keys can be configured automatically.
In that case `initSDK({})` can be omitted or called with only `webKey`.

See: [Initialization](/en/guide/initialization)

### INVALID_API_KEY

API Key is missing or does not match your Android package name / iOS bundle ID.

Checklist:

- Verify Bundle ID (iOS) / applicationId (Android) matches the key configuration
- Use Config Plugin to configure keys and rebuild
- Clean and rebuild if you changed keys

See: [Config Plugin](/en/guide/config-plugin)

### PERMISSION_DENIED

Location permission is not granted.

Typical flow:

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const status = await ExpoGaodeMapModule.checkLocationPermission();
if (!status.granted) {
  const result = await ExpoGaodeMapModule.requestLocationPermission();
  if (!result.granted) {
    ExpoGaodeMapModule.openAppSettings();
  }
}
```

See: [Android Permissions](/en/guide/android-permissions)

### LOCATION_FAILED

Location failed due to device settings, weak GPS/network, or key mismatch.

Checklist:

- Confirm API key is correct and matches app identifiers
- Confirm GPS and network are enabled
- Test on a real device

## Wrap Native Errors

If you want to normalize unknown errors, use `ErrorHandler.wrapNativeError`:

```ts
import { ErrorHandler, ErrorLogger } from 'expo-gaode-map';

try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (e) {
  const normalized = ErrorHandler.wrapNativeError(e, 'Get current location');
  ErrorLogger.log(normalized);
  throw normalized;
}
```

## Related Documentation

- [Getting Started](/en/guide/getting-started)
- [Initialization](/en/guide/initialization)
- [Location API](/en/api/location)

