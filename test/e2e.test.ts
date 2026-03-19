import { describe, test, expect } from "bun:test";
import { runJson } from "./helpers";

describe("E2E workflows", () => {
  test("research workflow: info → rate → apy", async () => {
    const info = await runJson("info");
    expect(info.protocol).toBe("Bifrost SLPx");

    const rate = await runJson("rate 1");
    expect(rate.source).toBe("api");
    expect(parseFloat(rate.output)).toBeGreaterThan(0);

    const apy = await runJson("apy");
    expect(parseFloat(apy.totalApy)).toBeGreaterThan(0);
  });

  test("multi-token comparison: vETH vs vDOT vs vKSM", async () => {
    const results = await Promise.all([
      runJson("apy --token vETH"),
      runJson("apy --token vDOT"),
      runJson("apy --token vKSM"),
    ]);
    for (const r of results) {
      expect(parseFloat(r.totalApy)).toBeGreaterThan(0);
    }
    expect(results[0].token).toBe("vETH");
    expect(results[1].token).toBe("vDOT");
    expect(results[2].token).toBe("vKSM");
  });

  test("multi-chain vETH balance comparison", async () => {
    const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
    const chains = ["ethereum", "base"];
    for (const chain of chains) {
      const data = await runJson(`balance ${addr} --chain ${chain}`);
      expect(data.chain).toBe(chain);
      expect(data.vethBalance).toContain("vETH");
    }
  });

  test("dry-run mint → check status", async () => {
    const mint = await runJson("mint 0.01 --dry-run");
    expect(mint.mode).toBe("unsigned");
    expect(mint.unsigned).toBeDefined();

    const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
    const status = await runJson(`status ${addr}`);
    expect(status.claimableEth).toContain("ETH");
  });

  test("all 10 tokens return valid rates", async () => {
    const tokens = ["vETH", "vDOT", "vKSM", "vBNC", "vGLMR", "vMOVR", "vFIL", "vASTR", "vMANTA", "vPHA"];
    for (const token of tokens) {
      const data = await runJson(`rate --token ${token}`);
      expect(data.token).toBe(token);
      expect(parseFloat(data.output)).toBeGreaterThan(0);
    }
  });

  test("JSON output is always valid JSON", async () => {
    const commands = ["rate", "apy", "info", "info --token vDOT"];
    for (const cmd of commands) {
      const data = await runJson(cmd);
      expect(typeof data).toBe("object");
      expect(data).not.toBeNull();
    }
  });
});
