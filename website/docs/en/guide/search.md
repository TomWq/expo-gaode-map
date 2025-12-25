# Search Features

The search module provides comprehensive POI (Point of Interest) search functionality based on AMap SDK, including keyword search, nearby search, route search, and autocomplete features.

## Overview

The search module is an **optional** extension package that you can install separately from the core module. This design keeps the core package lightweight while allowing users to add search functionality only when needed.

### Key Features

- ✅ **POI Keyword Search** - Search for places by keyword
- ✅ **Nearby Search** - Find POIs around a specific location
- ✅ **Route Search** - Search for POIs along a route
- ✅ **Autocomplete** - Get search suggestions in real-time
- ✅ **Pagination** - Support for large result sets
- ✅ **Type Filtering** - Filter by POI category
- ✅ **Optional Module** - Install only if needed to reduce app size

---

## Installation

### 1. Install the Package

```bash
bun add expo-gaode-map-search
# or
yarn add expo-gaode-map-search
# or
npm install expo-gaode-map-search

```

### 2. Configure API Key

Make sure you have configured the AMap API Key in your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "android": {
            "apiKey": "your-android-api-key"
          },
          "ios": {
            "apiKey": "your-ios-api-key"
          }
        }
      ]
    ]
  }
}
```

The search module will automatically use the API Key configured in the core module, no additional configuration needed.

### 3. Rebuild the App

After installing the package, rebuild your app:

```bash
# For development build
npx expo prebuild
npx expo run:android
# or
npx expo run:ios

# For EAS Build
eas build --platform all
```

---

## Basic Usage

### Import the Module

```typescript
import { 
  searchPOI, 
  searchPOIAround, 
  searchPOIAlongRoute, 
  searchInputTips 
} from 'expo-gaode-map-search';
```

### Keyword Search

```typescript
async function searchPlaces(keyword: string) {
  try {
    const result = await searchPOI({
      query: keyword,
      city: 'Beijing',
      pageNum: 1,
      pageSize: 20
    });
    
    console.log(`Found ${result.totalCount} results`);
    return result.pois;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}
```

### Nearby Search

```typescript
async function searchNearby(location: { latitude: number; longitude: number }) {
  try {
    const result = await searchPOIAround({
      center: location,
      query: 'restaurant',
      radius: 2000, // 2km
      pageNum: 1
    });
    
    return result.pois;
  } catch (error) {
    console.error('Nearby search failed:', error);
    return [];
  }
}
```

### Autocomplete

```typescript
async function getSuggestions(keyword: string) {
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

Here's a complete example of a search map application:

```typescript
import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';
import { searchPOI, POIItem } from 'expo-gaode-map-search';

export default function SearchMapScreen() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<POIItem[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null);
  const [mapCenter, setMapCenter] = useState({
    latitude: 39.908692,
    longitude: 116.397477
  });

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    
    try {
      const result = await searchPOI({
        query: keyword,
        city: 'Beijing',
        pageNum: 1,
        pageSize: 20
      });
      
      setResults(result.pois);
      
      if (result.pois.length > 0) {
        setMapCenter(result.pois[0].location);
        setSelectedPOI(result.pois[0]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSelectPOI = (poi: POIItem) => {
    setSelectedPOI(poi);
    setMapCenter(poi.location);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Search for places"
          onSubmitEditing={handleSearch}
        />
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        center={mapCenter}
        zoomLevel={15}
      >
        {results.map((poi) => (
          <Marker
            key={poi.uid}
            coordinate={poi.location}
            title={poi.name}
            description={poi.address}
            onPress={() => handleSelectPOI(poi)}
          />
        ))}
      </MapView>

      {/* Results List */}
      {results.length > 0 && (
        <View style={styles.results}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.resultItem,
                  selectedPOI?.uid === item.uid && styles.selectedItem
                ]}
                onPress={() => handleSelectPOI(item)}
              >
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.address}>{item.address}</Text>
              </TouchableOpacity>
            )}
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
  searchBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    height: 45,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  results: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: 'white',
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
});
```

---

## API Reference

The search module provides the following methods:

### searchPOI

Search for POIs by keyword.

**Parameters:**
- `query` - Search keyword
- `city` - City name or code
- `type` - POI type code
- `pageNum` - Page number (default: 1)
- `pageSize` - Results per page (default: 20, max: 50)

**Returns:** `POISearchResult`

---

### searchPOIAround

Search for nearby POIs around a location.

**Parameters:**
- `center` - Center coordinates
- `query` - Search keyword (optional)
- `type` - POI type code
- `radius` - Search radius in meters (default: 1000, max: 50000)
- `pageNum` - Page number
- `pageSize` - Results per page

**Returns:** `POISearchResult`

---

### searchPOIAlongRoute

Search for POIs along a route.

**Parameters:**
- `origin` - Starting point
- `destination` - Destination
- `query` - Search keyword
- `type` - POI type code
- `range` - Deviation from route in meters (default: 500)
- `pageNum` - Page number
- `pageSize` - Results per page

**Returns:** `POISearchResult`

---

### searchInputTips

Get input suggestions (autocomplete).

**Parameters:**
- `keyword` - Input keyword
- `city` - City name
- `type` - POI type code

**Returns:** `InputTipsResult`

---

## Common Use Cases

### 1. Search Near Current Location

```typescript
import { getCurrentLocation } from 'expo-gaode-map';
import { searchPOIAround } from 'expo-gaode-map-search';

async function searchNearMe(keyword: string) {
  const location = await getCurrentLocation();
  const result = await searchPOIAround({
    center: {
      latitude: location.latitude,
      longitude: location.longitude
    },
    query: keyword,
    radius: 5000
  });
  
  return result.pois;
}
```

### 2. Search Along Driving Route

```typescript
import { searchPOIAlongRoute } from 'expo-gaode-map-search';

async function findGasStationsOnRoute(start: Coordinate, end: Coordinate) {
  const result = await searchPOIAlongRoute({
    origin: start,
    destination: end,
    query: 'gas station',
    range: 1000
  });
  
  return result.pois;
}
```

### 3. Category Search

```typescript
import { searchPOI } from 'expo-gaode-map-search';

async function searchByCategory(category: string, city: string) {
  // 040000 = Dining, 050000 = Shopping, etc.
  const result = await searchPOI({
    query: '',
    city,
    type: category,
    pageSize: 50
  });
  
  return result.pois;
}
```

---

## FAQs

### Q: Why is the search module a separate package?

**A:** To keep the core package lightweight and reduce app size. Many apps only need map display and location features without search functionality. By separating the search module, users can choose to install it only when needed.

### Q: Do I need to configure the API Key separately for the search module?

**A:** No, the search module automatically uses the API Key configured in the core module. You only need to configure it once in `app.json`.

### Q: What's the difference between searchPOI and searchPOIAround?

**A:** 
- `searchPOI` - City-wide search by keyword, suitable for general searches
- `searchPOIAround` - Search within a specific radius around a point, suitable for "nearby" searches

### Q: How do I handle "No results found"?

**A:** When `result.pois.length === 0`, you can check `result.suggestion` for suggested keywords or cities to help users refine their search.

### Q: Are there API rate limits?

**A:** Yes, AMap API has request frequency limits. For production apps, consider implementing caching and request debouncing strategies.

### Q: How do I get the complete POI type code list?

**A:** Refer to [AMap POI Classification](https://lbs.amap.com/api/webservice/guide/api/search#poi) for the complete list.

---

## Related Documentation

- [Search API Reference](../api/search.md)
- [Search Examples](../examples/search.md)
- [Core Module API](../api/index.md)
- [Getting Started](./getting-started.md)