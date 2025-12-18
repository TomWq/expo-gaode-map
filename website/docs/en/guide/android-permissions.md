# Android Permissions Troubleshooting Guide

This guide focuses on location permission-related issues specific to the Android platform.

## Common Issues

### Issue: Permission Appears Not Granted Immediately After Request

**Symptoms:**
```
⚠️  expo-gaode-map: Foreground location permission not granted
{
  "coarseLocation": false, 
  "fineLocation": false, 
  "granted": false, 
  "isPermanentlyDenied": false, 
  "shouldShowRationale": false
}
```

User clearly taps "Allow" button, but the console still shows permission not granted.

**Root Cause:**

On Android, there's a brief asynchronous delay in permission state updates after the user taps "Allow" on the permission dialog. If you check the permission status immediately after requesting it, you might get the old state (not granted).

**Solution:**

This issue has been fixed in v1.x.x of this library. The fix implements a **polling mechanism**:

1. Call the system permission request API
2. Wait 500ms before starting to poll the permission status
3. Check every 100ms, up to 5 seconds (50 attempts)
4. Return the final result once permission is granted or timeout is reached

Core implementation (Kotlin):
```kotlin
AsyncFunction("requestLocationPermission") { promise: expo.modules.kotlin.Promise ->
  val activity = appContext.currentActivity
  if (activity == null) {
    promise.reject("NO_ACTIVITY", "Activity not available", null)
    return@AsyncFunction
  }
  
  // Request permission
  PermissionHelper.requestForegroundLocationPermission(activity, 1001)
  
  // Use WeakReference to avoid memory leaks
  val contextRef = java.lang.ref.WeakReference(appContext.reactContext)
  val handler = android.os.Handler(android.os.Looper.getMainLooper())
  var attempts = 0
  val maxAttempts = 50 // 5 second timeout
  
  val checkPermission = object : Runnable {
    override fun run() {
      val context = contextRef.get()
      if (context == null) {
        promise.reject("CONTEXT_LOST", "Context was garbage collected", null)
        return
      }
      
      val status = PermissionHelper.checkForegroundLocationPermission(context)
      
      // Return result if granted or max attempts reached
      if (status.granted || attempts >= maxAttempts) {
        handler.removeCallbacks(this)
        promise.resolve(mapOf(
          "granted" to status.granted,
          "fineLocation" to status.fineLocation,
          "coarseLocation" to status.coarseLocation,
          "shouldShowRationale" to status.shouldShowRationale,
          "isPermanentlyDenied" to status.isPermanentlyDenied
        ))
      } else {
        attempts++
        handler.postDelayed(this, 100)
      }
    }
  }
  
  // Wait 500ms before starting to poll, giving time for dialog to appear
  handler.postDelayed(checkPermission, 500)
}
```

## Best Practices

### 1. Correct Permission Request Flow

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

async function requestLocationPermission() {
  try {
    // 1. Check current permission status
    const status = await ExpoGaodeMapModule.checkLocationPermission();
    
    if (status.granted) {
      console.log('Permission already granted');
      return true;
    }
    
    // 2. Request permission if not granted
    const result = await ExpoGaodeMapModule.requestLocationPermission();
    
    if (result.granted) {
      console.log('User granted permission');
      return true;
    } else {
      console.log('User denied permission');
      return false;
    }
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}
```

### 2. Handle Permanently Denied Permissions

```typescript
async function handlePermissionDenied() {
  const status = await ExpoGaodeMapModule.checkLocationPermission();
  
  if (status.isPermanentlyDenied) {
    Alert.alert(
      'Location Permission Required',
      'Please manually enable location permission in Settings to use map features',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => ExpoGaodeMapModule.openAppSettings()
        }
      ]
    );
  }
}
```

### 3. Check Permissions on App Startup

```typescript
useEffect(() => {
  const init = async () => {
    try {
      // Update privacy compliance status
      ExpoGaodeMapModule.updatePrivacyCompliance(true);
      
      // Check location permission
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      
      if (!status.granted) {
        // Request permission
        const result = await ExpoGaodeMapModule.requestLocationPermission();
        
        if (!result.granted) {
          // Permission not granted, use default location
          setInitialPosition({ 
            target: { latitude: 39.9, longitude: 116.4 }, 
            zoom: 16 
          });
          return;
        }
      }
      
      // Configure location options
      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setInterval(5000);
      
      // Get current location
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(location);
      setInitialPosition({
        target: { latitude: location.latitude, longitude: location.longitude },
        zoom: 16
      });
      
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  };

  init();
}, []);
```

## Android 14+ Special Notes

Android 14 introduced more granular location permission controls:

- **Precise Location** (FINE_LOCATION): Get precise GPS location
- **Approximate Location** (COARSE_LOCATION): Get approximate network location
- **One-time**: Allow only for this session

This library automatically handles these permissions without additional configuration.

## Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `NO_ACTIVITY` | Activity unavailable | Ensure called within React Native lifecycle |
| `PRIVACY_NOT_AGREED` | User hasn't agreed to privacy policy | Call `updatePrivacyCompliance(true)` first |
| `CONTEXT_LOST` | Context garbage collected | Usually a memory issue, check app memory usage |

## Debugging Tips

### 1. Enable Verbose Logging

Filter by `ExpoGaodeMap` tag in Android Logcat for detailed logs:

```bash
adb logcat | grep ExpoGaodeMap
```

### 2. Manually Reset Permissions

To reset permissions during testing:

```bash
adb shell pm reset-permissions
```

Or uninstall the app and reinstall from Settings.

### 3. Check Permission Status

Use this code to print detailed permission information:

```typescript
const status = await ExpoGaodeMapModule.checkLocationPermission();
console.log('Permission details:', {
  granted: status.granted,
  fineLocation: status.fineLocation,
  coarseLocation: status.coarseLocation,
  isPermanentlyDenied: status.isPermanentlyDenied,
  shouldShowRationale: status.shouldShowRationale
});
```

## Version History

- **v1.x.x**: Fixed issue where permission appears not granted immediately after request
  - Implemented polling mechanism
  - Delayed initial check to 500ms
  - Increased maximum polling time to 5 seconds

## Related Links

- [Android Permissions Best Practices](https://developer.android.com/training/permissions/requesting)
- [Android 14 Location Permission Changes](https://developer.android.com/about/versions/14/behavior-changes-14#location-permissions)
- [AMap Android SDK Permission Guide](https://lbs.amap.com/api/android-sdk/guide/create-project/android-studio-create-project)