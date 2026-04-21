import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function ExamplesLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "返回",
        headerLeft: () => (
          <Pressable
            onPress={() => router.back()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingRight: 8,
            }}
            hitSlop={8}
          >
            <View
              style={{
                width: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome name="angle-left" size={24} color="#1677ff" />
            </View>
            <Text
              style={{
                color: "#1677ff",
                fontSize: 16,
                fontWeight: "500",
              }}
            >
              返回
            </Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="quick-start"
        options={{ title: "快速导航接入验证", }}
      />
      <Stack.Screen
        name="official"
        options={{ title: "官方黑盒导航", }}
      />
      <Stack.Screen
        name="official-embedded"
        options={{ title: "纯官方嵌入式 UI",}}
      />
      {/* <Stack.Screen
        name="independent"
        options={{ title: "独立算路避让预览", presentation: "card" }}
      /> */}
      <Stack.Screen
        name="independent-navigation"
        options={{ title: "独立路径规划导航",  }}
      />
      <Stack.Screen
        name="follow-web"
        options={{ title: "跟随 Web 路线", }}
      />
      <Stack.Screen
        name="current-location"
        options={{ title: "当前位置直达导航", }}
      />
      <Stack.Screen
        name="route-picker"
        options={{ title: "自定义路线选择页", headerShown: false }}
      />
      <Stack.Screen
        name="events"
        options={{ title: "导航事件面板", }}
      />
      <Stack.Screen
        name="ui-props"
        options={{ title: "自定义 UI 导航界面", }}
      />
    </Stack>
  );
}
