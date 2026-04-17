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
  Circle,
  ExpoGaodeMapModule,
  MapUI,
  MapView,
  Marker,
  Polygon,
  Polyline,
  type CameraPosition,
  type LatLngPoint,
  type MapViewRef,
} from 'expo-gaode-map';

import { BEIJING_CENTER, type GeoJsonCoordinate } from './playgroundUtils';

type DemoMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  color:
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'cyan'
    | 'blue'
    | 'violet'
    | 'purple';
};

type DemoCircle = {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  fillColor: string;
  strokeColor: string;
};

type DemoPolyline = {
  id: string;
  points: LatLngPoint[];
  color: string;
};

type DemoPolygon = {
  id: string;
  points: Array<{ latitude: number; longitude: number }>;
  fillColor: string;
  strokeColor: string;
};

/**
 * 覆盖物操场示例。
 * 这一页专门演示 Circle / Marker / Polyline / Polygon 的声明式写法，
 * 也保留了多种坐标输入格式，方便直接复制到业务代码里。
 */
export default function OverlayPlaygroundExample() {
  const mapRef = React.useRef<MapViewRef>(null);
  const markerId = React.useRef(0);
  const circleId = React.useRef(0);
  const polylineId = React.useRef(0);
  const polygonId = React.useRef(0);

  const [initialCamera, setInitialCamera] =
    React.useState<CameraPosition | null>(null);
  const [center, setCenter] = React.useState(BEIJING_CENTER);
  const [markers, setMarkers] = React.useState<DemoMarker[]>([]);
  const [circles, setCircles] = React.useState<DemoCircle[]>([]);
  const [polylines, setPolylines] = React.useState<DemoPolyline[]>([]);
  const [polygons, setPolygons] = React.useState<DemoPolygon[]>([]);

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
          zoom: 14.5,
        });
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setInitialCamera({
          target: BEIJING_CENTER,
          zoom: 12,
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const randomOffset = React.useCallback(() => (Math.random() - 0.5) * 0.02, []);

  const handleAddCircle = React.useCallback(() => {
    setCircles((previous) => [
      ...previous,
      {
        id: `circle_${circleId.current}`,
        latitude: center.latitude + randomOffset(),
        longitude: center.longitude + randomOffset(),
        radius: 200 + Math.random() * 400,
        fillColor: `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}44`,
        strokeColor: `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}`,
      },
    ]);
    circleId.current += 1;
  }, [center, randomOffset]);

  const handleAddMarker = React.useCallback(() => {
    const colors: DemoMarker['color'][] = [
      'red',
      'orange',
      'yellow',
      'green',
      'cyan',
      'blue',
      'violet',
      'purple',
    ];

    setMarkers((previous) => [
      ...previous,
      {
        id: `marker_${markerId.current}`,
        latitude: center.latitude + randomOffset(),
        longitude: center.longitude + randomOffset(),
        title: `动态标记 #${markerId.current + 1}`,
        color: colors[Math.floor(Math.random() * colors.length)],
      },
    ]);
    markerId.current += 1;
  }, [center, randomOffset]);

  const handleAddPolyline = React.useCallback(() => {
    const points: GeoJsonCoordinate[] = [
      [center.longitude + randomOffset(), center.latitude + randomOffset()],
      [center.longitude + randomOffset(), center.latitude + randomOffset()],
      [center.longitude + randomOffset(), center.latitude + randomOffset()],
    ];

    setPolylines((previous) => [
      ...previous,
      {
        id: `polyline_${polylineId.current}`,
        points,
        color: `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}`,
      },
    ]);
    polylineId.current += 1;
  }, [center, randomOffset]);

  const handleAddPolygon = React.useCallback(() => {
    setPolygons((previous) => [
      ...previous,
      {
        id: `polygon_${polygonId.current}`,
        points: [
          {
            latitude: center.latitude + randomOffset(),
            longitude: center.longitude + randomOffset(),
          },
          {
            latitude: center.latitude + randomOffset(),
            longitude: center.longitude + randomOffset(),
          },
          {
            latitude: center.latitude + randomOffset(),
            longitude: center.longitude + randomOffset(),
          },
        ],
        fillColor: `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}44`,
        strokeColor: `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, '0')}`,
      },
    ]);
    polygonId.current += 1;
  }, [center, randomOffset]);

  const handleClearAll = React.useCallback(() => {
    setCircles([]);
    setMarkers([]);
    setPolylines([]);
    setPolygons([]);
  }, []);

  const handleFitAll = React.useCallback(async () => {
    const points: LatLngPoint[] = [];

    circles.forEach((circle) => {
      points.push([circle.longitude, circle.latitude]);
    });
    markers.forEach((marker) => {
      points.push([marker.longitude, marker.latitude]);
    });
    polylines.forEach((polyline) => {
      points.push(...polyline.points);
    });
    polygons.forEach((polygon) => {
      points.push(...polygon.points);
    });

    if (!points.length) {
      Alert.alert('没有可框选的覆盖物', '先添加一些覆盖物再试试。');
      return;
    }

    await mapRef.current?.fitToCoordinates(points, {
      duration: 400,
      paddingFactor: 0.28,
      minZoom: 5,
      maxZoom: 18,
    });
  }, [circles, markers, polylines, polygons]);

  if (!initialCamera) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.loadingText}>正在准备覆盖物示例...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialCameraPosition={initialCamera}>
        {circles.map((circle) => (
          <Circle
            key={circle.id}
            center={[circle.longitude, circle.latitude]}
            radius={circle.radius}
            fillColor={circle.fillColor}
            strokeColor={circle.strokeColor}
            strokeWidth={2}
          />
        ))}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ latitude: marker.latitude, longitude: marker.longitude }}
            pinColor={marker.color}
            title={marker.title}
            cacheKey={marker.id}
          />
        ))}

        {polylines.map((polyline) => (
          <Polyline
            key={polyline.id}
            points={polyline.points}
            strokeWidth={5}
            strokeColor={polyline.color}
          />
        ))}

        {polygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            points={polygon.points}
            fillColor={polygon.fillColor}
            strokeColor={polygon.strokeColor}
            strokeWidth={2}
          />
        ))}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>基础覆盖物 Playground</Text>
              <Text style={styles.heroText}>
                这一页重点看声明式覆盖物如何增删，以及 `fitToCoordinates`
                如何直接框选当前覆盖物集合。
              </Text>
            </View>

            <View style={styles.toolbar}>
              <View style={styles.buttonGrid}>
                <Pressable style={styles.actionButton} onPress={handleAddCircle}>
                  <Text style={styles.actionButtonText}>添加 Circle</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={handleAddMarker}>
                  <Text style={styles.actionButtonText}>添加 Marker</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={handleAddPolyline}>
                  <Text style={styles.actionButtonText}>添加 Polyline</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={handleAddPolygon}>
                  <Text style={styles.actionButtonText}>添加 Polygon</Text>
                </Pressable>
              </View>

              <View style={styles.footerRow}>
                <Pressable style={styles.secondaryButton} onPress={handleFitAll}>
                  <Text style={styles.secondaryButtonText}>框选全部覆盖物</Text>
                </Pressable>
                <Pressable style={styles.ghostButton} onPress={handleClearAll}>
                  <Text style={styles.ghostButtonText}>清空</Text>
                </Pressable>
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
  actionButton: {
    width: '48%',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#0f172a',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
    backgroundColor: '#2563eb',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  ghostButton: {
    width: 88,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#e2e8f0',
  },
  ghostButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
});
