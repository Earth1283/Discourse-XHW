import { describe, it, expect, beforeEach, vi } from "vitest";

// Re-import fresh module per test block (buckets are module-level state)
// Use vi.isolateModules to get a fresh rateLimit each test
describe("rateLimit", () => {
  let rateLimit: (key: string, max: number, windowMs: number) => boolean;

  beforeEach(async () => {
    vi.resetModules();
    ({ rateLimit } = await import("@/lib/ratelimit/index"));
  });

  it("allows up to max requests", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("key1", 3, 60_000)).toBe(true);
    }
  });

  it("blocks after max exhausted", () => {
    rateLimit("k", 2, 60_000);
    rateLimit("k", 2, 60_000);
    expect(rateLimit("k", 2, 60_000)).toBe(false);
  });

  it("different keys are independent", () => {
    rateLimit("a", 1, 60_000); // exhaust key 'a'
    expect(rateLimit("b", 1, 60_000)).toBe(true); // 'b' still fresh
  });

  it("refills after time window passes", async () => {
    vi.useFakeTimers();
    rateLimit("r", 1, 1_000);
    rateLimit("r", 1, 1_000); // exhaust
    expect(rateLimit("r", 1, 1_000)).toBe(false);

    vi.advanceTimersByTime(1_500); // past 1s window
    expect(rateLimit("r", 1, 1_000)).toBe(true);
    vi.useRealTimers();
  });
});
