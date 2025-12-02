# API 文档

完整的 API 参考文档。

> ⚠️ **权限和隐私合规警告**
>
> 使用地图和定位功能前，请确保：
> 1. ✅ 已在原生项目中配置必需的权限声明
> 2. ✅ 在运行时请求用户授权
> 3. ✅ 遵守《个人信息保护法》等隐私法规
> 4. ✅ 配置高德 SDK 隐私合规接口

## 目录

- [MapView Props](/api/mapview)
- [MapView 方法](/api/mapview#mapview-方法)
- [定位 API](/api/location)
- [覆盖物组件](/api/overlays)
- [类型定义](/api/types)

## 快速导航

### 地图组件

```tsx
import { MapView } from 'expo-gaode-map';

<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  myLocationEnabled={true}
/>
```

### 定位功能

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 初始化 SDK
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});

// 获取当前位置
const location = await ExpoGaodeMapModule.getCurrentLocation();
```

### 覆盖物

```tsx
import { Circle, Marker, Polyline, Polygon } from 'expo-gaode-map';

<MapView>
  <Marker position={{ latitude: 39.9, longitude: 116.4 }} />
  <Circle center={{ latitude: 39.9, longitude: 116.4 }} radius={1000} />
</MapView>
```

## 相关文档

- [使用示例](/examples/) - 详细的代码示例
- [初始化指南](/guide/initialization) - SDK 初始化和权限管理
- [快速开始](/guide/getting-started) - 快速上手指南