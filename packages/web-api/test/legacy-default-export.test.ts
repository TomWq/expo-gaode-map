import { describe, expect, it } from 'bun:test';

import DefaultExport, { GaodeWebAPI, V3WebAPI } from '../src/index';
import LegacyEntryDefault, { LegacyWebAPI } from '../src/legacy';

describe('legacy default export compatibility', () => {
  it('default export should remain GaodeWebAPI class', () => {
    expect(DefaultExport).toBe(GaodeWebAPI);
  });

  it('V3WebAPI should expose runtime/provider factories', () => {
    expect(typeof V3WebAPI.createWebRuntime).toBe('function');
    expect(typeof V3WebAPI.createWebSearchProvider).toBe('function');
  });

  it('legacy subpath should remain an explicit alias of GaodeWebAPI', () => {
    expect(LegacyEntryDefault).toBe(GaodeWebAPI);
    expect(LegacyWebAPI).toBe(GaodeWebAPI);
  });
});
