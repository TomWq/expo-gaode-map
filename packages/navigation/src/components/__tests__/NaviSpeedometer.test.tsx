import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { NaviSpeedometer } from '../NaviSpeedometer';

describe('NaviSpeedometer', () => {
  it('shows a placeholder when speed is unavailable', () => {
    let rendered: renderer.ReactTestRenderer;
    act(() => {
      rendered = renderer.create(<NaviSpeedometer speed={null} />);
    });
    const tree = rendered!.root;
    expect(tree.findAllByType('Text').map((node) => node.children.join(''))).toEqual(['--', 'km/h']);
  });

  it('rounds the live speed for the navigation dial', () => {
    let rendered: renderer.ReactTestRenderer;
    act(() => {
      rendered = renderer.create(<NaviSpeedometer speed={59.6} />);
    });
    const tree = rendered!.root;
    expect(tree.findAllByType('Text').map((node) => node.children.join(''))).toEqual(['60', 'km/h']);
  });
});
