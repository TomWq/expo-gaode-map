import { Stack } from "expo-router";

export default function ExamplesLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "返回",
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="official"
        options={{ title: "官方黑盒导航", presentation: "card" }}
      />
      <Stack.Screen
        name="official-embedded"
        options={{ title: "纯官方嵌入式 UI", presentation: "card" }}
      />
      <Stack.Screen
        name="independent"
        options={{ title: "独立算路避让预览", presentation: "card" }}
      />
      <Stack.Screen
        name="follow-web"
        options={{ title: "跟随 Web 路线", presentation: "card" }}
      />
      <Stack.Screen
        name="current-location"
        options={{ title: "当前位置直达导航", presentation: "card" }}
      />
      <Stack.Screen
        name="route-picker"
        options={{ title: "路线选择后再导航", presentation: "card" }}
      />
      <Stack.Screen
        name="events"
        options={{ title: "导航事件面板", presentation: "card" }}
      />
      <Stack.Screen
        name="ui-props"
        options={{ title: "UI Props 调试", presentation: "card" }}
      />
    </Stack>
  );
}
