import { Descriptor, RNComponentContext, ViewBaseProps } from '@rnoh/react-native-openharmony';

import { HarmonyOverlayRegistry } from './internal/overlays';

export type PolylineViewDescriptor = Descriptor<'PolylineView', '', '', ViewBaseProps>;

@Component
export struct PolylineView {
  static NAME: string = 'PolylineView';

  ctx: RNComponentContext = {} as RNComponentContext;
  tag: number = -1;

  private unregisterDescriptorChangesListener?: () => void = undefined;

  aboutToAppear(): void {
    this.pushCurrentDescriptor();

    this.unregisterDescriptorChangesListener = this.ctx.descriptorRegistry.subscribeToDescriptorChanges(
      this.tag,
      (nextDescriptor) => {
        const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
        if (!manager) {
          return;
        }
        manager.updatePolyline(this.tag, nextDescriptor.rawProps as ESObject);
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
    const descriptor = this.ctx.descriptorRegistry.getDescriptor<PolylineViewDescriptor>(this.tag);
    if (!descriptor) {
      return;
    }

    const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
    if (!manager) {
      return;
    }

    manager.updatePolyline(this.tag, descriptor.rawProps as ESObject);
  }

  build() {
    ContentSlot(this.ctx.getContentForTag(this.tag));
  }
}
