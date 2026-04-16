import {
  AMap,
  BitmapDescriptorFactory,
  CameraPosition,
  CameraUpdateFactory,
  CustomMapStyleOptions,
  LatLng,
  MapView,
  MapViewComponent,
  MapViewManager,
  Marker,
  MyLocationStyle,
  OnCameraChangeListener,
  OnMarkerDragListener,
  Poi,
  Polyline,
  MapsInitializer
} from '@amap/amap_lbs_map3d';
import { AMapLocationManagerImpl } from '@amap/amap_lbs_location';
import {
  AMapPrivacyAgreeStatus,
  AMapPrivacyInfoStatus,
  AMapPrivacyShowStatus
} from '@amap/amap_lbs_common';

import {
  Descriptor,
  RNComponentContext,
  RNViewBase,
  ViewBaseProps,
} from '@rnoh/react-native-openharmony';

import Logger from '../Logger';
import { ExpoGaodeMapModule } from '../ExpoGaodeMapModule';
import {
  CommandResultEmitter,
  handleGetLatLngCommand,
  handleTakeSnapshotCommand
} from './internal/commands';
import { parseColor, resolveMyLocationType, maskApiKey } from './internal/helpers';
import { HarmonyOverlayManager } from './internal/overlays';
import { saveSnapshotToSandbox } from './internal/snapshot';
import {
  HarmonyCircleOverlay,
  HarmonyMarkerOverlay,
  HarmonyPolygonOverlay,
  HarmonyPolylineOverlay,
  CustomMapStyleProps,
  EVENT_CHANNEL,
  GeoLocationLike,
  IndoorMapFeature,
  PrivacySnapshot,
  UserLocationRepresentation
} from './internal/types';

export interface ExpoGaodeMapViewProps extends ViewBaseProps {
  harmonyApiKey?: string;
  mapType?: number;
  initialCameraPosition?: CameraPosition;
  myLocationEnabled?: boolean;
  followUserLocation?: boolean;
  userLocationRepresentation?: UserLocationRepresentation;
  indoorViewEnabled?: boolean;
  buildingsEnabled?: boolean;
  labelsEnabled?: boolean;
  compassEnabled?: boolean;
  zoomControlsEnabled?: boolean;
  scaleControlsEnabled?: boolean;
  myLocationButtonEnabled?: boolean;
  trafficEnabled?: boolean;
  maxZoom?: number;
  minZoom?: number;
  zoomGesturesEnabled?: boolean;
  scrollGesturesEnabled?: boolean;
  rotateGesturesEnabled?: boolean;
  tiltGesturesEnabled?: boolean;
  worldMapSwitchEnabled?: boolean;
  customMapStyle?: CustomMapStyleProps;
  cameraEventThrottleMs?: number;
  harmonyMarkers?: HarmonyMarkerOverlay[];
  harmonyPolylines?: HarmonyPolylineOverlay[];
  harmonyPolygons?: HarmonyPolygonOverlay[];
  harmonyCircles?: HarmonyCircleOverlay[];
}

let cachedApiKey: string | undefined = undefined;
let cachedLocationApiKey: string | undefined = undefined;
let cachedPrivacySignature: string | undefined = undefined;

export type ExpoGaodeMapViewDescriptor = Descriptor<
  'ExpoGaodeMapView',
  '',
  '',
  ExpoGaodeMapViewProps
>;

@Component
export struct ExpoGaodeMapView {
  static NAME: string = 'ExpoGaodeMapView';

  ctx: RNComponentContext = {} as RNComponentContext;
  tag: number = -1;

  @State descriptor: ExpoGaodeMapViewDescriptor = {} as ExpoGaodeMapViewDescriptor;
  @State canCreateNativeMap: boolean = false;

  private unregisterDescriptorChangesListener?: () => void = undefined;
  private cleanupCommandCallback?: () => void = undefined;

  private mapView?: MapView;
  private aMap?: AMap;
  private harmonyApiKey?: string;
  private hasRegisteredMapViewCreateCallback: boolean = false;
  private hasLoggedMissingApiKeyWarning: boolean = false;
  private apiKeyRetryTimerId?: number = undefined;
  private apiKeyRetryCount: number = 0;
  private readonly apiKeyRetryIntervalMs: number = 30;
  private readonly apiKeyRetryMaxCount: number = 120;

