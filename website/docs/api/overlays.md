# 覆盖物 API

覆盖物组件必须作为 `MapView` 的子组件使用，用于在地图上绘制点、线、面和聚合图层。

> ⚠️ 覆盖物依赖地图实例。请确保首次安装时已经先完成隐私合规；用户同意后，原生会自动持久化并在后续冷启动恢复。

## 坐标格式

所有覆盖物坐标都支持两种写法：

- 对象：`{ latitude, longitude }`
- 数组：`[longitude, latitude]`

---

## Marker（标记点）

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `LatLngPoint` | - | 标记点坐标，必填 |
| `icon` | `string \| ImageSourcePropType` | - | 自定义图标，支持网络图片、本地文件或资源对象 |
| `iconWidth` | `number` | `40` | 图标宽度，仅 `icon` 生效时使用 |
| `iconHeight` | `number` | `40` | 图标高度，仅 `icon` 生效时使用 |
| `title` | `string` | - | 标题 |
| `snippet` | `string` | - | 描述文案 |
| `opacity` | `number` | - | 透明度，范围 `0 ~ 1`，仅 Android |
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `flat` | `boolean` | `false` | 是否平贴地图，仅 Android |
| `zIndex` | `number` | - | 层级，仅 Android |
| `anchor` | `Point` | - | 锚点比例，仅 Android |
| `centerOffset` | `Point` | - | 图标偏移，仅 iOS |
| `animatesDrop` | `boolean` | `false` | 掉落动画，仅 iOS |
| `pinColor` | `'red' \| 'orange' \| 'yellow' \| 'green' \| 'cyan' \| 'blue' \| 'violet' \| 'magenta' \| 'rose' \| 'purple'` | - | 大头针颜色 |
| `children` | `React.ReactNode` | - | 自定义 Marker 视图 |
| `customViewWidth` | `number` | `0` | 自定义视图宽度，可省略；默认会自动测量 `children` 的布局尺寸 |
| `customViewHeight` | `number` | `0` | 自定义视图高度，可省略；默认会自动测量 `children` 的布局尺寸 |
| `cacheKey` | `string` | - | 自定义视图缓存键，频繁渲染时建议提供 |
| `growAnimation` | `boolean` | `false` | 生长动画，Android / iOS |
| `smoothMovePath` | `LatLng[]` | - | 平滑移动轨迹点数组 |
| `smoothMoveDuration` | `number` | `10` | 平滑移动总时长，单位秒 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onMarkerPress` | `NativeSyntheticEvent<LatLng>` | 点击 Marker |
| `onMarkerDragStart` | `NativeSyntheticEvent<LatLng>` | 开始拖拽 |
| `onMarkerDrag` | `NativeSyntheticEvent<LatLng>` | 拖拽中 |
| `onMarkerDragEnd` | `NativeSyntheticEvent<LatLng>` | 拖拽结束 |
| `onSmoothMoveProgress` | `NativeSyntheticEvent<SmoothMoveProgressEvent>` | 平滑移动过程中的进度事件 |
| `onSmoothMoveEnd` | `NativeSyntheticEvent<SmoothMoveEndEvent>` | 平滑移动结束事件 |

### 示例

```tsx
<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="北京"
    snippet="中国首都"
    draggable
    onMarkerPress={(e) => console.log('点击标记', e.nativeEvent)}
    onMarkerDragEnd={(e) => console.log('拖拽结束', e.nativeEvent)}
  />
</MapView>
```

### 自定义视图

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  cacheKey="custom-marker-1"
>
  <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8 }}>
    <Text>自定义内容</Text>
  </View>
</Marker>
```

### 平滑移动

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  smoothMovePath={[
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
    { latitude: 39.93, longitude: 116.43 },
  ]}
  smoothMoveDuration={5}
