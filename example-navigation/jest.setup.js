const mockNavigationModule = {
  setPrivacyConfig: jest.fn(),
  initSDK: jest.fn(),
  requestLocationPermission: jest.fn().mockResolvedValue({
    granted: true,
    canAskAgain: true,
    status: 'granted',
  }),
  getCurrentLocation: jest.fn().mockResolvedValue({
    latitude: 39.9,
    longitude: 116.4,
  }),
};

const mockNaviViewMethods = {
  startNavigation: jest.fn().mockResolvedValue(undefined),
  stopNavigation: jest.fn().mockResolvedValue(undefined),
};

jest.mock('react-native', () => ({
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
  },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  Pressable: 'Pressable',
  Switch: 'Switch',
  Image: 'Image',
  StatusBar: 'StatusBar',
  useColorScheme: jest.fn(() => 'light'),
  NativeModules: {},
  TurboModuleRegistry: {
    getEnforcing: () => ({
      getConstants: () => ({
        Dimensions: {
          window: { width: 375, height: 667, scale: 2, fontScale: 1 },
          screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
        },
      }),
    }),
  },
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return {
    Link: ({ href, asChild, children }) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, { href });
      }
      return React.createElement(Pressable, { accessibilityRole: 'link' }, children);
    },
    Stack: ({ children }) => React.createElement(React.Fragment, null, children),
    useRouter: () => ({
      back: jest.fn(),
    }),
    useNavigation: () => ({
      setOptions: jest.fn(),
    }),
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('expo-gaode-map-navigation', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ExpoGaodeMapModule: mockNavigationModule,
    ExpoGaodeMapNaviViewRef: {},
    EmbeddedNaviView: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => mockNaviViewMethods);
      return React.createElement(View, { ...props, testID: 'embedded-navi-view' }, props.children);
    }),
  };
}, { virtual: true });

jest.mock('@/lib/navigation-ui', () => {
  return {
    EmbeddedNaviView: jest.requireMock('expo-gaode-map-navigation').EmbeddedNaviView,
  };
});

jest.mock('@/lib/useHideNavigationHeader', () => ({
  useHideNavigationHeader: jest.fn(),
}));

jest.mock('@/exampleConfig', () => ({
  EXAMPLE_ANDROID_KEY: 'android-key',
  EXAMPLE_IOS_KEY: 'ios-key',
  EXAMPLE_WEB_API_KEY: 'web-key',
}));

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const React = require('react');
  return function MockFontAwesome() {
    return React.createElement('FontAwesome');
  };
});

global.__exampleNavigationMocks = {
  navigationModule: mockNavigationModule,
  naviViewMethods: mockNaviViewMethods,
};

global.__DEV__ = true;
global.__fbBatchedBridgeConfig = {};

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
