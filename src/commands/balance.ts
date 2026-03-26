import type { Command } from "commander";
import { formatEther } from "viem";
import { vethAbi } from "../lib/abi.js";
import { VETH_ADDRESS } from "../lib/chains.js";
import { getPublicClient } from "../lib/client.js";
import { evmTokenError, resolveChainOrError } from "../lib/evm-setup.js";
import { print, printError } from "../lib/output.js";
import {
  formatAddress,
  isValidAddress,
  loadWallet,
  normalizeAddress,
} from "../lib/wallet.js";

export function balanceCmd(program: Command) {
  program
    .command("balance [address]")
    .description(
      "Query vETH balance — omit address to use environment variable BIFROST_SKILL_PRIVATEKEY; comma-separated for batch (EVM only)",
    )
    .action(async (rawAddress?: string) => {
      const opts = program.opts();

      const tokenErr = evmTokenError(opts, "On-chain balance query");
      if (tokenErr) {
        return printError(tokenErr.code, tokenErr.message, opts.json);
      }

      const trimmed = rawAddress?.trim() ?? "";
      let addresses: string[];

      if (!trimmed) {
        const wallet = loadWallet();
        if (!wallet) {
          return printError(
            "NO_ADDRESS_OR_PRIVATE_KEY",
            "Provide an address argument or set environment variable BIFROST_SKILL_PRIVATEKEY.",
            opts.json,
          );
        }
        addresses = [wallet.address];
      } else {
        addresses = trimmed
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);
        if (addresses.length === 0) {
          return printError(
            "INVALID_ADDRESS",
            "No valid addresses. Expected 0x + 40 hex chars (comma-separated for batch).",
            opts.json,
          );
        }
        for (const addr of addresses) {
          if (!isValidAddress(addr)) {
            return printError(
              "INVALID_ADDRESS",
              "Invalid Ethereum address. Expected 0x + 40 hex chars.",
              opts.json,
            );
          }
        }
      }

      const chain = resolveChainOrError(opts);
      if ("code" in chain) {
        return printError(chain.code, chain.message, opts.json);
      }

      try {
        const client = getPublicClient(chain);

        if (addresses.length === 1) {
          const addr = normalizeAddress(addresses[0]);
          const balance = await client.readContract({
            address: VETH_ADDRESS,
            abi: vethAbi,
            functionName: "balanceOf",
            args: [addr],
          });
          const ethValue = await client.readContract({
            address: VETH_ADDRESS,
            abi: vethAbi,
            functionName: "convertToAssets",
            args: [balance],
          });
          print(
            {
              address: formatAddress(addresses[0]),
              vethBalance: formatEther(balance),
              ethValue: formatEther(ethValue),
              chain: chain.name,
            },
            opts.json,
          );
          return;
        }

        const results = await Promise.all(
          addresses.map(async (raw) => {
            const addr = normalizeAddress(raw);
            const balance = await client.readContract({
              address: VETH_ADDRESS,
              abi: vethAbi,
              functionName: "balanceOf",
              args: [addr],
            });
            const ethValue = await client.readContract({
              address: VETH_ADDRESS,
              abi: vethAbi,
              functionName: "convertToAssets",
              args: [balance],
            });
            return {
              address: formatAddress(raw),
              vethBalance: formatEther(balance),
              ethValue: formatEther(ethValue),
            };
          }),
        );

        print({ results, chain: chain.name }, opts.json);
      } catch (e) {
        printError(
          "RPC_ERROR",
          `Failed to query balance: ${(e as Error).message}`,
          opts.json,
        );
      }
    });
}
