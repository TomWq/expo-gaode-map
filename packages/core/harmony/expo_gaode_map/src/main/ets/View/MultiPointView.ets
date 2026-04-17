import { Descriptor, RNComponentContext, ViewBaseProps } from '@rnoh/react-native-openharmony';

import { HarmonyOverlayRegistry } from './internal/overlays';

export type MultiPointViewDescriptor = Descriptor<'MultiPointView', '', '', ViewBaseProps>;

@Component
export struct MultiPointView {
  static NAME: string = 'MultiPointView';

  ctx: RNComponentContext = {} as RNComponentContext;
  tag: number = -1;

  private unregisterDescriptorChangesListener?: () => void = undefined;

  aboutToAppear(): void {
    this.pushCurrentDescriptor();

    this.unregisterDescriptorChangesListener = this.ctx.descriptorRegistry.subscribeToDescriptorChanges(
      this.tag,
      () => {
        const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
        manager?.updateMultiPoint(this.tag);
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
    const descriptor = this.ctx.descriptorRegistry.getDescriptor<MultiPointViewDescriptor>(this.tag);
    if (!descriptor) {
      return;
    }

    const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
    if (!manager) {
      return;
    }

    manager.updateMultiPoint(this.tag);
  }

  build() {
    ContentSlot(this.ctx.getContentForTag(this.tag));
  }
}
