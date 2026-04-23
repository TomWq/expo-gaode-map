import { useSafeScrollViewStyle } from './hooks/useSafeScrollView';
import { MapView, MapViewRef, Marker } from 'expo-gaode-map';
import type { InputTip } from 'expo-gaode-map-search';
import ExpoGaodeMapSearch from 'expo-gaode-map-search';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Suggestion {
  id: string;
  name: string;
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
  adcode?: string;
}

/**
 * 地址选择器示例（使用原生 Search 模块）
 * 类似外卖 App 的地址选择功能
 */
export default function AddressPickerNativeExample() {
  // 搜索相关
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  
  // 地图相关
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  } | null>(null);
  
  // 地图 ref
  const mapRef = useRef<MapViewRef>(null);
  
  // 防抖计时器
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 默认中心位置（北京天安门）
  const defaultCenter = {
    latitude: 39.908692,
    longitude: 116.397477,
  };

  // 搜索输入提示（使用原生 SDK）
  const searchInputTips = async (keyword: string) => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const result = await ExpoGaodeMapSearch.getInputTips({
        keyword: keyword,
        city: '北京', // 可以使用城市名称或编码
      });

      const tips: Suggestion[] = result.tips.map((tip: InputTip) => ({
        id: tip.id,
        name: tip.name,
        district: tip.adName || '',
        address: tip.address || tip.adName || '',
        latitude: tip.location?.latitude,
        longitude: tip.location?.longitude,
        adcode: tip.cityName,
      }));

      setSuggestions(tips);
      setShowSuggestions(true);
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert('搜索失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化（带防抖）
  const handleSearchChange = (text: string) => {
    setSearchText(text);

    // 清除之前的定时器
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // 设置新的防抖定时器
    searchTimeout.current = setTimeout(() => {
      searchInputTips(text);
    }, 500); // 500ms 防抖
  };

  // 选择建议项
  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    setSearchText(suggestion.name);
    setShowSuggestions(false);
    Keyboard.dismiss();
    setMapLoading(true);

    try {
      // 如果有坐标，直接使用
      if (suggestion.latitude !== undefined && suggestion.longitude !== undefined) {
        const newLocation = {
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          name: suggestion.name,
          address: suggestion.address,
        };
        setSelectedLocation(newLocation);
        // 使用 mapRef 移动相机到选中位置
        mapRef.current?.moveCamera(
          {
            target: { latitude: suggestion.latitude, longitude: suggestion.longitude },
            zoom: 16,
          },
          500
        );
      } else {
        // 没有坐标，尝试通过 POI 搜索获取
        try {
          // 使用关键字搜索获取详细信息
          const result = await ExpoGaodeMapSearch.searchPOI({
            keyword: suggestion.name,
            city: suggestion.adcode || '北京',
            pageSize: 1,
            pageNum: 1,
          });

          if (result.pois && result.pois.length > 0) {
            const poi = result.pois[0];
            const newLocation = {
              latitude: poi.location.latitude,
              longitude: poi.location.longitude,
              name: suggestion.name,
              address: suggestion.address,
            };
            setSelectedLocation(newLocation);
            mapRef.current?.moveCamera(
              {
                target: { latitude: poi.location.latitude, longitude: poi.location.longitude },
                zoom: 16,
              },
              500
            );
            return;
          }

          Alert.alert('提示', '该地点暂无坐标信息，请选择其他地点');
        } catch (error) {
          console.error('获取坐标失败:', error);
          Alert.alert('错误', '获取坐标失败');
        }
      }
    } finally {
      setMapLoading(false);
    }
  };

  // 确认选择
  const handleConfirm = () => {
    if (selectedLocation) {
      Alert.alert(
        '已选择地址',
        `名称: ${selectedLocation.name}\n地址: ${selectedLocation.address}\n坐标: ${selectedLocation.latitude}, ${selectedLocation.longitude}`,
        [{ text: '确定' }]
      );
    } else {
      Alert.alert('提示', '请先选择一个地址');
    }
  };

  // 清空搜索
  const handleClear = () => {
    setSearchText('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedLocation(null);
    // 使用 mapRef 重置地图到默认位置
    mapRef.current?.moveCamera({
      target: defaultCenter,
      zoom: 12,
    }, 500);
  };

  const contentStyle = useSafeScrollViewStyle(styles.container);

  return (
    <View style={contentStyle}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder="搜索地点、小区、写字楼等"
            placeholderTextColor="#999"
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />
          {searchText ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
          {loading && <ActivityIndicator size="small" color="#1890ff" />}
        </View>
      </View>

      {/* 建议列表 */}
      {showSuggestions && suggestions.length > 0 ? (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
                disabled={loading || mapLoading}
              >
                <View style={styles.suggestionIcon}>
                  <Text>📍</Text>
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.suggestionAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : showSuggestions && searchText && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>未找到相关地址</Text>
        </View>
      ) : null}

      {/* 地图 */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialCameraPosition={{
            target: defaultCenter,
            zoom: 12,
          }}
        >
          {selectedLocation && (
            <Marker
              key={`${selectedLocation.latitude}-${selectedLocation.longitude}`}
              position={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title={selectedLocation.name}
              snippet={selectedLocation.address}
            />
          )}
        </MapView>

        {/* 加载遮罩（选址/移图中） */}
        {(loading || mapLoading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1890ff" />
            <Text style={styles.loadingText}>{loading ? '正在搜索建议…' : '正在定位到选中地址…'}</Text>
          </View>
        )}

        {/* 选中地址信息卡片 */}
        {selectedLocation && (
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{selectedLocation.name}</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {selectedLocation.address}
              </Text>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>确认地址</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 提示信息 */}
        {!selectedLocation && (
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>
              💡 使用原生 SDK 搜索（性能更好，支持离线）
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1000,
    //  paddingTop:50
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 999,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 999,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locationCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  locationInfo: {
    marginBottom: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#1890ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  hintCard: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
  },
});
