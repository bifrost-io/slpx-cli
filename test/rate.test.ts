import { describe, expect, test } from "bun:test";
import { runCli, runJson } from "./helpers";

describe("slpx rate", () => {
  test("returns rate with default amount (1 ETH)", async () => {
    const data = await runJson("rate");
    expect(data.inputAmount).toBe("1");
    expect(data.inputToken).toBe("ETH");
    expect(data.outputToken).toBe("vETH");
    expect(Number.parseFloat(data.outputAmount)).toBeGreaterThan(0);
    expect(Number.parseFloat(data.rate)).toBeGreaterThan(0);
    expect(Number.parseFloat(data.rate)).toBeCloseTo(
      Number.parseFloat(data.inputAmount) /
        Number.parseFloat(data.outputAmount),
      5,
    );
    expect(data.source).toBe("api");
  });

  test("returns rate for custom amount", async () => {
    const data = await runJson("rate 10");
    expect(data.inputAmount).toBe("10");
    expect(data.inputToken).toBe("ETH");
    const num = Number.parseFloat(data.outputAmount);
    expect(num).toBeGreaterThan(5);
    expect(num).toBeLessThan(15);
  });

  test("returns rate for all vTokens", async () => {
    for (const token of ["vDOT", "vKSM", "vBNC", "vGLMR", "vMOVR"]) {
      const data = await runJson(`rate --token ${token}`);
      expect(data.outputToken).toBe(token);
      expect(data.source).toBe("api");
      const num = Number.parseFloat(data.outputAmount);
      expect(num).toBeGreaterThan(0);
    }
  });

  test("rejects zero amount", async () => {
    const data = await runJson("rate 0");
    expect(data.error).toBe(true);
    expect(data.code).toBe("INVALID_AMOUNT");
  });

  test("rejects non-numeric amount", async () => {
    const data = await runJson("rate abc");
    expect(data.error).toBe(true);
    expect(data.code).toBe("INVALID_AMOUNT");
  });

  test("outputs human-readable without --json", async () => {
    const result = await runCli("rate");
    expect(result.stdout).toContain("ETH");
    expect(result.stdout).toContain("vETH");
    expect(result.exitCode).toBe(0);
  });
});
