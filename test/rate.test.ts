import { describe, test, expect } from "bun:test";
import { runJson, runCli } from "./helpers";

describe("slpx rate", () => {
  test("returns rate with default amount (1 ETH)", async () => {
    const data = await runJson("rate");
    expect(data.input).toBe("1 ETH");
    expect(data.output).toContain("vETH");
    expect(data.rate).toContain("1 ETH =");
    expect(data.token).toBe("vETH");
    expect(data.source).toBe("api");
  });

  test("returns rate for custom amount", async () => {
    const data = await runJson("rate 10");
    expect(data.input).toBe("10 ETH");
    const num = parseFloat(data.output);
    expect(num).toBeGreaterThan(5);
    expect(num).toBeLessThan(15);
  });

  test("returns rate for all vTokens", async () => {
    for (const token of ["vDOT", "vKSM", "vBNC", "vGLMR", "vMOVR"]) {
      const data = await runJson(`rate --token ${token}`);
      expect(data.token).toBe(token);
      expect(data.source).toBe("api");
      const num = parseFloat(data.output);
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