/>
```

### Marker 平滑移动事件

当 `smoothMovePath` 和 `smoothMoveDuration` 同时提供时，`Marker` 会派发两类轨迹事件：

```ts
interface SmoothMoveProgressEvent {
  position: LatLng;
  angle: number;
  progress: number;
  distance: number;
  totalDistance: number;
}

interface SmoothMoveEndEvent {
  position: LatLng;
  angle: number;
  totalDistance: number;
}
```

```tsx
<Marker
  position={routePoints[0]}
  smoothMovePath={playback.smoothMovePath}
  smoothMoveDuration={playback.smoothMoveDuration}
  onSmoothMoveProgress={(event) => {
    console.log('进度', event.nativeEvent.progress);
  }}
  onSmoothMoveEnd={(event) => {
    console.log('回放结束位置', event.nativeEvent.position);
  }}
/>
```

---

## Polyline（折线）

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `LatLngPoint[]` | - | 折线坐标点数组，必填 |
| `strokeWidth` | `number` | - | 线宽 |
| `strokeColor` | `ColorValue` | - | 线条颜色 |
| `zIndex` | `number` | - | 层级 |
| `colors` | `ColorValue[]` | - | 分段颜色数组 |
| `gradient` | `boolean` | `false` | 是否使用渐变色，仅 Android |
| `geodesic` | `boolean` | `false` | 是否绘制大地线，仅 Android |
| `simplificationTolerance` | `number` | - | 轨迹抽稀容差，单位米 |
| `dotted` | `boolean` | `false` | 是否绘制虚线，仅 Android |
| `texture` | `string` | - | 纹理图片，支持网络图片、本地文件或资源名 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onPolylinePress` | `NativeSyntheticEvent<{}>` | 点击折线 |

### 示例

```tsx
<Polyline
  points={[
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.95, longitude: 116.45 },
    { latitude: 40.0, longitude: 116.5 },
  ]}
  strokeWidth={5}
  strokeColor="#FF1677FF"
  simplificationTolerance={2}
  onPolylinePress={() => console.log('折线被点击')}
/>
```

---

## Polygon（多边形）

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `LatLngPoint[] \| LatLngPoint[][]` | - | 多边形坐标，支持单环和带孔多边形 |
| `strokeWidth` | `number` | - | 边线宽度 |
| `strokeColor` | `ColorValue` | - | 边线颜色 |
| `fillColor` | `ColorValue` | - | 填充颜色 |
| `zIndex` | `number` | - | 层级 |
| `simplificationTolerance` | `number` | - | 边界抽稀容差，单位米 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onPolygonPress` | `NativeSyntheticEvent<{}>` | 点击多边形 |
| `onPolygonSimplified` | `NativeSyntheticEvent<{ originalCount: number; simplifiedCount: number }>` | 抽稀完成 |

### 示例

```tsx
<Polygon
  points={[
    [
      { latitude: 39.9, longitude: 116.3 },
      { latitude: 39.9, longitude: 116.5 },
      { latitude: 39.8, longitude: 116.5 },
      { latitude: 39.8, longitude: 116.3 },
    ],
    [
      { latitude: 39.87, longitude: 116.37 },
      { latitude: 39.87, longitude: 116.43 },
      { latitude: 39.83, longitude: 116.43 },
      { latitude: 39.83, longitude: 116.37 },
    ],
  ]}
  fillColor="#5533AAFF"
  strokeColor="#FF1677FF"
  strokeWidth={2}
  onPolygonSimplified={(e) => console.log(e.nativeEvent)}
/>
```

---

## Circle（圆形）

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `center` | `LatLngPoint` | - | 圆心坐标，必填 |
| `radius` | `number` | - | 半径，单位米，必填 |
| `strokeWidth` | `number` | - | 边线宽度 |
| `strokeColor` | `ColorValue` | - | 边线颜色 |
| `fillColor` | `ColorValue` | - | 填充颜色 |
| `zIndex` | `number` | - | 层级 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onCirclePress` | `NativeSyntheticEvent<{}>` | 点击圆形 |

