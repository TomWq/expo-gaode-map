
# 导航功能

`expo-gaode-map-navigation` 是高德地图"导航一体化"模块，内置完整的地图渲染和导航能力。

## 安装

导航包是**独立的一体化解决方案**，不需要同时安装 `expo-gaode-map`：

```bash
npm install expo-gaode-map-navigation
# 或
yarn add expo-gaode-map-navigation
# 或
pnpm add expo-gaode-map-navigation
```

::: danger 二进制冲突警告
导航包与核心包（`expo-gaode-map`）存在二进制冲突，**不能同时安装**。导航包已内置完整的地图功能。
:::

## 特性

- 🗺️ **内置地图**：包含 MapView 和所有覆盖物组件
- 🧭 **路径规划**：驾车、步行、骑行、货车、摩托车等多种方式
- 🚗 **实时导航**：NaviView 组件提供完整的导航界面
- ⚙️ **策略丰富**：最快、最短、避拥堵、少收费等多种策略
- 🔄 **独立服务**：支持无地图的独立路径规划

## 配置

### 使用 Config Plugin（推荐）

在 `app.json` 中配置：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosApiKey": "your-ios-api-key",
          "androidApiKey": "your-android-api-key",
          "enableLocation": true
        }
      ]
    ]
  }
}
```

然后重新构建：

```bash
npx expo prebuild --clean
npx expo run:ios
# 或
npx expo run:android
```

### 初始化

在应用启动时初始化 SDK：

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

// 使用 Config Plugin 时，原生 Key 已自动配置
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
});

// 不使用 Config Plugin 时
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key', // 可选
});
```

## 基础用法

### 驾车路径规划

```typescript
import { calculateDriveRoute, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await calculateDriveRoute({
  type: 'drive',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST, // 速度优先
  waypoints: [                      // 途经点（可选）
    { latitude: 39.905, longitude: 116.405 },
  ],
  carNumber: '京A12345',            // 车牌号（可选）
});

// 查看结果
console.log(`找到 ${result.count} 条路线`);
result.routes.forEach((route, index) => {
  console.log(`路线 ${index + 1}:`);
  console.log(`  距离: ${(route.distance / 1000).toFixed(2)}公里`);
  console.log(`  时间: ${Math.floor(route.duration / 60)}分钟`);
  console.log(`  收费: ${route.tollCost}元`);
  console.log(`  红绿灯: ${route.trafficLightCount}个`);
});
```

**DriveStrategy 策略：**

```typescript
enum DriveStrategy {
  FASTEST = 0,                         // 速度优先（时间最短）
  FEE_FIRST = 1,                       // 费用优先（不走收费）
  SHORTEST = 2,                        // 距离优先
  NO_EXPRESSWAYS = 3,                  // 不走快速路
  AVOID_CONGESTION = 4,                // 躲避拥堵
  NO_HIGHWAY = 5,                      // 不走高速
  NO_HIGHWAY_AVOID_CONGESTION = 6,     // 不走高速且避免拥堵
  AVOID_COST_CONGESTION = 7,           // 躲避收费和拥堵
  NO_HIGHWAY_AVOID_COST_CONGESTION = 8,// 不走高速且躲避收费拥堵
  AVOID_CONGESTION_COST = 9,           // 躲避拥堵和收费
}
```

### 步行路径规划

```typescript
import { calculateWalkRoute } from 'expo-gaode-map-navigation';

const result = await calculateWalkRoute({
  type: 'walk',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true, // 返回多条路线
});

console.log(`步行距离: ${result.distance}米`);
console.log(`预计时间: ${Math.floor(result.duration / 60)}分钟`);
```

### 骑行路径规划

```typescript
import { calculateRideRoute, RideStrategy } from 'expo-gaode-map-navigation';

const result = await calculateRideRoute({
  type: 'ride',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: RideStrategy.FASTEST, // 速度优先
  multiple: true,
});
```

**RideStrategy 策略：**

```typescript
enum RideStrategy {
  DEFAULT = 0,   // 推荐路线
  FASTEST = 1,   // 速度优先
  SHORTEST = 2,  // 距离优先
}
```

### 货车路径规划

```typescript
import { calculateTruckRoute, TruckSize } from 'expo-gaode-map-navigation';

const result = await calculateTruckRoute({
  type: 'truck',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  size: TruckSize.MEDIUM,  // 货车尺寸
  height: 3.5,             // 高度（米）
  width: 2.5,              // 宽度（米）
  load: 5,                 // 载重（吨）
  weight: 10,              // 总重（吨）
  axis: 2,                 // 轴数
});
```

