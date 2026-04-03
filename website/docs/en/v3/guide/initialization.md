---
recommended: true
package: core/navigation
legacy: true
badges:
  - Initialization
---

# V3 Initialization

## Privacy-compliance sequence

1. Show privacy consent UI  
2. Call `setPrivacyConfig(...)`  
3. Call `initSDK(...)`  
4. Render `MapView` or start location APIs

## Core example

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map'

ExpoGaodeMapModule.setPrivacyConfig({
  hasShow: true,
  hasContainsPrivacy: true,
  hasAgree: true,
})

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key',
})
```

## Navigation example

```ts
import { ExpoGaodeMapNaviModule } from 'expo-gaode-map-navigation'

ExpoGaodeMapNaviModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key',
})
```

New code should compose runtime/provider APIs after initialization; legacy APIs remain available.
