import { BitmapDescriptor, BitmapDescriptorFactory } from '@amap/amap_lbs_map3d';
import { Descriptor, RNComponentContext, ViewBaseProps } from '@rnoh/react-native-openharmony';

import { HarmonyChildOverlayManager, HarmonyOverlayRegistry } from './internal/overlays';

export type MarkerViewDescriptor = Descriptor<'MarkerView', '', '', ViewBaseProps>;

@Component
export struct MarkerView {
  static NAME: string = 'MarkerView';

  ctx: RNComponentContext = {} as RNComponentContext;
  tag: number = -1;

  private unregisterDescriptorChangesListener?: () => void = undefined;
  private unregisterDescriptorMutationsListener?: () => void = undefined;
  private captureTag: number = -1;

  aboutToAppear(): void {
    this.syncMarkerState(false);

    this.unregisterDescriptorChangesListener = this.ctx.descriptorRegistry.subscribeToDescriptorChanges(
      this.tag,
      () => {
        this.syncMarkerState(true);
      }
    );

    this.unregisterDescriptorMutationsListener = this.ctx.descriptorRegistry.subscribeToDescriptorMutations(
      this.tag,
      () => {
        this.syncMarkerState(true);
      }
    );
  }

  aboutToDisappear(): void {
    this.unregisterDescriptorChangesListener?.();
    this.unregisterDescriptorChangesListener = undefined;
    this.unregisterDescriptorMutationsListener?.();
    this.unregisterDescriptorMutationsListener = undefined;

    const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
    manager?.removeOverlayByTag(this.tag);
  }

  private syncMarkerState(shouldApplyProps: boolean): void {
    const descriptor = this.ctx.descriptorRegistry.getDescriptor<MarkerViewDescriptor>(this.tag);
    if (!descriptor) {
      return;
    }

    const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
    if (!manager) {
      return;
    }

    const hasChildren = descriptor.childrenTags.length > 0;
    manager.updateMarkerCustomViewState(this.tag, hasChildren);
    if (shouldApplyProps) {
      manager.updateMarker(this.tag, descriptor.rawProps as ESObject);
    }
    if (!hasChildren) {
      return;
    }

    this.captureCustomMarkerIcon(manager);
  }

  private captureCustomMarkerIcon(manager: HarmonyChildOverlayManager): void {
    void this.captureCustomMarkerIconAsync(manager);
  }

  private async captureCustomMarkerIconAsync(manager: HarmonyChildOverlayManager): Promise<void> {
    let descriptor: BitmapDescriptor | undefined = undefined;
    try {
      this.captureTag = this.tag;
      descriptor = await BitmapDescriptorFactory.fromView(this.buildMarkerContent.bind(this));
    } catch {
      descriptor = undefined;
    }

    manager.updateMarkerCustomViewIcon(this.tag, descriptor);
  }

  @Builder
  private buildMarkerContent(): void {
    ContentSlot(this.ctx.getContentForTag(this.captureTag));
  }

  build() {
    ContentSlot(this.ctx.getContentForTag(this.tag));
  }
}
