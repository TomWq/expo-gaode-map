import {
  EmbeddedNaviView,
  type NaviViewRef,
} from "expo-gaode-map-navigation";
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

interface UiConfig {
  showUIElements: boolean;
  showDefaultHud: boolean;
  showDefaultLaneHud: boolean;
  hideLaneHudWhenCrossVisible: boolean;
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
  showBackupRoute: boolean;
  showEagleMap: boolean;
}

const FULL_UI_CONFIG: UiConfig = {
  showUIElements: true,
  showDefaultHud: true,
  showDefaultLaneHud: true,
  hideLaneHudWhenCrossVisible: true,
  showTrafficBar: true,
  showTrafficButton: true,
  showDriveCongestion: true,
  showTrafficLightView: true,
  showCompassEnabled: true,
  laneInfoVisible: true,
  realCrossDisplay: true,
  modeCrossDisplay: true,
  eyrieCrossDisplay: true,
  secondActionVisible: true,
  backupOverlayVisible: true,
  naviStatusBarEnabled: true,
  showBackupRoute: true,
  showEagleMap: false,
};

const MINIMAL_UI_CONFIG: UiConfig = {
  showUIElements: false,
  showDefaultHud: false,
  showDefaultLaneHud: false,
  hideLaneHudWhenCrossVisible: false,
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
  showBackupRoute: false,
  showEagleMap: false,
};

const ANDROID_TOP_CONFIG: UiConfig = {
  ...FULL_UI_CONFIG,
  showEagleMap: false,
};