**TruckSize 尺寸：**

```typescript
enum TruckSize {
  MINI = 1,    // 微型货车
  LIGHT = 2,   // 轻型货车
  MEDIUM = 3,  // 中型货车
  HEAVY = 4,   // 重型货车
}
```

### 电动车路径规划

```typescript
import { calculateEBikeRoute } from 'expo-gaode-map-navigation';

const result = await calculateEBikeRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true,
});
```

### 摩托车路径规划

```typescript
import { calculateMotorcycleRoute } from 'expo-gaode-map-navigation';

const result = await calculateMotorcycleRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  motorcycleCC: 250,          // 排量（cc）
  carNumber: '京A12345',      // 车牌号（可选）
  strategy: DriveStrategy.FASTEST,
});
```

## 独立路径规划

独立路径规划**不会影响当前导航状态**，适用于路线预览、对比和切换场景。

### 基础用法

```typescript
import { independentDriveRoute } from 'expo-gaode-map-navigation';

// 1. 规划多条路线
const routes = await independentDriveRoute({
  from: {
    latitude: 39.9,
    longitude: 116.4,
    name: '起点名称',      // 可选
    poiId: 'B000A8VE1H',  // 可选
  },
  to: {
    latitude: 39.91,
    longitude: 116.41,
    name: '终点名称',
    poiId: 'B000A8VE2I',
  },
  waypoints: [
    { latitude: 39.905, longitude: 116.405, name: '途经点1' },
  ],
  strategy: DriveStrategy.FASTEST,
  carNumber: '京A12345',
  restriction: true, // 考虑限行
});

console.log(`找到 ${routes.count} 条路线`);
console.log(`Token: ${routes.token}`); // 用于后续操作
```

### 选择路线

```typescript
import { selectIndependentRoute } from 'expo-gaode-map-navigation';

// 方式1：使用路线索引
await selectIndependentRoute({
  token: routes.token,
  routeIndex: 1, // 从0开始
});

// 方式2：使用路线ID
await selectIndependentRoute({
  token: routes.token,
  routeId: routes.routeIds[1],
});
```

### 启动导航

```typescript
import { startNaviWithIndependentPath } from 'expo-gaode-map-navigation';

await startNaviWithIndependentPath({
  token: routes.token,
  naviType: 0,      // 0=GPS导航, 1=模拟导航
  routeIndex: 0,    // 可选，不传则使用当前主路线
});
```

### 清理路线

```typescript
import { clearIndependentRoute } from 'expo-gaode-map-navigation';

await clearIndependentRoute({
  token: routes.token,
});
```

### 完整示例：路线预览与切换

```typescript
import React, { useState } from 'react';
import { View, Button, FlatList, Text, TouchableOpacity } from 'react-native';
import {
  independentDriveRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
  clearIndependentRoute,
  DriveStrategy,
} from 'expo-gaode-map-navigation';

export default function RoutePreviewScreen() {
  const [routes, setRoutes] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const planRoutes = async () => {
    const result = await independentDriveRoute({
      from: { latitude: 39.9, longitude: 116.4, name: '起点' },
      to: { latitude: 39.91, longitude: 116.41, name: '终点' },
      strategy: DriveStrategy.FASTEST,
    });
    setRoutes(result);
  };

  const handleSelectRoute = async (index: number) => {
    if (!routes) return;
    
    await selectIndependentRoute({
      token: routes.token,
      routeIndex: index,
    });
    setSelectedIndex(index);
  };

  const startNavigation = async () => {
    if (!routes) return;
    
    await startNaviWithIndependentPath({
      token: routes.token,
      naviType: 0, // GPS导航
    });
  };

  const cleanup = async () => {
    if (!routes) return;
    
    await clearIndependentRoute({
      token: routes.token,
    });
    setRoutes(null);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="规划路线" onPress={planRoutes} />

      {routes && (
        <>
          <FlatList
            data={routes.routes}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => handleSelectRoute(index)}
                style={{
                  padding: 15,
                  marginTop: 10,
                  backgroundColor:
                    selectedIndex === index ? '#e8f5e9' : '#fff',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#ccc',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  路线 {index + 1}
                  {index === routes.mainPathIndex && ' (推荐)'}
                </Text>
                <Text style={{ marginTop: 5 }}>
                  距离: {(item.distance / 1000).toFixed(2)}公里
                </Text>
                <Text>时间: {Math.floor(item.duration / 60)}分钟</Text>
                <Text>收费: {item.tollCost}元</Text>
                <Text>红绿灯: {item.trafficLightCount}个</Text>
              </TouchableOpacity>
            )}
          />

          <View style={{ marginTop: 20 }}>
            <Button title="开始导航" onPress={startNavigation} />
            <Button title="清理路线" onPress={cleanup} color="red" />
          </View>
        </>
      )}
    </View>
  );
}
```

