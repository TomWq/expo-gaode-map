# Offline Maps

expo-gaode-map supports offline map functionality, allowing users to download city map data for use in offline environments.

::: warning Important Note
Offline maps require the **3D Map SDK**. The 2D SDK does not support offline maps.
:::

::: tip Android Permission Requirements
Offline maps require the following permissions (Config Plugin adds them automatically):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```
If using Config Plugin, these permissions are configured automatically. For manual setup, ensure these permissions are added to your `AndroidManifest.xml`.
:::

## Features

- ✅ **City Map Downloads** - Download offline map data for cities across China
- ✅ **Download Management** - Pause, resume, and cancel downloads
- ✅ **Real-time Progress** - Monitor download progress and status in real-time
- ✅ **Storage Management** - View storage usage, delete and clear maps
- ✅ **Auto Updates** - Check and update offline map data
- ✅ **Network Control** - Restrict downloads to WiFi only

## Quick Start

### 1. Get Available Cities

```tsx
import { ExpoGaodeMapOfflineModule } from 'expo-gaode-map';

const cities = await ExpoGaodeMapOfflineModule.getAvailableCities();

cities.forEach(city => {
  console.log(`${city.cityName}: ${city.size / 1024 / 1024} MB`);
});
```

### 2. Start Download

```tsx
// Download Beijing map (WiFi only)
await ExpoGaodeMapOfflineModule.startDownload({
  cityCode: '110000',
  allowCellular: false, // WiFi only
});
```

### 3. Listen to Download Progress

```tsx
import { useEffect } from 'react';

