import {
  AMap,
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
import { RNComponentContext } from '@rnoh/react-native-openharmony';

import Logger from '../../Logger';
import {
  HarmonyCircleOverlay,
  HarmonyMarkerOverlay,
  HarmonyPolygonOverlay,
  HarmonyPolylineOverlay,
  OverlayLatLngLike,
} from './types';
import { parseColor } from './helpers';

function toLatLng(point: OverlayLatLngLike): LatLng {
  return new LatLng(Number(point.latitude ?? 0), Number(point.longitude ?? 0));
}

function toLatLngList(points: OverlayLatLngLike[]): LatLng[] {
  const result: LatLng[] = [];
  for (let i = 0; i < points.length; i += 1) {
    result.push(toLatLng(points[i]));
  }
  return result;
}

export class HarmonyOverlayManager {
  private readonly ctx: RNComponentContext;
  private markerMap: Map<string, string> = new Map();
  private polylineMap: Map<string, string> = new Map();
  private markers: Marker[] = [];
  private polylines: Polyline[] = [];
  private polygons: Polygon[] = [];
  private circles: Circle[] = [];

  constructor(ctx: RNComponentContext) {
    this.ctx = ctx;
  }

  clearAll(): void {
    for (let i = 0; i < this.markers.length; i += 1) {
      try {
        this.markers[i].remove();
      } catch (error) {
        Logger.warn(`remove marker failed: ${JSON.stringify(error)}`);
      }
    }
    for (let i = 0; i < this.polylines.length; i += 1) {
      try {
        this.polylines[i].remove();
      } catch (error) {
        Logger.warn(`remove polyline failed: ${JSON.stringify(error)}`);
      }
    }
    for (let i = 0; i < this.polygons.length; i += 1) {
      try {
        this.polygons[i].remove();
      } catch (error) {
        Logger.warn(`remove polygon failed: ${JSON.stringify(error)}`);
      }
    }
    for (let i = 0; i < this.circles.length; i += 1) {
      try {
        this.circles[i].remove();
      } catch (error) {
        Logger.warn(`remove circle failed: ${JSON.stringify(error)}`);
      }
    }

    this.markerMap.clear();
    this.polylineMap.clear();
    this.markers = [];
    this.polylines = [];
    this.polygons = [];
    this.circles = [];
  }

  applyAll(
    aMap: AMap,
    markers: HarmonyMarkerOverlay[],
    polylines: HarmonyPolylineOverlay[],
    polygons: HarmonyPolygonOverlay[],
    circles: HarmonyCircleOverlay[],
  ): void {
    this.clearAll();
    this.applyMarkers(aMap, markers);
    this.applyPolylines(aMap, polylines);
    this.applyPolygons(aMap, polygons);
    this.applyCircles(aMap, circles);
  }

  resolveMarkerOverlayId(marker: Marker): string | undefined {
    const markerId = marker.getId();
    return this.markerMap.get(markerId);
  }

  resolvePolylineOverlayId(polyline: Polyline): string | undefined {
    const polylineId = polyline.getId();
    return this.polylineMap.get(polylineId);
  }

  private applyMarkers(aMap: AMap, descriptors: HarmonyMarkerOverlay[]): void {
    for (let i = 0; i < descriptors.length; i += 1) {
      const descriptor = descriptors[i];
      const options = new MarkerOptions();
      options.setPosition(new LatLng(descriptor.latitude, descriptor.longitude));

      if (descriptor.title !== undefined) {
        options.setTitle(descriptor.title);
      }
      if (descriptor.snippet !== undefined) {
        options.setSnippet(descriptor.snippet);
      }
      if (descriptor.draggable !== undefined) {
        options.setDraggable(descriptor.draggable);
      }
      if (descriptor.flat !== undefined) {
        options.setFlat(descriptor.flat);
      }
      if (descriptor.zIndex !== undefined) {
        options.setZIndex(descriptor.zIndex);
      }
      if (descriptor.anchorX !== undefined || descriptor.anchorY !== undefined) {
        options.setAnchor(descriptor.anchorX ?? 0.5, descriptor.anchorY ?? 1);
      }
      if (descriptor.alpha !== undefined) {
        options.setAlpha(descriptor.alpha);
      }

      this.applyMarkerIcon(options, descriptor.icon);

      const marker = aMap.addMarker(options);
      if (!marker) {
        continue;
      }

      this.markers.push(marker);
      this.markerMap.set(marker.getId(), descriptor.id);
    }
  }

  private applyMarkerIcon(options: MarkerOptions, iconPath: string | undefined): void {
    if (!iconPath) {
      return;
    }

    if (iconPath.startsWith('http://') || iconPath.startsWith('https://') || iconPath.startsWith('file://')) {
      Logger.warn(`Marker icon only supports rawfile/asset path on Harmony, ignore: ${iconPath}`);
      return;
    }

    try {
      const uiContext = this.ctx.uiAbilityContext;
      if (!uiContext) {
        return;
      }

      const rawIcon = BitmapDescriptorFactory.fromRawfilePathSync(uiContext, iconPath);
      if (rawIcon) {
        options.setIcon(rawIcon);
        return;
      }

      const assetIcon = BitmapDescriptorFactory.fromAsset(iconPath);
      if (assetIcon) {
        options.setIcon(assetIcon);
      }
    } catch (error) {
      Logger.warn(`create Marker icon failed: ${JSON.stringify(error)}`);
    }
  }

  private applyPolylines(aMap: AMap, descriptors: HarmonyPolylineOverlay[]): void {
    for (let i = 0; i < descriptors.length; i += 1) {
      const descriptor = descriptors[i];
      const options = new PolylineOptions();
      const points = toLatLngList(descriptor.points);
      if (points.length > 0) {
        options.add(...points);
      }

      if (descriptor.strokeWidth !== undefined) {
        options.setWidth(descriptor.strokeWidth);
      }
      const strokeColor = parseColor(descriptor.strokeColor);
      if (strokeColor !== undefined) {
        options.setColor(strokeColor);
      }
      if (descriptor.zIndex !== undefined) {
        options.setZIndex(descriptor.zIndex);
      }
      if (descriptor.gradient !== undefined) {
        options.setGradient(descriptor.gradient);
      }
      if (descriptor.geodesic !== undefined) {
        options.setGeodesic(descriptor.geodesic);
      }
      if (descriptor.dotted !== undefined) {
        options.setDottedLine(descriptor.dotted);
      }

      if (descriptor.colors && descriptor.colors.length > 0) {
        const colors: number[] = [];
        for (let colorIndex = 0; colorIndex < descriptor.colors.length; colorIndex += 1) {
          const parsed = parseColor(descriptor.colors[colorIndex]);
          if (parsed !== undefined) {
            colors.push(parsed);
          }
        }
        if (colors.length > 0) {
          options.setColorValues(new Int32Array(colors));
        }
      }

      const polyline = aMap.addPolyline(options);
      if (!polyline) {
        continue;
      }
      this.polylines.push(polyline);
      this.polylineMap.set(polyline.getId(), descriptor.id);
    }
  }

  private applyPolygons(aMap: AMap, descriptors: HarmonyPolygonOverlay[]): void {
    for (let i = 0; i < descriptors.length; i += 1) {
      const descriptor = descriptors[i];
      const rings = descriptor.rings;
      if (rings.length === 0) {
        continue;
      }

      const options = new PolygonOptions();
      const outer = toLatLngList(rings[0]);
      for (let pointIndex = 0; pointIndex < outer.length; pointIndex += 1) {
        options.add(outer[pointIndex]);
      }

      if (rings.length > 1) {
        const holes: PolygonHoleOptions[] = [];
        for (let ringIndex = 1; ringIndex < rings.length; ringIndex += 1) {
          const holePoints = toLatLngList(rings[ringIndex]);
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

      if (descriptor.strokeWidth !== undefined) {
        options.setStrokeWidth(descriptor.strokeWidth);
      }
      const strokeColor = parseColor(descriptor.strokeColor);
      if (strokeColor !== undefined) {
        options.setStrokeColor(strokeColor);
      }
      const fillColor = parseColor(descriptor.fillColor);
      if (fillColor !== undefined) {
        options.setFillColor(fillColor);
      }
      if (descriptor.zIndex !== undefined) {
        options.setZIndex(descriptor.zIndex);
      }

      const polygon = aMap.addPolygon(options);
      if (polygon) {
        this.polygons.push(polygon);
      }
    }
  }

  private applyCircles(aMap: AMap, descriptors: HarmonyCircleOverlay[]): void {
    for (let i = 0; i < descriptors.length; i += 1) {
      const descriptor = descriptors[i];
      const options = new CircleOptions();
      options.setCenter(toLatLng(descriptor.center));
      options.setRadius(descriptor.radius);

      if (descriptor.strokeWidth !== undefined) {
        options.setStrokeWidth(descriptor.strokeWidth);
      }
      const strokeColor = parseColor(descriptor.strokeColor);
      if (strokeColor !== undefined) {
        options.setStrokeColor(strokeColor);
      }
      const fillColor = parseColor(descriptor.fillColor);
      if (fillColor !== undefined) {
        options.setFillColor(fillColor);
      }
      if (descriptor.zIndex !== undefined) {
        options.setZIndex(descriptor.zIndex);
      }

      const circle = aMap.addCircle(options);
      if (circle) {
        this.circles.push(circle);
      }
    }
  }
}
