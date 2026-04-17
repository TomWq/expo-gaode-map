
export interface IndoorMapFeature {
  showIndoorMap?: (enabled: boolean) => void;
}

export interface UserLocationRepresentation {
  showsAccuracyRing?: boolean;
  showsHeadingIndicator?: boolean;
  fillColor?: string | number;
  strokeColor?: string | number;
  lineWidth?: number;
  enablePulseAnimation?: boolean;
  locationDotBgColor?: string | number;
  locationDotFillColor?: string | number;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  showMyLocation?: boolean;
  anchorU?: number;
  anchorV?: number;
  locationType?: string;
}

export interface CustomMapStyleProps {
  styleId?: string;
  styleDataPath?: string;
  extraStyleDataPath?: string;
}

export interface GeoLocationLike {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface OverlayLatLngLike {
  latitude?: number;
  longitude?: number;
}

export interface HarmonyMarkerOverlay {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  snippet?: string;
  draggable?: boolean;
  flat?: boolean;
  zIndex?: number;
  anchorX?: number;
  anchorY?: number;
  alpha?: number;
  icon?: string;
}

export interface HarmonyPolylineOverlay {
  id: string;
  points: OverlayLatLngLike[];
  strokeWidth?: number;
  strokeColor?: string | number;
  zIndex?: number;
  colors?: Array<string | number>;
  gradient?: boolean;
  geodesic?: boolean;
  dotted?: boolean;
}

export interface HarmonyPolygonOverlay {
  id: string;
  rings: OverlayLatLngLike[][];
  strokeWidth?: number;
  strokeColor?: string | number;
  fillColor?: string | number;
  zIndex?: number;
}

export interface HarmonyCircleOverlay {
  id: string;
  center: OverlayLatLngLike;
  radius: number;
  strokeWidth?: number;
  strokeColor?: string | number;
  fillColor?: string | number;
  zIndex?: number;
}

export interface ScreenPointLike {
  x?: number;
  y?: number;
}

export interface PrivacySnapshot {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
}

export const EVENT_CHANNEL = 'ExpoGaodeMapView';
