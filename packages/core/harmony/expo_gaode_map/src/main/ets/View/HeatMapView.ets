import { Descriptor, RNComponentContext, ViewBaseProps } from '@rnoh/react-native-openharmony';

import { HarmonyOverlayRegistry } from './internal/overlays';

export type HeatMapViewDescriptor = Descriptor<'HeatMapView', '', '', ViewBaseProps>;

@Component
export struct HeatMapView {
  static NAME: string = 'HeatMapView';

  ctx: RNComponentContext = {} as RNComponentContext;
  tag: number = -1;

  private unregisterDescriptorChangesListener?: () => void = undefined;

  aboutToAppear(): void {
    this.pushCurrentDescriptor();

    this.unregisterDescriptorChangesListener = this.ctx.descriptorRegistry.subscribeToDescriptorChanges(
      this.tag,
      () => {
        const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
        manager?.updateHeatMap(this.tag);
      }
    );
  }

  aboutToDisappear(): void {
    this.unregisterDescriptorChangesListener?.();
    this.unregisterDescriptorChangesListener = undefined;

    const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
    manager?.removeOverlayByTag(this.tag);
  }

  private pushCurrentDescriptor(): void {
    const descriptor = this.ctx.descriptorRegistry.getDescriptor<HeatMapViewDescriptor>(this.tag);
    if (!descriptor) {
      return;
    }

    const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
    if (!manager) {
      return;
    }

    manager.updateHeatMap(this.tag);
  }

  build() {
    ContentSlot(this.ctx.getContentForTag(this.tag));
  }
}
