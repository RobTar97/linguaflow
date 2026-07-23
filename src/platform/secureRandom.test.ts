import { describe, expect, it } from "vitest";
import { secureRandomInt } from "./secureRandom";

describe("secureRandomInt", () => {
  it("stays within the requested bounds", () => {
    for (const upperBound of [1, 24, 900, 65_537]) {
      for (let sample = 0; sample < 100; sample += 1) {
        const value = secureRandomInt(upperBound);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(upperBound);
      }
    }
  });

  it("rejects invalid bounds", () => {
    for (const invalid of [0, -1, 1.5, Number.NaN, 0x1_0000_0001]) {
      expect(() => secureRandomInt(invalid)).toThrow(RangeError);
    }
  });
});
