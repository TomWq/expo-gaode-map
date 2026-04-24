export type TripSheetCommand =
  | { type: 'selectStop'; dayIndex: number; stopId: string }
  | { type: 'fitAllDays' }
  | { type: 'fitActiveDay' }
  | { type: 'focusActiveStop' };

type Listener = (command: TripSheetCommand) => void;

const listeners = new Set<Listener>();

export function emitTripSheetCommand(command: TripSheetCommand) {
  listeners.forEach((listener) => listener(command));
}

export function subscribeTripSheetCommand(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
