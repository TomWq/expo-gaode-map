# iOS 高德地图 SDK 初始化说明

## 概述

iOS 端的高德地图 SDK 支持两种初始化方式：

1. **自动初始化（推荐）**：通过 Info.plist 配置
2. **手动初始化**：通过 JavaScript 代码调用

## 方式一：自动初始化（通过 Info.plist）

### 步骤

1. 在 `app.json` 中配置插件：

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

2. 运行 `expo prebuild` 后，插件会自动将 API Key 添加到 Info.plist：

```xml
<key>AMapApiKey</key>
<string>your-ios-api-key</string>
```

3. 应用启动时，`ExpoGaodeMapModule` 会自动读取并设置 API Key

### 优势

- 无需在代码中硬编码 API Key
- 自动初始化，无需额外调用
- 符合 iOS 最佳实践

## 方式二：手动初始化（通过 JavaScript）

### 步骤

1. 在应用启动时调用 `initSDK`：

```javascript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 在应用启动时初始化
ExpoGaodeMapModule.initSDK({
  iosKey: 'your-ios-api-key',
  androidKey: 'your-android-api-key'
});
```

### 优势

- 可以动态设置 API Key
- 支持运行时切换 API Key
- 便于多环境管理

## 实现细节

### 自动初始化实现

在 `ExpoGaodeMapModule.swift` 的 `OnCreate` 回调中：

```swift
// 自动从 Info.plist 中读取高德地图 SDK 的 key
// 如果已经设置过 API Key，则不再重复设置
if AMapServices.shared().apiKey == nil || AMapServices.shared().apiKey?.isEmpty == true {
    if let apiKey = Bundle.main.infoDictionary?["AMapApiKey"] as? String {
        AMapServices.shared().apiKey = apiKey
        AMapServices.shared().enableHTTPS = true
        print("✅ ExpoGaodeMap: 从 Info.plist 成功读取并设置 API Key")
    } else {
        print("⚠️ ExpoGaodeMap: 未在 Info.plist 中找到 AMapApiKey，请通过 initSDK 方法设置")
    }
}
```

### 手动初始化实现

`initSDK` 方法会直接设置 API Key：

```swift
Function("initSDK") { (config: [String: String]) in
    guard let iosKey = config["iosKey"] else { 
        print("⚠️ ExpoGaodeMap: initSDK 调用时未提供 iosKey")
        return 
    }
    
    // 设置 API Key
    AMapServices.shared().apiKey = iosKey
    AMapServices.shared().enableHTTPS = true
    
    // 初始化定位管理器
    self.getLocationManager()
    
    print("✅ ExpoGaodeMap: 通过 initSDK 成功设置 API Key")
}
```

## 注意事项

1. **优先级**：如果同时使用两种方式，`initSDK` 的调用会覆盖 Info.plist 中的设置
2. **重复设置**：代码中已做防护，不会重复设置相同的 API Key
3. **调试**：查看 Xcode 控制台输出，可以看到 API Key 设置情况的日志
4. **隐私合规**：无论使用哪种方式，都会自动设置隐私合规信息

## 故障排查

如果地图无法正常显示：

1. 检查 API Key 是否正确
2. 查看 Xcode 控台是否有相关日志输出
3. 确认 Info.plist 中是否包含 `AMapApiKey` 字段（如果使用自动初始化）
4. 确认是否调用了 `initSDK` 方法（如果使用手动初始化）