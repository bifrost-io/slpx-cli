import { describe, expect, test } from "bun:test";
import { runJson } from "./helpers";

/** Default Anvil/Hardhat account #0 — only for “status without address” test. */
const ANVIL_KEY0 =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("slpx status", () => {
  const ADDR = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

  test("without address requires private key", async () => {
    const data = await runJson("status");
    expect(data.error).toBe(true);
    expect(data.code).toBe("NO_ADDRESS_OR_PRIVATE_KEY");
  });

  test("without address uses BIFROST_SKILL_PRIVATEKEY", async () => {
    const data = await runJson("status", {
      BIFROST_SKILL_PRIVATEKEY: ANVIL_KEY0,
    });
    expect(data.error).not.toBe(true);
    expect(data.address).toContain("0xf39F");
    expect(Number.parseFloat(data.claimableEth)).toBeGreaterThanOrEqual(0);
    expect(data.chain).toBe("ethereum");
  });

  test("returns redemption status", async () => {
    const data = await runJson(`status ${ADDR}`);
    expect(Number.parseFloat(data.claimableEth)).toBeGreaterThanOrEqual(0);
    expect(Number.parseFloat(data.pendingEthAmount)).toBeGreaterThanOrEqual(0);
    expect(String(data.claimableEth)).not.toMatch(/\s/);
    expect(String(data.pendingEthAmount)).not.toMatch(/\s/);
    expect(data.chain).toBe("ethereum");
    expect(data.hint).toBeDefined();
  });

  test("rejects non-EVM token", async () => {
    const data = await runJson(`status ${ADDR} --token vKSM`);
    expect(data.error).toBe(true);
    expect(data.code).toBe("UNSUPPORTED_TOKEN");
  });
});
