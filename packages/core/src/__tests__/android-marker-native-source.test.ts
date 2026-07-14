import fs from 'fs';
import path from 'path';

describe('Android Marker native source guards', () => {
  const markerViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../android/src/main/java/expo/modules/gaodemap/overlays/MarkerView.kt'),
    'utf8'
  );
  const markerModuleSource = fs.readFileSync(
    path.resolve(
      __dirname,
      '../../android/src/main/java/expo/modules/gaodemap/overlays/MarkerViewModule.kt'
    ),
    'utf8'
  );
  const mapViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../android/src/main/java/expo/modules/gaodemap/ExpoGaodeMapView.kt'),
    'utf8'
  );

  it('refreshes custom marker bitmaps after content settles for one frame', () => {
    expect(markerViewSource).toContain('private var contentInvalidationGeneration: Long = 0');
    expect(markerViewSource).toContain(
      'private fun scheduleMarkerIconUpdateForStableGeneration(expectedGeneration: Long)'
    );
    expect(markerViewSource).toContain('postOnAnimation(settleTask)');
    expect(markerViewSource).toContain('postOnAnimation(renderTask)');
    expect(markerViewSource).toContain('if (scheduledGeneration != contentInvalidationGeneration)');
    expect(markerViewSource).toContain('markCustomMarkerContentDirty()');
    expect(markerViewSource).toContain('invalidateCurrentSnapshotCache()');
    expect(markerViewSource).not.toContain('scheduleMarkerIconUpdate(');
  });

  it('uses authoritative destruction instead of delayed window-detach cleanup', () => {
    expect(markerViewSource).toContain('override fun onAttachedToWindow()');
    expect(markerViewSource).toContain('override fun onDetachedFromWindow()');
    expect(markerViewSource).not.toContain('pendingDetachRemovalTask');
    expect(markerViewSource).not.toContain('mainHandler.postDelayed(task, 500)');
    expect(markerModuleSource).toContain('OnViewDestroys { view: MarkerView ->');
    expect(markerModuleSource).toContain('view.removeMarker()');
  });

  it('removes markers synchronously when the parent removes the native view', () => {
    expect(mapViewSource).not.toContain('pendingMarkerRemovalTasks');
    expect(mapViewSource).not.toContain('scheduleMarkerRemoval(');
    const synchronousMarkerRemovals =
      mapViewSource.match(/if \(child is MarkerView\) \{\s+child\.removeMarker\(\)/g) ?? [];
    expect(synchronousMarkerRemovals).toHaveLength(2);
  });
});