  private mapType: number = 1;
  private initialCameraPosition?: CameraPosition;
  private myLocationEnabled: boolean = false;
  private followUserLocation: boolean = false;
  private userLocationRepresentation?: UserLocationRepresentation;
  private indoorViewEnabled: boolean = false;
  private trafficEnabled: boolean = false;
  private buildingsEnabled: boolean = false;
  private labelsEnabled: boolean = true;
  private maxZoom: number = 20;
  private minZoom: number = 3;
  private zoomGesturesEnabled: boolean = true;
  private scrollGesturesEnabled: boolean = true;
  private rotateGesturesEnabled: boolean = true;
  private tiltGesturesEnabled: boolean = true;
  private compassEnabled: boolean = false;
  private zoomControlsEnabled: boolean = false;
  private scaleControlsEnabled: boolean = false;
  private myLocationButtonEnabled: boolean = false;
  private worldMapSwitchEnabled: boolean = ExpoGaodeMapModule.isLoadWorldVectorMapEnabled();
  private customMapStyle?: CustomMapStyleProps;
  private hasAppliedCustomMapStyle: boolean = false;
  private hasLoggedUnsupportedLocationRepresentation: boolean = false;
  private lastAppliedWorldMapSwitchEnabled?: boolean = undefined;
  private lastCameraMoveEventAt: number = 0;
  private cameraEventThrottleMs: number = 32;
  private hasLocationEverEnabled: boolean = false;
  private harmonyMarkers: HarmonyMarkerOverlay[] = [];
  private harmonyPolylines: HarmonyPolylineOverlay[] = [];
  private harmonyPolygons: HarmonyPolygonOverlay[] = [];
  private harmonyCircles: HarmonyCircleOverlay[] = [];
  private overlayManager?: HarmonyOverlayManager;

  private isDestroyed: boolean = false;

  private isValid(): boolean {
    return !this.isDestroyed;
  }

  aboutToAppear(): void {
    this.isDestroyed = false;
    this.overlayManager = new HarmonyOverlayManager(this.ctx);
    this.descriptor = this.ctx.descriptorRegistry.getDescriptor<ExpoGaodeMapViewDescriptor>(this.tag);
    this.readProps(this.descriptor);

    const keyReady = this.ensureMapApiKeyReady();
    if (keyReady) {
      this.show();
      this.canCreateNativeMap = true;
    } else {
      this.canCreateNativeMap = false;
      this.scheduleWaitForApiKey();
    }

    this.cleanupCommandCallback = this.ctx.componentCommandReceiver.registerCommandCallback(
      this.tag,
      (command, args: ESObject[]) => {
        if (!this.aMap) return;
        const commandEmitter = new CommandResultEmitter(this.ctx, this.tag);

        if (command === 'moveCamera') {
          const update = (args[0] as CameraPosition | undefined) ?? ({} as CameraPosition);
          const duration = Number(args[1] ?? 0);
          const current = this.aMap.getCameraPosition();
          const position = {
            target: update.target ?? current?.target ?? new LatLng(39.9, 116.4),
            zoom: Number(update.zoom ?? current?.zoom ?? 16),
            bearing: Number(update.bearing ?? current?.bearing ?? 0),
            tilt: Number(update.tilt ?? current?.tilt ?? 0),
          } as CameraPosition;

          if (duration > 0) {
            this.aMap.animateCamera(CameraUpdateFactory.newCameraPosition(position), undefined, duration);
          } else {
            this.aMap.moveCamera(CameraUpdateFactory.newCameraPosition(position));
          }
          return;
        }

        if (command === 'getLatLng') {
          handleGetLatLngCommand(this.aMap, args, commandEmitter);
          return;
        }

        if (command === 'takeSnapshot') {
          handleTakeSnapshotCommand(
            this.aMap,
            args,
            commandEmitter,
            (pixelMap: PixelMap): Promise<string> => saveSnapshotToSandbox(this.tag, pixelMap)
          );
        }
      }
    );

    this.unregisterDescriptorChangesListener = this.ctx.descriptorRegistry.subscribeToDescriptorChanges(
      this.tag,
      (nextDescriptor) => {
        if (!this.isValid()) return;

        this.descriptor = nextDescriptor as ExpoGaodeMapViewDescriptor;
        this.readProps(this.descriptor);
        this.applyMapProps();
      }
    );

  }

