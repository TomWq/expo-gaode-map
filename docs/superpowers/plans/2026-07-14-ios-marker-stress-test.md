# iOS Marker Stress Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repeatable example and run a Release-simulator stress test for 100 or more visible custom Marker children on the current `core-v2.2.42-next.0` implementation.

**Architecture:** Keep the diagnostic surface entirely inside the existing example application and leave native Marker code unchanged. A focused React Native page generates deterministic visible Markers with stable React identities, batch-switches their A/B children styles, records JavaScript frame latency, and is observed externally for process RSS, CPU, responsiveness, and survival.

**Tech Stack:** React 19, React Native 0.86, Expo 57, Expo Modules, TypeScript, Jest source-contract tests, Xcode/iOS Simulator, `simctl` process sampling.

## Global Constraints

- Test only the repository's current `core-v2.2.42-next.0` implementation.
- Do not modify `packages/core/ios` or any other native Marker implementation.
- Use stable React keys and style-specific Marker `cacheKey` values.
- Keep every generated Marker inside the initial visible map viewport.
- Do not use network images, blur, remote data, or location-dependent coordinates.
- Run the iOS app in Release configuration on an iPhone 16 Pro simulator with iOS 18.6.
- Treat JavaScript animation-frame timing as scheduling/commit latency, not native snapshot completion time.

---

### Task 1: Define the stress-example source contract

**Files:**
- Create: `packages/core/src/__tests__/example-marker-stress-source.test.ts`
- Test: `packages/core/src/__tests__/example-marker-stress-source.test.ts`

**Interfaces:**
- Consumes: `example/MarkerStressTestExample.tsx` and `example/ExampleHub.tsx` as UTF-8 source fixtures.
- Produces: Jest guards for Hub registration, count choices, stable identity, style cache keys, and automatic-run controls.

- [ ] **Step 1: Write the failing source-contract test**

```ts
import fs from 'fs';
import path from 'path';

const readSource = (relativePath: string) => {
  const absolutePath = path.resolve(__dirname, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
};

describe('iOS Marker stress example source contract', () => {
  const stressExampleSource = readSource('../../../../example/MarkerStressTestExample.tsx');
  const exampleHubSource = readSource('../../../../example/ExampleHub.tsx');

  it('registers a dedicated performance example in Example Hub', () => {
    expect(exampleHubSource).toContain(
      "import MarkerStressTestExample from './MarkerStressTestExample';"
    );
    expect(exampleHubSource).toContain("id: 'marker-stress-test'");
    expect(exampleHubSource).toContain('component: MarkerStressTestExample');
    expect(exampleHubSource).toContain("category: 'tooling'");
  });

  it('provides deterministic 50 to 200 Marker loads with a 100 Marker default', () => {
    expect(stressExampleSource).toContain(
      'const MARKER_COUNTS = [50, 100, 150, 200] as const;'
    );
    expect(stressExampleSource).toContain('React.useState<MarkerCount>(100)');
    expect(stressExampleSource).toContain('generateStressMarkers(mountedCount)');
  });

  it('keeps Marker identity stable while switching style-specific cache keys', () => {
    expect(stressExampleSource).toContain('key={marker.id}');
    expect(stressExampleSource).toContain('cacheKey={markerCacheKey(marker.id, variant)}');
    expect(stressExampleSource).toContain(
      'return `marker-stress-${markerId}-${variant}`;'
    );
  });

  it('supports manual and bounded automatic batch updates', () => {
    expect(stressExampleSource).toContain('const AUTO_RUN_ROUNDS = 20;');
    expect(stressExampleSource).toContain('const AUTO_RUN_INTERVAL_MS = 500;');
    expect(stressExampleSource).toContain('testID="marker-stress-toggle"');
    expect(stressExampleSource).toContain('testID="marker-stress-auto-start"');
    expect(stressExampleSource).toContain('testID="marker-stress-auto-stop"');
    expect(stressExampleSource).toContain('testID="marker-stress-clear"');
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
yarn workspace expo-gaode-map test --runTestsByPath src/__tests__/example-marker-stress-source.test.ts
```

Expected: four failing tests because `MarkerStressTestExample.tsx` and its Hub entry do not exist.

- [ ] **Step 3: Commit the failing contract**

```bash
git add packages/core/src/__tests__/example-marker-stress-source.test.ts
git commit -m "test: define ios marker stress example"
```

### Task 2: Implement the Marker stress page and Hub entry

**Files:**
- Create: `example/MarkerStressTestExample.tsx`
- Modify: `example/ExampleHub.tsx`
- Test: `packages/core/src/__tests__/example-marker-stress-source.test.ts`

**Interfaces:**
- Consumes: `MapView`, `Marker`, `MapUI`, fixed Beijing coordinates, and Example Hub's `ExampleDefinition` registry.
- Produces: default export `MarkerStressTestExample`, `markerCacheKey(markerId: string, variant: StyleVariant): string`, deterministic count controls, and a bounded automatic run.

- [ ] **Step 1: Add the minimal deterministic stress model and page state**

