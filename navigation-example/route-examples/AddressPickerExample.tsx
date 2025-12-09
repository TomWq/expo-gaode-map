import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MapView, MapViewRef, Marker } from 'expo-gaode-map';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';
import type { InputTip } from 'expo-gaode-map-web-api';

interface Suggestion {
  id: string;
  name: string;
  district: string;
  address: string;
  location?: string;
  adcode?: string;
}

/**
 * 地址选择器示例
 * 类似外卖 App 的地址选择功能
 */
export default function AddressPickerExample() {
  const api = useMemo(() => new GaodeWebAPI({ key: '' }), []);
  const mapRef = useRef<MapViewRef>(null);
  // 搜索相关
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 地图相关
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  } | null>(null);
  
  const [mapCenter, setMapCenter] = useState({
    latitude: 39.908692,
    longitude: 116.397477,
  });
  
  const [mapZoom, setMapZoom] = useState(12);
  
  // 防抖计时器
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // 默认中心位置（北京天安门）
  const defaultCenter = {
    latitude: 39.908692,
    longitude: 116.397477,
  };

  // 搜索输入提示
  const searchInputTips = async (keyword: string) => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const result = await api.inputTips.getTips(keyword, {
        city: '010', // 北京
        citylimit: false, // 不限制城市
      });

      const tips: Suggestion[] = result.tips.map((tip: InputTip) => ({
        id: tip.id,
        name: tip.name,
        district: tip.district,
        address: tip.address || tip.district,
        location: tip.location,
        adcode: tip.adcode,
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

    // 如果有坐标，直接使用
    if (suggestion.location) {
      const [lng, lat] = suggestion.location.split(',').map(Number);
      const newLocation = {
        latitude: lat,
        longitude: lng,
        name: suggestion.name,
        address: suggestion.address,
      };
      setSelectedLocation(newLocation);
      // 使用 mapRef 移动相机到选中位置
      mapRef.current?.moveCamera({
        target: { latitude: lat, longitude: lng },
        zoom: 16,
      }, 500);
    } else {
      // 没有坐标，使用地理编码获取
      try {
        const result = await api.geocode.geocode(suggestion.address, suggestion.adcode);

        if (result.geocodes && result.geocodes.length > 0) {
          const [lng, lat] = result.geocodes[0].location.split(',').map(Number);
          const newLocation = {
            latitude: lat,
            longitude: lng,
            name: suggestion.name,
            address: suggestion.address,
          };
          setSelectedLocation(newLocation);
          // 使用 mapRef 移动相机到选中位置
          mapRef.current?.moveCamera({
            target: { latitude: lat, longitude: lng },
            zoom: 16,
          }, 500);
        } else {
          Alert.alert('提示', '未找到该地址的坐标信息');
        }
      } catch (error) {
        console.error('地理编码失败:', error);
        Alert.alert('错误', '获取坐标失败');
      }
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

  return (
    <View style={styles.container}>
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
          key={`${mapCenter.latitude}-${mapCenter.longitude}-${mapZoom}`}
          style={styles.map}
          initialCameraPosition={{
            target: mapCenter,
            zoom: mapZoom,
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
            <Text style={styles.hintText}>💡 请在上方搜索框输入地址关键词</Text>
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
    // paddingTop: 64,
  },
  searchBar: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1000,
    paddingTop:50
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
    maxHeight: 500,
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
    top:10,
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
});