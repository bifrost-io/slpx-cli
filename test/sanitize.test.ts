import { describe, expect, test } from "bun:test";
import { sanitizeErrorMessage } from "../src/lib/sanitize";

describe("sanitizeErrorMessage", () => {
  test("strips angle brackets and quotes", () => {
    expect(sanitizeErrorMessage(`bad <script> & "'`)).toBe("bad script");
  });

  test("replaces control characters", () => {
    expect(sanitizeErrorMessage("a\n\tb")).toBe("a b");
  });

  test("truncates very long strings", () => {
    const long = "x".repeat(500);
    const out = sanitizeErrorMessage(long);
    expect(out.length).toBeLessThanOrEqual(240);
    expect(out.endsWith("…")).toBe(true);
  });
});
