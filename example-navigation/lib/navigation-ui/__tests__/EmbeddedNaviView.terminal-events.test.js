import React from "react";
import renderer, { act } from "react-test-renderer";
import { Platform } from "react-native";

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
  const presentation = tree.root.findByProps({ testID: "embedded-navi-arrival-presentation" });
  const arrivalText = presentation
    .findAllByType("Text")
    .map((node) => node.children.join(""));

  expect(arrivalText).toEqual(
    expect.arrayContaining(["已到达目的地", "请注意停车安全"])
  );
  expect(
    presentation.findByProps({ testID: "embedded-navi-arrival-success-icon" }).props.name
  ).toBe("check");
  expect(tree.root.findAllByType("EmbeddedNaviHud")).toHaveLength(0);
  expect(tree.root.findAllByType("EmbeddedNaviBottomSummary")).toHaveLength(0);
  expect(tree.root.findAllByType("EmbeddedNaviLaneView")).toHaveLength(0);
  expect(tree.root.findAllByType("EmbeddedNaviTrafficBar")).toHaveLength(0);
  expect(tree.root.findAllByProps({ testID: "embedded-navi-overview-toggle" })).toHaveLength(0);
}

describe("EmbeddedNaviView terminal presentation", () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

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

  it("hides the car at arrival by default and restores the caller visibility on the next start", () => {
    let tree;

    act(() => {
      tree = renderer.create(<EmbeddedNaviView carOverlayVisible />);
    });

    expect(getNativeNaviView(tree).props.carOverlayVisible).toBe(true);

    act(() => {
      getNativeNaviView(tree).props.onArrive({ nativeEvent: { arrived: true } });
    });

    expect(getNativeNaviView(tree).props.carOverlayVisible).toBe(false);

    act(() => {
      getNativeNaviView(tree).props.onNaviStart({ nativeEvent: { type: 1 } });
    });

    expect(getNativeNaviView(tree).props.carOverlayVisible).toBe(true);
  });

  it("keeps a caller-hidden car hidden after the next navigation start", () => {
    let tree;

    act(() => {
      tree = renderer.create(<EmbeddedNaviView carOverlayVisible={false} />);
    });

    act(() => {
      getNativeNaviView(tree).props.onArrive({ nativeEvent: { arrived: true } });
      getNativeNaviView(tree).props.onNaviStart({ nativeEvent: { type: 1 } });
    });

    expect(getNativeNaviView(tree).props.carOverlayVisible).toBe(false);
  });

  it("keeps the caller car visibility at arrival when hiding is disabled", () => {
    let tree;

    act(() => {
      tree = renderer.create(<EmbeddedNaviView carOverlayVisible hideCarOnArrival={false} />);
    });

    act(() => {
      getNativeNaviView(tree).props.onArrive({ nativeEvent: { arrived: true } });
    });

    expect(getNativeNaviView(tree).props.carOverlayVisible).toBe(true);
  });

  it("keeps a caller-provided destination image and promotes the Android SDK destination pin only after arrival", () => {
    Platform.OS = "android";
    const endPointImage = { uri: "file:///destination-pin.png" };
    const routeMarkerVisible = {
      showStartEndVia: false,
      showFootFerry: false,
      showForbidden: false,
      showRouteStartIcon: false,
      showRouteEndIcon: false,
    };
    let tree;

    act(() => {
      tree = renderer.create(
        <EmbeddedNaviView
          endPointImage={endPointImage}
          routeMarkerVisible={routeMarkerVisible}
        />
      );
    });

    expect(getNativeNaviView(tree).props.endPointImage).toBe(endPointImage);
    expect(getNativeNaviView(tree).props.routeMarkerVisible).toEqual(
      expect.objectContaining({
        showStartEndVia: false,
        showRouteEndIcon: false,
      })
    );

    act(() => {
      getNativeNaviView(tree).props.onArrive({ nativeEvent: { arrived: true } });
    });

    expectArrivalPresentation(tree);
    expect(getNativeNaviView(tree).props.endPointImage).toBe(endPointImage);
    expect(getNativeNaviView(tree).props.routeMarkerVisible).toEqual(
      expect.objectContaining({
        showStartEndVia: true,
        showRouteEndIcon: true,
      })
    );

    act(() => {
      getNativeNaviView(tree).props.onNaviStart({ nativeEvent: { type: 1 } });
    });

    expect(getNativeNaviView(tree).props.routeMarkerVisible).toEqual(
      expect.objectContaining({
        showStartEndVia: false,
        showRouteEndIcon: false,
      })
    );
  });

  it("does not override Android route marker visibility when arrival emphasis is disabled", () => {
    Platform.OS = "android";
    let tree;

    act(() => {
      tree = renderer.create(
        <EmbeddedNaviView
          emphasizeDestinationOnArrival={false}
          routeMarkerVisible={{ showStartEndVia: false, showRouteEndIcon: false }}
        />
      );
    });

    act(() => {
      getNativeNaviView(tree).props.onArrive({ nativeEvent: { arrived: true } });
    });

    expectArrivalPresentation(tree);
    expect(getNativeNaviView(tree).props.routeMarkerVisible).toEqual(
      expect.objectContaining({
        showStartEndVia: false,
        showRouteEndIcon: false,
      })
    );
  });
});
