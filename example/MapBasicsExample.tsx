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
  ExpoGaodeMapModule,
  MapType,
  MapUI,
  MapView,
  Marker,
  type CameraPosition,
  type LatLng,
  type MapViewRef,
} from 'expo-gaode-map';

import { BEIJING_CENTER } from './playgroundUtils';

/**
 * 地图基础能力示例。
 * 这里集中演示最常用的相机、定位和事件监听能力，
 * 适合作为 `MapView` 的第一站参考页。
 */
export default function MapBasicsExample() {
  const mapRef = React.useRef<MapViewRef>(null);
  const mapTypeOptions = React.useMemo(
    () => [
      { label: '标准', value: MapType.Standard },
      { label: '卫星', value: MapType.Satellite },
      { label: '夜间', value: MapType.Night },
      { label: '导航', value: MapType.Navi },
      { label: '公交', value: MapType.Bus },
    ],
    []
  );
  const [initialCamera, setInitialCamera] =
    React.useState<CameraPosition | null>(null);
  const [location, setLocation] = React.useState<LatLng | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [mapType, setMapType] = React.useState<MapType>(MapType.Standard);
  const [cameraInfo, setCameraInfo] = React.useState('等待地图事件...');
  const [cameraMoveCount, setCameraMoveCount] = React.useState(0);
  const [cameraIdleCount, setCameraIdleCount] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const current = await ExpoGaodeMapModule.getCurrentLocation().catch(
          () => null
        );
        const target = current
          ? { latitude: current.latitude, longitude: current.longitude }
          : BEIJING_CENTER;

        if (!mounted) {
          return;
        }

        setLocation(target);
        setInitialCamera({
          target,
          zoom: current ? 16 : 12,
        });
      } catch (error) {
        console.error('加载基础地图示例失败:', error);
        if (mounted) {
          setLocation(BEIJING_CENTER);
          setInitialCamera({
            target: BEIJING_CENTER,
            zoom: 12,
          });
        }
      }
    };

    const subscription = ExpoGaodeMapModule.addLocationListener((nextLocation) => {
      if (!mounted) {
        return;
      }

      setLocation({
        latitude: nextLocation.latitude,
        longitude: nextLocation.longitude,
      });
    });

    void bootstrap();

    return () => {
      mounted = false;
      subscription.remove();
      ExpoGaodeMapModule.stop();
      ExpoGaodeMapModule.stopUpdatingHeading();
    };
  }, []);

  const handleLocateMe = React.useCallback(async () => {
    try {
      const current = await ExpoGaodeMapModule.getCurrentLocation().catch(
        () => null
      );
      const target = current
        ? { latitude: current.latitude, longitude: current.longitude }
        : BEIJING_CENTER;

      setLocation(target);
      await mapRef.current?.moveCamera(
        {
          target,
          zoom: current ? 16.5 : 12,
          bearing: current?.heading ?? 0,
        },
        320
      );
    } catch (error) {
      console.error('定位失败:', error);
      Alert.alert('定位失败', '请确认权限、设备定位开关或 SDK 配置。');
    }
  }, []);

  const handleStartLocation = React.useCallback(() => {
    ExpoGaodeMapModule.start();
    ExpoGaodeMapModule.startUpdatingHeading();
    setIsLocating(true);
  }, []);

  const handleStopLocation = React.useCallback(() => {
    ExpoGaodeMapModule.stop();
    ExpoGaodeMapModule.stopUpdatingHeading();
    setIsLocating(false);
  }, []);

  const handleZoom = React.useCallback(async (delta: number) => {
    try {
      const camera = await mapRef.current?.getCameraPosition();
      if (!camera) {
        return;
      }

      await mapRef.current?.moveCamera(
        {
          ...camera,
          zoom: (camera.zoom ?? 12) + delta,
        },
        220
      );
    } catch (error) {
      console.error('调整缩放失败:', error);
    }
  }, []);

  if (!initialCamera) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.loadingText}>正在准备基础地图示例...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={initialCamera}
        myLocationEnabled
        myLocationButtonEnabled
        indoorViewEnabled
        buildingsEnabled
        labelsEnabled
        mapType={mapType}
        onLocation={({ nativeEvent }) => {
          setLocation({
            latitude: nativeEvent.latitude,
            longitude: nativeEvent.longitude,
          });
        }}
        onCameraMove={({ nativeEvent }) => {
          const zoom = nativeEvent.cameraPosition.zoom ?? 0;
          const target = nativeEvent.cameraPosition.target;
          setCameraMoveCount((previous) => previous + 1);
          setCameraInfo(
            `移动中 · 中心 ${target?.latitude?.toFixed(4) ?? '--'}, ${
              target?.longitude?.toFixed(4) ?? '--'
            } · 缩放 ${zoom.toFixed(2)}`
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
      >
        {location ? (
          <Marker
            position={location}
            title="当前位置"
            pinColor="blue"
            cacheKey="map_basics_current_location"
          />
        ) : null}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>MapView 基础能力</Text>
              <Text style={styles.cardText}>{cameraInfo}</Text>
              <Text style={styles.cardMeta}>
                事件统计 · move {cameraMoveCount} / idle {cameraIdleCount}
              </Text>
              <Text style={styles.cardMeta}>
                当前模式 · {mapTypeOptions.find((option) => option.value === mapType)?.label ?? '未知'}
              </Text>
            </View>

            <View style={styles.toolbar}>
              <Pressable style={styles.primaryButton} onPress={handleLocateMe}>
                <Text style={styles.primaryButtonText}>定位到当前</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.secondaryButton,
                  isLocating && styles.secondaryButtonActive,
                ]}
                onPress={isLocating ? handleStopLocation : handleStartLocation}
              >
                <Text style={styles.secondaryButtonText}>
                  {isLocating ? '停止连续定位' : '开始连续定位'}
                </Text>
              </Pressable>
              <View style={styles.zoomRow}>
                <Pressable
                  style={styles.zoomButton}
                  onPress={() => {
                    void handleZoom(1);
                  }}
                >
                  <Text style={styles.zoomButtonText}>放大</Text>
                </Pressable>
                <Pressable
                  style={styles.zoomButton}
                  onPress={() => {
                    void handleZoom(-1);
                  }}
                >
                  <Text style={styles.zoomButtonText}>缩小</Text>
                </Pressable>
              </View>
              <View style={styles.mapTypeRow}>
                {mapTypeOptions.map((option) => {
                  const active = option.value === mapType;
                  return (
                    <Pressable
                      key={option.label}
                      style={[styles.mapTypeButton, active && styles.mapTypeButtonActive]}
                      onPress={() => {
                        setMapType(option.value);
                      }}
                    >
                      <Text
                        style={[
                          styles.mapTypeButtonText,
                          active && styles.mapTypeButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
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
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  infoCard: {
    alignSelf: 'stretch',
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
    backgroundColor: 'rgba(255,255,255,0.92)',
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
  secondaryButtonActive: {
    backgroundColor: '#fee2e2',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  zoomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  zoomButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
  },
  zoomButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  mapTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mapTypeButton: {
    minWidth: 52,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
  mapTypeButtonActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#dbeafe',
  },
  mapTypeButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  mapTypeButtonTextActive: {
    color: '#1d4ed8',
  },
});
