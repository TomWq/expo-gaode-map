import {  MapView, type LatLng } from 'expo-gaode-map-navigation';
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
      
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
