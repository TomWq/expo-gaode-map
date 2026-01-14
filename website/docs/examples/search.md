# 搜索功能示例

本页面提供 `expo-gaode-map-search` 的完整使用示例。

## 安装

```bash
npm install expo-gaode-map-search
```

## 基础搜索示例

### POI 搜索

搜索指定关键词的地点：

```typescript
import { searchPOI } from 'expo-gaode-map-search';

const handleSearch = async () => {
  try {
    const result = await searchPOI({
      keyword: '酒店',
      city: '北京',
      types: '100000',
      pageSize: 20,
      pageNum: 1,
    });

    console.log('找到', result.total, '个结果');
    result.pois.forEach(poi => {
      console.log(poi.name, poi.address);
      console.log('位置:', poi.location);
    });
  } catch (error) {
    console.error('搜索失败:', error);
  }
};
```

### 周边搜索

搜索指定位置周边的地点：

```typescript
import { searchNearby } from 'expo-gaode-map-search';

const handleNearbySearch = async () => {
  const result = await searchNearby({
    keyword: '餐厅',
    center: { latitude: 39.9, longitude: 116.4 },
    radius: 1000,
    types: '050000',
    pageSize: 20,
  });

  result.pois.forEach(poi => {
    console.log(poi.name, '距离:', poi.distance, '米');
  });
};
```

### 输入提示

获取关键词的自动补全建议：

```typescript
import { getInputTips } from 'expo-gaode-map-search';

const handleInputTips = async (text: string) => {
  const result = await getInputTips({
    keyword: text,
    city: '北京',
  });

  return result.tips.map(tip => ({
    id: tip.id,
    name: tip.name,
    address: tip.address,
  }));
};
```

## 完整应用示例

### 搜索地图应用

结合地图显示搜索结果：

```typescript
import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';
import { searchPOI, type POI } from 'expo-gaode-map-search';

export default function SearchMapScreen() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<POI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    try {
      const result = await searchPOI({
        keyword,
        city: '北京',
        pageSize: 10,
      });
      setResults(result.pois);
      if (result.pois.length > 0) {
        setSelectedPOI(result.pois[0]);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchBar}>
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="输入关键词搜索"
          onSubmitEditing={handleSearch}
          style={styles.input}
        />
      </View>

      {/* 地图 */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: selectedPOI?.location || { latitude: 39.9, longitude: 116.4 },
            zoom: selectedPOI ? 15 : 10,
          }}
        >
          {results.map((poi) => (
            <Marker
              key={poi.id}
              position={poi.location}
              title={poi.name}
              onPress={() => setSelectedPOI(poi)}
            />
          ))}
        </MapView>
      </View>

      {/* 结果列表 */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        style={styles.resultList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedPOI(item)}
            style={[
              styles.resultItem,
              selectedPOI?.id === item.id && styles.selectedItem,
            ]}
          >
            <Text style={styles.poiName}>{item.name}</Text>
            <Text style={styles.poiAddress}>{item.address}</Text>
            {item.distance && (
              <Text style={styles.poiDistance}>距离: {item.distance} 米</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  resultList: {
    maxHeight: 200,
    backgroundColor: 'white',
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#f0f0f0',
  },
  poiName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  poiAddress: {
    color: '#666',
    marginTop: 5,
  },
  poiDistance: {
    color: '#999',
    marginTop: 5,
  },
});
```

### 自动完成搜索框

带输入提示的搜索框：

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { getInputTips, type InputTip } from 'expo-gaode-map-search';

