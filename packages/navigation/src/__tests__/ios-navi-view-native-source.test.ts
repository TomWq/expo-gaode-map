import fs from 'node:fs';
import path from 'node:path';

describe('iOS navigation view native source guards', () => {
  const naviViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../ios/ExpoGaodeMapNaviView.swift'),
    'utf8'
  );
  const naviViewModuleSource = fs.readFileSync(
    path.resolve(__dirname, '../../ios/ExpoGaodeMapNaviViewModule.swift'),
    'utf8'
  );

  it('maps carOverlayVisible to the drive view showCar property only', () => {
    expect(naviViewModuleSource).toContain('Prop("carOverlayVisible")');
    expect(naviViewModuleSource).toContain('view.carOverlayVisible = value');
    expect(naviViewSource).toContain('var carOverlayVisible: Bool = true');
    expect(naviViewSource).toContain('didSet { driveView?.showCar = carOverlayVisible }');
    expect(naviViewSource).toContain('driveView.showCar = carOverlayVisible');
    expect(naviViewSource).not.toContain('walkView?.showCar');
    expect(naviViewSource).not.toContain('rideView?.showCar');
  });
});
