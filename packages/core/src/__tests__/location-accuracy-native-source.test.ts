import fs from 'node:fs';
import path from 'node:path';

function readSource(relativePath: string) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

const androidPermissionSource = readSource(
  '../../android/src/main/java/expo/modules/gaodemap/utils/PermissionHelper.kt'
);
const androidModuleSource = readSource(
  '../../android/src/main/java/expo/modules/gaodemap/ExpoGaodeMapModule.kt'
);
const iosLocationSource = readSource('../../ios/modules/LocationManager.swift');
const iosMapManagerSource = readSource('../../ios/managers/UIManager.swift');
const iosMapViewSource = readSource('../../ios/ExpoGaodeMapView.swift');
const iosModuleSource = readSource('../../ios/ExpoGaodeMapModule.swift');

describe('native reduced-accuracy location support', () => {
  it('accepts Android approximate location as foreground authorization', () => {
    expect(androidPermissionSource).toContain(
      'val granted = fineGranted || coarseGranted'
    );
    expect(androidPermissionSource).not.toContain(
      'val granted = fineGranted && coarseGranted'
    );
    expect(androidModuleSource).toContain('foregroundStatus.coarseLocation -> "reduced"');
  });

  it('uses reduced accuracy on iOS without requiring temporary precise authorization', () => {
    expect(iosLocationSource).toContain('manager.locationAccuracyMode = .reduceAccuracy');
    expect(iosMapManagerSource).toContain('kCLLocationAccuracyReduced');
    expect(iosMapManagerSource).toContain(
      'CLLocationManager().accuracyAuthorization == .reducedAccuracy'
    );
    expect(iosModuleSource).toContain('"accuracyAuthorization": accuracyAuthorization');
  });

  it('keeps iOS location failures observable', () => {
    expect(iosLocationSource).toContain('iOS continuous location failed');
    expect(iosMapViewSource).toContain('didFailToLocateUserWithError');
  });
});
