import { describe, test, expect } from "bun:test";
import { runJson } from "./helpers";

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
});
