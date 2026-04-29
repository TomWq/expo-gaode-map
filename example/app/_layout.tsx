import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '示例中心' }} />
      <Stack.Screen name="examples/[id]" options={{ title: '示例详情' }} />
      <Stack.Screen
        name="trip-stop-sheet"
        options={{
          title: '行程详情',
          headerShown: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],
          sheetInitialDetentIndex: 0,
          sheetCornerRadius:20
          // sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}
