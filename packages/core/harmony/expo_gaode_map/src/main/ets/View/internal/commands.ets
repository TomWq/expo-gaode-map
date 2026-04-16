import { AMap, Point } from '@amap/amap_lbs_map3d';
import { RNComponentContext } from '@rnoh/react-native-openharmony';

import { EVENT_CHANNEL, ScreenPointLike } from './types';

export class CommandResultEmitter {
  private readonly ctx: RNComponentContext;
  private readonly tag: number;

  constructor(ctx: RNComponentContext, tag: number) {
    this.ctx = ctx;
    this.tag = tag;
  }

  emit(
    command: string,
    requestId: string,
    status: 'success' | 'error',
    latitude?: number,
    longitude?: number,
    snapshotPath?: string,
    message?: string
  ): void {
    this.ctx.rnInstance.emitComponentEvent(this.tag, EVENT_CHANNEL, {
      type: 'onCommandResult',
      command,
      requestId,
      status,
      latitude,
      longitude,
      snapshotPath,
      message,
    });
  }
}

export function handleGetLatLngCommand(
  aMap: AMap | undefined,
  args: ESObject[],
  emitter: CommandResultEmitter
): void {
  const requestId = String(args[0] ?? '');
  const point = (args[1] as ScreenPointLike | undefined) ?? {};

  if (!requestId) {
    return;
  }

  try {
    const projection = aMap?.getProjection();
    if (!projection) {
      emitter.emit('getLatLng', requestId, 'error', undefined, undefined, undefined, 'projection unavailable');
      return;
    }

    const geoPoint = projection.fromScreenLocationSync(
      new Point(Number(point.x ?? 0), Number(point.y ?? 0))
    );

    emitter.emit(
      'getLatLng',
      requestId,
      'success',
      Number(geoPoint?.latitude ?? 0),
      Number(geoPoint?.longitude ?? 0)
    );
  } catch {
    emitter.emit('getLatLng', requestId, 'error', undefined, undefined, undefined, 'getLatLng failed');
  }
}

export function handleTakeSnapshotCommand(
  aMap: AMap | undefined,
  args: ESObject[],
  emitter: CommandResultEmitter,
  saveSnapshot: (pixelMap: PixelMap) => Promise<string>
): void {
  const requestId = String(args[0] ?? '');
  if (!requestId) {
    return;
  }

  if (!aMap) {
    emitter.emit('takeSnapshot', requestId, 'error', undefined, undefined, undefined, 'map unavailable');
    return;
  }

  try {
    aMap.getMapScreenShot({
      onMapScreenShot: (pixelMap: PixelMap | undefined) => {
        if (!pixelMap) {
          emitter.emit('takeSnapshot', requestId, 'error', undefined, undefined, undefined, 'screenshot failed');
          return;
        }

        saveSnapshot(pixelMap)
          .then((snapshotPath) => {
            emitter.emit('takeSnapshot', requestId, 'success', undefined, undefined, snapshotPath);
          })
          .catch(() => {
            emitter.emit('takeSnapshot', requestId, 'error', undefined, undefined, undefined, 'save snapshot failed');
          });
      }
    });
  } catch {
    emitter.emit('takeSnapshot', requestId, 'error', undefined, undefined, undefined, 'takeSnapshot failed');
  }
}
