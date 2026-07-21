import fs from 'node:fs';
import path from 'node:path';

describe('Navigation iOS Marker native source guards', () => {
  const markerViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../ios/map/overlays/MarkerView.swift'),
    'utf8'
  );
  const mapViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../ios/map/ExpoGaodeMapView.swift'),
    'utf8'
  );

  it('uses one immutable request and reuses explicit cacheKey snapshots', () => {
    expect(markerViewSource).toContain('private struct ChildrenSnapshotRequest');
    expect(markerViewSource).toContain('private var lastRenderedChildrenCacheKey: String?');
    expect(markerViewSource).toContain('private func makeChildrenSnapshotRequest(');
    expect(markerViewSource.match(/private func makeChildrenSnapshotRequest\(/g)).toHaveLength(1);
    expect(markerViewSource).toContain(
      'private func createImageFromSubviews(request: ChildrenSnapshotRequest'
    );
    expect(markerViewSource).toContain(
      'request.cacheKey == lastRenderedChildrenCacheKey'
    );
    expect(markerViewSource).toContain('lastRenderedChildrenCacheKey = request.cacheKey');
  });

  it('coalesces mounted children refreshes and drops superseded work', () => {
    expect(markerViewSource).toContain('override func layoutSubviews()');
    expect(markerViewSource).toContain(
      'scheduleChildrenImageRefresh(invalidateChildrenCache: !hasExplicitChildrenCacheKey)'
    );
    expect(markerViewSource).toContain('private var childrenRefreshGeneration: UInt = 0');
    expect(markerViewSource).toContain('private func cancelPendingSubviewRefresh()');
    expect(markerViewSource).toContain('childrenRefreshGeneration &+= 1');
    expect(markerViewSource).toContain(
      'self.childrenRefreshGeneration == scheduledGeneration else {'
    );
  });

  it('applies snapshots atomically without time-based rendering guesses', () => {
    expect(markerViewSource).toContain('import QuartzCore');
    expect(markerViewSource).toContain('CATransaction.setDisableActions(true)');
    expect(markerViewSource).toContain('UIView.performWithoutAnimation');
    expect(markerViewSource).not.toContain('RunLoop.current.run');
    expect(markerViewSource).not.toContain('asyncAfter(deadline: .now() + 0.5)');
  });

  it('unregisters a physically detached marker on the next queue turn', () => {
    expect(markerViewSource).toContain('private var pendingDetachCheckTask: DispatchWorkItem?');
    expect(markerViewSource).toContain('guard self.superview == nil else { return }');
    expect(markerViewSource).toContain('DispatchQueue.main.async(execute: task)');
    expect(mapViewSource).toContain('markerView.onPermanentDetach =');
    expect(mapViewSource).toMatch(
      /if let markerView = subview as\? MarkerView \{[\s\S]*?unregisterOverlayView\(markerView\)/
    );
  });
});
