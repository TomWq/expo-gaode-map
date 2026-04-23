import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
       
        // headerLeft: () => (
        //   <Pressable
        //     onPress={() => router.back()}
        //     style={{
        //       flexDirection: 'row',
        //       alignItems: 'center',
        //       paddingRight: 8,
        //     }}
        //     hitSlop={8}
        //   >
        //     <View style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
        //       <Text style={{ color: '#1677ff', fontSize: 24, fontWeight: '500', lineHeight: 24 }}>
        //         {'<'}
        //       </Text>
        //     </View>
        //     <Text
        //       style={{
        //         color: '#1677ff',
        //         fontSize: 16,
        //         fontWeight: '500',
        //       }}
        //     >
        //       返回
        //     </Text>
        //   </Pressable>
        // ),
      }}
    >
      <Stack.Screen name="index" options={{ title: '示例中心' }} />
      <Stack.Screen name="examples/[id]" options={{ title: '示例详情' }} />
    </Stack>
  );
}
