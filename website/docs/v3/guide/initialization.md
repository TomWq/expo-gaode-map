---
recommended: true
package: core/navigation
legacy: true
badges:
  - Initialization
---

# V3 初始化

## 隐私合规顺序

1. 展示并获取用户隐私同意  
2. 调用 `setPrivacyConfig(...)`  
3. 再调用 `initSDK(...)`  
4. 最后渲染 `MapView` 或调用定位能力

## Core 示例

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

## Navigation 示例

```ts
import { ExpoGaodeMapNaviModule } from 'expo-gaode-map-navigation'

ExpoGaodeMapNaviModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key',
})
```

> 新代码建议在初始化后再按能力装配 runtime/provider；旧 API 仍可继续使用。
