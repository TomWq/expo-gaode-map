# 覆盖物 API

覆盖物组件用于在地图上显示各种图形元素。

## Circle (圆形)

### 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `center` | `LatLng` | - | 圆心坐标（必需） |
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
| `position` | `LatLng` | - | 标记点坐标（必需） |
| `title` | `string` | - | 标题 |
| `snippet` | `string` | - | 描述信息 |
| `draggable` | `boolean` | `false` | 是否可拖拽 |
| `icon` | `string` | - | 自定义图标 |
| `iconWidth` | `number` | `40` | 图标宽度 |
| `iconHeight` | `number` | `40` | 图标高度 |

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
| `points` | `LatLng[]` | - | 折线坐标点数组（必需） |
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
      style={{ flex: 1 }}
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

## 相关文档

- [MapView API](/api/mapview)
- [覆盖物示例](/examples/overlays)