## NaviView 导航组件

`NaviView` 是高德官方提供的完整导航界面组件。

### 基础用法

```typescript
import React, { useRef } from 'react';
import { View, Button } from 'react-native';
import { NaviView, type NaviViewRef } from 'expo-gaode-map-navigation';

function NavigationScreen() {
  const naviViewRef = useRef<NaviViewRef>(null);

  const startNavigation = async () => {
    await naviViewRef.current?.startNavigation(
      { latitude: 39.9, longitude: 116.4 },   // 起点（null=当前位置）
      { latitude: 39.91, longitude: 116.41 }, // 终点
      1  // 0=GPS导航, 1=模拟导航
    );
  };

  const stopNavigation = async () => {
    await naviViewRef.current?.stopNavigation();
  };

  return (
    <View style={{ flex: 1 }}>
      <NaviView
        ref={naviViewRef}
        style={{ flex: 1 }}
        naviType={1}
        enableVoice={true}
        showCamera={true}
        onNaviStart={(e) => console.log('导航开始')}
        onNaviEnd={(e) => console.log('导航结束')}
        onArrive={(e) => console.log('到达目的地')}
        onNaviInfoUpdate={(e) => {
          const { pathRetainDistance, pathRetainTime } = e.nativeEvent;
          console.log(`剩余: ${pathRetainDistance}米, ${pathRetainTime}秒`);
        }}
      />
      
      <View style={{ position: 'absolute', bottom: 20, right: 20 }}>
        <Button title="开始" onPress={startNavigation} />
        <Button title="停止" onPress={stopNavigation} color="red" />
      </View>
    </View>
  );
}
```

### NaviView 属性

#### 核心属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `naviType` | `number` | `0` | 导航类型：`0`=GPS导航, `1`=模拟导航 |
| `enableVoice` | `boolean` | `true` | 是否启用语音播报 |
| `showCamera` | `boolean` | `true` | 是否显示摄像头提示 |
| `autoLockCar` | `boolean` | `true` | 是否自动锁车 |
| `autoChangeZoom` | `boolean` | `true` | 是否自动缩放地图 |
| `trafficLayerEnabled` | `boolean` | `true` | 是否显示交通路况 |
| `realCrossDisplay` | `boolean` | `true` | 是否显示路口放大图 |
| `naviMode` | `number` | `0` | 视角模式：`0`=车头朝上, `1`=正北朝上 |
| `showMode` | `number` | `1` | 显示模式：`1`=锁车态, `2`=全览态, `3`=普通态 |
| `isNightMode` | `boolean` | `false` | 是否开启夜间模式 |

### NaviView 事件

#### onNaviStart - 导航开始

```typescript
onNaviStart={(e) => {
  const { type } = e.nativeEvent;
  console.log(`导航开始，类型: ${type === 1 ? '模拟' : 'GPS'}`);
}}
```

#### onNaviEnd - 导航结束

```typescript
onNaviEnd={(e) => {
  const { reason } = e.nativeEvent;
  console.log(`导航结束: ${reason}`);
}}
```

#### onArrive - 到达目的地

```typescript
onArrive={(e) => {
  console.log('已到达目的地');
}}
```

#### onNaviInfoUpdate - 实时导航信息

```typescript
onNaviInfoUpdate={(e) => {
  const {
    pathRetainDistance,  // 剩余距离（米）
    pathRetainTime,      // 剩余时间（秒）
    currentRoadName,     // 当前道路名称
    nextRoadName,        // 下一道路名称
    currentSpeed,        // 当前速度（米/秒）
    iconType,            // 转向图标类型
    iconDirection,       // 转向方向
  } = e.nativeEvent;
}}
```

#### onCalculateRouteSuccess - 路径规划成功

```typescript
onCalculateRouteSuccess={(e) => {
  const { routeIds } = e.nativeEvent;
  console.log('路径规划成功');
}}
```

#### onCalculateRouteFailure - 路径规划失败

```typescript
onCalculateRouteFailure={(e) => {
  const { error, errorCode } = e.nativeEvent;
  console.error(`规划失败: ${error}`);
}}
```

### 完整示例

