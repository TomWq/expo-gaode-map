import React from "react";
import renderer, { act } from "react-test-renderer";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return {
    MaterialIcons: (props) => React.createElement("MaterialIcons", props),
  };
});

jest.mock("../EmbeddedNaviHud", () => {
  const React = require("react");
  const MockHud = (props) => React.createElement("EmbeddedNaviHud", props);
  return { __esModule: true, default: MockHud, EmbeddedNaviHud: MockHud };
});

jest.mock("../EmbeddedNaviBottomSummary", () => {
  const React = require("react");
  const MockBottomSummary = (props) =>
    React.createElement("EmbeddedNaviBottomSummary", props);
  return {
    __esModule: true,
    default: MockBottomSummary,
    EmbeddedNaviBottomSummary: MockBottomSummary,
  };
});

jest.mock("../EmbeddedNaviLaneView", () => {
  const React = require("react");
  const MockLaneView = (props) => React.createElement("EmbeddedNaviLaneView", props);
  return { __esModule: true, default: MockLaneView, EmbeddedNaviLaneView: MockLaneView };
});

jest.mock("../EmbeddedNaviTrafficBar", () => {
  const React = require("react");
  const MockTrafficBar = (props) => React.createElement("EmbeddedNaviTrafficBar", props);
  return { __esModule: true, default: MockTrafficBar, EmbeddedNaviTrafficBar: MockTrafficBar };
});

import { EmbeddedNaviView } from "../EmbeddedNaviView";

function naviInfo(distance) {
  return {
    nativeEvent: {
      pathRetainDistance: distance,
      pathRetainTime: 90,
      curStepRetainDistance: distance,
      curStepRetainTime: 30,
      currentRoadName: "测试道路",
      nextRoadName: "目的地道路",
      iconType: 3,
    },
  };
}

function getNativeNaviView(tree) {
  return tree.root.findByProps({ testID: "native-navi-view" });
}

function getHud(tree) {
  const huds = tree.root.findAllByType("EmbeddedNaviHud");
  expect(huds).toHaveLength(1);
  return huds[0];
}

function expectArrivalPresentation(tree) {
  expect(tree.root.findAllByProps({ testID: "embedded-navi-arrival-presentation" })).toHaveLength(1);
  expect(tree.root.findAllByType("EmbeddedNaviHud")).toHaveLength(0);
  expect(tree.root.findAllByType("EmbeddedNaviBottomSummary")).toHaveLength(0);
  expect(tree.root.findAllByType("EmbeddedNaviLaneView")).toHaveLength(0);
  expect(tree.root.findAllByType("EmbeddedNaviTrafficBar")).toHaveLength(0);
}

describe("EmbeddedNaviView terminal presentation", () => {
  it("shows arrival presentation for an emulator-end-only callback and ignores late navigation info", () => {
    const onNaviEnd = jest.fn();
    const onNaviInfoUpdate = jest.fn();
    const onExitPress = jest.fn();
    let tree;

    act(() => {
      tree = renderer.create(
        <EmbeddedNaviView
          onExitPress={onExitPress}
          onNaviEnd={onNaviEnd}
          onNaviInfoUpdate={onNaviInfoUpdate}
        />
      );
    });

    act(() => {
      getNativeNaviView(tree).props.onNaviInfoUpdate(naviInfo(31));
      getNativeNaviView(tree).props.onLaneInfoUpdate({
        nativeEvent: { laneCount: 1, backgroundLane: [1], frontLane: [1] },
      });
      getNativeNaviView(tree).props.onTrafficStatusesUpdate({
        nativeEvent: { retainDistance: 31, items: [{ status: 1, length: 31 }] },
      });
    });

    expect(getHud(tree).props.info.pathRetainDistance).toBe(31);

    act(() => {
      getNativeNaviView(tree).props.onNaviEnd({ nativeEvent: { reason: "emulator-end" } });
    });

    expect(onNaviEnd).toHaveBeenCalledTimes(1);
    expectArrivalPresentation(tree);

    act(() => {
      getNativeNaviView(tree).props.onNaviInfoUpdate(naviInfo(17));
    });

    expect(onNaviInfoUpdate).toHaveBeenCalledTimes(2);
    expectArrivalPresentation(tree);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "退出导航" }).props.onPress();
    });
    expect(onExitPress).toHaveBeenCalledTimes(1);
  });

  it("keeps one terminal presentation when arrival is followed by navigation end", () => {
    const onArrive = jest.fn();
    const onNaviEnd = jest.fn();
    let tree;

    act(() => {
      tree = renderer.create(<EmbeddedNaviView onArrive={onArrive} onNaviEnd={onNaviEnd} />);
    });

    act(() => {
      getNativeNaviView(tree).props.onArrive({ nativeEvent: { arrived: true } });
      getNativeNaviView(tree).props.onNaviEnd({ nativeEvent: { reason: "emulator-end" } });
    });

    expect(onArrive).toHaveBeenCalledTimes(1);
    expect(onNaviEnd).toHaveBeenCalledTimes(1);
    expectArrivalPresentation(tree);
  });

  it("keeps the terminal presentation for end then arrive and resets it on the next navigation start", () => {
    const onArrive = jest.fn();
    const onNaviEnd = jest.fn();
    const onNaviStart = jest.fn();
    let tree;

    act(() => {
      tree = renderer.create(
        <EmbeddedNaviView
          onArrive={onArrive}
          onNaviEnd={onNaviEnd}
          onNaviStart={onNaviStart}
        />
      );
    });

    act(() => {
      getNativeNaviView(tree).props.onNaviInfoUpdate(naviInfo(31));
      getNativeNaviView(tree).props.onNaviEnd({ nativeEvent: { reason: "emulator-end" } });
      getNativeNaviView(tree).props.onArrive({ nativeEvent: { arrived: true } });
    });

    expect(onNaviEnd).toHaveBeenCalledTimes(1);
    expect(onArrive).toHaveBeenCalledTimes(1);
    expectArrivalPresentation(tree);

    act(() => {
      getNativeNaviView(tree).props.onNaviStart({ nativeEvent: { type: 1 } });
    });

    expect(onNaviStart).toHaveBeenCalledTimes(1);
    expect(tree.root.findAllByProps({ testID: "embedded-navi-arrival-presentation" })).toHaveLength(0);
    expect(getHud(tree).props.info).toBeNull();

    act(() => {
      getNativeNaviView(tree).props.onNaviInfoUpdate(naviInfo(220));
    });

    expect(getHud(tree).props.info.pathRetainDistance).toBe(220);
  });
});
