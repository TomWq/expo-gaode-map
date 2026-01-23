---
title: Search Types Reference
impact: HIGH
tags: types, typescript, interfaces, search, poi
---

# 搜索参考: 类型定义 (Types)

`expo-gaode-map-search` 提供了搜索相关的类型定义。

## 1. POI 搜索

### 搜索参数
```typescript
/**
 * POI 关键字搜索参数
 */
export interface PoiSearchOptions {
    keyword: string;        // 关键词
    city?: string;          // 城市 (名称/cityCode/adCode)
    types?: string;         // POI类型编码
    pageSize?: number;      // 每页数量 (1-50)
    pageNum?: number;       // 当前页码 (1-100)
    requireSubPois?: boolean;// 是否返回子POI
}

/**
 * 周边搜索参数
 */
export interface NearbySearchOptions {
    center: LatLng;         // 中心点
    keyword?: string;       // 关键词
    radius?: number;        // 半径 (默认 1000)
    types?: string;         // 类型
}

/**
 * 多边形搜索参数
 */
export interface PolygonSearchOptions {
    polygon: LatLng[];      // 多边形顶点
    keyword?: string;
    types?: string;
}
```

### 搜索结果
```typescript
export interface PoiSearchResult {
    pageIndex: number;
    totalPages: number;
    count: number;          // 本页数量
    total: number;          // 总结果数
    pois: Poi[];            // POI 列表
}

export interface Poi {
    id: string;             // POI ID
    name: string;           // 名称
    typeCode: string;       // 类型编码
    typeDes: string;        // 类型描述
    address: string;        // 地址
    location: LatLng;       // 坐标
    tel: string;            // 电话
    distance?: number;      // 距离 (周边/沿途搜索有效)
    provinceCode: string;
    cityCode: string;
    adCode: string;
    businessArea: string;   // 商圈
    parkingType: string;    // 停车场类型
}
```

## 2. 辅助服务

### 输入提示 (InputTips)
```typescript
export interface InputTipsOptions {
    keyword: string;
    city?: string;
    location?: LatLng;      // 指定坐标，提示将优先返回附近的词
}

export interface InputTip {
    name: string;           // 名称
    district: string;       // 所属区域
    adCode: string;         // 区域代码
    address: string;        // 地址
    location?: LatLng;      // 坐标 (可能为空)
    poiId?: string;         // POI ID (可能为空)
}
```

### 逆地理编码 (ReGeocode)
```typescript
export interface ReGeocodeOptions {
    location: LatLng;       // 坐标
    radius?: number;        // 搜索半径
    requireExtension?: boolean; // 是否返回详细信息
}

export interface ReGeocodeResult {
    formattedAddress: string; // 格式化地址
    addressComponent: {
        province: string;
        city: string;
        district: string;
        township: string;
        streetNumber: {
            street: string;
            number: string;
            location: LatLng;
        };
    };
    roads?: Road[];         // 道路列表 (扩展)
    roadCrosses?: Cross[];  // 路口列表 (扩展)
    aois?: Aoi[];           // 兴趣区域 (扩展)
}

export interface Aoi {
    id: string;
    name: string;
    adCode: string;
    location: LatLng;
    area: number;
}
```
