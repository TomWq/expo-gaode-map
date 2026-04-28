import { Ionicons } from '@expo/vector-icons';
import { CameraEvent, ExpoGaodeMapModule, LatLng, MapView, MapViewRef } from 'expo-gaode-map';
import { POI, reGeocode, searchNearby } from 'expo-gaode-map';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function TaxiLocationPicker() {
  const mapRef = useRef<MapViewRef>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialCamera, setInitialCamera] = useState<{target: LatLng, zoom: number} | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  
  const VISUAL_CENTER_RATIO = 0.5;

  const getOffsetForZoom = (z: number) => {
    const ratioGap = 0.5 - VISUAL_CENTER_RATIO;
    if (Math.abs(ratioGap) < 0.001) return 0;
    const baseOffset = 0.004 * (ratioGap / 0.2); 
    return baseOffset * Math.pow(2, 15 - z);
  };

  // 初始化标记
  const hasInitialized = useRef(false);
  const lastFetchedCoord = useRef<LatLng | null>(null);

  // Reanimated 动画相关
  const markerY = useRef(new Animated.Value(0)).current;
  const animatedMarkerStyle = {
    transform: [{ translateY: markerY }],
  };

  const bounceMarker = () => {
    Animated.sequence([
      Animated.timing(markerY, {
        toValue: -30,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(markerY, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 初始化获取定位
  useEffect(() => {
    (async () => {
      try {
        const loc = await ExpoGaodeMapModule.getCurrentLocation();
        const pos = loc ? { latitude: loc.latitude, longitude: loc.longitude } : { latitude: 39.908692, longitude: 116.397477 };
        
        const zoom = 16;
        const offset = getOffsetForZoom(zoom);
        
        // 设置初始相机位置
        setInitialCamera({
          target: { latitude: pos.latitude - offset, longitude: pos.longitude },
          zoom: zoom
        });

        // 获取周边信息
        await fetchLocationInfo(pos);
        
        hasInitialized.current = true;
        setIsInitialLoading(false);
      } catch (error) {
        console.error('初始化定位失败:', error);
        // 失败也给个默认值，防止一直卡在 loading
        setInitialCamera({ target: { latitude: 39.908692, longitude: 116.397477 }, zoom: 16 });
        setIsInitialLoading(false);
      }
    })();
  }, []);

  // 获取位置详细信息
  const fetchLocationInfo = async (coord: LatLng) => {
    if (lastFetchedCoord.current && 
        Math.abs(lastFetchedCoord.current.latitude - coord.latitude) < 0.00001 &&
        Math.abs(lastFetchedCoord.current.longitude - coord.longitude) < 0.00001) {
      return;
    }

    setLoading(true);
    lastFetchedCoord.current = coord;
    try {
      // 1. 逆地理编码获取当前位置描述
      const reGeoResult = await reGeocode({
        location: coord,
        radius: 1000,
        requireExtension: true,
      });

      const displayAddress = reGeoResult?.formattedAddress || '未知地址';

      // 2. 搜索周边 POI
      const poiResult = await searchNearby({
        keyword: '', 
        center: coord,
        radius: 500,
        pageSize: 20,
        pageNum: 1,
        types: '120000|150000|190000',
      });

      const currentLocPoi: POI = {
        id: 'current_loc',
        name: '[当前位置]',
        address: displayAddress,
        location: coord,
        distance: 0,
        typeCode: '',
        typeDes: '当前位置',
      };
      
      const list = [currentLocPoi, ...(poiResult.pois || [])];
      setPois(list);
      if (list.length > 0 && !selectedPoiId) {
        setSelectedPoiId(list[0].id);
      }
    } catch (error) {
      console.error('获取位置信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 相机移动结束
  const onCameraIdle = (e: NativeSyntheticEvent<CameraEvent>) => {
    if (!hasInitialized.current) return;
    
    bounceMarker();

    const { target, zoom } = e.nativeEvent.cameraPosition;
    if (target) {
      const offset = getOffsetForZoom(zoom || 16);
      const markerLocation = {
        latitude: target.latitude + offset,
        longitude: target.longitude
      };
      fetchLocationInfo(markerLocation);
    }
  };

  // 列表点击
  const handlePoiPress = (poi: POI) => {
    setSelectedPoiId(poi.id);
    const zoom = 16;
    const offset = getOffsetForZoom(zoom);
    mapRef.current?.moveCamera({
      target: {
        latitude: poi.location.latitude - offset,
        longitude: poi.location.longitude
      },
      zoom: zoom
    }, 500);
  };

  const handleConfirm = () => {
    const selectedPoi = pois.find(p => p.id === selectedPoiId);
    if (selectedPoi) {
      Alert.alert(
        '确认上车点',
        `您选择了：${selectedPoi.name}\n地址：${selectedPoi.address}`,
        [{ text: '确定' }]
      );
    }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.initialLoadingOverlay}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.initialLoadingText}>正在定位中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 地图区域 */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialCameraPosition={initialCamera!}
          onCameraIdle={onCameraIdle}
          myLocationEnabled
          zoomControlsEnabled={false}
        />
        
        {/* 中心固定大头针 */}
        <View 
          style={[
            styles.markerFixed, 
            { top: `${VISUAL_CENTER_RATIO * 100}%` }
          ]} 
          pointerEvents="none"
        >
          <Animated.View style={[styles.markerContainer, animatedMarkerStyle]}>
            <Image 
              source={require('./assets/start.png')} 
              style={styles.markerIcon} 
              resizeMode="contain"
            />
            <View style={styles.markerShadow} />
          </Animated.View>
        </View>

        {/* 定位按钮 */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={async () => {
            const loc = await ExpoGaodeMapModule.getCurrentLocation();
            if (loc) {
              const zoom = 16;
              const offset = getOffsetForZoom(zoom);
              mapRef.current?.moveCamera({
                target: { 
                  latitude: loc.latitude - offset, 
                  longitude: loc.longitude 
                },
                zoom: zoom
              }, 500);
            }
          }}
        >
          <Ionicons name="locate" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 底部 POI 列表 */}
      <View style={styles.listContainer}>
     
        <View style={styles.listHeader}>
          <View style={styles.handle} />
          <Text style={styles.listTitle}>选择上车点</Text>
        </View>
        
        {loading && pois.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>获取位置信息...</Text>
          </View>
        ) : (
          <FlatList
            data={pois}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.poiItem}
                onPress={() => handlePoiPress(item)}
              >
                <View style={styles.poiIconContainer}>
                  <Ionicons 
                    name={item.id === 'current_loc' ? "location" : "business"} 
                    size={15} 
                    color={selectedPoiId === item.id ? "#007AFF" : "#999"} 
                  />
                </View>
                <View style={styles.poiInfo}>
                  <Text style={[
                    styles.poiName, 
                    selectedPoiId === item.id && styles.selectedText
                  ]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.poiAddress} numberOfLines={1}>{item.address}</Text>
                </View>
                {selectedPoiId === item.id && (
                  <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.confirmButton, !selectedPoiId && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!selectedPoiId}
          >
            <Text style={styles.confirmButtonText}>确认上车点</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
   
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    position: 'absolute',
    left: '50%',
    width: 48,
    height: 48,
    marginLeft: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerIcon: {
    width: 44,
    height: 44,
    marginTop: -44, // 向上偏移，使底部尖端对准中心
  },
  markerShadow: {
    width: 8,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 4,
    marginTop: -2,
  },
  locationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  listHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  poiItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  poiIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  poiInfo: {
    flex: 1,
  },
  poiName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedText: {
    color: '#007AFF',
  },
  poiAddress: {
    fontSize: 12,
    color: '#999',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EEE',
    marginLeft: 64,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEE',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#B0D4FF',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  initialLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  initialLoadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
});
