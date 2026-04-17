
import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import ExpoGaodeMapModule from 'expo-gaode-map';

/**
 * 测试新增的权限方法
 */
export default function TestNewPermissionMethods() {
  const testOpenAppSettings = () => {
    try {
      ExpoGaodeMapModule.openAppSettings();
      Alert.alert('成功', '已打开应用设置页面');
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const testRequestBackgroundPermission = async () => {
    try {
      const result = await ExpoGaodeMapModule.requestBackgroundLocationPermission();
      Alert.alert('后台权限结果', JSON.stringify(result, null, 2));
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  const testCheckPermission = async () => {
    try {
      const result = await ExpoGaodeMapModule.checkLocationPermission();
      Alert.alert('权限状态', JSON.stringify(result, null, 2));
    } catch (error: any) {
      Alert.alert('错误', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>测试新增权限方法</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="1. 检查权限状态"
          onPress={testCheckPermission}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="2. 请求后台位置权限"
          onPress={testRequestBackgroundPermission}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="3. 打开应用设置"
          onPress={testOpenAppSettings}
          color="#ff6b6b"
        />
      </View>

      <Text style={styles.note}>
        注意：{'\n'}
        - Android: 需要先授予前台权限，然后才能请求后台权限{'\n'}
        - iOS: 后台权限需要在系统设置中手动授予"始终"权限
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 15,
  },
  note: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 20,
  },
});