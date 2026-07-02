import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import SplashScreen from 'react-native-splash-screen-newarch';

const SCREEN_BACKGROUND = '#f8fafc';

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hide({ animation: 'scaleFade', duration: 1500, scale:1.5});
  }, []);

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: SCREEN_BACKGROUND },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '示例中心',
          navigationBarColor: SCREEN_BACKGROUND,
        }}
      />
      <Stack.Screen name="examples/[id]" options={{ title: '示例详情' }} />
      <Stack.Screen
        name="trip-stop-sheet"
        options={{
          title: '行程详情',
          headerShown: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],
          sheetInitialDetentIndex: 0,
          sheetCornerRadius: 20,
          // sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="ai-route-sheet"
        options={{
          title: '沿途候选',
          headerShown: false,
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],
          sheetInitialDetentIndex: 0,
          sheetCornerRadius: 20,
          sheetLargestUndimmedDetentIndex: 0,
        }}
      />
    </Stack>
  );
}
