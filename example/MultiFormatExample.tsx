import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MapView, Marker, ExpoGaodeMapModule, Circle, Polygon, Polyline, LatLngPoint } from 'expo-gaode-map';

/**
 * MultiFormatExample 使用示例
 * 演示使用 [longitude, latitude] 数组格式进行所有地图操作和几何计算
 */
export default function MultiFormatExample() {
  const [results, setResults] = useState<string[]>([]);

  // 状态变量，使用数组格式 [lng, lat]
  const [circleCenter, setCircleCenter] = useState<LatLngPoint>([116.4074, 39.9042]);
  const [polygonPoints, setPolygonPoints] = useState<LatLngPoint[] | LatLngPoint[][]>([
    [116.391, 39.923],
    [116.424, 39.923],
    [116.424, 39.886],
    [116.391, 39.886],
  ]);
  const [polylinePoints] = useState<LatLngPoint[]>([
    [116.391, 39.9042],
    [116.424, 39.9042],
  ]);

  // 添加结果
  const addResult = (label: string, value: string) => {
    setResults(prev => [...prev, `${label}: ${value}`]);
  };

  // 示例1: 计算两点距离 (使用数组格式)
  const testDistanceBetweenCoordinates = () => {
    try {
      const coord1: LatLngPoint = [116.4074, 39.9042]; // 北京
      const coord2: LatLngPoint = [121.4737, 31.2304]; // 上海

      const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(coord1, coord2);
      addResult('北京到上海距离', `${distance.toFixed(2)} 米 (${(distance / 1000).toFixed(2)} 公里)`);
    } catch (error) {
      addResult('距离计算错误', String(error));
    }
  };

  // 示例2: 判断点是否在圆内 (使用数组格式)
  const testIsPointInCircle = () => {
    try {
      const point: LatLngPoint = [116.41, 39.92]; 
      const center: LatLngPoint = [116.4074, 39.9042];
      const radius = 10000; // 10公里
      
      const isInside = ExpoGaodeMapModule.isPointInCircle(point, center, radius);
      addResult('天安门10公里圆内', isInside ? '是' : '否');
      setCircleCenter(point);
    } catch (error) {
      addResult('圆判断错误', String(error));
    }
  };

  // 示例3: 判断点是否在多边形内 (使用数组格式)
  const testIsPointInPolygon = () => {
    try {
      const point: LatLngPoint = [116.404, 39.915];
      const polygon: LatLngPoint[] = [
        [116.391, 39.923],
        [116.424, 39.923],
        [116.424, 39.886],
        [116.391, 39.886],
      ];
      
      const isInside = ExpoGaodeMapModule.isPointInPolygon(point, polygon);
      addResult('故宫区域多边形内', isInside ? '是' : '否');
      setPolygonPoints(polygon);
    } catch (error) {
      addResult('多边形判断错误', String(error));
    }
  };

  // 示例4: 计算多边形面积 (使用数组格式)
  const testCalculatePolygonArea = () => {
    try {
      const polygon: LatLngPoint[] = [
        [116.391, 39.923],
        [116.424, 39.923],
        [116.424, 39.886],
        [116.391, 39.886],
      ];

      const area = ExpoGaodeMapModule.calculatePolygonArea(polygon);
      addResult('多边形面积', `${area.toFixed(2)} 平方米`);
    } catch (error) {
      addResult('面积计算错误', String(error));
    }
  };

  // 示例5: 坐标转换 (使用数组格式)
  const testCoordinateConvert = async () => {
    try {
      const gpsCoord: LatLngPoint = [116.4074, 39.9042];
      const converted = await ExpoGaodeMapModule.coordinateConvert(gpsCoord, 6);
      if (converted) {
        addResult('GPS 转高德', `[${converted.longitude.toFixed(4)}, ${converted.latitude.toFixed(4)}]`);
      }
    } catch (error) {
      addResult('转换错误', String(error));
    }
  };

  // 示例6: 嵌套格式验证 (LatLngPoint[][])
  const testNestedCoordinates = () => {
    try {
      const nestedCoords: LatLngPoint[][] = [
        [
          { longitude: 112.814617, latitude: 28.239613 },
          { longitude: 112.814275, latitude: 28.237344 },
          { longitude: 112.814532, latitude: 28.234934 },
          { longitude: 112.816562, latitude: 28.235556 },
          { longitude: 112.817139, latitude: 28.236469 },
          { longitude: 112.818624, latitude: 28.236704 },
          { longitude: 112.81966, latitude: 28.238455 },
          { longitude: 112.814617, latitude: 28.239613 }
        ],
        [
          { longitude: 112.814653, latitude: 28.234844 },
          { longitude: 112.815333, latitude: 28.232938 },
          { longitude: 112.81735, latitude: 28.234745 },
          { longitude: 112.816625, latitude: 28.235433 },
          { longitude: 112.814653, latitude: 28.234844 }
        ]
      ];

      // 测试面积计算（会自动展平）
      const area = ExpoGaodeMapModule.calculatePolygonArea(nestedCoords);
      addResult('嵌套格式面积', `${area.toFixed(2)} 平方米`);
      
      // 测试多边形显示
      setPolygonPoints(nestedCoords);
    } catch (error) {
      addResult('嵌套格式错误', String(error));
    }
  };

  // 示例7: 判定点是否在嵌套格式多边形内 (含孔洞)
  const testPointInNestedPolygon = () => {
    try {
      const nestedCoords: LatLngPoint[][] = [
        [ // 外轮廓 (顺时针)
          { longitude: 116.39, latitude: 39.92 },
          { longitude: 116.41, latitude: 39.92 },
          { longitude: 116.41, latitude: 39.90 },
          { longitude: 116.39, latitude: 39.90 },
          { longitude: 116.39, latitude: 39.92 }
        ],
        [ // 内孔 (逆时针)
          { longitude: 116.395, latitude: 39.915 },
          { longitude: 116.395, latitude: 39.905 },
          { longitude: 116.405, latitude: 39.905 },
          { longitude: 116.405, latitude: 39.915 },
          { longitude: 116.395, latitude: 39.915 }
        ]
      ];

      // 1. 在外轮廓内，但在孔洞外 (预期: true)
      const pointInMain = { longitude: 116.392, latitude: 39.91 };
      const isInMain = ExpoGaodeMapModule.isPointInPolygon(pointInMain, nestedCoords);
      
      // 2. 在孔洞内 (预期: false)
      const pointInHole = { longitude: 116.40, latitude: 39.91 };
      const isInHole = ExpoGaodeMapModule.isPointInPolygon(pointInHole, nestedCoords);
      
      // 3. 在整个多边形外 (预期: false)
      const pointOutside = { longitude: 116.42, latitude: 39.91 };
      const isOutside = ExpoGaodeMapModule.isPointInPolygon(pointOutside, nestedCoords);

      addResult('嵌套点判定-环内', isInMain ? '✅ 在多边形内' : '❌ 不在多边形内');
      addResult('嵌套点判定-孔内', isInHole ? '❌ 错误: 在孔内判定为在多边形内' : '✅ 不在多边形内(孔内排除成功)');
      addResult('嵌套点判定-环外', isOutside ? '❌ 错误: 在环外判定为在多边形内' : '✅ 不在多边形内');
      
      // 更新地图显示以便观察
      setPolygonPoints(nestedCoords);
    } catch (error) {
      addResult('嵌套判定错误', String(error));
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setResults([]);
    testDistanceBetweenCoordinates();
    testIsPointInCircle();
    testIsPointInPolygon();
    testCalculatePolygonArea();
    await testCoordinateConvert();
    testNestedCoordinates();
    testPointInNestedPolygon();
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: {
            latitude: 39.9042,
            longitude: 116.4074,
          }, 
          zoom: 12,
        }}
      >
        {/* 验证 Marker 支持数组格式 */}
        <Marker
          position={[116.4074, 39.9042]}
          title="北京 (Array)"
        />

        {/* 验证 Circle 支持数组格式 */}
        <Circle
          center={circleCenter}
          radius={2000}
          fillColor="#8800FF00"
          strokeColor="#FFFF0000"
          strokeWidth={2}
        />

        {/* 验证 Polygon 支持数组格式 */}
        <Polygon
          points={polygonPoints}
          fillColor="#88FF0000"
          strokeColor="#0000FF"
          strokeWidth={2}
        />

        {/* 验证 Polyline 支持数组格式 */}
        <Polyline
          points={polylinePoints}
          strokeColor="#FF00FF"
          strokeWidth={5}
        />
      </MapView>

      <View style={styles.overlay}>
        <Text style={styles.title}>多格式坐标验证 (全部使用 [lng, lat])</Text>

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

          <View style={styles.grid}>
            <TouchableOpacity style={styles.gridButton} onPress={testDistanceBetweenCoordinates}>
              <Text style={styles.gridButtonText}>测试距离</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridButton} onPress={testIsPointInCircle}>
              <Text style={styles.gridButtonText}>测试圆内</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridButton} onPress={testIsPointInPolygon}>
              <Text style={styles.gridButtonText}>测试多边形内</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridButton} onPress={testCalculatePolygonArea}>
              <Text style={styles.gridButtonText}>测试面积</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridButton} onPress={testNestedCoordinates}>
              <Text style={styles.gridButtonText}>测试嵌套格式</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridButton} onPress={testPointInNestedPolygon}>
              <Text style={styles.gridButtonText}>测试嵌套点判定</Text>
            </TouchableOpacity>
          </View>
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
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
    marginBottom: 10,
  },
  resultItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  gridButton: {
    width: '48%',
    padding: 10,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  gridButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
