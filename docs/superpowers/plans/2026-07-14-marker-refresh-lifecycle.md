# Marker Refresh and Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make custom Marker content replacement atomic and remove time-based Marker teardown latency.

**Architecture:** Preserve the last successful bitmap while coalescing content invalidations into one settled refresh. Use authoritative parent/module lifecycle events for teardown instead of delayed detach guesses.

**Tech Stack:** React Native, Expo Modules API, Swift/UIKit/MAMapKit, Kotlin/Android/AMap, Jest source regression tests.

## Global Constraints

- Do not change the public Marker API.
- Do not remove the bitmap caches or stale annotation-view guards.
- Do not change opt-in `growAnimation` behavior.
- Do not use fixed delays to decide Marker refresh or destruction.

---

### Task 1: Define the regression contract

**Files:**
- Modify: `packages/core/src/__tests__/ios-marker-native-source.test.ts`
- Modify: `packages/core/src/__tests__/android-marker-native-source.test.ts`
- Create: `packages/navigation/src/__tests__/android-marker-native-source.test.ts`

**Interfaces:**
- Consumes: current native source files as text fixtures.
- Produces: guards for atomic refresh, settled-frame coalescing, and immediate teardown.

- [ ] Replace tests that require 300-500 ms teardown delays with assertions that reject those delays.
- [ ] Require iOS image application to disable implicit actions and cache-key refresh to use one coalesced task.
- [ ] Require Android generation-based frame settling and `OnViewDestroys` cleanup.
- [ ] Run the three source tests and confirm they fail on the existing implementation for the intended assertions.

### Task 2: Implement iOS atomic refresh and deterministic teardown

**Files:**
- Modify: `packages/core/ios/overlays/MarkerView.swift`
- Modify: `packages/core/ios/ExpoGaodeMapView.swift`

**Interfaces:**
- Consumes: `setCacheKey`, child/layout callbacks, and the map container overlay registry.
- Produces: one next-turn children refresh and immediate registry release on removal.

- [ ] Coalesce children refreshes with one cancellable main-queue work item.
- [ ] Remove the staged 20/80 ms cache-key refresh and RunLoop spinning.
- [ ] Apply children images inside a disabled Core Animation transaction.
- [ ] Remove delayed annotation-removal and overlay-unregister tasks.
- [ ] Run the iOS source test and confirm it passes.

### Task 3: Implement Android settled-frame refresh and authoritative teardown

**Files:**
- Modify: `packages/core/android/src/main/java/expo/modules/gaodemap/overlays/MarkerView.kt`
- Modify: `packages/core/android/src/main/java/expo/modules/gaodemap/overlays/MarkerViewModule.kt`
- Modify: `packages/core/android/src/main/java/expo/modules/gaodemap/ExpoGaodeMapView.kt`
- Modify: `packages/navigation/android/src/main/java/expo/modules/gaodemap/map/overlays/MarkerViewModule.kt`
- Modify: `packages/navigation/android/src/main/java/expo/modules/gaodemap/map/ExpoGaodeMapView.kt`

**Interfaces:**
- Consumes: child invalidation/layout callbacks and Expo `OnViewDestroys`.
- Produces: `markCustomMarkerContentDirty()` generation coalescing and idempotent immediate `removeMarker()`.

- [ ] Replace millisecond-based icon scheduling with one-frame generation settling.
- [ ] Stop treating `onDetachedFromWindow` as Marker destruction.
- [ ] Remove individual Markers synchronously from parent `removeView` and `removeViewAt` callbacks.
- [ ] Add `OnViewDestroys` as a cleanup fallback in core and navigation Marker modules.
- [ ] Run core and navigation Android source tests and confirm they pass.

### Task 4: Verify the complete change

**Files:**
- Verify all modified files above.

**Interfaces:**
- Consumes: the complete implementation.
- Produces: test, lint, and native compilation evidence.

- [ ] Run targeted Marker tests.
- [ ] Run complete core and navigation Jest suites.
- [ ] Run core and navigation lint.
- [ ] Compile Android Kotlin for the available example application.
- [ ] Build the iOS native target when the local Xcode workspace is available.
- [ ] Review `git diff --check`, `git diff`, and `git status` for unrelated changes.