### 示例

```tsx
<Circle
  center={{ latitude: 39.9, longitude: 116.4 }}
  radius={1000}
  fillColor="#2200FF00"
  strokeColor="#FF00AA00"
  strokeWidth={2}
  onCirclePress={() => console.log('圆形被点击')}
/>
```

---

## HeatMap（热力图）

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `LatLngPoint[]` | - | 热力点数组，必填 |
| `visible` | `boolean` | `true` | 是否显示热力图 |
| `radius` | `number` | - | 热力半径，单位米 |
| `opacity` | `number` | - | 透明度，范围 `0 ~ 1` |
| `gradient` | `{ colors: ColorValue[]; startPoints: number[] }` | - | 热力图渐变配置 |
| `allowRetinaAdapting` | `boolean` | `false` | 是否开启高清热力图，仅 iOS |

### 示例

```tsx
<HeatMap
  data={[
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
  ]}
  radius={40}
  opacity={0.7}
  gradient={{
    colors: ['#00F5FF', '#00FF7F', '#FFFF00', '#FF4500'],
    startPoints: [0.2, 0.4, 0.7, 1.0],
  }}
/>
```

---

## MultiPoint（海量点）

适合大量静态点位展示，比逐个 `Marker` 更轻量。

### MultiPointItem

```ts
interface MultiPointItem {
  latitude: number;
  longitude: number;
  id?: string | number;
  data?: unknown;
}
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `MultiPointItem[]` | - | 海量点集合，必填 |
| `icon` | `string \| ImageSourcePropType` | - | 统一图标 |
| `iconWidth` | `number` | - | 图标宽度 |
| `iconHeight` | `number` | - | 图标高度 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onMultiPointPress` | `NativeSyntheticEvent<{ index: number; item: MultiPointItem }>` | 点击某个点位 |

### 示例

```tsx
<MultiPoint
  points={[
    { id: 1, latitude: 39.9, longitude: 116.4, data: { name: 'A' } },
    { id: 2, latitude: 39.91, longitude: 116.41, data: { name: 'B' } },
  ]}
  icon="https://example.com/pin.png"
  iconWidth={24}
  iconHeight={24}
  onMultiPointPress={(e) => console.log(e.nativeEvent.item)}
/>
```

---

## Cluster（点聚合）

### ClusterPoint

```ts
interface ClusterPoint {
  latitude?: number;
  longitude?: number;
  position?: LatLngPoint;
  properties?: Record<string, unknown>;
}
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `ClusterPoint[]` | - | 聚合点数组，必填 |
| `icon` | `string` | - | 聚合基础图标，支持网络 URL、本地文件路径或原生资源名称 |
| `radius` | `number` | - | 聚合半径 |
| `minClusterSize` | `number` | - | 最小成簇数量 |
| `clusterStyle` | `ViewStyle` | - | 聚合点基础样式 |
| `clusterBuckets` | `({ minPoints: number } & ViewStyle)[]` | - | 分级聚合样式 |
| `clusterTextStyle` | `TextStyle` | - | 聚合数字文本样式 |
| `renderMarker` | `(item: ClusterPoint) => React.ReactNode` | - | 暂未实现，请勿使用 |
| `renderCluster` | `(params: ClusterParams) => React.ReactNode` | - | 暂未实现，请勿使用 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onClusterPress` | `NativeSyntheticEvent<ClusterParams>` | 点击聚合簇 |

### ClusterParams

```ts
interface ClusterParams {
  count: number;
  latitude: number;
  longitude: number;
  pois?: ClusterPoint[];
  id?: number;
  position?: LatLng;
}
```

### 示例

