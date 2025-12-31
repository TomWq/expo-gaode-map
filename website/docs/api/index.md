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

### 核心功能（expo-gaode-map）

- [MapView Props](/api/mapview)
- [MapView 方法](/api/mapview#mapview-方法)
- [组件与 Hooks](/api/components)
- [定位 API](/api/location)
- [覆盖物组件](/api/overlays)
- [类型定义](/api/types)

### 扩展功能

- [搜索 API](/api/search) - `expo-gaode-map-search`（可选安装）
- [导航 API](/api/navigation) - `expo-gaode-map-navigation`（独立包，与核心包二选一）
- [Web API](/api/web-api) - `expo-gaode-map-web-api`（可选安装）

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

// 使用 Config Plugin 时，原生 Key 已自动配置
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
});

// 获取当前位置
const location = await ExpoGaodeMapModule.getCurrentLocation();
```

### 搜索功能

```tsx
import { searchPOI } from 'expo-gaode-map-search';

// POI 搜索
const result = await searchPOI({
  keyword: '酒店',
  city: '北京',
});
```

### 导航功能

```tsx
import { calculateDriveRoute, DriveStrategy } from 'expo-gaode-map-navigation';

// 驾车路径规划
const result = await calculateDriveRoute({
  type: 'drive',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST,
});
```

### Web API 服务

```tsx
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// 无参构造（从基础模块读取 webKey）
const api = new GaodeWebAPI();

// 逆地理编码：坐标 → 地址
const result = await api.geocode.regeocode('116.481028,39.989643');
console.log(result.regeocode.formatted_address);

// 驾车路径规划
const route = await api.route.driving(
  '116.481028,39.989643',
  '116.434446,39.90816'
);
```

### 覆盖物

```tsx
import { Circle, Marker, Polyline, Polygon } from 'expo-gaode-map';

<MapView>
  <Marker position={{ latitude: 39.9, longitude: 116.4 }} />
  <Circle center={{ latitude: 39.9, longitude: 116.4 }} radius={1000} />
</MapView>
```

## 模块化设计

expo-gaode-map 采用 Monorepo 架构：

- **核心包** (`expo-gaode-map`) - 地图显示、定位、覆盖物
- **搜索包** (`expo-gaode-map-search`) - POI 搜索、周边搜索等（可选）
- **导航包** (`expo-gaode-map-navigation`) - 路径规划、实时导航（独立包，与核心包二选一）
- **Web API 包** (`expo-gaode-map-web-api`) - Web 服务 API（可选）

按需安装功能包，减少应用包体积。

::: warning 导航包特别说明
导航包是独立的一体化解决方案，内置了完整的地图功能。**不能**与核心包 `expo-gaode-map` 同时安装。
:::

## 相关文档

- [快速开始](/guide/getting-started) - 快速上手指南
- [搜索功能](/guide/search) - 搜索功能详细指南
- [导航功能](/guide/navigation) - 导航功能详细指南
- [Web API 服务](/guide/web-api) - Web API 使用指南
- [架构说明](/guide/architecture) - Monorepo 架构
- [使用示例](/examples/) - 详细的代码示例