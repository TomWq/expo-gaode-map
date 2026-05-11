import React from 'react';
import renderer, { act } from 'react-test-renderer';

import ExampleCenterScreen from '../index';

function collectText(node: any): string[] {
  if (!node) {
    return [];
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return [String(node)];
  }

  const children = Array.isArray(node.props?.children)
    ? node.props.children
    : node.props?.children != null
      ? [node.props.children]
      : [];

  return children.flatMap(collectText);
}

describe('example-navigation home smoke', () => {
  it('renders the example center with the core entry points', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ExampleCenterScreen />);
    });
    const texts = tree.root.findAll((node) => node.type === 'Text').flatMap(collectText);

    expect(texts).toContain('示例中心');
    expect(texts).toContain('官方黑盒');
    expect(texts).toContain('嵌入式导航');
    expect(texts).toContain('算路与联调');
    expect(texts).toContain('打开导航文档');
  });
});
