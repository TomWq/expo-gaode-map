import type { ExpoConfig } from "expo/config";

const androidKey = process.env.EXPO_PUBLIC_AMAP_ANDROID_KEY?.trim();
const iosKey = process.env.EXPO_PUBLIC_AMAP_IOS_KEY?.trim();

const config: ExpoConfig = {
  name: "example-navigation",
  slug: "example-navigation",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "examplenavigation",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.wangqiang.examplenavigation"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.wangqiang.examplenavigation"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-gaode-map-navigation",
      {
        ...(androidKey ? { androidKey } : {}),
        ...(iosKey ? { iosKey } : {}),
        enableBackgroundLocation: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