useEffect(() => {
  // Listen to download progress
  const progressSub = ExpoGaodeMapOfflineModule.addDownloadProgressListener((event) => {
    console.log(`${event.cityName}: ${event.progress}%`);
  });

  // Listen to download completion
  const completeSub = ExpoGaodeMapOfflineModule.addDownloadCompleteListener((event) => {
    console.log(`${event.cityName} download complete!`);
  });

  // Listen to download errors
  const errorSub = ExpoGaodeMapOfflineModule.addDownloadErrorListener((event) => {
    console.error(`${event.cityName} download failed: ${event.error}`);
  });

  // Cleanup listeners
  return () => {
    progressSub.remove();
    completeSub.remove();
    errorSub.remove();
  };
}, []);
```

## Complete Example

Here's a complete example with download management, progress display, and status updates:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ExpoGaodeMapOfflineModule, type OfflineMapInfo } from 'expo-gaode-map';

export default function OfflineMapScreen() {
  const [cities, setCities] = useState<OfflineMapInfo[]>([]);
  const [downloadedCities, setDownloadedCities] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [downloading, setDownloading] = useState<string | null>(null);

  // Load city list
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    const [available, downloaded] = await Promise.all([
      ExpoGaodeMapOfflineModule.getAvailableCities(),
      ExpoGaodeMapOfflineModule.getDownloadedMaps(),
    ]);
    
    setCities(available.slice(0, 20)); // Show first 20 cities
    setDownloadedCities(downloaded.map(c => c.cityCode));
  };

  // Listen to download events
  useEffect(() => {
    const progressSub = ExpoGaodeMapOfflineModule.addDownloadProgressListener((event) => {
      setProgress(prev => ({
        ...prev,
        [event.cityCode]: event.progress,
      }));
    });

    const completeSub = ExpoGaodeMapOfflineModule.addDownloadCompleteListener((event) => {
      Alert.alert('Download Complete', `${event.cityName} offline map downloaded`);
      setDownloading(null);
      loadCities();
    });

    const errorSub = ExpoGaodeMapOfflineModule.addDownloadErrorListener((event) => {
      Alert.alert('Download Failed', `${event.cityName}: ${event.error}`);
      setDownloading(null);
    });

    return () => {
      progressSub.remove();
      completeSub.remove();
      errorSub.remove();
    };
  }, []);

  // Start download
  const handleDownload = async (city: OfflineMapInfo) => {
    setDownloading(city.cityCode);
    
    try {
      await ExpoGaodeMapOfflineModule.startDownload({
        cityCode: city.cityCode,
        allowCellular: false, // WiFi only
      });
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', 'Failed to start download');
      setDownloading(null);
    }
  };

  // Pause download
  const handlePause = async (cityCode: string) => {
    try {
      await ExpoGaodeMapOfflineModule.pauseDownload(cityCode);
      setDownloading(null);
    } catch (error) {
      console.error('Pause failed:', error);
    }
  };

  // Delete map
  const handleDelete = async (city: OfflineMapInfo) => {
    Alert.alert(
      'Confirm Delete',
      `Delete offline map for ${city.cityName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await ExpoGaodeMapOfflineModule.deleteMap(city.cityCode);
            loadCities();
          },
        },
      ]
    );
  };

  // Render city item
  const renderCity = ({ item }: { item: OfflineMapInfo }) => {
    const isDownloaded = downloadedCities.includes(item.cityCode);
    const isDownloading = downloading === item.cityCode;
    const currentProgress = progress[item.cityCode] || 0;

    return (
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.cityName}</Text>
        <Text style={{ color: '#666', marginTop: 4 }}>
          {(item.size / 1024 / 1024).toFixed(1)} MB
        </Text>

        {isDownloading && (
          <View style={{ marginTop: 8 }}>
            <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4 }}>
              <View
                style={{
                  height: '100%',
                  width: `${currentProgress}%`,
                  backgroundColor: '#4CAF50',
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={{ marginTop: 4, color: '#666' }}>{currentProgress}%</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {!isDownloaded && !isDownloading && (
            <TouchableOpacity
              onPress={() => handleDownload(item)}
              style={{
                backgroundColor: '#2196F3',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white' }}>Download</Text>
            </TouchableOpacity>
          )}

          {isDownloading && (
            <TouchableOpacity
              onPress={() => handlePause(item.cityCode)}
              style={{
                backgroundColor: '#FF9800',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white' }}>Pause</Text>
            </TouchableOpacity>
          )}

          {isDownloaded && (
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={{
                backgroundColor: '#F44336',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: 'white' }}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Offline Map Manager</Text>
        <Text style={{ marginTop: 4, color: '#666' }}>
          Downloaded: {downloadedCities.length} cities
        </Text>
      </View>

      <FlatList
        data={cities}
        keyExtractor={item => item.cityCode}
        renderItem={renderCity}
      />
    </View>
  );
}
```

## API Reference

### ExpoGaodeMapOfflineModule

#### Methods

##### getAvailableCities()

Get list of all downloadable cities.

```tsx
const cities = await ExpoGaodeMapOfflineModule.getAvailableCities();
```

**Returns**: `Promise<OfflineMapInfo[]>`

##### startDownload(options)

Start downloading offline map.

```tsx
await ExpoGaodeMapOfflineModule.startDownload({
  cityCode: '110000',
  allowCellular: false,
});
```

**Parameters**:
- `cityCode`: City code
- `allowCellular`: Allow downloads over cellular network (default `false`)

##### pauseDownload(cityCode)

Pause download.

```tsx
await ExpoGaodeMapOfflineModule.pauseDownload('110000');
```

##### resumeDownload(cityCode)

Resume download.

```tsx
await ExpoGaodeMapOfflineModule.resumeDownload('110000');
```

##### deleteMap(cityCode)

Delete offline map.

```tsx
await ExpoGaodeMapOfflineModule.deleteMap('110000');
```

##### clearAll()

Clear all offline maps.

```tsx
await ExpoGaodeMapOfflineModule.clearAll();
```

##### getDownloadedMaps()

Get list of downloaded maps.

```tsx
const downloaded = await ExpoGaodeMapOfflineModule.getDownloadedMaps();
```

**Returns**: `Promise<OfflineMapInfo[]>`

##### getStorageInfo()

Get storage information.

```tsx
const storage = await ExpoGaodeMapOfflineModule.getStorageInfo();
console.log('Used:', storage.usedSpace / 1024 / 1024, 'MB');
console.log('Available:', storage.availableSpace / 1024 / 1024, 'MB');
```

##### checkUpdate(cityCode)

Check if map has updates.

```tsx
const hasUpdate = await ExpoGaodeMapOfflineModule.checkUpdate('110000');
if (hasUpdate) {
  await ExpoGaodeMapOfflineModule.updateMap('110000');
}
```

##### updateMap(cityCode)

Update offline map.

```tsx
await ExpoGaodeMapOfflineModule.updateMap('110000');
```

#### Event Listeners

##### addDownloadProgressListener(callback)

Listen to download progress.

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadProgressListener((event) => {
  console.log(`${event.cityName}: ${event.progress}%`);
});

// Cleanup
subscription.remove();
```

**Event object**:
```tsx
{
  cityCode: string;
  cityName: string;
  progress: number; // 0-100
}
```

##### addDownloadCompleteListener(callback)

Listen to download completion.

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadCompleteListener((event) => {
  console.log(`${event.cityName} download complete`);
});
```

##### addDownloadErrorListener(callback)

Listen to download errors.

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadErrorListener((event) => {
  console.error(`${event.cityName} error: ${event.error}`);
});
```

##### addDownloadPausedListener(callback)

Listen to download pauses.

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadPausedListener((event) => {
  console.log(`${event.cityName} paused`);
});
```

##### addDownloadCancelledListener(callback)

Listen to download cancellations.

```tsx
const subscription = ExpoGaodeMapOfflineModule.addDownloadCancelledListener((event) => {
  console.log(`${event.cityName} cancelled`);
});
```

### Type Definitions

```tsx
interface OfflineMapInfo {
  cityCode: string;      // City code
  cityName: string;      // City name
  size: number;          // Map size (bytes)
  status: OfflineMapStatus;
}

type OfflineMapStatus = 
  | 'NOT_DOWNLOADED'     // Not downloaded
  | 'DOWNLOADING'        // Downloading
  | 'PAUSED'            // Paused
  | 'DOWNLOADED'        // Downloaded
  | 'ERROR';            // Error

interface StorageInfo {
  usedSpace: number;      // Used space (bytes)
  availableSpace: number; // Available space (bytes)
  totalSpace: number;     // Total space (bytes)
}
```

## Best Practices

### 1. Check Storage Space

Check available space before downloading:

```tsx
const handleDownload = async (city: OfflineMapInfo) => {
  const storage = await ExpoGaodeMapOfflineModule.getStorageInfo();
  
  if (storage.availableSpace < city.size) {
    Alert.alert('Insufficient Storage', 'Please free up storage space');
    return;
  }
  
  await ExpoGaodeMapOfflineModule.startDownload({
    cityCode: city.cityCode,
    allowCellular: false,
  });
};
```

### 2. Error Handling

Include error handling for all async operations:

```tsx
try {
  await ExpoGaodeMapOfflineModule.startDownload({ cityCode });
} catch (error) {
  console.error('Download failed:', error);
  Alert.alert('Error', 'Failed to start download, please try again');
}
```

### 3. Cleanup Listeners

Use useEffect cleanup function:

```tsx
useEffect(() => {
  const progressSub = ExpoGaodeMapOfflineModule.addDownloadProgressListener(handler);
  
  return () => {
    progressSub.remove(); // Cleanup listener
  };
}, []);
```

### 4. Network Control

Default to WiFi-only downloads to protect user's data:

```tsx
await ExpoGaodeMapOfflineModule.startDownload({
  cityCode: city.cityCode,
  allowCellular: false, // ✅ Recommended
});
```

### 5. Auto Update Check

Periodically check for map updates:

```tsx
const checkUpdates = async () => {
  const downloaded = await ExpoGaodeMapOfflineModule.getDownloadedMaps();
  
  for (const city of downloaded) {
    const hasUpdate = await ExpoGaodeMapOfflineModule.checkUpdate(city.cityCode);
    if (hasUpdate) {
      // Notify user about update
    }
  }
};
```

## Important Notes

1. **SDK Requirement**: Offline maps only work with the 3D Map SDK
2. **Android Permissions**: Requires network and storage permissions (Config Plugin adds automatically):
   - `INTERNET` - Download map data
   - `ACCESS_NETWORK_STATE` - Check network status
   - `WRITE_EXTERNAL_STORAGE` - Store offline maps
3. **Storage Space**: Each city map typically requires 50-150 MB
4. **Download Time**: Depends on network speed and map size
5. **Auto Loading**: SDK automatically uses offline data after download
6. **Data Updates**: Regularly check and update offline maps

## FAQ

### Where are offline maps stored?

Offline map data is stored in the app's private directory and will be deleted when the app is uninstalled.

### How do I know the map is using offline data?

The SDK automatically detects and uses offline data without extra configuration. In offline mode, the map automatically switches to offline data.

### Can I download multiple cities simultaneously?

Technically yes, but it's recommended to download one city at a time for better progress management and error handling.

### How to resume after download interruption?

Use the `resumeDownload()` method to resume from where it stopped:

```tsx
await ExpoGaodeMapOfflineModule.resumeDownload(cityCode);
```

### How to delete all offline maps?

Use the `clearAll()` method:

```tsx
await ExpoGaodeMapOfflineModule.clearAll();
```

## Related Links

- [Complete Example Code](https://github.com/TomWq/expo-gaode-map/tree/main/example/OfflineMapExample.tsx)
- [API Documentation](/api/)
- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)