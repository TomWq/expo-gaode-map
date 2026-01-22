# 几何计算示例

本示例展示如何使用 `expo-gaode-map` 提供的几何计算功能,包括距离计算、面积计算和点位关系判断。

## 基础用法

```typescript
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import {ExpoGaodeMapModule} from 'expo-gaode-map';

export default function GeometryUtilsExample() {
  const [results, setResults] = useState<string[]>([]);

  const runCalculations = () => {
    const newResults: string[] = [];

    try {
      // 1. 计算两点之间的距离
      const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(
        { latitude: 39.90923, longitude: 116.397428 }, // 天安门
        { latitude: 39.916527, longitude: 116.397545 }  // 故宫
      );
      newResults.push(`天安门到故宫的距离: ${distance.toFixed(2)} 米`);

      // 2. 计算多边形面积
      const polygon = [
        { latitude: 39.923, longitude: 116.391 },
        { latitude: 39.923, longitude: 116.424 },
        { latitude: 39.886, longitude: 116.424 },
        { latitude: 39.886, longitude: 116.391 },
      ];
      const polygonArea = ExpoGaodeMapModule.calculatePolygonArea(polygon);
      newResults.push(`多边形面积: ${(polygonArea / 1000000).toFixed(2)} 平方公里`);

      // 3. 计算矩形面积
      const rectArea = ExpoGaodeMapModule.calculateRectangleArea(
        { latitude: 39.886, longitude: 116.391 },
        { latitude: 39.923, longitude: 116.424 }
      );
      newResults.push(`矩形面积: ${(rectArea / 1000000).toFixed(2)} 平方公里`);

      // 4. 判断点是否在多边形内
      const testPoint = { latitude: 39.9, longitude: 116.4 };
      const isInPolygon = ExpoGaodeMapModule.isPointInPolygon(testPoint, polygon);
      newResults.push(`点 (39.9, 116.4) 是否在多边形内: ${isInPolygon ? '是' : '否'}`);

      // 5. 判断点是否在圆内
      const center = { latitude: 39.90923, longitude: 116.397428 };
      const isInCircle = ExpoGaodeMapModule.isPointInCircle(
        testPoint,
        center,
        10000 // 10公里
      );
      newResults.push(`点是否在10公里圆内: ${isInCircle ? '是' : '否'}`);

      setResults(newResults);
    } catch (error) {
      console.error('计算失败:', error);
      newResults.push(`错误: ${error.message}`);
      setResults(newResults);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="运行几何计算" onPress={runCalculations} />
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            • {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultText: {
    fontSize: 14,
    marginVertical: 5,
    lineHeight: 20,
  },
});
```

## 实际应用场景

### 1. 附近商家距离显示

```typescript
function calculateNearbyShops(userLocation: LatLng, shops: Shop[]) {
  const shopsWithDistance = shops.map((shop) => {
    const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(
      userLocation,
      shop.location
    );
    return {
      ...shop,
      distance,
      distanceText: distance < 1000 
        ? `${Math.round(distance)}米` 
        : `${(distance / 1000).toFixed(1)}公里`
    };
  });

  // 按距离排序
  return shopsWithDistance.sort((a, b) => a.distance - b.distance);
}
```

### 2. 地理围栏(进入/离开区域检测)

```typescript
function useGeofencing(location: LatLng, area: LatLng[]) {
  const [isInside, setIsInside] = useState(false);

  useEffect(() => {
    const inside = ExpoGaodeMapModule.isPointInPolygon(
      location,
      area
    );
    
    if (inside !== isInside) {
      setIsInside(inside);
      // 触发进入或离开事件
      if (inside) {
        console.log('用户进入了区域');
      } else {
        console.log('用户离开了区域');
      }
    }
  }, [location]);

  return isInside;
}
```

### 3. 土地面积测量工具

```typescript
function LandAreaCalculator() {
  const [points, setPoints] = useState<LatLng[]>([]);
  const [area, setArea] = useState<number>(0);

  const addPoint = (point: LatLng) => {
    setPoints([...points, point]);
  };

  const calculateArea = () => {
    if (points.length < 3) {
      alert('至少需要3个点才能计算面积');
      return;
    }

    const calculatedArea = ExpoGaodeMapModule.calculatePolygonArea(points);
    setArea(calculatedArea);
  };

  const clearPoints = () => {
    setPoints([]);
    setArea(0);
  };

  return (
    <View>
      <Text>已标记 {points.length} 个点</Text>
      {area > 0 && (
        <Text>
          面积: {(area / 1000000).toFixed(2)} 平方公里
          ({(area / 10000).toFixed(2)} 公顷)
        </Text>
      )}
      <Button title="计算面积" onPress={calculateArea} />
      <Button title="清除" onPress={clearPoints} />
    </View>
  );
}
```

### 4. 配送范围判断

```typescript
function isInDeliveryRange(
  userLocation: LatLng,
  shopLocation: LatLng,
  maxDistance: number
): boolean {
  const isInRange = ExpoGaodeMapModule.isPointInCircle(
    userLocation,
    shopLocation,
    maxDistance
  );
  
  if (!isInRange) {
    const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(
      userLocation,
      shopLocation
    );
    console.log(`超出配送范围 ${(distance / 1000).toFixed(1)}km，最大配送距离 ${(maxDistance / 1000).toFixed(1)}km`);
  }
  
  return isInRange;
}
```

## 性能建议

1. **同步调用**: 几何计算现在是同步的,由 C++ 实现,您可以直接在循环或渲染逻辑中使用,无需担心异步带来的复杂性。
2. **结果缓存**: 对于固定区域的判断结果可以缓存,避免重复计算。
3. **精度控制**: 根据实际需求选择合适的精度,避免过度计算。

```typescript
// 批量距离计算示例
function batchCalculateDistances(
  origin: LatLng,
  destinations: LatLng[]
) {
  return destinations.map(dest => 
    ExpoGaodeMapModule.distanceBetweenCoordinates(origin, dest)
  );
}

// 结果缓存示例
const areaCache = new Map<string, boolean>();

function isInAreaCached(
  point: LatLng,
  polygon: LatLng[]
): boolean {
  const key = `${point.latitude},${point.longitude}`;
  
  if (areaCache.has(key)) {
    return areaCache.get(key)!;
  }
  
  const result = ExpoGaodeMapModule.isPointInPolygon(point, polygon);
  areaCache.set(key, result);
  return result;
}
```

## 相关文档

- [几何计算 API 文档](/api/geometry)
- [定位 API](/api/location)
- [坐标类型定义](/api/types)
