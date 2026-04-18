import { EmbeddedNaviView, ExpoGaodeMapModule, type NaviPoint, type NaviViewRef } from "expo-gaode-map-navigation";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EXAMPLE_ANDROID_KEY, EXAMPLE_IOS_KEY, EXAMPLE_WEB_API_KEY } from "@/exampleConfig";

type DemoPoint = NaviPoint;

const DEMO_DESTINATION: DemoPoint = {
  latitude: 39.9075,
  longitude: 116.39723,
};

export default function NavigationDemoScreen() {
  const naviViewRef = React.useRef<NaviViewRef>(null);
  const [privacyReady, setPrivacyReady] = React.useState(false);
  const [sdkReady, setSdkReady] = React.useState(false);
  const [initializing, setInitializing] = React.useState(false);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<DemoPoint | null>(null);
  const [statusText, setStatusText] = React.useState("等待隐私确认和 SDK 初始化");

  const initSdk = React.useCallback(async () => {
    try {
      setInitializing(true);
      ExpoGaodeMapModule.setPrivacyConfig({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
        privacyVersion: "2026-04-18",
      });
      setPrivacyReady(true);

      ExpoGaodeMapModule.initSDK({
        ...(EXAMPLE_ANDROID_KEY ? { androidKey: EXAMPLE_ANDROID_KEY } : {}),
        ...(EXAMPLE_IOS_KEY ? { iosKey: EXAMPLE_IOS_KEY } : {}),
        ...(EXAMPLE_WEB_API_KEY ? { webKey: EXAMPLE_WEB_API_KEY } : {}),
      });

      const permission = await ExpoGaodeMapModule.requestLocationPermission();
      if (!permission.granted) {
        throw new Error("定位权限未授予");
      }

      const location = await ExpoGaodeMapModule.getCurrentLocation();
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setSdkReady(true);
      setStatusText(
        [
          "初始化完成",
          `当前位置: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
          EXAMPLE_ANDROID_KEY || EXAMPLE_IOS_KEY
            ? "原生 Key 已提供"
            : "当前未检测到原生 Key，prebuild 后请先配置 EXPO_PUBLIC_AMAP_ANDROID_KEY / EXPO_PUBLIC_AMAP_IOS_KEY",
        ].join("\n")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`初始化失败: ${message}`);
      Alert.alert("初始化失败", message);
    } finally {
      setInitializing(false);
    }
  }, []);

  const refreshLocation = React.useCallback(async () => {
    try {
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setStatusText(`定位刷新成功\n${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("定位失败", message);
    }
  }, []);

  const startNavigation = React.useCallback(async () => {
    if (!currentLocation) {
      Alert.alert("缺少起点", "请先完成初始化并获取当前位置");
      return;
    }

    setShowNaviView(true);

    setTimeout(async () => {
      try {
        await naviViewRef.current?.startNavigation(currentLocation, DEMO_DESTINATION, 1);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setShowNaviView(false);
        Alert.alert("启动导航失败", message);
      }
    }, 450);
  }, [currentLocation]);

  const stopNavigation = React.useCallback(async () => {
    try {
      await naviViewRef.current?.stopNavigation();
    } catch {}
    setShowNaviView(false);
  }, []);

  if (showNaviView) {
    return (
      <>
        <StatusBar style="dark" translucent />
        <EmbeddedNaviView
          ref={naviViewRef}
          style={styles.naviContainer}
          naviType={1}
          showCamera
          enableVoice
          showUIElements
          showTrafficBar
          showTrafficButton
          showDriveCongestion
          showTrafficLightView
          showCompassEnabled
          laneInfoVisible
          modeCrossDisplay
          eyrieCrossDisplay
          secondActionVisible
          backupOverlayVisible
          naviStatusBarEnabled={false}
          androidStatusBarPaddingTop={0}
          eagleMapVisible={false}
          driveViewEdgePadding={{ top: 12, left: 0, right: 0, bottom: 120 }}
          screenAnchor={{ x: 0.5, y: 0.78 }}
          showBackupRoute
          showEagleMap={false}
          onExitPress={() => void stopNavigation()}
          onNaviStart={() => {
            setStatusText("导航已开始");
          }}
          onArrive={() => {
            Alert.alert("已到达", "模拟导航已到达目的地");
          }}
          onNaviEnd={() => {
            void stopNavigation();
          }}
          onCalculateRouteFailure={(event) => {
            Alert.alert("算路失败", event.nativeEvent.error || "未知错误");
          }}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.badge}>example-navigation</Text>
          <Text style={styles.title}>高德导航接入验证</Text>
          <Text style={styles.description}>
            这个工程直接接入本地 `packages/navigation`，用于验证隐私初始化、定位、嵌入式 `NaviView`
            和最近补齐的导航 UI props。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前状态</Text>
          <Text style={styles.cardText}>隐私确认: {privacyReady ? "已完成" : "未完成"}</Text>
          <Text style={styles.cardText}>SDK 初始化: {sdkReady ? "已完成" : "未完成"}</Text>
          <Text style={styles.statusBlock}>{statusText}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前位置</Text>
          <Text style={styles.cardText}>
            {currentLocation
              ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
              : "尚未获取"}
          </Text>
          <Text style={styles.cardHint}>
            终点已固定为天安门，用于模拟导航验证。
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => void initSdk()}
            disabled={initializing}
          >
            <Text style={styles.buttonText}>
              {initializing ? "初始化中..." : "同意隐私并初始化"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton, !sdkReady && styles.disabledButton]}
            onPress={() => void refreshLocation()}
            disabled={!sdkReady}
          >
            <Text style={styles.buttonText}>刷新当前位置</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !currentLocation && styles.disabledButton]}
            onPress={() => void startNavigation()}
            disabled={!currentLocation}
          >
            <Text style={styles.buttonText}>开始模拟导航</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• `setPrivacyConfig` / `initSDK` 启动链路</Text>
          <Text style={styles.feature}>• 定位权限申请和 `getCurrentLocation`</Text>
          <Text style={styles.feature}>• `NaviView.startNavigation` / `stopNavigation`</Text>
          <Text style={styles.feature}>• Android 顶部状态栏、锚点、路口模型、车道信息等 UI props</Text>
          <Text style={styles.feature}>• iOS `driveViewEdgePadding` / `screenAnchor` / `showBackupRoute`</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "#0f172a",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#16304d",
    color: "#8ec5ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    marginTop: 16,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#f8fafc",
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24,
    color: "#cbd5e1",
  },
  card: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ef",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
  },
  cardHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },
  statusBlock: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: "#0f172a",
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#14532d",
  },
  secondaryButton: {
    backgroundColor: "#1d4ed8",
  },
  successButton: {
    backgroundColor: "#b45309",
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  feature: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    marginBottom: 6,
  },
  naviContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
});