Create `example/MarkerStressTestExample.tsx` with these exact constants and model functions:

```tsx
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  MapUI,
  MapView,
  Marker,
  type CameraPosition,
} from 'expo-gaode-map';

const MARKER_COUNTS = [50, 100, 150, 200] as const;
const AUTO_RUN_ROUNDS = 20;
const AUTO_RUN_INTERVAL_MS = 500;
const GRID_COLUMNS = 20;
const CENTER = { latitude: 39.90923, longitude: 116.397428 };
const INITIAL_CAMERA: CameraPosition = { target: CENTER, zoom: 12.8 };

type MarkerCount = (typeof MARKER_COUNTS)[number];
type StyleVariant = 'a' | 'b';
type RunStatus = 'idle' | 'running' | 'stopped' | 'completed';
type StressMarker = {
  id: string;
  index: number;
  position: { latitude: number; longitude: number };
};

function markerCacheKey(markerId: string, variant: StyleVariant) {
  return `marker-stress-${markerId}-${variant}`;
}

function generateStressMarkers(count: number): StressMarker[] {
  const rows = Math.ceil(count / GRID_COLUMNS);
  return Array.from({ length: count }, (_, index) => {
    const column = index % GRID_COLUMNS;
    const row = Math.floor(index / GRID_COLUMNS);
    return {
      id: `stress-${index}`,
      index,
      position: {
        latitude: CENTER.latitude + (row - (rows - 1) / 2) * 0.0015,
        longitude: CENTER.longitude + (column - (GRID_COLUMNS - 1) / 2) * 0.0018,
      },
    };
  });
}
```

The component owns `selectedCount`, `mountedCount`, `variant`, `completedRounds`, `lastCommitLatencyMs`, `maxCommitLatencyMs`, and `runStatus`. Marker generation uses:

```tsx
const markers = React.useMemo(
  () => generateStressMarkers(mountedCount),
  [mountedCount]
);
```

- [ ] **Step 2: Implement measured manual and automatic style switching**

Use one cancellable timeout chain and a two-frame measurement for each batch:

```tsx
const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const runTokenRef = React.useRef(0);

const cancelTimer = React.useCallback(() => {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}, []);

const toggleVariant = React.useCallback(() => {
  const startedAt = performance.now();
  setVariant((current) => (current === 'a' ? 'b' : 'a'));
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const latency = performance.now() - startedAt;
      setLastCommitLatencyMs(latency);
      setMaxCommitLatencyMs((current) => Math.max(current, latency));
    });
  });
}, []);

const stopAutoRun = React.useCallback(() => {
  runTokenRef.current += 1;
  cancelTimer();
  setRunStatus('stopped');
}, [cancelTimer]);

const startAutoRun = React.useCallback(() => {
  cancelTimer();
  const token = runTokenRef.current + 1;
  runTokenRef.current = token;
  setCompletedRounds(0);
  setLastCommitLatencyMs(0);
  setMaxCommitLatencyMs(0);
  setRunStatus('running');

  const runRound = (round: number) => {
    if (runTokenRef.current !== token) return;
    toggleVariant();
    setCompletedRounds(round);
    if (round >= AUTO_RUN_ROUNDS) {
      timerRef.current = null;
      setRunStatus('completed');
      return;
    }
    timerRef.current = setTimeout(
      () => runRound(round + 1),
      AUTO_RUN_INTERVAL_MS
    );
  };

  timerRef.current = setTimeout(() => runRound(1), 250);
}, [cancelTimer, toggleVariant]);
```

Unmount cleanup increments the token and cancels the timeout.

- [ ] **Step 3: Render stable custom Marker children and controls**

Render every Marker with stable identity and a style-specific cache key:

```tsx
{markers.map((marker) => (
  <Marker
    key={marker.id}
    position={marker.position}
    cacheKey={markerCacheKey(marker.id, variant)}
    anchor={{ x: 0.5, y: 0.5 }}
    zIndex={marker.index}
  >
    <View style={[styles.markerCard, variant === 'b' && styles.markerCardB]}>
      <View style={[styles.markerBadge, variant === 'b' && styles.markerBadgeB]}>
        <Text style={styles.markerBadgeText}>{marker.index + 1}</Text>
      </View>
      <View style={styles.markerTextColumn}>
        <Text style={[styles.markerTitle, variant === 'b' && styles.markerTitleB]}>
          压测点 {marker.index + 1}
        </Text>
        <Text style={[styles.markerSubtitle, variant === 'b' && styles.markerSubtitleB]}>
          STYLE {variant.toUpperCase()}
        </Text>
      </View>
    </View>
  </Marker>
))}
```

Use A/B dimensions of `160x56` and `220x82` points. Put a scrollable control panel inside `MapUI`, expose count buttons and buttons with these test IDs:

```tsx
testID={`marker-stress-count-${count}`}
testID="marker-stress-mount"
testID="marker-stress-toggle"
testID="marker-stress-auto-start"
testID="marker-stress-auto-stop"
testID="marker-stress-clear"
```

