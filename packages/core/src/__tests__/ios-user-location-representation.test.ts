import fs from 'node:fs';
import path from 'node:path';

type IosMapSources = {
  name: string;
  mapViewSource: string;
  uiManagerSource: string;
};

function readSource(relativePath: string) {
  return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

const iosSources: IosMapSources[] = [
  {
    name: 'core',
    mapViewSource: readSource('../../ios/ExpoGaodeMapView.swift'),
    uiManagerSource: readSource('../../ios/managers/UIManager.swift'),
  },
  {
    name: 'navigation',
    mapViewSource: readSource('../../../navigation/ios/map/ExpoGaodeMapView.swift'),
    uiManagerSource: readSource('../../../navigation/ios/map/managers/UIManager.swift'),
  },
];

describe('iOS userLocationRepresentation native handling', () => {
  it.each(iosSources)('replays cached user location style for $name after map setup and location updates', ({ mapViewSource }) => {
    expect(mapViewSource).toMatch(
      /func applyProps\(\)[\s\S]*uiManager\.setShowsUserLocation\(showsUserLocation, followUser: followUserLocation\)[\s\S]*applyUserLocationStyle\(\)/
    );
    expect(mapViewSource).toMatch(
      /func mapViewDidFinishLoadingMap\(_ mapView: MAMapView\)[\s\S]*applyUserLocationStyle\(\)/
    );
    expect(mapViewSource).toMatch(
      /func mapView\(_ mapView: MAMapView, didUpdate userLocation: MAUserLocation, updatingLocation: Bool\)[\s\S]*applyUserLocationStyle\(\)/
    );
  });

  it.each(iosSources)('enables followWithHeading when $name requests a heading indicator', ({ uiManagerSource }) => {
    expect(uiManagerSource).toMatch(
      /if let showsHeadingIndicator = config\["showsHeadingIndicator"\] as\? Bool \{[\s\S]*representation\.showsHeadingIndicator = showsHeadingIndicator[\s\S]*if showsHeadingIndicator \{[\s\S]*mapView\.userTrackingMode = \.followWithHeading/
    );
  });

  it.each(iosSources)('uses a custom MAUserLocation annotation view when $name provides an image', ({ mapViewSource }) => {
    expect(mapViewSource).toMatch(
      /private func getUserLocationAnnotationView\(for mapView: MAMapView, annotation: MAAnnotation\) -> MAAnnotationView\? \{[\s\S]*let imagePath = config\["image"\] as\? String/
    );
    expect(mapViewSource).toMatch(
      /if annotation\.isKind\(of: MAUserLocation\.self\) \{[\s\S]*return getUserLocationAnnotationView\(for: mapView, annotation: annotation\)/
    );
    expect(mapViewSource).toMatch(
      /MAAnnotationView\(annotation: annotation, reuseIdentifier: reuseId\)/
    );
  });
});
