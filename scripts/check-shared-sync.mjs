import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const coreNavBanner =
  '// This file is generated from internal/core-nav-source. Run `yarn sync:core-nav-shared` after editing the source files.\n';
const v3Banner =
  '// This file is generated from internal/v3-source. Run `yarn sync:v3-shared` after editing the source files.\n';

const coreNavPairs = [
  ['internal/core-nav-source/components/MapContext.tsx', 'packages/core/src/components/MapContext.tsx'],
  ['internal/core-nav-source/components/MapContext.tsx', 'packages/navigation/src/map/components/MapContext.tsx'],
  ['internal/core-nav-source/components/MapUI.tsx', 'packages/core/src/components/MapUI.tsx'],
  ['internal/core-nav-source/components/MapUI.tsx', 'packages/navigation/src/map/components/MapUI.tsx'],
  ['internal/core-nav-source/components/RouteOverlay.tsx', 'packages/core/src/components/RouteOverlay.tsx'],
  ['internal/core-nav-source/components/RouteOverlay.tsx', 'packages/navigation/src/map/components/RouteOverlay.tsx'],
  ['internal/core-nav-source/components/AreaMaskOverlay.tsx', 'packages/core/src/components/AreaMaskOverlay.tsx'],
  ['internal/core-nav-source/components/AreaMaskOverlay.tsx', 'packages/navigation/src/map/components/AreaMaskOverlay.tsx'],
  ['internal/core-nav-source/components/overlays/marker-base.tsx', 'packages/core/src/components/overlays/marker-base.tsx'],
  ['internal/core-nav-source/components/overlays/marker-base.tsx', 'packages/navigation/src/map/components/overlays/marker-base.tsx'],
  ['internal/core-nav-source/components/overlays/marker-smooth-move.ts', 'packages/core/src/components/overlays/marker-smooth-move.ts'],
  ['internal/core-nav-source/components/overlays/marker-smooth-move.ts', 'packages/navigation/src/map/components/overlays/marker-smooth-move.ts'],
  ['internal/core-nav-source/components/overlays/Polyline.tsx', 'packages/core/src/components/overlays/Polyline.tsx'],
  ['internal/core-nav-source/components/overlays/Polyline.tsx', 'packages/navigation/src/map/components/overlays/Polyline.tsx'],
  ['internal/core-nav-source/components/overlays/Polygon.tsx', 'packages/core/src/components/overlays/Polygon.tsx'],
  ['internal/core-nav-source/components/overlays/Polygon.tsx', 'packages/navigation/src/map/components/overlays/Polygon.tsx'],
  ['internal/core-nav-source/components/overlays/Circle.tsx', 'packages/core/src/components/overlays/Circle.tsx'],
  ['internal/core-nav-source/components/overlays/Circle.tsx', 'packages/navigation/src/map/components/overlays/Circle.tsx'],
  ['internal/core-nav-source/components/overlays/HeatMap.tsx', 'packages/core/src/components/overlays/HeatMap.tsx'],
  ['internal/core-nav-source/components/overlays/HeatMap.tsx', 'packages/navigation/src/map/components/overlays/HeatMap.tsx'],
  ['internal/core-nav-source/components/overlays/MultiPoint.tsx', 'packages/core/src/components/overlays/MultiPoint.tsx'],
  ['internal/core-nav-source/components/overlays/MultiPoint.tsx', 'packages/navigation/src/map/components/overlays/MultiPoint.tsx'],
  ['internal/core-nav-source/components/overlays/Cluster.tsx', 'packages/core/src/components/overlays/Cluster.tsx'],
  ['internal/core-nav-source/components/overlays/Cluster.tsx', 'packages/navigation/src/map/components/overlays/Cluster.tsx'],
  ['internal/core-nav-source/components/overlays/index.ts', 'packages/core/src/components/overlays/index.ts'],
  ['internal/core-nav-source/components/overlays/index.ts', 'packages/navigation/src/map/components/overlays/index.ts'],
  ['internal/core-nav-source/utils/ErrorHandler.ts', 'packages/core/src/utils/ErrorHandler.ts'],
  ['internal/core-nav-source/utils/ErrorHandler.ts', 'packages/navigation/src/map/utils/ErrorHandler.ts'],
  ['internal/core-nav-source/utils/PermissionUtils.ts', 'packages/core/src/utils/PermissionUtils.ts'],
  ['internal/core-nav-source/utils/PermissionUtils.ts', 'packages/navigation/src/map/utils/PermissionUtils.ts'],
  ['internal/core-nav-source/utils/RouteUtils.ts', 'packages/core/src/utils/RouteUtils.ts'],
  ['internal/core-nav-source/utils/RouteUtils.ts', 'packages/navigation/src/map/utils/RouteUtils.ts'],
  ['internal/core-nav-source/hooks/useRoutePlayback.ts', 'packages/core/src/hooks/useRoutePlayback.ts'],
  ['internal/core-nav-source/hooks/useRoutePlayback.ts', 'packages/navigation/src/map/hooks/useRoutePlayback.ts'],
  ['internal/core-nav-source/types/route-playback.types.ts', 'packages/core/src/types/route-playback.types.ts'],
  ['internal/core-nav-source/types/route-playback.types.ts', 'packages/navigation/src/map/types/route-playback.types.ts'],
  ['internal/core-nav-source/v3/map-runtime.ts', 'packages/core/src/v3/map-runtime.ts'],
  ['internal/core-nav-source/v3/map-runtime.ts', 'packages/navigation/src/map/v3/map-runtime.ts'],
  ['internal/core-nav-source/v3/capability-runtime.ts', 'packages/core/src/v3/capability-runtime.ts'],
  ['internal/core-nav-source/v3/capability-runtime.ts', 'packages/navigation/src/map/v3/capability-runtime.ts'],
];

