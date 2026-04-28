import { MapView, Marker } from 'expo-gaode-map';
import { searchNearby, searchPOI } from 'expo-gaode-map';
import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * POI 原生搜索 + 地图标记示例
 * 使用 expo-gaode-map 内置搜索模块进行搜索，并在地图上标记结果
 */
export default function POISearchMapNativeExample() {
  // 搜索参数
  const [keywords, setKeywords] = useState('肯德基');
  const [city, setCity] = useState('北京');
  const [location, setLocation] = useState('116.481028,39.989643'); // 望京
  const [radius, setRadius] = useState('1000');
  
  // 地图和标记
  const [mapCenter, setMapCenter] = useState({ latitude: 39.989643, longitude: 116.481028 });
  const [markers, setMarkers] = useState<Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description: string;
  }>>([]);
  
  // 结果统计
  const [resultCount, setResultCount] = useState(0);

  // 关键字搜索
  const testKeywordSearch = async () => {
    try {
      const res = await searchPOI({
        keyword: keywords,
        city: city,
        pageSize: 20,
        pageNum: 1,
      });

      setResultCount(res.total);
      
      // 转换为地图标记
      const newMarkers = res.pois.map((poi, index) => ({
        id: poi.id || `poi-${index}`,
        coordinate: {
          latitude: poi.location.latitude,
          longitude: poi.location.longitude,
        },
        title: poi.name,
        description: `${poi.address}\n${poi.tel || '暂无电话'}`,
      }));
      
      setMarkers(newMarkers);
      
      // 设置地图中心为第一个结果
      if (newMarkers.length > 0) {
        setMapCenter(newMarkers[0].coordinate);
      }
      
      Alert.alert('成功', `找到 ${res.total} 个结果，已在地图上标记前 ${newMarkers.length} 个`);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 周边搜索
  const testAroundSearch = async () => {
    try {
      const [lng, lat] = location.split(',').map(Number);
      const centerCoord = { latitude: lat, longitude: lng };
      
      const res = await searchNearby({
        keyword: keywords,
        center: centerCoord,
        radius: parseInt(radius),
        pageSize: 20,
        pageNum: 1,
      });

      setResultCount(res.total);
      
      // 转换为地图标记
      const newMarkers = res.pois.map((poi, index) => ({
        id: poi.id || `poi-${index}`,
        coordinate: {
          latitude: poi.location.latitude,
          longitude: poi.location.longitude,
        },
        title: poi.name,
        description: `${poi.address}\n距离：${poi.distance}米\n${poi.tel || '暂无电话'}`,
      }));
      
      setMarkers(newMarkers);
      
      // 设置地图中心为搜索中心点
      setMapCenter(centerCoord);
      
      Alert.alert('成功', `找到 ${res.total} 个结果，已在地图上标记前 ${newMarkers.length} 个`);
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 清除标记
  const clearMarkers = () => {
    setMarkers([]);
    setResultCount(0);
    Alert.alert('成功', '已清除所有标记');
  };

  

  return (
    <View style={styles.container}>
      {/* 地图视图 */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: mapCenter,
            zoom: 14,
          }}
          onMapPress={(e: any) => {
            console.log('地图点击:', e.nativeEvent);
          }}
        >
          {/* 搜索结果标记 */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.coordinate}
              title={marker.title}
              snippet={marker.description}
              onMarkerPress={() => {
                Alert.alert(marker.title, marker.description);
              }}
            />
          ))}
          
          {/* 周边搜索中心点标记（红色） */}
          {markers.length > 0 && location && (
            <Marker
              position={(() => {
                const [lng, lat] = location.split(',').map(Number);
                return { latitude: lat, longitude: lng };
              })()}
              title="搜索中心"
              snippet="周边搜索的中心点"
              pinColor="red"
            />
          )}
        </MapView>
        
        {/* 结果统计浮层 */}
        {resultCount > 0 && (
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>
              找到 {resultCount} 个结果
            </Text>
            <Text style={styles.resultBadgeSubtext}>
              已标记 {markers.length} 个
            </Text>
          </View>
        )}
      </View>

      {/* 控制面板 */}
      <ScrollView style={styles.controlPanel}>
        <Text style={styles.panelTitle}>🗺️ 原生搜索 + 地图标记</Text>

        {/* 关键字搜索 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 关键字搜索</Text>
          <TextInput
            style={styles.input}
            value={keywords}
            onChangeText={setKeywords}
            placeholder="搜索关键字"
          />
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="城市"
          />
          <Button
            title="🔍 搜索并标记"
            onPress={testKeywordSearch}
          />
          <Text style={styles.hint}>
            💡 使用 searchPOI() 在指定城市搜索
          </Text>
        </View>

        {/* 周边搜索 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 周边搜索</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="中心点坐标（经度,纬度）"
          />
          <TextInput
            style={styles.input}
            value={radius}
            onChangeText={setRadius}
            placeholder="搜索半径（米）"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={keywords}
            onChangeText={setKeywords}
            placeholder="搜索关键字"
          />
          <Button
            title="📍 周边搜索并标记"
            onPress={testAroundSearch}
          />
          <Text style={styles.hint}>
            💡 使用 searchNearby() 搜索周边POI
          </Text>
        </View>

        {/* 操作按钮 */}
        <View style={styles.section}>
          <Button
            title="🗑️ 清除所有标记"
            onPress={clearMarkers}
            color="#f44336"
          />
        </View>

        {/* 说明 */}
        <View style={styles.note}>
          <Text style={styles.noteTitle}>💡 使用说明：</Text>
          <Text style={styles.noteText}>
            • 关键字搜索：使用原生 searchPOI() 在指定区域搜索并标记{'\n'}
            • 周边搜索：使用原生 searchNearby() 搜索周边并标记{'\n'}
            • 红色标记：周边搜索的中心点{'\n'}
            • 蓝色标记：搜索到的 POI{'\n'}
            • 点击标记：查看详细信息{'\n'}
            • 最多显示前 20 个结果{'\n'}
            • 原生搜索性能更好，支持更多高级功能
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    height: '50%',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  resultBadge: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  resultBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  resultBadgeSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  controlPanel: {
    height: '50%',
    padding: 16,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  note: {
    backgroundColor: '#fff3e0',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#E65100',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
