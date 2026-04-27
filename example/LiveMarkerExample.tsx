import React from 'react';
import {
  Animated,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  LiveMarker,
  MapUI,
  MapView,
  Marker,
  type CameraPosition,
  type LatLng,
} from 'expo-gaode-map';

type LiveMarkerSpot = {
  id: 'forbidden-city' | 'beihai' | 'jingshan';
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  position: LatLng;
};

const CAMERA: CameraPosition = {
  target: {
    latitude: 39.918,
    longitude: 116.397,
  },
  zoom: 14.2,
};

const LIVE_MARKER_WIDTH = 210;

const SPOTS: LiveMarkerSpot[] = [
  {
    id: 'forbidden-city',
    title: '故宫角楼',
    subtitle: '实时 RN View',
    image: require('./assets/0ce2ee1ea2edc7d68c3b3e3f50f90686~tplv-be4g95zd3a-image.jpeg'),
    position: {
      latitude: 39.9163,
      longitude: 116.3972,
    },
  },
  {
    id: 'beihai',
    title: '北海公园',
    subtitle: '图片不会截图缓存',
    image: require('./assets/1c5068435af7bb410102894fe4965433~tplv-be4g95zd3a-image.jpeg'),
    position: {
      latitude: 39.9253,
      longitude: 116.3898,
    },
  },
  {
    id: 'jingshan',
    title: '景山公园',
    subtitle: '点击触发 RN 动画',
    image: require('./assets/7630170bd05cd254104fc20ef0747a01~tplv-be4g95zd3a-image.jpeg'),
    position: {
      latitude: 39.9234,
      longitude: 116.3959,
    },
  },
];

function AnimatedLiveCard({
  selected,
  spot,
}: {
  selected: boolean;
  spot: LiveMarkerSpot;
}) {
  const scale = React.useRef(new Animated.Value(selected ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 130,
    }).start();
  }, [scale, selected]);

  const animatedStyle = {
    transform: [
      {
        scale: scale.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
      {
        translateY: scale.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.markerShell, animatedStyle]}>
      {selected ? (
        <View style={styles.liveCard}>
          <Image source={spot.image} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardTextBox}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {spot.title}
            </Text>
            <Text numberOfLines={1} style={styles.cardSubtitle}>
              {spot.subtitle}
            </Text>
          </View>
          <View style={styles.pin} />
        </View>
      ) : (
        <View style={styles.dotMarker}>
          <View style={styles.dotMarkerCore} />
        </View>
      )}
    </Animated.View>
  );
}

export default function LiveMarkerExample() {
  const [selectedId, setSelectedId] = React.useState<LiveMarkerSpot['id']>('forbidden-city');
  const [tracksCamera, setTracksCamera] = React.useState(true);
  const selectedSpot = SPOTS.find((spot) => spot.id === selectedId) ?? SPOTS[0];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={CAMERA}
        buildingsEnabled
        labelsEnabled
      >
        <Marker
          position={{
            latitude: 39.9137,
            longitude: 116.3917,
          }}
          title="旧 Marker"
          pinColor="blue"
          zIndex={1}
        />

        {SPOTS.map((spot, index) => (
          <LiveMarker
            key={spot.id}
            position={spot.position}
            anchor={{ x: 0.5, y: 1 }}
            offset={{ x: 0, y: -6 }}
            tracksCamera={tracksCamera}
            zIndex={20 + index}
            onPress={() => setSelectedId(spot.id)}
          >
            <AnimatedLiveCard selected={selectedId === spot.id} spot={spot} />
          </LiveMarker>
        ))}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.panel}>
              <Text style={styles.panelEyebrow}>LiveMarker</Text>
              <Text style={styles.panelTitle}>实时自定义 Marker</Text>
              <Text style={styles.panelBody}>
                当前选中：{selectedSpot.title}。卡片是活的 RN View，图片、文字和动画不再走 bitmap 截图。
              </Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => setTracksCamera((value) => !value)}
                  style={[styles.actionButton, !tracksCamera && styles.actionButtonMuted]}
                >
                  <Text style={styles.actionText}>
                    {tracksCamera ? '跟随相机' : '暂停跟随'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const currentIndex = SPOTS.findIndex((spot) => spot.id === selectedId);
                    const next = SPOTS[(currentIndex + 1) % SPOTS.length];
                    setSelectedId(next.id);
                  }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionText}>切换选中</Text>
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
    backgroundColor: '#0f172a',
  },
  map: {
    flex: 1,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'flex-start',
  },
  panel: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    padding: 14,
  },
  panelEyebrow: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  panelTitle: {
    marginTop: 3,
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  panelBody: {
    marginTop: 8,
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  actionButtonMuted: {
    backgroundColor: '#64748b',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  markerShell: {
    alignItems: 'center',
  },
  liveCard: {
    width: LIVE_MARKER_WIDTH,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
    overflow: 'visible',
  },
  cardImage: {
    width: '100%',
    height: 92,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  cardTextBox: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 12,
  },
  pin: {
    position: 'absolute',
    left: LIVE_MARKER_WIDTH / 2 - 7,
    bottom: -7,
    width: 14,
    height: 14,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
  },
  dotMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#020617',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  dotMarkerCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
});
