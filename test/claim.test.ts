import { describe, test, expect } from "bun:test";
import { runJson } from "./helpers";

describe("slpx claim", () => {
  test("requires wallet or address", async () => {
    const data = await runJson("claim --dry-run");
    expect(data.error).toBe(true);
    expect(data.code).toBe("NO_WALLET");
  });

  test("returns nothing-to-claim for typical address", async () => {
    const data = await runJson("claim --dry-run --address 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
    expect(data.error).toBe(true);
    expect(data.code).toBe("NOTHING_TO_CLAIM");
  });

  test("rejects non-EVM token", async () => {
    const data = await runJson("claim --dry-run --token vASTR --address 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
    expect(data.error).toBe(true);
    expect(data.code).toBe("UNSUPPORTED_TOKEN");
  });
});
