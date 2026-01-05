# Search API

The Search module provides native POI (Point of Interest) search functionality based on AMap SDK.

## Installation

```bash
bun add expo-gaode-map-search
# or
yarn add expo-gaode-map-search
# or
npm install expo-gaode-map-search
```

## Import

```typescript
import {
  initSearch,
  searchPOI,
  searchNearby,
  searchAlong,
  searchPolygon,
  getInputTips,
  type POI,
  type SearchResult,
  type InputTip,
  type InputTipsResult,
} from 'expo-gaode-map-search';
```

## API Methods

### initSearch

Optional manual initialization.

If you configured keys via Config Plugin or you already called `ExpoGaodeMapModule.initSDK()`, you can skip this.

```ts
function initSearch(): void;
```

### searchPOI

Search for POIs by keyword.

```typescript
async function searchPOI(params: {
  keyword: string;
  city?: string;
  types?: string;
  pageNum?: number;
  pageSize?: number;
  sortByDistance?: boolean;
  center?: { latitude: number; longitude: number };
}): Promise<SearchResult>
```

**Parameters:**

 - `keyword` (string, required): Search keyword
- `city` (string, optional): City name or code, e.g., "Beijing" or "010"
- `types` (string, optional): POI type codes joined by `|`, see [POI Type Codes](#poi-type-codes)
- `pageNum` (number, optional): Page number, starting from 1, default is 1
- `pageSize` (number, optional): Results per page, default is 20, max is 50
- `sortByDistance` (boolean, optional): Sort by distance (requires `center`)
- `center` (object, optional): Center point for distance sorting

**Returns:** `SearchResult`

**Example:**

```typescript
const result = await searchPOI({
  keyword: 'Starbucks',
  city: 'Beijing',
  pageNum: 1,
  pageSize: 20
});
```

---

### searchNearby

Search for nearby POIs around a specified location.

```typescript
async function searchNearby(params: {
  center: {
    latitude: number;
    longitude: number;
  };
  keyword: string;
  types?: string;
  radius?: number;
  pageNum?: number;
  pageSize?: number;
}): Promise<SearchResult>
```

**Parameters:**

- `center` (object, required): Center coordinates
  - `latitude` (number): Latitude
  - `longitude` (number): Longitude
- `keyword` (string, required): Search keyword
- `types` (string, optional): POI type codes
- `radius` (number, optional): Search radius in meters, default is 1000, max is 50000
- `pageNum` (number, optional): Page number, default is 1
- `pageSize` (number, optional): Results per page, default is 20

**Returns:** `SearchResult`

**Example:**

```typescript
const result = await searchNearby({
  center: {
    latitude: 39.908692,
    longitude: 116.397477
  },
  keyword: 'restaurant',
  radius: 2000,
  pageNum: 1
});
```

---

### searchAlong

Search for POIs along a route.

```typescript
async function searchAlong(params: {
  keyword: string;
  polyline: Array<{ latitude: number; longitude: number }>;
  range?: number;
  types?: string;
}): Promise<SearchResult>
```

**Parameters:**

- `keyword` (string, required): Search keyword
- `polyline` (array, required): Route points (at least 2)
- `range` (number, optional): Search range in meters, default is 500, max is 1000
- `types` (string, optional): POI type codes

**Returns:** `SearchResult`

**Example:**

```typescript
const result = await searchAlong({
  keyword: 'gas station',
  polyline: [
    { latitude: 39.908692, longitude: 116.397477 },
    { latitude: 39.989612, longitude: 116.480972 },
  ],
  range: 1000,
});
```

---

### searchPolygon

Search POIs inside a polygon.

```ts
async function searchPolygon(params: {
  keyword: string;
  polygon: Array<{ latitude: number; longitude: number }>;
  types?: string;
  pageNum?: number;
  pageSize?: number;
}): Promise<SearchResult>
```

---

### getInputTips

Get input suggestions (autocomplete).

```typescript
async function getInputTips(params: {
  keyword: string;
  city?: string;
  types?: string;
}): Promise<InputTipsResult>
```

**Parameters:**

- `keyword` (string, required): Input keyword
- `city` (string, optional): City name or code
- `types` (string, optional): POI type codes

**Returns:** `InputTipsResult`

**Example:**

```typescript
const result = await getInputTips({
  keyword: 'Star',
  city: 'Beijing'
});
```

---

## Type Definitions

### SearchResult

```typescript
interface SearchResult {
  pois: POI[];
  total: number;
  pageNum: number;
  pageSize: number;
  pageCount: number;
}
```

### POI

```typescript
interface POI {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  typeCode: string;
  typeDes: string;
  tel?: string;
  distance?: number;
  cityName?: string;
  cityCode?: string;
  provinceName?: string;
  adName?: string;
  adCode?: string;
}
```

### InputTipsResult

```typescript
interface InputTipsResult {
  tips: InputTip[];
}
```

### InputTip

```typescript
interface InputTip {
  id: string;
  name: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  typeCode?: string;
  cityName?: string;
  adName?: string;
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
