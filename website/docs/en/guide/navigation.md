# Navigation

`expo-gaode-map-navigation` is an all-in-one navigation module. It includes the map rendering stack and provides route planning plus an official navigation UI.

## Installation

```bash
bun add expo-gaode-map-navigation
# or
yarn add expo-gaode-map-navigation
# or
npm install expo-gaode-map-navigation
```

::: danger Binary conflict
`expo-gaode-map-navigation` and `expo-gaode-map` cannot be installed together.

The navigation package already includes full map functionality.
:::

## Configuration

Configure native keys via Config Plugin (recommended):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosKey": "your-ios-api-key",
          "androidKey": "your-android-api-key",
          "enableLocation": true
        }
      ]
    ]
  }
}
```

Rebuild:

```bash
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

Initialize at app startup:

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key',
});
```

## Route Planning

Driving:

```ts
import { calculateDriveRoute, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await calculateDriveRoute({
  type: 'drive',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST,
});

console.log(result.count);
```

Walking:

```ts
import { calculateWalkRoute } from 'expo-gaode-map-navigation';

const result = await calculateWalkRoute({
  type: 'walk',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true,
});
```

Independent route planning (does not affect current navigation state):

```ts
import {
  independentDriveRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
} from 'expo-gaode-map-navigation';

const routes = await independentDriveRoute({
  from: { latitude: 39.9, longitude: 116.4, name: 'Start' },
  to: { latitude: 39.91, longitude: 116.41, name: 'End' },
});

await selectIndependentRoute({
  token: routes.token,
  routeIndex: 0,
});

await startNaviWithIndependentPath({
  token: routes.token,
  naviType: 0,
});
```

## NaviView (Official UI)

`NaviView` provides a full navigation UI.

```tsx
import React, { useRef } from 'react';
import { View, Button } from 'react-native';
import { NaviView, type NaviViewRef } from 'expo-gaode-map-navigation';

export default function NavigationScreen() {
  const ref = useRef<NaviViewRef>(null);

  return (
    <View style={{ flex: 1 }}>
      <NaviView ref={ref} style={{ flex: 1 }} naviType={0} />
      <View style={{ position: 'absolute', bottom: 20, right: 20 }}>
        <Button
          title="Start"
          onPress={() =>
            ref.current?.startNavigation(
              null,
              { latitude: 39.91, longitude: 116.41 },
              0
            )
          }
        />
        <Button title="Stop" onPress={() => ref.current?.stopNavigation()} />
      </View>
    </View>
  );
}
```

## Related Documentation

- [Navigation API](/en/api/navigation)
- [Web API Guide](/en/guide/web-api)
