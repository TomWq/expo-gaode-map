import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MapView, Marker, ExpoGaodeMapModule, LatLng, Circle, Polygon, Polyline } from 'expo-gaode-map';

/**
 * GeometryUtils 使用示例
 * 演示各种几何计算功能
 */
export default function GeometryUtilsExample() {
  const [results, setResults] = useState<string[]>([]);

  // 状态用于地图可视化
  const [circleCenter, setCircleCenter] = useState<LatLng>({ latitude: 39.9042, longitude: 116.4074 });
  const [testPoint, setTestPoint] = useState<LatLng | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([]);
  const [pathPoints, setPathPoints] = useState<LatLng[]>([]);
  const [simplifiedPath, setSimplifiedPath] = useState<LatLng[]>([]);
  const [centroid, setCentroid] = useState<LatLng | null>(null);
  const [nearestPoint, setNearestPoint] = useState<LatLng | null>(null);
  const [pointAtDist, setPointAtDist] = useState<LatLng | null>(null);
  const [bounds, setBounds] = useState<{ north: number, south: number, east: number, west: number } | null>(null);
  const [heatmapData, setHeatmapData] = useState<Array<{ latitude: number; longitude: number; intensity: number }>>([]);

  // 添加结果
  const addResult = (label: string, value: string) => {
    setResults(prev => [`${label}: ${value}`, ...prev.slice(0, 49)]); // 保留最近50条
  };

  // 示例1: 计算两点距离
  const testDistanceBetweenCoordinates = () => {
    const coord1: LatLng = { latitude: 39.9042, longitude: 116.4074 }; // 北京
    const coord2: LatLng = { latitude: 31.2304, longitude: 121.4737 }; // 上海
    const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(coord1, coord2);
    addResult('两点距离北京到上海', `${(distance / 1000).toFixed(2)} km`);
  };

  // 示例2: 坐标转换
  const testCoordinateConvert = async () => {
    const gpsCoord = { latitude: 39.9042, longitude: 116.4074 }; // 北京 GPS
    const converted = await ExpoGaodeMapModule.coordinateConvert(gpsCoord, 0); // 0 为 GPS
    addResult('GPS转高德', `${converted.latitude.toFixed(6)}, ${converted.longitude.toFixed(6)}`);
  };

  // 示例3: 判断点是否在圆内
  const testIsPointInCircle = () => {
    const center = { latitude: 39.9042, longitude: 116.4074 };
    const point = { latitude: 39.91, longitude: 116.41 };
    const radius = 5000; // 5km
    setCircleCenter(center);
    setTestPoint(point);
    const isInside = ExpoGaodeMapModule.isPointInCircle(point, center, radius);
    addResult('点在圆内', isInside ? '是' : '否');
  };

  // 示例4: 判断点是否在多边形内 & 计算面积 & 计算质心
  const testPolygonUtils = () => {
    const polygon = [
      { latitude: 39.92, longitude: 116.38 },
      { latitude: 39.92, longitude: 116.42 },
      { latitude: 39.88, longitude: 116.42 },
      { latitude: 39.88, longitude: 116.38 },
    ];
    const point = { latitude: 39.90, longitude: 116.40 };
    setPolygonPoints(polygon);
    setTestPoint(point);

    const isInside = ExpoGaodeMapModule.isPointInPolygon(point, polygon);
    const area = ExpoGaodeMapModule.calculatePolygonArea(polygon);
    const ctr = ExpoGaodeMapModule.calculateCentroid(polygon);
    setCentroid(ctr);

    addResult('多边形内', isInside ? '是' : '否');
    addResult('多边形面积', `${(area / 1000000).toFixed(2)} km²`);
    if (ctr) addResult('多边形质心', `${ctr.latitude.toFixed(4)}, ${ctr.longitude.toFixed(4)}`);
  };

  // 示例5: 路径相关 (抽稀、长度、最近点、边界)
  const testPathUtils = () => {
    // 模拟一段复杂的路径
    const originalPath = [
      { latitude: 39.99, longitude: 116.30 },
      { latitude: 39.991, longitude: 116.301 },
      { latitude: 39.992, longitude: 116.302 },
      { latitude: 39.98, longitude: 116.35 },
      { latitude: 39.97, longitude: 116.40 },
      { latitude: 39.90, longitude: 116.45 },
    ];
    setPathPoints(originalPath);

    // 1. 长度
    const length = ExpoGaodeMapModule.calculatePathLength(originalPath);
    addResult('路径长度', `${(length / 1000).toFixed(2)} km`);

    // 2. 抽稀 (容差 100 米)
    const simplified = ExpoGaodeMapModule.simplifyPolyline(originalPath, 100);
    setSimplifiedPath(simplified);
    addResult('抽稀后点数', `${simplified.length} (原 ${originalPath.length})`);

    // 3. 最近点
    const target = { latitude: 39.985, longitude: 116.32 };
    setTestPoint(target);
    const nearest = ExpoGaodeMapModule.getNearestPointOnPath(originalPath, target);
    if (nearest) {
      setNearestPoint({ latitude: nearest.latitude, longitude: nearest.longitude });
      addResult('距路径最近', `${nearest.distanceMeters.toFixed(1)} m`);
    }

    // 4. 指定距离的点 (5km 处)
    const ptAtDist = ExpoGaodeMapModule.getPointAtDistance(originalPath, 5000);
    if (ptAtDist) {
      setPointAtDist({ latitude: ptAtDist.latitude, longitude: ptAtDist.longitude });
      addResult('5km 处角度', `${ptAtDist.angle.toFixed(1)}°`);
    }

    // 5. 边界
    const bnds = ExpoGaodeMapModule.calculatePathBounds(originalPath);
    if (bnds) {
      setBounds({ north: bnds.north, south: bnds.south, east: bnds.east, west: bnds.west });
      addResult('路径范围', `N:${bnds.north.toFixed(2)} S:${bnds.south.toFixed(2)}`);
    }

    // 6. GeoHash
    const hash = ExpoGaodeMapModule.encodeGeoHash(target, 10);
    addResult('GeoHash', hash);

    // 7. 解析 Polyline
    const encodedStr = '116.40,39.90;116.41,39.91';
    const parsed = ExpoGaodeMapModule.parsePolyline(encodedStr);
    addResult('解析点数', `${parsed.length}`);

    // 8. 矩形面积
    const sw = { latitude: 39.88, longitude: 116.38 };
    const ne = { latitude: 39.92, longitude: 116.42 };
    const rectArea = ExpoGaodeMapModule.calculateRectangleArea(sw, ne);
    addResult('矩形面积', `${(rectArea / 1000000).toFixed(2)} km²`);
  };

  // 示例6: GeoHash
  const testGeoHash = () => {
    const coord = { latitude: 39.9042, longitude: 116.4074 };
    const hash = ExpoGaodeMapModule.encodeGeoHash(coord, 10);
    addResult('GeoHash', hash);
  };

  // 示例7: 解析 Polyline 字符串 (包含对象兼容性测试)
  const testParsePolyline = () => {
    // 测试1: 纯字符串
    const str = "116.397428,39.90923;116.397428,39.90823;116.398428,39.90823";
    const points = ExpoGaodeMapModule.parsePolyline(str);
    addResult('解析字符串', `得到 ${points.length} 个点`);

    // 测试2: 对象格式 { polyline: '...' }
    const obj = { polyline: "116.40,39.90;116.41,39.91;116.42,39.92" };
    const points2 = ExpoGaodeMapModule.parsePolyline(obj);
    setPathPoints(points2);
    addResult('解析对象', `得到 ${points2.length} 个点`);
  };

  // 示例8: 瓦片与像素转换
  const testTileUtils = () => {
    const coord = { latitude: 39.9042, longitude: 116.4074 };
    const zoom = 15;

    // 1. 经纬度 -> 瓦片
    const tile = ExpoGaodeMapModule.latLngToTile(coord, zoom);
    if (tile) {
      addResult('瓦片坐标(z=15)', `x:${tile.x} y:${tile.y}`);
      
      // 2. 瓦片 -> 经纬度 (反向验证)
      const backCoord = ExpoGaodeMapModule.tileToLatLng(tile);
      if (backCoord) {
        addResult('瓦片转回经纬度', `${backCoord.latitude.toFixed(4)},${backCoord.longitude.toFixed(4)}`);
      }
    }

    // 3. 经纬度 -> 像素
    const pixel = ExpoGaodeMapModule.latLngToPixel(coord, zoom);
    if (pixel) {
      addResult('像素坐标', `x:${Math.round(pixel.x)} y:${Math.round(pixel.y)}`);
      
      // 4. 像素 -> 经纬度
      const backCoord = ExpoGaodeMapModule.pixelToLatLng(pixel, zoom);
      if (backCoord) {
        addResult('像素转回经纬度', `${backCoord.latitude.toFixed(4)},${backCoord.longitude.toFixed(4)}`);
      }
    }
  };

  // 示例9: 批量地理围栏 & 热力图网格
  const testAdvancedUtils = () => {
    const point = { latitude: 39.90, longitude: 116.40 };
    
    // 1. 批量地理围栏
    const polygons = [
      // 区域1: 故宫附近
      [{ latitude: 39.92, longitude: 116.39 }, { latitude: 39.92, longitude: 116.40 }, { latitude: 39.91, longitude: 116.40 }, { latitude: 39.91, longitude: 116.39 }],
      // 区域2: 天安门附近 (包含测试点)
      [{ latitude: 39.91, longitude: 116.39 }, { latitude: 39.91, longitude: 116.41 }, { latitude: 39.89, longitude: 116.41 }, { latitude: 39.89, longitude: 116.39 }],
    ];
    
    const index = ExpoGaodeMapModule.findPointInPolygons(point, polygons);
    addResult('批量围栏检测', index === -1 ? '未在任何区域' : `命中区域索引: ${index}`);

    // 2. 热力图网格生成
    const mockPoints: Array<LatLng & { weight?: number }> = [];
    for(let i=0; i<50; i++) {
      mockPoints.push({
        latitude: 39.90 + (Math.random() - 0.5) * 0.1,
        longitude: 116.40 + (Math.random() - 0.5) * 0.1,
        weight: Math.random() * 10
      });
    }
    
    const startTime = Date.now();
    const grid = ExpoGaodeMapModule.generateHeatmapGrid(mockPoints, 500); // 500米网格
    const duration = Date.now() - startTime;
    
    setHeatmapData(grid);
    addResult('网格聚合完成', `生成 ${grid.length} 个点, 耗时 ${duration}ms`);
  };

  // 运行所有测试
  const runAllTests = async () => {
    setResults([]);
    testDistanceBetweenCoordinates();
    testIsPointInCircle();
    testPolygonUtils();
    testPathUtils();
    testGeoHash();
    testParsePolyline();
    testTileUtils();
    testAdvancedUtils();
    await testCoordinateConvert();
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.9042, longitude: 116.4074 },
          zoom: 11,
        }}
      >
        {/* 1. 圆形展示 */}
        {circleCenter && (
          <Circle
            center={circleCenter}
            radius={5000}
            fillColor="#8800FF33"
            strokeColor="#8800FF"
            strokeWidth={2}
          />
        )}

        {/* 2. 多边形展示 */}
        {polygonPoints.length > 0 && (
          <Polygon
            points={polygonPoints}
            fillColor="#FF000033"
            strokeColor="#FF0000"
            strokeWidth={2}
          />
        )}

        {/* 3. 原始路径展示 */}
        {pathPoints.length > 0 && (
          <Polyline
            points={pathPoints}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}

        {/* 4. 简化路径展示 (虚线/不同颜色) */}
        {simplifiedPath.length > 0 && (
          <Polyline
            points={simplifiedPath}
            strokeColor="#34C759"
            strokeWidth={2}
          />
        )}

        {/* 5. 各种标记点 */}
        {testPoint && <Marker position={testPoint} title="测试点" pinColor="yellow" />}
        {centroid && <Marker position={centroid} title="质心" pinColor="purple" />}
        {nearestPoint && <Marker position={nearestPoint} title="最近点" pinColor="green" />}
        {pointAtDist && <Marker position={pointAtDist} title="5km点" pinColor="orange" />}

        {/* 7. 热力图模拟点 */}
        {heatmapData.map((pt, i) => (
          <Circle
            key={`heat-${i}`}
            center={{ latitude: pt.latitude, longitude: pt.longitude }}
            radius={250}
            fillColor={`rgba(255, 0, 0, ${Math.min(pt.intensity / 10, 0.8)})`}
            strokeWidth={0}
          />
        ))}

        {/* 8. 边界矩形 */}
        {bounds && (
          <Polygon
            points={[
              { latitude: bounds.north, longitude: bounds.west },
              { latitude: bounds.north, longitude: bounds.east },
              { latitude: bounds.south, longitude: bounds.east },
              { latitude: bounds.south, longitude: bounds.west },
            ]}
            strokeColor="#000"
            strokeWidth={1}
            fillColor="#00000011"
          />
        )}
      </MapView>

      <View style={styles.overlay}>
        <Text style={styles.title}>几何运算全集 (C++ 引擎)</Text>

        <ScrollView style={styles.resultsContainer} indicatorStyle="black">
          {results.length === 0 ? (
            <Text style={styles.emptyText}>点击下方按钮开始测试</Text>
          ) : (
            results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultText}>{result}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={runAllTests}>
              <Text style={styles.buttonText}>一键测试全部</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testDistanceBetweenCoordinates}><Text style={styles.buttonText}>距离</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testCoordinateConvert}><Text style={styles.buttonText}>坐标转换</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testIsPointInCircle}><Text style={styles.buttonText}>圆判断</Text></TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testPolygonUtils}><Text style={styles.buttonText}>多边形全家桶</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testPathUtils}><Text style={styles.buttonText}>路径全家桶</Text></TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testGeoHash}><Text style={styles.buttonText}>GeoHash</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testParsePolyline}><Text style={styles.buttonText}>解析路径</Text></TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={testTileUtils}><Text style={styles.buttonText}>瓦片/像素</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={testAdvancedUtils}><Text style={styles.buttonText}>围栏/热力图</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 30, // 移动到下方，避免挡住地图中心
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  resultsContainer: { maxHeight: 150, marginBottom: 15 },
  resultItem: {
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  resultText: { fontSize: 13, color: '#555', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 20 },
  buttonContainer: { gap: 8 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: { backgroundColor: '#34C759' },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 12 },
});
