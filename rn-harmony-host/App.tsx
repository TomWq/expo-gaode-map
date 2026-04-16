import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { ExpoGaodeMapModule, MapView } from 'expo-gaode-map';

const HARMONY_KEY = '23797e2dc6a31f25bbc065aa3c1b6950';
let hasInitializedHarmonySDK = false;

function ensureHarmonySDKInitialized() {
  if (hasInitializedHarmonySDK) {
    return;
  }
  ExpoGaodeMapModule.setPrivacyConfig({
    hasContainsPrivacy: true,
    hasShow: true,
    hasAgree: true,
  });
  ExpoGaodeMapModule.initSDK({ harmonyKey: HARMONY_KEY });
  console.info(`[App] ExpoGaodeMapModule.initSDK called, key=${HARMONY_KEY ? `${HARMONY_KEY.slice(0, 4)}***${HARMONY_KEY.slice(-4)}` : 'EMPTY'}`);

  hasInitializedHarmonySDK = true;
}

ensureHarmonySDKInitialized();

export default function App(): React.JSX.Element {
  useEffect(() => {
    const request = async () => {
      try {
        const result = await ExpoGaodeMapModule.requestLocationPermission();
        console.info(`[App] requestLocationPermission result: ${JSON.stringify(result)}`);
      } catch (error) {
        console.warn(`[App] requestLocationPermission failed: ${JSON.stringify(error)}`);
      }
    };
    void request();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Harmony + ExpoGaodeMap</Text>
      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          mapType={3}
          myLocationEnabled={true}  
          
          zoomGesturesEnabled={true}
          scrollGesturesEnabled={true}
          rotateGesturesEnabled={true}
          tiltGesturesEnabled={true}
          initialCameraPosition={{
            target: { latitude: 39.90923, longitude: 116.397428 },
            zoom: 14,
            bearing: 0,
            tilt: 0,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapWrap: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDDDDD',
  },
  map: {
    flex: 1,
  },
});
