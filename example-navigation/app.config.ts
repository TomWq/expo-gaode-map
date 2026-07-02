import type { ExpoConfig } from "expo/config";

const androidKey = "0957076b4e77112c7c194a4ebf6c03e0";
const iosKey = "7acecfa22e09c31c0ff3db8e0c7b8679"

const config: ExpoConfig = {
  name: "example-navigation",
  slug: "example-navigation",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "examplenavigation",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.wangqiang.examplenavigation"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
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
    "expo-font",
    [
      "react-native-splash-screen-newarch",
      {
        image: "./assets/images/splash-map-full.png",
        backgroundColor: "#F5FBF8",
        resizeMode: "cover",
        android: {
          fullScreen: true,
          createLayout: true,
          overwriteLayout: true,
          backgroundColor: "#F5FBF8",
          image: "./assets/images/splash-map-full.png",
          imageResizeMode: "centerCrop",
          imageGravity: "center",
          systemImage: false,
          windowIsTranslucent: false,
        },
        ios: {
          image: "./assets/images/splash-map-full.png",
          backgroundColor: "#F5FBF8",
          resizeMode: "cover",
        },
      },
    ],
    "expo-web-browser",
    [
      "expo-gaode-map-navigation",
      {
        ...(androidKey ? { androidKey } : {}),
        ...(iosKey ? { iosKey } : {}),
        enableBackgroundLocation: true,
        enableBackgroundAudio: true,
        enableNavigationNotification: true,
        enableIOSLiveActivity: true,
        enableIOSLiveActivityFrequentUpdates: true,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
