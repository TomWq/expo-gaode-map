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
    expect(stressExampleSource).toContain('return `marker-stress-${markerId}-${variant}`;');
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
