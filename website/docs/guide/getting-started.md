# 快速开始

本指南将帮助你快速开始使用 expo-gaode-map。

## 项目架构

expo-gaode-map 采用 **Monorepo 架构**，提供模块化的功能包：

- **`expo-gaode-map`** - 核心包（地图显示、定位、覆盖物）
- **`expo-gaode-map-search`** - 搜索功能包（可选）

按需安装，避免不必要的包体积增加。

## 安装

### 核心包（必需）

```bash
npm install expo-gaode-map
# 或
yarn add expo-gaode-map
# 或
pnpm add expo-gaode-map
```

### 搜索功能（可选）

如果需要使用 POI 搜索、周边搜索等功能：

```bash
npm install expo-gaode-map-search
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

## 配置

### 方式 1：使用 Config Plugin（推荐）

在 `app.json` 中配置：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosApiKey": "your-ios-api-key",
          "androidApiKey": "your-android-api-key",
          "enableLocation": true,
          "locationDescription": "我们需要访问您的位置信息以提供地图服务"
        }
      ]
    ]
  }
}
```

然后重新构建原生代码：

```bash
npx expo prebuild --clean
npx expo run:ios
# 或
npx expo run:android
```

::: tip 推荐使用
Config Plugin 会自动配置原生项目，包括 API Key、权限、隐私合规等，**强烈推荐使用**。
:::

### 方式 2：手动配置原生项目

如果不使用 Config Plugin，需要手动配置：

#### Android 配置

在 `AndroidManifest.xml` 中添加：

```xml
<application>
    <meta-data
        android:name="com.amap.api.v2.apikey"
        android:value="your-android-api-key" />
</application>
```

#### iOS 配置

在 `Info.plist` 中添加：

```xml
<key>AMapApiKey</key>
<string>your-ios-api-key</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>我们需要访问您的位置信息以提供地图服务</string>
```

详细配置请参考 [配置插件文档](/guide/config-plugin)。

## 获取 API Key

前往 [高德开放平台](https://lbs.amap.com/) 注册并创建应用，获取：
- Android 平台 API Key
- iOS 平台 API Key

## 基础使用

### 显示地图

::: tip 自动初始化
如果使用了 Config Plugin，API Key 会自动配置，无需手动调用 `initSDK`。
:::

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

### 使用搜索功能

安装搜索包后：

```tsx
import { searchPOI, searchNearby } from 'expo-gaode-map-search';

// POI 搜索
const results = await searchPOI({
  keyword: '酒店',
  city: '北京',
  pageSize: 20,
});

console.log('找到', results.total, '个结果');
results.pois.forEach(poi => {
  console.log(poi.name, poi.address);
});

// 周边搜索
const nearby = await searchNearby({
  keyword: '餐厅',
  center: { latitude: 39.9, longitude: 116.4 },
  radius: 1000,
});
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
        // 1. 检查权限
        const status = await ExpoGaodeMapModule.checkLocationPermission();
        
        // 2. 请求权限（如果需要）
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
        
        // 3. 获取位置
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

- [配置插件](/guide/config-plugin) - Config Plugin 详细配置
- [架构说明](/guide/architecture) - Monorepo 架构和模块说明
- [API 文档](/api/) - 完整的 API 参考
- [示例代码](/examples/) - 更多使用示例

## 常见问题

### 地图不显示？

1. 检查 API Key 是否正确配置（使用 Config Plugin 或手动配置）
2. 运行 `npx expo prebuild --clean` 重新生成原生代码
3. 查看控制台错误日志

### 定位不工作？

1. 检查定位权限是否授予
2. 确保在真机上测试（模拟器可能无法定位）
3. 检查 Config Plugin 中的 `enableLocation` 是否为 true

### 搜索功能报错 "API Key 未设置"？

1. 确保使用了 Config Plugin 配置 `iosApiKey`
2. 或者在代码中调用 `ExpoGaodeMapModule.initSDK()`
3. 重新构建原生代码：`npx expo prebuild --clean`

### 如何按需安装功能模块？

只安装需要的包即可：

```bash
# 只需要地图和定位
npm install expo-gaode-map

# 需要搜索功能
npm install expo-gaode-map expo-gaode-map-search
```

### 如何获取更多帮助？

- 查看 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 加入 QQ 群: 952241387
- 参与 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)