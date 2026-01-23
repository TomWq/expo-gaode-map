
import { describe, test, expect, mock, afterEach } from "bun:test";
import { GaodeWebAPIClient } from "../src/utils/client";
import { LRUCache } from "../src/utils/lru";
import { GeocodeService } from "../src/services/GeocodeService";

describe("Performance", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("LRUCache should work correctly", () => {
    const cache = new LRUCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    
    cache.set("c", 3); // should evict "b" because "a" was accessed recently
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  test("Client should use cache when enabled", async () => {
    let callCount = 0;
    const mockFetch = mock(async () => {
      callCount++;
      return new Response(JSON.stringify({ status: "1", infocode: "10000", data: "test" }));
    });
    global.fetch = mockFetch as any;

    const client = new GaodeWebAPIClient({ 
        key: "test", 
        enableCache: true 
    });

    // First call
    await client.request("/test", { params: { q: "1" } });
    expect(callCount).toBe(1);

    // Second call with same params
    await client.request("/test", { params: { q: "1" } });
    expect(callCount).toBe(1); // Should be cached

    // Third call with different params
    await client.request("/test", { params: { q: "2" } });
    expect(callCount).toBe(2);
  });

  test("Batch interface should reject separator", async () => {
     const client = new GaodeWebAPIClient({ key: "test" });
     const service = new GeocodeService(client);
     
     // Mock fetch to avoid network error
     global.fetch = mock(async () => new Response("{}")) as any;

      expect(service.batchGeocode(["valid", "invalid|separator"])).rejects.toThrow(/cannot contain the "\|" separator/);
      expect(service.batchRegeocode(["116,39", "116,40|116,41"])).rejects.toThrow(/cannot contain the "\|" separator/);
  });
});
