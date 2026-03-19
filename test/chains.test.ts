import { describe, test, expect } from "bun:test";
import { resolveChain, chains } from "../src/lib/chains";

describe("Chain resolution", () => {
  test("resolves all 4 chains", () => {
    for (const name of ["ethereum", "base", "optimism", "arbitrum"]) {
      const chain = resolveChain({ chain: name });
      expect(chain.name).toBe(name);
      expect(chain.chainId).toBeGreaterThan(0);
      expect(chain.rpc).toContain("http");
      expect(chain.explorer).toContain("http");
    }
  });

  test("defaults to ethereum", () => {
    const chain = resolveChain({});
    expect(chain.name).toBe("ethereum");
  });

  test("throws on unknown chain", () => {
    expect(() => resolveChain({ chain: "solana" })).toThrow("Unknown chain");
  });

  test("custom RPC overrides", () => {
    const chain = resolveChain({ chain: "ethereum", rpc: "https://my-rpc.io" });
    expect(chain.rpc).toBe("https://my-rpc.io");
    expect(chain.name).toBe("ethereum");
  });

  test("all chains have required fields", () => {
    for (const [, config] of Object.entries(chains)) {
      expect(config.weth).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(config.fallbackRpc).toContain("http");
    }
  });
});