  private ensureMapApiKeyReady(): boolean {
    this.applyPrivacyState();
    this.applyMapApiKey();
    this.applyLocationApiKey();
    return !!this.getResolvedApiKey();
  }

  private getResolvedApiKey(): string | undefined {
    return this.harmonyApiKey || ExpoGaodeMapModule.getMapApiKey();
  }

  private clearApiKeyRetryTimer(): void {
    if (this.apiKeyRetryTimerId !== undefined) {
      clearTimeout(this.apiKeyRetryTimerId);
      this.apiKeyRetryTimerId = undefined;
    }
    this.apiKeyRetryCount = 0;
  }

  private scheduleWaitForApiKey(): void {
    if (!this.isValid() || this.canCreateNativeMap) {
      return;
    }

    if (this.apiKeyRetryTimerId !== undefined) {
      return;
    }

    if (this.apiKeyRetryCount >= this.apiKeyRetryMaxCount) {
      Logger.error('AMap apiKey is still empty after retries. Skip MapView creation to avoid crash.');
      return;
    }

    this.apiKeyRetryTimerId = setTimeout(() => {
      this.apiKeyRetryTimerId = undefined;
      if (!this.isValid() || this.canCreateNativeMap) {
        return;
      }

      if (this.ensureMapApiKeyReady()) {
        Logger.info('AMap apiKey is ready, create native MapViewComponent now.');
        this.show();
        this.canCreateNativeMap = true;
        this.apiKeyRetryCount = 0;
        return;
      }

      this.apiKeyRetryCount += 1;
      this.scheduleWaitForApiKey();
    }, this.apiKeyRetryIntervalMs) as number;
  }

  private applyMapApiKey(): void {
    const apiKey = this.getResolvedApiKey();
    if (!apiKey) {
      if (!this.hasLoggedMissingApiKeyWarning) {
        Logger.warn('AMap apiKey is empty. Please call ExpoGaodeMapModule.initSDK({ harmonyKey: \"...\" }) before rendering MapView.');
        this.hasLoggedMissingApiKeyWarning = true;
      }
      return;
    }
    this.hasLoggedMissingApiKeyWarning = false;

    if (cachedApiKey === apiKey) {
      return;
    }

    try {
      MapsInitializer.setApiKey(apiKey);
      cachedApiKey = apiKey;
      Logger.info(`MapsInitializer.setApiKey applied: ${maskApiKey(apiKey)}`);
    } catch (error) {
      Logger.error(`setApiKey failed: ${JSON.stringify(error)}`);
    }
  }

  private applyLocationApiKey(): void {
    const apiKey = this.getResolvedApiKey();
    if (!apiKey || cachedLocationApiKey === apiKey) {
      return;
    }

    try {
      AMapLocationManagerImpl.setApiKey(apiKey);
      cachedLocationApiKey = apiKey;
      Logger.info(`AMapLocationManagerImpl.setApiKey applied: ${maskApiKey(apiKey)}`);
    } catch (error) {
      Logger.error(`AMapLocationManagerImpl.setApiKey failed: ${JSON.stringify(error)}`);
    }
  }

  private applyPrivacyState(): void {
    const privacyStatus: PrivacySnapshot = ExpoGaodeMapModule.getPrivacyStatusSnapshot() as PrivacySnapshot;
    const showStatus: AMapPrivacyShowStatus = privacyStatus.hasShow
      ? AMapPrivacyShowStatus.DidShow
      : AMapPrivacyShowStatus.NotShow;
    const containStatus: AMapPrivacyInfoStatus = privacyStatus.hasContainsPrivacy
      ? AMapPrivacyInfoStatus.DidContain
      : AMapPrivacyInfoStatus.NotContain;
    const agreeStatus: AMapPrivacyAgreeStatus = privacyStatus.hasAgree
      ? AMapPrivacyAgreeStatus.DidAgree
      : AMapPrivacyAgreeStatus.NotAgree;
    const signature = `${showStatus}|${containStatus}|${agreeStatus}`;

    if (cachedPrivacySignature === signature) {
      return;
    }

    const context = this.ctx.uiAbilityContext;
    if (!context) {
      Logger.warn('uiAbilityContext missing, skip applying AMap privacy state.');
      return;
    }

    try {
      MapsInitializer.updatePrivacyShow(showStatus, containStatus, context);
      MapsInitializer.updatePrivacyAgree(agreeStatus, context);
      AMapLocationManagerImpl.updatePrivacyShow(showStatus, containStatus, context);
      AMapLocationManagerImpl.updatePrivacyAgree(agreeStatus, context);
      cachedPrivacySignature = signature;
      Logger.info(`AMap privacy applied in view: show=${privacyStatus.hasShow} contain=${privacyStatus.hasContainsPrivacy} agree=${privacyStatus.hasAgree}`);
    } catch (error) {
      Logger.error(`applyPrivacyState failed: ${JSON.stringify(error)}`);
    }
  }

