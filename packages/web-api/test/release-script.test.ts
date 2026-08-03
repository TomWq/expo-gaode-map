import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'bun:test';

const publishScript = readFileSync(resolve(__dirname, '../../../scripts/publish.sh'), 'utf8');

describe('Web API release manifest handling', () => {
  test('keeps the published version when restoring workspace dependencies', () => {
    expect(publishScript).toContain('workspace.version=published.version');
    expect(publishScript).toContain("fs.unlinkSync('package.json.backup')");
    expect(publishScript).not.toContain('mv package.json.backup package.json');
  });
});
