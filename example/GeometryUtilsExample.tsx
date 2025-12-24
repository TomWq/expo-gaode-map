import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MapView, Marker, ExpoGaodeMapModule, LatLng, Circle, Polygon } from 'expo-gaode-map';

/**
 * GeometryUtils 使用示例
 * 演示各种几何计算功能
 */
export default function GeometryUtilsExample() {
  const [results, setResults] = useState<string[]>([]);

  //画个圆
  const [circlePoints, setCirclePoints] = useState<LatLng>();

  //画个多边形
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([]);

  // 添加结果
  const addResult = (label: string, value: string) => {
    setResults(prev => [...prev, `${label}: ${value}`]);
  };

  // 示例1: 计算两点距离
  const testDistanceBetweenCoordinates = async () => {
    try {
      const coord1: LatLng = { latitude: 39.9042, longitude: 116.4074 }; // 北京
      const coord2: LatLng = { latitude: 31.2304, longitude: 121.4737 }; // 上海

      const distance = await ExpoGaodeMapModule.distanceBetweenCoordinates(coord1, coord2);
      addResult('北京到上海距离', `${distance.toFixed(2)} 米 (${(distance / 1000).toFixed(2)} 公里)`);
    } catch (error) {
      addResult('距离计算错误', String(error));
    }
  };



  // 示例3: 判断点是否在圆内
  const testIsPointInCircle = async () => {
    try {
      const point: LatLng = { latitude: 39.92, longitude: 116.41 }; // 北京市中心附近
      const center: LatLng = { latitude: 39.9042, longitude: 116.4074 }; // 北京天安门
      const radius = 10000; // 10公里
      setCirclePoints(point)
      const isInside = await ExpoGaodeMapModule.isPointInCircle(point, center, radius);
      addResult('天安门10公里圆内', isInside ? '是' : '否');
    } catch (error) {
      addResult('圆判断错误', String(error));
    }
  };

  // 示例4: 判断点是否在多边形内
  const testIsPointInPolygon = async () => {
    try {
      const point: LatLng = { latitude: 39.915, longitude: 116.404 }; // 故宫附近
      const polygon: LatLng[] = [
        { latitude: 39.923, longitude: 116.391 }, // 西北角
        { latitude: 39.923, longitude: 116.424 }, // 东北角
        { latitude: 39.886, longitude: 116.424 }, // 东南角
        { latitude: 39.886, longitude: 116.391 }, // 西南角
      ];
      setPolygonPoints(polygon)
      const isInside = await ExpoGaodeMapModule.isPointInPolygon(point, polygon);
      addResult('故宫区域多边形内', isInside ? '是' : '否');
    } catch (error) {
      addResult('多边形判断错误', String(error));
    }
  };

  // 示例5: 计算多边形面积
  const testCalculatePolygonArea = async () => {
    try {
      const polygon: LatLng[] = [
        { latitude: 39.923, longitude: 116.391 },
        { latitude: 39.923, longitude: 116.424 },
        { latitude: 39.886, longitude: 116.424 },
        { latitude: 39.886, longitude: 116.391 },
      ];

      const area = await ExpoGaodeMapModule.calculatePolygonArea(polygon);
      addResult('矩形区域面积', `${area.toFixed(2)} 平方米 (${(area / 1000000).toFixed(2)} 平方公里)`);
    } catch (error) {
      addResult('面积计算错误', String(error));
    }
  };

  // 示例6: 计算矩形面积
  const testCalculateRectangleArea = async () => {
    try {
      const southWest: LatLng = { latitude: 39.886, longitude: 116.391 };
      const northEast: LatLng = { latitude: 39.923, longitude: 116.424 };

      const area = await ExpoGaodeMapModule.calculateRectangleArea(southWest, northEast);
      addResult('矩形面积', `${area.toFixed(2)} 平方米 (${(area / 1000000).toFixed(2)} 平方公里)`);
    } catch (error) {
      addResult('矩形面积计算错误', String(error));
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setResults([]);
    await testDistanceBetweenCoordinates();
  
    await testIsPointInCircle();
    await testIsPointInPolygon();
    await testCalculatePolygonArea();
    await testCalculateRectangleArea();
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.9042, longitude: 116.4074 },
          zoom: 12,
        }}
      >
        <Circle
          center={circlePoints || { latitude: 39.9042, longitude: 116.4074 }}
          radius={1000}
          fillColor="#8800FF00"
          strokeColor="#FFFF0000"
          strokeWidth={2}
        />
        <Polygon
          points={polygonPoints || [
           
          ]}
          fillColor="red"
          strokeColor="blue"
          strokeWidth={5}
          zIndex={99}
        />
        <Marker
          position={{ latitude: 39.9042, longitude: 116.4074 }}
          title="北京"
        />
        <Marker
          position={{ latitude: 31.2304, longitude: 121.4737 }}
          title="上海"
        />
      </MapView>

      <View style={styles.overlay}>
        <Text style={styles.title}>GeometryUtils 使用示例</Text>

        <ScrollView style={styles.resultsContainer}>
          {results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={runAllTests}
          >
            <Text style={styles.buttonText}>运行所有测试</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testDistanceBetweenCoordinates}
          >
            <Text style={styles.buttonText}>测试两点距离</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.button}
            onPress={testIsPointInCircle}
          >
            <Text style={styles.buttonText}>测试圆内判断</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testIsPointInPolygon}
          >
            <Text style={styles.buttonText}>测试多边形内判断</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testCalculatePolygonArea}
          >
            <Text style={styles.buttonText}>测试多边形面积</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testCalculateRectangleArea}
          >
            <Text style={styles.buttonText}>测试矩形面积</Text>
          </TouchableOpacity>
        </View>
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
  overlay: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    maxHeight: '70%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  resultsContainer: {
    maxHeight: 200,
    marginBottom: 10,
  },
  resultItem: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 6,
  },
  resultText: {
    fontSize: 13,
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
