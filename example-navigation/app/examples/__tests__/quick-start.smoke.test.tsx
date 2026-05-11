import React from 'react';
import renderer, { act } from 'react-test-renderer';

import QuickStartScreen from '../quick-start';

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

function getTexts(tree: renderer.ReactTestRenderer): string[] {
  return tree.root.findAll((node) => node.type === 'Text').flatMap(collectText);
}

function findPressableByText(tree: renderer.ReactTestRenderer, text: string) {
  const pressable = tree.root.findAll((node) => node.type === 'Pressable').find((node) =>
    collectText(node).includes(text)
  );

  if (!pressable) {
    throw new Error(`Missing pressable with text: ${text}`);
  }

  return pressable;
}

describe('quick-start smoke', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the init flow and can enter the mocked navigation view', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<QuickStartScreen />);
    });
    const mocks = (global as any).__exampleNavigationMocks as {
      navigationModule: {
        setPrivacyConfig: jest.Mock;
        initSDK: jest.Mock;
      };
      naviViewMethods: {
        startNavigation: jest.Mock;
      };
    };

    expect(getTexts(tree)).toEqual(
      expect.arrayContaining([
        '快速导航接入验证',
        '同意隐私并初始化',
        '刷新当前位置',
        '开始模拟导航',
      ])
    );

    await act(async () => {
      await findPressableByText(tree, '同意隐私并初始化').props.onPress();
    });

    expect(mocks.navigationModule.setPrivacyConfig).toHaveBeenCalled();
    expect(mocks.navigationModule.initSDK).toHaveBeenCalledWith({
      androidKey: 'android-key',
      iosKey: 'ios-key',
      webKey: 'web-key',
    });
    expect(getTexts(tree).join('\n')).toContain('初始化完成');

    await act(async () => {
      await findPressableByText(tree, '开始模拟导航').props.onPress();
    });

    expect(tree.root.findByProps({ testID: 'embedded-navi-view' })).toBeTruthy();
    expect(mocks.naviViewMethods.startNavigation).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mocks.naviViewMethods.startNavigation).toHaveBeenCalled();
  });
});