  aboutToDisappear(): void {
    this.isDestroyed = true;
    this.canCreateNativeMap = false;
    this.clearApiKeyRetryTimer();

    if (this.hasRegisteredMapViewCreateCallback) {
      MapViewManager.getInstance().unregisterMapViewCreatedCallback(this.mapViewCreateCallback);
      this.hasRegisteredMapViewCreateCallback = false;
    }
    this.unregisterDescriptorChangesListener?.();
    this.cleanupCommandCallback?.();

    this.unregisterDescriptorChangesListener = undefined;
    this.cleanupCommandCallback = undefined;
    this.overlayManager?.clearAll();
    this.overlayManager = undefined;

    this.aMap?.clear();
    this.mapView?.onDestroy();

    this.aMap = undefined;
    this.mapView = undefined;
  }

  private mapViewCreateCallback = (mapView?: MapView) => {
    if (!this.isValid() || !mapView) {
      return;
    }

    if (mapView.getMapViewName() !== this.tag.toString()) {
      return;
    }

    mapView.onCreate();
    this.mapView = mapView;

    this.mapView.getMapAsync((map: AMap) => {
      if (!this.isValid()) {
        return;
      }

      this.aMap = map;
      this.bindMapListeners();
      this.applyMapProps();
      this.emitLoad();
    });
  };

  private show(): void {
    if (this.hasRegisteredMapViewCreateCallback) {
      return;
    }
    MapViewManager.getInstance().registerMapViewCreatedCallback(this.mapViewCreateCallback);
    this.hasRegisteredMapViewCreateCallback = true;
  }

  private readProps(descriptor: ExpoGaodeMapViewDescriptor): void {
    const raw = descriptor.rawProps as ExpoGaodeMapViewProps;

    if (raw.harmonyApiKey !== undefined) this.harmonyApiKey = raw.harmonyApiKey;
    if (raw.mapType !== undefined) this.mapType = raw.mapType;
    if (raw.initialCameraPosition !== undefined) this.initialCameraPosition = raw.initialCameraPosition;
    if (raw.myLocationEnabled !== undefined) this.myLocationEnabled = raw.myLocationEnabled;
    if (raw.followUserLocation !== undefined) this.followUserLocation = raw.followUserLocation;
    if (raw.userLocationRepresentation !== undefined) this.userLocationRepresentation = raw.userLocationRepresentation;
    if (raw.indoorViewEnabled !== undefined) this.indoorViewEnabled = raw.indoorViewEnabled;
    if (raw.trafficEnabled !== undefined) this.trafficEnabled = raw.trafficEnabled;
    if (raw.buildingsEnabled !== undefined) this.buildingsEnabled = raw.buildingsEnabled;
    if (raw.labelsEnabled !== undefined) this.labelsEnabled = raw.labelsEnabled;
    if (raw.maxZoom !== undefined) this.maxZoom = raw.maxZoom;
    if (raw.minZoom !== undefined) this.minZoom = raw.minZoom;
    if (raw.zoomGesturesEnabled !== undefined) this.zoomGesturesEnabled = raw.zoomGesturesEnabled;
    if (raw.scrollGesturesEnabled !== undefined) this.scrollGesturesEnabled = raw.scrollGesturesEnabled;
    if (raw.rotateGesturesEnabled !== undefined) this.rotateGesturesEnabled = raw.rotateGesturesEnabled;
    if (raw.tiltGesturesEnabled !== undefined) this.tiltGesturesEnabled = raw.tiltGesturesEnabled;
    if (raw.compassEnabled !== undefined) this.compassEnabled = raw.compassEnabled;
    if (raw.zoomControlsEnabled !== undefined) this.zoomControlsEnabled = raw.zoomControlsEnabled;
    if (raw.scaleControlsEnabled !== undefined) this.scaleControlsEnabled = raw.scaleControlsEnabled;
    if (raw.myLocationButtonEnabled !== undefined) this.myLocationButtonEnabled = raw.myLocationButtonEnabled;
    if (raw.worldMapSwitchEnabled !== undefined) {
      this.worldMapSwitchEnabled = raw.worldMapSwitchEnabled;
    } else {
      this.worldMapSwitchEnabled = ExpoGaodeMapModule.isLoadWorldVectorMapEnabled();
    }
    if (raw.customMapStyle !== undefined) this.customMapStyle = raw.customMapStyle;
    if (raw.cameraEventThrottleMs !== undefined) this.cameraEventThrottleMs = raw.cameraEventThrottleMs;
    this.harmonyMarkers = raw.harmonyMarkers ?? [];
    this.harmonyPolylines = raw.harmonyPolylines ?? [];
    this.harmonyPolygons = raw.harmonyPolygons ?? [];
    this.harmonyCircles = raw.harmonyCircles ?? [];
  }

