import React from "react";
import {
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import ExpoGaodeMapNaviView, { type ExpoGaodeMapNaviViewRef } from "../ExpoGaodeMapNaviView";
import type {
  NaviLaneInfoEvent,
  ExpoGaodeMapNaviViewProps,
  NaviInfoUpdateEvent,
  NaviVisualStateEvent,
} from "../types";
import EmbeddedNaviHud from "./EmbeddedNaviHud";
import EmbeddedNaviLaneView from "./EmbeddedNaviLaneView";

export interface EmbeddedNaviViewProps extends ExpoGaodeMapNaviViewProps {
  showDefaultHud?: boolean;
  showDefaultLaneHud?: boolean;
  hideLaneHudWhenCrossVisible?: boolean;
  showExitButton?: boolean;
  exitButtonText?: string;
  laneHudPlacement?: "top" | "bottom";
  laneHudScale?: number;
  laneHudStyle?: StyleProp<ViewStyle>;
  laneHudCrossTopOffset?: number;
  onExitPress?: () => void;
}

export const EmbeddedNaviView = React.forwardRef<ExpoGaodeMapNaviViewRef, EmbeddedNaviViewProps>(
  (
    {
      style,
      showDefaultHud = true,
      showDefaultLaneHud = true,
      hideLaneHudWhenCrossVisible = true,
      showExitButton = true,
      exitButtonText = "退出导航",
      laneHudPlacement = "top",
      laneHudScale,
      laneHudStyle,
      laneHudCrossTopOffset,
      onExitPress,
      hideNativeTopInfoLayout,
      hideNativeLaneInfoLayout,
      showCamera = true,
      enableVoice = true,
      showTrafficBar = true,
      showTrafficButton = true,
      showDriveCongestion = true,
      showTrafficLightView = true,
      showCompassEnabled = true,
      laneInfoVisible = true,
      realCrossDisplay = true,
      modeCrossDisplay = true,
      eyrieCrossDisplay = true,
      secondActionVisible = true,
      backupOverlayVisible = true,
      showBackupRoute = true,
      showEagleMap = false,
      naviStatusBarEnabled = false,
      driveViewEdgePadding,
      screenAnchor,
      onNaviInfoUpdate,
      onLaneInfoUpdate,
      onNaviVisualStateChange,
      ...restProps
    },
    ref
  ) => {
    const [latestNaviInfo, setLatestNaviInfo] = React.useState<NaviInfoUpdateEvent | null>(null);
    const [latestLaneInfo, setLatestLaneInfo] = React.useState<NaviLaneInfoEvent | null>(null);
    const [hudHeight, setHudHeight] = React.useState(0);
    const [containerHeight, setContainerHeight] = React.useState(0);
    const [visualState, setVisualState] = React.useState<NaviVisualStateEvent>({
      isCrossVisible: false,
      isModeCrossVisible: false,
      isLaneInfoVisible: false,
    });

    const handleNaviInfoUpdate = React.useCallback(
      (event: NativeSyntheticEvent<NaviInfoUpdateEvent>) => {
        setLatestNaviInfo(event.nativeEvent);
        onNaviInfoUpdate?.(event);
      },
      [onNaviInfoUpdate]
    );

    const handleVisualStateChange = React.useCallback(
      (event: NativeSyntheticEvent<NaviVisualStateEvent>) => {
        setVisualState(event.nativeEvent);
        if (!event.nativeEvent.isLaneInfoVisible) {
          setLatestLaneInfo(null);
        }
        onNaviVisualStateChange?.(event);
      },
      [onNaviVisualStateChange]
    );

    const handleLaneInfoUpdate = React.useCallback(
      (event: NativeSyntheticEvent<NaviLaneInfoEvent>) => {
        setLatestLaneInfo(event.nativeEvent);
        onLaneInfoUpdate?.(event);
      },
      [onLaneInfoUpdate]
    );

    const handleHudLayout = React.useCallback((event: LayoutChangeEvent) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      setHudHeight((currentHeight) =>
        Math.abs(currentHeight - nextHeight) >= 1 ? nextHeight : currentHeight
      );
    }, []);

    const handleContainerLayout = React.useCallback((event: LayoutChangeEvent) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      setContainerHeight((currentHeight) =>
        Math.abs(currentHeight - nextHeight) >= 1 ? nextHeight : currentHeight
      );
    }, []);

    const resolvedHideNativeTopInfoLayout =
      hideNativeTopInfoLayout ?? (Platform.OS === "android" && showDefaultHud);
    const resolvedHideNativeLaneInfoLayout =
      hideNativeLaneInfoLayout ?? (Platform.OS === "ios" && showDefaultLaneHud);
    const resolvedDriveViewEdgePadding =
      driveViewEdgePadding ?? { top: 12, left: 0, right: 0, bottom: 120 };
    const resolvedScreenAnchor =
      screenAnchor ?? { x: 0.5, y: restProps.showUIElements === false ? 0.68 : 0.78 };
    const isCompactHud =
      (realCrossDisplay !== false && visualState.isCrossVisible) ||
      (modeCrossDisplay !== false && visualState.isModeCrossVisible);
    const shouldHideLaneHud = hideLaneHudWhenCrossVisible && isCompactHud;
    const topInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
    const resolvedLaneScale = Math.min(Math.max(laneHudScale ?? 0.88, 0.65), 1.3);
    const compactBaseTop = showDefaultHud ? hudHeight : topInset + 14;
    const compactLaneHeight = 56 * resolvedLaneScale;
    // Native side only exposes "cross is visible", so use a bounded estimate to anchor the lane bar
    // to the lower edge of the cross image area.
    const estimatedCrossHeight = Math.min(Math.max(containerHeight * 0.3, 156), 220);
    const autoLaneCrossTopOffset = Math.max(
      compactBaseTop + 10,
      compactBaseTop + estimatedCrossHeight - compactLaneHeight
    );
    let resolvedLaneTopOffset: number | undefined;
    if (laneHudPlacement === "top") {
      if (isCompactHud) {
        resolvedLaneTopOffset = laneHudCrossTopOffset ?? autoLaneCrossTopOffset;
      } else if (showDefaultHud) {
        resolvedLaneTopOffset = hudHeight + 8;
      }
    }

    return (
      <View style={[styles.container, style]} onLayout={handleContainerLayout}>
        <ExpoGaodeMapNaviView
          ref={ref}
          style={styles.naviView}
          showCamera={showCamera}
          enableVoice={enableVoice}
          showTrafficBar={showTrafficBar}
          showTrafficButton={showTrafficButton}
          showDriveCongestion={showDriveCongestion}
          showTrafficLightView={showTrafficLightView}
          showCompassEnabled={showCompassEnabled}
          laneInfoVisible={laneInfoVisible}
          hideNativeLaneInfoLayout={resolvedHideNativeLaneInfoLayout}
          modeCrossDisplay={modeCrossDisplay}
          eyrieCrossDisplay={eyrieCrossDisplay}
          secondActionVisible={secondActionVisible}
          backupOverlayVisible={backupOverlayVisible}
          naviStatusBarEnabled={Platform.OS === "android" ? false : naviStatusBarEnabled}
          hideNativeTopInfoLayout={resolvedHideNativeTopInfoLayout}
          driveViewEdgePadding={resolvedDriveViewEdgePadding}
          screenAnchor={resolvedScreenAnchor}
          showBackupRoute={showBackupRoute}
          showEagleMap={showEagleMap}
          onNaviInfoUpdate={handleNaviInfoUpdate}
          onNaviVisualStateChange={handleVisualStateChange}
          onLaneInfoUpdate={handleLaneInfoUpdate}
          {...restProps}
        />

        {showDefaultHud ? (
          <EmbeddedNaviHud
            info={latestNaviInfo}
            compact={isCompactHud}
            onLayout={handleHudLayout}
          />
        ) : null}

        {showDefaultLaneHud ? (
          <EmbeddedNaviLaneView
            laneInfo={latestLaneInfo}
            visible={visualState.isLaneInfoVisible && !shouldHideLaneHud}
            compact={isCompactHud}
            placement={laneHudPlacement}
            topOffset={resolvedLaneTopOffset}
            scale={laneHudScale}
            style={laneHudStyle}
          />
        ) : null}

        {showExitButton ? (
          <Pressable style={styles.exitButton} onPress={onExitPress}>
            <Text style={styles.exitButtonText}>{exitButtonText}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
);

EmbeddedNaviView.displayName = "EmbeddedNaviView";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  naviView: {
    flex: 1,
  },
  exitButton: {
    position: "absolute",
    right: 18,
    bottom: 34,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#dc2626",
  },
  exitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});

export default EmbeddedNaviView;
