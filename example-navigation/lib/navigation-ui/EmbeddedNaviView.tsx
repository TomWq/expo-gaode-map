/**
 * 自定义嵌入式导航页的总装组件。
 * 这个文件主要负责承载原生 `NaviView`，并统一编排顶部 HUD、车道信息、
 * 底部摘要、路况光柱、全览按钮以及它们之间的布局联动。
 */
import { BlurTargetView } from "expo-blur";
import type {
  ExpoGaodeMapNaviViewProps,
  NaviInfoUpdateEvent,
  NaviLaneInfoEvent,
  NaviTrafficStatusesEvent,
  NaviVisualStateEvent,
} from "expo-gaode-map-navigation";
import {
  ExpoGaodeMapNaviView,
  NaviView,
  type NaviViewRef,
} from "expo-gaode-map-navigation";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmbeddedNaviBottomSummary from "./EmbeddedNaviBottomSummary";
import EmbeddedNaviHud from "./EmbeddedNaviHud";
import EmbeddedNaviLaneView from "./EmbeddedNaviLaneView";
import EmbeddedNaviTrafficBar from "./EmbeddedNaviTrafficBar";

const defaultStartPointImage = require("./assets/markers/start-marker.png");
const defaultEndPointImage = require("./assets/markers/end-marker.png");
const overviewNormalButtonImage = require("./assets/markers/default_navi_browse_ver_normal.png");
const overviewSelectedButtonImage = require("./assets/markers/default_navi_browse_ver_selected.png");
const trafficOpenButtonImage = require("./assets/markers/default_navi_traffic_open_normal.png");
const trafficCloseButtonImage = require("./assets/markers/default_navi_traffic_close_normal.png");

type NaviInfoUpdateHandler = NonNullable<ExpoGaodeMapNaviViewProps["onNaviInfoUpdate"]>;
type NaviVisualStateChangeHandler = NonNullable<
  ExpoGaodeMapNaviViewProps["onNaviVisualStateChange"]
>;
type LaneInfoUpdateHandler = NonNullable<ExpoGaodeMapNaviViewProps["onLaneInfoUpdate"]>;
type TrafficStatusesUpdateHandler = NonNullable<
  ExpoGaodeMapNaviViewProps["onTrafficStatusesUpdate"]
>;

export interface EmbeddedNaviViewProps extends ExpoGaodeMapNaviViewProps {
  /** 是否显示示例内置的顶部导航 HUD */
  showDefaultHud?: boolean;
  /** 是否显示示例内置的车道 HUD */
  showDefaultLaneHud?: boolean;
  /** 是否显示示例内置的统一自绘路况光柱 */
  showDefaultTrafficBar?: boolean;
  /** 路口大图出现时是否自动隐藏车道 HUD */
  hideLaneHudWhenCrossVisible?: boolean;
  /** 路口大图 / 3D 路口模型出现时是否隐藏自绘路况光柱 */
  hideTrafficBarWhenCrossVisible?: boolean;
  /** 是否显示左侧“全览 / 锁车”切换按钮 */
  showOverviewToggleButton?: boolean;
  /** 是否显示左侧实时路况开关按钮 */
  showTrafficToggleButton?: boolean;
  /** 是否显示右下角退出按钮 */
  showExitButton?: boolean;
  exitButtonText?: string;
  /** 车道 HUD 摆放位置 */
  laneHudPlacement?: "top" | "bottom";
  /** 车道 HUD 缩放倍率 */
  laneHudScale?: number;
  laneHudStyle?: StyleProp<ViewStyle>;
  /** 路口大图出现时，顶部车道 HUD 的覆盖偏移 */
  laneHudCrossTopOffset?: number;
  /** 自绘路况光柱外层容器样式，用于微调位置和尺寸 */
  trafficBarStyle?: StyleProp<ViewStyle>;
  onExitPress?: () => void;
}

