import React from "react";
import { Link, type Href } from "expo-router";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { EXAMPLE_ANDROID_KEY, EXAMPLE_IOS_KEY, EXAMPLE_WEB_API_KEY } from "@/exampleConfig";

type ExampleEntry = {
  href: Href;
  title: string;
  body: string;
  outcome: string;
};

type ExampleSection = {
  title: string;
  description: string;
  entries: ExampleEntry[];
};

const EXAMPLE_SECTIONS: ExampleSection[] = [
  {
    title: "官方黑盒",
    description: "最终直接打开高德官方页面，不走示例侧自定义嵌入式导航 UI。",
    entries: [
      {
        href: "/examples/official",
        title: "官方黑盒导航",
        body: "验证 `openOfficialNaviPage`，可直接调起官方路线页或官方导航页。",
        outcome: "最终页: 官方路线页 / 官方导航页",
      },
    ],
  },
  {
    title: "嵌入式导航",
    description: "最终都会进入 App 内导航页，区别主要在于前面的算路方式、UI 来源和是否允许自定义路线选择。",
    entries: [
      {
        href: "/examples/quick-start",
        title: "快速导航接入验证",
        body: "最短链路验证隐私确认、SDK 初始化、定位获取和直接启动导航。",
        outcome: "最终页: 固定嵌入式导航页",
      },
      {
        href: "/examples/official-embedded",
        title: "纯官方嵌入式 UI",
        body: "只用原始 `NaviView`，不叠自定义 HUD。主要用于观察官方嵌入式 UI 表现。",
        outcome: "最终页: 官方嵌入式导航页",
      },
      {
        href: "/examples/current-location",
        title: "当前位置直达导航",
        body: "不显式传起点，直接使用当前位置到终点开始导航。",
        outcome: "最终页: 固定嵌入式导航页",
      },
      {
        href: "/examples/independent-navigation",
        title: "独立路径规划导航",
        body: "先独立算路，再从候选路线里选一条启动导航，重点验证 `startNavigationWithIndependentPath`。",
        outcome: "最终页: 独立路径嵌入式导航页",
      },
      {
        href: "/examples/route-picker",
        title: "自定义路线选择页",
        body: "支持起点、终点、多途经点和多条候选路线，选中后再进入导航页。",
        outcome: "最终页: 自定义路线选择页 -> 嵌入式导航页",
      },
      {
        href: "/examples/ui-props",
        title: "自定义 UI 导航界面",
        body: "重点不在算路，而在基于 `NaviView` 事件自绘 HUD、车道 HUD 和路况光柱。",
        outcome: "最终页: 自定义嵌入式导航页",
      },
    ],
  },
  {
    title: "算路与联调",
    description: "更偏算路策略验证、路线匹配和事件调试，不是单纯为了看最终导航页。",
    entries: [
      {
        href: "/examples/follow-web",
        title: "跟随 Web 路线",
        body: "先用 Web API 规划路线，再把结果近似匹配成原生可导航路线。",
        outcome: "最终页: 匹配结果 + 嵌入式导航页",
      },
      {
        href: "/examples/events",
        title: "导航事件面板",
        body: "实时观察导航语音、导航信息更新、重算和到达等事件，更适合联调排错。",
        outcome: "最终页: 事件观测页 + 嵌入式导航页",
      },
    ],
  },
];

function ExampleLinkCard({ href, title, body, outcome }: ExampleEntry) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.linkCard}>
        <View style={styles.outcomeBadge}>
          <Text style={styles.outcomeBadgeText}>{outcome}</Text>
        </View>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkBody}>{body}</Text>
      </Pressable>
    </Link>
  );
}

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
            现在按“最终会打开什么页面”来分组。这样你能先判断它到底是官方黑盒、官方嵌入式，还是自定义嵌入式导航，而不是只看名字猜。
          </Text>
        </View>

        {EXAMPLE_SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
            {section.entries.map((entry) => (
              <ExampleLinkCard key={entry.title} {...entry} />
            ))}
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前环境变量</Text>
          <Text style={styles.item}>Android Key: {EXAMPLE_ANDROID_KEY ? "已配置" : "未配置"}</Text>
          <Text style={styles.item}>iOS Key: {EXAMPLE_IOS_KEY ? "已配置" : "未配置"}</Text>
          <Text style={styles.item}>Web Key: {EXAMPLE_WEB_API_KEY ? "已配置" : "未配置"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>建议阅读顺序</Text>
          <Text style={styles.item}>1. 先看“快速导航接入验证”，确认 SDK、隐私和定位链路没问题。</Text>
          <Text style={styles.item}>2. 如果你要官方页，直接看“官方黑盒导航”。</Text>
          <Text style={styles.item}>3. 如果你要自己做导航页，优先看“自定义 UI 导航界面”和“自定义路线选择页”。</Text>
          <Text style={styles.item}>4. 如果你要研究独立路径组，再看“独立路径规划导航”。</Text>
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
    marginBottom: 8,
  },
  cardDescription: {
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
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
  outcomeBadge: {
    alignSelf: "flex-start",
    marginBottom: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#dbeafe",
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1d4ed8",
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
