import { NaviView, type NaviViewRef } from "expo-gaode-map-navigation";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import {
  buildDemoScenario,
  ensureDemoSdkReady,
  formatPoint,
  type DemoScenario,
} from "@/lib/gaode-demo";

interface OfficialUiConfig {
  showUIElements: boolean;
  showTrafficBar: boolean;
  showTrafficButton: boolean;
  showDriveCongestion: boolean;
  showTrafficLightView: boolean;
  showCompassEnabled: boolean;
  laneInfoVisible: boolean;
  realCrossDisplay: boolean;
  modeCrossDisplay: boolean;
  eyrieCrossDisplay: boolean;
  secondActionVisible: boolean;
  backupOverlayVisible: boolean;
  naviStatusBarEnabled: boolean;
}

const DEFAULT_CONFIG: OfficialUiConfig = {
  showUIElements: true,
  showTrafficBar: true,
  showTrafficButton: true,
  showDriveCongestion: true,
  showTrafficLightView: true,
  showCompassEnabled: true,
  laneInfoVisible: true,
  realCrossDisplay: true,
  modeCrossDisplay: Platform.OS === "android",
  eyrieCrossDisplay: true,
  secondActionVisible: true,
  backupOverlayVisible: true,
  naviStatusBarEnabled: true,
};

const MINIMAL_CONFIG: OfficialUiConfig = {
  showUIElements: true,
  showTrafficBar: false,
  showTrafficButton: false,
  showDriveCongestion: false,
  showTrafficLightView: false,
  showCompassEnabled: false,
  laneInfoVisible: false,
  realCrossDisplay: false,
  modeCrossDisplay: false,
  eyrieCrossDisplay: false,
  secondActionVisible: false,
  backupOverlayVisible: false,
  naviStatusBarEnabled: false,
};

const UI_LABELS: Record<keyof OfficialUiConfig, string> = {
  showUIElements: "显示官方界面元素",
  showTrafficBar: "显示路况光柱",
  showTrafficButton: "显示交通按钮",
  showDriveCongestion: "显示拥堵气泡",
  showTrafficLightView: "显示红绿灯倒计时气泡",
  showCompassEnabled: "显示指南针",
  laneInfoVisible: "显示车道信息",
  realCrossDisplay: "显示实景路口大图",
  modeCrossDisplay: "显示 3D 路口模型",
  eyrieCrossDisplay: "显示鹰眼路口图",
  secondActionVisible: "显示辅助操作区",
  backupOverlayVisible: "显示备选路线覆盖物",
  naviStatusBarEnabled: "启用官方导航状态栏",
};

function ConfigSwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export default function OfficialEmbeddedNaviExampleScreen() {
  const naviRef = React.useRef<NaviViewRef>(null);

  const [loading, setLoading] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const [uiConfig, setUiConfig] = React.useState<OfficialUiConfig>(DEFAULT_CONFIG);
  const visibleConfigKeys = React.useMemo(
    () =>
      (Object.keys(UI_LABELS) as Array<keyof OfficialUiConfig>).filter((key) =>
        Platform.OS === "android" ? true : key !== "modeCrossDisplay"
      ),
    []
  );

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
          "本页只使用原始 NaviView，用来验证官方嵌入式 UI 开关是否生效。",
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
          showUIElements={uiConfig.showUIElements}
          showTrafficBar={uiConfig.showTrafficBar}
          showTrafficButton={uiConfig.showTrafficButton}
          showDriveCongestion={uiConfig.showDriveCongestion}
          showTrafficLightView={uiConfig.showTrafficLightView}
          showCompassEnabled={uiConfig.showCompassEnabled}
          laneInfoVisible={uiConfig.laneInfoVisible}
          realCrossDisplay={uiConfig.realCrossDisplay}
          modeCrossDisplay={Platform.OS === "android" ? uiConfig.modeCrossDisplay : false}
          eyrieCrossDisplay={uiConfig.eyrieCrossDisplay}
          secondActionVisible={uiConfig.secondActionVisible}
          backupOverlayVisible={uiConfig.backupOverlayVisible}
          hideNativeTopInfoLayout={false}
          naviStatusBarEnabled={Platform.OS === "android" ? uiConfig.naviStatusBarEnabled : false}
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
            这个页面不叠加示例侧自定义 HUD，只保留原始 `NaviView`。
            这里是官方嵌入式界面元素的调试台，专门用来验证各类显示开关在当前宿主中的真实表现。
          </Text>
        </View>

        <View style={[styles.card, styles.warningCard]}>
          <Text style={styles.warningTitle}>当前用途</Text>
          <Text style={styles.warningText}>
            这一页是“官方 UI 开关验证页”，不是推荐的业务成品方案。
          </Text>
          <Text style={styles.warningText}>
            如果你的目标是稳定交付嵌入式导航页面，建议参考“自定义 UI 导航界面”示例页；
            如果你要验证原生嵌入式 UI 的显示边界，就在这里调这些开关。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>状态</Text>
          <Text style={styles.cardText}>{statusText}</Text>
          <Text style={styles.cardHint}>
            当前平台: {Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : Platform.OS}
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
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setUiConfig(DEFAULT_CONFIG)}
          >
            <Text style={styles.buttonText}>恢复官方默认开关</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setUiConfig(MINIMAL_CONFIG)}
          >
            <Text style={styles.buttonText}>套用极简官方 UI</Text>
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
          <Text style={styles.cardTitle}>官方 UI 控制开关</Text>
          {Platform.OS === "ios" ? (
            <Text style={styles.cardHint}>
              iOS 官方 SDK 仅提供实景路口放大图 `showCrossImage / hideCrossImage`，这里不再展示
              Android 专属的 3D 路口模型开关。
            </Text>
          ) : null}
          {visibleConfigKeys.map((key) => (
            <ConfigSwitchRow
              key={key}
              label={UI_LABELS[key]}
              value={uiConfig[key]}
              onValueChange={(value) => {
                setUiConfig((current) => ({ ...current, [key]: value }));
              }}
            />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• `showUIElements` 是否整体控制官方嵌入式界面元素</Text>
          <Text style={styles.feature}>• 路口大图、车道条、路况条、指南针等开关是否按预期生效</Text>
          <Text style={styles.feature}>• Android / iOS 在官方嵌入式 UI 下的真实差异</Text>
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
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#9a3412",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
  },
  cardHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },
  feature: {
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
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
    backgroundColor: "#334155",
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dbe3ef",
  },
  switchLabel: {
    flex: 1,
    paddingRight: 12,
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
    fontWeight: "600",
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