const UI_CONFIG_LABELS: Record<keyof UiConfig, string> = {
  showUIElements: "显示官方导航界面元素",
  showDefaultHud: "显示自绘顶部 HUD",
  showDefaultLaneHud: "显示自绘车道 HUD",
  hideLaneHudWhenCrossVisible: "大图出现时隐藏自绘车道 HUD",
  showTrafficBar: "显示路况光柱",
  showTrafficButton: "显示交通按钮",
  showDriveCongestion: "显示前方拥堵气泡",
  showTrafficLightView: "显示红绿灯倒计时气泡",
  showCompassEnabled: "显示指南针",
  laneInfoVisible: "显示车道信息",
  realCrossDisplay: "显示实景路口大图",
  modeCrossDisplay: "显示 3D 路口大图",
  eyrieCrossDisplay: "显示鹰眼路口图",
  secondActionVisible: "显示辅助操作区",
  backupOverlayVisible: "显示备选路线覆盖物",
  naviStatusBarEnabled: "启用官方导航状态栏",
  showBackupRoute: "显示备选路线",
  showEagleMap: "显示鹰眼小地图",
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

export default function UiPropsExampleScreen() {
  const naviRef = React.useRef<NaviViewRef>(null);

  const [loading, setLoading] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const [uiConfig, setUiConfig] = React.useState<UiConfig>(FULL_UI_CONFIG);
  const isAndroid = Platform.OS === "android";

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
          showDefaultHud={uiConfig.showDefaultHud}
          showDefaultLaneHud={uiConfig.showDefaultLaneHud}
          hideLaneHudWhenCrossVisible={uiConfig.hideLaneHudWhenCrossVisible}
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
          modeCrossDisplay={uiConfig.modeCrossDisplay}
          eyrieCrossDisplay={uiConfig.eyrieCrossDisplay}
          secondActionVisible={uiConfig.secondActionVisible}
          backupOverlayVisible={uiConfig.backupOverlayVisible}
          naviStatusBarEnabled={isAndroid ? false : uiConfig.naviStatusBarEnabled}
          {...(!isAndroid
            ? {
                lockZoom: 18,
                lockTilt: 35,
                pointToCenter: { x: 0.5, y: 0.72 },
                driveViewEdgePadding: { top: 12, left: 0, right: 0, bottom: 120 },
                screenAnchor: { x: 0.5, y: uiConfig.showUIElements ? 0.78 : 0.68 },
              }
            : {})}
          hideNativeTopInfoLayout={isAndroid}
          showBackupRoute={uiConfig.showBackupRoute}
          showEagleMap={uiConfig.showEagleMap}
          lineWidth={10}
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>导航 UI 示例</Text>
          <Text style={styles.title}>嵌入式导航 UI 与自定义顶部信息栏示例</Text>
          <Text style={styles.description}>
            这个页面不是单纯展示高德官方黑盒导航，而是演示“原生导航视图 + 自定义顶部 HUD”的组合方案。
            你可以在这里同时验证 Android 顶部信息区、路口图、辅助信息区，以及 iOS 侧
            `showUIElements`、`screenAnchor`、`showBackupRoute` 这类接口是否正常生效。
          </Text>
          <Text style={styles.heroHint}>
            当前示例中，Android 会默认隐藏原生顶部信息卡片，改为使用我们自己绘制的顶部信息栏；
            路口大图出现时，这个顶部信息栏也会切换为更窄的简要模式。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页说明</Text>
          <Text style={styles.feature}>• 导航地图本体仍然来自高德原生 `NaviView`。</Text>
          <Text style={styles.feature}>• 顶部转向信息栏是我们自定义绘制的，不是高德官方默认顶部卡片。</Text>
          <Text style={styles.feature}>• “官方 UI 开关”和“自绘 HUD 开关”是两套配置，分别控制原生界面和我们自绘层。</Text>
          <Text style={styles.feature}>• 这个示例的目的，是验证两端 UI 控制接口和自定义 HUD 联动是否正常。</Text>
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
            onPress={() => setUiConfig(FULL_UI_CONFIG)}
          >
            <Text style={styles.buttonText}>套用完整 UI 预设</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setUiConfig(MINIMAL_UI_CONFIG)}
          >
            <Text style={styles.buttonText}>套用极简 UI 预设</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setUiConfig(ANDROID_TOP_CONFIG)}
          >
            <Text style={styles.buttonText}>套用 Android 顶部排查预设</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !scenario && styles.disabledButton]}
            onPress={() => setShowNaviView(true)}
            disabled={!scenario}
          >
          <Text style={styles.buttonText}>按当前配置开始导航</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>主要调试开关</Text>
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showUIElements}
            value={uiConfig.showUIElements}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showUIElements: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showDefaultHud}
            value={uiConfig.showDefaultHud}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showDefaultHud: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showDefaultLaneHud}
            value={uiConfig.showDefaultLaneHud}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showDefaultLaneHud: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.hideLaneHudWhenCrossVisible}
            value={uiConfig.hideLaneHudWhenCrossVisible}
            onValueChange={(value) =>
              setUiConfig((current) => ({ ...current, hideLaneHudWhenCrossVisible: value }))
            }
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showTrafficBar}
            value={uiConfig.showTrafficBar}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showTrafficBar: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showTrafficButton}
            value={uiConfig.showTrafficButton}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showTrafficButton: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showDriveCongestion}
            value={uiConfig.showDriveCongestion}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showDriveCongestion: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showTrafficLightView}
            value={uiConfig.showTrafficLightView}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showTrafficLightView: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showCompassEnabled}
            value={uiConfig.showCompassEnabled}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showCompassEnabled: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.laneInfoVisible}
            value={uiConfig.laneInfoVisible}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, laneInfoVisible: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.realCrossDisplay}
            value={uiConfig.realCrossDisplay}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, realCrossDisplay: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.modeCrossDisplay}
            value={uiConfig.modeCrossDisplay}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, modeCrossDisplay: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.eyrieCrossDisplay}
            value={uiConfig.eyrieCrossDisplay}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, eyrieCrossDisplay: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.secondActionVisible}
            value={uiConfig.secondActionVisible}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, secondActionVisible: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.backupOverlayVisible}
            value={uiConfig.backupOverlayVisible}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, backupOverlayVisible: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showBackupRoute}
            value={uiConfig.showBackupRoute}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showBackupRoute: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.showEagleMap}
            value={uiConfig.showEagleMap}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, showEagleMap: value }))}
          />
          <ConfigSwitchRow
            label={UI_CONFIG_LABELS.naviStatusBarEnabled}
            value={uiConfig.naviStatusBarEnabled}
            onValueChange={(value) => setUiConfig((current) => ({ ...current, naviStatusBarEnabled: value }))}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• Android 顶部信息区是否被错误偏移或遮挡</Text>
          <Text style={styles.feature}>• 路口大图出现时，自定义顶部信息栏是否会切换为收窄模式</Text>
          <Text style={styles.feature}>• iOS `showUIElements=false` 时自定义顶部信息栏场景是否可用</Text>
          <Text style={styles.feature}>• 两端 UI 控制接口是否真正暴露并落到原生实现</Text>
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
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
  heroHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 21,
    color: "#93c5fd",
  },
});
