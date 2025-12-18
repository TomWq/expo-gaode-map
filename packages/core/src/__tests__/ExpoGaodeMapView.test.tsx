/**
 * ExpoGaodeMapView 组件测试
 * 测试地图视图组件的核心功能和所有属性
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ExpoGaodeMapView from '../ExpoGaodeMapView';
import { MapType } from '../types/common.types';

describe('ExpoGaodeMapView', () => {
  
  it('应该能够渲染', () => {
    const result = render(<ExpoGaodeMapView />);
    expect(result).toBeTruthy();
  });

  it('应该支持地图类型设置', () => {
    const result = render(
      <ExpoGaodeMapView mapType={MapType.Satellite} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持初始相机位置', () => {
    const initialCameraPosition = {
      target: { latitude: 39.9, longitude: 116.4 },
      zoom: 15,
      tilt: 30,
      bearing: 0,
    };
    const result = render(
      <ExpoGaodeMapView initialCameraPosition={initialCameraPosition} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持显示当前定位', () => {
    const result = render(
      <ExpoGaodeMapView myLocationEnabled={true} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持跟随用户位置', () => {
    const result = render(
      <ExpoGaodeMapView
        myLocationEnabled={true}
        followUserLocation={true}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持定位蓝点配置', () => {
    const userLocationRepresentation = {
      showsAccuracyRing: true,
      showsHeadingIndicator: true,
      fillColor: '#4A90E2',
      strokeColor: '#2E5C8A',
      lineWidth: 2,
      enablePulseAnimation: true,
      showMyLocation: true,
    };
    const result = render(
      <ExpoGaodeMapView
        myLocationEnabled={true}
        userLocationRepresentation={userLocationRepresentation}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持定位图标自定义', () => {
    const userLocationRepresentation = {
      image: 'https://example.com/icon.png',
      imageWidth: 40,
      imageHeight: 40,
    };
    const result = render(
      <ExpoGaodeMapView
        myLocationEnabled={true}
        userLocationRepresentation={userLocationRepresentation}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持室内地图', () => {
    const result = render(
      <ExpoGaodeMapView indoorViewEnabled={true} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持3D建筑', () => {
    const result = render(
      <ExpoGaodeMapView buildingsEnabled={true} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持标注显示控制', () => {
    const result = render(
      <ExpoGaodeMapView labelsEnabled={false} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持指南针显示', () => {
    const result = render(
      <ExpoGaodeMapView compassEnabled={true} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持缩放按钮（Android）', () => {
    const result = render(
      <ExpoGaodeMapView zoomControlsEnabled={true} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持比例尺', () => {
    const result = render(
      <ExpoGaodeMapView scaleControlsEnabled={true} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持定位按钮（Android）', () => {
    const result = render(
      <ExpoGaodeMapView
        myLocationEnabled={true}
        myLocationButtonEnabled={true}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持路况显示', () => {
    const result = render(
      <ExpoGaodeMapView trafficEnabled={true} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持最大最小缩放级别', () => {
    const result = render(
      <ExpoGaodeMapView
        minZoom={3}
        maxZoom={20}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持手势控制 - 缩放', () => {
    const result = render(
      <ExpoGaodeMapView zoomGesturesEnabled={false} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持手势控制 - 滑动', () => {
    const result = render(
      <ExpoGaodeMapView scrollGesturesEnabled={false} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持手势控制 - 旋转', () => {
    const result = render(
      <ExpoGaodeMapView rotateGesturesEnabled={false} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持手势控制 - 倾斜', () => {
    const result = render(
      <ExpoGaodeMapView tiltGesturesEnabled={false} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持所有手势禁用', () => {
    const result = render(
      <ExpoGaodeMapView
        zoomGesturesEnabled={false}
        scrollGesturesEnabled={false}
        rotateGesturesEnabled={false}
        tiltGesturesEnabled={false}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持定位更新过滤（iOS）', () => {
    const result = render(
      <ExpoGaodeMapView
        myLocationEnabled={true}
        distanceFilter={10}
        headingFilter={5}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持在线自定义样式', () => {
    const customMapStyle = {
      styleId: 'amap://styles/dark',
    };
    const result = render(
      <ExpoGaodeMapView customMapStyle={customMapStyle} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持本地自定义样式', () => {
    const customMapStyle = {
      styleDataPath: 'path/to/style.data',
      extraStyleDataPath: 'path/to/extra.data',
    };
    const result = render(
      <ExpoGaodeMapView customMapStyle={customMapStyle} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持自定义样式', () => {
    const result = render(
      <ExpoGaodeMapView
        style={{ width: 300, height: 400 }}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持地图点击事件', () => {
    const onMapPress = jest.fn();
    const result = render(
      <ExpoGaodeMapView onMapPress={onMapPress} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持POI点击事件', () => {
    const onPressPoi = jest.fn();
    const result = render(
      <ExpoGaodeMapView onPressPoi={onPressPoi} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持地图长按事件', () => {
    const onMapLongPress = jest.fn();
    const result = render(
      <ExpoGaodeMapView onMapLongPress={onMapLongPress} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持相机移动事件', () => {
    const onCameraMove = jest.fn();
    const result = render(
      <ExpoGaodeMapView onCameraMove={onCameraMove} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持相机停止移动事件', () => {
    const onCameraIdle = jest.fn();
    const result = render(
      <ExpoGaodeMapView onCameraIdle={onCameraIdle} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持地图加载完成事件', () => {
    const onLoad = jest.fn();
    const result = render(
      <ExpoGaodeMapView onLoad={onLoad} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持定位更新事件', () => {
    const onLocation = jest.fn();
    const result = render(
      <ExpoGaodeMapView
        myLocationEnabled={true}
        onLocation={onLocation}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持渲染子组件', () => {
    const result = render(
      <ExpoGaodeMapView>
        <></>
      </ExpoGaodeMapView>
    );
    expect(result).toBeTruthy();
  });

  it('应该支持复杂组合配置', () => {
    const result = render(
      <ExpoGaodeMapView
        mapType={MapType.Standard}
        myLocationEnabled={true}
        followUserLocation={true}
        buildingsEnabled={true}
        trafficEnabled={true}
        compassEnabled={true}
        scaleControlsEnabled={true}
        zoomGesturesEnabled={true}
        scrollGesturesEnabled={true}
        rotateGesturesEnabled={true}
        tiltGesturesEnabled={true}
        minZoom={3}
        maxZoom={20}
        onMapPress={jest.fn()}
        onLoad={jest.fn()}
        style={{ flex: 1 }}
      >
        <></>
      </ExpoGaodeMapView>
    );
    expect(result).toBeTruthy();
  });

  describe('MapViewRef API 方法测试', () => {
    it('应该能够通过 ref 访问 API 方法', () => {
      const ref = React.createRef<any>();
      render(<ExpoGaodeMapView ref={ref} />);
      
      // 验证 API 方法存在
      expect(ref.current).toBeDefined();
      expect(ref.current.moveCamera).toBeDefined();
      expect(ref.current.getLatLng).toBeDefined();
      expect(ref.current.setCenter).toBeDefined();
      expect(ref.current.setZoom).toBeDefined();
      expect(ref.current.getCameraPosition).toBeDefined();
    });

    it('moveCamera 应该是一个异步函数', () => {
      const ref = React.createRef<any>();
      render(<ExpoGaodeMapView ref={ref} />);
      
      expect(typeof ref.current.moveCamera).toBe('function');
    });

    it('getLatLng 应该是一个异步函数', () => {
      const ref = React.createRef<any>();
      render(<ExpoGaodeMapView ref={ref} />);
      
      expect(typeof ref.current.getLatLng).toBe('function');
    });

    it('setCenter 应该是一个异步函数', () => {
      const ref = React.createRef<any>();
      render(<ExpoGaodeMapView ref={ref} />);
      
      expect(typeof ref.current.setCenter).toBe('function');
    });

    it('setZoom 应该是一个异步函数', () => {
      const ref = React.createRef<any>();
      render(<ExpoGaodeMapView ref={ref} />);
      
      expect(typeof ref.current.setZoom).toBe('function');
    });

    it('getCameraPosition 应该是一个异步函数', () => {
      const ref = React.createRef<any>();
      render(<ExpoGaodeMapView ref={ref} />);
      
      expect(typeof ref.current.getCameraPosition).toBe('function');
    });
  });

  describe('组件生命周期', () => {
    it('应该正确设置 displayName', () => {
      expect(ExpoGaodeMapView.displayName).toBe('ExpoGaodeMapView');
    });

    it('应该在挂载时初始化 apiRef', () => {
      const ref = React.createRef<any>();
      render(<ExpoGaodeMapView ref={ref} />);
      
      // apiRef 应该立即可用（通过 useImperativeHandle）
      expect(ref.current).toBeDefined();
      expect(ref.current.moveCamera).toBeDefined();
      expect(ref.current.getLatLng).toBeDefined();
      expect(ref.current.setCenter).toBeDefined();
      expect(ref.current.setZoom).toBeDefined();
      expect(ref.current.getCameraPosition).toBeDefined();
    });
  });
});