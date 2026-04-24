import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import ExampleRuntimeGate from '../../ExampleRuntimeGate';
import { EXAMPLE_REGISTRY, type ExampleId } from '../../exampleCatalog';

export default function ExampleDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id as ExampleId | undefined;
  const entry = id ? EXAMPLE_REGISTRY[id] : undefined;

  if (!entry) {
    return (
      <>
        <Stack.Screen options={{ title: '示例不存在' }} />
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>示例不存在</Text>
          <Text style={styles.fallbackBody}>请返回示例中心重新选择。</Text>
        </View>
      </>
    );
  }

  const ExampleComponent = entry.component;
  const content = <ExampleComponent />;

  return (
    <>
      <Stack.Screen
        options={{
          title: entry.title,
          headerShown: !entry.immersive,
        }}
      />
      {entry.requiresRuntimeGate === false ? (
        content
      ) : (
        <ExampleRuntimeGate>{content}</ExampleRuntimeGate>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  fallbackBody: {
    marginTop: 10,
    fontSize: 14,
    color: '#475569',
  },
});
