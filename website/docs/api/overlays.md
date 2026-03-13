# 覆盖物 API

覆盖物组件必须作为 `MapView` 的子组件使用，用于在地图上绘制点、线、面和聚合图层。

> ⚠️ 覆盖物依赖地图实例。请确保在渲染 `MapView` 前，已经先完成隐私合规：
> - `ExpoGaodeMapModule.setPrivacyShow(true, true)`
> - `ExpoGaodeMapModule.setPrivacyAgree(true)`

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
| `customViewWidth` | `number` | `0` | 自定义视图宽度，使用 `children` 时建议显式传入 |
| `customViewHeight` | `number` | `0` | 自定义视图高度，使用 `children` 时建议显式传入 |
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
  customViewWidth={96}
  customViewHeight={40}
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
