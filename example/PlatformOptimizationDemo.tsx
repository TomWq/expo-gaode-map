/**
 * 平台优化功能综合示例
 * 
 * 展示：
 * 1. Android 14+ 权限适配
 * 2. 折叠屏设备适配
 * 3. iOS 17+ 新特性支持
 * 4. iPad 多任务优化
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  FoldableMapView,
  PlatformDetector,
  PermissionUtils,
  LocationPermissionType,
  DeviceInfo,
  FoldState,
  SystemVersion,
} from '../packages/core/src';

export default function PlatformOptimizationDemo() {
  const [systemInfo, setSystemInfo] = useState<SystemVersion | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [foldState, setFoldState] = useState<FoldState>(FoldState.UNKNOWN);

  useEffect(() => {
    // 获取系统和设备信息
    const sysInfo = PlatformDetector.getSystemVersion();
    const devInfo = PlatformDetector.getDeviceInfo();
    const fold = PlatformDetector.getFoldState();

    setSystemInfo(sysInfo);
    setDeviceInfo(devInfo);
    setFoldState(fold);

    // 打印诊断信息
    console.log('=== 平台优化诊断 ===');
    PermissionUtils.printDiagnostics();

    // iOS 配置验证
    if (Platform.OS === 'ios') {
      const validation = PermissionUtils.validateiOSConfiguration();
      console.log('iOS 配置验证:', validation);
    }
  }, []);

  /**
   * 请求位置权限（Android 14+ 适配）
   */
  const handleRequestPermission = () => {
    const rationale = PermissionUtils.getPermissionRationale(
      LocationPermissionType.FOREGROUND
    );

    Alert.alert(
      '需要位置权限',
      rationale,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '授权',
          onPress: () => {
            console.log('用户同意授权');
            // 这里应该调用实际的权限请求 API
            // 例如使用 expo-location
          },
        },
      ]
    );
  };

  /**
   * 请求后台位置权限
   */
  const handleRequestBackgroundPermission = () => {
    if (!PermissionUtils.supportsBackgroundLocation()) {
      Alert.alert('提示', '当前系统版本不支持后台位置权限');
      return;
    }

    const rationale = PermissionUtils.getPermissionRationale(
      LocationPermissionType.BACKGROUND
    );

    Alert.alert(
      '需要后台位置权限',
      rationale,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '授权',
          onPress: () => {
            console.log('用户同意后台授权');
            // 实际权限请求
          },
        },
      ]
    );
  };

  /**
   * 显示精确位置说明（iOS 14+）
   */
  const handleShowAccuracyInfo = () => {
    const rationale = PermissionUtils.getAccuracyRationale();
    Alert.alert('精确位置', rationale);
  };

  /**
   * 折叠状态变化回调
   */
  const handleFoldStateChange = (state: FoldState, info: DeviceInfo) => {
    console.log('折叠状态变化:', state);
    setFoldState(state);
    setDeviceInfo(info);

    // 可选：显示提示
    if (state === FoldState.UNFOLDED) {
      console.log('设备已展开，地图视野扩大');
    } else if (state === FoldState.FOLDED) {
      console.log('设备已折叠，地图视野缩小');
    }
  };

  if (!systemInfo || !deviceInfo) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 地图视图 - 自动适配折叠屏 */}
      <FoldableMapView
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 12,
        }}
        foldableConfig={{
          autoAdjustZoom: true,
          unfoldedZoomDelta: 1,
          keepCenterOnFold: true,
          onFoldStateChange: handleFoldStateChange,
          debug: __DEV__,
        }}
      />

      {/* 信息面板 */}
      <ScrollView style={styles.infoPanel}>
        <Text style={styles.title}>平台信息</Text>
        
        {/* 系统信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系统版本</Text>
          <Text>平台: {systemInfo.platform}</Text>
          <Text>版本: {systemInfo.version}</Text>
          <Text>
            Android 14+: {systemInfo.isAndroid14Plus ? '✅' : '❌'}
          </Text>
          <Text>
            iOS 17+: {systemInfo.isIOS17Plus ? '✅' : '❌'}
          </Text>
        </View>

        {/* 设备信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设备信息</Text>
          <Text>类型: {deviceInfo.type}</Text>
          <Text>是否平板: {deviceInfo.isTablet ? '是' : '否'}</Text>
          <Text>是否折叠屏: {deviceInfo.isFoldable ? '是' : '否'}</Text>
          <Text>屏幕尺寸: {deviceInfo.screenSize.width.toFixed(0)} x {deviceInfo.screenSize.height.toFixed(0)}</Text>
          <Text>宽高比: {deviceInfo.aspectRatio.toFixed(2)}</Text>
          {deviceInfo.isFoldable && (
            <Text>折叠状态: {foldState}</Text>
          )}
        </View>

        {/* 权限管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>权限管理</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestPermission}
          >
            <Text style={styles.buttonText}>
              请求位置权限 {systemInfo.isAndroid14Plus ? '(Android 14+)' : ''}
            </Text>
          </TouchableOpacity>

          {PermissionUtils.supportsBackgroundLocation() && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleRequestBackgroundPermission}
            >
              <Text style={styles.buttonText}>请求后台位置权限</Text>
            </TouchableOpacity>
          )}

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleShowAccuracyInfo}
            >
              <Text style={styles.buttonText}>
                精确位置说明 {systemInfo.isIOS17Plus ? '(iOS 17+)' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 特性支持 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>特性支持</Text>
          <Text>
            后台位置: {PermissionUtils.supportsBackgroundLocation() ? '✅' : '❌'}
          </Text>
          <Text>
            多任务模式: {PlatformDetector.supportsMultitasking() ? '✅' : '❌'}
          </Text>
          <Text>
            折叠屏适配: {deviceInfo.isFoldable ? '✅' : '❌'}
          </Text>
        </View>

        {/* 最佳实践提示 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最佳实践</Text>
          {systemInfo.isAndroid14Plus && (
            <View style={styles.tip}>
              <Text style={styles.tipTitle}>📱 Android 14+</Text>
              <Text>• 先解释权限用途再请求</Text>
              <Text>• 前台/后台权限分两步</Text>
              <Text>• 支持"仅本次"选项</Text>
            </View>
          )}
          {systemInfo.isIOS17Plus && (
            <View style={styles.tip}>
              <Text style={styles.tipTitle}>🍎 iOS 17+</Text>
              <Text>• 配置 Privacy Manifest</Text>
              <Text>• 清晰的权限说明文案</Text>
              <Text>• 支持精确/模糊位置</Text>
            </View>
          )}
          {deviceInfo.isFoldable && (
            <View style={styles.tip}>
              <Text style={styles.tipTitle}>📲 折叠屏</Text>
              <Text>• 自动调整地图缩放</Text>
              <Text>• 展开时显示更多内容</Text>
              <Text>• 折叠时保持可用性</Text>
            </View>
          )}
          {PlatformDetector.supportsMultitasking() && (
            <View style={styles.tip}>
              <Text style={styles.tipTitle}>📐 iPad 多任务</Text>
              <Text>• 适配分屏模式</Text>
              <Text>• 响应式布局</Text>
              <Text>• 优化内存使用</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    height: '50%',
  },
  infoPanel: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  tip: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f4f8',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  tipTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
});