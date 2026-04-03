import React from 'react';
import { render } from '@testing-library/react-native';

import { MapContext, useMap } from '../MapContext';

describe('MapContext', () => {
  it('在 Provider 外使用 useMap 应抛出明确错误', () => {
    const Consumer = () => {
      useMap();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow('无法调用 useMap：地图视图尚未初始化');
  });

  it('在 Provider 内使用 useMap 应返回上下文实例', () => {
    const mapRef = {
      moveCamera: jest.fn(),
      getLatLng: jest.fn(),
      setCenter: jest.fn(),
      setZoom: jest.fn(),
      getCameraPosition: jest.fn(),
      takeSnapshot: jest.fn(),
    };

    const Consumer = () => {
      const map = useMap();
      expect(map).toBe(mapRef);
      return null;
    };

    const result = render(
      <MapContext.Provider value={mapRef as any}>
        <Consumer />
      </MapContext.Provider>
    );

    expect(result).toBeTruthy();
  });
});
