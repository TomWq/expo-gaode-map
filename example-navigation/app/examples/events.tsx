import type { NaviViewRef } from "expo-gaode-map-navigation";
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
import { EmbeddedNaviView } from "@/lib/navigation-ui";

interface EventItem {
  id: string;
  title: string;
  detail: string;
}

export default function EventsExampleScreen() {
  const naviRef = React.useRef<NaviViewRef>(null);
  const lastInfoKeyRef = React.useRef<string>("");

  const [loading, setLoading] = React.useState(false);
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [events, setEvents] = React.useState<EventItem[]>([]);

  const appendEvent = React.useCallback((title: string, detail: string) => {
    setEvents((current) => [
      {
        id: `${Date.now()}-${current.length}`,
        title,
        detail,
      },
      ...current,
    ].slice(0, 30));
  }, []);

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
      setEvents([]);
      lastInfoKeyRef.current = "";
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
      <View style={styles.runtimeContainer}>
        <View style={styles.naviShell}>
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
            onNaviStart={() => {
              appendEvent("导航开始", "已进入模拟导航");
            }}
            onNaviEnd={() => {
              appendEvent("导航结束", "导航页已结束");
              void stopNavigation();
            }}
            onArrive={() => {
              appendEvent("到达目的地", "已触发到达事件");
            }}
            onReCalculate={(event) => {
              appendEvent("路线重算", `原因: ${event.nativeEvent.reason}`);
            }}
            onPlayVoice={(event) => {
              appendEvent("语音播报", event.nativeEvent.text);
            }}
            onNaviInfoUpdate={(event) => {
              const roadName = event.nativeEvent.currentRoadName || "未知道路";
              const remainBucket = Math.max(
                1,
                Math.round((event.nativeEvent.pathRetainDistance || 0) / 200)
              );
              const infoKey = `${roadName}-${event.nativeEvent.iconType ?? -1}-${remainBucket}`;
              if (infoKey === lastInfoKeyRef.current) {
                return;
              }
              lastInfoKeyRef.current = infoKey;
              appendEvent(
                "导航信息",
                `${roadName} / 剩余 ${event.nativeEvent.pathRetainDistance} 米 / 下条路 ${event.nativeEvent.nextRoadName || "未知"}`
              );
            }}
            onCalculateRouteFailure={(event) => {
              appendEvent("算路失败", event.nativeEvent.error || "未知错误");
              Alert.alert("导航失败", event.nativeEvent.error || "未知错误");
              void stopNavigation();
            }}
          />
        </View>

        <View style={styles.eventPanel}>
          <Text style={styles.eventPanelTitle}>事件面板</Text>
          <ScrollView contentContainerStyle={styles.eventList}>
            {events.length === 0 ? (
              <Text style={styles.emptyText}>开始导航后，这里会实时追加事件。</Text>
            ) : (
              events.map((item) => (
                <View key={item.id} style={styles.eventCard}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventDetail}>{item.detail}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>events</Text>
          <Text style={styles.title}>导航事件面板</Text>
          <Text style={styles.description}>
            这个示例专门把导航相关事件实时打出来，方便排查语音播报、导航信息更新、路线重算和导航开始/结束行为。
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
            <Text style={styles.buttonText}>开始导航并打开事件面板</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• `onNaviStart` / `onNaviEnd`</Text>
          <Text style={styles.feature}>• `onPlayVoice` 语音播报文本</Text>
          <Text style={styles.feature}>• `onNaviInfoUpdate` 实时导航信息</Text>
          <Text style={styles.feature}>• `onReCalculate` 与异常事件排查</Text>
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
  runtimeContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  naviShell: {
    flex: 1,
  },
  naviContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  eventPanel: {
    height: 260,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#dbe3ef",
    padding: 16,
  },
  eventPanelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  eventList: {
    gap: 10,
    paddingBottom: 24,
  },
  eventCard: {
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe3ef",
    padding: 12,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  eventDetail: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },
});