  private applyMapProps(): void {
    if (!this.aMap) {
      return;
    }

    this.aMap.setMapType(this.mapType);
    this.aMap.setTrafficEnabled(this.trafficEnabled);
    this.aMap.showBuildings(this.buildingsEnabled);
    this.aMap.showMapText(this.labelsEnabled);
    const mapWithIndoor = this.aMap as IndoorMapFeature;
    mapWithIndoor.showIndoorMap?.(this.indoorViewEnabled);
    this.applyWorldMapSwitchOption();
    this.applyCustomMapStyle();

    this.applyLocationApiKey();
    this.applyMyLocationStyle();
    if (this.myLocationEnabled) {
      this.aMap.setMyLocationEnabled(true);
      this.hasLocationEverEnabled = true;
    } else if (this.hasLocationEverEnabled) {
      this.aMap.setMyLocationEnabled(false);
      this.hasLocationEverEnabled = false;
    }

    this.aMap.setMinZoomLevel(this.minZoom);
    this.aMap.setMaxZoomLevel(this.maxZoom);

    const uiSettings = this.aMap.getUiSettings();
    uiSettings?.setZoomGesturesEnabled(this.zoomGesturesEnabled);
    uiSettings?.setScrollGesturesEnabled(this.scrollGesturesEnabled);
    uiSettings?.setRotateGesturesEnabled(this.rotateGesturesEnabled);
    uiSettings?.setTiltGesturesEnabled(this.tiltGesturesEnabled);
    uiSettings?.setCompassEnabled(this.compassEnabled);
    uiSettings?.setZoomControlsEnabled(this.zoomControlsEnabled);
    uiSettings?.setScaleControlsEnabled(this.scaleControlsEnabled);
    uiSettings?.setMyLocationButtonEnabled(this.myLocationEnabled && this.myLocationButtonEnabled);
    this.applyHarmonyOverlays();

    if (this.initialCameraPosition) {
      try {
        this.aMap.moveCamera(CameraUpdateFactory.newCameraPosition(this.initialCameraPosition));
      } catch (error) {
        Logger.warn(`apply initialCameraPosition failed: ${JSON.stringify(error)}`);
      }
    }
  }

  private applyWorldMapSwitchOption(): void {
    if (this.lastAppliedWorldMapSwitchEnabled === this.worldMapSwitchEnabled) {
      return;
    }

    try {
      MapsInitializer.setLoadWorldVectorMap(this.worldMapSwitchEnabled);
      this.lastAppliedWorldMapSwitchEnabled = this.worldMapSwitchEnabled;
    } catch (error) {
      Logger.warn(`setLoadWorldVectorMap failed: ${JSON.stringify(error)}`);
    }
  }

