# expo-gaode-map

[English](./README.en.md) | 简体中文

一个功能完整的高德地图 React Native 组件库，**基于 Expo Modules 开发**，提供地图显示、定位、覆盖物等功能：
- Android: [高德地图 Android SDK](https://lbs.amap.com/api/android-sdk/summary)
- iOS: [高德地图 iOS SDK](https://lbs.amap.com/api/ios-sdk/summary) 

> 💡 本组件使用 [Expo Modules API](https://docs.expo.dev/modules/overview/) 构建，提供了类型安全的原生模块接口和优秀的开发体验。

## ✨ 特性

- ✅ 完整的地图功能（多种地图类型、手势控制、相机操作）
- ✅ 精准定位（连续定位、单次定位、坐标转换）
- ✅ 丰富的覆盖物（Circle、Marker、Polyline、Polygon）
- ✅ 完整的 TypeScript 类型定义（零 any 类型）
- ✅ 模块化架构设计
- ✅ 同时支持声明式组件和命令式 API(注意：命令式 API 将在未来的版本删除，建议使用声明式组件)
- ✅ 跨平台支持（Android、iOS）
- ✅ 支持自定义样式和事件监听
- ✅ 同时支持 React Native 新旧架构（Paper & Fabric）

## 📦 安装

### 稳定版本（推荐）

```bash
npm install expo-gaode-map
# 或
yarn add expo-gaode-map
# 或
pnpm add expo-gaode-map
```

### 体验 2.0 测试版本 🚀

> ⚠️ **重要提示**: 2.0 版本包含破坏性变更，API 调用方式有重大调整。详见 [迁移指南](docs/MIGRATION.md)

如果你想体验最新的 2.0 alpha 版本（包含改进的架构和更好的类型支持）：

```bash
npm install expo-gaode-map@next
# 或
yarn add expo-gaode-map@next
# 或
pnpm add expo-gaode-map@next
```

**2.0 版本主要变化：**
- ✅ 统一的 API 调用方式（`ExpoGaodeMapModule`）
- ✅ 完整的 TypeScript 类型支持
- ✅ 移除了多余的封装层，直接调用原生模块
- ✅ 完全移除命令式 API的支持
- ✅ 添加未实现的一些新的 API（如：onCameraMove、onCameraIdle）
- ⚠️ **不向后兼容**，需要按照 [迁移指南](docs/MIGRATION.md) 更新代码

**版本对比：**
- `1.x`（稳定版）：`import { initSDK, start, stop } from 'expo-gaode-map'`
- `2.0`（测试版）：`import { ExpoGaodeMapModule } from 'expo-gaode-map'`

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

> ⚠️ **重要：原生配置和权限**
>
> 高德地图 SDK 需要在原生项目中进行配置：
>
> **Android 必需配置：**
> 1. 在 `AndroidManifest.xml` 中配置 API Key
> 2. 添加必需权限（网络、定位等）
> 3. 配置隐私合规（必需）
>
> **iOS 必需配置：**
> 1. 在 `Info.plist` 中配置 API Key
> 2. 添加定位权限描述（NSLocationWhenInUseUsageDescription 等）
> 3. 配置隐私合规（必需）
>
> **详细配置指南：**
> - **Android**: [高德地图 Android SDK 配置指南](https://lbs.amap.com/api/android-sdk/guide/create-project/android-studio-create-project)
> - **iOS**: [高德地图 iOS SDK 配置指南](https://lbs.amap.com/api/ios-sdk/guide/create-project/cocoapods)
>
> 对于 Expo 项目，使用 `npx expo prebuild` 生成原生代码后进行配置。

### 2. 初始化和权限管理

**推荐的初始化流程**：

```tsx
import { useEffect, useState } from 'react';
import {
  MapView,
  ExpoGaodeMapModule,
} from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      // 1. 初始化 SDK
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-api-key',
        iosKey: 'your-ios-api-key',
      });
      
      // 2. 检查并请求权限
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        await ExpoGaodeMapModule.requestLocationPermission();
      }
      
      // 3. 获取位置并设置地图
      try {
        const location = await ExpoGaodeMapModule.getCurrentLocation();
        setInitialPosition({
          target: { latitude: location.latitude, longitude: location.longitude },
          zoom: 15
        });
      } catch (error) {
        // 使用默认位置
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10
        });
      }
    };
    
    initialize();
  }, []);

  if (!initialPosition) return null;

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition}
      myLocationEnabled={true}
    />
  );
}
```

> 📖 **详细的初始化指南**: [INITIALIZATION.md](docs/INITIALIZATION.md)
>
> 包含完整的权限处理、错误处理和最佳实践。

### 3. 基础地图使用

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
- [初始化指南](docs/INITIALIZATION.md) - SDK 初始化和权限管理
- [架构文档](docs/ARCHITECTURE.md) - 项目结构和文件说明
- [迁移指南](docs/MIGRATION.md) - v1.x 到 v2.0 的迁移指南

## ⚠️ 注意事项

### 基础地图应用

```tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import {
  MapView,
  ExpoGaodeMapModule,
  Circle,
  Marker,
  Polyline,
  Polygon,
  type MapViewRef
} from 'expo-gaode-map';

export default function App() {
  const mapRef = useRef<MapViewRef>(null);

  useEffect(() => {
    ExpoGaodeMapModule.initSDK({
      androidKey: 'your-android-api-key',
      iosKey: 'your-ios-api-key',
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
  ExpoGaodeMapModule,
  type Location,
} from 'expo-gaode-map';

export default function LocationApp() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // 初始化 SDK
    ExpoGaodeMapModule.initSDK({
      androidKey: 'your-android-api-key',
      iosKey: 'your-ios-api-key',
    });

    // 配置定位参数
    ExpoGaodeMapModule.setLocatingWithReGeocode(true);  // 返回地址信息
    ExpoGaodeMapModule.setLocationMode(0);              // 高精度模式
    ExpoGaodeMapModule.setInterval(2000);               // 2秒更新一次

    // 监听位置更新
    const subscription = ExpoGaodeMapModule.addLocationListener('onLocationUpdate', (loc) => {
      console.log('位置更新:', loc);
      setLocation(loc);
    });

    return () => subscription.remove();
  }, []);

  const handleStartTracking = () => {
    ExpoGaodeMapModule.start();
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    ExpoGaodeMapModule.stop();
    setIsTracking(false);
  };

  const handleGetLocation = async () => {
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
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



### 颜色格式

覆盖物颜色支持两种格式：

1. **字符串格式**（ARGB）：`"#AARRGGBB"`
   ```tsx
   <Circle fillColor="#8800FF00" />  // 50% 透明绿色
   ```
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

## 🙏 致谢

本项目在开发过程中参考了以下优秀项目，特此致谢：

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - 一个优秀的 React Native 高德地图组件，为本项目的设计和实现提供了重要参考

感谢这些开源项目的贡献者们，他们的工作为社区带来了宝贵的经验和代码。

## 📮 反馈与支持

如果你在使用过程中遇到问题或有任何建议，欢迎：

- 📝 提交 [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 参与 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- ⭐ 给项目点个 Star 支持一下
- 💬 加入 QQ 群：952241387 
