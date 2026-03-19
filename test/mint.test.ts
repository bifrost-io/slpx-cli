import { describe, test, expect } from "bun:test";
import { runJson } from "./helpers";

describe("slpx mint", () => {
  test("dry-run produces unsigned tx", async () => {
    const data = await runJson("mint 0.01 --dry-run");
    expect(data.action).toBe("mint");
    expect(data.input).toBe("0.01 ETH");
    expect(data.expected).toContain("vETH");
    expect(data.mode).toBe("unsigned");
    expect(data.unsigned).toBeDefined();
    expect(data.unsigned.to).toBe("0xc3997ff81f2831929499c4eE4Ee4e0F08F42D4D8");
  });

  test("works on arbitrum chain", async () => {
    const data = await runJson("mint 0.01 --dry-run --chain arbitrum");
    expect(data.unsigned.chainId).toBe(42161);
  });

  test("rejects zero amount", async () => {
    const data = await runJson("mint 0 --dry-run");
    expect(data.error).toBe(true);
    expect(data.code).toBe("INVALID_AMOUNT");
  });

  test("rejects non-numeric amount", async () => {
    const data = await runJson("mint abc --dry-run");
    expect(data.error).toBe(true);
    expect(data.code).toBe("INVALID_AMOUNT");
  });

  test("rejects non-EVM token", async () => {
    const data = await runJson("mint 0.1 --dry-run --token vDOT");
    expect(data.error).toBe(true);
    expect(data.code).toBe("UNSUPPORTED_TOKEN");
  });
});
