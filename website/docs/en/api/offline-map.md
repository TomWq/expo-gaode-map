# Offline Maps API

The Offline Maps API provides complete offline map management functionality, including download, update, delete, and storage management.

## OfflineMapManager

Offline map manager providing all offline map related functions.

### Methods

#### getAvailableCities()

Get list of all downloadable cities.

```tsx
const cities = await OfflineMapManager.getAvailableCities();
```

**Returns**
- `Promise<OfflineMapInfo[]>` - Array of city information

**Example**
```tsx
const cities = await OfflineMapManager.getAvailableCities();
console.log(`${cities.length} cities available`);

cities.forEach(city => {
  console.log(`${city.cityName}: ${(city.size / 1024 / 1024).toFixed(1)} MB`);
});
```

---

#### startDownload(options)

Start downloading offline map.

```tsx
await OfflineMapManager.startDownload(options);
```

**Parameters**
- `options.cityCode: string` - City code
- `options.allowCellular?: boolean` - Allow downloads over cellular (default `false`)

**Example**
```tsx
// WiFi only
await OfflineMapManager.startDownload({
  cityCode: '110000', // Beijing
  allowCellular: false,
});

// Allow cellular
await OfflineMapManager.startDownload({
  cityCode: '310000', // Shanghai
  allowCellular: true,
});
```

---

#### pauseDownload(cityCode)

Pause ongoing download.

```tsx
await OfflineMapManager.pauseDownload(cityCode);
```

**Parameters**
- `cityCode: string` - City code

**Example**
```tsx
await OfflineMapManager.pauseDownload('110000');
```

---

#### resumeDownload(cityCode)

Resume paused download.

```tsx
await OfflineMapManager.resumeDownload(cityCode);
```

**Parameters**
- `cityCode: string` - City code

**Example**
```tsx
await OfflineMapManager.resumeDownload('110000');
```

---

#### deleteMap(cityCode)

Delete offline map for specified city.

```tsx
await OfflineMapManager.deleteMap(cityCode);
```

**Parameters**
- `cityCode: string` - City code

**Example**
```tsx
await OfflineMapManager.deleteMap('110000');
console.log('Beijing offline map deleted');
```

---

#### clearAll()

Clear all downloaded offline maps.

```tsx
await OfflineMapManager.clearAll();
```

**Example**
```tsx
await OfflineMapManager.clearAll();
console.log('All offline maps cleared');
```

---

#### getDownloadedMaps()

Get list of downloaded maps.

```tsx
const maps = await OfflineMapManager.getDownloadedMaps();
```

**Returns**
- `Promise<OfflineMapInfo[]>` - Array of downloaded city information

**Example**
```tsx
const downloaded = await OfflineMapManager.getDownloadedMaps();
console.log(`${downloaded.length} cities downloaded`);

downloaded.forEach(city => {
  console.log(`✓ ${city.cityName}`);
});
```

---

#### getStorageInfo()

Get offline map storage information.

```tsx
const storage = await OfflineMapManager.getStorageInfo();
```

**Returns**
- `Promise<StorageInfo>` - Storage information object

**Example**
```tsx
const storage = await OfflineMapManager.getStorageInfo();

console.log('Used:', (storage.usedSpace / 1024 / 1024).toFixed(2), 'MB');
console.log('Available:', (storage.availableSpace / 1024 / 1024).toFixed(2), 'MB');
console.log('Total:', (storage.totalSpace / 1024 / 1024).toFixed(2), 'MB');
```

---

#### checkUpdate(cityCode)

Check if map has updates for specified city.

```tsx
const hasUpdate = await OfflineMapManager.checkUpdate(cityCode);
```

**Parameters**
- `cityCode: string` - City code

**Returns**
- `Promise<boolean>` - Whether update is available

**Example**
```tsx
const hasUpdate = await OfflineMapManager.checkUpdate('110000');

if (hasUpdate) {
  console.log('Beijing map has new version');
  await OfflineMapManager.updateMap('110000');
} else {
  console.log('Beijing map is up to date');
}
```

---

#### updateMap(cityCode)

Update offline map for specified city.

```tsx
await OfflineMapManager.updateMap(cityCode);
```

**Parameters**
- `cityCode: string` - City code

**Example**
```tsx
await OfflineMapManager.updateMap('110000');
console.log('Updating Beijing map');
```

---

### Event Listeners

#### addDownloadProgressListener(callback)

Listen to download progress events.

```tsx
const subscription = OfflineMapManager.addDownloadProgressListener(callback);
```

**Parameters**
- `callback: (event: OfflineMapProgressEvent) => void` - Callback function

**Returns**
- `Subscription` - Subscription object, call `remove()` to unsubscribe

**Event Object**
```tsx
interface OfflineMapProgressEvent {
  cityCode: string;
  cityName: string;
  progress: number; // 0-100
}
```

**Example**
```tsx
const subscription = OfflineMapManager.addDownloadProgressListener((event) => {
  console.log(`${event.cityName}: ${event.progress}%`);
  
  // Update UI progress bar
  setProgress(event.progress);
});

// Cleanup
return () => subscription.remove();
```

---

#### addDownloadCompleteListener(callback)

Listen to download completion events.

```tsx
const subscription = OfflineMapManager.addDownloadCompleteListener(callback);
```

**Parameters**
- `callback: (event: OfflineMapCompleteEvent) => void` - Callback function

**Event Object**
```tsx
interface OfflineMapCompleteEvent {
  cityCode: string;
  cityName: string;
}
```

**Example**
```tsx
const subscription = OfflineMapManager.addDownloadCompleteListener((event) => {
  Alert.alert('Download Complete', `${event.cityName} offline map downloaded`);
  loadData(); // Refresh list
});

return () => subscription.remove();
```

