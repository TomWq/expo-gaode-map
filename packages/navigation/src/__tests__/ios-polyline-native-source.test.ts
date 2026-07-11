import fs from 'node:fs';
import path from 'node:path';

describe('iOS Polyline native source guards', () => {
  const polylineViewSource = fs.readFileSync(
    path.resolve(__dirname, '../../ios/map/overlays/PolylineView.swift'),
    'utf8'
  );

  it('applies the dotted prop when creating the renderer', () => {
    const getRendererSource = polylineViewSource.match(
      /func getRenderer\(\) -> MAOverlayRenderer \{[\s\S]*?return renderer!\n    \}/
    )?.[0];

    expect(getRendererSource).toContain(
      'renderer?.lineDashType = isDotted ? kMALineDashTypeSquare : kMALineDashTypeNone'
    );
  });
});
