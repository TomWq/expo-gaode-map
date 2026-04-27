import type { ExpoGaodeMapNaviViewRef,  } from "expo-gaode-map-navigation";
import React from "react";
import {
  Alert,
  Platform,
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

export default function UiPropsExampleScreen() {
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
        showCamera
        enableVoice
        mapViewModeType={2}
        showDefaultHud
        showDefaultLaneHud
        hideLaneHudWhenCrossVisible
        showTrafficBar
        showTrafficButton
        showDriveCongestion
        showTrafficLightView
        
        showCompassEnabled={false}
        laneInfoVisible
        realCrossDisplay
        modeCrossDisplay
        eyrieCrossDisplay
        secondActionVisible
        backupOverlayVisible
        naviStatusBarEnabled={false}
        showBackupRoute
        androidBackgroundNavigationNotificationEnabled
        iosLiveActivityEnabled
        showEagleMap={false}
        lineWidth={10}
        carImage={require("../../assets/images/customCar.png")}
        carImageSize={{ width: 50/2, height: 104/2 }}
        onExitPress={() => void stopNavigation()}
        onNaviEnd={() => {
          // void stopNavigation();
          //弹框提示导航结束
          Alert.alert("导航已结束", "是否退出导航？", [{ text: "确定", onPress: stopNavigation }, { text: "取消" }]);
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
          <Text style={styles.badge}>custom-embedded</Text>
          <Text style={styles.title}>自定义 UI 导航界面</Text>
          <Text style={styles.description}>
            这个页面展示的是“基于 `NaviView` 事件自己拼装导航界面”的参考实现：顶部 HUD、车道 HUD、
            路况光柱、路口大图联动、退出按钮，以及更适合嵌入式页面的地图聚焦。
          </Text>
          <Text style={styles.heroHint}>
            这里不再承担“逐个开关调试官方 UI”的职责。若你要验证原生嵌入式 `NaviView`
            的界面元素开关，请去第二个示例“纯官方嵌入式 UI”页面。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页展示内容</Text>
          <Text style={styles.feature}>• 默认完整自定义 UI 模式，`showUIElements=false`</Text>
          <Text style={styles.feature}>• 顶部 HUD / 车道 HUD / 路况光柱都由示例侧自行绘制</Text>
          <Text style={styles.feature}>• 起点 / 终点标记也使用示例自定义图标，便于验证原生标注替换能力</Text>
          <Text style={styles.feature}>• 路口大图出现时，顶部 HUD 自动切换为紧凑模式</Text>
          <Text style={styles.feature}>• Android / iOS 复用同一套示例封装，方便你按需二次改造</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>状态</Text>
          <Text style={styles.cardText}>{statusText}</Text>
          <Text style={styles.cardHint}>
            当前平台: {Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : Platform.OS}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>建议观察点</Text>
          <Text style={styles.feature}>• 直行时顶部 HUD 的常态布局</Text>
          <Text style={styles.feature}>• 路口大图出现时 HUD 是否自动收窄</Text>
          <Text style={styles.feature}>• 车道 HUD 是否会在大图出现时自动隐藏</Text>
          <Text style={styles.feature}>• 车辆在地图中的聚焦位置是否自然</Text>
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
            <Text style={styles.buttonText}>进入自定义 UI 导航示例</Text>
          </Pressable>
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
  heroHint: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: "#93c5fd",
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
  naviContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
