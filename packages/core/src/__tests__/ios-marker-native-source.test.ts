import fs from 'fs';
import path from 'path';

describe('iOS Marker native source guards', () => {
  const markerViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../ios/overlays/MarkerView.swift'),
    'utf8'
  );
  const mapViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../ios/ExpoGaodeMapView.swift'),
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

  it('coalesces cacheKey changes into one children snapshot refresh', () => {
    expect(markerViewSource).toContain(
      'scheduleChildrenImageRefresh(invalidateChildrenCache: true)'
    );
    expect(markerViewSource).toContain('createImageFromSubviews(size: size, cacheImage: cacheImage)');
    expect(markerViewSource).toContain('if cacheImage {');
    expect(markerViewSource).not.toContain('scheduleCacheKeyChildrenImageRefresh()');
    expect(markerViewSource).not.toContain('pendingCacheKeyRefreshTask');
    expect(markerViewSource).not.toContain('cacheKeyRefreshGeneration');
  });

  it('applies children snapshots atomically without implicit animation', () => {
    expect(markerViewSource).toContain('import QuartzCore');
    expect(markerViewSource).toContain('CATransaction.setDisableActions(true)');
    expect(markerViewSource).toContain('UIView.performWithoutAnimation');
    expect(markerViewSource).not.toContain('RunLoop.current.run');
  });

  it('refreshes a mounted children marker after a committed native layout', () => {
    expect(markerViewSource).toContain('override func layoutSubviews()');
    expect(markerViewSource).toContain(
      'scheduleChildrenImageRefresh(invalidateChildrenCache: true)'
    );
  });

  it('cleans up a physical detach on the next queue turn without a millisecond timeout', () => {
    expect(markerViewSource).toContain('private var pendingDetachCheckTask: DispatchWorkItem?');
    expect(markerViewSource).toContain('scheduleDetachCheck()');
    expect(markerViewSource).toContain('guard self.superview == nil else { return }');
    expect(markerViewSource).toContain('DispatchQueue.main.async(execute: task)');
    expect(mapViewSource).toContain('markerView.onPermanentDetach =');
  });

  it('does not use time-based guesses for marker teardown', () => {
    expect(markerViewSource).not.toContain('pendingAnnotationRemovalTask');
    expect(markerViewSource).not.toContain('scheduleAnnotationRemovalFromMap()');
    expect(markerViewSource).not.toContain('DispatchQueue.main.sync');
    expect(mapViewSource).not.toContain('pendingMarkerOverlayUnregisterTasks');
    expect(mapViewSource).not.toContain('scheduleMarkerOverlayUnregister(markerView)');
    expect(mapViewSource).toMatch(
      /if let markerView = subview as\? MarkerView \{[\s\S]*?unregisterOverlayView\(markerView\)/
    );
  });
});
