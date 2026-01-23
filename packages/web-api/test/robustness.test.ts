
import { describe, test, expect, mock, afterEach } from "bun:test";
import { GaodeWebAPIClient } from "../src/utils/client";
import { validateCoordinate } from "../src/utils/validators";
import { GeocodeService } from "../src/services/GeocodeService";

describe("Robustness", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("should retry on retryable errors", async () => {
    let callCount = 0;
    const mockFetch = mock(async () => {
      callCount++;
      if (callCount < 3) {
        // Mock a retryable error (e.g., SERVER_IS_BUSY 10016)
        return new Response(JSON.stringify({ status: "0", info: "SERVER_IS_BUSY", infocode: "10016" }));
      }
      return new Response(JSON.stringify({ status: "1", infocode: "10000", regeocode: {} }));
    });
    global.fetch = mockFetch as any;

    const client = new GaodeWebAPIClient({ key: "test", retryDelay: 10 }); // fast retry
    await client.request("/test");
    expect(callCount).toBe(3);
  });

  test("should NOT retry on non-retryable errors", async () => {
    let callCount = 0;
    const mockFetch = mock(async () => {
      callCount++;
      // INVALID_USER_KEY 10001 is not retryable
      return new Response(JSON.stringify({ status: "0", info: "INVALID_USER_KEY", infocode: "10001" }));
    });
    global.fetch = mockFetch as any;

    const client = new GaodeWebAPIClient({ key: "test", retryDelay: 10 });
    try {
        await client.request("/test");
    } catch (e) {
        // expected
    }
    expect(callCount).toBe(1);
  });

  test("should abort request", async () => {
    const mockFetch = mock(async (_url, options) => {
       return new Promise((_resolve, reject) => {
         const signal = options.signal;
         if (signal) {
            if (signal.aborted) {
                reject(new DOMException('Aborted', 'AbortError'));
            }
            signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
         }
         // never resolve
       });
    });
    global.fetch = mockFetch as any;

    const client = new GaodeWebAPIClient({ key: "test" });
    const controller = new AbortController();
    
    const promise = client.request("/test", { signal: controller.signal });
    setTimeout(() => controller.abort(), 10);
    
    try {
      await promise;
      expect(true).toBe(false); // should not reach here
    } catch (e: any) {
      expect(e.message).toBe("Request aborted");
    }
  });

  test("should validate coordinates", () => {
    expect(() => validateCoordinate("invalid")).toThrow();
    expect(() => validateCoordinate("116.481028,39.989643")).not.toThrow();
    expect(() => validateCoordinate("116.48,39.98")).not.toThrow();
    expect(() => validateCoordinate("116,39")).not.toThrow();
  });
  
  test("Service should throw on invalid coordinate", async () => {
     const client = new GaodeWebAPIClient({ key: "test" });
     const service = new GeocodeService(client);
     
     // We mock fetch just in case validation fails to prevent actual network call (though validation should fail before)
     global.fetch = mock(async () => new Response("{}")) as any;

      expect(service.regeocode("invalid")).rejects.toThrow(/Invalid coordinate format/);
  });
});
