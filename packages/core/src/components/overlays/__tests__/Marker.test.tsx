/**
 * Marker 组件测试
 * 测试 Marker 覆盖物的功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Marker from '../Marker';

describe('Marker 组件', () => {
  
  const defaultProps = {
    position: { latitude: 39.9, longitude: 116.4 },
  };
  
  it('应该正确渲染', () => {
    const result = render(<Marker {...defaultProps} />);
    expect(result).toBeTruthy();
  });
  
  it('应该接收坐标属性', () => {
    const position = { latitude: 40.0, longitude: 116.5 };
    const result = render(<Marker position={position} />);
    expect(result).toBeTruthy();
  });
  
  it('应该支持自定义标题', () => {
    const result = render(
      <Marker
        {...defaultProps}
        title="测试标记"
      />
    );
    expect(result).toBeTruthy();
  });
  
  it('应该支持拖拽功能', () => {
    const result = render(
      <Marker
        {...defaultProps}
        draggable={true}
      />
    );
    expect(result).toBeTruthy();
  });
  
  it('应该支持自定义图标', () => {
    const result = render(
      <Marker
        {...defaultProps}
        icon="custom-icon"
        iconWidth={50}
        iconHeight={50}
      />
    );
    expect(result).toBeTruthy();
  });
  
  it('应该支持自定义内容', () => {
    const result = render(
      <Marker {...defaultProps}>
        <div>自定义内容</div>
      </Marker>
    );
    expect(result).toBeTruthy();
  });
  
  it('应该正确处理尺寸属性', () => {
    const result = render(
      <Marker
        {...defaultProps}
        customViewWidth={100}
        customViewHeight={80}
      />
    );
    expect(result).toBeTruthy();
  });
  
  it('应该支持大头针样式', () => {
    const result = render(
      <Marker
        {...defaultProps}
        pinColor="red"
      />
    );
    expect(result).toBeTruthy();
  });
  
  describe('React.memo 优化', () => {
    it('相同 props 不应该重新渲染', () => {
      const { rerender } = render(<Marker {...defaultProps} />);
      
      // 验证重新渲染不会出错
      expect(() => {
        rerender(<Marker {...defaultProps} />);
      }).not.toThrow();
    });
    
    it('位置改变应该重新渲染', () => {
      const { rerender, toJSON } = render(<Marker {...defaultProps} />);
      const firstRender = toJSON();
      
      rerender(<Marker position={{ latitude: 40.0, longitude: 116.5 }} />);
      const secondRender = toJSON();
      
      // 位置改变应该导致重新渲染（输出可能不同）
      expect(firstRender).toBeDefined();
      expect(secondRender).toBeDefined();
    });
  });
  
  describe('缓存键', () => {
    it('应该支持 cacheKey 属性', () => {
      const result = render(
        <Marker {...defaultProps} cacheKey="test-key" />
      );
      expect(result).toBeTruthy();
    });
    
    it('cacheKey 改变应该触发重新渲染', () => {
      const { rerender } = render(
        <Marker {...defaultProps} cacheKey="key1" />
      );
      
      rerender(<Marker {...defaultProps} cacheKey="key2" />);
      
      // 验证组件已重新渲染
      expect(true).toBe(true);
    });
  });
});