import React from 'react';
import { Link } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EXAMPLE_REGISTRY, EXAMPLE_SECTIONS } from '../exampleCatalog';
import {
  EXAMPLE_ANDROID_KEY,
  EXAMPLE_IOS_KEY,
  EXAMPLE_WEB_API_KEY,
} from '../exampleConfig';

function ExampleLinkCard({
  id,
}: {
  id: keyof typeof EXAMPLE_REGISTRY;
}) {
  const entry = EXAMPLE_REGISTRY[id];

  return (
    <Link href={`/examples/${id}`} asChild>
      <Pressable style={styles.linkCard}>
        <View style={styles.outcomeBadge}>
          <Text style={styles.outcomeBadgeText}>{entry.outcome}</Text>
        </View>
        <Text style={styles.linkTitle}>{entry.title}</Text>
        <Text style={styles.linkBody}>{entry.description}</Text>
      </Pressable>
    </Link>
  );
}

export default function ExampleCenterScreen() {
  const openDocs = React.useCallback(() => {
    void Linking.openURL('https://tomwq.github.io/expo-gaode-map/');
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>示例中心</Text>
          <Text style={styles.subtitle}>
            现在按场景和结果分组。你可以先判断会看到什么，再跳转到具体示例，不用在单页大列表里来回找。
          </Text>
        </View>

        {EXAMPLE_SECTIONS.map((section) => (
          <View key={section.key} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
            {section.entries.map((id) => (
              <ExampleLinkCard key={id} id={id} />
            ))}
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>当前环境变量</Text>
          <Text style={styles.item}>Android Key: {EXAMPLE_ANDROID_KEY ? '已配置' : '未配置'}</Text>
          <Text style={styles.item}>iOS Key: {EXAMPLE_IOS_KEY ? '已配置' : '未配置'}</Text>
          <Text style={styles.item}>Web Key: {EXAMPLE_WEB_API_KEY ? '已配置' : '未配置'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>建议阅读顺序</Text>
          <Text style={styles.item}>1. 先看“隐私与初始化”，确认 SDK 和权限链路。</Text>
          <Text style={styles.item}>2. 再看“地图基础能力”与“基础覆盖物 Playground”。</Text>
          <Text style={styles.item}>3. 需要深度调试时进入“地图调试事件”和“历史综合页”。</Text>
          <Text style={styles.item}>4. 只验证接口时直接看“Web API 与搜索”。</Text>
        </View>

        <Pressable style={styles.button} onPress={openDocs}>
          <Text style={styles.buttonText}>打开完整文档</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 36,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#111827',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#cbd5e1',
  },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardDescription: {
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
  },
  item: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 6,
  },
  linkCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    backgroundColor: '#f8fafc',
    padding: 16,
    marginBottom: 12,
  },
  outcomeBadge: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#dbeafe',
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  linkBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
