import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, Platform } from 'react-native';
import ExpoGaodeMapModule from 'expo-gaode-map';
import { PermissionUtils, LocationPermissionType } from 'expo-gaode-map';
import type { PermissionStatus } from 'expo-gaode-map';

/**
 * 权限管理完整示例
 * 
 * 展示了整合后的权限管理最佳实践：
 * 1. 使用 PermissionUtils 获取适配当前系统的说明文案
 * 2. 使用 ExpoGaodeMapModule 执行实际的权限请求
 * 3. 处理 Android 14+ 和 iOS 17+ 的特殊场景
 */
export default function PermissionExample() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [systemInfo, setSystemInfo] = useState<ReturnType<typeof PermissionUtils.getSystemInfo> | null>(null);

  // 检查权限状态
  const checkPermission = async () => {
    try {
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      setPermissionStatus(status);
      Alert.alert('权限状态', JSON.stringify(status, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('错误', message);
    }
  };

  // 请求前台位置权限（带说明文案）
  const requestForegroundPermission = async () => {
    try {
      // 1. 先获取适配当前系统的说明文案
      const rationale = PermissionUtils.getPermissionRationale(
        LocationPermissionType.FOREGROUND
      );

      // 2. 显示权限说明
      Alert.alert(
        '需要位置权限',
        rationale,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '授权',
            onPress: async () => {
              // 3. 执行实际的权限请求
              const result = await ExpoGaodeMapModule.requestLocationPermission();
              setPermissionStatus(result);

              if (result.granted) {
                Alert.alert('成功', '前台位置权限已授予');
              } else if (result.isPermanentlyDenied) {
                // 权限被永久拒绝，引导用户去设置页面
                Alert.alert(
                  '权限被拒绝',
                  '您已永久拒绝位置权限，请前往设置页面手动开启',
                  [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '去设置',
                      onPress: () => ExpoGaodeMapModule.openAppSettings(),
                    },
                  ]
                );
              } else {
                Alert.alert('失败', '位置权限未授予');
              }
            },
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('错误', message);
    }
  };

  // 请求后台位置权限（Android 10+、iOS）
  const requestBackgroundPermission = async () => {
    try {
      // 1. 先检查前台权限
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        Alert.alert('提示', '请先授予前台位置权限');
        return;
      }

      // 2. 获取后台权限说明文案
      const rationale = PermissionUtils.getPermissionRationale(
        LocationPermissionType.BACKGROUND
      );

      // 3. 显示权限说明
      Alert.alert(
        '需要后台位置权限',
        rationale,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '授权',
            onPress: async () => {
              // 4. 执行实际的权限请求
              const result = await ExpoGaodeMapModule.requestBackgroundLocationPermission();
              setPermissionStatus(result);

              if (result.granted) {
                Alert.alert('成功', '后台位置权限已授予');
              } else {
                Alert.alert('失败', '后台位置权限未授予');
              }
            },
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('错误', message);
    }
  };

  // 获取系统信息
  const getSystemInfo = () => {
    const info = PermissionUtils.getSystemInfo();
    setSystemInfo(info);
    Alert.alert('系统信息', JSON.stringify(info, null, 2));
  };

  // 查看最佳实践建议
  const showBestPractices = () => {
    const practices = PermissionUtils.getBestPractices();
    const message = Platform.OS === 'android'
      ? practices.android14.join('\n\n')
      : practices.ios17.join('\n\n');

    Alert.alert('最佳实践', message);
  };

  // 打印诊断信息
  const printDiagnostics = () => {
    PermissionUtils.printDiagnostics();
    Alert.alert('提示', '诊断信息已打印到控制台');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>权限管理完整示例</Text>
      <Text style={styles.subtitle}>
        整合了 PermissionUtils（文案工具）和 ExpoGaodeMapModule（实际请求）
      </Text>

      {/* 系统信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>系统信息</Text>
        <Button title="获取系统信息" onPress={getSystemInfo} />
        {systemInfo && (
          <View style={styles.info}>
            <Text>平台: {systemInfo.platform}</Text>
            <Text>版本: {systemInfo.version}</Text>
            <Text>Android 14+: {systemInfo.isAndroid14Plus ? '是' : '否'}</Text>
            <Text>iOS 17+: {systemInfo.isiOS17Plus ? '是' : '否'}</Text>
          </View>
        )}
      </View>

      {/* 权限检查 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>权限状态</Text>
        <Button title="检查权限状态" onPress={checkPermission} />
        {permissionStatus && (
          <View style={styles.info}>
            <Text>已授权: {permissionStatus.granted ? '是' : '否'}</Text>
            {Platform.OS === 'android' && (
              <>
                <Text>精确位置: {permissionStatus.fineLocation ? '是' : '否'}</Text>
                <Text>粗略位置: {permissionStatus.coarseLocation ? '是' : '否'}</Text>
                <Text>后台位置: {permissionStatus.backgroundLocation ? '是' : '否'}</Text>
                <Text>
                  永久拒绝: {permissionStatus.isPermanentlyDenied ? '是' : '否'}
                </Text>
              </>
            )}
            {Platform.OS === 'ios' && (
              <Text>状态: {permissionStatus.status}</Text>
            )}
          </View>
        )}
      </View>

      {/* 权限请求 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>权限请求</Text>
        <View style={styles.buttonGroup}>
          <Button
            title="请求前台位置权限"
            onPress={requestForegroundPermission}
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="请求后台位置权限"
            onPress={requestBackgroundPermission}
          />
          <View style={styles.buttonSpacer} />
          <Button
            title="打开应用设置"
            onPress={() => ExpoGaodeMapModule.openAppSettings()}
            color="#ff6b6b"
          />
        </View>
      </View>

      {/* 工具功能 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>工具功能</Text>
        <View style={styles.buttonGroup}>
          <Button title="查看最佳实践" onPress={showBestPractices} />
          <View style={styles.buttonSpacer} />
          <Button title="打印诊断信息" onPress={printDiagnostics} />
        </View>
      </View>

      {/* 使用说明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>使用说明</Text>
        <Text style={styles.description}>
          1. PermissionUtils：提供文案和诊断工具{'\n'}
          2. ExpoGaodeMapModule：执行实际权限请求{'\n'}
          3. Android 14+ 和 iOS 17+ 自动适配{'\n'}
          4. 权限被永久拒绝时引导用户去设置
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  info: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  buttonGroup: {
    gap: 8,
  },
  buttonSpacer: {
    height: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});