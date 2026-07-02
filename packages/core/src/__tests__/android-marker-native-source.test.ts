import fs from 'fs';
import path from 'path';

describe('Android Marker native source guards', () => {
  const markerViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../android/src/main/java/expo/modules/gaodemap/overlays/MarkerView.kt'),
    'utf8'
  );

  it('refreshes custom marker bitmaps when cacheKey changes', () => {
    expect(markerViewSource).toContain('markCustomMarkerContentDirty(32)');
    expect(markerViewSource).not.toContain('scheduleMarkerIconUpdate(32)');
    expect(markerViewSource).toContain('invalidateCurrentSnapshotCache()');
  });

  it('does not cancel pending bitmap refreshes during transient detach', () => {
    expect(markerViewSource).toContain('private var pendingDetachRemovalTask: Runnable? = null');
    expect(markerViewSource).toContain('override fun onAttachedToWindow()');
    expect(markerViewSource).toContain('cancelPendingDetachRemoval()');
    expect(markerViewSource).not.toContain('mainHandler.removeCallbacksAndMessages(null)');
  });
});