---

#### addDownloadErrorListener(callback)

Listen to download error events.

```tsx
const subscription = OfflineMapManager.addDownloadErrorListener(callback);
```

**Parameters**
- `callback: (event: OfflineMapErrorEvent) => void` - Callback function

**Event Object**
```tsx
interface OfflineMapErrorEvent {
  cityCode: string;
  cityName: string;
  error: string;
}
```

**Example**
```tsx
const subscription = OfflineMapManager.addDownloadErrorListener((event) => {
  console.error(`${event.cityName} download failed: ${event.error}`);
  Alert.alert('Download Failed', event.error);
});

return () => subscription.remove();
```

---

#### addDownloadPausedListener(callback)

Listen to download pause events.

```tsx
const subscription = OfflineMapManager.addDownloadPausedListener(callback);
```

**Parameters**
- `callback: (event: OfflineMapPausedEvent) => void` - Callback function

**Event Object**
```tsx
interface OfflineMapPausedEvent {
  cityCode: string;
  cityName: string;
}
```

**Example**
```tsx
const subscription = OfflineMapManager.addDownloadPausedListener((event) => {
  console.log(`${event.cityName} download paused`);
});

return () => subscription.remove();
```

---

#### addDownloadCancelledListener(callback)

Listen to download cancellation events.

```tsx
const subscription = OfflineMapManager.addDownloadCancelledListener(callback);
```

**Parameters**
- `callback: (event: OfflineMapCancelledEvent) => void` - Callback function

**Event Object**
```tsx
interface OfflineMapCancelledEvent {
  cityCode: string;
  cityName: string;
}
```

**Example**
```tsx
const subscription = OfflineMapManager.addDownloadCancelledListener((event) => {
  console.log(`${event.cityName} download cancelled`);
});

return () => subscription.remove();
```

---

## Type Definitions

### OfflineMapInfo

City offline map information.

```tsx
interface OfflineMapInfo {
  cityCode: string;      // City code
  cityName: string;      // City name
  size: number;          // Map size (bytes)
  status: OfflineMapStatus;
}
```

**Example**
```tsx
const city: OfflineMapInfo = {
  cityCode: '110000',
  cityName: 'Beijing',
  size: 103809024, // ~99 MB
  status: 'DOWNLOADED',
};
```

---

### OfflineMapStatus

Offline map status.

```tsx
type OfflineMapStatus = 
  | 'NOT_DOWNLOADED'     // Not downloaded
  | 'DOWNLOADING'        // Downloading
  | 'PAUSED'            // Paused
  | 'DOWNLOADED'        // Downloaded
  | 'ERROR';            // Error
```

**Example**
```tsx
const renderStatus = (status: OfflineMapStatus) => {
  switch (status) {
    case 'NOT_DOWNLOADED':
      return 'Not Downloaded';
    case 'DOWNLOADING':
      return 'Downloading';
    case 'PAUSED':
      return 'Paused';
    case 'DOWNLOADED':
      return 'Downloaded';
    case 'ERROR':
      return 'Error';
  }
};
```

---

### StorageInfo

Storage space information.

```tsx
interface StorageInfo {
  usedSpace: number;      // Used space (bytes)
  availableSpace: number; // Available space (bytes)
  totalSpace: number;     // Total space (bytes)
}
```

**Example**
```tsx
const storage: StorageInfo = {
  usedSpace: 209715200,     // 200 MB
  availableSpace: 5368709120, // 5 GB
  totalSpace: 10737418240,   // 10 GB
};

const usagePercent = (storage.usedSpace / storage.totalSpace) * 100;
console.log(`Used ${usagePercent.toFixed(1)}%`);
```

---

## Usage Examples

### Basic Download Flow

```tsx
import { useState, useEffect } from 'react';
import { OfflineMapManager } from 'expo-gaode-map';

function DownloadExample() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sub = OfflineMapManager.addDownloadProgressListener((event) => {
      setProgress(event.progress);
    });

    return () => sub.remove();
  }, []);

  const handleDownload = async () => {
    await OfflineMapManager.startDownload({
      cityCode: '110000',
      allowCellular: false,
    });
  };

  return (
    <View>
      <Button title="Download Beijing Map" onPress={handleDownload} />
      <ProgressBar progress={progress} />
    </View>
  );
}
```

### Storage Space Check

```tsx
const handleDownload = async (city: OfflineMapInfo) => {
  // Check storage space
  const storage = await OfflineMapManager.getStorageInfo();
  
  if (storage.availableSpace < city.size) {
    Alert.alert(
      'Insufficient Storage',
      `Requires ${(city.size / 1024 / 1024).toFixed(1)} MB, ` +
      `available ${(storage.availableSpace / 1024 / 1024).toFixed(1)} MB`
    );
    return;
  }
  
  await OfflineMapManager.startDownload({
    cityCode: city.cityCode,
    allowCellular: false,
  });
};
```

### Batch Update Check

```tsx
const checkAllUpdates = async () => {
  const downloaded = await OfflineMapManager.getDownloadedMaps();
  const updates: string[] = [];
  
  for (const city of downloaded) {
    const hasUpdate = await OfflineMapManager.checkUpdate(city.cityCode);
    if (hasUpdate) {
      updates.push(city.cityName);
    }
  }
  
  if (updates.length > 0) {
    Alert.alert(
      'Updates Available',
      `Updates found for:\n${updates.join(', ')}`
    );
  } else {
    Alert.alert('Notice', 'All maps are up to date');
  }
};
```

## Related Documentation

- [Offline Maps Guide](/en/guide/offline-map)
- [Complete Example](https://github.com/TomWq/expo-gaode-map/tree/main/example/OfflineMapExample.tsx)