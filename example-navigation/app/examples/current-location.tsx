import type { ExpoGaodeMapNaviViewRef } from "expo-gaode-map-navigation";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  buildDemoScenario,
  ensureDemoSdkReady,
  formatPoint,
  type DemoScenario,
} from "@/lib/gaode-demo";
import { EmbeddedNaviView } from "@/lib/navigation-ui";
import { useHideNavigationHeader } from "@/lib/useHideNavigationHeader";

export default function CurrentLocationExampleScreen() {
  const naviRef = React.useRef<ExpoGaodeMapNaviViewRef>(null);

  const [loading, setLoading] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [showNaviView, setShowNaviView] = React.useState(false);

  useHideNavigationHeader(showNaviView);

  React.useEffect(() => {
    if (!showNaviView || !scenario) {
      return;
    }

    const timer = setTimeout(() => {
      void naviRef.current
        ?.startNavigation(null, scenario.to, 1)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          setShowNaviView(false);
          Alert.alert("启动导航失败", message);
        });
    }, 360);

    return () => clearTimeout(timer);
  }, [scenario, showNaviView]);

  const prepare = React.useCallback(async () => {
    try {
      setLoading(true);
      const currentLocation = await ensureDemoSdkReady();
      const nextScenario = buildDemoScenario(currentLocation);
      setScenario(nextScenario);
      setStatusText(
        [
          "SDK 已就绪",
          `当前位置: ${formatPoint(nextScenario.from)}`,
          `目标终点: ${formatPoint(nextScenario.to)}`,
          "本页启动导航时不会显式传入起点，而是交给原生 SDK 使用当前位置。",
        ].join("\n")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`初始化失败: ${message}`);
      Alert.alert("初始化失败", message);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopNavigation = React.useCallback(async () => {
    try {
      await naviRef.current?.stopNavigation();
    } catch {}
    setShowNaviView(false);
  }, []);

  if (showNaviView && scenario) {
    return (
      <EmbeddedNaviView
        ref={naviRef}
        style={styles.naviContainer}
        naviType={1}
        showCamera
        enableVoice
        showTrafficBar
        showTrafficButton
        showDriveCongestion
        showTrafficLightView
        laneInfoVisible
        modeCrossDisplay
        eyrieCrossDisplay
        secondActionVisible
        backupOverlayVisible
        naviStatusBarEnabled={false}
        driveViewEdgePadding={{ top: 12, left: 0, right: 0, bottom: 120 }}
        screenAnchor={{ x: 0.5, y: 0.78 }}
        onExitPress={() => void stopNavigation()}
        onNaviEnd={() => {
          void stopNavigation();
        }}
        onCalculateRouteFailure={(event) => {
          Alert.alert("导航失败", event.nativeEvent.error || "未知错误");
          void stopNavigation();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>current-location</Text>
          <Text style={styles.title}>当前位置直达导航</Text>
          <Text style={styles.description}>
            这个示例专门验证“不显式传起点”的常见业务流。初始化后只保留终点，导航开始时由原生 SDK
            直接使用当前位置作为起点。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>状态</Text>
          <Text style={styles.cardText}>{statusText}</Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => void prepare()}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "处理中..." : "初始化并生成终点"}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !scenario && styles.disabledButton]}
            onPress={() => setShowNaviView(true)}
            disabled={!scenario}
          >
            <Text style={styles.buttonText}>从当前位置开始模拟导航</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• `startNavigation(null, to, 1)` 是否能正确使用当前位置起步</Text>
          <Text style={styles.feature}>• 只需要终点的业务流是否正常</Text>
          <Text style={styles.feature}>• 嵌入式导航页在这种最简接入方式下是否稳定</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "#111827",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#132f52",
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  title: {
    marginTop: 16,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "800",
    color: "#f8fafc",
  },
  description: {
    marginTop: 10,
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
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
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
  successButton: {
    backgroundColor: "#1d4ed8",
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
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
  naviContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
