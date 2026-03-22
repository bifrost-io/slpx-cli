import type { Command } from "commander";
import { getPublicClient } from "../lib/client.js";
import { resolveChain, VETH_ADDRESS } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { vethAbi } from "../lib/abi.js";
import { print, printError } from "../lib/output.js";
import { formatEther } from "viem";
import { formatAddress, isValidAddress, normalizeAddress } from "../lib/wallet.js";

export function balanceCmd(program: Command) {
  program
    .command("balance <address>")
    .description("Query vETH balance for address(es) — comma-separated for batch (EVM only)")
    .action(async (rawAddress: string) => {
      const opts = program.opts();

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }
      if (!token.evm) {
        return printError("UNSUPPORTED_TOKEN",
          `On-chain balance query only supports vETH (EVM). ${token.id} is on Substrate chains.`, opts.json);
      }

      const addresses = rawAddress.split(",").map(a => a.trim()).filter(Boolean);

      for (const addr of addresses) {
        if (!isValidAddress(addr)) {
          return printError("INVALID_ADDRESS", `Invalid address: ${addr}. Expected 0x + 40 hex chars.`, opts.json);
        }
      }

      let chain;
      try {
        chain = resolveChain(opts);
      } catch (e) {
        return printError("INVALID_CHAIN", (e as Error).message, opts.json);
      }

      try {
        const client = getPublicClient(chain);

        if (addresses.length === 1) {
          const addr = normalizeAddress(addresses[0]);
          const balance = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "balanceOf", args: [addr],
          });
          const ethValue = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "convertToAssets", args: [balance],
          });
          print({
            address: formatAddress(addresses[0]),
            vethBalance: `${formatEther(balance)} vETH`,
            ethValue: `${formatEther(ethValue)} ETH`,
            chain: chain.name,
          }, opts.json);
          return;
        }

        const results = await Promise.all(addresses.map(async (raw) => {
          const addr = normalizeAddress(raw);
          const balance = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "balanceOf", args: [addr],
          });
          const ethValue = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "convertToAssets", args: [balance],
          });
          return {
            address: formatAddress(raw),
            vethBalance: `${formatEther(balance)} vETH`,
            ethValue: `${formatEther(ethValue)} ETH`,
          };
        }));

        print({ results, chain: chain.name }, opts.json);
      } catch (e) {
        printError("RPC_ERROR", `Failed to query balance: ${(e as Error).message}`, opts.json);
      }
    });
}