const v3Pairs = [
  ['internal/v3-source/domain.ts', 'packages/core/src/v3/domain.ts'],
  ['internal/v3-source/domain.ts', 'packages/navigation/src/map/v3/domain.ts'],
  ['internal/v3-source/domain.ts', 'packages/search/src/v3/domain.ts'],
  ['internal/v3-source/domain.ts', 'packages/web-api/src/v3/domain.ts'],
  ['internal/v3-source/contracts.ts', 'packages/core/src/v3/contracts.ts'],
  ['internal/v3-source/contracts.ts', 'packages/navigation/src/map/v3/contracts.ts'],
  ['internal/v3-source/contracts.ts', 'packages/search/src/v3/contracts.ts'],
  ['internal/v3-source/contracts.ts', 'packages/web-api/src/v3/contracts.ts'],
  ['internal/v3-source/runtime.ts', 'packages/core/src/v3/runtime.ts'],
  ['internal/v3-source/runtime.ts', 'packages/navigation/src/map/v3/runtime.ts'],
  ['internal/v3-source/runtime.ts', 'packages/search/src/v3/runtime.ts'],
  ['internal/v3-source/runtime.ts', 'packages/web-api/src/v3/runtime.ts'],
  ['internal/v3-source/map-camera.ts', 'packages/core/src/v3/map-camera.ts'],
  ['internal/v3-source/map-camera.ts', 'packages/navigation/src/map/v3/map-camera.ts'],
  ['internal/v3-source/map-camera.ts', 'packages/search/src/v3/map-camera.ts'],
  ['internal/v3-source/map-camera.ts', 'packages/web-api/src/v3/map-camera.ts'],
  ['internal/v3-source/runtime-assembly.ts', 'packages/core/src/v3/runtime-assembly.ts'],
  ['internal/v3-source/runtime-assembly.ts', 'packages/navigation/src/map/v3/runtime-assembly.ts'],
  ['internal/v3-source/runtime-assembly.ts', 'packages/search/src/v3/runtime-assembly.ts'],
  ['internal/v3-source/runtime-assembly.ts', 'packages/web-api/src/v3/runtime-assembly.ts'],
  ['internal/v3-source/capability-selection.ts', 'packages/core/src/v3/capability-selection.ts'],
  ['internal/v3-source/capability-selection.ts', 'packages/navigation/src/map/v3/capability-selection.ts'],
  ['internal/v3-source/capability-selection.ts', 'packages/search/src/v3/capability-selection.ts'],
  ['internal/v3-source/capability-selection.ts', 'packages/web-api/src/v3/capability-selection.ts'],
];

async function readText(filePath) {
  return readFile(filePath, 'utf8');
}

async function validatePair(sourceRel, targetRel, banner) {
  const sourcePath = path.join(repoRoot, sourceRel);
  const targetPath = path.join(repoRoot, targetRel);
  const sourceContent = await readText(sourcePath);
  const targetContent = await readText(targetPath);
  const expected = `${banner}${sourceContent}`;

  if (targetContent !== expected) {
    return `${targetRel} is out of sync with ${sourceRel}`;
  }

  return null;
}

const errors = [];

for (const [sourceRel, targetRel] of coreNavPairs) {
  const error = await validatePair(sourceRel, targetRel, coreNavBanner);
  if (error) {
    errors.push(error);
  }
}

for (const [sourceRel, targetRel] of v3Pairs) {
  const error = await validatePair(sourceRel, targetRel, v3Banner);
  if (error) {
    errors.push(error);
  }
}

if (errors.length > 0) {
  console.error(
    '[check-shared-sync] Detected out-of-sync generated files. Please run `yarn sync:all-shared`.\n'
  );
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log('[check-shared-sync] OK');
