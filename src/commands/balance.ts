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
    .description("Query vETH balance for an address (EVM only)")
    .action(async (address: string) => {
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

      if (!isValidAddress(address)) {
        return printError("INVALID_ADDRESS", "Invalid Ethereum address. Expected 0x + 40 hex chars.", opts.json);
      }
      const addr = normalizeAddress(address);

      let chain;
      try {
        chain = resolveChain(opts);
      } catch (e) {
        return printError("INVALID_CHAIN", (e as Error).message, opts.json);
      }

      try {
        const client = getPublicClient(chain);
        const balance = await client.readContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "balanceOf", args: [addr],
        });
        const ethValue = await client.readContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "convertToAssets", args: [balance],
        });

        print({
          address: formatAddress(address),
          vethBalance: `${formatEther(balance)} vETH`,
          ethValue: `${formatEther(ethValue)} ETH`,
          chain: chain.name,
        }, opts.json);
      } catch (e) {
        printError("RPC_ERROR", `Failed to query balance: ${(e as Error).message}`, opts.json);
      }
    });
}
