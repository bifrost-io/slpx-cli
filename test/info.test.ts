import { describe, test, expect } from "bun:test";
import { runJson } from "./helpers";

describe("slpx info", () => {
  test("returns vETH info with EVM fields", async () => {
    const data = await runJson("info");
    expect(data.protocol).toBe("Bifrost SLPx");
    expect(data.token).toBe("vETH");
    expect(data.contract).toBe("0xc3997ff81f2831929499c4eE4Ee4e0F08F42D4D8");
    expect(data.chains).toContain("ethereum");
    expect(typeof data.paused).toBe("boolean");
    expect(data.rate).toContain("1 ETH =");
    expect(data.totalApy).toContain("%");
    expect(data.tvl).toContain("$");
    expect(data.totalStaked).toContain("ETH");
    expect(data.totalSupply).toContain("vETH");
    expect(typeof data.holders).toBe("number");
  });

  test("returns non-EVM token info without contract/chains/paused", async () => {
    const data = await runJson("info --token vDOT");
    expect(data.protocol).toBe("Bifrost SLPx");
    expect(data.token).toBe("vDOT");
    expect(data.rate).toContain("1 DOT =");
    expect(data.totalStaked).toContain("DOT");
    expect(data.totalSupply).toContain("vDOT");
    expect(data.contract).toBeUndefined();
    expect(data.chains).toBeUndefined();
    expect(data.paused).toBeUndefined();
  });

  test("returns info for all vTokens", async () => {
    for (const token of ["vKSM", "vBNC", "vGLMR", "vMOVR", "vFIL", "vASTR", "vMANTA", "vPHA"]) {
      const data = await runJson(`info --token ${token}`);
      expect(data.token).toBe(token);
      expect(data.protocol).toBe("Bifrost SLPx");
      expect(typeof data.holders).toBe("number");
    }
  });

  test("TVL is a positive dollar value", async () => {
    const data = await runJson("info");
    const tvlStr = data.tvl.replace(/[$,]/g, "");
    expect(parseFloat(tvlStr)).toBeGreaterThan(0);
  });
});