  private applyCustomMapStyle(): void {
    if (!this.aMap) {
      return;
    }

    const style = this.customMapStyle;
    const hasCustomStyle = !!(style?.styleId || style?.styleDataPath || style?.extraStyleDataPath);

    if (!hasCustomStyle) {
      if (this.hasAppliedCustomMapStyle) {
        try {
          const disableStyleOptions = new CustomMapStyleOptions();
          disableStyleOptions.setEnable(false);
          this.aMap.setCustomMapStyle(disableStyleOptions);
          this.hasAppliedCustomMapStyle = false;
        } catch (error) {
          Logger.warn(`disable custom map style failed: ${JSON.stringify(error)}`);
        }
      }
      return;
    }

    const customMapStyleOptions = new CustomMapStyleOptions();
    customMapStyleOptions.setEnable(true);
    if (style?.styleId) {
      customMapStyleOptions.setStyleId(style.styleId);
    }
    if (style?.styleDataPath) {
      customMapStyleOptions.setStyleDataPath(style.styleDataPath);
    }
    if (style?.extraStyleDataPath) {
      customMapStyleOptions.setStyleExtraPath(style.extraStyleDataPath);
    }

    try {
      this.aMap.setCustomMapStyle(customMapStyleOptions, (errorCode: number, errorMsg: string) => {
        Logger.warn(`setCustomMapStyle failed code=${errorCode} msg=${errorMsg}`);
      });
      this.hasAppliedCustomMapStyle = true;
    } catch (error) {
      Logger.warn(`setCustomMapStyle failed: ${JSON.stringify(error)}`);
    }
  }

  private applyMyLocationStyle(): void {
    if (!this.aMap) {
      return;
    }

    const style = new MyLocationStyle();
    const representation = this.userLocationRepresentation;
    style.myLocationType(resolveMyLocationType(representation?.locationType, this.followUserLocation));

    if (representation?.showMyLocation !== undefined) {
      style.showMyLocation(representation.showMyLocation);
    }

    if (representation?.anchorU !== undefined || representation?.anchorV !== undefined) {
      style.anchor(representation?.anchorU ?? 0.5, representation?.anchorV ?? 1);
    }

    if (representation?.showsAccuracyRing === false) {
      style.radiusFillColor(0x00000000);
      style.strokeColor(0x00000000);
      style.strokeWidth(0);
    } else {
      const fillColor = parseColor(representation?.fillColor);
      if (fillColor !== undefined) {
        style.radiusFillColor(fillColor);
      }

      const strokeColor = parseColor(representation?.strokeColor);
      if (strokeColor !== undefined) {
        style.strokeColor(strokeColor);
      }

      if (representation?.lineWidth !== undefined) {
        style.strokeWidth(representation.lineWidth);
      }
    }

    this.tryApplyMyLocationIcon(style, representation?.image);
    this.warnUnsupportedLocationRepresentation(representation);

    try {
      this.aMap.setMyLocationStyle(style);
    } catch (error) {
      Logger.warn(`setMyLocationStyle failed: ${JSON.stringify(error)}`);
    }
  }

  private tryApplyMyLocationIcon(style: MyLocationStyle, imagePath: string | undefined): void {
    if (!imagePath) {
      return;
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('file://')) {
      Logger.warn(`userLocationRepresentation.image only supports rawfile path on Harmony: ${imagePath}`);
      return;
    }

    try {
      const uiContext = this.ctx.uiAbilityContext;
      if (!uiContext) {
        return;
      }
      const icon = BitmapDescriptorFactory.fromRawfilePathSync(uiContext, imagePath);
      if (icon) {
        style.myLocationIcon(icon);
      }
    } catch (error) {
      Logger.warn(`set myLocation icon failed: ${JSON.stringify(error)}`);
    }
  }

  private warnUnsupportedLocationRepresentation(
    representation: UserLocationRepresentation | undefined
  ): void {
    if (!representation || this.hasLoggedUnsupportedLocationRepresentation) {
      return;
    }

    const unsupportedProps: Array<string> = [];
    if (representation.showsHeadingIndicator !== undefined) unsupportedProps.push('showsHeadingIndicator');
    if (representation.enablePulseAnimation !== undefined) unsupportedProps.push('enablePulseAnimation');
    if (representation.locationDotBgColor !== undefined) unsupportedProps.push('locationDotBgColor');
    if (representation.locationDotFillColor !== undefined) unsupportedProps.push('locationDotFillColor');
    if (representation.imageWidth !== undefined) unsupportedProps.push('imageWidth');
    if (representation.imageHeight !== undefined) unsupportedProps.push('imageHeight');

    if (unsupportedProps.length === 0) {
      return;
    }

    this.hasLoggedUnsupportedLocationRepresentation = true;
    Logger.warn(
      `userLocationRepresentation props not supported on Harmony yet: ${unsupportedProps.join(', ')}`
    );
  }

