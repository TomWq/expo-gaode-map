import { useMemo } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useSafeScrollViewStyle(baseStyle?: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const topInset = Platform.OS === 'android' ? insets.top : 0;
    return [baseStyle, { paddingTop: topInset }];
  }, [baseStyle, insets.top]);
}