Display mounted count, variant, round (`completedRounds/AUTO_RUN_ROUNDS`), last/max JS frame latency, and run status. Mount and Clear cancel any active run before changing Marker count.

- [ ] **Step 4: Register the page in Example Hub**

Add the import:

```tsx
import MarkerStressTestExample from './MarkerStressTestExample';
```

Add this entry to the tooling category:

```tsx
{
  id: 'marker-stress-test',
  title: 'iOS Marker 批量压力测试',
  description: '挂载 50-200 个可见自定义 Marker，批量切换 children 样式并观察卡顿和内存压力。',
  category: 'tooling',
  component: MarkerStressTestExample,
},
```

- [ ] **Step 5: Run the targeted test and verify GREEN**

Run:

```bash
yarn workspace expo-gaode-map test --runTestsByPath src/__tests__/example-marker-stress-source.test.ts
```

Expected: one suite and four tests pass.

- [ ] **Step 6: Run TypeScript/lint validation**

Run:

```bash
yarn lint:core
yarn workspace expo-gaode-map-example exec tsc --noEmit
git diff --check
```

Expected: all commands exit zero.

- [ ] **Step 7: Commit the example implementation**

```bash
git add example/MarkerStressTestExample.tsx example/ExampleHub.tsx
git commit -m "test(example): add ios marker stress harness"
```

### Task 3: Run the Release-simulator stress test

**Files:**
- Verify: `example/MarkerStressTestExample.tsx`
- Verify: `example/ios/expogaodemapexample.xcworkspace`
- No repository file changes.

**Interfaces:**
- Consumes: bundle identifier `expo.modules.gaodemap.example`, the iPhone 16 Pro iOS 18.6 simulator UUID, and the stress page controls.
- Produces: observed baseline/mounted/peak/cooldown RSS, CPU samples, responsiveness, and process-survival results.

- [ ] **Step 1: Run complete package verification before native execution**

Run:

```bash
yarn test:core
yarn lint:core
git diff --check
```

Expected: all Core suites/tests pass, lint exits zero, and no whitespace errors are reported.

- [ ] **Step 2: Boot the required simulator**

Run:

```bash
xcrun simctl boot 85698BC1-F2BC-4E23-BEE2-B000426689D3
open -a Simulator
xcrun simctl bootstatus 85698BC1-F2BC-4E23-BEE2-B000426689D3 -b
```

Expected: the iPhone 16 Pro running iOS 18.6 reports `Booted`.

- [ ] **Step 3: Build, install, and launch the Release app**

Run:

```bash
xcodebuild -quiet \
  -workspace example/ios/expogaodemapexample.xcworkspace \
  -scheme expogaodemapexample \
  -configuration Release \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,id=85698BC1-F2BC-4E23-BEE2-B000426689D3' \
  -derivedDataPath /tmp/expo-gaode-map-marker-stress-release \
  CODE_SIGNING_ALLOWED=NO \
  build
xcrun simctl install booted /tmp/expo-gaode-map-marker-stress-release/Build/Products/Release-iphonesimulator/expogaodemapexample.app
xcrun simctl launch --terminate-running-process booted expo.modules.gaodemap.example
```

Expected: Xcode exits zero and `simctl launch` prints a live PID.

- [ ] **Step 4: Establish baseline and run 100 Marker pressure**

Enter the example runtime, open `iOS Marker 批量压力测试`, select 100, and mount. Sample the process every 500 ms with:

```bash
while xcrun simctl spawn booted ps -axo pid=,rss=,%cpu=,comm= | grep -m1 expogaodemapexample; do
  sleep 0.5
done
```

Record the settled mounted RSS, then start the 20-round automatic run. Observe whether style updates appear progressively, the UI remains responsive, and the process remains present after completion. Stop the sampler with Ctrl-C and record its peak RSS/CPU.

- [ ] **Step 5: Escalate only while the process survives**

If the 100 Marker run completes, repeat the same sequence for 150 and then 200 Markers. Do not escalate after a process exit or a UI freeze that prevents stopping the run. After each surviving run, wait at least five seconds and record cooldown RSS.

- [ ] **Step 6: Collect failure evidence if the process exits**

Run:

```bash
xcrun simctl spawn booted log show --last 5m --style compact \
  --predicate 'process == "expogaodemapexample" OR eventMessage CONTAINS[c] "jetsam" OR eventMessage CONTAINS[c] "watchdog"'
```

Expected: logs distinguish an application exception from watchdog/resource termination when the simulator records one.

- [ ] **Step 7: Report the measured result**

Report one row per tested count using numeric values copied from the sampler:

```text
count | baseline_rss_mb | mounted_rss_mb | peak_rss_mb | cooldown_rss_mb | peak_cpu_percent | survived | visual_update | controls_responsive | termination
```

Use `yes` or `no` for `survived` and `controls_responsive`, `simultaneous` or `progressive` for `visual_update`, and one of `none`, `watchdog`, `memory`, `exception`, or `unknown` for `termination`.

Explicitly state that simulator survival does not establish a real-device Jetsam safety margin.
