import {
  AMap,
  BitmapDescriptor,
  BitmapDescriptorFactory,
  Circle,
  CircleOptions,
  LatLng,
  Marker,
  MarkerOptions,
  Polygon,
  PolygonHoleOptions,
  PolygonOptions,
  Polyline,
  PolylineOptions,
} from '@amap/amap_lbs_map3d';
import { Descriptor, RNComponentContext } from '@rnoh/react-native-openharmony';
import { ArrayList } from '@kit.ArkTS';

import Logger from '../../Logger';
import { parseColor } from './helpers';

export const MARKER_COMPONENT_NAME = 'MarkerView';
export const POLYLINE_COMPONENT_NAME = 'PolylineView';
export const POLYGON_COMPONENT_NAME = 'PolygonView';
export const CIRCLE_COMPONENT_NAME = 'CircleView';
export const HEAT_MAP_COMPONENT_NAME = 'HeatMapView';
export const MULTI_POINT_COMPONENT_NAME = 'MultiPointView';

export const MARKER_EVENT_CHANNEL = 'MarkerView';
export const POLYLINE_EVENT_CHANNEL = 'PolylineView';

type OverlayKind = 'marker' | 'polyline' | 'polygon' | 'circle' | 'heatMap' | 'multiPoint';

type NumberValue = number | string;
type ColorValue = number | string;

interface LatLngInput {
  latitude?: NumberValue;
  longitude?: NumberValue;
}

interface PointInput {
  x?: NumberValue;
  y?: NumberValue;
}

interface MarkerRawProps {
  position?: LatLngInput;
  latitude?: NumberValue;
  longitude?: NumberValue;
  title?: string;
  snippet?: string;
  pinColor?: string;
  draggable?: boolean;
  flat?: boolean;
  zIndex?: NumberValue;
  opacity?: NumberValue;
  anchor?: PointInput;
  centerOffset?: PointInput;
  icon?: string;
}

interface PolylineRawProps {
  points?: LatLngInput[];
  strokeWidth?: NumberValue;
  zIndex?: NumberValue;
  gradient?: boolean;
  geodesic?: boolean;
  dotted?: boolean;
  strokeColor?: ColorValue;
  colors?: ColorValue[];
}

interface PolygonRawProps {
  points?: LatLngInput[] | LatLngInput[][];
  strokeWidth?: NumberValue;
  zIndex?: NumberValue;
  strokeColor?: ColorValue;
  fillColor?: ColorValue;
}

interface CircleRawProps {
  center?: LatLngInput;
  radius?: NumberValue;
  strokeWidth?: NumberValue;
  zIndex?: NumberValue;
  strokeColor?: ColorValue;
  fillColor?: ColorValue;
}

interface OverlayKindProbeProps {
  position?: LatLngInput;
  latitude?: NumberValue;
  longitude?: NumberValue;
}

function asMarkerRawProps(rawProps: ESObject): MarkerRawProps {
  return rawProps as MarkerRawProps;
}

function asPolylineRawProps(rawProps: ESObject): PolylineRawProps {
  return rawProps as PolylineRawProps;
}

function asPolygonRawProps(rawProps: ESObject): PolygonRawProps {
  return rawProps as PolygonRawProps;
}

function asCircleRawProps(rawProps: ESObject): CircleRawProps {
  return rawProps as CircleRawProps;
}

