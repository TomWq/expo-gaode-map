import fs from 'fs';
import path from 'path';

describe('Navigation Android Marker native source guards', () => {
  const markerViewSource = fs.readFileSync(
    path.resolve(
      __dirname,
      '../../android/src/main/java/expo/modules/gaodemap/map/overlays/MarkerView.kt'
    ),
    'utf8'
  );
  const markerRendererPath = path.resolve(
    __dirname,
    '../../android/src/main/java/expo/modules/gaodemap/map/overlays/MarkerBitmapRenderer.kt'
  );
  const markerRendererSource = fs.existsSync(markerRendererPath)
    ? fs.readFileSync(markerRendererPath, 'utf8')
    : '';
  const markerModuleSource = fs.readFileSync(
    path.resolve(
      __dirname,
      '../../android/src/main/java/expo/modules/gaodemap/map/overlays/MarkerViewModule.kt'
    ),
    'utf8'
  );
  const mapViewSource = fs.readFileSync(
    path.resolve(
      __dirname,
      '../../android/src/main/java/expo/modules/gaodemap/map/ExpoGaodeMapView.kt'
    ),
    'utf8'
  );

  it('renders children through a stable snapshot request', () => {
    expect(markerRendererSource).toContain('internal data class MarkerBitmapSnapshot');
    expect(markerRendererSource).toContain('internal object MarkerBitmapRenderer');
    expect(markerRendererSource).toContain('fun resolveSnapshot(');
    expect(markerRendererSource).toContain('fun createBitmap(');
    expect(markerViewSource).toContain(
      'private fun createBitmapFromView(snapshot: MarkerBitmapSnapshot? = resolveMarkerBitmapSnapshot())'
    );
    expect(markerViewSource).toContain('MarkerBitmapRenderer.createBitmap(');
  });

  it('waits for one stable frame and drops superseded marker updates', () => {
    expect(markerViewSource).toContain('private var contentInvalidationGeneration: Long = 0');
    expect(markerViewSource).toContain(
      'private fun scheduleMarkerIconUpdateForStableGeneration(expectedGeneration: Long)'
    );
    expect(markerViewSource).toContain('postOnAnimation(settleTask)');
    expect(markerViewSource).toContain('postOnAnimation(renderTask)');
    expect(markerViewSource).toContain('if (scheduledGeneration != contentInvalidationGeneration)');
    expect(markerViewSource).toContain('markCustomMarkerContentDirty()');
    expect(markerViewSource).not.toContain('private fun scheduleMarkerIconUpdate(delayMs: Long = 16L)');
  });

  it('removes markers synchronously and keeps module destruction idempotent', () => {
    expect(markerViewSource).toContain('override fun onAttachedToWindow()');
    expect(markerViewSource).toContain('override fun onDetachedFromWindow()');
    expect(mapViewSource).not.toMatch(/postDelayed\(\{\s+child\.removeMarker\(\)/);
    const synchronousMarkerRemovals =
      mapViewSource.match(/if \(child is MarkerView\) \{\s+child\.removeMarker\(\)/g) ?? [];
    expect(synchronousMarkerRemovals).toHaveLength(2);
    expect(markerModuleSource).toContain('OnViewDestroys { view: MarkerView ->');
    expect(markerModuleSource).toContain('view.removeMarker()');
  });
});
