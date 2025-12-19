/**
 * 离线地图完整示例
 * 演示如何使用 expo-gaode-map 下载和管理离线地图
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  OfflineMapManager,
  OfflineMapInfo,
  OfflineMapDownloadEvent,
  OfflineMapCompleteEvent,
  OfflineMapErrorEvent,
  OfflineMapPausedEvent,
  OfflineMapCancelledEvent,
} from 'expo-gaode-map';

interface DownloadProgress {
  [cityCode: string]: number;
}

export default function OfflineMapExample() {
  const [cities, setCities] = useState<OfflineMapInfo[]>([]);
  const [downloadedCities, setDownloadedCities] = useState<OfflineMapInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCities, setDownloadingCities] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<DownloadProgress>({});
  const [storageInfo, setStorageInfo] = useState<{
    offlineMapSize: number;
    availableSpace: number;
  } | null>(null);

  // 加载城市列表和已下载列表
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 并发加载数据
      const [availableCities, downloaded, storage] = await Promise.all([
        OfflineMapManager.getAvailableCities(),
        OfflineMapManager.getDownloadedMaps(),
        OfflineMapManager.getStorageInfo(),
      ]);

      console.log('可用城市数量:', availableCities.length);
      console.log('已下载城市数量:', downloaded.length);
      console.log('已下载城市:', downloaded.map(c => c.cityName).join(', '));

      // 只显示前20个城市（演示用）
      setCities(availableCities.slice(0, 20));
      setDownloadedCities(downloaded);
      setStorageInfo(storage);
    } catch (error) {
      console.error('加载数据失败:', error);
      Alert.alert('错误', '加载城市列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听下载事件
  useEffect(() => {
    // 监听下载进度 - 使用 requestAnimationFrame 优化
    let progressFrame: number | null = null;
    let pendingUpdates: { [key: string]: number } = {};
    
    const progressSub = OfflineMapManager.addDownloadProgressListener((event: OfflineMapDownloadEvent) => {
      // 收集待更新的进度
      pendingUpdates[event.cityCode] = event.progress;
      
      // 使用 RAF 批量更新,保持流畅
      if (progressFrame === null) {
        progressFrame = requestAnimationFrame(() => {
          setProgress((prev) => ({
            ...prev,
            ...pendingUpdates,
          }));
          pendingUpdates = {};
          progressFrame = null;
        });
      }
    });

    // 监听下载完成
    const completeSub = OfflineMapManager.addDownloadCompleteListener((event: OfflineMapCompleteEvent) => {
      console.log(`${event.cityName} 下载完成`);
      
      Alert.alert('下载完成', `${event.cityName} 离线地图已下载完成`);
      
      setDownloadingCities(prev => {
        const next = new Set(prev);
        next.delete(event.cityCode);
        return next;
      });
      setProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[event.cityCode];
        return newProgress;
      });
      
      // 刷新列表
      loadData();
    });

    // 监听下载错误
    const errorSub = OfflineMapManager.addDownloadErrorListener((event: OfflineMapErrorEvent) => {
      console.error(`${event.cityName} 下载失败:`, event.error);
      
      Alert.alert('下载失败', `${event.cityName}: ${event.error}`);
      
      setDownloadingCities(prev => {
        const next = new Set(prev);
        next.delete(event.cityCode);
        return next;
      });
      setProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[event.cityCode];
        return newProgress;
      });
    });

    // 监听下载暂停
    const pausedSub = OfflineMapManager.addDownloadPausedListener((event: OfflineMapPausedEvent) => {
      console.log(`✅ ${event.cityName} 已暂停`);
      
      setDownloadingCities(prev => {
        const next = new Set(prev);
        next.delete(event.cityCode);
        return next;
      });
      
      // 更新城市状态为暂停
      setCities(prevCities => prevCities.map(city =>
        city.cityCode === event.cityCode
          ? { ...city, status: 'paused' as const }
          : city
      ));
    });

    // 监听下载取消
    const cancelledSub = OfflineMapManager.addDownloadCancelledListener((event: OfflineMapCancelledEvent) => {
      console.log(`${event.cityName} 已取消`);
      
      setDownloadingCities(prev => {
        const next = new Set(prev);
        next.delete(event.cityCode);
        return next;
      });
      setProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[event.cityCode];
        return newProgress;
      });
      
      // 刷新列表
      loadData();
    });

    // 初始加载数据
    loadData();

    // 清理监听器
    return () => {
      if (progressFrame !== null) cancelAnimationFrame(progressFrame);
      progressSub.remove();
      completeSub.remove();
      errorSub.remove();
      pausedSub.remove();
      cancelledSub.remove();
    };
  }, []);

  // 开始下载
  const handleDownload = async (city: OfflineMapInfo) => {
    try {
      console.log('🚀 开始下载:', city.cityName, city.cityCode);
      
      // 检查存储空间
      if (storageInfo && storageInfo.availableSpace < city.size) {
        Alert.alert('存储空间不足', `需要 ${formatSize(city.size)}，但只有 ${formatSize(storageInfo.availableSpace)} 可用`);
        return;
      }

      // 先添加到下载队列
      setDownloadingCities(prev => {
        const next = new Set(prev);
        next.add(city.cityCode);
        console.log('📊 更新下载队列:', Array.from(next));
        return next;
      });
      setProgress((prev) => ({ ...prev, [city.cityCode]: 0 }));

      // 调用原生下载方法
      await OfflineMapManager.startDownload({
        cityCode: city.cityCode,
        allowCellular: false, // 仅 WiFi 下载
      });
      
      console.log('✅ startDownload 调用成功');
    } catch (error) {
      console.error('❌ 开始下载失败:', error);
      Alert.alert('错误', '开始下载失败');
      setDownloadingCities(prev => {
        const next = new Set(prev);
        next.delete(city.cityCode);
        return next;
      });
    }
  };

  // 暂停下载
  const handlePause = async (cityCode: string) => {
    try {
      console.log('🔴 暂停下载:', cityCode);
      
      // 调用原生暂停方法
      await OfflineMapManager.pauseDownload(cityCode);
      
      console.log('✅ 暂停成功');
    } catch (error) {
      console.error('❌ 暂停失败:', error);
      Alert.alert('错误', '暂停下载失败');
    }
  };

  // 恢复下载
  const handleResume = async (cityCode: string) => {
    try {
      setDownloadingCities(prev => new Set(prev).add(cityCode));
      await OfflineMapManager.resumeDownload(cityCode);
    } catch (error) {
      console.error('恢复失败:', error);
      setDownloadingCities(prev => {
        const next = new Set(prev);
        next.delete(cityCode);
        return next;
      });
    }
  };

  // 删除离线地图
  const handleDelete = async (city: OfflineMapInfo) => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${city.cityName} 的离线地图吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await OfflineMapManager.deleteMap(city.cityCode);
              
              // 立即更新 UI,将城市状态改为未下载
              setCities(prevCities => prevCities.map(c =>
                c.cityCode === city.cityCode
                  ? { ...c, status: 'not_downloaded' as const, progress: 0, downloadedSize: 0 }
                  : c
              ));
              
              // 然后刷新完整数据
              await loadData();
              Alert.alert('成功', `${city.cityName} 离线地图已删除`);
            } catch (error) {
              console.error('删除失败:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  // 检查更新
  const handleCheckUpdate = async (city: OfflineMapInfo) => {
    try {
      const hasUpdate = await OfflineMapManager.checkUpdate(city.cityCode);
      if (hasUpdate) {
        Alert.alert(
          '发现更新',
          `${city.cityName} 有新版本可用，是否更新？`,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '更新',
              onPress: async () => {
                setDownloadingCities(prev => new Set(prev).add(city.cityCode));
                await OfflineMapManager.updateMap(city.cityCode);
              },
            },
          ]
        );
      } else {
        Alert.alert('提示', `${city.cityName} 已是最新版本`);
      }
    } catch (error) {
      console.error('检查更新失败:', error);
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // 获取状态标签
  const getStatusLabel = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      not_downloaded: '未下载',
      downloading: '下载中',
      downloaded: '已下载',
      paused: '已暂停',
      failed: '下载失败',
      updating: '更新中',
      unzipping: '解压中',
    };
    return statusMap[status] || status;
  };

  // 渲染城市项
  const renderCityItem = ({ item }: { item: OfflineMapInfo }) => {
    const isDownloaded = item.status === 'downloaded';
    const isDownloading = downloadingCities.has(item.cityCode);
    const isPaused = item.status === 'paused';
    const currentProgress = progress[item.cityCode] || 0;

    return (
      <View style={styles.cityItem}>
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{item.cityName}</Text>
          <Text style={styles.citySize}>{formatSize(item.size)}</Text>
          <Text style={styles.cityStatus}>{getStatusLabel(item.status)}</Text>
        </View>

        {isDownloading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${currentProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{currentProgress}%</Text>
          </View>
        )}

        <View style={styles.actions}>
          {isDownloaded ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={() => handleCheckUpdate(item)}
              >
                <Text style={styles.buttonText}>检查更新</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.buttonText}>删除</Text>
              </TouchableOpacity>
            </>
          ) : isDownloading ? (
            <TouchableOpacity
              style={[styles.button, styles.pauseButton]}
              onPress={() => handlePause(item.cityCode)}
            >
              <Text style={styles.buttonText}>暂停</Text>
            </TouchableOpacity>
          ) : isPaused ? (
            <TouchableOpacity
              style={[styles.button, styles.downloadButton]}
              onPress={() => handleResume(item.cityCode)}
            >
              <Text style={styles.buttonText}>继续</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.downloadButton]}
              activeOpacity={0.7}
              onPress={() => {
                console.log('🎯 点击下载按钮:', item.cityName, item.cityCode);
                handleDownload(item);
              }}
            >
              <Text style={styles.buttonText}>下载</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 头部统计 */}
      <View style={styles.header}>
        <Text style={styles.title}>离线地图管理</Text>
        {storageInfo && (
          <View style={styles.stats}>
            <Text style={styles.statText}>
              已下载: {downloadedCities.length} 个城市 (列表中显示: {cities.filter(c => c.status === 'downloaded').length} 个)
            </Text>
            <Text style={styles.statText}>
              占用空间: {formatSize(storageInfo.offlineMapSize)}
            </Text>
          </View>
        )}
      </View>

      {/* 城市列表 */}
      <FlatList
        data={cities}
        keyExtractor={(item) => item.cityCode}
        renderItem={renderCityItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        extraData={`${Array.from(downloadingCities).join(',')}-${JSON.stringify(progress)}`}
      />

      {/* 批量操作按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={async () => {
            Alert.alert(
              '确认清除',
              '确定要删除所有离线地图吗？',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '清除',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await OfflineMapManager.clearAllMaps();
                      Alert.alert('成功', '所有离线地图已清除');
                      loadData();
                    } catch (error) {
                      Alert.alert('错误', '清除失败');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.buttonText}>清除所有</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  cityItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cityInfo: {
    marginBottom: 12,
  },
  cityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  citySize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cityStatus: {
    fontSize: 14,
    color: '#1890ff',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1890ff',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  downloadButton: {
    backgroundColor: '#1890ff',
  },
  pauseButton: {
    backgroundColor: '#faad14',
  },
  updateButton: {
    backgroundColor: '#52c41a',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
  },
  clearButton: {
    backgroundColor: '#ff4d4f',
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    height:80
  },
});