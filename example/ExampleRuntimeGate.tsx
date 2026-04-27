import React from 'react';
import {
  ActivityIndicator,
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

type ExampleRuntimeGateProps = {
  children: React.ReactNode;
};

/**
 * 统一的示例运行壳层。
 * 目录页和各个示例都经过这里，先完成隐私确认和 SDK 初始化，
 * 再进入真正的示例内容，避免每个页面都重复写一套启动逻辑。
 */
export default function ExampleRuntimeGate({
  children,
}: ExampleRuntimeGateProps) {
  const [ready, setReady] = React.useState(false);
  const [initializing, setInitializing] = React.useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);
  const [privacyStatusText, setPrivacyStatusText] = React.useState('未确认');

  const handleEnterExamples = React.useCallback(async () => {
    try {
      setInitializing(true);

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

      try {
        const permission = await ExpoGaodeMapModule.checkLocationPermission();
        if (!permission.granted) {
          await ExpoGaodeMapModule.requestLocationPermission();
        }
      } catch (permissionError) {
        console.warn('示例入口请求定位权限失败:', permissionError);
      }

      setShowPrivacyModal(false);
      setReady(true);
    } catch (error) {
      console.error('示例入口初始化失败:', error);
      setPrivacyStatusText(
        error instanceof Error ? error.message : '初始化失败，请检查 Key 或原生配置'
      );
    } finally {
      setInitializing(false);
    }
  }, []);

  if (ready) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.heroCard}>
        <Text style={styles.badge}>expo-gaode-map</Text>
        <Text style={styles.title}>示例中心入口</Text>
        <Text style={styles.description}>
          这里先做一次统一的隐私确认和 SDK 初始化，后面的地图、覆盖物、Web
          API 示例就都可以直接打开查看。
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => setShowPrivacyModal(true)}
        >
          <Text style={styles.primaryButtonText}>查看隐私说明并进入</Text>
        </Pressable>
        <Text style={styles.metaText}>当前状态：{privacyStatusText}</Text>
        <Text style={styles.noticeText}>
          `navigation` 的地图仍然保持独立实现，不在这里和 `core` 共用 MapView。
        </Text>
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
            <Text style={styles.modalTitle}>隐私与初始化说明</Text>
            <Text style={styles.modalText}>
              地图渲染、定位与搜索相关示例，在进入前需要先完成隐私确认，并初始化高德
              SDK。你同意后，示例中心会统一完成这一步，后续各个示例页就能直接查看。
            </Text>
            <Text style={styles.modalMeta}>
              如果定位权限未授予，地图本身仍可查看，但依赖当前位置的示例可能会退回到默认坐标。
            </Text>

            <View style={styles.modalButtonRow}>
              <Pressable
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => setShowPrivacyModal(false)}
                disabled={initializing}
              >
                <Text style={styles.secondaryButtonText}>暂不进入</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.primaryModalButton]}
                onPress={() => {
                  void handleEnterExamples();
                }}
                disabled={initializing}
              >
                <Text style={styles.primaryModalButtonText}>
                  {initializing ? '初始化中...' : '同意并进入'}
                </Text>
              </Pressable>
            </View>
            {initializing ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#2563eb" />
                <Text style={styles.loadingText}>正在准备示例环境</Text>
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
    backgroundColor: 'rgba(59,130,246,0.16)',
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    marginTop: 16,
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  description: {
    marginTop: 12,
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 24,
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
  metaText: {
    marginTop: 16,
    color: '#93c5fd',
    fontSize: 13,
    lineHeight: 20,
  },
  noticeText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
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
  modalButtonRow: {
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
