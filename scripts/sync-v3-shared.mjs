import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const sources = [
  {
    source: path.join(repoRoot, 'internal/v3-source/domain.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/v3/domain.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/v3/domain.ts'),
      path.join(repoRoot, 'packages/search/src/v3/domain.ts'),
      path.join(repoRoot, 'packages/web-api/src/v3/domain.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/v3-source/contracts.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/v3/contracts.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/v3/contracts.ts'),
      path.join(repoRoot, 'packages/search/src/v3/contracts.ts'),
      path.join(repoRoot, 'packages/web-api/src/v3/contracts.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/v3-source/runtime.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/v3/runtime.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/v3/runtime.ts'),
      path.join(repoRoot, 'packages/search/src/v3/runtime.ts'),
      path.join(repoRoot, 'packages/web-api/src/v3/runtime.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/v3-source/map-camera.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/v3/map-camera.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/v3/map-camera.ts'),
      path.join(repoRoot, 'packages/search/src/v3/map-camera.ts'),
      path.join(repoRoot, 'packages/web-api/src/v3/map-camera.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/v3-source/runtime-assembly.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/v3/runtime-assembly.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/v3/runtime-assembly.ts'),
      path.join(repoRoot, 'packages/search/src/v3/runtime-assembly.ts'),
      path.join(repoRoot, 'packages/web-api/src/v3/runtime-assembly.ts'),
    ],
  },
  {
    source: path.join(repoRoot, 'internal/v3-source/capability-selection.ts'),
    targets: [
      path.join(repoRoot, 'packages/core/src/v3/capability-selection.ts'),
      path.join(repoRoot, 'packages/navigation/src/map/v3/capability-selection.ts'),
      path.join(repoRoot, 'packages/search/src/v3/capability-selection.ts'),
      path.join(repoRoot, 'packages/web-api/src/v3/capability-selection.ts'),
    ],
  },
];

const generatedBanner =
  '// This file is generated from internal/v3-source. Run `yarn sync:v3-shared` after editing the source files.\n';

for (const entry of sources) {
  const content = await readFile(entry.source, 'utf8');
  for (const target of entry.targets) {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, `${generatedBanner}${content}`);
  }
}
