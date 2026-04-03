import React from 'react';
import { render } from '@testing-library/react-native';

const mockNativeMethods: Record<string, any> = {
  moveCamera: jest.fn(() => Promise.resolve()),
  getLatLng: jest.fn(() => Promise.resolve({ latitude: 39.9, longitude: 116.4 })),
  setCenter: jest.fn(() => Promise.resolve()),
  setZoom: jest.fn(() => Promise.resolve()),
  getCameraPosition: jest.fn(() => Promise.resolve({ zoom: 10 })),
  takeSnapshot: jest.fn(() => Promise.resolve('snapshot')),
};

const mockNativeState: { props?: any } = {};

jest.mock('../utils/lazyNativeViewManager', () => {
  const React = require('react');
  const MockNativeView = React.forwardRef((props: any, ref: React.Ref<any>) => {
    mockNativeState.props = props;
    React.useImperativeHandle(ref, () => mockNativeMethods);
    return React.createElement(React.Fragment, null, props.children);
  });

  return {
    createLazyNativeViewManager: jest.fn(() => () => MockNativeView),
  };
});

import ExpoGaodeMapView from '../ExpoGaodeMapView';
import { MapUI } from '../components/MapUI';

describe('ExpoGaodeMapView 行为测试', () => {
  beforeEach(() => {
    Object.values(mockNativeMethods).forEach((value) => {
      if (typeof value?.mockClear === 'function') {
        value.mockClear();
      }
    });
    mockNativeMethods.takeSnapshot = jest.fn(() => Promise.resolve('snapshot'));
    mockNativeState.props = undefined;
  });

  it('应该将 MapUI 子节点与原生覆盖物分离', () => {
    render(
      <ExpoGaodeMapView>
        <MapUI>
          <></>
        </MapUI>
        <></>
      </ExpoGaodeMapView>
    );

    expect(React.Children.count(mockNativeState.props.children)).toBe(1);
  });

  it('ref API 应该调用原生方法并归一化参数', async () => {
    const ref = React.createRef<any>();

    render(<ExpoGaodeMapView ref={ref} />);

    await ref.current.moveCamera({ target: [116.4, 39.9], zoom: 12 });
    await ref.current.setCenter([116.41, 39.91], true);
    await ref.current.setZoom(15, true);
    await ref.current.getLatLng({ x: 1, y: 2 });
    await ref.current.getCameraPosition();
    await ref.current.takeSnapshot();
    await ref.current.fitToCoordinates(
      [
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.91, longitude: 116.42 },
      ],
      { duration: 500 }
    );

    expect(mockNativeMethods.moveCamera).toHaveBeenCalledWith(
      { target: { latitude: 39.9, longitude: 116.4 }, zoom: 12 },
      0
    );
    expect(mockNativeMethods.setCenter).toHaveBeenCalledWith(
      { latitude: 39.91, longitude: 116.41 },
      true
    );
    expect(mockNativeMethods.setZoom).toHaveBeenCalledWith(15, true);
    expect(mockNativeMethods.getLatLng).toHaveBeenCalledWith({ x: 1, y: 2 });
    expect(mockNativeMethods.getCameraPosition).toHaveBeenCalled();
    expect(mockNativeMethods.takeSnapshot).toHaveBeenCalled();
    expect(mockNativeMethods.moveCamera).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          latitude: 39.905,
          longitude: 116.41,
        }),
      }),
      500
    );
  });

  it('原生方法缺失时应包装为友好错误', () => {
    const ref = React.createRef<any>();
    mockNativeMethods.takeSnapshot = undefined;

    render(<ExpoGaodeMapView ref={ref} />);

    expect(() => ref.current.takeSnapshot()).toThrow('NATIVE_MODULE_UNAVAILABLE');
  });
});
