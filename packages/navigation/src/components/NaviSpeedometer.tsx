import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export interface NaviSpeedometerProps {
  /** 当前速度，单位 km/h。未提供或无效时显示 `--`。 */
  speed?: number | null;
  /** 圆盘直径，单位为 RN 逻辑像素。 */
  size?: number;
  /** 速度数字颜色，同时作为圆盘边框颜色。 */
  color?: string;
  /** 圆盘背景色。 */
  backgroundColor?: string;
  /** 速度单位文案。 */
  unit?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * 自定义导航速度圆盘。
 *
 * `ExpoGaodeMapNaviView` 的 `onNaviInfoUpdate` 已经提供 `currentSpeed`（km/h），
 * 因此业务侧只需要把该字段传给本组件即可。
 */
export function NaviSpeedometer({
  speed,
  size = 64,
  color = '#2f67ff',
  backgroundColor = '#ffffff',
  unit = 'km/h',
  style,
}: NaviSpeedometerProps) {
  const diameter = Math.max(56, size);
  const numericSpeed = typeof speed === 'number' && Number.isFinite(speed) ? Math.max(0, speed) : null;
  const speedText = numericSpeed == null ? '--' : String(Math.round(numericSpeed));
  const valueFontSize = Math.max(28, Math.round(diameter * 0.48));
  const valueLineHeight = Math.round(valueFontSize * 1.08);
  const unitFontSize = Math.max(10, Math.round(diameter * 0.17));
  const unitLineHeight = Math.round(unitFontSize * 1.2);

  return (
    <View
      accessibilityLabel={numericSpeed == null ? '当前速度未知' : `当前速度 ${speedText} ${unit}`}
      style={[
        styles.shadow,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor,
          borderColor: color,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.innerRing,
          {
            width: diameter - 10,
            height: diameter - 10,
            borderRadius: (diameter - 10) / 2,
            borderColor: color,
            opacity: 0.16,
          },
        ]}
      />
      <View pointerEvents="none" style={styles.content}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[styles.value, { color, fontSize: valueFontSize, lineHeight: valueLineHeight }]}
        >
          {speedText}
        </Text>
        <Text style={[styles.unit, { color, fontSize: unitFontSize, lineHeight: unitLineHeight }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#12234d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -1 }],
  },
  value: {
    fontWeight: '800',
    includeFontPadding: false,
  },
  unit: {
    marginTop: 0,
    fontWeight: '600',
    includeFontPadding: false,
  },
});
