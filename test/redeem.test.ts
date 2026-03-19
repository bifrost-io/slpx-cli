import { describe, test, expect } from "bun:test";
import { runJson } from "./helpers";

describe("slpx redeem", () => {
  test("rejects zero amount", async () => {
    const data = await runJson("redeem 0 --dry-run --address 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
    expect(data.error).toBe(true);
    expect(data.code).toBe("INVALID_AMOUNT");
  });

  test("requires wallet or address", async () => {
    const data = await runJson("redeem 0.1 --dry-run");
    expect(data.error).toBe(true);
    expect(data.code).toBe("NO_WALLET");
  });

  test("rejects non-EVM token", async () => {
    const data = await runJson("redeem 0.1 --dry-run --token vMANTA --address 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
    expect(data.error).toBe(true);
    expect(data.code).toBe("UNSUPPORTED_TOKEN");
  });
});
