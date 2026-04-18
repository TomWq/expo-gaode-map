import { NaviView, type NaviViewRef } from "expo-gaode-map-navigation";
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

import {
  buildDemoScenario,
  ensureDemoSdkReady,
  formatPoint,
  type DemoScenario,
} from "@/lib/gaode-demo";

export default function OfficialEmbeddedNaviExampleScreen() {
  const naviRef = React.useRef<NaviViewRef>(null);

  const [loading, setLoading] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [showNaviView, setShowNaviView] = React.useState(false);

  React.useEffect(() => {
    if (!showNaviView || !scenario) {
      return;
    }

    const timer = setTimeout(() => {
      void naviRef.current
        ?.startNavigation(scenario.from, scenario.to, 1)
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
          `起点: ${formatPoint(nextScenario.from)}`,
          `终点: ${formatPoint(nextScenario.to)}`,
          "本页只使用原始 NaviView，用来验证 Android 官方嵌入式导航 UI 是否正常显示。",
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
      <View style={styles.naviScreen}>
        <NaviView
          ref={naviRef}
          style={styles.naviView}
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
          hideNativeTopInfoLayout={false}
          naviStatusBarEnabled={false}
          eagleMapVisible={false}
          onNaviEnd={() => {
            void stopNavigation();
          }}
          onCalculateRouteFailure={(event) => {
            Alert.alert("导航失败", event.nativeEvent.error || "未知错误");
            void stopNavigation();
          }}
        />

        <Pressable style={styles.stopButton} onPress={() => void stopNavigation()}>
          <Text style={styles.stopButtonText}>结束示例</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>official-embedded</Text>
          <Text style={styles.title}>纯官方嵌入式 UI</Text>
          <Text style={styles.description}>
            这个页面不叠加自定义 HUD，不使用 `EmbeddedNaviView`，只保留原始 `NaviView`。适合专门验证
            Android 官方嵌入式顶部信息、路口大图、车道条、路况条和限速/电子眼气泡。
          </Text>
        </View>

        <View style={[styles.card, styles.warningCard]}>
          <Text style={styles.warningTitle}>当前结论</Text>
          <Text style={styles.warningText}>
            Android 侧官方嵌入式 `NaviView` 在当前 RN / Expo 宿主下存在显示异常：顶部信息区、路况条、限速等官方 UI
            可能与官方 demo 不一致。
          </Text>
          <Text style={styles.warningText}>
            如果你的目标是稳定交付嵌入式导航页面，建议优先使用 `EmbeddedNaviView` 或继续走自绘方案，而不是依赖这套官方嵌入式 UI。
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
            <Text style={styles.buttonText}>{loading ? "处理中..." : "初始化并生成示例路线"}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !scenario && styles.disabledButton]}
            onPress={() => setShowNaviView(true)}
            disabled={!scenario}
          >
            <Text style={styles.buttonText}>进入纯官方嵌入式导航</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• 不走 `EmbeddedNaviView`，只验证原始 `NaviView`</Text>
          <Text style={styles.feature}>• Android 官方顶部信息区是否正常显示</Text>
          <Text style={styles.feature}>• 路口大图、车道条、路况条、限速/电子眼是否按官方嵌入式 UI 展示</Text>
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
    backgroundColor: "#15314f",
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
  warningCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
  },
  cardTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  warningTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "800",
    color: "#9a3412",
  },
  warningText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#9a3412",
    marginBottom: 8,
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
  naviScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  naviView: {
    flex: 1,
  },
  stopButton: {
    position: "absolute",
    right: 18,
    bottom: 34,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
  },
  stopButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
