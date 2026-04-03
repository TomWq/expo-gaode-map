const React = require('react');
const { render } = require('@testing-library/react-native');

const { MapContext, useMap } = require('../MapContext');

describe('navigation MapContext', () => {
  it('在 Provider 外使用 useMap 应抛出统一错误', () => {
    const Consumer = () => {
      useMap();
      return null;
    };

    expect(() => render(React.createElement(Consumer))).toThrow('无法调用 useMap：地图视图尚未初始化');
  });

  it('在 Provider 内使用 useMap 应返回上下文实例', () => {
    const mapRef = {
      moveCamera: jest.fn(),
      getLatLng: jest.fn(),
      setCenter: jest.fn(),
      setZoom: jest.fn(),
      getCameraPosition: jest.fn(),
      takeSnapshot: jest.fn(),
      fitToCoordinates: jest.fn(),
    };

    const Consumer = () => {
      const map = useMap();
      expect(map).toBe(mapRef);
      return null;
    };

    const result = render(
      React.createElement(MapContext.Provider, { value: mapRef }, React.createElement(Consumer))
    );

    expect(result).toBeTruthy();
  });
});
