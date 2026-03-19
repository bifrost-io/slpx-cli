import { describe, test, expect } from "bun:test";
import { resolveToken, VALID_TOKENS } from "../src/lib/tokens";

describe("Token resolution", () => {
  test("resolves all 10 tokens case-insensitively", () => {
    for (const t of VALID_TOKENS) {
      expect(resolveToken(t.id)).toEqual(t);
      expect(resolveToken(t.id.toLowerCase())).toEqual(t);
      expect(resolveToken(t.id.toUpperCase())).toEqual(t);
    }
  });

  test("has exactly 10 tokens", () => {
    expect(VALID_TOKENS.length).toBe(10);
  });

  test("only vETH is EVM", () => {
    const evmTokens = VALID_TOKENS.filter(t => t.evm);
    expect(evmTokens.length).toBe(1);
    expect(evmTokens[0].id).toBe("vETH");
  });

  test("each token has unique baseAsset", () => {
    const assets = VALID_TOKENS.map(t => t.baseAsset);
    expect(new Set(assets).size).toBe(assets.length);
  });

  test("throws on unknown token", () => {
    expect(() => resolveToken("INVALID")).toThrow("Unknown token");
    expect(() => resolveToken("solana")).toThrow("Unknown token");
  });

  test("error message lists all valid tokens", () => {
    try {
      resolveToken("INVALID");
    } catch (e) {
      const msg = (e as Error).message;
      for (const t of VALID_TOKENS) {
        expect(msg).toContain(t.id);
      }
    }
  });
});
