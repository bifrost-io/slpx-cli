import { describe, test, expect } from "bun:test";
import { fetchTokenStats, deriveRate, fetchLpPools } from "../src/lib/api";
import { VALID_TOKENS } from "../src/lib/tokens";

describe("Bifrost API", () => {
  test("fetchTokenStats returns valid data for all tokens", async () => {
    for (const token of VALID_TOKENS) {
      const stats = await fetchTokenStats(token.id);
      expect(typeof stats.apy).toBe("number");
      expect(typeof stats.tvl).toBe("number");
      expect(stats.tvm).toBeGreaterThan(0);
      expect(stats.totalIssuance).toBeGreaterThan(0);
      expect(typeof stats.holders).toBe("number");
    }
  });

  test("deriveRate returns valid rates for all tokens", async () => {
    for (const token of VALID_TOKENS) {
      const stats = await fetchTokenStats(token.id);
      const rate = deriveRate(stats);
      expect(rate.baseToToken).toBeGreaterThan(0);
      expect(rate.tokenToBase).toBeGreaterThan(0);
      const product = rate.baseToToken * rate.tokenToBase;
      expect(Math.abs(product - 1)).toBeLessThan(0.001);
    }
  });

  test("deriveRate throws on zero tvm", () => {
    expect(() => deriveRate({ tvm: 0, totalIssuance: 100 } as any)).toThrow("Invalid rate data");
  });

  test("fetchTokenStats throws on unknown token", async () => {
    try {
      await fetchTokenStats("NONEXISTENT");
      expect(true).toBe(false);
    } catch (e) {
      expect((e as Error).message).toContain("Missing NONEXISTENT");
    }
  });

  test("fetchLpPools returns pools for vDOT", async () => {
    const pools = await fetchLpPools("vDOT");
    expect(Array.isArray(pools)).toBe(true);
    if (pools.length > 0) {
      expect(pools[0].symbol).toBeDefined();
      expect(pools[0].project).toBeDefined();
      expect(pools[0].tvl).toBeGreaterThan(0);
      expect(typeof pools[0].apy).toBe("number");
    }
  });

  test("fetchLpPools returns empty for rare token", async () => {
    const pools = await fetchLpPools("NONEXISTENT_TOKEN_XYZ");
    expect(Array.isArray(pools)).toBe(true);
    expect(pools.length).toBe(0);
  });
});
