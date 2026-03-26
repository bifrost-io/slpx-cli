import { describe, expect, test } from "bun:test";
import { runJson } from "./helpers";

/** Default Anvil/Hardhat account #0 — only for “balance without address” test. */
const ANVIL_KEY0 =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

describe("slpx balance", () => {
  const ADDR = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

  test("without address requires private key", async () => {
    const data = await runJson("balance");
    expect(data.error).toBe(true);
    expect(data.code).toBe("NO_ADDRESS_OR_PRIVATE_KEY");
  });

  test("without address uses BIFROST_SKILL_PRIVATEKEY", async () => {
    const data = await runJson("balance", {
      BIFROST_SKILL_PRIVATEKEY: ANVIL_KEY0,
    });
    expect(data.error).not.toBe(true);
    expect(data.address).toContain("0xf39F");
    expect(Number.parseFloat(data.vethBalance)).toBeGreaterThanOrEqual(0);
    expect(data.chain).toBe("ethereum");
  });

  test("returns balance on ethereum", async () => {
    const data = await runJson(`balance ${ADDR}`);
    expect(data.address).toContain("0x742d");
    expect(Number.parseFloat(data.vethBalance)).toBeGreaterThanOrEqual(0);
    expect(Number.parseFloat(data.ethValue)).toBeGreaterThanOrEqual(0);
    expect(String(data.vethBalance)).not.toMatch(/\s/);
    expect(String(data.ethValue)).not.toMatch(/\s/);
    expect(data.chain).toBe("ethereum");
  });

  test("works on base chain", async () => {
    const data = await runJson(`balance ${ADDR} --chain base`);
    expect(data.chain).toBe("base");
  });

  test("rejects invalid address", async () => {
    const data = await runJson("balance 0x123");
    expect(data.error).toBe(true);
    expect(data.code).toBe("INVALID_ADDRESS");
  });

  test("rejects non-EVM token", async () => {
    const data = await runJson(`balance ${ADDR} --token vDOT`);
    expect(data.error).toBe(true);
    expect(data.code).toBe("UNSUPPORTED_TOKEN");
  });

  test("batch: returns results for multiple addresses", async () => {
    const ADDR2 = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
    const data = await runJson(`balance ${ADDR},${ADDR2}`);
    expect(data.results).toBeDefined();
    expect(data.results.length).toBe(2);
    expect(
      Number.parseFloat(data.results[0].vethBalance),
    ).toBeGreaterThanOrEqual(0);
    expect(
      Number.parseFloat(data.results[1].vethBalance),
    ).toBeGreaterThanOrEqual(0);
    expect(data.chain).toBe("ethereum");
  });

  test("batch: rejects if any address is invalid", async () => {
    const data = await runJson(`balance ${ADDR},0xinvalid`);
    expect(data.error).toBe(true);
    expect(data.code).toBe("INVALID_ADDRESS");
  });
});
