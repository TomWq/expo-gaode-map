import {
  ExpoGaodeMapModule,
  MapView,
  type MapViewRef,
  Marker,
  RouteOverlay,
  useRoutePlayback,
  type CameraPosition,
  type Coordinates,
  type LatLng,
  MapType,
} from 'expo-gaode-map';
import { DrivingStrategy, GaodeWebAPI, extractRoutePoints } from 'expo-gaode-map-web-api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import Colors from './Colors';
import { EXAMPLE_WEB_API_KEY } from './exampleConfig';

const carIcon = Image.resolveAssetSource(require('./assets/car.png')).uri;
const startIcon = Image.resolveAssetSource(require('./assets/start.png')).uri;
const endIcon = Image.resolveAssetSource(require('./assets/end.png')).uri;

export default function NavigationWithLocation() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const C = Colors[scheme];
  const mapRef = useRef<MapViewRef>(null);
  const api = useMemo(
    () => new GaodeWebAPI({ key: EXAMPLE_WEB_API_KEY }),
    []
  );

  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState<LatLng[]>([]);
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  const [initialCamera, setInitialCamera] = useState<CameraPosition | null>(null);
  const [trackingMode, setTrackingMode] = useState<'simulation' | 'realtime'>('simulation');
  const [speed, setSpeed] = useState<number>(1);

  const defaultOrigin: LatLng = { latitude: 39.908692, longitude: 116.397477 };
  const defaultDest: LatLng = { latitude: 39.992806, longitude: 116.310905 };

  const playback = useRoutePlayback(routeData, {
    speedMultiplier: speed,
    autoFit: false,
    followCamera: trackingMode === 'simulation',
    followZoom: 17,
    updateIntervalMs: 100,
    onComplete: () => {
      setCurrentPosition(routeData[routeData.length - 1] ?? null);
    },
  });

  useEffect(() => {
    playback.setSpeedMultiplier(speed);
  }, [playback, speed]);

  useEffect(() => {
    const bootstrap = async () => {
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        await ExpoGaodeMapModule.requestLocationPermission();
      }

      const loc = await ExpoGaodeMapModule.getCurrentLocation().catch(() => null);
      const target = loc
        ? { latitude: loc.latitude, longitude: loc.longitude }
        : defaultOrigin;

      setInitialCamera({
        target,
        zoom: 15,
      });
      setCurrentPosition(target);
    };

    void bootstrap();

    const subscription = ExpoGaodeMapModule.addLocationListener((location) => {
      if (trackingMode !== 'realtime' || playback.isPlaying) {
        return;
      }

      const next = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      setCurrentPosition(next);
      void mapRef.current?.moveCamera(
        {
          target: next,
          zoom: 17,
          bearing: location.heading || 0,
        },
        Platform.OS === 'android' ? 250 : 150
      );
    });

    return () => {
      subscription.remove();
    };
  }, [playback.isPlaying, trackingMode]);

  useEffect(() => {
    if (trackingMode === 'realtime') {
      playback.stop();
    }
  }, [playback, trackingMode]);

  const planRoute = async () => {
    setLoading(true);
    try {
      const startLoc = await ExpoGaodeMapModule.getCurrentLocation().catch(() => null);
      const origin = startLoc
        ? { latitude: startLoc.latitude, longitude: startLoc.longitude }
        : defaultOrigin;

      const response = await api.route.driving(origin, defaultDest, {
        strategy: DrivingStrategy.DEFAULT,
        show_fields: 'polyline,cost',
      });

      const points = extractRoutePoints(response);
      if (!points.length) {
        throw new Error('当前路线没有可用的 polyline 点集');
      }

      setRouteData(points);
      setCurrentPosition(points[0]);
      playback.stop();
      await mapRef.current?.fitToCoordinates(points, { duration: 500 });
    } catch (error) {
      Alert.alert('规划失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = () => {
    if (routeData.length < 2) {
      Alert.alert('提示', '请先规划路径');
      return;
    }

    setTrackingMode('simulation');
    playback.start();
  };

  const stopSimulation = () => {
    playback.stop();
    setCurrentPosition(routeData[0] ?? currentPosition);
  };

  const vehiclePosition =
    trackingMode === 'simulation'
      ? playback.currentPosition ?? routeData[0] ?? currentPosition
      : currentPosition;

  return (
    <View style={styles.container}>
      {initialCamera ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          mapType={MapType.Night}
          initialCameraPosition={initialCamera}
          myLocationEnabled={trackingMode === 'realtime'}
          myLocationButtonEnabled
          indoorViewEnabled
          buildingsEnabled
          labelsEnabled
        >
          {routeData.length > 0 ? (
            <RouteOverlay
              points={routeData}
              polylineProps={{
                strokeWidth: 8,
                strokeColor: '#ffffff',
              }}
              startMarkerProps={{
                icon: startIcon,
                iconWidth: 40,
                iconHeight: 40,
                zIndex: 100,
                title: '起点',
              }}
              endMarkerProps={{
                icon: endIcon,
                iconWidth: 40,
                iconHeight: 40,
                zIndex: 100,
                title: '终点',
              }}
            />
          ) : null}

          {vehiclePosition ? (
            <Marker
              position={vehiclePosition}
              smoothMovePath={
                trackingMode === 'simulation' && playback.isPlaying
                  ? playback.smoothMovePath
                  : undefined
              }
              smoothMoveDuration={
                trackingMode === 'simulation' && playback.isPlaying
                  ? playback.smoothMoveDuration
                  : undefined
              }
              icon={carIcon}
              iconWidth={18}
              iconHeight={(18 * 200) / 120}
              anchor={{ x: 0.5, y: 0.5 }}
              flat
              zIndex={120}
            />
          ) : null}
        </MapView>
      ) : null}

      <View style={[styles.controlPanel, { backgroundColor: C.background }]}>
        <Text style={[styles.title, { color: C.text }]}>路线规划与轨迹回放</Text>

        <View style={styles.modeSelector}>
          <Pressable
            style={[
              styles.modeButton,
              trackingMode === 'simulation' && { backgroundColor: `${C.tint}22` },
            ]}
            onPress={() => setTrackingMode('simulation')}
          >
            <Text
              style={[
                styles.modeText,
                { color: trackingMode === 'simulation' ? C.tint : C.text },
              ]}
            >
              模拟回放
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              trackingMode === 'realtime' && { backgroundColor: `${C.tint}22` },
            ]}
            onPress={() => setTrackingMode('realtime')}
          >
            <Text
              style={[
                styles.modeText,
                { color: trackingMode === 'realtime' ? C.tint : C.text },
              ]}
            >
              实时追踪
            </Text>
          </Pressable>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, { backgroundColor: C.tint }]}
            onPress={planRoute}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>规划路径</Text>}
          </Pressable>

          {trackingMode === 'simulation' ? (
            <Pressable
              style={[
                styles.button,
                { backgroundColor: playback.isPlaying ? '#ff4d4f' : '#52c41a' },
                routeData.length === 0 && styles.disabledButton,
              ]}
              onPress={playback.isPlaying ? stopSimulation : startSimulation}
              disabled={routeData.length === 0}
            >
              <Text style={styles.buttonText}>
                {playback.isPlaying ? '停止回放' : '开始回放'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {trackingMode === 'simulation' && !playback.isPlaying ? (
          <View style={styles.speedRow}>
            <Text style={[styles.speedLabel, { color: C.text }]}>回放倍率:</Text>
            {[1, 2, 5, 10].map((value) => (
              <Pressable
                key={value}
                style={[
                  styles.speedButton,
                  speed === value && { backgroundColor: C.tint },
                  { borderColor: C.tint },
                ]}
                onPress={() => setSpeed(value)}
              >
                <Text
                  style={[
                    styles.speedText,
                    speed === value ? { color: '#fff' } : { color: C.tint },
                  ]}
                >
                  {value}x
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {trackingMode === 'simulation' && routeData.length > 0 ? (
          <Text style={[styles.progressText, { color: C.text }]}>
            进度 {(playback.progress * 100).toFixed(0)}% · {Math.round(playback.traveledDistance)}m /{' '}
            {Math.round(playback.totalDistance)}m
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controlPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modeSelector: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16, padding: 4 },
  modeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  modeText: { fontSize: 14, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 0.48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  speedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  speedLabel: { fontSize: 14, marginRight: 12 },
  speedButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, marginRight: 8 },
  speedText: { fontSize: 12, fontWeight: '600' },
  progressText: { marginTop: 12, textAlign: 'center', fontSize: 13, fontWeight: '500' },
});
