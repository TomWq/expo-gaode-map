import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { MapView, Polyline, LatLng } from 'expo-gaode-map';

export default function PolylineExample() {
  const [simplificationTolerance, setSimplificationTolerance] = useState(0);
  const [points, setPoints] = useState<LatLng[]>([]);
  
  // 生成测试数据
  useEffect(() => {
    const generatePoints = () => {
      const newPoints: LatLng[] = [];
      const baseLat = 39.9042;
      const baseLon = 116.4074;
      
      // 生成一条正弦波形状的轨迹，包含大量点 (2000个点)
      for (let i = 0; i < 2000; i++) {
        // 在纬度方向上延伸
        const latOffset = i * 0.00005; // 约 5米间距
        // 在经度方向上制造波动
        const lonOffset = Math.sin(i * 0.1) * 0.001; // 波动幅度
        
        newPoints.push({
          latitude: baseLat + latOffset,
          longitude: baseLon + lonOffset + (Math.random() - 0.5) * 0.0002 // 添加一些随机噪点
        });
      }
      setPoints(newPoints);
    };
    
    generatePoints();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Polyline 轨迹抽稀示例</Text>
        <Text style={styles.subtitle}>原始点数: {points.length}</Text>
        <Text style={styles.subtitle}>当前容差: {simplificationTolerance} 米</Text>
      </View>
      
      <MapView 
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.95, longitude: 116.41 },
          zoom: 13
        }}
      >
        <Polyline
          points={points}
          strokeColor="#0066FF"
          strokeWidth={6}
          simplificationTolerance={simplificationTolerance}
          geodesic={true}
        />
      </MapView>
      
      <View style={styles.controls}>
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>选择抽稀容差 (RDP算法):</Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, simplificationTolerance === 0 && styles.activeButton]}
            onPress={() => setSimplificationTolerance(0)}
          >
            <Text style={[styles.buttonText, simplificationTolerance === 0 && styles.activeButtonText]}>无抽稀</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, simplificationTolerance === 2 && styles.activeButton]}
            onPress={() => setSimplificationTolerance(2)}
          >
            <Text style={[styles.buttonText, simplificationTolerance === 2 && styles.activeButtonText]}>2米</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, simplificationTolerance === 5 && styles.activeButton]}
            onPress={() => setSimplificationTolerance(5)}
          >
            <Text style={[styles.buttonText, simplificationTolerance === 5 && styles.activeButtonText]}>5米</Text>
          </TouchableOpacity>
          
           <TouchableOpacity 
            style={[styles.button, simplificationTolerance === 10 && styles.activeButton]}
            onPress={() => setSimplificationTolerance(10)}
          >
            <Text style={[styles.buttonText, simplificationTolerance === 10 && styles.activeButtonText]}>10米</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>
          注意：容差越大，保留的关键点越少，线条越平滑但细节丢失越多。
          对于长轨迹（如几千个点），开启抽稀可显著提升渲染性能。
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  map: {
    flex: 1,
  },
  controls: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingBottom: 30,
  },
  labelRow: {
    marginBottom: 10,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 70,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#fff',
  },
  description: {
    fontSize: 12,
    color: '#999',
    textAlign: 'left',
    lineHeight: 18,
  },
});
