import { describe, test, expect } from "bun:test";
import { runCli, runJson } from "./helpers";

describe("slpx apy", () => {
  test("returns APY for default vETH", async () => {
    const data = await runJson("apy");
    expect(data.token).toBe("vETH");
    expect(data.totalApy).toContain("%");
    expect(data.baseApy).toContain("%");
    expect(data.rewardApy).toContain("%");
  });

  test("APY values are reasonable", async () => {
    const data = await runJson("apy");
    const total = parseFloat(data.totalApy);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThan(100);
  });

  test("returns APY for all vTokens", async () => {
    for (const token of ["vDOT", "vKSM", "vBNC", "vGLMR", "vMOVR", "vFIL", "vASTR", "vMANTA", "vPHA"]) {
      const data = await runJson(`apy --token ${token}`);
      expect(data.token).toBe(token);
      expect(data.totalApy).toContain("%");
      const apy = parseFloat(data.totalApy);
      expect(apy).toBeGreaterThanOrEqual(0);
      expect(apy).toBeLessThan(100);
    }
  });

  test("total APY ≈ base + reward", async () => {
    const data = await runJson("apy");
    const total = parseFloat(data.totalApy);
    const base = parseFloat(data.baseApy);
    const reward = parseFloat(data.rewardApy);
    expect(Math.abs(total - base - reward)).toBeLessThan(1);
  });

  test("--lp flag returns LP pool data for vDOT", async () => {
    const result = await runCli("apy --token vDOT --lp --json");
    const data = JSON.parse(result.stdout);
    expect(data.token).toBe("vDOT");
    expect(data.totalApy).toContain("%");
    expect(data.lpPools).toBeDefined();
    expect(Array.isArray(data.lpPools)).toBe(true);
  });

  test("--lp pool entries have required fields", async () => {
    const result = await runCli("apy --token vETH --lp --json");
    const data = JSON.parse(result.stdout);
    if (data.lpPools && data.lpPools.length > 0) {
      const pool = data.lpPools[0];
      expect(pool.symbol).toBeDefined();
      expect(pool.project).toBeDefined();
      expect(pool.lpApy).toContain("%");
      expect(pool.tvl).toContain("$");
    }
  });

  test("apy without --lp has no lpPools field", async () => {
    const data = await runJson("apy");
    expect(data.lpPools).toBeUndefined();
  });
});
