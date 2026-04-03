---
layout: home
recommended: true
package: all
legacy: true
badges:
  - Modular Runtime

hero:
  name: "expo-gaode-map v3"
  text: "Gaode Map SDK for React Native"
  tagline: Map rendering, location, overlays, route playback and offline maps. Add Navigation / Search / Web API only when needed.
  image:
    src: /logo.svg
    alt: expo-gaode-map
  actions:
    - theme: brand
      text: Map Quick Start
      link: /en/v3/guide/getting-started
    - theme: alt
      text: Package Matrix
      link: /en/v3/guide/architecture
    - theme: alt
      text: Migration Guide
      link: /en/v3/guide/migration

features:
  - icon: 🗺️
    title: Map rendering + camera control
    details: Standard/satellite/night map modes, gestures and camera animation APIs.
  - icon: 📍
    title: Location + privacy compliance
    details: One-shot/continuous location, follow mode, permission and privacy setup flow.
  - icon: 🧩
    title: Overlay system
    details: Marker, Polyline, Polygon, Circle, Cluster and HeatMap for real product use.
  - icon: 🛣️
    title: Route + offline capability
    details: Route playback, geometry helpers and offline map package management.
---

<div class="v3-value-band">
  <div class="v3-value-chip"><strong>Primary map package</strong><span><code>expo-gaode-map</code></span></div>
  <div class="v3-value-chip"><strong>Core map flow</strong><span>Render + Location + Overlays + Route</span></div>
  <div class="v3-value-chip"><strong>Navigation package</strong><span>Mutually exclusive with Core</span></div>
  <div class="v3-value-chip"><strong>Optional extensions</strong><span>Search / Web API on demand</span></div>
</div>

## Map Capabilities (Core)

<div class="v3-map-cap-grid">
  <div class="v3-map-cap"><h3>Map rendering</h3><p>Standard/satellite/night layers with smooth native rendering.</p></div>
  <div class="v3-map-cap"><h3>Camera control</h3><p>Fit bounds, move/zoom, tilt/rotate and animated camera transitions.</p></div>
  <div class="v3-map-cap"><h3>Location stack</h3><p>One-shot/continuous/background location and follow behavior.</p></div>
  <div class="v3-map-cap"><h3>Overlays</h3><p>Marker, Polyline, Polygon, Circle, Cluster and HeatMap components.</p></div>
  <div class="v3-map-cap"><h3>Route + geometry</h3><p>Playback, path distance, point-in-polygon and nearest point utilities.</p></div>
  <div class="v3-map-cap"><h3>Offline maps</h3><p>Download, update and manage offline packages for weak-network scenarios.</p></div>
</div>

## Optional Extensions

<div class="v3-home-grid">
  <a class="v3-home-card" href="/en/v3/guide/navigation">
    <h3>Navigation App</h3>
    <p>Navigation map, turn-by-turn UI and route guidance in one package.</p>
    <span>Start with Navigation →</span>
  </a>
  <a class="v3-home-card" href="/en/v3/guide/search">
    <h3>Native Search</h3>
    <p>POI search, input tips and reverse geocode for high-frequency UX.</p>
    <span>Start with Search →</span>
  </a>
  <a class="v3-home-card" href="/en/v3/guide/web-api">
    <h3>Pure JS Web Services</h3>
    <p>Geocode, route and search APIs, standalone or combined with base runtime.</p>
    <span>Start with Web API →</span>
  </a>
  <a class="v3-home-card" href="/en/v3/guide/migration">
    <h3>v2 → v3 Migration</h3>
    <p>Keep legacy defaults, migrate module by module without full rewrites.</p>
    <span>Read Migration →</span>
  </a>
</div>

## Package Matrix (Read This First)

| Use Case | Package |
| --- | --- |
| Map, location, overlays | `expo-gaode-map` |
| Navigation map + turn-by-turn | `expo-gaode-map-navigation` |
| Native search capability | `expo-gaode-map-search` (optional) |
| Pure JS web service capability | `expo-gaode-map-web-api` (optional, standalone) |

::: warning Mutual Exclusion
`expo-gaode-map` and `expo-gaode-map-navigation` cannot be installed together.
:::

## Integration in 3 Steps (Map First)

<div class="v3-choice-grid">
  <div class="v3-choice-card">
    <h3>1. Pick base runtime first</h3>
    <p>Choose <code>expo-gaode-map</code> for map products, or <code>expo-gaode-map-navigation</code> for navigation products.</p>
  </div>
  <div class="v3-choice-card">
    <h3>2. Expand only when needed</h3>
    <p>Add <code>expo-gaode-map-search</code> and <code>expo-gaode-map-web-api</code> only for real feature needs.</p>
  </div>
  <div class="v3-choice-card">
    <h3>3. Organize code with v3 entry</h3>
    <p>Use runtime/provider for new modules. Keep legacy calls alive and migrate progressively.</p>
  </div>
</div>

## Install Commands (Copy & Run)

<div class="v3-install-grid">
  <div class="v3-install-card">
    <h3>Map App (Primary)</h3>

```bash
yarn add expo-gaode-map
```
  </div>
  <div class="v3-install-card">
    <h3>Navigation App</h3>

```bash
yarn add expo-gaode-map-navigation
```
  </div>
  <div class="v3-install-card">
    <h3>Optional Extensions</h3>

```bash
yarn add expo-gaode-map-search
yarn add expo-gaode-map-web-api
```
  </div>
</div>

## Minimal Runnable Example (Map Primary)

```tsx
import { MapView } from 'expo-gaode-map'

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      myLocationEnabled
    />
  )
}
```

Runtime/provider examples for optional modules are in:
- [Search (v3)](/en/v3/guide/search)
- [Web API (v3)](/en/v3/guide/web-api)

## Will This Break Existing Projects?

- No forced rewrite: legacy default exports and compatibility paths are preserved.
- Suggested migration: write new features with runtime/provider, migrate old calls gradually.
- Versioned docs: you can always switch back to v2 pages.

Next:
- [V3 Quick Start](/en/v3/guide/getting-started)
- [V3 Initialization](/en/v3/guide/initialization)
- [V3 Architecture](/en/v3/guide/architecture)
- [Web API (v3)](/en/v3/guide/web-api)
- [v2 → v3 Migration](/en/v3/guide/migration)
