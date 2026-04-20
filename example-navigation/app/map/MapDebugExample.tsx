import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  MapUI,
  MapView,
  Marker,
  type CameraPosition,
  type LatLng,
  type MapPoi,
} from 'expo-gaode-map-navigation';

import { BEIJING_CENTER } from './playgroundUtils';

/**
 * 地图调试示例。
 * 这里保留旧版综合页里最有价值的调试能力：
 * 相机事件计数、原生节流切换、POI 点击验证。
 */
export default function MapDebugExample() {
  const [nativeCameraThrottleMs, setNativeCameraThrottleMs] = React.useState(32);
  const [cameraMoveCount, setCameraMoveCount] = React.useState(0);
  const [cameraIdleCount, setCameraIdleCount] = React.useState(0);
  const [cameraInfo, setCameraInfo] = React.useState('拖动地图后，这里会显示相机状态。');
  const [lastPressedPoi, setLastPressedPoi] = React.useState<MapPoi | null>(null);

  const initialCamera = React.useMemo<CameraPosition>(
    () => ({
      target: BEIJING_CENTER,
      zoom: 15,
    }),
    []
  );

  const debugMarkerPosition = React.useMemo<LatLng>(
    () => ({
      latitude: BEIJING_CENTER.latitude,
      longitude: BEIJING_CENTER.longitude,
    }),
    []
  );

  const cycleNativeCameraThrottle = React.useCallback(() => {
    setNativeCameraThrottleMs((previous) => {
      if (previous === 0) return 32;
      if (previous === 32) return 120;
      return 0;
    });
  }, []);

  const resetCameraEventStats = React.useCallback(() => {
    setCameraMoveCount(0);
    setCameraIdleCount(0);
    setCameraInfo('计数已清空，继续拖动地图查看事件变化。');
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={initialCamera}
        cameraEventThrottleMs={nativeCameraThrottleMs}
        labelsEnabled
        buildingsEnabled
        onCameraMove={({ nativeEvent }) => {
          const zoom = nativeEvent.cameraPosition.zoom ?? 0;
          const bearing = nativeEvent.cameraPosition.bearing ?? 0;
          const target = nativeEvent.cameraPosition.target;

          setCameraMoveCount((previous) => previous + 1);
          setCameraInfo(
            `移动中 · 中心 ${target?.latitude?.toFixed(4) ?? '--'}, ${
              target?.longitude?.toFixed(4) ?? '--'
            } · 缩放 ${zoom.toFixed(2)} · 旋转 ${bearing.toFixed(2)}°`
          );
        }}
        onCameraIdle={({ nativeEvent }) => {
          const zoom = nativeEvent.cameraPosition.zoom ?? 0;
          const target = nativeEvent.cameraPosition.target;

          setCameraIdleCount((previous) => previous + 1);
          setCameraInfo(
            `已停止 · 中心 ${target?.latitude?.toFixed(4) ?? '--'}, ${
              target?.longitude?.toFixed(4) ?? '--'
            } · 缩放 ${zoom.toFixed(2)}`
          );
        }}
        onPressPoi={({ nativeEvent }) => {
          setLastPressedPoi(nativeEvent);
          Alert.alert(
            'POI 点击已触发',
            `${nativeEvent.name || '未命名 POI'}\n${nativeEvent.position.latitude.toFixed(
              6
            )}, ${nativeEvent.position.longitude.toFixed(6)}`
          );
        }}
      >
        <Marker
          position={debugMarkerPosition}
          title="调试中心点"
          snippet="拖动地图并点击附近 POI 验证事件"
          pinColor="purple"
          cacheKey="map_debug_center_marker"
        />

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>地图调试面板</Text>
              <Text style={styles.cardText}>{cameraInfo}</Text>
              <Text style={styles.cardMeta}>
                事件统计 · move {cameraMoveCount} / idle {cameraIdleCount}
              </Text>
              <Text style={styles.cardMeta}>
                最近 POI：{lastPressedPoi ? lastPressedPoi.name || '未命名 POI' : '暂无'}
              </Text>
            </View>

            <View style={styles.toolbar}>
              <Pressable
                style={styles.primaryButton}
                onPress={cycleNativeCameraThrottle}
              >
                <Text style={styles.primaryButtonText}>
                  切换原生节流 {nativeCameraThrottleMs}ms
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={resetCameraEventStats}
              >
                <Text style={styles.secondaryButtonText}>清空相机事件统计</Text>
              </Pressable>
            </View>
          </View>
        </MapUI>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  map: {
    flex: 1,
  },
  overlayRoot: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 110,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  infoCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  cardText: {
    marginTop: 8,
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
  },
  cardMeta: {
    marginTop: 8,
    color: '#93c5fd',
    fontSize: 12,
    lineHeight: 18,
  },
  toolbar: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
});
