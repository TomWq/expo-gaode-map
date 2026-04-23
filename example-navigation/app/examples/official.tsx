import { openOfficialNaviPage } from "expo-gaode-map-navigation";
import React from "react";
import {
  Alert,
  Platform,
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
  getDemoKeyStatusLines,
  type DemoScenario,
} from "@/lib/gaode-demo";

export default function OfficialNaviExampleScreen() {
  const [loading, setLoading] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);

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

  const openRoutePage = React.useCallback(async () => {
    if (!scenario) {
      Alert.alert("尚未初始化", "请先完成 SDK 初始化");
      return;
    }

    try {
      setLoading(true);
      const ok = await openOfficialNaviPage({
        from: scenario.from,
        to: scenario.to,
        waypoints: scenario.waypoints,
        pageType: "ROUTE",
        officialNaviType: "DRIVER",
        theme: "BLUE",
        showCrossImage: true,
        showEagleMap: true,
        showVoiceSettings: true,
        showRouteStrategyPreferenceView: true,
        secondActionVisible: true,
        multipleRouteNaviMode: true,
        trafficEnabled: true,
      });
      setStatusText(ok ? "已调起官方路线页" : "官方路线页返回 false");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`打开失败: ${message}`);
      Alert.alert("打开官方路线页失败", message);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const openDirectNavi = React.useCallback(async () => {
    if (!scenario) {
      Alert.alert("尚未初始化", "请先完成 SDK 初始化");
      return;
    }

    try {
      setLoading(true);
      const ok = await openOfficialNaviPage({
        from: scenario.from,
        to: scenario.to,
        waypoints: scenario.waypoints,
        pageType: "NAVI",
        officialNaviType: "DRIVER",
        theme: "BLUE",
        startNaviDirectly: true,
        naviMode: 2,
        showCrossImage: true,
        showEagleMap: true,
        showVoiceSettings: true,
        secondActionVisible: true,
        trafficEnabled: true,
      });
      setStatusText(ok ? "已直接进入官方导航页" : "官方导航页返回 false");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`打开失败: ${message}`);
      Alert.alert("打开官方导航页失败", message);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>official</Text>
          <Text style={styles.title}>调起官方黑盒导航页面</Text>
          <Text style={styles.description}>
            这个示例验证 `openOfficialNaviPage`。你可以直接打开路线页，也可以直接进入官方导航页，对比嵌入式
            `NaviView` 和官方黑盒 UI 的差异。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前状态</Text>
          <Text style={styles.cardText}>{statusText}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>环境变量</Text>
          {getDemoKeyStatusLines().map((line) => (
            <Text key={line} style={styles.cardText}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>平台说明</Text>
          <Text style={styles.cardText}>
            当前平台: {Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : Platform.OS}
          </Text>
          <Text style={styles.cardHint}>
            Android 更接近 `showRouteActivity` 这类官方黑盒页面；iOS 会映射到对应的官方导航控制器封装。
          </Text>
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
            style={[styles.button, styles.secondaryButton, !scenario && styles.disabledButton]}
            onPress={() => void openRoutePage()}
            disabled={!scenario || loading}
          >
            <Text style={styles.buttonText}>打开官方路线页</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !scenario && styles.disabledButton]}
            onPress={() => void openDirectNavi()}
            disabled={!scenario || loading}
          >
            <Text style={styles.buttonText}>直接进入官方导航页</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• `openOfficialNaviPage` 是否可直接调起官方黑盒页面</Text>
          <Text style={styles.feature}>• 多路线、鹰眼图、语音设置等官方 UI 开关是否生效</Text>
          <Text style={styles.feature}>• 官方页面和 `NaviView` 嵌入式页面的视觉差异</Text>
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
  cardHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
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
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
});
