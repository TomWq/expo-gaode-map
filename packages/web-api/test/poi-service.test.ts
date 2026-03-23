import { afterEach, describe, expect, mock, test } from 'bun:test';

import { POIService } from '../src/services/POIService';
import { GaodeWebAPIClient } from '../src/utils/client';

describe('POIService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('getAOIBoundary should call v5 aoi polyline endpoint', async () => {
    let requestedUrl = '';

    global.fetch = mock(async (input: string | URL) => {
      requestedUrl = String(input);
      return new Response(
        JSON.stringify({
          status: '1',
          info: 'OK',
          infocode: '10000',
          aois: {
            id: 'test-aoi-id',
            name: 'Test AOI',
            polyline: '116.1,39.1;116.2,39.2',
          },
        })
      );
    }) as unknown as typeof fetch;

    const client = new GaodeWebAPIClient({ key: 'test-key' });
    const service = new POIService(client);

    const result = await service.getAOIBoundary('test-aoi-id', {
      parameters: 'test',
    });

    expect(requestedUrl).toContain('/v5/aoi/polyline');
    expect(requestedUrl).toContain('key=test-key');
    expect(requestedUrl).toContain('id=test-aoi-id');
    expect(requestedUrl).toContain('parameters=test');

    expect(Array.isArray(result.aois)).toBe(false);
    expect((result.aois as { id?: string })?.id).toBe('test-aoi-id');
  });
});
