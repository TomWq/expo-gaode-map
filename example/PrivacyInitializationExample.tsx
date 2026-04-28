import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpoGaodeMapModule } from 'expo-gaode-map';

import {
  EXAMPLE_ANDROID_KEY,
  EXAMPLE_IOS_KEY,
  EXAMPLE_WEB_API_KEY,
} from './exampleConfig';

/**
 * 隐私确认与 SDK 初始化示例。
 * 这一页单独演示“用户同意前不初始化地图”的标准流程，
 * 便于业务方直接参考启动链路，而不是从旧版综合页里找代码。
 */
export default function PrivacyInitializationExample() {
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);
  const [initializing, setInitializing] = React.useState(false);
  const [sdkReady, setSdkReady] = React.useState(false);
  const [privacyStatusText, setPrivacyStatusText] = React.useState('未确认');
  const [resultText, setResultText] = React.useState(
    '还没有执行初始化。点击按钮后可查看隐私配置、权限与 SDK 初始化结果。'
  );

  const handleAgreeAndInit = React.useCallback(async () => {
    try {
      setInitializing(true);
      setSdkReady(false);

      ExpoGaodeMapModule.setPrivacyConfig({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
        privacyVersion: '2026-03-24',
      });

      const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();
      setPrivacyStatusText(
        `展示: ${privacyStatus.hasShow ? '是' : '否'} / 包含隐私: ${
          privacyStatus.hasContainsPrivacy ? '是' : '否'
        } / 同意: ${privacyStatus.hasAgree ? '是' : '否'}`
      );

      ExpoGaodeMapModule.initSDK({
        ...(EXAMPLE_ANDROID_KEY ? { androidKey: EXAMPLE_ANDROID_KEY } : {}),
        ...(EXAMPLE_IOS_KEY ? { iosKey: EXAMPLE_IOS_KEY } : {}),
        ...(EXAMPLE_WEB_API_KEY ? { webKey: EXAMPLE_WEB_API_KEY } : {}),
      });

      const permission = await ExpoGaodeMapModule.requestLocationPermission();
      const currentLocation = permission.granted
        ? await ExpoGaodeMapModule.getCurrentLocation().catch(() => null)
        : null;

      setSdkReady(true);
      setShowPrivacyModal(false);
      setResultText(
        [
          '初始化已完成。',
          `sdk版本号: ${ExpoGaodeMapModule.getVersion()}`,
          `定位权限: ${permission.granted ? '已授予' : '未授予'}`,
          currentLocation
            ? `当前位置: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
            : '当前位置: 未获取到，通常是权限未授予或设备未返回定位',
        ].join('\n')
      );
    } catch (error) {
      console.error('初始化失败:', error);
      const message = error instanceof Error ? error.message : '初始化失败';
      setResultText(`初始化失败：${message}`);
      setPrivacyStatusText(message);
      setSdkReady(false);
    } finally {
      setInitializing(false);
    }
  }, []);

  const handleReject = React.useCallback(() => {
    setShowPrivacyModal(false);
    setSdkReady(false);
    setResultText('你选择了暂不进入，当前不会初始化地图 SDK。');
    Alert.alert('未同意隐私说明', '示例按预期不会执行 SDK 初始化。');
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.heroCard}>
        <Text style={styles.badge}>启动链路</Text>
        <Text style={styles.title}>隐私确认与 SDK 初始化</Text>
        <Text style={styles.description}>
          这个示例只关注一件事：在用户同意前不调用地图初始化，用户确认后再设置隐私配置、初始化
          SDK，并按需请求定位权限。
        </Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>当前状态</Text>
          <Text style={styles.sectionText}>隐私状态：{privacyStatusText}</Text>
          <Text style={styles.sectionText}>SDK 状态：{sdkReady ? '已初始化' : '未初始化'}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>执行结果</Text>
          <Text style={styles.resultText}>{resultText}</Text>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => setShowPrivacyModal(true)}
        >
          <Text style={styles.primaryButtonText}>打开隐私弹窗并执行示例</Text>
        </Pressable>
      </View>

      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!initializing) {
            setShowPrivacyModal(false);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>隐私保护提示</Text>
            <Text style={styles.modalText}>
              为了使用地图渲染、定位与搜索能力，需要在你同意后再完成隐私配置和 SDK
              初始化。这也是业务接入时推荐放在启动流程里的顺序。
            </Text>
            <Text style={styles.modalMeta}>
              这个弹窗示例不会自动跳地图页，只负责演示初始化本身。
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleReject}
                disabled={initializing}
              >
                <Text style={styles.secondaryButtonText}>暂不同意</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.primaryModalButton]}
                onPress={() => {
                  void handleAgreeAndInit();
                }}
                disabled={initializing}
              >
                <Text style={styles.primaryModalButtonText}>
                  {initializing ? '初始化中...' : '同意并初始化'}
                </Text>
              </Pressable>
            </View>

            {initializing ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#2563eb" />
                <Text style={styles.loadingText}>正在执行 SDK 初始化</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(37,99,235,0.18)',
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    marginTop: 16,
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },
  description: {
    marginTop: 12,
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
  },
  sectionCard: {
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionText: {
    marginTop: 8,
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  resultText: {
    marginTop: 8,
    color: '#93c5fd',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 20,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.64)',
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  modalText: {
    marginTop: 12,
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
  },
  modalMeta: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 13,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 13,
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryModalButton: {
    backgroundColor: '#2563eb',
  },
  primaryModalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  loadingText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
});
