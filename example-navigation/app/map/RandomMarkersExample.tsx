import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MapView,
  MapViewRef,
  Marker,
  Circle,
  ExpoGaodeMapModule,
  type ReGeocode,
  type Coordinates,
  type CameraPosition,
} from 'expo-gaode-map-navigation';
import { StyleSheet, View, Text, Button, Alert, Platform, ScrollView, ActivityIndicator, TextInput } from 'react-native';

// 北京市中心坐标
const BEIJING_CENTER = {
  latitude: 39.9042,
  longitude: 116.4074,
};

// 北京市中心区域范围（更精确）
const BEIJING_BOUNDS = {
  minLat: 39.80,  // 南
  maxLat: 40.05,  // 北
  minLng: 116.25, // 西
  maxLng: 116.55, // 东
};

interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  geoInfo: ReGeocode | null;
  loading: boolean;
}

export default function RandomMarkersExample() {
  const mapRef = useRef<MapViewRef>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [count, setCount] = useState<string>('5');
  const [isGenerating, setIsGenerating] = useState(false);
  const markerIdCounter = useRef(0);
  const [currentZoom, setCurrentZoom] = useState(11); // 记录当前缩放级别

  const [initialPosition] = useState<CameraPosition>({
    target: BEIJING_CENTER,
    zoom: 11,
  });
  
  // 根据zoom计算覆盖物的尺寸（用于Circle等）
  const getScaledSize = (baseSize: number, zoom: number) => {
    const minZoom = 9;
    const maxZoom = 18;
    const scale = Math.max(0.5, Math.min(2, (zoom - minZoom) / (maxZoom - minZoom) + 0.5));
    return Math.round(baseSize * scale);
  };
  
  // 根据zoom计算缩放比例（用于transform scale）
  const getScaleRatio = (zoom: number) => {
    const minZoom = 9;
    const maxZoom = 18;
    // zoom=9时scale=0.6, zoom=11时scale=0.8, zoom=14时scale=1.0, zoom=18时scale=1.4
    const normalized = (zoom - minZoom) / (maxZoom - minZoom); // 0 to 1
    return 0.6 + normalized * 0.8; // 0.6 to 1.4
  };

  useEffect(() => {
    // 初始化SDK
    ExpoGaodeMapModule.initSDK({
      androidKey: '8ac9e5983e34398473ecc23fec1d4adc',
      iosKey: 'b07b626eb2ce321df3ff0e9e9371f389',
    });

    // 配置逆地理编码
    ExpoGaodeMapModule.setLocatingWithReGeocode(true);
  }, []);

  // 生成北京市范围内的随机坐标
  const generateRandomCoordinate = () => {
    const lat = BEIJING_BOUNDS.minLat + Math.random() * (BEIJING_BOUNDS.maxLat - BEIJING_BOUNDS.minLat);
    const lng = BEIJING_BOUNDS.minLng + Math.random() * (BEIJING_BOUNDS.maxLng - BEIJING_BOUNDS.minLng);
    return { latitude: lat, longitude: lng };
  };

  // 使用高德Web API获取逆地理编码信息
  const getReGeocodeForCoordinate = async (lat: number, lng: number): Promise<ReGeocode | null> => {
    try {
      // 使用高德Web API获取逆地理编码
      const webApiKey = ''; // Web服务API Key
      const url = `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&key=${webApiKey}&radius=1000&extensions=base`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' && data.regeocode) {
        const regeocode = data.regeocode;
        const addressComponent = regeocode.addressComponent;
        
        const reGeocodeData: ReGeocode = {
          latitude: lat,
          longitude: lng,
          altitude: 0,
          accuracy: 0,
          heading: 0,
          speed: 0,
          timestamp: Date.now(),
          address: regeocode.formatted_address || '地址解析失败',
          country: '中国',
          province: addressComponent.province || '',
          city: addressComponent.city || addressComponent.province || '',
          district: addressComponent.district || '',
          cityCode: addressComponent.citycode || '',
          adCode: addressComponent.adcode || '',
          street: addressComponent.street || '',
          streetNumber: addressComponent.streetNumber || '',
          poiName: '',
          aoiName: '',
        };
        
        return reGeocodeData;
      } else {
        console.error('逆地理编码API返回错误:', data);
        return null;
      }
    } catch (error) {
      console.error('获取逆地理编码失败:', error);
      return null;
    }
  };

  // 生成随机标记点（优化性能）
  const handleGenerateMarkers = async () => {
    const num = parseInt(count);
    if (isNaN(num) || num < 1 || num > 50) {
      Alert.alert('错误', '请输入1-50之间的数字');
      return;
    }

    setIsGenerating(true);
    const newMarkers: MarkerData[] = [];

    // 生成坐标
    for (let i = 0; i < num; i++) {
      const coord = generateRandomCoordinate();
      newMarkers.push({
        id: `marker_${markerIdCounter.current++}`,
        latitude: coord.latitude,
        longitude: coord.longitude,
        geoInfo: null,
        loading: true,
      });
    }

    setMarkers(newMarkers);

    // 批量获取逆地理编码信息，减少状态更新频率
    const batchSize = 5; // 每批处理5个
    const updatedMarkers = [...newMarkers];
    
    for (let i = 0; i < newMarkers.length; i += batchSize) {
      const batch = newMarkers.slice(i, i + batchSize);
      
      // 并发请求一批数据
      const results = await Promise.all(
        batch.map(marker =>
          getReGeocodeForCoordinate(marker.latitude, marker.longitude)
            .then(geoInfo => ({ id: marker.id, geoInfo }))
        )
      );
      
      // 更新这批数据
      results.forEach(({ id, geoInfo }) => {
        const index = updatedMarkers.findIndex(m => m.id === id);
        if (index !== -1) {
          updatedMarkers[index] = {
            ...updatedMarkers[index],
            geoInfo,
            loading: false,
          };
        }
      });
      
      // 批量更新状态，减少渲染次数
      setMarkers([...updatedMarkers]);
      
      // 批次间小延迟，避免API请求过快
      if (i + batchSize < newMarkers.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setIsGenerating(false);
    Alert.alert('成功', `已生成 ${num} 个随机标记点`);
  };

  // 清除所有标记
  const handleClearMarkers = () => {
    if (markers.length === 0) {
      Alert.alert('提示', '没有可清除的标记');
      return;
    }
    setMarkers([]);
    Alert.alert('成功', '已清除所有标记');
  };

  // 移动到指定标记（使用useCallback避免重新创建）
  const moveToMarker = useCallback(async (marker: MarkerData) => {
    if (mapRef.current) {
      await mapRef.current.moveCamera({
        target: { latitude: marker.latitude, longitude: marker.longitude },
        zoom: 16,
      }, 300);
    }
  }, []);

  // 处理Marker点击（使用useCallback）
  const handleMarkerPress = useCallback((marker: MarkerData) => {
    if (!marker.loading && marker.geoInfo) {
      Alert.alert(
        '位置信息',
        `地址: ${marker.geoInfo.address}\n` +
        `省份: ${marker.geoInfo.province}\n` +
        `城市: ${marker.geoInfo.city}\n` +
        `区域: ${marker.geoInfo.district}\n` +
        `街道: ${marker.geoInfo.street}\n` +
        `坐标: ${marker.latitude.toFixed(6)}, ${marker.longitude.toFixed(6)}`
      );
    }
  }, []);

  // 使用useMemo缓存渲染的覆盖物，根据zoom动态调整大小
  const circleOverlays = useMemo(() => {
    const scaledRadius = getScaledSize(200, currentZoom);
    return markers.map((marker) => (
      <Circle
        key={`circle_${marker.id}`}
        center={{ latitude: marker.latitude, longitude: marker.longitude }}
        radius={scaledRadius}
        fillColor="rgba(33, 150, 243, 0.2)"
        strokeColor="#2196F3"
        strokeWidth={2}
      />
    ));
  }, [markers, currentZoom]);

  const markerOverlays = useMemo(() => {
  
    // 只渲染已加载完成且有地址信息的标记，避免Android条件渲染崩溃
    return markers
      .filter((m): m is MarkerData & { geoInfo: ReGeocode } => !m.loading && m.geoInfo !== null)
      .map((marker) => (
        <Marker
          key={marker.id}
          position={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.geoInfo.address}
          onMarkerPress={() => handleMarkerPress(marker)}
        >
          <>
            <View style={[
              styles.markerContainer,
            ]}>
              <Text style={styles.markerAddress} numberOfLines={2}>
                {marker.geoInfo.address}
              </Text>
            </View>
            <View style={styles.markerDot} />
          </>
        </Marker>
      ));
  }, [markers, handleMarkerPress, ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>北京市随机标记点示例</Text>
      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={initialPosition}
        myLocationEnabled={false}
        compassEnabled={true}
        minZoom={9}
        maxZoom={18}
        onCameraMove={({ nativeEvent }) => {
          const { cameraPosition } = nativeEvent;
          if (cameraPosition.zoom !== undefined) {
            setCurrentZoom(cameraPosition.zoom);
          }
        }}
      >
        {/* 为每个标记点添加圆形区域 */}
        {circleOverlays}
        {/* 标记点 */}
        {markerOverlays} 
      </MapView>

      <View style={styles.controlPanel}>
        <Text style={styles.infoText}>
          当前标记数: {markers.length} | 加载中: {markers.filter(m => m.loading).length} | 缩放: {currentZoom.toFixed(1)}
        </Text>
      </View>

      <ScrollView style={styles.buttonContainer} contentContainerStyle={styles.buttonContentContainer}>
        <Text style={styles.sectionTitle}>生成随机标记点</Text>
        
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>数量 (1-50):</Text>
          <TextInput
            style={styles.input}
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
            maxLength={2}
            editable={!isGenerating}
          />
        </View>

        <Button 
          title={isGenerating ? "生成中..." : "生成随机标记"} 
          onPress={handleGenerateMarkers}
          disabled={isGenerating}
          color="#4CAF50"
        />
        
        <View style={styles.buttonSpacer} />
        
        <Button 
          title="清除所有标记" 
          onPress={handleClearMarkers}
          disabled={isGenerating || markers.length === 0}
          color="#FF6347"
        />

        {markers.length > 0 && (
          <>
            <View style={styles.sectionSpacer} />
            <Text style={styles.sectionTitle}>标记列表</Text>
            <ScrollView style={styles.markerList} nestedScrollEnabled>
              {markers.map((marker, index) => (
                <View key={marker.id} style={styles.markerListItem}>
                  <View style={styles.markerListItemContent}>
                    <Text style={styles.markerListIndex}>#{index + 1}</Text>
                    {marker.loading ? (
                      <Text style={styles.markerListText}>加载中...</Text>
                    ) : (
                      <View style={styles.markerListInfo}>
                        <Text style={styles.markerListText} numberOfLines={1}>
                          {marker.geoInfo?.district || '未知区域'}
                        </Text>
                        <Text style={styles.markerListSubText} numberOfLines={1}>
                          {marker.geoInfo?.street
                            ? `${marker.geoInfo.street}${marker.geoInfo.streetNumber || ''}`
                            : marker.geoInfo?.address?.split('市')[1] || '详细地址'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Button
                    title="定位"
                    onPress={() => moveToMarker(marker)}
                    disabled={marker.loading}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.sectionSpacer} />
        <Text style={styles.tipText}>
          💡 提示:{'\n'}
          • 点击地图上的标记查看详细位置信息{'\n'}
          • 标记会显示逆地理编码后的地址{'\n'}
          • 使用"定位"按钮快速移动到指定标记
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Platform.OS === 'ios' ? 50 : 40,
    marginBottom: 10,
    color: '#333',
  },
  map: {
    flex: 1,
    minHeight: 300,
  },
  controlPanel: {
    backgroundColor: 'white',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    maxHeight: 400,
  },
  buttonContentContainer: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionSpacer: {
    height: 20,
  },
  buttonSpacer: {
    height: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  markerWrapper: {
    alignItems: 'center',
  },
  markerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: 200,
    minHeight:30,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 100,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  markerContent: {
    justifyContent: 'center',
  },
  markerAddress: {
    fontSize: 11,
    color: '#333',
    lineHeight: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  markerList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
  },
  markerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 5,
  },
  markerListItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  markerListIndex: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 10,
    width: 30,
  },
  markerListInfo: {
    flex: 1,
  },
  markerListText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  markerListSubText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    backgroundColor: '#FFF9E6',
    padding: 10,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
});
