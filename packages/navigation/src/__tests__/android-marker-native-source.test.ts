import fs from 'fs';
import path from 'path';

describe('Navigation Android Marker native source guards', () => {
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

  it('removes markers synchronously and keeps module destruction idempotent', () => {
    expect(mapViewSource).not.toMatch(/postDelayed\(\{\s+child\.removeMarker\(\)/);
    const synchronousMarkerRemovals =
      mapViewSource.match(/if \(child is MarkerView\) \{\s+child\.removeMarker\(\)/g) ?? [];
    expect(synchronousMarkerRemovals).toHaveLength(2);
    expect(markerModuleSource).toContain('OnViewDestroys { view: MarkerView ->');
    expect(markerModuleSource).toContain('view.removeMarker()');
  });
});
