# Marker Refresh and Lifecycle Design

## Goal

Restore immediate custom Marker state changes without reintroducing blank frames, stale snapshots, or accidental Marker removal during React Native view updates.

## Scope

- Update `expo-gaode-map` custom Marker rendering on iOS and Android.
- Remove fixed Marker refresh and teardown delays introduced after `2.2.38`.
- Keep the existing bitmap cache, stable native Marker identity, stale-result guards, and last-good-image fallback.
- Sync the Android teardown correction to the navigation package's embedded map implementation.

The map view's page-exit destruction delay is outside this change. It does not participate in an individual Marker content switch.

## Design

### Content updates

The native Marker remains mounted while its React children change. The last successfully rendered image stays visible until a replacement snapshot is ready. The replacement is assigned once and without implicit animation.

On iOS, repeated cache-key, layout, and child-structure changes are coalesced onto the next main-queue turn. Snapshot rendering performs deterministic layout without spinning the run loop. Applying the resulting image disables implicit Core Animation actions.

On Android, every relevant content/layout invalidation increments a generation. A single frame callback records the latest generation and renders only after an entire frame completes without a newer invalidation. Continuous child animations therefore do not generate intermediate Marker bitmaps.

### Teardown

Window detachment is not destruction.

- Android removes an individual Marker synchronously when the parent map removes that Marker. `OnViewDestroys` is an idempotent fallback. `onDetachedFromWindow` only cancels pending snapshot work.
- iOS removes the MarkerView from the map container's strong overlay registry synchronously. A transient reattach registers it again without removing its annotation. A real unmount releases the MarkerView and its `deinit` performs native annotation cleanup.

No Marker lifecycle decision uses a 300-500 ms timer.

## Compatibility

- No JavaScript or TypeScript API changes.
- Stable React keys remain recommended, but a legitimate Marker remount must no longer leave the old Marker visible.
- `growAnimation` remains opt-in and is not changed.
- Icon-only and default-pin Markers retain their current behavior.

## Verification

- Source regression tests reject fixed Marker refresh/removal delays.
- Source regression tests require frame-generation coalescing on Android and animation-free image assignment on iOS.
- Existing Marker component tests continue to pass.
- Core and navigation test suites, lint, Android Kotlin compilation, and iOS native build are run where the local workspace permits.
