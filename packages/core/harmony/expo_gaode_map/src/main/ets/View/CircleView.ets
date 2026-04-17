import { Descriptor, RNComponentContext, ViewBaseProps } from '@rnoh/react-native-openharmony';

import { HarmonyOverlayRegistry } from './internal/overlays';

export type CircleViewDescriptor = Descriptor<'CircleView', '', '', ViewBaseProps>;

@Component
export struct CircleView {
  static NAME: string = 'CircleView';

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
        manager.updateCircle(this.tag, nextDescriptor.rawProps as ESObject);
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
    const descriptor = this.ctx.descriptorRegistry.getDescriptor<CircleViewDescriptor>(this.tag);
    if (!descriptor) {
      return;
    }

    const manager = HarmonyOverlayRegistry.getManagerByChildTag(this.tag);
    if (!manager) {
      return;
    }

    manager.updateCircle(this.tag, descriptor.rawProps as ESObject);
  }

  build() {
    ContentSlot(this.ctx.getContentForTag(this.tag));
  }
}
