# 多路线选择功能指南

## 概述

多路线选择功能允许用户在一次路径规划中获得多条不同策略的路线，并可以选择最适合的路线进行导航。这对于需要根据不同需求（如时间最短、距离最短、避免收费等）选择路线的场景非常有用。

## 功能特点

### 支持的路线策略

1. **最快路线** (`DriveStrategy.FASTEST`)
   - 优先考虑时间最短
   - 适合时间紧急的场景

2. **少收费路线** (`DriveStrategy.FEE_FIRST`)
   - 优先考虑减少过路费
   - 适合对成本敏感的用户

3. **最短路线** (`DriveStrategy.SHORTEST`)
   - 优先考虑距离最短
   - 适合节省燃油的场景

4. **少高速路线** (`DriveStrategy.NO_HIGHWAY`)
   - 避免高速公路
   - 适合不喜欢高速驾驶的用户

### 主要功能

- **并行计算**: 同时计算多条不同策略的路线
- **可视化对比**: 在地图上用不同颜色显示各条路线
- **详细信息**: 显示每条路线的距离、预计时间、费用等
- **一键切换**: 点击即可切换查看不同路线
- **智能推荐**: 根据策略自动标记推荐路线

## 使用方法

### 1. 基础用法

```typescript
import * as ExpoGaodeMapNavigation from 'expo-gaode-map-navigation';
import { RouteType, DriveStrategy } from 'expo-gaode-map-navigation';

// 计算多条路线
const calculateMultipleRoutes = async () => {
  const strategies = [
    { name: '最快', strategy: DriveStrategy.FASTEST },
    { name: '少收费', strategy: DriveStrategy.FEE_FIRST },
    { name: '最短', strategy: DriveStrategy.SHORTEST },
    { name: '少高速', strategy: DriveStrategy.NO_HIGHWAY }
  ];
  
  const routePromises = strategies.map(async (s) => {
    const options: DriveRouteOptions = {
      from: { latitude: 39.8943, longitude: 116.3220 },
      to: { latitude: 40.0799, longitude: 116.6031 },
      type: RouteType.DRIVE,
      strategy: s.strategy,
    };
    
    return await ExpoGaodeMapNavigation.calculateDriveRoute(options);
  });
  
  const results = await Promise.all(routePromises);
  // 处理结果...
};
```

### 2. 示例代码

参考 `example/MultiRouteExample.tsx` 文件，该文件展示了完整的多路线选择实现：

- 路线计算和状态管理
- UI 界面设计
- 路线可视化
- 交互逻辑

### 3. UI 组件设计建议

#### 路线选择器
```typescript
<View style={styles.routeSelector}>
  <Text style={styles.selectorTitle}>选择路线 ({allRoutes.length}条):</Text>
  <ScrollView horizontal>
    {allRoutes.map((route, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.routeCard,
          selectedRouteIndex === index && styles.selectedRouteCard
        ]}
        onPress={() => selectRoute(index)}
      >
        <Text style={styles.routeTitle}>{route.strategyName}</Text>
        <Text style={styles.routeInfo}>{route.distance}米 · {duration}分钟</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
```

#### 路线可视化
```typescript
{allRoutes.map((route, index) => (
  <Polyline
    key={index}
    points={route.polyline}
    strokeWidth={selectedRouteIndex === index ? 6 : 4}
    strokeColor={route.color}
    opacity={selectedRouteIndex === index ? 1 : 0.6}
  />
))}
```

## 最佳实践

### 1. 性能优化

- 使用 `Promise.all` 并行计算多条路线
- 对于长距离路线，考虑限制策略数量
- 缓存计算结果，避免重复计算

### 2. 用户体验

- 显示计算进度，避免用户等待焦虑
- 提供清晰的路线对比信息
- 使用颜色区分不同路线类型
- 默认选择最优策略（如最快路线）

### 3. 错误处理

```typescript
try {
  const results = await Promise.all(routePromises);
  const validRoutes = results.filter(result => result !== null);
  
  if (validRoutes.length === 0) {
    Alert.alert('提示', '未能计算出任何路线，请检查起点和终点');
    return;
  }
} catch (error) {
  console.error('路线计算失败:', error);
  Alert.alert('错误', '路线计算失败，请重试');
}
```

## 注意事项

1. **API 限制**: 高德地图 API 可能对并发请求有限制，建议控制同时计算的路线数量

2. **网络状况**: 多条路线计算需要更多的网络请求，注意网络延迟影响

3. **设备性能**: 在低端设备上，过多的路线计算可能影响性能

4. **费用考量**: 每条路线计算都会消耗 API 配额，请合理使用

5. **路线差异**: 在某些情况下，不同策略可能返回相同的路线

## 相关文档

- [路径规划 API](./docs/api/navigation.md)
- [DriveStrategy 枚举](./docs/api/types.md#drivestrategy)
- [基础导航示例](./examples/basic-navigation.md)
- [独立路径规划](./examples/independent-route.md)

## 更新日志

- **v1.0.0** - 初始版本，支持基础的多路线计算和选择功能
- **v1.1.0** - 添加路线对比信息和可视化优化
- **v1.2.0** - 支持更多路线策略和自定义选项