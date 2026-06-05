import { describe, it, expect } from "vitest";
import { parseName } from "@/lib/auth/tripcode";

describe("parseName", () => {
  it("bare name returns name with no tripcode", () => {
    expect(parseName("Alice")).toEqual({ name: "Alice", tripcode: null });
  });

  it("null/undefined input returns null name + null trip", () => {
    expect(parseName(null)).toEqual({ name: null, tripcode: null });
    expect(parseName(undefined)).toEqual({ name: null, tripcode: null });
    expect(parseName("")).toEqual({ name: null, tripcode: null });
  });

  it("name#secret → name + tripcode starting with !", () => {
    const { name, tripcode } = parseName("Alice#hunter2");
    expect(name).toBe("Alice");
    expect(tripcode).toMatch(/^![A-Za-z0-9+/]{10}$/);
  });

  it("same secret → same tripcode (deterministic)", () => {
    const a = parseName("X#secretABC");
    const b = parseName("Y#secretABC");
    expect(a.tripcode).toBe(b.tripcode);
  });

  it("different secret → different tripcode", () => {
    const a = parseName("X#secretABC");
    const b = parseName("X#secretDEF");
    expect(a.tripcode).not.toBe(b.tripcode);
  });

  it("#secret with no name → null name + tripcode", () => {
    const { name, tripcode } = parseName("#mysecret");
    expect(name).toBeNull();
    expect(tripcode).toBeTruthy();
  });

  it("name# with no secret → name, no tripcode", () => {
    const { name, tripcode } = parseName("Alice#");
    expect(name).toBe("Alice");
    expect(tripcode).toBeNull();
  });
});
