# 覆盖物 API

覆盖物组件用于在地图上显示各种图形元素。

## Circle (圆形)

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `center` | `LatLng` 或 `number[]` | - | 圆心坐标（必需），支持对象 `{latitude, longitude}` 或数组 `[longitude, latitude]` |
| `radius` | `number` | - | 半径（米） |
| `fillColor` | `string` | - | 填充颜色 |
| `strokeColor` | `string` | - | 边框颜色 |
| `strokeWidth` | `number` | `1` | 边框宽度 |

### 示例

```tsx
<MapView>
  <Circle
    center={{ latitude: 39.9, longitude: 116.4 }}
    radius={1000}
    fillColor="#8800FF00"
    strokeColor="#FFFF0000"
    strokeWidth={2}
    onPress={() => console.log('圆形被点击')}
  />
</MapView>
```

## Marker (标记点)

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `LatLng` 或 `number[]` | - | 标记点坐标（必需），支持对象 `{latitude, longitude}` 或数组 `[longitude, latitude]` |
| `title` | `string` | - | 标题 |
| `snippet` | `string` | - | 描述信息 |
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `icon` | `string` | - | 自定义图标 |
| `iconWidth` | `number` | `40` | 图标宽度 |
| `iconHeight` | `number` | `40` | 图标高度 |
| `growAnimation` | `boolean` | `false` | 是否开启生长动画 (Android/iOS) |
| `animatesDrop` | `boolean` | `false` | 是否显示掉落动画 (iOS) |
| `smoothMovePath` | `LatLng[]` 或 `number[][]` | - | 平滑移动路径坐标数组，支持对象数组或二维数组 `[[lon, lat], ...]` |
| `smoothMoveDuration` | `number` | `10` | 平滑移动时长（秒） |

### Marker 动画

Marker 支持多种动画效果，用于增强交互体验。

- **生长动画** (`growAnimation`): Marker 会从地面“生长”出来。适用于 Marker 首次出现时的入场动画。支持 Android 和 iOS。
- **掉落动画** (`animatesDrop`): Marker 会从上方掉落到指定位置。仅支持 iOS。

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  growAnimation={true} // 开启生长动画
  animatesDrop={true}  // 开启掉落动画 (iOS)
/>
```

### 平滑移动

Marker 支持沿指定路径平滑移动，适用于车辆追踪、人员移动轨迹等场景。

#### 使用方式

设置 `smoothMovePath` 和 `smoothMoveDuration` 属性即可自动触发平滑移动：

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

#### 注意事项

- **路径格式**：`smoothMovePath` 是坐标点数组，Marker 会从当前位置开始，依次经过所有路径点
- **时长单位**：`smoothMoveDuration` 单位为秒，控制整个移动过程的总时间
- **自动触发**：当 `smoothMovePath` 和 `smoothMoveDuration` 都设置时，自动开始移动
- **重复触发**：再次设置相同属性会重新开始移动
- **图标支持**：移动时保持 `icon`、`children` 等自定义样式，优先级为：`children` > `icon` > `pinColor`
- **移动起点**：从 Marker 的 `position` 属性指定的位置开始移动

#### 完整示例

```tsx
import { useState } from 'react';
import { MapView, Marker } from 'expo-gaode-map';

export default function SmoothMoveExample() {
  const [isMoving, setIsMoving] = useState(false);
  
  const movePath = [
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
    { latitude: 39.93, longitude: 116.43 },
  ];

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 14,
      }}
    >
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="移动的标记"
        smoothMovePath={isMoving ? movePath : undefined}
        smoothMoveDuration={isMoving ? 5 : undefined}
      />
    </MapView>
  );
}
```

### 示例

```tsx
<MapView>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="北京"
    snippet="中国首都"
    draggable={true}
    onPress={() => console.log('标记被点击')}
    onDragEnd={(e) => console.log('拖拽结束', e.nativeEvent)}
  />
</MapView>
```

### 自定义图标

```tsx
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./marker.png')).uri;

<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  icon={iconUri}
  iconWidth={50}
  iconHeight={50}
/>
```

### 自定义视图

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
>
  <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8 }}>
    <Text>自定义内容</Text>
  </View>
</Marker>
```

## Polyline (折线)

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `LatLng[]` 或 `number[][]` | - | 折线坐标点数组（必需），支持对象数组或二维数组 `[[lon, lat], ...]` |
| `width` | `number` | `5` | 线宽 |
| `color` | `string` | - | 线条颜色 |
| `texture` | `string` | - | 纹理图片 URL |

### 示例

```tsx
<MapView>
  <Polyline
    points={[
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.95, longitude: 116.45 },
      { latitude: 40.0, longitude: 116.5 },
    ]}
    width={5}
    color="#FFFF0000"
    onPress={() => console.log('折线被点击')}
  />
</MapView>
```

## Polygon (多边形)

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `LatLng[]` | - | 多边形顶点坐标数组（必需） |
| `fillColor` | `string` | - | 填充颜色 |
| `strokeColor` | `string` | - | 边框颜色 |
| `strokeWidth` | `number` | `1` | 边框宽度 |

### 示例

