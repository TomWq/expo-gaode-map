# expo-gaode-map

一个功能完整的高德地图 React Native 组件库，**基于 Expo Modules 开发**，提供地图显示、定位、覆盖物等功能：
- Android: [高德地图 Android SDK](https://lbs.amap.com/api/android-sdk/summary)
- iOS: [高德地图 iOS SDK](https://lbs.amap.com/api/ios-sdk/summary) (开发中)

> 💡 本组件使用 [Expo Modules API](https://docs.expo.dev/modules/overview/) 构建，提供了类型安全的原生模块接口和优秀的开发体验。

## ✨ 特性

- ✅ 完整的地图功能（多种地图类型、手势控制、相机操作）
- ✅ 精准定位（连续定位、单次定位、坐标转换）
- ✅ 丰富的覆盖物（Circle、Marker、Polyline、Polygon）
- ✅ 完整的 TypeScript 类型定义（零 any 类型）
- ✅ 模块化架构设计
- ✅ 同时支持声明式组件和命令式 API
- ✅ 跨平台支持（Android、iOS）
- ✅ 支持自定义样式和事件监听

## 📦 安装

```bash
npm install expo-gaode-map
# 或
yarn add expo-gaode-map
# 或
pnpm add expo-gaode-map
```

### Expo 项目

如果你使用的是 Expo 管理的项目（使用 `expo prebuild` 或开发构建），安装后需要重新构建原生代码：

```bash
# 使用 EAS Build
eas build --platform android

# 或使用本地构建
npx expo prebuild
npx expo run:android
```

### 纯 React Native 项目

对于纯 React Native 项目（通过 `react-native init` 创建），确保已安装 `expo` 包作为依赖：

```bash
npm install expo
# 然后重新构建应用
npx react-native run-android
```

## 🚀 快速开始

### 1. 获取高德地图 API Key

前往 [高德开放平台](https://lbs.amap.com/) 注册并创建应用，获取 API Key。

> ⚠️ **原生配置说明**
> 
> 高德地图 SDK 需要在原生项目中进行配置（如在 AndroidManifest.xml 中配置 Key、添加权限等）。具体的原生配置步骤请参考：
> - **Android**: [高德地图 Android SDK 配置指南](https://lbs.amap.com/api/android-sdk/guide/create-project/android-studio-create-project)
> - **iOS**: [高德地图 iOS SDK 配置指南](https://lbs.amap.com/api/ios-sdk/guide/create-project/cocoapods)
> 
> 对于 Expo 项目，建议使用 `npx expo prebuild` 生成原生代码后，按照高德官网文档进行配置。

### 2. 初始化 SDK

```tsx
import { useEffect } from 'react';
import { initSDK } from 'expo-gaode-map';

export default function App() {
  useEffect(() => {
    initSDK({
      androidKey: 'your-android-api-key',
      iosKey: 'your-ios-api-key', // iOS 暂不支持
    });
  }, []);

  return (
    // 你的应用内容
  );
}
```

### 3. 使用地图组件

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

## 📚 功能概览

### 🗺️ 地图显示
- 多种地图类型（标准、卫星、夜间等）
- 相机控制（移动、缩放、旋转、倾斜）
- 手势控制和 UI 控件配置
- 缩放级别限制

### 📍 定位功能
- 连续定位和单次定位
- 逆地理编码（地址解析）
- 定位配置（精度、间隔、模式等）
- 自定义定位蓝点样式

### 🎨 覆盖物
- Circle（圆形）
- Marker（标记点）
- Polyline（折线）
- Polygon（多边形）
- 支持声明式和命令式两种使用方式

### 📝 更多示例

详细的使用示例请查看：[EXAMPLES.md](docs/EXAMPLES.md)

包含：
- 基础地图应用
- 定位追踪应用
- 覆盖物操作示例
- 高级用法和最佳实践

## 📝 文档

- [API 文档](docs/API.md) - 完整的 API 参考
- [使用示例](docs/EXAMPLES.md) - 详细的代码示例

## ⚠️ 注意事项

### 基础地图应用

```tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { 
  MapView, 
  initSDK,
  Circle,
  Marker,
  Polyline,
  Polygon,
  type MapViewRef 
} from 'expo-gaode-map';

export default function App() {
  const mapRef = useRef<MapViewRef>(null);

  useEffect(() => {
    initSDK({
      androidKey: 'your-android-api-key',
    });
  }, []);

  const handleMoveCamera = async () => {
    await mapRef.current?.moveCamera(
      {
        target: { latitude: 40.0, longitude: 116.5 },
        zoom: 15,
      },
      1000
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10,
        }}
        myLocationEnabled={true}
        followUserLocation={false}
        trafficEnabled={true}
        onPress={(e) => console.log('点击地图', e)}
        onLoad={() => console.log('地图加载完成')}
      >
        {/* 圆形覆盖物 */}
        <Circle
          center={{ latitude: 39.9, longitude: 116.4 }}
          radius={1000}
          fillColor="#8800FF00"
          strokeColor="#FFFF0000"
          strokeWidth={2}
        />

        {/* 标记点 */}
        <Marker
          position={{ latitude: 39.95, longitude: 116.45 }}
          title="这是一个标记"
          draggable={true}
        />

        {/* 折线 */}
        <Polyline
          points={[
            { latitude: 39.9, longitude: 116.4 },
            { latitude: 39.95, longitude: 116.45 },
            { latitude: 40.0, longitude: 116.5 },
          ]}
          strokeWidth={5}
          strokeColor="#FF0000FF"
        />

        {/* 多边形 */}
        <Polygon
          points={[
            { latitude: 39.85, longitude: 116.35 },
            { latitude: 39.85, longitude: 116.45 },
            { latitude: 39.75, longitude: 116.40 },
          ]}
          fillColor="#880000FF"
          strokeColor="#FFFF0000"
          strokeWidth={2}
        />
      </MapView>

      <View style={styles.controls}>
        <Button title="移动相机" onPress={handleMoveCamera} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
```

### 定位追踪应用

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { 
  MapView,
  initSDK,
  start,
  stop,
  getCurrentLocation,
  addLocationListener,
  setLocatingWithReGeocode,
  setLocationMode,
  setInterval,
  type Location,
} from 'expo-gaode-map';

export default function LocationApp() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // 初始化 SDK
    initSDK({
      androidKey: 'your-android-api-key',
    });

    // 配置定位参数
    setLocatingWithReGeocode(true);  // 返回地址信息
    setLocationMode(0);              // 高精度模式
    setInterval(2000);               // 2秒更新一次

    // 监听位置更新
    const subscription = addLocationListener((loc) => {
      console.log('位置更新:', loc);
      setLocation(loc);
    });

    return () => subscription.remove();
  }, []);

  const handleStartTracking = () => {
    start();
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    stop();
    setIsTracking(false);
  };

  const handleGetLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.error('获取位置失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        myLocationEnabled={true}
        followUserLocation={isTracking}
        initialCameraPosition={{
          target: { 
            latitude: location?.latitude || 39.9, 
            longitude: location?.longitude || 116.4 
          },
          zoom: 15,
        }}
      />

      {location && (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            纬度: {location.latitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            经度: {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            精度: {location.accuracy.toFixed(2)} 米
          </Text>
          {location.address && (
            <Text style={styles.infoText}>
              地址: {location.address}
            </Text>
          )}
        </View>
      )}

      <View style={styles.controls}>
        <Button 
          title="获取位置" 
          onPress={handleGetLocation} 
        />
        <View style={{ height: 10 }} />
        <Button 
          title={isTracking ? '停止追踪' : '开始追踪'}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
          color={isTracking ? '#FF3B30' : '#007AFF'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  info: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});
```

## 🎨 高级用法

### followUserLocation 详解

`followUserLocation` 控制地图是否自动跟随用户位置移动：

**浏览模式（默认 - `false`）：**
```tsx
<MapView
  myLocationEnabled={true}
  followUserLocation={false}  // 或省略
/>
```
- ✅ 显示定位点
- ✅ 用户可自由滑动地图
- ✅ 地图不会自动移动

**导航模式（`true`）：**
```tsx
<MapView
  myLocationEnabled={true}
  followUserLocation={true}
/>
```
- ✅ 显示定位点
- ✅ 地图自动跟随用户移动
- ⚠️ 适合导航场景

详细说明请参考：[docs/followUserLocation.md](docs/followUserLocation.md)

### 命令式 API 批量操作

```tsx
const mapRef = useRef<MapViewRef>(null);

// 批量添加覆盖物
const addMultipleOverlays = async () => {
  // 添加多个圆形
  await mapRef.current?.addCircle('circle1', {
    center: { latitude: 39.9, longitude: 116.4 },
    radius: 1000,
    fillColor: 0x8800FF00,
  });
  
  await mapRef.current?.addCircle('circle2', {
    center: { latitude: 40.0, longitude: 116.5 },
    radius: 500,
    fillColor: 0x880000FF,
  });
  
  // 添加标记
  await mapRef.current?.addMarker('marker1', {
    position: { latitude: 39.95, longitude: 116.45 },
    title: '北京',
  });
};

// 批量清除
const clearAll = async () => {
  await mapRef.current?.removeCircle('circle1');
  await mapRef.current?.removeCircle('circle2');
  await mapRef.current?.removeMarker('marker1');
};
```

### 权限配置

在 `app.json` 中配置定位权限（Android）：

```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### 颜色格式

覆盖物颜色支持两种格式：

1. **字符串格式**（ARGB）：`"#AARRGGBB"`
   ```tsx
   <Circle fillColor="#8800FF00" />  // 50% 透明绿色
   ```

2. **数字格式**（命令式 API）：`0xAARRGGBB`
   ```tsx
   await mapRef.current?.addCircle('circle1', {
     fillColor: 0x8800FF00,  // 50% 透明绿色
   });
   ```

### 性能优化

- ✅ 使用命令式 API 处理大量覆盖物
- ✅ 及时移除不需要的覆盖物
- ✅ 避免在 `onPress` 等高频事件中进行复杂操作
- ✅ 定位间隔不要设置太小（建议 >= 1000ms）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 🔗 相关链接

- [高德地图开放平台](https://lbs.amap.com/)
- [高德地图 Android SDK](https://lbs.amap.com/api/android-sdk/summary)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [GitHub 仓库](https://github.com/yourusername/expo-gaode-map)

## 📮 反馈与支持

如果你在使用过程中遇到问题或有任何建议，欢迎：

- 📝 提交 [GitHub Issue](https://github.com/yourusername/expo-gaode-map/issues)
- 💬 参与 [Discussions](https://github.com/yourusername/expo-gaode-map/discussions)
- ⭐ 给项目点个 Star 支持一下
