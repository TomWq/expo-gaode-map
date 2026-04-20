import React from "react";
import { Link } from "expo-router";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { EXAMPLE_ANDROID_KEY, EXAMPLE_IOS_KEY, EXAMPLE_WEB_API_KEY } from "@/exampleConfig";

export default function ExampleCenterScreen() {
  const openDocs = React.useCallback(() => {
    void Linking.openURL("https://tomwq.github.io/expo-gaode-map/api/navigation.html");
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>示例中心</Text>
          <Text style={styles.subtitle}>
            这里把导航相关的几个关键能力都拆成独立页面，方便你逐项验证官方黑盒、嵌入式导航、独立路径组和
            UI props。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>示例入口</Text>

          <Link href="/examples/quick-start" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>快速导航接入验证</Text>
              <Text style={styles.linkBody}>
                单独验证隐私确认、SDK 初始化、定位获取和模拟导航启动链路，不再作为默认首页展示。
              </Text>
            </Pressable>
          </Link>

          <Link href="/examples/official" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>官方黑盒导航</Text>
              <Text style={styles.linkBody}>
                验证 `openOfficialNaviPage`，直接调起官方路线页或官方导航页。
              </Text>
            </Pressable>
          </Link>

          <Link href="/examples/official-embedded" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>纯官方嵌入式 UI</Text>
              <Text style={styles.linkBody}>
                只使用原始 `NaviView`，不叠自定义 HUD。当前主要用于验证 Android 官方嵌入式 UI 的异常现象，不建议作为生产方案。
              </Text>
            </Pressable>
          </Link>

          {/* <Link href="/examples/independent" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>独立算路避让预览</Text>
              <Text style={styles.linkBody}>
                先验证避让预览是否正确，再检测当前平台是否支持把结果真正用于独立导航。
              </Text>
            </Pressable>
          </Link> */}

          <Link href="/examples/independent-navigation" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>独立路径规划导航</Text>
              <Text style={styles.linkBody}>
                专门演示 `independentDriveRoute` 和 `startNavigationWithIndependentPath` 的完整启动链路。
              </Text>
            </Pressable>
          </Link>

          <Link href="/examples/follow-web" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>跟随 Web 路线</Text>
              <Text style={styles.linkBody}>
                先走 Web API 规划，再把结果近似匹配成原生可导航路线。
              </Text>
            </Pressable>
          </Link>

          <Link href="/examples/current-location" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>当前位置直达导航</Text>
              <Text style={styles.linkBody}>
                不显式传起点，直接用当前位置到终点开始模拟导航。
              </Text>
            </Pressable>
          </Link>

          <Link href="/examples/route-picker" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>路线选择后再导航</Text>
              <Text style={styles.linkBody}>
                先拿到原生独立路径组，再手动选择其中一条真实可导航路线启动。
              </Text>
            </Pressable>
          </Link>

          <Link href="/examples/events" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>导航事件面板</Text>
              <Text style={styles.linkBody}>
                实时观察导航语音、导航信息更新、重算和到达等事件，适合联调排错。
              </Text>
            </Pressable>
          </Link>

          <Link href="/examples/ui-props" asChild>
            <Pressable style={styles.linkCard}>
              <Text style={styles.linkTitle}>自定义 UI 导航界面</Text>
              <Text style={styles.linkBody}>
                展示如何基于 `NaviView` 事件自绘顶部 HUD、车道 HUD、路况光柱和嵌入式地图聚焦。
              </Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前环境变量</Text>
          <Text style={styles.item}>Android Key: {EXAMPLE_ANDROID_KEY ? "已配置" : "未配置"}</Text>
          <Text style={styles.item}>iOS Key: {EXAMPLE_IOS_KEY ? "已配置" : "未配置"}</Text>
          <Text style={styles.item}>Web Key: {EXAMPLE_WEB_API_KEY ? "已配置" : "未配置"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>下一步</Text>
          <Text style={styles.item}>1. 复制 `example-navigation/.env.example` 为 `.env`。</Text>
          <Text style={styles.item}>2. 填入 `EXPO_PUBLIC_AMAP_ANDROID_KEY` / `EXPO_PUBLIC_AMAP_IOS_KEY`。</Text>
          <Text style={styles.item}>3. 在 `example-navigation` 下执行 `npx expo prebuild`。</Text>
          <Text style={styles.item}>4. 再执行 `npx expo run:android` 或 `npx expo run:ios`。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前工程已接入内容</Text>
          <Text style={styles.item}>• 本地依赖：`file:../packages/navigation`</Text>
          <Text style={styles.item}>• Config Plugin：`expo-gaode-map-navigation`</Text>
          <Text style={styles.item}>• iOS 后台定位：已在插件配置里开启</Text>
          <Text style={styles.item}>• 快速接入验证页：`app/examples/quick-start.tsx`</Text>
        </View>

        <Pressable style={styles.button} onPress={openDocs}>
          <Text style={styles.buttonText}>打开导航文档</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#111827",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#f8fafc",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: "#cbd5e1",
  },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  item: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
    marginBottom: 6,
  },
  linkCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe3ef",
    backgroundColor: "#f8fafc",
    padding: 16,
    marginBottom: 12,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  linkBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#1d4ed8",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
