import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import DrivingRouteExample from './DrivingRouteExample';
import WalkingRouteExample from './WalkingRouteExample';
import TransitRouteExample from './TransitRouteExample';
import BicyclingRouteExample from './BicyclingRouteExample';

/**
 * 路径规划示例菜单
 * 可以直接作为 App 的根组件使用
 */
export default function RouteExamplesMenu() {
  const [currentExample, setCurrentExample] = useState<string | null>(null);

  // 如果选择了某个示例，直接显示
  if (currentExample === 'driving') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentExample(null)}
        >
          <Text style={styles.backButtonText}>← 返回菜单</Text>
        </TouchableOpacity>
        <DrivingRouteExample />
      </View>
    );
  }

  if (currentExample === 'walking') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentExample(null)}
        >
          <Text style={styles.backButtonText}>← 返回菜单</Text>
        </TouchableOpacity>
        <WalkingRouteExample />
      </View>
    );
  }

  if (currentExample === 'transit') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentExample(null)}
        >
          <Text style={styles.backButtonText}>← 返回菜单</Text>
        </TouchableOpacity>
        <TransitRouteExample />
      </View>
    );
  }

  if (currentExample === 'bicycling') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentExample(null)}
        >
          <Text style={styles.backButtonText}>← 返回菜单</Text>
        </TouchableOpacity>
        <BicyclingRouteExample />
      </View>
    );
  }

  // 显示菜单
  const examples = [
    {
      id: 'driving',
      title: '🚗 驾车路径规划',
      description: '速度优先、躲避拥堵、高速优先等多种策略',
      features: ['策略32-45', '新能源车', '车牌限行', 'show_fields'],
    },
    {
      id: 'walking',
      title: '🚶 步行路径规划',
      description: '单条/多条路线、详细导航、室内算路',
      features: ['1-3条路线', '室内导航', '道路类型', '打车费用'],
    },
    {
      id: 'transit',
      title: '🚌 公交路径规划',
      description: '推荐、最经济、最少换乘等多种模式',
      features: ['9种策略', '地铁优先', '时间短', '多方案对比'],
    },
    {
      id: 'bicycling',
      title: '🚴 骑行 & 电动车',
      description: '骑行和电动车路径规划及对比',
      features: ['骑行路线', '电动车路线', '路线对比', '短途测试'],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>路径规划示例</Text>
        <Text style={styles.subtitle}>高德地图 Web API - 新版 V5</Text>
      </View>

      {examples.map((example) => (
        <TouchableOpacity
          key={example.id}
          style={styles.card}
          onPress={() => setCurrentExample(example.id)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{example.title}</Text>
          </View>
          
          <Text style={styles.cardDescription}>{example.description}</Text>
          
          <View style={styles.featuresContainer}>
            {example.features.map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.tapHint}>点击查看示例 →</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 使用提示</Text>
        <Text style={styles.infoText}>
          1. 每个示例都需要输入 Web API Key{'\n'}
          2. 可以自定义起点终点坐标{'\n'}
          3. 所有示例都符合新版 V5 API{'\n'}
          4. 详细说明请查看 README.md
        </Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1890ff',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  backButton: {
    backgroundColor: '#1890ff',
    padding: 12,
    paddingTop: 48,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  featureText: {
    fontSize: 11,
    color: '#1890ff',
  },
  tapHint: {
    fontSize: 12,
    color: '#1890ff',
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
});