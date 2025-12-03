# Search Examples

This page demonstrates how to use the search module to implement various search functionalities.

## Basic Search

### Simple POI Search

```typescript
import { searchPOI } from '@expo-gaode-map/search';

async function searchStarbucks() {
  try {
    const result = await searchPOI({
      query: 'Starbucks',
      city: 'Beijing',
      pageNum: 1,
      pageSize: 20
    });
    
    console.log(`Found ${result.totalCount} results`);
    result.pois.forEach(poi => {
      console.log(`${poi.name} - ${poi.address}`);
    });
  } catch (error) {
    console.error('Search failed:', error);
  }
}
```

### Nearby Search

```typescript
import { searchPOIAround } from '@expo-gaode-map/search';

async function searchNearbyRestaurants(latitude: number, longitude: number) {
  try {
    const result = await searchPOIAround({
      center: { latitude, longitude },
      query: 'restaurant',
      radius: 2000, // 2km radius
      pageNum: 1,
      pageSize: 20
    });
    
    return result.pois;
  } catch (error) {
    console.error('Nearby search failed:', error);
    return [];
  }
}
```

### Route Search

```typescript
import { searchPOIAlongRoute } from '@expo-gaode-map/search';

async function searchGasStations(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) {
  try {
    const result = await searchPOIAlongRoute({
      origin,
      destination,
      query: 'gas station',
      range: 1000, // 1km deviation from route
      pageNum: 1
    });
    
    return result.pois;
  } catch (error) {
    console.error('Route search failed:', error);
    return [];
  }
}
```

### Autocomplete Search

```typescript
import { searchInputTips } from '@expo-gaode-map/search';

async function getSearchSuggestions(keyword: string) {
  try {
    const result = await searchInputTips({
      keyword,
      city: 'Beijing'
    });
    
    return result.tips;
  } catch (error) {
    console.error('Autocomplete failed:', error);
    return [];
  }
}
```

---

## Complete Example

### Search Map Application

```typescript
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';
import { searchPOI, searchInputTips, POIItem, TipItem } from '@expo-gaode-map/search';

export default function SearchMapScreen() {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<TipItem[]>([]);
  const [searchResults, setSearchResults] = useState<POIItem[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    latitude: 39.908692,
    longitude: 116.397477
  });

  // Autocomplete
  useEffect(() => {
    if (keyword.length > 0) {
      const timer = setTimeout(async () => {
        try {
          const result = await searchInputTips({
            keyword,
            city: 'Beijing'
          });
          setSuggestions(result.tips);
        } catch (error) {
          console.error('Autocomplete error:', error);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [keyword]);

  // Execute search
  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const result = await searchPOI({
        query,
        city: 'Beijing',
        pageNum: 1,
        pageSize: 20
      });
      
      setSearchResults(result.pois);
      setSuggestions([]);
      
      // Center map on first result
      if (result.pois.length > 0) {
        setMapCenter(result.pois[0].location);
        setSelectedPOI(result.pois[0]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Select suggestion
  const handleSelectSuggestion = (tip: TipItem) => {
    setKeyword(tip.name);
    handleSearch(tip.name);
  };

  // Select POI
  const handleSelectPOI = (poi: POIItem) => {
    setSelectedPOI(poi);
    setMapCenter(poi.location);
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Search for places"
          onSubmitEditing={() => handleSearch(keyword)}
        />
        {loading && <ActivityIndicator style={styles.loader} />}
      </View>

      {/* Suggestions list */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={styles.suggestionName}>{item.name}</Text>
                <Text style={styles.suggestionAddress}>{item.address}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map */}
      <MapView
        style={styles.map}
        center={mapCenter}
        zoomLevel={15}
      >
        {searchResults.map((poi) => (
          <Marker
            key={poi.uid}
            coordinate={poi.location}
            title={poi.name}
            description={poi.address}
            onPress={() => handleSelectPOI(poi)}
          />
        ))}
      </MapView>

      {/* Search results list */}
      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            horizontal
            data={searchResults}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.resultItem,
                  selectedPOI?.uid === item.uid && styles.selectedResultItem
                ]}
                onPress={() => handleSelectPOI(item)}
              >
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultAddress} numberOfLines={1}>
                  {item.address}
                </Text>
                <Text style={styles.resultDistance}>
                  {(item.distance / 1000).toFixed(2)} km
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    height: 45,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  loader: {
    marginRight: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 105,
    left: 20,
    right: 20,
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 8,
    zIndex: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionAddress: {
    fontSize: 14,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  resultsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 120,
  },
  resultItem: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedResultItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultDistance: {
    fontSize: 12,
    color: '#999',
  },
});
```

---

## Common Scenarios

### Paginated Search

```typescript
import { searchPOI } from '@expo-gaode-map/search';

async function loadMoreResults(query: string, currentPage: number) {
  try {
    const result = await searchPOI({
      query,
      city: 'Beijing',
      pageNum: currentPage + 1,
      pageSize: 20
    });
    
    return {
      pois: result.pois,
      hasMore: currentPage < result.pageCount,
      totalPages: result.pageCount
    };
  } catch (error) {
    console.error('Load more failed:', error);
    return { pois: [], hasMore: false, totalPages: 0 };
  }
}
```

### Search by POI Type

```typescript
import { searchPOI } from '@expo-gaode-map/search';

async function searchByType(type: string, city: string) {
  try {
    // 040000 = Dining category
    // 050000 = Shopping category
    const result = await searchPOI({
      query: '',
      city,
      type,
      pageSize: 50
    });
    
    return result.pois;
  } catch (error) {
    console.error('Type search failed:', error);
    return [];
  }
}

// Usage
const restaurants = await searchByType('040000', 'Beijing');
const malls = await searchByType('050000', 'Beijing');
```

### Error Handling

```typescript
import { searchPOI } from '@expo-gaode-map/search';

async function safeSearch(query: string) {
  try {
    const result = await searchPOI({
      query,
      city: 'Beijing'
    });
    
    if (result.pois.length === 0) {
      // No results found
      if (result.suggestion?.keywords) {
        console.log('Suggested keywords:', result.suggestion.keywords);
      }
      return null;
    }
    
    return result;
  } catch (error: any) {
    if (error.message.includes('INVALID_USER_KEY')) {
      console.error('API Key not configured');
    } else if (error.message.includes('network')) {
      console.error('Network error, please check connection');
    } else {
      console.error('Search error:', error.message);
    }
    return null;
  }
}
```

---

## Related Documentation

- [Search API Reference](../api/search.md)
- [Search Feature Guide](../guide/search.md)
- [MapView API](../api/mapview.md)