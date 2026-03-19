import { describe, test, expect } from "bun:test";
import { runCli, runJson } from "./helpers";

describe("CLI general", () => {
  test("--version outputs version", async () => {
    const result = await runCli("--version");
    expect(result.stdout).toBe("0.2.0");
    expect(result.exitCode).toBe(0);
  });

  test("--help outputs usage info", async () => {
    const result = await runCli("--help");
    expect(result.stdout).toContain("Bifrost SLPx");
    expect(result.stdout).toContain("rate");
    expect(result.stdout).toContain("balance");
    expect(result.stdout).toContain("mint");
    expect(result.stdout).toContain("--token");
    expect(result.exitCode).toBe(0);
  });

  test("unknown command shows help", async () => {
    const result = await runCli("unknown");
    expect(result.exitCode).toBe(1);
  });

  test("--chain rejects unknown chain", async () => {
    const commands = [
      "rate --chain solana --json",
      "balance 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --chain solana --json",
      "info --chain solana --json",
      "mint 0.01 --dry-run --chain solana --json",
    ];
    for (const cmd of commands) {
      const result = await runCli(cmd);
      const data = JSON.parse(result.stdout);
      expect(data.error).toBe(true);
      expect(data.code).toBe("INVALID_CHAIN");
      expect(data.message).toContain("ethereum, base, optimism, arbitrum");
    }
  });

  test("--token rejects unknown token", async () => {
    const commands = [
      "rate --token INVALID --json",
      "apy --token INVALID --json",
      "info --token INVALID --json",
    ];
    for (const cmd of commands) {
      const data = await runJson(cmd.replace(" --json", ""));
      expect(data.error).toBe(true);
      expect(data.code).toBe("INVALID_TOKEN");
      expect(data.message).toContain("vETH");
      expect(data.message).toContain("vDOT");
    }
  });

  test("non-EVM token rejects on-chain commands", async () => {
    const commands = [
      "balance 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --token vDOT",
      "mint 0.1 --dry-run --token vKSM",
      "redeem 0.1 --dry-run --address 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --token vMANTA",
      "claim --dry-run --address 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --token vASTR",
      "status 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --token vFIL",
    ];
    for (const cmd of commands) {
      const data = await runJson(cmd);
      expect(data.error).toBe(true);
      expect(data.code).toBe("UNSUPPORTED_TOKEN");
      expect(data.message).toContain("Substrate");
    }
  });
});
