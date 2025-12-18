/**
 * 事件节流测试示例
 * 
 * 用于测试和验证相机移动事件的节流优化效果
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MapView } from 'expo-gaode-map';

export default function ThrottleTestExample() {
  const [eventCount, setEventCount] = useState(0);
  const [lastEventTime, setLastEventTime] = useState<number>(0);
  const [eventInterval, setEventInterval] = useState<number>(0);
  const [eventLog, setEventLog] = useState<string[]>([]);
  
  const eventCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const handleCameraMove = () => {
    const now = Date.now();
    
    // 第一次触发时记录开始时间
    if (eventCountRef.current === 0) {
      startTimeRef.current = now;
      lastTimeRef.current = now;
    }
    
    // 计算与上次事件的间隔
    const interval = now - lastTimeRef.current;
    lastTimeRef.current = now;
    
    // 更新计数器
    eventCountRef.current += 1;
    
    // 更新状态
    setEventCount(eventCountRef.current);
    setLastEventTime(now);
    setEventInterval(interval);
    
    // 添加到日志（只保留最新 10 条）
    setEventLog(prev => {
      const newLog = `#${eventCountRef.current}: ${interval}ms`;
      return [newLog, ...prev].slice(0, 10);
    });
  };

  const handleCameraIdle = () => {
    // 相机停止移动时计算统计信息
    if (eventCountRef.current > 0) {
      const totalTime = Date.now() - startTimeRef.current;
      const avgInterval = totalTime / eventCountRef.current;
      
      setEventLog(prev => [
        `📊 停止移动 - 总计: ${eventCountRef.current} 次, 平均间隔: ${avgInterval.toFixed(0)}ms`,
        ...prev
      ].slice(0, 10));
    }
  };

  const resetStats = () => {
    eventCountRef.current = 0;
    startTimeRef.current = 0;
    lastTimeRef.current = 0;
    setEventCount(0);
    setLastEventTime(0);
    setEventInterval(0);
    setEventLog([]);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.9042, longitude: 116.4074 },
          zoom: 10,
        }}
        onCameraMove={handleCameraMove}
        onCameraIdle={handleCameraIdle}
      />
      
      <View style={styles.statsContainer}>
        <Text style={styles.title}>🎯 事件节流测试</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>触发次数</Text>
            <Text style={styles.statValue}>{eventCount}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>事件间隔</Text>
            <Text style={styles.statValue}>{eventInterval}ms</Text>
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✅ 节流优化已启用：100ms 间隔
          </Text>
          <Text style={styles.infoText}>
            💡 拖动地图测试，观察事件间隔是否 ≥ 100ms
          </Text>
        </View>
        
        <Text style={styles.logTitle}>事件日志（最近 10 条）:</Text>
        <ScrollView style={styles.logContainer}>
          {eventLog.map((log, index) => (
            <Text key={index} style={styles.logItem}>
              {log}
            </Text>
          ))}
        </ScrollView>
        
        <Text 
          style={styles.resetButton}
          onPress={resetStats}
        >
          🔄 重置统计
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '70%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  logContainer: {
    maxHeight: 150,
  },
  logItem: {
    fontSize: 12,
    color: '#666',
    paddingVertical: 4,
    fontFamily: 'monospace',
  },
  resetButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#007AFF',
    color: 'white',
    textAlign: 'center',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});