export default function AutoCompleteSearch() {
  const [keyword, setKeyword] = useState('');
  const [tips, setTips] = useState<InputTip[]>([]);

  useEffect(() => {
    const fetchTips = async () => {
      if (keyword.length < 2) {
        setTips([]);
        return;
      }

      try {
        const result = await getInputTips({
          keyword,
          city: '北京',
        });
        setTips(result.tips);
      } catch (error) {
        console.error('获取提示失败:', error);
      }
    };

    const timer = setTimeout(fetchTips, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSelect = (tip: InputTip) => {
    setKeyword(tip.name);
    setTips([]);
    // 处理选中的结果
    console.log('选中:', tip);
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={keyword}
        onChangeText={setKeyword}
        placeholder="输入地点名称"
        style={styles.input}
      />

      {tips.length > 0 && (
        <FlatList
          data={tips}
          keyExtractor={(item) => item.id}
          style={styles.tipsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              style={styles.tipItem}
            >
              <Text style={styles.tipName}>{item.name}</Text>
              <Text style={styles.tipAddress}>{item.address}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
  },
  tipsList: {
    marginTop: 5,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
  },
  tipItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tipName: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
});
```

### 周边搜索

搜索当前位置周边的地点：

```typescript
import React, { useState, useEffect } from 'react';
import { View, Button } from 'react-native';
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { searchNearby, type POI } from 'expo-gaode-map-search';

export default function NearbySearch() {
  const [nearbyPOIs, setNearbyPOIs] = useState<POI[]>([]);

  const searchNearbyPlaces = async () => {
    try {
      // 获取当前位置
      const location = await ExpoGaodeMapModule.getCurrentLocation();

      // 搜索周边餐厅
      const result = await searchNearby({
        keyword: '餐厅',
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        radius: 1000,
        types: '050000',
      });

      setNearbyPOIs(result.pois);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  return (
    <View>
      <Button title="搜索周边餐厅" onPress={searchNearbyPlaces} />
      {/* 显示结果... */}
    </View>
  );
}
```

### 沿途搜索

搜索路线沿途的加油站：

```typescript
import { searchAlong } from 'expo-gaode-map-search';

const searchGasStations = async (route: Array<{ latitude: number; longitude: number }>) => {
  try {
    const result = await searchAlong({
      keyword: '加油站',
      polyline: route,
      range: 500,
    });

    console.log('找到', result.pois.length, '个加油站');
    return result.pois;
  } catch (error) {
    console.error('沿途搜索失败:', error);
    return [];
  }
};

// 使用示例
const route = [
  { latitude: 39.9, longitude: 116.4 },
  { latitude: 39.91, longitude: 116.41 },
  { latitude: 39.92, longitude: 116.42 },
];

searchGasStations(route);
```

### 逆地理编码

获取指定坐标的地址信息：

```typescript
import { reGeocode } from 'expo-gaode-map-search';

const getAddress = async (latitude: number, longitude: number) => {
  try {
    const result = await reGeocode({
      location: { latitude, longitude },
      radius: 500,
    });
    
    console.log('地址:', result.formattedAddress);
    return result.formattedAddress;
  } catch (error) {
    console.error('逆地理编码失败:', error);
    return null;
  }
};
```

### POI 详情

获取 POI 的详细信息（包括营业时间、评分等）：

```typescript
import { getPoiDetail } from 'expo-gaode-map-search';

const showPoiDetail = async (id: string) => {
  try {
    const poi = await getPoiDetail(id);
    
    console.log('名称:', poi.name);
    if (poi.business) {
        console.log('评分:', poi.business.rating);
        console.log('营业时间:', poi.business.opentime);
        console.log('人均消费:', poi.business.cost);
    }
    if (poi.photos && poi.photos.length > 0) {
        console.log('图片:', poi.photos[0].url);
    }
  } catch (error) {
    console.error('获取详情失败:', error);
  }
};
```

## 常见场景

### 分页搜索

处理大量搜索结果：

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [allPOIs, setAllPOIs] = useState<POI[]>([]);

const loadMore = async () => {
  const result = await searchPOI({
    keyword: '酒店',
    city: '北京',
    pageSize: 20,
    pageNum: currentPage,
  });

  setAllPOIs([...allPOIs, ...result.pois]);
  setCurrentPage(currentPage + 1);
};
```

### 错误处理

优雅地处理搜索错误：

```typescript
const handleSearch = async () => {
  try {
    const result = await searchPOI({ keyword: '酒店' });
    // 处理结果
  } catch (error: any) {
    if (error.code === 'INVALID_USER_KEY') {
      Alert.alert('错误', '请检查 API Key 配置');
    } else {
      Alert.alert('搜索失败', error.message || '未知错误');
    }
  }
};
```

## 相关文档

- [搜索 API](/api/search) - 完整 API 参考
- [搜索功能指南](/guide/search) - 详细使用指南
- [MapView 示例](/examples/basic-map) - 地图基础用法