```typescript
import React, { useRef, useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { NaviView, type NaviViewRef } from 'expo-gaode-map-navigation';

export default function FullNavigationScreen() {
  const naviViewRef = useRef<NaviViewRef>(null);
  const [naviInfo, setNaviInfo] = useState({
    distance: 0,
    time: 0,
    road: '',
  });

  const startNavigation = async () => {
    await naviViewRef.current?.startNavigation(
      null, // 使用当前位置
      { latitude: 39.91, longitude: 116.41 },
      0 // GPS导航
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <NaviView
        ref={naviViewRef}
        style={{ flex: 1 }}
        naviType={0}
        enableVoice={true}
        showCamera={true}
        trafficLayerEnabled={true}
        onNaviStart={() => console.log('导航开始')}
        onNaviEnd={(e) => console.log('导航结束:', e.nativeEvent.reason)}
        onArrive={() => console.log('到达目的地')}
        onNaviInfoUpdate={(e) => {
          const { pathRetainDistance, pathRetainTime, currentRoadName } =
            e.nativeEvent;
          setNaviInfo({
            distance: pathRetainDistance,
            time: pathRetainTime,
            road: currentRoadName,
          });
        }}
        onCalculateRouteFailure={(e) => {
          console.error('路径规划失败:', e.nativeEvent.error);
        }}
      />

      <View style={styles.infoPanel}>
        <Text style={styles.infoText}>
          剩余: {(naviInfo.distance / 1000).toFixed(2)}公里
        </Text>
        <Text style={styles.infoText}>
          时间: {Math.floor(naviInfo.time / 60)}分钟
        </Text>
        <Text style={styles.infoText}>当前道路: {naviInfo.road}</Text>
      </View>

      <View style={styles.buttonPanel}>
        <Button title="开始导航" onPress={startNavigation} />
        <Button
          title="停止导航"
          onPress={() => naviViewRef.current?.stopNavigation()}
          color="red"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 16,
    marginVertical: 2,
  },
  buttonPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
```

## 地图功能

导航包内置了完整的地图功能，可以直接使用 MapView 和覆盖物组件：

```typescript
import { MapView, Marker, Polyline } from 'expo-gaode-map-navigation';

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 12,
      }}
    >
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="起点"
      />
      
      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ]}
        strokeColor="#FF0000"
        strokeWidth={5}
      />
    </MapView>
  );
}
```

更多地图功能请参考 [地图 API 文档](/api/mapview)。

## 常见问题

### 1. 与 expo-gaode-map 冲突

**问题**：同时安装导致编译错误。

**解决**：
```bash
npm uninstall expo-gaode-map
npm install expo-gaode-map-navigation
```

### 2. "Another route calculation is in progress"

**问题**：连续规划路径时报错。

**解决**：页面卸载时清理资源。

```typescript
import { destroyAllCalculators } from 'expo-gaode-map-navigation';

useEffect(() => {
  return () => {
    destroyAllCalculators();
  };
}, []);
```

### 3. NaviView 启动导航无反应

**问题**：startNavigation 调用后没有效果。

**解决**：
- 确保视图已渲染（使用 setTimeout 延迟）
- 检查坐标是否正确
- 查看 onCalculateRouteFailure 错误信息

```typescript
setShowNavi(true);
setTimeout(async () => {
  await naviViewRef.current?.startNavigation(start, end, 1);
}, 500);
```

### 4. 如何使用当前位置作为起点

```typescript
// 方式1：传 null
await naviViewRef.current?.startNavigation(
  null,  // 使用当前位置
  destination,
  0
);

// 方式2：先获取当前位置
const location = await ExpoGaodeMapModule.getCurrentLocation();
await naviViewRef.current?.startNavigation(
  { latitude: location.latitude, longitude: location.longitude },
  destination,
  0
);
```

### 5. 路径规划失败怎么办

检查以下几点：
- API Key 是否正确配置
- 起终点坐标是否有效
- 网络连接是否正常
- 查看错误信息：

```typescript
onCalculateRouteFailure={(e) => {
  const { error, errorCode } = e.nativeEvent;
  console.error(`错误代码: ${errorCode}, 错误信息: ${error}`);
}}
```

### 6. 如何自定义导航界面

NaviView 提供了丰富的属性来控制界面元素：

```typescript
<NaviView
  showCamera={false}          // 隐藏摄像头提示
  showMode={3}                // 普通态（可自由操作地图）
  trafficLayerEnabled={false} // 隐藏路况
/>
```

## 相关文档

- [导航 API](/api/navigation) - 完整 API 参考
- [地图 API](/api/mapview) - MapView 组件文档
- [覆盖物 API](/api/overlays) - 覆盖物组件
- [Web API](/api/web-api) - Web 服务 API
- [快速开始](/guide/getting-started) - 安装和配置