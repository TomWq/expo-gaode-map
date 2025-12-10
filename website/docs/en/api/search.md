# Search API

The Search module provides POI (Point of Interest) search functionality based on AMap SDK.

## Installation

```bash
npm install expo-gaode-map-search
# or
yarn add expo-gaode-map-search
# or
pnpm add expo-gaode-map-search
```

## Import

```typescript
import { searchPOI, searchPOIAround, searchPOIAlongRoute, searchInputTips } from 'expo-gaode-map-search';
```

## API Methods

### searchPOI

Search for POIs by keyword.

```typescript
async function searchPOI(params: {
  query: string;
  city?: string;
  type?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<POISearchResult>
```

**Parameters:**

- `query` (string, required): Search keyword
- `city` (string, optional): City name or code, e.g., "Beijing" or "010"
- `type` (string, optional): POI type code, see [POI Type Codes](#poi-type-codes)
- `pageNum` (number, optional): Page number, starting from 1, default is 1
- `pageSize` (number, optional): Results per page, default is 20, max is 50

**Returns:** `POISearchResult`

**Example:**

```typescript
const result = await searchPOI({
  query: 'Starbucks',
  city: 'Beijing',
  pageNum: 1,
  pageSize: 20
});
```

---

### searchPOIAround

Search for nearby POIs around a specified location.

```typescript
async function searchPOIAround(params: {
  center: {
    latitude: number;
    longitude: number;
  };
  query?: string;
  type?: string;
  radius?: number;
  pageNum?: number;
  pageSize?: number;
}): Promise<POISearchResult>
```

**Parameters:**

- `center` (object, required): Center coordinates
  - `latitude` (number): Latitude
  - `longitude` (number): Longitude
- `query` (string, optional): Search keyword, can be empty to search all POIs
- `type` (string, optional): POI type code
- `radius` (number, optional): Search radius in meters, default is 1000, max is 50000
- `pageNum` (number, optional): Page number, default is 1
- `pageSize` (number, optional): Results per page, default is 20

**Returns:** `POISearchResult`

**Example:**

```typescript
const result = await searchPOIAround({
  center: {
    latitude: 39.908692,
    longitude: 116.397477
  },
  query: 'restaurant',
  radius: 2000,
  pageNum: 1
});
```

---

### searchPOIAlongRoute

Search for POIs along a route.

```typescript
async function searchPOIAlongRoute(params: {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  query?: string;
  type?: string;
  range?: number;
  pageNum?: number;
  pageSize?: number;
}): Promise<POISearchResult>
```

**Parameters:**

- `origin` (object, required): Starting point coordinates
- `destination` (object, required): Destination coordinates
- `query` (string, optional): Search keyword
- `type` (string, optional): POI type code
- `range` (number, optional): Deviation range from the route in meters, default is 500
- `pageNum` (number, optional): Page number
- `pageSize` (number, optional): Results per page

**Returns:** `POISearchResult`

**Example:**

```typescript
const result = await searchPOIAlongRoute({
  origin: {
    latitude: 39.908692,
    longitude: 116.397477
  },
  destination: {
    latitude: 39.989612,
    longitude: 116.480972
  },
  query: 'gas station',
  range: 1000
});
```

---

### searchInputTips

Get input suggestions (autocomplete).

```typescript
async function searchInputTips(params: {
  keyword: string;
  city?: string;
  type?: string;
}): Promise<InputTipsResult>
```

**Parameters:**

- `keyword` (string, required): Input keyword
- `city` (string, optional): City name
- `type` (string, optional): POI type code

**Returns:** `InputTipsResult`

**Example:**

```typescript
const result = await searchInputTips({
  keyword: 'Star',
  city: 'Beijing'
});
```

---

## Type Definitions

### POISearchResult

```typescript
interface POISearchResult {
  pois: POIItem[];
  pageCount: number;
  totalCount: number;
  suggestion?: {
    keywords: string[];
    cities: CityInfo[];
  };
}
```

### POIItem

```typescript
interface POIItem {
  uid: string;
  name: string;
  type: string;
  typeDes: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  tel: string;
  businessArea: string;
  parkingType: string;
  photos: PhotoInfo[];
  shopID?: string;
  postcode?: string;
  website?: string;
  email?: string;
  provinceCode?: string;
  cityCode?: string;
  adCode?: string;
  gridCode?: string;
  enterLocation?: {
    latitude: number;
    longitude: number;
  };
  exitLocation?: {
    latitude: number;
    longitude: number;
  };
}
```

### InputTipsResult

```typescript
interface InputTipsResult {
  tips: TipItem[];
}
```

### TipItem

```typescript
interface TipItem {
  uid: string;
  name: string;
  district: string;
  adcode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  typeDes: string;
}
```

---

## POI Type Codes

Common POI type codes (can be combined with "|", e.g., "060000|070000"):

| Code | Category | Description |
|------|----------|-------------|
| 010000 | Automotive | Car sales, repair, car wash, etc. |
| 020000 | Auto Services | Gas station, parking, etc. |
| 030000 | Motorcycles | Motorcycle sales, repair |
| 040000 | Dining | Restaurants, cafes, fast food, etc. |
| 050000 | Shopping | Shopping malls, supermarkets, specialty stores |
| 060000 | Daily Life | Post office, courier, laundry, photo studio |
| 070000 | Sports & Recreation | Stadium, cinema, KTV, park |
| 080000 | Healthcare | Hospital, clinic, pharmacy |
| 090000 | Accommodation | Hotel, guesthouse, hostel |
| 100000 | Scenic Spots | Tourist attractions, museums, parks |
| 110000 | Business & Residential | Office buildings, residential areas, industrial parks |
| 120000 | Government & Social | Government agencies, embassies, social groups |
| 130000 | Science & Education | School, library, research institute |
| 140000 | Transportation | Subway, bus, train station, airport |
| 150000 | Finance & Insurance | Bank, ATM, insurance company |
| 160000 | Companies | Enterprise, factory |
| 170000 | Roads | Highway, national road, street |
| 200000 | Addresses | Residential community, building number |

For the complete POI type code list, please refer to [AMap POI Classification](https://lbs.amap.com/api/webservice/guide/api/search#poi).

---

## Notes

1. **API Key Required**: Make sure you have configured the AMap API Key in your `app.json` or `app.config.js`
2. **Network Required**: All search requests require network connectivity
3. **Rate Limiting**: AMap API has request frequency limits, adjust appropriately in production
4. **Optional Module**: Search is an optional module, install only if needed to reduce app size
5. **Error Handling**: Always use try-catch to handle potential errors

---

## Related Documentation

- [Search Examples](../examples/search.md)
- [Search Feature Guide](../guide/search.md)
- [Core Module API](./index.md)