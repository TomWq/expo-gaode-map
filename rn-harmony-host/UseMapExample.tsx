import React from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { MapUI, MapView, useMap } from 'expo-gaode-map';

/**
 * 演示如何使用 useMap Hook 在子组件中直接控制地图
 */

// 1. 创建一个子组件，在其中使用 useMap
function MapControlPanel() {
  // ✅ 直接获取地图实例，无需通过 props 传递 ref
  const map = useMap();

  const handleZoomIn = async () => {
    try {
      const camera = await map.getCameraPosition();
      map.setZoom((camera.zoom ?? 0) + 1, true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleZoomOut = async () => {
    try {
      const camera = await map.getCameraPosition();
      map.setZoom((camera.zoom ?? 0) - 1, true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveToBeijing = () => {
    map.moveCamera({
      target: { latitude: 39.9042, longitude: 116.4074 },
      zoom: 15,
      tilt: 45,
      bearing: 0
    }, 1000);
  };

  const handleGetInfo = async () => {
    try {
      const camera = await map.getCameraPosition();
      Alert.alert(
        '当前相机状态',
        `缩放: ${(camera.zoom ?? 0).toFixed(2)}\n倾斜: ${(camera.tilt ?? 0).toFixed(2)}°\n旋转: ${(camera.bearing ?? 0).toFixed(2)}°`
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.panel} pointerEvents="box-none">
      <Text style={styles.title}>子组件控制面板</Text>
      <Text style={styles.subtitle}>(使用 useMap Hook)</Text>
      
      <View style={styles.row}>
        <Button onPress={handleZoomIn} title="放大 (+)" />
        <Button onPress={handleZoomOut} title="缩小 (-)" />
      </View>
      
      <View style={styles.row}>
        <Button onPress={handleMoveToBeijing} title="飞到北京" />
        <Button onPress={handleGetInfo} title="获取状态" />
      </View>
    </View>
  );
}

// 辅助按钮组件
const Button = ({ onPress, title }: { onPress: () => void; title: string }) => (
  <Pressable style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>
);

// 2. 主页面
export default function UseMapExample() {
  return (
    <View style={styles.container}>
      {/* 方式一：将组件放在 MapView 内部（作为子组件） */}
      {/* ⚠️ 注意：某些原生 MapView 实现可能会遮挡绝对定位的子视图，
          或者将子视图视为覆盖物（Marker）处理。
          如果看不到，请尝试方式二。 */}
      <MapView style={styles.map}>
          {/* 
            使用 MapUI 包裹普通 React 组件。
            MapUI 会将这些组件渲染在 NativeView 之外（但在 Context 内），
            从而避免作为原生子视图导致的触摸事件冲突。
          */}
          <MapUI>
            <MapControlPanel />
          </MapUI>
      </MapView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          MapControlPanel 组件位于 MapView 内部，
          通过 useMap() Hook 直接获取地图控制能力。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    zIndex: 999,
    elevation: 5,
  },
  panel: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 16,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007aff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