export const EmbeddedNaviView = React.forwardRef<NaviViewRef, EmbeddedNaviViewProps>(
  (
    {
      style,
      showDefaultHud = true,
      showDefaultLaneHud = true,
      showDefaultTrafficBar = true,
      hideLaneHudWhenCrossVisible = true,
      hideTrafficBarWhenCrossVisible = true,
      showOverviewToggleButton = true,
      showTrafficToggleButton = true,
      showExitButton = true,
      exitButtonText = "退出导航",
      laneHudPlacement = "top",
      laneHudScale,
      laneHudStyle,
      laneHudCrossTopOffset,
      trafficBarStyle,
      onExitPress,
      hideNativeTopInfoLayout,
      hideNativeLaneInfoLayout,
      showUIElements = false,
      showMode = 1,
      trafficLayerEnabled = true,
      showCamera = true,
      enableVoice = true,
      showTrafficBar = true,
      showTrafficButton = true,
      showDriveCongestion = true,
      showTrafficLightView = true,
      showCompassEnabled = true,
      showBrowseRouteButton,
      showMoreButton,
      laneInfoVisible = true,
      realCrossDisplay = true,
      modeCrossDisplay = true,
      eyrieCrossDisplay = true,
      secondActionVisible = true,
      backupOverlayVisible = true,
      showBackupRoute = true,
      showEagleMap = false,
      naviStatusBarEnabled = false,
      androidBackgroundNavigationNotificationEnabled = Platform.OS === "android",
      iosLiveActivityEnabled = Platform.OS === "ios",
      driveViewEdgePadding,
      trafficBarFrame,
      trafficBarColors,
      screenAnchor,
      startPointImage,
      wayPointImage,
      endPointImage,
      routeMarkerVisible,
      onNaviInfoUpdate,
      onLaneInfoUpdate,
      onTrafficStatusesUpdate,
      onNaviVisualStateChange,
      ...restProps
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const blurTargetRef = React.useRef<React.ElementRef<typeof View> | null>(null);
    const [latestNaviInfo, setLatestNaviInfo] = React.useState<NaviInfoUpdateEvent | null>(null);
    const [latestLaneInfo, setLatestLaneInfo] = React.useState<NaviLaneInfoEvent | null>(null);
    const [latestTrafficStatuses, setLatestTrafficStatuses] =
      React.useState<NaviTrafficStatusesEvent | null>(null);
    const [hudHeight, setHudHeight] = React.useState(0);
    const [bottomSummaryHeight, setBottomSummaryHeight] = React.useState(0);
    const [containerHeight, setContainerHeight] = React.useState(0);
    const [containerWidth, setContainerWidth] = React.useState(0);
    const [currentShowMode, setCurrentShowMode] = React.useState(showMode);
    const [trafficLayerVisible, setTrafficLayerVisible] = React.useState(trafficLayerEnabled);
    const [visualState, setVisualState] = React.useState<NaviVisualStateEvent>({
      isCrossVisible: false,
      isModeCrossVisible: false,
      isLaneInfoVisible: false,
    });

    React.useEffect(() => {
      setCurrentShowMode(showMode);
    }, [showMode]);

    React.useEffect(() => {
      setTrafficLayerVisible(trafficLayerEnabled);
    }, [trafficLayerEnabled]);

    const handleNaviInfoUpdate = React.useCallback<NaviInfoUpdateHandler>(
      (event) => {
        setLatestNaviInfo(event.nativeEvent);
        onNaviInfoUpdate?.(event);
      },
      [onNaviInfoUpdate]
    );

    const handleVisualStateChange = React.useCallback<NaviVisualStateChangeHandler>(
      (event) => {
        setVisualState(event.nativeEvent);
        if (!event.nativeEvent.isLaneInfoVisible) {
          setLatestLaneInfo(null);
        }
        onNaviVisualStateChange?.(event);
      },
      [onNaviVisualStateChange]
    );

    const handleLaneInfoUpdate = React.useCallback<LaneInfoUpdateHandler>(
      (event) => {
        setLatestLaneInfo(event.nativeEvent);
        onLaneInfoUpdate?.(event);
      },
      [onLaneInfoUpdate]
    );

    const handleTrafficStatusesUpdate = React.useCallback<TrafficStatusesUpdateHandler>(
      (event) => {
        setLatestTrafficStatuses(event.nativeEvent);
        onTrafficStatusesUpdate?.(event);
      },
      [onTrafficStatusesUpdate]
    );

    const handleHudLayout = React.useCallback((event: LayoutChangeEvent) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      setHudHeight((currentHeight) =>
        Math.abs(currentHeight - nextHeight) >= 1 ? nextHeight : currentHeight
      );
    }, []);

    const handleContainerLayout = React.useCallback((event: LayoutChangeEvent) => {
      const nextWidth = Math.ceil(event.nativeEvent.layout.width);
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      setContainerWidth((currentWidth) =>
        Math.abs(currentWidth - nextWidth) >= 1 ? nextWidth : currentWidth
      );
      setContainerHeight((currentHeight) =>
        Math.abs(currentHeight - nextHeight) >= 1 ? nextHeight : currentHeight
      );
    }, []);

    const handleBottomSummaryLayout = React.useCallback((event: LayoutChangeEvent) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      setBottomSummaryHeight((currentHeight) =>
        Math.abs(currentHeight - nextHeight) >= 1 ? nextHeight : currentHeight
      );
    }, []);

    // iOS 在 showUIElements=false 时，地图可视区域不再由官方控件自动管理，
    // 所以这里把官方层降为“数据提供者”，改由示例 HUD/按钮布局来反推 padding。
    const usesManagedCustomChrome =
      Platform.OS === "ios" && (showDefaultHud || showDefaultLaneHud || showDefaultTrafficBar);
    const resolvedShowUIElements =
      usesManagedCustomChrome ? false : showUIElements;
    const resolvedHideNativeTopInfoLayout =
      usesManagedCustomChrome ? false : hideNativeTopInfoLayout ?? showDefaultHud;
    const resolvedHideNativeLaneInfoLayout =
      usesManagedCustomChrome
        ? false
        : hideNativeLaneInfoLayout ?? (Platform.OS === "ios" && showDefaultLaneHud);
    const resolvedModeCrossDisplay = Platform.OS === "android" ? modeCrossDisplay : false;
    const showsOverviewMode = currentShowMode === 2;
    const isCompactHud =
      (realCrossDisplay !== false && visualState.isCrossVisible) ||
      (resolvedModeCrossDisplay !== false && visualState.isModeCrossVisible);
    // 锁车态把车位压低，保证前方可视距离；全览态则回到中心，避免路线只露出半截。
    const defaultIosCustomAnchor =
      usesManagedCustomChrome
        ? { x: 0.5, y: showsOverviewMode ? 0.5 : isCompactHud ? 0.7 : 0.75 }
        : undefined;
    const resolvedScreenAnchor =
      screenAnchor ??
      defaultIosCustomAnchor ?? { x: 0.5, y: resolvedShowUIElements === false ? 0.68 : 0.78 };
    const shouldHideLaneHud = hideLaneHudWhenCrossVisible && isCompactHud;
    const topInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : insets.top;
    const bottomInset = insets.bottom;
    const leftInset = insets.left;
    const rightInset = insets.right;
    const shouldShowBottomSummary = showDefaultHud && (latestNaviInfo?.pathRetainDistance ?? 0) > 0;
    const resolvedBottomSummaryHeight = bottomSummaryHeight > 0 ? bottomSummaryHeight : 52;
    const bottomSummaryBottom = Math.max(bottomInset + 10, 16);
    const overviewButtonBottom = shouldShowBottomSummary
      ? bottomSummaryBottom + resolvedBottomSummaryHeight + 8
      : 34 + bottomInset;
    const compactFloatingButtonHeight = 42;
    const resolvedLaneScale = Math.min(Math.max(laneHudScale ?? 0.88, 0.65), 1.3);
    const showsCustomControlButtons = resolvedShowUIElements === false;
    const compactBaseTop = showDefaultHud ? hudHeight : topInset + 14;
    const compactLaneHeight = 56 * resolvedLaneScale;
    // 原生层只告诉我们“路口大图显示中”，不会直接给出大图 frame，
    // 所以这里按容器高度估一个稳定区间，把车道 HUD 锚到大图底部附近。
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
    const autoTopVisibleBottom =
      showDefaultLaneHud &&
      laneHudPlacement === "top" &&
      !shouldHideLaneHud &&
      resolvedLaneTopOffset != null
        ? resolvedLaneTopOffset + compactLaneHeight
        : 0;
    const autoTopPadding = Math.max(showDefaultHud ? hudHeight + 16 : 20, autoTopVisibleBottom + 12);
    const autoBottomPadding = Math.max(
      82 + bottomInset,
      shouldShowBottomSummary ? bottomSummaryBottom + resolvedBottomSummaryHeight + 14 : 0,
      showOverviewToggleButton ? overviewButtonBottom + compactFloatingButtonHeight : 0,
      showDefaultLaneHud && laneHudPlacement === "bottom" && !shouldHideLaneHud
        ? compactLaneHeight + 28
        : 0
    );
    // 全览态要尽量把路线塞进屏幕，所以这里故意收紧上下边距，
    // 给高德更多可视范围去做 fit。
    const overviewTopPadding = Math.max(topInset + 10, showDefaultHud ? hudHeight + 8 : 20);
    const overviewBottomPadding = Math.max(bottomInset + 88, showExitButton ? 74 + bottomInset : 60);
    // 横向边距和全览态 fit 也强相关；全览时收窄，锁车时再为悬浮按钮预留空间。
    const autoLeftPadding = 24 + leftInset;
    const autoRightPadding =
      (showsOverviewMode ? 16 : showOverviewToggleButton || showDefaultTrafficBar ? 72 : 24) + rightInset;
    const usesManagedTrafficBar = Platform.OS === "ios" && usesManagedCustomChrome;
    const shouldHideTrafficBar = hideTrafficBarWhenCrossVisible && isCompactHud;
    const resolvedShowTrafficBar =
      usesManagedTrafficBar ? showTrafficBar && !shouldHideTrafficBar : showTrafficBar;
    const resolvedRouteMarkerVisible =
      Platform.OS === "android"
        ? {
            showStartEndVia: true,
            showFootFerry: routeMarkerVisible?.showFootFerry ?? true,
            showForbidden: routeMarkerVisible?.showForbidden ?? true,
            showRouteStartIcon: routeMarkerVisible?.showRouteStartIcon ?? false,
            showRouteEndIcon: routeMarkerVisible?.showRouteEndIcon ?? false,
            ...routeMarkerVisible,
          }
        : routeMarkerVisible;
    const autoTrafficBarLayout =
      containerWidth > 0 && containerHeight > 0
        ? {
            left: Math.max(0, containerWidth - rightInset - 24),
            top: isCompactHud
              ? Math.max(topInset + 86, compactBaseTop + 8)
              : Math.max(autoTopPadding + 10, topInset + Math.round(containerHeight * 0.2)),
            width: 18,
            height: isCompactHud
              ? Math.min(Math.max(containerHeight * 0.2, 120), 168)
              : Math.min(Math.max(containerHeight * 0.32, 220), 300),
          }
        : undefined;
    const autoTrafficBarFrame =
      usesManagedTrafficBar && autoTrafficBarLayout
        ? {
            x: autoTrafficBarLayout.left + 3,
            y: autoTrafficBarLayout.top,
            width: 13,
            height: autoTrafficBarLayout.height,
          }
        : undefined;
    const resolvedTrafficBarFrame =
      usesManagedTrafficBar && !trafficBarFrame ? autoTrafficBarFrame : trafficBarFrame;
    // 开启自绘光柱时，把官方光柱关掉，避免双层渲染和平台视觉不一致。
    const nativeTrafficBarVisible = showDefaultTrafficBar ? false : resolvedShowTrafficBar;
    const nativeTrafficBarFrame = nativeTrafficBarVisible ? resolvedTrafficBarFrame : undefined;
    const defaultTrafficBarStyle =
      showDefaultTrafficBar && autoTrafficBarLayout
        ? {
            left: autoTrafficBarLayout.left,
            top: autoTrafficBarLayout.top,
            width: autoTrafficBarLayout.width,
            height: autoTrafficBarLayout.height,
          }
        : undefined;
    const trafficToggleButtonSize = 54;
    const trafficToggleButtonGap = 10;
    const shouldShowTrafficToggleButton =
      showTrafficToggleButton &&
      showsCustomControlButtons &&
      showDefaultTrafficBar &&
      showTrafficBar &&
      !shouldHideTrafficBar;
    const trafficToggleButtonPositionStyle =
      autoTrafficBarLayout != null
        ? {
            left:
              autoTrafficBarLayout.left +
              Math.round((autoTrafficBarLayout.width - trafficToggleButtonSize) / 1.2),
            top: Math.max(
              topInset + 8,
              autoTrafficBarLayout.top - trafficToggleButtonSize - trafficToggleButtonGap
            ),
          }
        : {
            right: 18 + rightInset,
            top: Math.max(topInset + 80, compactBaseTop + 6),
          };
    const resolvedDriveViewEdgePadding =
      driveViewEdgePadding ??
      (usesManagedCustomChrome
        ? {
            top: showsOverviewMode ? overviewTopPadding : autoTopPadding,
            left: autoLeftPadding,
            right: autoRightPadding,
            bottom: showsOverviewMode ? overviewBottomPadding : autoBottomPadding,
          }
        : { top: 12, left: 0, right: 0, bottom: 120 });

    return (
      <View style={[styles.container, style]} onLayout={handleContainerLayout}>
        {/* BlurTargetView 必须包住真实地图内容，悬浮 HUD 才能模糊到“地图本身”而不是一层空 View。 */}
        <BlurTargetView ref={blurTargetRef} style={styles.blurTarget}>
          <ExpoGaodeMapNaviView
            ref={ref}
            style={styles.naviView}
            showUIElements={resolvedShowUIElements}
            showMode={currentShowMode}
            trafficLayerEnabled={trafficLayerVisible}
            showCamera={showCamera}
            enableVoice={enableVoice}
            showTrafficBar={nativeTrafficBarVisible}
            trafficBarFrame={nativeTrafficBarFrame}
            trafficBarColors={trafficBarColors}
            showTrafficButton={showTrafficButton}
            showDriveCongestion={showDriveCongestion}
            showTrafficLightView={showTrafficLightView}
            showCompassEnabled={showCompassEnabled}
            showBrowseRouteButton={showBrowseRouteButton}
            showMoreButton={showMoreButton}
            laneInfoVisible={laneInfoVisible}
            hideNativeLaneInfoLayout={resolvedHideNativeLaneInfoLayout}
            modeCrossDisplay={resolvedModeCrossDisplay}
            eyrieCrossDisplay={eyrieCrossDisplay}
            secondActionVisible={secondActionVisible}
            backupOverlayVisible={backupOverlayVisible}
            naviStatusBarEnabled={Platform.OS === "android" ? false : naviStatusBarEnabled}
            hideNativeTopInfoLayout={resolvedHideNativeTopInfoLayout}
            androidBackgroundNavigationNotificationEnabled={
              Platform.OS === "android" ? androidBackgroundNavigationNotificationEnabled : false
            }
            iosLiveActivityEnabled={Platform.OS === "ios" ? iosLiveActivityEnabled : false}
            driveViewEdgePadding={resolvedDriveViewEdgePadding}
            screenAnchor={resolvedScreenAnchor}
            startPointImage={startPointImage}
            wayPointImage={wayPointImage}
            endPointImage={endPointImage}
            routeMarkerVisible={resolvedRouteMarkerVisible}
            showBackupRoute={showBackupRoute}
            showEagleMap={showEagleMap}
            onNaviInfoUpdate={handleNaviInfoUpdate}
            onNaviVisualStateChange={handleVisualStateChange}
            onLaneInfoUpdate={handleLaneInfoUpdate}
            onTrafficStatusesUpdate={handleTrafficStatusesUpdate}
            {...restProps}
          />
        </BlurTargetView>

        {showDefaultHud ? (
          <EmbeddedNaviHud
            info={latestNaviInfo}
            compact={isCompactHud}
            onLayout={handleHudLayout}
            blurTarget={blurTargetRef}
          />
        ) : null}

        {showDefaultHud ? (
          <EmbeddedNaviBottomSummary
            info={latestNaviInfo}
            onLayout={handleBottomSummaryLayout}
            showExitButton={showExitButton}
            exitButtonText={exitButtonText}
            onExitPress={onExitPress}
            blurTarget={blurTargetRef}
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

        {showDefaultTrafficBar && showTrafficBar ? (
          <EmbeddedNaviTrafficBar
            info={latestNaviInfo}
            trafficStatuses={latestTrafficStatuses}
            visible={!shouldHideTrafficBar}
            style={[defaultTrafficBarStyle, trafficBarStyle]}
          />
        ) : null}

        {shouldShowTrafficToggleButton ? (
          <Pressable
            style={[styles.trafficToggleButton, trafficToggleButtonPositionStyle]}
            onPress={() => {
              setTrafficLayerVisible((current) => !current);
            }}
          >
            <Image
              source={trafficLayerVisible ? trafficOpenButtonImage : trafficCloseButtonImage}
              style={styles.trafficToggleButtonImage}
            />
          </Pressable>
        ) : null}

        {showOverviewToggleButton ? (
          <Pressable
            style={[
              styles.overviewButton,
              { right: 18 + rightInset, bottom: overviewButtonBottom },
            ]}
            onPress={() => {
              setCurrentShowMode((currentMode) => (currentMode === 2 ? 1 : 2));
            }}
          >
            <Image
              source={showsOverviewMode ? overviewSelectedButtonImage : overviewNormalButtonImage}
              style={styles.overviewButtonImage}
            />
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
  blurTarget: {
    flex: 1,
  },
  overviewButton: {
    position: "absolute",
    // borderRadius: 27,
    overflow: "hidden",
  },
  overviewButtonImage: {
    width: 54,
    height: 54,
  },
  trafficToggleButton: {
    position: "absolute",
    // borderRadius: 27,
    overflow: "hidden",
  },
  trafficToggleButtonImage: {
    width: 50,
    height: 50,
  },
});

export default EmbeddedNaviView;
