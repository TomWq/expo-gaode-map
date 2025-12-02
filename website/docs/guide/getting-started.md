# 快速开始

本指南将帮助你快速开始使用 expo-gaode-map。

## 安装

### 稳定版本（推荐）

```bash
npm install expo-gaode-map
# 或
yarn add expo-gaode-map
# 或
pnpm add expo-gaode-map
```

### Expo 项目

如果你使用的是 Expo 管理的项目，安装后需要重新构建原生代码：

```bash
# 使用 EAS Build
eas build --platform android

# 或使用本地构建
npx expo prebuild
npx expo run:android
```

### 纯 React Native 项目

对于纯 React Native 项目，确保已安装 `expo` 包作为依赖：

```bash
npm install expo
# 然后重新构建应用
npx react-native run-android
```

## 获取 API Key

前往 [高德开放平台](https://lbs.amap.com/) 注册并创建应用，获取 API Key。

## 原生配置

::: warning 重要
高德地图 SDK 需要在原生项目中进行配置才能正常使用。
:::

### Android 配置

1. **在 `AndroidManifest.xml` 中配置 API Key**

```xml
<application>
    <meta-data
        android:name="com.amap.api.v2.apikey"
        android:value="your-android-api-key" />
</application>
```

2. **添加必需权限**

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

3. **配置隐私合规（必需）**

详见 [高德地图 Android SDK 配置指南](https://lbs.amap.com/api/android-sdk/guide/create-project/android-studio-create-project)

### iOS 配置

1. **在 `Info.plist` 中配置 API Key**

```xml
<key>AMapApiKey</key>
<string>your-ios-api-key</string>
```

2. **添加定位权限描述**

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>我们需要访问您的位置来显示地图</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>我们需要访问您的位置来提供定位服务</string>
```

3. **配置隐私合规（必需）**

详见 [高德地图 iOS SDK 配置指南](https://lbs.amap.com/api/ios-sdk/guide/create-project/cocoapods)

## 基础使用

### 初始化 SDK

```tsx
import { useEffect } from 'react';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

export default function App() {
  useEffect(() => {
    // 初始化 SDK
    ExpoGaodeMapModule.initSDK({
      androidKey: 'your-android-api-key',
      iosKey: 'your-ios-api-key',
    });
  }, []);

  return <YourMapComponent />;
}
```

### 显示地图

```tsx
import { MapView } from 'expo-gaode-map';

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      myLocationEnabled={true}
      onLoad={() => console.log('地图加载完成')}
    />
  );
}
```

### 添加覆盖物

```tsx
import { MapView, Marker, Circle } from 'expo-gaode-map';

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      {/* 标记点 */}
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="北京"
      />
      
      {/* 圆形 */}
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        fillColor="#8800FF00"
        strokeColor="#FFFF0000"
      />
    </MapView>
  );
}
```

## 完整示例

这里是一个包含权限管理的完整示例：

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Alert, Linking, Platform } from 'react-native';
import {
  MapView,
  ExpoGaodeMapModule,
  type LatLng,
} from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState<{
    target: LatLng;
    zoom: number;
  } | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. 初始化 SDK
        ExpoGaodeMapModule.initSDK({
          androidKey: 'your-android-api-key',
          iosKey: 'your-ios-api-key',
        });
        
        // 2. 检查权限
        const status = await ExpoGaodeMapModule.checkLocationPermission();
        
        // 3. 请求权限（如果需要）
        if (!status.granted) {
          const result = await ExpoGaodeMapModule.requestLocationPermission();
          
          if (!result.granted) {
            // 使用默认位置
            setInitialPosition({
              target: { latitude: 39.9, longitude: 116.4 },
              zoom: 10
            });
            
            // 引导用户到设置
            Alert.alert(
              '需要定位权限',
              '请在设置中开启定位权限',
              [
                { text: '取消' },
                { text: '去设置', onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }}
              ]
            );
            return;
          }
        }
        
        // 4. 获取位置
        const location = await ExpoGaodeMapModule.getCurrentLocation();
        setInitialPosition({
          target: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          zoom: 15
        });
        
      } catch (err) {
        console.error('初始化失败:', err);
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10
        });
      }
    };

    initialize();
  }, []);

  if (!initialPosition) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>正在加载地图...</Text>
      </View>
    );
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition}
      myLocationEnabled={true}
    />
  );
}
```

## 下一步

- [初始化指南](/guide/initialization) - 详细的初始化和权限管理
- [API 文档](/api/) - 完整的 API 参考
- [示例代码](/examples/) - 更多使用示例

## 常见问题

### 地图不显示？

1. 检查 API Key 是否正确配置
2. 检查网络权限是否添加
3. 查看控制台错误日志

### 定位不工作？

1. 检查定位权限是否授予
2. 确保在真机上测试（模拟器可能无法定位）
3. 检查是否调用了 `initSDK`

### 如何获取更多帮助？

- 查看 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 加入 QQ 群: 952241387
- 参与 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)