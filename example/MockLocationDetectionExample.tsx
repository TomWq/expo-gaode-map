import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ExpoGaodeMapModule, { type Coordinates, type ReGeocode } from 'expo-gaode-map';

type LocationPayload = Coordinates | ReGeocode;

const formatBoolean = (value?: boolean) => {
  if (typeof value !== 'boolean') return '未返回';
  return value ? '是' : '否';
};

const formatValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '未返回';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '无效';
  return String(value);
};

export default function MockLocationDetectionExample() {
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const [mockEnable, setMockEnable] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationPayload | null>(null);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      ExpoGaodeMapModule.stop();
    };
  }, []);

  const applyMockEnable = (enabled: boolean) => {
    setMockEnable(enabled);
    ExpoGaodeMapModule.setMockEnable(enabled);
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      applyMockEnable(mockEnable);
      const result = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('定位失败', message);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (subscriptionRef.current) return;

    applyMockEnable(mockEnable);
    subscriptionRef.current = ExpoGaodeMapModule.addLocationListener((nextLocation) => {
      setLocation(nextLocation);
    });
    ExpoGaodeMapModule.start();
    setListening(true);
  };

  const stopListening = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    ExpoGaodeMapModule.stop();
    setListening(false);
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>虚拟定位检测</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Android 配置</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>允许返回模拟位置</Text>
            <Text style={styles.hint}>映射到 AMapLocationClientOption.setMockEnable</Text>
          </View>
          <Switch
            value={mockEnable}
            onValueChange={applyMockEnable}
            disabled={Platform.OS !== 'android'}
          />
        </View>
        {Platform.OS !== 'android' ? (
          <Text style={styles.platformHint}>当前平台不支持 mockEnable 配置，iOS 只展示系统返回的来源字段。</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={getCurrentLocation} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? '定位中...' : '获取单次定位'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, listening && styles.stopButton]}
          onPress={toggleListening}
        >
          <Text style={[styles.secondaryButtonText, listening && styles.stopButtonText]}>
            {listening ? '停止连续定位' : '开始连续定位'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>检测结果</Text>
        <InfoRow label="Android isMock" value={formatBoolean(location?.isMock)} />
        <InfoRow label="Android trustedLevel" value={formatValue(location?.trustedLevel)} />
        <InfoRow label="iOS isSimulatedBySoftware" value={formatBoolean(location?.isSimulatedBySoftware)} />
        <InfoRow label="iOS isProducedByAccessory" value={formatBoolean(location?.isProducedByAccessory)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>定位基础字段</Text>
        <InfoRow label="latitude" value={formatValue(location?.latitude)} />
        <InfoRow label="longitude" value={formatValue(location?.longitude)} />
        <InfoRow label="accuracy" value={formatValue(location?.accuracy)} />
        <InfoRow label="timestamp" value={formatValue(location?.timestamp)} />
        <InfoRow label="address" value={formatValue(location?.address)} />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#17202a',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17202a',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22313f',
  },
  hint: {
    fontSize: 12,
    color: '#6b7785',
    marginTop: 4,
  },
  platformHint: {
    color: '#6b7785',
    fontSize: 12,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1677ff',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1677ff',
  },
  secondaryButtonText: {
    color: '#1677ff',
    fontSize: 15,
    fontWeight: '700',
  },
  stopButton: {
    borderColor: '#d93025',
  },
  stopButtonText: {
    color: '#d93025',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6eaf0',
  },
  infoLabel: {
    flex: 1,
    color: '#52616f',
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    color: '#17202a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
});