function readNumber(value: NumberValue | undefined, fallback: number): number {
  if (typeof value === 'number') {
    return Number(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function readBoolean(value: boolean | undefined, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function toLatLng(input: LatLngInput | undefined): LatLng {
  return new LatLng(readNumber(input?.latitude, 0), readNumber(input?.longitude, 0));
}

function toLatLngList(values: LatLngInput[] | undefined): LatLng[] {
  if (!values || values.length === 0) {
    return [];
  }

  const result: LatLng[] = [];
  for (let i = 0; i < values.length; i += 1) {
    result.push(toLatLng(values[i]));
  }
  return result;
}

function toArrayList(points: LatLng[]): ArrayList<LatLng> {
  const result = new ArrayList<LatLng>();
  for (let i = 0; i < points.length; i += 1) {
    try {
      result.add(points[i]);
    } catch (error) {
      // TODO: Implement error handling.
    }
  }
  return result;
}

function normalizePolygonRings(values: LatLngInput[] | LatLngInput[][] | undefined): LatLngInput[][] {
  if (!values || values.length === 0) {
    return [];
  }

  const firstRing = values[0];
  if (Array.isArray(firstRing)) {
    return values as LatLngInput[][];
  }

  return [values as LatLngInput[]];
}

class OnceLogger {
  private warnedKeys: Set<string> = new Set();

  warnOnce(key: string, message: string): void {
    if (this.warnedKeys.has(key)) {
      return;
    }
    this.warnedKeys.add(key);
    Logger.warn(message);
  }
}

const unsupportedLogger = new OnceLogger();

export class HarmonyChildOverlayManager {
  private readonly ctx: RNComponentContext;
  private readonly mapTag: number;

  private aMap?: AMap;
  private hasLoggedSetMap: boolean = false;

  private markerByTag: Map<number, Marker> = new Map();
  private markerNativeIdToTag: Map<string, number> = new Map();
  private markerCustomViewEnabledByTag: Set<number> = new Set();
  private markerCustomIconByTag: Map<number, BitmapDescriptor> = new Map();
  private markerSignatureByTag: Map<number, string> = new Map();

  private polylineByTag: Map<number, Polyline> = new Map();
  private polylineNativeIdToTag: Map<string, number> = new Map();

  private polygonByTag: Map<number, Polygon> = new Map();
  private circleByTag: Map<number, Circle> = new Map();

  constructor(ctx: RNComponentContext, mapTag: number) {
    this.ctx = ctx;
    this.mapTag = mapTag;
  }

  setMap(aMap: AMap | undefined): void {
    this.aMap = aMap;
    if (!aMap) {
      this.hasLoggedSetMap = false;
      return;
    }
    if (aMap && !this.hasLoggedSetMap) {
      this.hasLoggedSetMap = true;
      Logger.info(`overlay manager bind map (mapTag=${this.mapTag})`);
    }
  }

  clearAll(): void {
    this.markerByTag.forEach((marker) => {
      try {
        marker.remove();
      } catch (error) {
        Logger.warn(`remove marker failed: ${JSON.stringify(error)}`);
      }
    });
    this.polylineByTag.forEach((polyline) => {
      try {
        polyline.remove();
      } catch (error) {
        Logger.warn(`remove polyline failed: ${JSON.stringify(error)}`);
      }
    });
    this.polygonByTag.forEach((polygon) => {
      try {
        polygon.remove();
      } catch (error) {
        Logger.warn(`remove polygon failed: ${JSON.stringify(error)}`);
      }
    });
    this.circleByTag.forEach((circle) => {
      try {
        circle.remove();
      } catch (error) {
        Logger.warn(`remove circle failed: ${JSON.stringify(error)}`);
      }
    });

    this.markerByTag.clear();
    this.markerNativeIdToTag.clear();
    this.markerCustomViewEnabledByTag.clear();
    this.markerCustomIconByTag.clear();
    this.markerSignatureByTag.clear();
    this.polylineByTag.clear();
    this.polylineNativeIdToTag.clear();
    this.polygonByTag.clear();
    this.circleByTag.clear();
  }

  syncChildren(mapDescriptor: Descriptor): void {
    const nextOverlayTags: Set<number> = new Set();

    for (let i = 0; i < mapDescriptor.childrenTags.length; i += 1) {
      const childTag = mapDescriptor.childrenTags[i];
      const childDescriptor = this.ctx.descriptorRegistry.getDescriptor(childTag);
      if (!childDescriptor) {
        continue;
      }

      const descriptorType = String(childDescriptor.type ?? '');
      const componentName = this.ctx.rnInstance.getComponentNameFromDescriptorType(descriptorType);
      const overlayKind =
        this.resolveOverlayKind(componentName, descriptorType) ??
        this.inferOverlayKindByRawProps(childDescriptor.rawProps as ESObject);
      if (!overlayKind) {
        continue;
      }

      nextOverlayTags.add(childTag);
      HarmonyOverlayRegistry.bindChildTag(this.mapTag, childTag);

      if (overlayKind === 'marker') {
        this.updateMarkerCustomViewState(childTag, childDescriptor.childrenTags.length > 0);
      }

      if (!this.aMap) {
        continue;
      }

      if (overlayKind === 'marker' && !this.markerByTag.has(childTag)) {
        this.upsertMarker(childTag, childDescriptor.rawProps as ESObject);
      } else if (overlayKind === 'polyline' && !this.polylineByTag.has(childTag)) {
        this.upsertPolyline(childTag, childDescriptor.rawProps as ESObject);
      } else if (overlayKind === 'polygon' && !this.polygonByTag.has(childTag)) {
        this.upsertPolygon(childTag, childDescriptor.rawProps as ESObject);
      } else if (overlayKind === 'circle' && !this.circleByTag.has(childTag)) {
        this.upsertCircle(childTag, childDescriptor.rawProps as ESObject);
      } else if (overlayKind === 'heatMap') {
        unsupportedLogger.warnOnce('HeatMapView', 'HeatMapView is not implemented on Harmony yet, ignore overlay.');
      } else if (overlayKind === 'multiPoint') {
        unsupportedLogger.warnOnce('MultiPointView', 'MultiPointView is not implemented on Harmony yet, ignore overlay.');
      }
    }

    this.removeStaleOverlays(nextOverlayTags);
  }

  removeOverlayByTag(childTag: number): void {
    this.removeMarker(childTag);
    this.removePolyline(childTag);
    this.removePolygon(childTag);
    this.removeCircle(childTag);
    HarmonyOverlayRegistry.unbindChildTag(childTag);
  }

  updateMarker(childTag: number, rawProps: ESObject): void {
    if (!this.aMap || !HarmonyOverlayRegistry.isChildBoundToMap(this.mapTag, childTag)) {
      return;
    }
    this.upsertMarker(childTag, rawProps);
  }

  updateMarkerCustomViewState(childTag: number, enabled: boolean): void {
    if (enabled) {
      this.markerCustomViewEnabledByTag.add(childTag);
      const marker = this.markerByTag.get(childTag);
      const icon = this.markerCustomIconByTag.get(childTag);
      if (marker && icon) {
        marker.setIcon(icon);
        marker.setVisible(true);
      }
      return;
    }

    this.markerCustomViewEnabledByTag.delete(childTag);
    this.markerCustomIconByTag.delete(childTag);

    const marker = this.markerByTag.get(childTag);
    if (!marker) {
      return;
    }

    const descriptor = this.ctx.descriptorRegistry.getDescriptor(childTag);
    if (!descriptor) {
      return;
    }

    const raw = asMarkerRawProps(descriptor.rawProps as ESObject);
    this.applyMarkerIconToMarker(marker, raw.icon, raw.pinColor);
  }

  updateMarkerCustomViewIcon(childTag: number, icon: BitmapDescriptor | undefined): void {
    if (!icon) {
      return;
    }

    this.markerCustomViewEnabledByTag.add(childTag);
    this.markerCustomIconByTag.set(childTag, icon);
    const marker = this.markerByTag.get(childTag);
    if (!marker) {
      return;
    }

    marker.setIcon(icon);
    marker.setVisible(true);
    this.logMarkerState('updateMarkerCustomViewIcon', childTag, marker);
  }

  updatePolyline(childTag: number, rawProps: ESObject): void {
    if (!this.aMap || !HarmonyOverlayRegistry.isChildBoundToMap(this.mapTag, childTag)) {
      return;
    }
    this.upsertPolyline(childTag, rawProps);
  }

  updatePolygon(childTag: number, rawProps: ESObject): void {
    if (!this.aMap || !HarmonyOverlayRegistry.isChildBoundToMap(this.mapTag, childTag)) {
      return;
    }
    this.upsertPolygon(childTag, rawProps);
  }

  updateCircle(childTag: number, rawProps: ESObject): void {
    if (!this.aMap || !HarmonyOverlayRegistry.isChildBoundToMap(this.mapTag, childTag)) {
      return;
    }
    this.upsertCircle(childTag, rawProps);
  }

  updateHeatMap(_childTag: number): void {
    unsupportedLogger.warnOnce('HeatMapView', 'HeatMapView is not implemented on Harmony yet, ignore overlay.');
  }

  updateMultiPoint(_childTag: number): void {
    unsupportedLogger.warnOnce('MultiPointView', 'MultiPointView is not implemented on Harmony yet, ignore overlay.');
  }

  resolveMarkerChildTag(marker: Marker): number | undefined {
    return this.markerNativeIdToTag.get(marker.getId());
  }

  resolvePolylineChildTag(polyline: Polyline): number | undefined {
    return this.polylineNativeIdToTag.get(polyline.getId());
  }

  private resolveOverlayKind(componentName: string, descriptorType: string): OverlayKind | undefined {
    const byComponentName = this.resolveOverlayKindByName(this.normalizeComponentName(componentName));
    if (byComponentName) {
      return byComponentName;
    }

    return this.resolveOverlayKindByName(this.normalizeComponentName(descriptorType));
  }

  private normalizeComponentName(name: string): string {
    if (!name) {
      return '';
    }

    let normalized = name.trim();
    const separatorIndex = Math.max(
      normalized.lastIndexOf('/'),
      normalized.lastIndexOf('.'),
      normalized.lastIndexOf(':')
    );
    if (separatorIndex >= 0 && separatorIndex < normalized.length - 1) {
      normalized = normalized.slice(separatorIndex + 1);
    }

    return normalized;
  }

  private resolveOverlayKindByName(name: string): OverlayKind | undefined {
    const lowerName = name.toLowerCase();
    if (lowerName === 'marker') {
      return 'marker';
    }
    if (lowerName === MARKER_COMPONENT_NAME.toLowerCase()) {
      return 'marker';
    }
    if (lowerName === POLYLINE_COMPONENT_NAME.toLowerCase()) {
      return 'polyline';
    }
    if (lowerName === POLYGON_COMPONENT_NAME.toLowerCase()) {
      return 'polygon';
    }
    if (lowerName === CIRCLE_COMPONENT_NAME.toLowerCase()) {
      return 'circle';
    }
    if (lowerName === HEAT_MAP_COMPONENT_NAME.toLowerCase()) {
      return 'heatMap';
    }
    if (lowerName === MULTI_POINT_COMPONENT_NAME.toLowerCase()) {
      return 'multiPoint';
    }

    // Handle descriptor names with prefixes/suffixes, e.g. namespace.MarkerView or MarkerViewNativeComponent.
    if (lowerName.endsWith(MARKER_COMPONENT_NAME.toLowerCase())) {
      return 'marker';
    }
    if (lowerName.endsWith(POLYLINE_COMPONENT_NAME.toLowerCase())) {
      return 'polyline';
    }
    if (lowerName.endsWith(POLYGON_COMPONENT_NAME.toLowerCase())) {
      return 'polygon';
    }
    if (lowerName.endsWith(CIRCLE_COMPONENT_NAME.toLowerCase())) {
      return 'circle';
    }
    if (lowerName.endsWith(HEAT_MAP_COMPONENT_NAME.toLowerCase())) {
      return 'heatMap';
    }
    if (lowerName.endsWith(MULTI_POINT_COMPONENT_NAME.toLowerCase())) {
      return 'multiPoint';
    }

    return undefined;
  }

  private inferOverlayKindByRawProps(rawProps: ESObject): OverlayKind | undefined {
    if (!rawProps || typeof rawProps !== 'object') {
      return undefined;
    }
    const props = rawProps as OverlayKindProbeProps;

    const hasLatLng =
      props.latitude !== undefined ||
      props.longitude !== undefined ||
      props.position !== undefined;

    if (hasLatLng) {
      return 'marker';
    }

    return undefined;
  }

  private removeStaleOverlays(nextOverlayTags: Set<number>): void {
    const markerTagsToRemove: number[] = [];
    this.markerByTag.forEach((_marker, tag) => {
      if (!nextOverlayTags.has(tag)) {
        markerTagsToRemove.push(tag);
      }
    });
    markerTagsToRemove.forEach((tag) => this.removeMarker(tag));

    const polylineTagsToRemove: number[] = [];
    this.polylineByTag.forEach((_polyline, tag) => {
      if (!nextOverlayTags.has(tag)) {
        polylineTagsToRemove.push(tag);
      }
    });
    polylineTagsToRemove.forEach((tag) => this.removePolyline(tag));

    const polygonTagsToRemove: number[] = [];
    this.polygonByTag.forEach((_polygon, tag) => {
      if (!nextOverlayTags.has(tag)) {
        polygonTagsToRemove.push(tag);
      }
    });
    polygonTagsToRemove.forEach((tag) => this.removePolygon(tag));

    const circleTagsToRemove: number[] = [];
    this.circleByTag.forEach((_circle, tag) => {
      if (!nextOverlayTags.has(tag)) {
        circleTagsToRemove.push(tag);
      }
    });
    circleTagsToRemove.forEach((tag) => this.removeCircle(tag));
  }

  private upsertMarker(childTag: number, rawProps: ESObject): void {
    if (!this.aMap) {
      return;
    }

    const raw = asMarkerRawProps(rawProps);
    const latitude = raw.position
      ? readNumber(raw.position.latitude, 0)
      : readNumber(raw.latitude, 0);
    const longitude = raw.position
      ? readNumber(raw.position.longitude, 0)
      : readNumber(raw.longitude, 0);

    const existingMarker = this.markerByTag.get(childTag);
    const customViewEnabled = this.markerCustomViewEnabledByTag.has(childTag);
    const customViewIcon = this.markerCustomIconByTag.get(childTag);
    const nextSignature = this.buildMarkerSignature(raw, customViewEnabled, customViewIcon);
    if (existingMarker) {
      const previousSignature = this.markerSignatureByTag.get(childTag);
      if (previousSignature === nextSignature) {
        Logger.info(`skip duplicate marker update (tag=${childTag}, markerId=${existingMarker.getId()})`);
        return;
      }
      Logger.info(`updateMarker in-place (tag=${childTag}, markerId=${existingMarker.getId()}, lat=${latitude}, lng=${longitude})`);
      existingMarker.setPosition(new LatLng(latitude, longitude));
      if (raw.title !== undefined) {
        existingMarker.setTitle(raw.title);
      }
      if (raw.snippet !== undefined) {
        existingMarker.setSnippet(raw.snippet);
      }
      existingMarker.setDraggable(readBoolean(raw.draggable, false));
      existingMarker.setFlat(readBoolean(raw.flat, false));
      if (raw.zIndex !== undefined) {
        existingMarker.setZIndex(readNumber(raw.zIndex, 1));
      } else {
        existingMarker.setZIndex(1);
      }
      if (raw.anchor) {
        existingMarker.setAnchor(readNumber(raw.anchor.x, 0.5), readNumber(raw.anchor.y, 1));
      }
      if (raw.opacity !== undefined) {
        existingMarker.setAlpha(readNumber(raw.opacity, 1));
      }
      existingMarker.setVisible(true);

      const markerOptions = existingMarker.getOptions();
      const centerOffset = raw.centerOffset;
      if (centerOffset) {
        markerOptions.setInfoWindowOffset(readNumber(centerOffset.x, 0), readNumber(centerOffset.y, 0));
        // Avoid resetting marker options on every update.
        // Harmony marker rendering can be unstable when repeatedly calling setMarkerOptions.
        existingMarker.setMarkerOptions(markerOptions);
      }
      if (customViewEnabled) {
        if (customViewIcon) {
          existingMarker.setIcon(customViewIcon);
        }
      } else {
        this.applyMarkerIconToMarker(existingMarker, raw.icon, raw.pinColor);
      }
      this.markerSignatureByTag.set(childTag, nextSignature);
      this.logMarkerState('updateMarker', childTag, existingMarker);
      return;
    }

    const options = new MarkerOptions();
    options.setPosition(new LatLng(latitude, longitude));

    const title = raw.title;
    if (title !== undefined) {
      options.setTitle(title);
    }

    const snippet = raw.snippet;
    if (snippet !== undefined) {
      options.setSnippet(snippet);
    }

    options.setDraggable(readBoolean(raw.draggable, false));
    options.setFlat(readBoolean(raw.flat, false));
    if (raw.zIndex !== undefined) {
      options.setZIndex(readNumber(raw.zIndex, 1));
    } else {
      options.setZIndex(1);
    }
    options.setVisible(true);

    const anchor = raw.anchor;
    if (anchor) {
      options.setAnchor(readNumber(anchor.x, 0.5), readNumber(anchor.y, 1));
    }

    if (raw.opacity !== undefined) {
      options.setAlpha(readNumber(raw.opacity, 1));
    }

    const centerOffset = raw.centerOffset;
    if (centerOffset) {
      options.setInfoWindowOffset(readNumber(centerOffset.x, 0), readNumber(centerOffset.y, 0));
    }

    let resolvedIcon: BitmapDescriptor | undefined = customViewIcon;
    if (customViewIcon) {
      options.setIcon(customViewIcon);
    } else {
      resolvedIcon = this.applyMarkerIcon(options, raw.icon, raw.pinColor);
    }

    const marker = this.aMap.addMarker(options);
    if (!marker) {
      Logger.warn(`addMarker returned undefined (tag=${childTag}, lat=${latitude}, lng=${longitude})`);
      return;
    }
    Logger.info(`addMarker success (tag=${childTag}, markerId=${marker.getId()}, lat=${latitude}, lng=${longitude})`);
    if (resolvedIcon) {
      marker.setIcon(resolvedIcon);
    }
    marker.setVisible(true);
    this.markerSignatureByTag.set(childTag, nextSignature);
    this.logMarkerState('addMarker', childTag, marker);

    this.markerByTag.set(childTag, marker);
    this.markerNativeIdToTag.set(marker.getId(), childTag);
  }

  private upsertPolyline(childTag: number, rawProps: ESObject): void {
    if (!this.aMap) {
      return;
    }

    this.removePolyline(childTag);

    const raw = asPolylineRawProps(rawProps);
    const points = toLatLngList(raw.points);

    const options = new PolylineOptions();
    if (points.length > 0) {
      options.add(...points);
    }

    options.setWidth(readNumber(raw.strokeWidth, 5));
    options.setZIndex(readNumber(raw.zIndex, 0));
    options.setGradient(readBoolean(raw.gradient, false));
    options.setGeodesic(readBoolean(raw.geodesic, false));
    options.setDottedLine(readBoolean(raw.dotted, false));

    const strokeColor = parseColor(raw.strokeColor);
    if (strokeColor !== undefined) {
      options.setColor(strokeColor);
    }

    const colorValues = raw.colors ?? [];
    if (colorValues.length > 0) {
      const colors: number[] = [];
      for (let i = 0; i < colorValues.length; i += 1) {
        const colorValue = colorValues[i];
        const parsed = parseColor(colorValue);
        if (parsed !== undefined) {
          colors.push(parsed);
        }
      }
      if (colors.length > 0) {
        options.setColorValues(new Int32Array(colors));
      }
    }

    const polyline = this.aMap.addPolyline(options);
    if (!polyline) {
      return;
    }

    polyline.setPoints(toArrayList(points));
    this.polylineByTag.set(childTag, polyline);
    this.polylineNativeIdToTag.set(polyline.getId(), childTag);
  }

  private upsertPolygon(childTag: number, rawProps: ESObject): void {
    if (!this.aMap) {
      return;
    }

    this.removePolygon(childTag);

    const raw = asPolygonRawProps(rawProps);
    const ringsRaw = normalizePolygonRings(raw.points);
    if (ringsRaw.length === 0) {
      return;
    }

    const options = new PolygonOptions();
    const outer = toLatLngList(ringsRaw[0]);
    for (let i = 0; i < outer.length; i += 1) {
      options.add(outer[i]);
    }

    if (ringsRaw.length > 1) {
      const holes: PolygonHoleOptions[] = [];
      for (let i = 1; i < ringsRaw.length; i += 1) {
        const holePoints = toLatLngList(ringsRaw[i]);
        if (holePoints.length === 0) {
          continue;
        }
        const hole = new PolygonHoleOptions();
        hole.add(...holePoints);
        holes.push(hole);
      }
      if (holes.length > 0) {
        options.addHoles(...holes);
      }
    }

    options.setStrokeWidth(readNumber(raw.strokeWidth, 1));
    options.setZIndex(readNumber(raw.zIndex, 0));

    const strokeColor = parseColor(raw.strokeColor);
    if (strokeColor !== undefined) {
      options.setStrokeColor(strokeColor);
    }

    const fillColor = parseColor(raw.fillColor);
    if (fillColor !== undefined) {
      options.setFillColor(fillColor);
    }

    const polygon = this.aMap.addPolygon(options);
    if (!polygon) {
      return;
    }

    this.polygonByTag.set(childTag, polygon);
  }

  private upsertCircle(childTag: number, rawProps: ESObject): void {
    if (!this.aMap) {
      return;
    }

    this.removeCircle(childTag);

    const raw = asCircleRawProps(rawProps);
    const options = new CircleOptions();
    options.setCenter(toLatLng(raw.center));
    options.setRadius(readNumber(raw.radius, 0));
    options.setStrokeWidth(readNumber(raw.strokeWidth, 1));
    options.setZIndex(readNumber(raw.zIndex, 0));

    const strokeColor = parseColor(raw.strokeColor);
    if (strokeColor !== undefined) {
      options.setStrokeColor(strokeColor);
    }

    const fillColor = parseColor(raw.fillColor);
    if (fillColor !== undefined) {
      options.setFillColor(fillColor);
    }

    const circle = this.aMap.addCircle(options);
    if (!circle) {
      return;
    }

    this.circleByTag.set(childTag, circle);
  }

  private removeMarker(childTag: number): void {
    const marker = this.markerByTag.get(childTag);
    if (!marker) {
      return;
    }

    try {
      Logger.info(`removeMarker (tag=${childTag}, markerId=${marker.getId()})`);
      this.markerNativeIdToTag.delete(marker.getId());
      marker.remove();
    } catch (error) {
      Logger.warn(`remove marker failed: ${JSON.stringify(error)}`);
    }
    this.markerByTag.delete(childTag);
    this.markerCustomViewEnabledByTag.delete(childTag);
    this.markerCustomIconByTag.delete(childTag);
    this.markerSignatureByTag.delete(childTag);
  }

  private removePolyline(childTag: number): void {
    const polyline = this.polylineByTag.get(childTag);
    if (!polyline) {
      return;
    }

    try {
      this.polylineNativeIdToTag.delete(polyline.getId());
      polyline.remove();
    } catch (error) {
      Logger.warn(`remove polyline failed: ${JSON.stringify(error)}`);
    }
    this.polylineByTag.delete(childTag);
  }

  private removePolygon(childTag: number): void {
    const polygon = this.polygonByTag.get(childTag);
    if (!polygon) {
      return;
    }

    try {
      polygon.remove();
    } catch (error) {
      Logger.warn(`remove polygon failed: ${JSON.stringify(error)}`);
    }
    this.polygonByTag.delete(childTag);
  }

  private removeCircle(childTag: number): void {
    const circle = this.circleByTag.get(childTag);
    if (!circle) {
      return;
    }

    try {
      circle.remove();
    } catch (error) {
      Logger.warn(`remove circle failed: ${JSON.stringify(error)}`);
    }
    this.circleByTag.delete(childTag);
  }

  private applyMarkerIcon(
    options: MarkerOptions,
    iconPath: string | undefined,
    pinColor: string | undefined
  ): BitmapDescriptor | undefined {
    const icon = this.resolveMarkerBitmapDescriptor(iconPath);
    if (icon) {
      options.setIcon(icon);
      return icon;
    }

    if (pinColor && pinColor.trim().length > 0) {
      unsupportedLogger.warnOnce(
        `Marker.pinColor.${pinColor}`,
        `pinColor=${pinColor} is not applied on Harmony now; using SDK default marker icon`
      );
    }

    return undefined;
  }

  private applyMarkerIconToMarker(
    marker: Marker,
    iconPath: string | undefined,
    pinColor: string | undefined
  ): void {
    const icon = this.resolveMarkerBitmapDescriptor(iconPath);
    if (icon) {
      marker.setIcon(icon);
      return;
    }

    if (pinColor && pinColor.trim().length > 0) {
      unsupportedLogger.warnOnce(
        `Marker.pinColor.${pinColor}`,
        `pinColor=${pinColor} is not applied on Harmony now; using SDK default marker icon`
      );
    }
  }

  private resolveMarkerBitmapDescriptor(iconPath: string | undefined): BitmapDescriptor | undefined {
    if (!iconPath || iconPath.trim().length === 0) {
      return undefined;
    }

    if (iconPath.startsWith('http://') || iconPath.startsWith('https://') || iconPath.startsWith('file://')) {
      Logger.warn(`Marker icon only supports rawfile/asset path on Harmony, ignore: ${iconPath}`);
      return undefined;
    }

    try {
      const uiContext = this.ctx.uiAbilityContext;
      if (uiContext) {
        const rawIcon = BitmapDescriptorFactory.fromRawfilePathSync(uiContext, iconPath);
        if (rawIcon) {
          return rawIcon;
        }
      }

      return BitmapDescriptorFactory.fromAsset(iconPath);
    } catch (error) {
      Logger.warn(`create Marker icon failed: ${JSON.stringify(error)}`);
      return undefined;
    }
  }

  private logMarkerState(stage: string, childTag: number, marker: Marker): void {
    try {
      const pos = marker.getPosition();
      const icon = marker.getIcon();
      const iconWidth = icon ? icon.getWidth() : -1;
      const iconHeight = icon ? icon.getHeight() : -1;
      const camera = this.aMap?.getCameraPosition();
      const cameraTarget = camera?.target;
      Logger.info(
        `${stage} state (mapTag=${this.mapTag}, tag=${childTag}, markerId=${marker.getId()}, visible=${marker.isVisible()}, zIndex=${marker.getZIndex()}, hasIcon=${icon !== undefined}, iconW=${iconWidth}, iconH=${iconHeight}, lat=${pos.latitude}, lng=${pos.longitude}, camLat=${cameraTarget?.latitude ?? -1}, camLng=${cameraTarget?.longitude ?? -1}, camZoom=${camera?.zoom ?? -1})`
      );
    } catch (error) {
      Logger.warn(`${stage} state read failed (tag=${childTag}): ${JSON.stringify(error)}`);
    }
  }

  private buildMarkerSignature(
    raw: MarkerRawProps,
    customViewEnabled: boolean,
    customViewIcon: BitmapDescriptor | undefined
  ): string {
    const position = raw.position;
    const latitude = position
      ? readNumber(position.latitude, 0)
      : readNumber(raw.latitude, 0);
    const longitude = position
      ? readNumber(position.longitude, 0)
      : readNumber(raw.longitude, 0);
    const anchorX = raw.anchor ? readNumber(raw.anchor.x, 0.5) : 0.5;
    const anchorY = raw.anchor ? readNumber(raw.anchor.y, 1) : 1;
    const offsetX = raw.centerOffset ? readNumber(raw.centerOffset.x, 0) : 0;
    const offsetY = raw.centerOffset ? readNumber(raw.centerOffset.y, 0) : 0;
    const zIndex = raw.zIndex !== undefined ? readNumber(raw.zIndex, 1) : 1;
    const opacity = raw.opacity !== undefined ? readNumber(raw.opacity, 1) : 1;

    return JSON.stringify({
      latitude,
      longitude,
      title: raw.title ?? '',
      snippet: raw.snippet ?? '',
      pinColor: raw.pinColor ?? '',
      draggable: readBoolean(raw.draggable, false),
      flat: readBoolean(raw.flat, false),
      zIndex,
      opacity,
      anchorX,
      anchorY,
      offsetX,
      offsetY,
      icon: raw.icon ?? '',
      customViewEnabled,
      hasCustomViewIcon: customViewIcon !== undefined,
    });
  }

}

export class HarmonyOverlayRegistry {
  private static mapManagers: Map<number, HarmonyChildOverlayManager> = new Map();
  private static childToMapTag: Map<number, number> = new Map();

  static registerMapManager(mapTag: number, manager: HarmonyChildOverlayManager): void {
    HarmonyOverlayRegistry.mapManagers.set(mapTag, manager);
  }

  static unregisterMapManager(mapTag: number): void {
    HarmonyOverlayRegistry.mapManagers.delete(mapTag);

    const tagsToRemove: number[] = [];
    HarmonyOverlayRegistry.childToMapTag.forEach((value, key) => {
      if (value === mapTag) {
        tagsToRemove.push(key);
      }
    });

    for (let i = 0; i < tagsToRemove.length; i += 1) {
      HarmonyOverlayRegistry.childToMapTag.delete(tagsToRemove[i]);
    }
  }

  static bindChildTag(mapTag: number, childTag: number): void {
    HarmonyOverlayRegistry.childToMapTag.set(childTag, mapTag);
  }

  static unbindChildTag(childTag: number): void {
    HarmonyOverlayRegistry.childToMapTag.delete(childTag);
  }

  static isChildBoundToMap(mapTag: number, childTag: number): boolean {
    return HarmonyOverlayRegistry.childToMapTag.get(childTag) === mapTag;
  }

  static getManagerByChildTag(childTag: number): HarmonyChildOverlayManager | undefined {
    const mapTag = HarmonyOverlayRegistry.childToMapTag.get(childTag);
    if (mapTag === undefined) {
      return undefined;
    }
    return HarmonyOverlayRegistry.mapManagers.get(mapTag);
  }
}
