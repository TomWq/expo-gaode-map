import { AreaMaskOverlay, MapView, type LatLng } from 'expo-gaode-map';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const center: LatLng = {
  latitude: 39.909186,
  longitude: 116.397411,
};

const rings = [
  [
    [116.32, 39.97],
    [116.48, 39.97],
    [116.48, 39.84],
    [116.32, 39.84],
    [116.32, 39.97],
  ],
  [
    [116.37, 39.93],
    [116.42, 39.93],
    [116.42, 39.89],
    [116.37, 39.89],
    [116.37, 39.93],
  ],
];

export default function AOIOverlayExample() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: center,
          zoom: 11.5,
        }}
      >
        {/* 
          rings 的第一个环作为外层遮罩，后续环作为“挖洞区域”。
          这里用最小示例演示 AOI/园区高亮的标准写法。
        */}
        <AreaMaskOverlay
          rings={rings}
          polygonProps={{
            fillColor: 'rgba(15, 23, 42, 0.45)',
            strokeColor: 'rgba(255,255,255,0.8)',
            strokeWidth: 2,
          }}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
