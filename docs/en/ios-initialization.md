# iOS AMap SDK Initialization Guide

## Overview

The AMap SDK for iOS supports two initialization methods:

1. **Automatic Initialization (Recommended)**: Via Info.plist configuration
2. **Manual Initialization**: Via JavaScript code

## Method 1: Automatic Initialization (via Info.plist)

### Steps

1. Configure the plugin in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosApiKey": "your-ios-api-key"
        }
      ]
    ]
  }
}
```

2. After running `expo prebuild`, the plugin will automatically add the API Key to Info.plist:

```xml
<key>AMapApiKey</key>
<string>your-ios-api-key</string>
```

3. On app startup, `ExpoGaodeMapModule` will automatically read and set the API Key

### Advantages

- No hardcoded API Key in source code
- Automatic initialization, no additional calls needed
- Follows iOS best practices

## Method 2: Manual Initialization (via JavaScript)

### Steps

1. Call `initSDK` when your app starts:

```javascript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// Initialize on app startup
ExpoGaodeMapModule.initSDK({
  iosKey: 'your-ios-api-key',
  androidKey: 'your-android-api-key'
});
```

### Advantages

- Dynamic API Key setting
- Runtime API Key switching
- Easy multi-environment management

## Implementation Details

### Automatic Initialization Implementation

In the `OnCreate` callback of `ExpoGaodeMapModule.swift`:

```swift
// Automatically read AMap SDK key from Info.plist
// Only set if API Key is not already configured
if AMapServices.shared().apiKey == nil || AMapServices.shared().apiKey?.isEmpty == true {
    if let apiKey = Bundle.main.infoDictionary?["AMapApiKey"] as? String {
        AMapServices.shared().apiKey = apiKey
        AMapServices.shared().enableHTTPS = true
        print("✅ ExpoGaodeMap: Successfully read and set API Key from Info.plist")
    } else {
        print("⚠️ ExpoGaodeMap: AMapApiKey not found in Info.plist, please set via initSDK method")
    }
}
```

### Manual Initialization Implementation

The `initSDK` method directly sets the API Key:

```swift
Function("initSDK") { (config: [String: String]) in
    guard let iosKey = config["iosKey"] else { 
        print("⚠️ ExpoGaodeMap: iosKey not provided in initSDK call")
        return 
    }
    
    // Set API Key
    AMapServices.shared().apiKey = iosKey
    AMapServices.shared().enableHTTPS = true
    
    // Initialize location manager
    self.getLocationManager()
    
    print("✅ ExpoGaodeMap: Successfully set API Key via initSDK")
}
```

## Important Notes

1. **Priority**: If both methods are used, `initSDK` calls will override Info.plist settings
2. **Duplicate Settings**: Code prevents setting the same API Key multiple times
3. **Debugging**: Check Xcode console output for API Key setting logs
4. **Privacy Compliance**: Privacy compliance info is set automatically regardless of initialization method

## Troubleshooting

If the map doesn't display properly:

1. Verify your API Key is correct
2. Check Xcode console for relevant log outputs
3. Confirm Info.plist contains the `AMapApiKey` field (if using automatic initialization)
4. Confirm `initSDK` was called (if using manual initialization)