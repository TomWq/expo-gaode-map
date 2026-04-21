# iOS Live Activity Widget Extension 模板

该目录提供 `ActivityConfiguration` 示例，用于展示 `expo-gaode-map-navigation` 在 iOS 锁屏和灵动岛的实时导航信息。

## 文件

- `ios/NavigationLiveActivityWidget.swift`：Widget Extension 入口与 UI。

## 接入步骤

1. 在 Xcode 中给你的 iOS App 新建 `Widget Extension`（iOS 16.1+）。
2. 把 `ios/NavigationLiveActivityWidget.swift` 拖入新 Extension target，并确保 target membership 只勾选 Extension。
3. Extension 代码需要 `import ExpoGaodeMapNavigation`，并使用库里提供的 `NavigationLiveActivityAttributes`。
4. 在 `app.json/app.config.ts` 开启插件配置：

```json
[
  "expo-gaode-map-navigation",
  {
    "enableIOSLiveActivity": true,
    "enableIOSLiveActivityFrequentUpdates": true
  }
]
```

5. 导航组件开启运行时开关：

```tsx
<ExpoGaodeMapNaviView iosLiveActivityEnabled />
```

## Podfile（含 Extension 时）

如果 Extension 无法 import `ExpoGaodeMapNavigation`，在 `ios/Podfile` 中为 Extension target 加上 `use_expo_modules!`：

```ruby
target 'YourNavigationWidgetExtension' do
  use_expo_modules!
end
```

然后执行：

```bash
cd ios && pod install
```
