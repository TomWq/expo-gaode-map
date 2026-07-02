import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MapUI,
  MapView,
  Marker,
  type CameraPosition,
  type ZoomGestureAnchor,
} from 'expo-gaode-map';

type MarkerLevel = 'compact' | 'normal' | 'large';

type DemoMarker = {
  id: 'sanlitun' | 'guomao' | 'wangjing' | 'olympic';
  name: string;
  subtitle: string;
  value: string;
  position: {
    latitude: number;
    longitude: number;
  };
};

const INITIAL_CAMERA: CameraPosition = {
  target: {
    latitude: 39.956,
    longitude: 116.447,
  },
  zoom: 11.8,
};

const MARKERS: DemoMarker[] = [
  {
    id: 'sanlitun',
    name: '三里屯',
    subtitle: '商圈',
    value: '328',
    position: { latitude: 39.936, longitude: 116.455 },
  },
  {
    id: 'guomao',
    name: '国贸',
    subtitle: '办公',
    value: '286',
    position: { latitude: 39.909, longitude: 116.47 },
  },
  {
    id: 'wangjing',
    name: '望京',
    subtitle: '社区',
    value: '412',
    position: { latitude: 39.996, longitude: 116.475 },
  },
  {
    id: 'olympic',
    name: '奥体',
    subtitle: '场馆',
    value: '176',
    position: { latitude: 39.992, longitude: 116.397 },
  },
];

function resolveMarkerLevel(zoom: number): MarkerLevel {
  if (zoom >= 13) {
    return 'large';
  }

  if (zoom >= 11) {
    return 'normal';
  }

  return 'compact';
}

function DemoMarkerView({
  marker,
  level,
  selected,
}: {
  marker: DemoMarker;
  level: MarkerLevel;
  selected: boolean;
}) {
  if (level === 'compact' && !selected) {
    return (
      <View style={styles.compactMarker}>
        <Text style={styles.compactMarkerText}>{marker.value}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.markerCard,
        level === 'large' && styles.markerCardLarge,
        selected && styles.markerCardSelected,
      ]}
    >
      <View style={[styles.markerValuePill, selected && styles.markerValuePillSelected]}>
        <Text style={[styles.markerValueText, selected && styles.markerValueTextSelected]}>
          {marker.value}
        </Text>
      </View>
      <View style={styles.markerTextColumn}>
        <Text
          numberOfLines={1}
          style={[styles.markerName, selected && styles.markerNameSelected]}
        >
          {marker.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.markerSubtitle, selected && styles.markerSubtitleSelected]}
        >
          {marker.subtitle}
        </Text>
      </View>
    </View>
  );
}

type DemoMapMarkerProps = {
  marker: DemoMarker;
  level: MarkerLevel;
  selected: boolean;
  index: number;
  onSelect: (id: DemoMarker['id']) => void;
};

const DemoMapMarker = React.memo(
  function DemoMapMarker({
    marker,
    level,
    selected,
    index,
    onSelect,
  }: DemoMapMarkerProps) {
    return (
      <Marker
        position={marker.position}
        cacheKey={`zoom-anchor-marker-${marker.id}-${level}-${selected ? 'selected' : 'normal'}`}
        zIndex={selected ? 100 : 10 + index}
        onMarkerPress={() => onSelect(marker.id)}
      >
        <DemoMarkerView marker={marker} level={level} selected={selected} />
      </Marker>
    );
  },
  (prev, next) =>
    prev.marker === next.marker &&
    prev.level === next.level &&
    prev.selected === next.selected &&
    prev.index === next.index
);

export default function ZoomAnchorMarkerStateExample() {
  const [zoomAnchor, setZoomAnchor] = React.useState<ZoomGestureAnchor>('gesture');
  const [markerLevel, setMarkerLevel] = React.useState<MarkerLevel>('normal');
  const [selectedId, setSelectedId] = React.useState<DemoMarker['id']>('sanlitun');
  const handleSelectMarker = React.useCallback((id: DemoMarker['id']) => {
    setSelectedId(id);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={INITIAL_CAMERA}
        zoomGestureAnchor={zoomAnchor}
        cameraEventThrottleMs={80}
        onCameraMove={(event) => {
          setMarkerLevel(resolveMarkerLevel(event.nativeEvent.cameraPosition.zoom ?? INITIAL_CAMERA.zoom ?? 11.8));
        }}
      >
        {MARKERS.map((marker, index) => {
          const selected = marker.id === selectedId;
          return (
            <DemoMapMarker
              key={marker.id}
              marker={marker}
              level={markerLevel}
              selected={selected}
              index={index}
              onSelect={handleSelectMarker}
            />
          );
        })}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>缩放锚点与选中态</Text>
              <View style={styles.segment}>
                {(['gesture', 'center'] as ZoomGestureAnchor[]).map((anchor) => {
                  const active = zoomAnchor === anchor;
                  return (
                    <Pressable
                      key={anchor}
                      style={[styles.segmentButton, active && styles.segmentButtonActive]}
                      onPress={() => setZoomAnchor(anchor)}
                    >
                      <Text
                        style={[
                          styles.segmentButtonText,
                          active && styles.segmentButtonTextActive,
                        ]}
                      >
                        {anchor === 'gesture' ? '手势中心' : '地图中心'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Marker</Text>
                <Text style={styles.infoValue}>{selectedId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Level</Text>
                <Text style={styles.infoValue}>{markerLevel}</Text>
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
    backgroundColor: '#f8fafc',
  },
  map: {
    flex: 1,
  },
  overlayRoot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: 16,
    justifyContent: 'flex-start',
  },
  panel: {
    width: 244,
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 5,
  },
  panelTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  segment: {
    marginTop: 10,
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    backgroundColor: '#e2e8f0',
  },
  segmentButton: {
    flex: 1,
    minHeight: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#0f172a',
  },
  segmentButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentButtonTextActive: {
    color: '#fff',
  },
  infoRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  compactMarker: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  compactMarkerText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '900',
  },
  markerCard: {
    width: 108,
    minHeight: 46,
    borderRadius: 8,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  markerCardLarge: {
    width: 136,
    minHeight: 54,
    padding: 8,
  },
  markerCardSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#38bdf8',
  },
  markerValuePill: {
    width: 34,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  markerValuePillSelected: {
    backgroundColor: '#38bdf8',
  },
  markerValueText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '900',
  },
  markerValueTextSelected: {
    color: '#082f49',
  },
  markerTextColumn: {
    flex: 1,
    marginLeft: 7,
  },
  markerName: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
  },
  markerNameSelected: {
    color: '#ffffff',
  },
  markerSubtitle: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  markerSubtitleSelected: {
    color: '#bae6fd',
  },
});