```tsx
<MapView>
  <Polygon
    points={[
      { latitude: 39.9, longitude: 116.3 },
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.8, longitude: 116.4 },
    ]}
    fillColor="#8800FF00"
    strokeColor="#FFFF0000"
    strokeWidth={2}
    onPress={() => console.log('多边形被点击')}
  />
</MapView>
```

## 颜色格式

覆盖物颜色使用 ARGB 格式：`#AARRGGBB`

- `AA`: 透明度 (00-FF)
- `RR`: 红色 (00-FF)
- `GG`: 绿色 (00-FF)
- `BB`: 蓝色 (00-FF)

示例：
- `#FFFF0000` - 不透明红色
- `#8800FF00` - 50% 透明绿色
- `#FF0000FF` - 不透明蓝色

## 完整示例

```tsx
import { MapView, Circle, Marker, Polyline, Polygon } from 'expo-gaode-map';

export default function OverlaysExample() {
  return (
    <MapView
      style={{ flex:1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      {/* 圆形 */}
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        fillColor="#8800FF00"
        strokeColor="#FFFF0000"
      />

      {/* 标记点 */}
      <Marker
        position={{ latitude: 39.95, longitude: 116.45 }}
        title="标记点"
      />

      {/* 折线 */}
      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.95, longitude: 116.45 },
        ]}
        width={5}
        color="#FF0000FF"
      />

      {/* 多边形 */}
      <Polygon
        points={[
          { latitude: 39.85, longitude: 116.35 },
          { latitude: 39.85, longitude: 116.45 },
          { latitude: 39.75, longitude: 116.40 },
        ]}
        fillColor="#880000FF"
      />
    </MapView>
  );
}
```

## Cluster (点聚合)

用于展示大量点数据，自动聚合临近的点。

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `ClusterPoint[]` | - | 聚合点数据数组（必需） |
| `radius` | `number` | `30` | 聚合半径 |
| `minClusterSize` | `number` | `1` | 最小聚合数量（数量 >= 此值时显示聚合样式） |
| `clusterStyle` | `ViewStyle` | - | 聚合点基础样式（backgroundColor, borderColor, borderWidth, width, height） |
| `clusterTextStyle` | `TextStyle` | - | 聚合文字样式（color, fontSize, fontWeight） |
| `clusterBuckets` | `Bucket[]` | - | 分级样式配置 |
| `onClusterPress` | `function` | - | 点击事件 |

### 分级样式 (clusterBuckets)

通过 `clusterBuckets` 属性，可以根据聚合点的数量显示不同的颜色。

```tsx
clusterBuckets={[
  { minPoints: 1, backgroundColor: '#00BFFF' }, // 1个: 蓝色
  { minPoints: 2, backgroundColor: '#32CD32' }, // 2-4个: 绿色
  { minPoints: 5, backgroundColor: '#FFA500' }, // 5-9个: 橙色
  { minPoints: 10, backgroundColor: '#FF4500' } // 10+个: 红色
]}
```

### 示例

```tsx
<Cluster
  points={data}
  radius={30}
  minClusterSize={1}
  clusterBuckets={[
    { minPoints: 1, backgroundColor: '#00BFFF' },
    { minPoints: 5, backgroundColor: '#FFA500' }
  ]}
  clusterStyle={{
    width: 40,
    height: 40,
    borderColor: 'white',
    borderWidth: 2,
  }}
  onClusterPress={(e) => console.log(e.nativeEvent)}
/>
```

## MultiPoint (海量点)

用于在地图上展示成千上万个点，性能优于普通 Marker。

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `points` | `MultiPointItem[]` | - | 点数据数组（必需） |
| `icon` | `string` | - | 图标资源 URI |
| `iconWidth` | `number` | - | 图标宽度 |
| `iconHeight` | `number` | - | 图标高度 |
| `onMultiPointPress` | `function` | - | 点击事件 |

### 示例

```tsx
import { Image } from 'react-native';
const iconUri = Image.resolveAssetSource(require('./point.png')).uri;

<MultiPoint
  points={points}
  icon={iconUri}
  iconWidth={30}
  iconHeight={30}
  onMultiPointPress={(e) => console.log('Clicked index:', e.nativeEvent.index)}
/>
```

## HeatMap (热力图)

用于展示数据的密度分布。

### Android 注意事项

如果你在 Android 上使用 HeatMap（热力图），需要在项目的 `android/gradle.properties` 中开启 Jetifier（否则可能出现 `java.lang.NoClassDefFoundError: android.support.v4.util.LongSparseArray` 导致热力图无法显示）：

```
android.enableJetifier=true
```

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `HeatMapPoint[]` 或 `number[][]` | - | 热力点数据（lat, lng, count），支持对象数组或二维数组 `[[lon, lat], ...]` |
| `radius` | `number` | `12` | 热力半径 |
| `opacity` | `number` | `0.6` | 透明度 (0-1) |
| `gradient` | `object` | - | 渐变色配置 |

### 示例

```tsx
<HeatMap
  data={points}
  radius={30}
  opacity={0.5}
  gradient={{
    colors: ['blue', 'green', 'red'],
    startPoints: [0.2, 0.5, 0.9]
  }}
/>
```

## 相关文档

- [MapView API](/api/mapview)
- [覆盖物示例](/examples/overlays)
