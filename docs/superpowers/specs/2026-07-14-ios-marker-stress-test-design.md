# iOS Marker Stress Test Design

## Goal

Create a repeatable example that verifies whether the current `expo-gaode-map` implementation becomes unresponsive, exits, or develops excessive memory pressure when 100 or more visible custom Marker children update together on iOS.

The test targets the repository's current `core-v2.2.42-next.0` code only. It does not compare older package versions and does not change Marker native implementation code.

## Test Surface

Add `example/MarkerStressTestExample.tsx` and register it in the Example Hub under the tooling and performance category.

The page renders custom Marker children in a deterministic grid around a fixed Beijing coordinate. All generated Markers remain inside the initial camera viewport so the test exercises visible annotation views instead of mostly off-screen data.

Each Marker uses:

- a stable React key, preventing remount behavior from obscuring in-place refresh cost;
- a stable Marker identity combined with a style-specific `cacheKey`;
- nested `View` and `Text` content with different A/B colors, dimensions, borders, and text;
- no network image, blur, or remote data, keeping the test focused on native layout and snapshot generation.

## Controls and State

The page provides controls for:

- Marker count: 50, 100, 150, or 200;
- mounting the selected count;
- one A/B batch style switch;
- an automatic 20-round batch switch run;
- stopping an automatic run;
- clearing every Marker.

Automatic rounds use a fixed interval long enough to distinguish individual batches while still keeping sustained pressure on the renderer. A run stops after 20 completed scheduling rounds or immediately when the user presses Stop.

The status panel reports:

- mounted Marker count;
- current style variant;
- scheduled automatic round count;
- JavaScript commit latency measured across animation frames;
- maximum observed JavaScript commit latency in the current run;
- whether the test is idle, running, stopped, or completed.

JavaScript frame timing is explicitly labeled as scheduling/commit latency. It is not presented as native snapshot completion time because the native Marker API has no snapshot-completed event.

## External Measurement

Use an iPhone 16 Pro simulator running iOS 18.6 and a Release configuration to reduce development-mode noise.

Sample the example process from the host while the test runs. Record:

1. process RSS before entering the stress page;
2. RSS after mounting 100 Markers and allowing the page to settle;
3. peak RSS and CPU during the 20-round switch run;
4. RSS after a cooldown period;
5. whether the process remains alive and responsive.

If the process exits, capture recent simulator logs and identify whether the evidence points to an uncaught crash, resource termination, or another cause.

## Verification Procedure

1. Run source-level tests that verify the stress page exposes the required count choices, stable Marker keys, A/B cache keys, and automatic-run controls. Confirm the tests fail before the page and hub entry exist.
2. Implement the page and Example Hub entry, then confirm those tests pass.
3. Run Core Jest and lint to ensure the example integration does not affect package behavior.
4. Build the iOS example in Release mode for the simulator.
5. Install and launch the example, open the stress test, and establish the baseline RSS.
6. Run the 100-Marker test first. Escalate to 150 and 200 only if the process remains alive.
7. Record the observed responsiveness, process survival, timing, and memory measurements without modifying native Marker code.

## Success Criteria

The diagnostic harness is complete when:

- the stress page is accessible from Example Hub;
- the test deterministically mounts and batch-updates the requested Marker count;
- the automatic run terminates cleanly after 20 rounds and can be stopped early;
- Release simulator execution produces baseline, peak, and cooldown memory observations;
- any crash or non-crash result is reported with the tested count and observable evidence.

The Marker implementation itself is not considered fixed by this work. The output is a reproducible performance baseline for deciding the native scheduling and cache changes in a separate task.

## Limitations

The simulator can validate main-thread serialization, progressive visual updates, relative memory growth, and process exits. It cannot reproduce a physical device's exact Jetsam threshold or GPU memory behavior. A simulator pass therefore does not replace a final real-device run when validating a production fix.
