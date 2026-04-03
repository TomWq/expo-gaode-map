import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const sources = [
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/MapContext.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/MapContext.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/MapContext.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/MapUI.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/MapUI.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/MapUI.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/RouteOverlay.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/RouteOverlay.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/RouteOverlay.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/AreaMaskOverlay.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/AreaMaskOverlay.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/AreaMaskOverlay.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/marker-base.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/marker-base.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/marker-base.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/marker-smooth-move.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/marker-smooth-move.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/marker-smooth-move.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/Polyline.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/Polyline.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/Polyline.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/Polygon.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/Polygon.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/Polygon.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/Circle.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/Circle.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/Circle.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/HeatMap.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/HeatMap.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/HeatMap.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/MultiPoint.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/MultiPoint.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/MultiPoint.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/Cluster.tsx'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/Cluster.tsx'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/Cluster.tsx'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/components/overlays/index.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/components/overlays/index.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/components/overlays/index.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/utils/ErrorHandler.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/utils/ErrorHandler.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/utils/ErrorHandler.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/utils/PermissionUtils.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/utils/PermissionUtils.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/utils/PermissionUtils.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/utils/RouteUtils.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/utils/RouteUtils.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/utils/RouteUtils.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/hooks/useRoutePlayback.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/hooks/useRoutePlayback.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/hooks/useRoutePlayback.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/types/route-playback.types.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/types/route-playback.types.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/types/route-playback.types.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/v3/map-runtime.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/v3/map-runtime.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/v3/map-runtime.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/core-nav-source/v3/capability-runtime.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/v3/capability-runtime.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/v3/capability-runtime.ts'),
    ],
  },
];

const generatedBanner =
  '// This file is generated from internal/core-nav-source. Run `yarn sync:core-nav-shared` after editing the source files.\n';

for (const entry of sources) {
  const content = await readFile(entry.source, 'utf8');
  for (const target of entry.targets) {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${generatedBanner}${content}`);
  }
}
