import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';



import {
  AreaMaskOverlay,
  Cluster,
  ExpoGaodeMapModule,
  HeatMap,
  MapUI,
  MapView,
  MultiPoint,
  type CameraPosition,
  type MapViewRef,
} from 'expo-gaode-map';

import {
  BEIJING_CENTER,
  generateClusterData,
  generateHeatMapData,
  generateIrregularOutline,
  generateMaskOuterRing,
  generateMultiPointData,
  positionIconUri,
} from './playgroundUtils';

/**
 * 高级覆盖物示例。
 * 把热力图、海量点、聚合和区域遮罩放在一起，
 * 方便快速验证高阶图层能力是否工作正常。
 */
export default function AdvancedOverlayExample() {
  const mapRef = React.useRef<MapViewRef>(null);
  const [initialCamera, setInitialCamera] =
    React.useState<CameraPosition | null>(null);
  const [center, setCenter] = React.useState(BEIJING_CENTER);
  const [showHeatMap, setShowHeatMap] = React.useState(false);
  const [showMultiPoint, setShowMultiPoint] = React.useState(false);
  const [showCluster, setShowCluster] = React.useState(false);
  const [showAreaMask, setShowAreaMask] = React.useState(false);
  const [useClusterIcon, setUseClusterIcon] = React.useState(false);
  const [heatMapData, setHeatMapData] = React.useState(
    generateHeatMapData(BEIJING_CENTER, 240)
  );
  const [multiPointData, setMultiPointData] = React.useState(
    generateMultiPointData(BEIJING_CENTER, 300)
  );
  const [clusterData, setClusterData] = React.useState(
    generateClusterData(BEIJING_CENTER, 400)
  );

  React.useEffect(() => {
    let mounted = true;

    void ExpoGaodeMapModule.getCurrentLocation()
      .then((location) => {
        if (!mounted) {
          return;
        }

        const target = {
          latitude: location.latitude,
          longitude: location.longitude,
        };

        setCenter(target);
        setInitialCamera({
          target,
          zoom: 12.5,
        });
        setHeatMapData(generateHeatMapData(target, 240));
        setMultiPointData(generateMultiPointData(target, 300));
        setClusterData(generateClusterData(target, 400));
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setInitialCamera({
          target: BEIJING_CENTER,
          zoom: 11.5,
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const areaRings = React.useMemo(() => {
    if (!showAreaMask) {
      return [];
    }

    return [generateMaskOuterRing(center), generateIrregularOutline(center)];
  }, [center, showAreaMask]);

  const regenerateData = React.useCallback(() => {
    setHeatMapData(generateHeatMapData(center, 240));
    setMultiPointData(generateMultiPointData(center, 300));
    setClusterData(generateClusterData(center, 400));
  }, [center]);

  const handleTakeSnapshot = React.useCallback(async () => {
    try {
      const snapshotPath = await mapRef.current?.takeSnapshot();
      if (!snapshotPath) {
        Alert.alert('截图失败', '当前没有拿到可保存的截图文件。');
        return;
      }

      
    } catch (error) {
      console.error('保存截图失败:', error);
      Alert.alert('截图失败', '截图或保存过程中出现错误。');
    }
  }, []);

  if (!initialCamera) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.loadingText}>正在准备高级覆盖物示例...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialCameraPosition={initialCamera}>
        <HeatMap
          data={heatMapData}
          visible={showHeatMap}
          radius={28}
          opacity={0.55}
          gradient={{
            colors: ['#2563eb', '#22c55e', '#f97316', '#ef4444'],
            startPoints: [0.15, 0.45, 0.72, 0.92],
          }}
        />

        {showMultiPoint ? (
          <MultiPoint
            points={multiPointData}
            icon={positionIconUri}
            iconWidth={26}
            iconHeight={26}
            onMultiPointPress={(event) => {
              Alert.alert('海量点点击', `点击了第 ${event.nativeEvent.index} 个点`);
            }}
          />
        ) : null}

        {showCluster ? (
          <Cluster
            points={clusterData}
            icon={useClusterIcon ? positionIconUri : undefined}
            radius={32}
            minClusterSize={2}
            clusterBuckets={[
              { minPoints: 2, backgroundColor: '#38bdf8' },
              { minPoints: 6, backgroundColor: '#22c55e' },
              { minPoints: 12, backgroundColor: '#f97316' },
              { minPoints: 20, backgroundColor: '#ef4444' },
            ]}
            clusterStyle={{
              backgroundColor: '#475569',
              borderColor: '#fff',
              borderWidth: 3,
              width: 42,
              height: 42,
            }}
            clusterTextStyle={{
              color: '#fff',
              fontSize: 15,
            }}
            onClusterPress={(event) => {
              const { count } = event.nativeEvent;
              Alert.alert('聚合点击', `当前聚合点包含 ${count} 个子点`);
            }}
          />
        ) : null}

        {showAreaMask && areaRings.length > 0 ? (
          <AreaMaskOverlay
            rings={areaRings}
            polygonProps={{
              fillColor: 'rgba(15, 23, 42, 0.48)',
              strokeColor: 'rgba(125, 211, 252, 0.92)',
              strokeWidth: 3,
              zIndex: 120,
            }}
          />
        ) : null}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>高级覆盖物 Playground</Text>
              <Text style={styles.heroText}>
                这里把高阶图层能力集中放在一页，便于快速核对热力图、海量点、聚合和区域遮罩是否正常。
              </Text>
            </View>

            <View style={styles.toolbar}>
              <View style={styles.buttonGrid}>
                <Pressable
                  style={[
                    styles.toggleButton,
                    showHeatMap && styles.toggleButtonActive,
                  ]}
                  onPress={() => setShowHeatMap((previous) => !previous)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      showHeatMap && styles.toggleButtonTextActive,
                    ]}
                  >
                    热力图
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleButton,
                    showMultiPoint && styles.toggleButtonActive,
                  ]}
                  onPress={() => setShowMultiPoint((previous) => !previous)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      showMultiPoint && styles.toggleButtonTextActive,
                    ]}
                  >
                    海量点
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleButton,
                    showCluster && styles.toggleButtonActive,
                  ]}
                  onPress={() => setShowCluster((previous) => !previous)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      showCluster && styles.toggleButtonTextActive,
                    ]}
                  >
                    原生聚合
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleButton,
                    showAreaMask && styles.toggleButtonActive,
                  ]}
                  onPress={() => setShowAreaMask((previous) => !previous)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      showAreaMask && styles.toggleButtonTextActive,
                    ]}
                  >
                    区域遮罩
                  </Text>
                </Pressable>
              </View>

              <View style={styles.footerRow}>
                <Pressable style={styles.secondaryButton} onPress={regenerateData}>
                  <Text style={styles.secondaryButtonText}>重生成测试数据</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.iconToggleButton,
                    useClusterIcon && styles.iconToggleButtonActive,
                  ]}
                  onPress={() => setUseClusterIcon((previous) => !previous)}
                >
                  <Text style={styles.iconToggleButtonText}>
                    聚合图标 {useClusterIcon ? '开' : '关'}
                  </Text>
                </Pressable>
              </View>

              <Pressable style={styles.snapshotButton} onPress={handleTakeSnapshot}>
                <Text style={styles.snapshotButtonText}>截图并保存到相册</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
  },
  loadingText: {
    marginTop: 12,
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '600',
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
  heroCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  heroText: {
    marginTop: 8,
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
  },
  toolbar: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    gap: 12,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toggleButton: {
    width: '48%',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#e2e8f0',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleButtonText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#0f172a',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  iconToggleButton: {
    width: 128,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#e2e8f0',
  },
  iconToggleButtonActive: {
    backgroundColor: '#c7d2fe',
  },
  iconToggleButtonText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  snapshotButton: {
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#2563eb',
  },
  snapshotButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
