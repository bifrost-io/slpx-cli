import { describe, test, expect } from "bun:test";
import { runJson } from "./helpers";

describe("slpx balance", () => {
  const ADDR = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

  test("returns balance on ethereum", async () => {
    const data = await runJson(`balance ${ADDR}`);
    expect(data.address).toContain("0x742d");
    expect(data.vethBalance).toContain("vETH");
    expect(data.ethValue).toContain("ETH");
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
    expect(data.results[0].vethBalance).toContain("vETH");
    expect(data.results[1].vethBalance).toContain("vETH");
    expect(data.chain).toBe("ethereum");
  });

  test("batch: rejects if any address is invalid", async () => {
    const data = await runJson(`balance ${ADDR},0xinvalid`);
    expect(data.error).toBe(true);
    expect(data.code).toBe("INVALID_ADDRESS");
  });
});
