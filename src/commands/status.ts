import type { Command } from "commander";
import { formatEther } from "viem";
import { vethAbi } from "../lib/abi.js";
import { type ChainConfig, VETH_ADDRESS, resolveChain } from "../lib/chains.js";
import { getPublicClient } from "../lib/client.js";
import { print, printError } from "../lib/output.js";
import { type TokenInfo, resolveToken } from "../lib/tokens.js";
import {
  formatAddress,
  isValidAddress,
  loadWallet,
  normalizeAddress,
} from "../lib/wallet.js";

export function statusCmd(program: Command) {
  program
    .command("status [address]")
    .description(
      "Query redemption status for an address (EVM only); omit address to use environment variable BIFROST_SKILL_PRIVATEKEY",
    )
    .action(async (rawAddress?: string) => {
      const opts = program.opts();

      let token: TokenInfo;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }
      if (!token.evm) {
        return printError(
          "UNSUPPORTED_TOKEN",
          `Redemption status query only supports vETH (EVM). ${token.id} is on Substrate chains.`,
          opts.json,
        );
      }

      const trimmed = rawAddress?.trim() ?? "";
      let displayShort: string;
      let addr: `0x${string}`;

      if (!trimmed) {
        const wallet = loadWallet();
        if (!wallet) {
          return printError(
            "NO_ADDRESS_OR_PRIVATE_KEY",
            "Provide an address argument or set environment variable BIFROST_SKILL_PRIVATEKEY.",
            opts.json,
          );
        }
        addr = normalizeAddress(wallet.address);
        displayShort = wallet.address;
      } else {
        if (!isValidAddress(trimmed)) {
          return printError(
            "INVALID_ADDRESS",
            "Invalid Ethereum address. Expected 0x + 40 hex chars.",
            opts.json,
          );
        }
        addr = normalizeAddress(trimmed);
        displayShort = trimmed;
      }

      let chain: ChainConfig;
      try {
        chain = resolveChain(opts);
      } catch (e) {
        return printError("INVALID_CHAIN", (e as Error).message, opts.json);
      }

      try {
        const client = getPublicClient(chain);
        const result = await client.readContract({
          address: VETH_ADDRESS,
          abi: vethAbi,
          functionName: "canWithdrawalAmount",
          args: [addr],
        });
        const [claimable, , pending] = result as [bigint, bigint, bigint];

        let hint: string;
        if (claimable > 0n && pending > 0n) {
          hint = `${formatEther(claimable)} ETH ready to claim (run: slpx claim). ${formatEther(pending)} ETH still processing (typically 1-3 days).`;
        } else if (claimable > 0n) {
          hint = "ETH is ready to claim. Run: slpx claim";
        } else if (pending > 0n) {
          hint = `${formatEther(pending)} ETH is processing. Typically 1-3 days for ETH redemptions.`;
        } else {
          hint = "No claimable or pending ETH.";
        }

        print(
          {
            address: formatAddress(displayShort),
            claimableEth: formatEther(claimable),
            pendingEthAmount: formatEther(pending),
            chain: chain.name,
            hint,
          },
          opts.json,
        );
      } catch (e) {
        printError(
          "RPC_ERROR",
          `Failed to query status: ${(e as Error).message}`,
          opts.json,
        );
      }
    });
}
