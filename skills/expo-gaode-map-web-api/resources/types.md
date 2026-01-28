# 核心参考: 类型定义 (Types)

`expo-gaode-map-web-api` 提供了全面的 TypeScript 类型定义。本文档列出了常用的核心类型，帮助开发者编写类型安全的代码。

## 1. 基础类型

### 坐标与位置
```typescript
/**
 * 坐标类型
 * 支持字符串格式 "lng,lat" 或对象格式
 */
export type Coordinate = string | {
    longitude: number;
    latitude: number;
};
```

### 通用请求参数
```typescript
export interface BaseRouteParams {
    sig?: string;           // 数字签名
    output?: 'JSON' | 'XML';// 返回格式
    callback?: string;      // 回调函数
    version?: 'v3' | 'v5';  // API 版本
}
```

## 2. 路径规划 (Route)

### 响应类型 (Response)
| 服务 | 响应接口 | 说明 |
| :--- | :--- | :--- |
| 驾车 | `DrivingRouteResponse` | 包含 `route.paths` (驾车方案) |
| 步行 | `WalkingRouteResponse` | 包含 `route.paths` (步行方案) |
| 骑行 | `BicyclingRouteResponse` | 包含 `route.paths` (骑行方案) |
| 电动车 | `ElectricBikeRouteResponse` | 包含 `route.paths` (电动车方案) |
| 公交 | `TransitRouteResponse` | 包含 `route.transits` (公交换乘方案) |

### 核心数据结构
```typescript
/**
 * 路径方案 (驾车/步行/骑行)
 */
export interface Path {
    distance: string;       // 总距离 (米)
    duration?: string;      // 已废弃，请使用 cost.duration
    steps: Step[];          // 路径步骤
    cost?: PathCost;        // 成本信息 (时间、费用)
    restriction?: string;   // 限行信息 (仅驾车)
}

/**
 * 路径成本
 */
export interface PathCost {
    duration?: string;      // 耗时 (秒)
    tolls?: string;         // 通行费 (仅驾车)
    toll_distance?: string; // 收费路段距离
    traffic_lights?: string;// 红绿灯数
}

/**
 * 路径步骤
 */
export interface Step {
    instruction: string;    // 导航指令
    road_name?: string;     // 道路名称
    step_distance: string;  // 此段距离
    polyline?: string;      // 此段坐标串 "lng,lat;lng,lat..."
    action?: string;        // 导航动作
    assistant_action?: string; // 辅助动作
    tmcs?: Tmc[];           // 路况信息 (仅驾车)
}
```

### 策略枚举 (Enums)
```typescript
// 驾车策略
export enum DrivingStrategy {
    SPEED_FIRST = 0,        // 速度优先
    COST_FIRST = 1,         // 费用优先
    AVOID_JAM = 33,         // 躲避拥堵
    // ... 更多策略
}

// 公交策略
export enum TransitStrategy {
    RECOMMENDED = 0,        // 推荐模式
    CHEAPEST = 1,           // 最经济
    LEAST_TRANSFER = 2,     // 最少换乘
    // ... 更多策略
}
```

## 3. 地理编码 (Geocode)

### 响应类型
| 服务 | 响应接口 | 说明 |
| :--- | :--- | :--- |
| 地理编码 | `GeocodeResponse` | 地址 -> 坐标 |
| 逆地理编码 | `ReGeocodeResponse` | 坐标 -> 地址 |

### 核心数据结构
```typescript
/**
 * 地理编码结果
 */
export interface Geocode {
    formatted_address: string; // 格式化地址
    location: string;          // 坐标 "lng,lat"
    adcode: string;            // 行政区划代码
    level: string;             // 匹配级别
}

/**
 * 逆地理编码结果
 */
export interface ReGeocode {
    formatted_address: string; // 格式化地址
    addressComponent: AddressComponent; // 地址组成要素
    pois?: Poi[];              // 周边 POI
    roads?: Road[];            // 周边道路
}

export interface AddressComponent {
    country: string;
    province: string;
    city: string | [];
    district: string;
    township: string;
    streetNumber?: StreetNumber;
}
```

## 4. POI 搜索 & 输入提示

### 响应类型
| 服务 | 响应接口 |
| :--- | :--- |
| POI 搜索 | `PoiSearchResponse` |
| 输入提示 | `InputTipsResponse` |

### 核心数据结构
```typescript
/**
 * POI 信息
 */
export interface Poi {
    id: string;             // POI ID
    name: string;           // 名称
    type: string;           // 类型编码
    location: string;       // 坐标
    address: string;        // 地址
    tel: string | [];       // 电话
    pcode: string;          // 省份代码
    citycode: string;       // 城市代码
    adcode: string;         // 区域代码
}

/**
 * 输入提示
 */
export interface InputTip {
    id: string;             // POI ID
    name: string;           // 名称
    district: string;       // 所属区域
    adcode: string;         // 区域代码
    location: string;       // 坐标
    address: string;        // 地址
}
```
