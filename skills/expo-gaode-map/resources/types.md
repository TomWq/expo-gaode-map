# 核心参考: 类型定义 (Types)

`expo-gaode-map` (Core) 提供了核心地图组件和基础类型定义。

## 1. 基础坐标与几何

### 坐标点
```typescript
/**
 * 经纬度坐标
 */
export interface LatLng {
    latitude: number;
    longitude: number;
}

/**
 * 屏幕坐标
 */
export interface Point {
    x: number;
    y: number;
}
```

### 区域范围
```typescript
/**
 * 经纬度范围
 */
export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}
```

## 2. 地图视图 (MapView)

### 相机位置
```typescript
/**
 * 相机位置配置
 */
export interface CameraPosition {
    target: LatLng;  // 中心点坐标
    zoom?: number;   // 缩放级别 (3-20)
    tilt?: number;   // 倾斜角度 (0-60)
    bearing?: number;// 旋转角度 (0-360)
}
```

### 地图类型枚举
```typescript
export enum MapType {
    Standard = 0,   // 标准地图
    Satellite = 1,  // 卫星地图
    Night = 2,      // 夜间地图
    Navi = 3,       // 导航地图
    Bus = 4         // 公交地图
}
```

### 事件回调数据
```typescript
/**
 * 点击地图事件
 */
export interface MapPressEvent {
    nativeEvent: LatLng;
}

/**
 * 相机移动事件
 */
export interface CameraEvent {
    nativeEvent: CameraPosition;
}

/**
 * POI 点击事件
 */
export interface PoiClickEvent {
    nativeEvent: {
        name: string;
        coordinate: LatLng;
        id: string;
    };
}
```

## 3. 覆盖物 (Overlays)

### 标记点 (Marker)
```typescript
export interface MarkerProps {
    coordinate: LatLng;     // 坐标 (必填)
    title?: string;         // 标题
    snippet?: string;       // 副标题
    icon?: ImageSourcePropType; // 自定义图标
    draggable?: boolean;    // 是否可拖拽
    flat?: boolean;         // 是否贴地
    zIndex?: number;        // 层级
    opacity?: number;       // 透明度
}
```

### 几何图形
```typescript
export interface PolylineProps {
    coordinates: LatLng[];  // 坐标数组
    width?: number;         // 线宽
    color?: string;         // 颜色
    zIndex?: number;
    geodesic?: boolean;     // 是否大地曲线
    dashed?: boolean;       // 是否虚线
}

export interface PolygonProps {
    coordinates: LatLng[];  // 坐标数组
    fillColor?: string;     // 填充颜色
    strokeWidth?: number;   // 边框宽度
    strokeColor?: string;   // 边框颜色
    zIndex?: number;
}
```

## 4. 定位 (Location)

### 定位结果
```typescript
export interface Location {
    latitude: number;
    longitude: number;
    accuracy: number;       // 精度 (米)
    altitude: number;       // 海拔
    speed: number;          // 速度
    heading: number;        // 方向
    timestamp: number;      // 时间戳
    address?: string;       // 详细地址 (需开启逆地理)
    country?: string;
    province?: string;
    city?: string;
    district?: string;
    street?: string;
    poiName?: string;
}
```

### 定位配置
```typescript
export interface LocationOption {
    locationMode?: LocationMode;
    gpsFirst?: boolean;
    httpTimeOut?: number;
    interval?: number;      // 连续定位间隔 (ms)
    needAddress?: boolean;  // 是否返回逆地理信息
    onceLocation?: boolean; // 是否单次定位
}

export enum LocationMode {
    Battery_Saving = 0,     // 低功耗
    Device_Sensors = 1,     // 仅设备 (GPS)
    Hight_Accuracy = 2      // 高精度
}
```
