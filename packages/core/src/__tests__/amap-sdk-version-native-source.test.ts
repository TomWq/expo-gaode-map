import fs from 'node:fs';
import path from 'node:path';

function readSource(relativePath: string) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

const androidBuildGradle = readSource('../../android/build.gradle');
const iosPodspec = readSource('../../ios/ExpoGaodeMap.podspec');

describe('AMap native SDK versions', () => {
  it('pins the Android map, location, and search bundle to 11.2.000', () => {
    expect(androidBuildGradle).toContain(
      'com.amap.api:3dmap-location-search:11.2.000_loc11.2.000_sea9.8.0'
    );
  });

  it('pins the iOS map SDK to 11.2.000', () => {
    expect(iosPodspec).toContain("s.dependency 'AMap3DMap', '= 11.2.000'");
  });
});
