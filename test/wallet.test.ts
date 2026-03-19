import { describe, test, expect } from "bun:test";
import { formatAddress, isValidAddress, normalizeAddress } from "../src/lib/wallet";

describe("Wallet utilities", () => {
  test("formatAddress truncates correctly", () => {
    const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
    expect(formatAddress(addr)).toBe("0x742d...bD18");
  });

  test("isValidAddress accepts valid addresses", () => {
    expect(isValidAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18")).toBe(true);
    expect(isValidAddress("0x0000000000000000000000000000000000000000")).toBe(true);
  });

  test("isValidAddress rejects invalid addresses", () => {
    expect(isValidAddress("0x123")).toBe(false);
    expect(isValidAddress("not-an-address")).toBe(false);
    expect(isValidAddress("")).toBe(false);
  });

  test("normalizeAddress checksums correctly", () => {
    const addr = "0x742d35cc6634c0532925a3b844bc9e7595f2bd18";
    const normalized = normalizeAddress(addr);
    expect(normalized).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(normalized.toLowerCase()).toBe(addr);
  });
});
