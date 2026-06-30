import type { LatLng } from 'expo-gaode-map';

export type AIIntentSource = 'AI' | '本地';

export type AIRouteIntent = {
  originText: string;
  destinationText: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  routePreference: string;
  searchRadius: number;
  reason: string;
  tags: string[];
  source: AIIntentSource;
};

export type AINamedCoordinate = {
  text: string;
  address: string;
  coordinate: LatLng;
};

export type AIPlannedRoute = {
  origin: AINamedCoordinate;
  destination: AINamedCoordinate;
  points: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  tolls?: string;
  trafficLights?: string;
  summary: string;
};

export type AIRouteCandidate = {
  id: string;
  coordinate: LatLng;
  name: string;
  address: string;
  type: string;
  role: 'primary' | 'amenity';
  sourceKeyword: string;
  routeOffsetMeters: number;
  alongMeters: number;
  sampleDistance?: string;
  rating?: string;
  cost?: string;
  tel?: string;
  nearbyAmenities: string[];
  score: number;
  reason: string;
  aiReason?: string;
};

export type AIRouteSheetSnapshot = {
  query: string;
  status: string;
  intent: AIRouteIntent | null;
  route: AIPlannedRoute | null;
  summary: string;
  recommendationSource: AIIntentSource;
  candidates: AIRouteCandidate[];
  selectedCandidateId?: string;
  updatedAt: number;
};

export type AIRouteSheetCommand =
  | { type: 'selectCandidate'; candidateId: string }
  | { type: 'fitRoute' };

type Listener = (command: AIRouteSheetCommand) => void;

const listeners = new Set<Listener>();

let currentSnapshot: AIRouteSheetSnapshot | null = null;

export function setAIRouteSheetSnapshot(snapshot: AIRouteSheetSnapshot) {
  currentSnapshot = snapshot;
}

export function clearAIRouteSheetSnapshot() {
  currentSnapshot = null;
}

export function getAIRouteSheetSnapshot() {
  return currentSnapshot;
}

export function emitAIRouteSheetCommand(command: AIRouteSheetCommand) {
  listeners.forEach((listener) => listener(command));
}

export function subscribeAIRouteSheetCommand(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function formatAIRouteDistance(distance: number) {
  if (!Number.isFinite(distance)) {
    return '-';
  }
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }
  return `${(distance / 1000).toFixed(distance >= 10000 ? 0 : 1)} km`;
}

export function formatAIRouteDuration(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return '-';
  }
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatAIRouteRating(rating?: string) {
  if (!rating || rating === '[]') {
    return '';
  }
  return `${rating} 分`;
}

export function formatAIRouteCost(cost?: string) {
  if (!cost || cost === '[]') {
    return '';
  }
  return `人均 ${cost}`;
}