```tsx
<Cluster
  points={[
    { latitude: 39.9, longitude: 116.4, properties: { id: 1 } },
    { latitude: 39.901, longitude: 116.401, properties: { id: 2 } },
    { position: [116.402, 39.902], properties: { id: 3 } },
  ]}
  radius={30}
  minClusterSize={2}
  clusterStyle={{
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1677FF',
    alignItems: 'center',
    justifyContent: 'center',
  }}
  clusterTextStyle={{
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  }}
  clusterBuckets={[
    { minPoints: 1, backgroundColor: '#00BFFF' },
    { minPoints: 10, backgroundColor: '#FFA500' },
    { minPoints: 50, backgroundColor: '#FF4500' },
  ]}
  onClusterPress={(e) => console.log(e.nativeEvent.count)}
/>
```

---

## RouteOverlay（路线展示）

`RouteOverlay` 是对“路线折线 + 起点 Marker + 终点 Marker”的标准封装，适合和 Web API 的算路结果或业务侧轨迹点集直接配合。

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `LatLngPoint[]` | - | 路线点集，必填 |
| `showStartMarker` | `boolean` | `true` | 是否显示起点 |
| `showEndMarker` | `boolean` | `true` | 是否显示终点 |
| `polylineProps` | `Omit<PolylineProps, 'points'>` | - | 透传给内部 `Polyline` 的属性 |
| `startMarkerProps` | `Omit<MarkerProps, 'position'>` | - | 透传给起点 `Marker` 的属性 |
| `endMarkerProps` | `Omit<MarkerProps, 'position'>` | - | 透传给终点 `Marker` 的属性 |

### 示例

```tsx
<RouteOverlay
  points={routePoints}
  polylineProps={{
    strokeWidth: 8,
    strokeColor: '#1677ff',
  }}
  startMarkerProps={{
    title: '起点',
  }}
  endMarkerProps={{
    title: '终点',
  }}
/>
```

### 适用场景

- 使用 `extractRoutePoints(routeResult)` 后直接渲染驾车 / 步行 / 骑行路线
- 配合 `MapViewRef.fitToCoordinates()` 做整条路线预览
- 配合 `useRoutePlayback()` 做车辆或轨迹回放

---

## AreaMaskOverlay（区域遮罩）

`AreaMaskOverlay` 用于渲染“外环遮罩 + 内部挖洞”的区域高亮效果。底层仍然使用现有 `Polygon` 带孔能力，不会新增额外原生 overlay 类型。

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `rings` | `LatLngPoint[][] \| string` | - | 多环边界。第一个环通常作为外层遮罩，后续环作为高亮区域 |
| `polygonProps` | `Omit<PolygonProps, 'points'>` | - | 透传给内部 `Polygon` 的属性 |

### 示例

```tsx
<AreaMaskOverlay
  rings={[
    outerRing,
    aoiRing,
  ]}
  polygonProps={{
    fillColor: 'rgba(15, 23, 42, 0.45)',
    strokeColor: 'rgba(255,255,255,0.8)',
    strokeWidth: 2,
  }}
/>
```

### 字符串输入

`rings` 也支持直接传入多环 polyline 字符串：

```ts
const polyline =
  '116.32,39.97;116.48,39.97;116.48,39.84;116.32,39.84|116.37,39.93;116.42,39.93;116.42,39.89;116.37,39.89';

<AreaMaskOverlay rings={polyline} />
```

这类字符串通常来自 AOI 边界查询结果，可以配合 `extractAOIBoundary()` 直接转换后使用。

---

## useRoutePlayback（路线回放 Hook）

`useRoutePlayback` 提供路线回放控制器，适合把路线点集转换成“当前播放位置 + 平滑移动轨迹 + 跟随相机”的一等能力，而不是在业务层重复写定时器逻辑。

### 参数

```ts
const playback = useRoutePlayback(points, {
  speedMultiplier: 1,
  updateIntervalMs: 100,
  followCamera: true,
  followZoom: 17,
  autoFit: false,
});
```

### RoutePlaybackOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `durationSeconds` | `number` | - | 指定总回放时长 |
| `minDurationSeconds` | `number` | - | 最短回放时长保护 |
| `speedMultiplier` | `number` | `1` | 倍速 |
| `baseSpeedMps` | `number` | - | 基础速度，单位米/秒 |
| `updateIntervalMs` | `number` | `100` | 更新频率 |
| `followCamera` | `boolean` | `false` | 是否跟随相机 |
| `followZoom` | `number` | `17` | 跟随时使用的缩放级别 |
| `bearingSmoothing` | `number` | - | 朝向平滑系数 |
| `lookAheadDistanceMeters` | `number` | - | 相机前视距离 |
| `simplificationTolerance` | `number` | - | 轨迹抽稀容差 |
| `autoFit` | `boolean` | `false` | 是否在初始化时自动框选路线 |
| `fitOptions` | `FitToCoordinatesOptions` | - | 自动框选时的配置 |
| `onProgress` | `(state) => void` | - | 回放进度回调 |
| `onComplete` | `(state) => void` | - | 回放结束回调 |

### 返回值

`useRoutePlayback` 返回 `RoutePlaybackController`：

```ts
interface RoutePlaybackController {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  currentPosition: LatLng | null;
  currentAngle: number;
  totalDistance: number;
  traveledDistance: number;
  durationSeconds: number;
  smoothMovePath?: LatLng[];
  smoothMoveDuration?: number;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  seek(progress: number): void;
  setSpeedMultiplier(multiplier: number): void;
}
```

### 示例

```tsx
const playback = useRoutePlayback(routePoints, {
  followCamera: true,
  followZoom: 17,
  updateIntervalMs: 100,
});

<Marker
  position={playback.currentPosition ?? routePoints[0]}
  smoothMovePath={playback.smoothMovePath}
  smoothMoveDuration={playback.smoothMoveDuration}
/>
```

---

## 路线与 AOI 数据工具

这些工具是纯 TS 逻辑，适合在业务层先做路径 / 区域归一化，再交给 `RouteOverlay`、`AreaMaskOverlay` 或 `MapViewRef.fitToCoordinates()`。

### getRouteBounds(points)

根据点集计算中心点、边界和推荐缩放级别：

```ts
const bounds = getRouteBounds(routePoints);
console.log(bounds?.center, bounds?.recommendedZoom);
```

### parseMultiRingPolyline(polyline)

解析 `ring1|ring2` 这种多环 polyline 字符串，返回 `{ rings, bounds }`：

```ts
const result = parseMultiRingPolyline(polyline);
console.log(result.rings, result.bounds);
```

这两个工具都由 `expo-gaode-map` 导出，不依赖导航包内部地图实现。

---

## 颜色格式

覆盖物颜色支持：

- `'#AARRGGBB'`
- `'#RRGGBB'`
- `'red'` / `'rgba(...)'`
- Android 也支持数字格式，如 `0xFF1677FF`

## 组合示例

```tsx
import {
  MapView,
  Marker,
  Polyline,
  Polygon,
  Circle,
  HeatMap,
  MultiPoint,
  Cluster,
} from 'expo-gaode-map';

export default function OverlaysExample() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 11,
      }}
    >
      <Circle center={{ latitude: 39.9, longitude: 116.4 }} radius={1000} />
      <Marker position={{ latitude: 39.92, longitude: 116.42 }} title="Marker" />
      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.95, longitude: 116.45 },
        ]}
        strokeWidth={4}
        strokeColor="#1677FF"
      />
      <Polygon
        points={[
          { latitude: 39.85, longitude: 116.35 },
          { latitude: 39.85, longitude: 116.45 },
          { latitude: 39.75, longitude: 116.4 },
        ]}
        fillColor="#2200AAFF"
      />
      <HeatMap
        data={[
          { latitude: 39.91, longitude: 116.38 },
          { latitude: 39.92, longitude: 116.39 },
        ]}
      />
    </MapView>
  );
}
```
