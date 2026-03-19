import { describe, test, expect } from "bun:test";
import { runJson } from "./helpers";

describe("slpx status", () => {
  const ADDR = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

  test("returns redemption status", async () => {
    const data = await runJson(`status ${ADDR}`);
    expect(data.claimableEth).toContain("ETH");
    expect(data.pendingAmount).toContain("ETH");
    expect(data.chain).toBe("ethereum");
    expect(data.hint).toBeDefined();
  });

  test("rejects non-EVM token", async () => {
    const data = await runJson(`status ${ADDR} --token vKSM`);
    expect(data.error).toBe(true);
    expect(data.code).toBe("UNSUPPORTED_TOKEN");
  });
});
