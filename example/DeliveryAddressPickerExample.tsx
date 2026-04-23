import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraEvent, ExpoGaodeMapModule, LatLng, MapView, MapViewRef } from 'expo-gaode-map';
import { getInputTips, InputTip, POI, searchNearby } from 'expo-gaode-map-search';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const DEFAULT_LOCATION = { latitude: 39.908692, longitude: 116.397477 }; // 天安门

export default function DeliveryAddressPicker() {
  const mapRef = useRef<MapViewRef>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [poiList, setPoiList] = useState<POI[]>([]);
  const [suggestions, setSuggestions] = useState<InputTip[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPois, setIsLoadingPois] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [mapLayout, setMapLayout] = useState({ width: 0, height: 0 });

  // 参考 EnterpriseCheckIn 的视觉中心处理逻辑
  const VISUAL_CENTER_RATIO = 0.5; // 视觉中心在屏幕 50% 处（正中心）
  
  const getOffsetForZoom = (z: number) => {
    // 高德地图中，纬度增加（+）代表向北移
    // 当我们减少相机的 target 纬度时，地图内容会相对下移
    // 目标点从 50% 下移到 VISUAL_CENTER_RATIO 位置
    // 0.004 是 20% 高度差 (0.5 - 0.3) 在 zoom 15 下的经验参考值
    const ratioGap = 0.5 - VISUAL_CENTER_RATIO;
    if (Math.abs(ratioGap) < 0.001) return 0;
    
    const baseOffset = 0.004 * (ratioGap / 0.2); 
    return baseOffset * Math.pow(2, 15 - z);
  };
  
  // 搜索防抖计时器
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 初始化标记，防止默认位置产生的 idle 事件覆盖真实定位结果
  const hasInitialized = useRef(false);
  const lastFetchedCoord = useRef<LatLng | null>(null);

  // 动画控制
  const markerY = useRef(new Animated.Value(0)).current;
  const markerAnimatedStyle = {
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
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      const pos = loc ? { latitude: loc.latitude, longitude: loc.longitude } : DEFAULT_LOCATION;
      
      setCurrentLocation(pos);
      
      // 标记初始化开始，并立即移动相机
      // 移动相机会触发 onCameraIdle，从而触发 fetchNearbyPois
      const zoom = 17;
      const offset = getOffsetForZoom(zoom);
      mapRef.current?.moveCamera({
        target: { latitude: pos.latitude - offset, longitude: pos.longitude },
        zoom: zoom,
      }, 0); // 设置为 0，消除进入时的滑动感

      // 延迟一小会儿开启初始化标记，确保跳过地图加载瞬间产生的默认位置 idle 事件
      setTimeout(() => {
        hasInitialized.current = true;
        // 兜底手动加载一次，防止 moveCamera 没触发 idle
        fetchNearbyPois(pos);
      }, 500);
    })();
  }, []);

  // 搜索周边 POI
  const fetchNearbyPois = async (coord: LatLng) => {
    // 如果位置没变，不重复请求
    if (lastFetchedCoord.current && 
        Math.abs(lastFetchedCoord.current.latitude - coord.latitude) < 0.00001 &&
        Math.abs(lastFetchedCoord.current.longitude - coord.longitude) < 0.00001) {
      return;
    }

    setIsLoadingPois(true);
    lastFetchedCoord.current = coord;
    try {
      const result = await searchNearby({
        center: coord,
        radius: 1000,
        keyword: '',
        types: '120000|150000|190000', // 商务住宅、餐饮服务、地名地址信息
      });
      setPoiList(result.pois || []);
      if (result.pois && result.pois.length > 0) {
        setSelectedPoiId(result.pois[0].id);
      }
    } catch (error) {
      console.error('Nearby search error:', error);
    } finally {
      setIsLoadingPois(false);
    }
  };

  // 输入联想
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    
    // 清除之前的计时器
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (text.length > 0) {
      setIsSearching(true);
      // 设置 500ms 防抖
      searchTimer.current = setTimeout(async () => {
        try {
          const result = await getInputTips({
            keyword: text,
            city: '全国',
          });
          setSuggestions(result.tips || []);
        } catch (error) {
          console.error('Input tips error:', error);
        }
      }, 500);
    } else {
      setIsSearching(false);
      setSuggestions([]);
    }
  };

  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, []);

  // 地图移动停止回调
  const onCameraIdle = async (event: NativeSyntheticEvent<CameraEvent>) => {
    // 屏蔽初始化完成前的所有 idle 事件
    if (!hasInitialized.current) return;

    bounceMarker();

    const position = event.nativeEvent.cameraPosition;
    if (position.target) {
      const zoom = position.zoom || 17;
      const offset = getOffsetForZoom(zoom);
      
      // 相机中心点在目标点（Marker）的南方，所以目标点纬度 = 相机纬度 + offset
      const markerLocation = {
        latitude: position.target.latitude + offset,
        longitude: position.target.longitude
      };
      
      fetchNearbyPois(markerLocation);
    }
  };

  // 选择 POI 或 建议项
  const handleSelectPoi = (item: POI | InputTip) => {
    console.log('Selected POI:', item);
    if (!item.location) return;

    const pos = { 
      latitude: item.location.latitude, 
      longitude: item.location.longitude 
    };

    // 移动时同样应用偏移，让目标点落在视觉中心（30%高度）
    const zoom = 17;
    const offset = getOffsetForZoom(zoom);
    mapRef.current?.moveCamera({
      target: { latitude: pos.latitude - offset, longitude: pos.longitude },
      zoom: zoom,
    }, 500);

    if ('id' in item) {
      setSelectedPoiId(item.id);
    }
    
    setIsSearching(false);
    setSearchText('');
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const renderPoiItem = ({ item }: { item: POI }) => {
    // 格式化距离：小于1000m显示m，大于1000m显示km
    const formatDistance = (dist?: number) => {
      if (!dist) return null;
      if (dist < 1000) return `${Math.round(dist)}m`;
      return `${(dist / 1000).toFixed(1)}km`;
    };

    const distanceStr = formatDistance(item.distance);

    return (
      <TouchableOpacity 
        style={styles.poiItem} 
        onPress={() => handleSelectPoi(item)}
      >
        <View style={styles.poiInfo}>
          <View style={styles.poiNameRow}>
            <Text style={[styles.poiName, selectedPoiId === item.id && styles.selectedText]} numberOfLines={1}>
              {item.name}
            </Text>
            {distanceStr && (
              <Text style={styles.distanceText}>{distanceStr}</Text>
            )}
          </View>
          <Text style={styles.poiAddress} numberOfLines={1}>
            {item.address || item.adName}
          </Text>
        </View>
        {selectedPoiId === item.id && (
          <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
        )}
      </TouchableOpacity>
    );
  };

  const renderSuggestionItem = ({ item }: { item: InputTip }) => (
   
    <TouchableOpacity 
      style={styles.suggestionItem} 
      onPress={() => handleSelectPoi(item)}
    >
      <View style={styles.suggestionIconContainer}>
        <Ionicons name="location-sharp" size={18} color="#999" />
      </View>
      <View style={styles.suggestionInfo}>
        <Text style={styles.suggestionName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.suggestionAddress} numberOfLines={1}>
          {item.address && item.address.length > 0 
            ? `${item.adName || ''}${item.address}` 
            : `${item.cityName || ''}${item.adName || ''}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#DDD" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="请输入您的收货地址"
              placeholderTextColor="#BBB"
              value={searchText}
              onChangeText={handleSearchTextChange}
              onFocus={() => {
                if (searchText.length > 0) setIsSearching(true);
              }}
              clearButtonMode="while-editing"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchText('');
                setSuggestions([]);
              }}>
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </TouchableOpacity>
            )}
          </View>
          {(isSearching || searchText.length > 0) && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setIsSearching(false);
                setSearchText('');
                setSuggestions([]);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* 地图部分 - 始终保持挂载，避免 moveCamera 失效 */}
        <View 
          style={styles.mapContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setMapLayout({ width, height });
          }}
        >
          <MapView
            ref={mapRef}
            style={styles.map}
            initialCameraPosition={{
              target: currentLocation 
                ? { latitude: currentLocation.latitude - getOffsetForZoom(16), longitude: currentLocation.longitude }
                : { latitude: DEFAULT_LOCATION.latitude - getOffsetForZoom(16), longitude: DEFAULT_LOCATION.longitude },
              zoom: 16,
            }}
            myLocationEnabled
            onCameraIdle={onCameraIdle}
          />
          {/* 固定中心标记 */}
          <View 
            style={[
              styles.markerFixed, 
              { top: `${VISUAL_CENTER_RATIO * 100}%` }
            ]} 
            pointerEvents="none"
          >
            <Animated.View style={[styles.markerContainer, markerAnimatedStyle]}>
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
                const zoom = 17;
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

        {/* 周边 POI 列表 */}
        <View style={styles.poiListContainer}>
            <BlurView
                        intensity={50}
                        tint={'light'}
                        style={StyleSheet.absoluteFillObject}
                       
                      />
          {isLoadingPois ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#007AFF" />
              <Text style={styles.loadingText}>获取周边位置...</Text>
            </View>
          ) : (
            <FlatList
              data={poiList}
              keyExtractor={(item) => item.id}
              renderItem={renderPoiItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>暂无附近位置信息</Text>
                </View>
              }
            />
          )}
        </View>

        {/* 搜索建议列表 - 浮层覆盖 */}
        {isSearching && suggestions.length > 0 && (
          <View style={styles.suggestionOverlay}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={renderSuggestionItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.suggestionList}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  searchHeader: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingBottom: 12,
    zIndex: 10,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.08)",
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 4 : 8,
  },
  searchBar: {
    flex: 1,
    height:  40,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth:1,
    borderColor: '#EEE',
   
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    paddingVertical: Platform.OS === 'ios' ? 0 : 0,
    height: '100%',
    fontWeight: '400',
  },
  cancelButton: {
    marginLeft: 15,
  },
  cancelText: {
    fontSize: 16,
    color: Platform.OS === 'ios' ? '#007AFF' : '#333',
    fontWeight: Platform.OS === 'ios' ? '400' : '500',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    position: 'absolute',
    left: '50%',
    // top 由组件内 VISUAL_CENTER_RATIO 决定
    marginLeft: -21,
    // 图标高度 42，影子高度 5，负边距需要让影子底部对齐中心点
    // 之前 -42 导致图标太靠上，现在微调为 -44
    marginTop: -44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerIcon: {
    width: 42,
    height: 42,
  },
  markerShadow: {
    width: 10,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 5,
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
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  },
  poiListContainer: {
    height: '45%', // 列表占据底部 45% 高度
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  poiInfo: {
    flex: 1,
    marginRight: 10,
  },
  poiNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  poiName: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  selectedText: {
    color: '#007AFF',
  },
  poiAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
  },
  suggestionList: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  suggestionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionInfo: {
    flex: 1,
    marginRight: 10,
  },
  suggestionName: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestionAddress: {
    fontSize: 13,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
