import { describe, expect, test } from "bun:test";
import { runJson } from "./helpers";

describe("slpx info", () => {
  test("returns vETH info with EVM fields", async () => {
    const data = await runJson("info");
    expect(data.protocol).toBe("Bifrost SLPx");
    expect(data.outputToken).toBe("vETH");
    expect(data.contract).toBe("0xc3997ff81f2831929499c4eE4Ee4e0F08F42D4D8");
    expect(data.chains).toContain("ethereum");
    expect(typeof data.paused).toBe("boolean");
    expect(data.inputToken).toBe("ETH");
    expect(Number.parseFloat(data.rate)).toBeGreaterThan(0);
    expect(Number.parseFloat(data.rate)).toBeCloseTo(
      Number.parseFloat(data.inputAmount) /
        Number.parseFloat(data.outputAmount),
      5,
    );
    expect(data.totalApy).toContain("%");
    expect(data.tvl).toContain("$");
    expect(Number.parseFloat(data.totalStaked)).toBeGreaterThan(0);
    expect(Number.parseFloat(data.totalSupply)).toBeGreaterThan(0);
    expect(String(data.totalStaked)).not.toMatch(/\s/);
    expect(String(data.totalSupply)).not.toMatch(/\s/);
    expect(typeof data.holders).toBe("number");
  });

  test("returns non-EVM token info without contract/chains/paused", async () => {
    const data = await runJson("info --token vDOT");
    expect(data.protocol).toBe("Bifrost SLPx");
    expect(data.outputToken).toBe("vDOT");
    expect(data.inputToken).toBe("DOT");
    expect(Number.parseFloat(data.rate)).toBeGreaterThan(0);
    expect(Number.parseFloat(data.totalStaked)).toBeGreaterThan(0);
    expect(Number.parseFloat(data.totalSupply)).toBeGreaterThan(0);
    expect(data.contract).toBeUndefined();
    expect(data.chains).toBeUndefined();
    expect(data.paused).toBeUndefined();
  });

  test("returns info for all vTokens", async () => {
    for (const token of [
      "vKSM",
      "vBNC",
      "vGLMR",
      "vMOVR",
      "vFIL",
      "vASTR",
      "vMANTA",
      "vPHA",
    ]) {
      const data = await runJson(`info --token ${token}`);
      expect(data.outputToken).toBe(token);
      expect(data.protocol).toBe("Bifrost SLPx");
      expect(typeof data.holders).toBe("number");
    }
  });

  test("TVL is a positive dollar value", async () => {
    const data = await runJson("info");
    const tvlStr = data.tvl.replace(/[$,]/g, "");
    expect(Number.parseFloat(tvlStr)).toBeGreaterThan(0);
  });
});
