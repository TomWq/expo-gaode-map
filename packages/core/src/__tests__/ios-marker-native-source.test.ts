import fs from 'fs';
import path from 'path';

describe('iOS Marker native source guards', () => {
  const markerViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../ios/overlays/MarkerView.swift'),
    'utf8'
  );

  it('guards children image refresh against stale annotation view reuse', () => {
    expect(markerViewSource).toContain(
      'private func currentChildrenAnnotationView() -> MAAnnotationView?'
    );
    expect(markerViewSource).toContain(
      'guard let targetView = self.currentChildrenAnnotationView() else'
    );
    expect(markerViewSource).toContain(
      'guard let annotationView = currentChildrenAnnotationView() else'
    );
  });

  it('does not cache the first children snapshot after cacheKey changes', () => {
    expect(markerViewSource).toContain('scheduleCacheKeyChildrenImageRefresh()');
    expect(markerViewSource).toContain(
      'refreshChildrenImageInPlace(invalidateChildrenCache: true, cacheImage: false)'
    );
    expect(markerViewSource).toContain('createImageFromSubviews(size: size, cacheImage: cacheImage)');
    expect(markerViewSource).toContain('if cacheImage {');
  });

  it('does not remove annotations immediately during transient detach', () => {
    expect(markerViewSource).toContain(
      'private var pendingAnnotationRemovalTask: DispatchWorkItem?'
    );
    expect(markerViewSource).toContain('scheduleAnnotationRemovalFromMap()');
    expect(markerViewSource).toContain('cancelPendingAnnotationRemoval()');
    expect(markerViewSource).toContain('override func didMoveToSuperview()');
    expect(markerViewSource).not.toContain(`if newSuperview == nil {
            removeAnnotationFromMap()
        }`);
  });
});