  private bindMapListeners(): void {
    if (!this.aMap) {
      return;
    }

    this.aMap.setOnMapClickListener((point: LatLng) => {
      this.emitMapPress(point);
    });

    this.aMap.setOnMapLongClickListener((point: LatLng) => {
      this.emitMapLongPress(point);
    });

    this.aMap.setOnMyLocationChangeListener((location: GeoLocationLike) => {
      this.emitLocation(location);
    });

    this.aMap.addOnPOIClickListener((poi: Poi) => {
      this.emitPressPoi(poi);
    });

    this.aMap.setOnCameraChangeListener(
      new OnCameraChangeListener(
        (position: CameraPosition) => {
          this.emitCameraMove(position);
        },
        (position: CameraPosition) => {
          this.emitCameraIdle(position);
        }
      )
    );
  }

  private emitMapPress(point: LatLng): void {
    this.ctx.rnInstance.emitComponentEvent(this.tag, EVENT_CHANNEL, {
      type: 'onMapPress',
      latitude: point.latitude,
      longitude: point.longitude,
    });
  }

  private emitMapLongPress(point: LatLng): void {
    this.ctx.rnInstance.emitComponentEvent(this.tag, EVENT_CHANNEL, {
      type: 'onMapLongPress',
      latitude: point.latitude,
      longitude: point.longitude,
    });
  }

  private emitPressPoi(poi: Poi): void {
    const coordinate = poi.getCoordinate();
    this.ctx.rnInstance.emitComponentEvent(this.tag, EVENT_CHANNEL, {
      type: 'onPressPoi',
      id: poi.getPoiId(),
      name: poi.getName(),
      latitude: coordinate?.latitude ?? 0,
      longitude: coordinate?.longitude ?? 0,
    });
  }

  private emitLocation(location: GeoLocationLike): void {
    this.ctx.rnInstance.emitComponentEvent(this.tag, EVENT_CHANNEL, {
      type: 'onLocation',
      latitude: Number(location?.latitude ?? 0),
      longitude: Number(location?.longitude ?? 0),
      accuracy: Number(location?.accuracy ?? 0),
    });
  }

  private emitCameraMove(position: CameraPosition): void {
    this.emitCameraEvent('onCameraMove', position);
  }

  private emitCameraIdle(position: CameraPosition): void {
    this.emitCameraEvent('onCameraIdle', position);
  }

  private emitCameraEvent(type: 'onCameraMove' | 'onCameraIdle', position: CameraPosition): void {
    if (type === 'onCameraMove') {
      const throttleMs = Math.max(0, this.cameraEventThrottleMs);
      if (throttleMs > 0) {
        const now = Date.now();
        if (now - this.lastCameraMoveEventAt < throttleMs) {
          return;
        }
        this.lastCameraMoveEventAt = now;
      }
    }

    const target = position.target;
    const visibleBounds = this.aMap
      ?.getProjection()
      ?.getVisibleRegion()
      ?.latLngBounds;
    const northEast = visibleBounds?.northeast;
    const southWest = visibleBounds?.southwest;
    const fallbackDelta = 0.01;

    this.ctx.rnInstance.emitComponentEvent(this.tag, EVENT_CHANNEL, {
      type,
      targetLatitude: target.latitude,
      targetLongitude: target.longitude,
      zoom: position.zoom,
      bearing: position.bearing,
      tilt: position.tilt,
      northEastLatitude: northEast?.latitude ?? (target.latitude + fallbackDelta),
      northEastLongitude: northEast?.longitude ?? (target.longitude + fallbackDelta),
      southWestLatitude: southWest?.latitude ?? (target.latitude - fallbackDelta),
      southWestLongitude: southWest?.longitude ?? (target.longitude - fallbackDelta),
    });
  }

  private emitLoad(): void {
    this.ctx.rnInstance.emitComponentEvent(this.tag, EVENT_CHANNEL, {
      type: 'onLoad',
    });
  }

  build() {
    RNViewBase({ ctx: this.ctx, tag: this.tag }) {
      if (this.canCreateNativeMap) {
        MapViewComponent({ mapViewName: this.tag.toString() })
          .width('100%')
          .height('100%');
      }
    }
  }
}
