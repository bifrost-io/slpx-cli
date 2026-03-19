import type { Command } from "commander";
import { getPublicClient } from "../lib/client.js";
import { resolveChain, VETH_ADDRESS } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { vethAbi } from "../lib/abi.js";
import { print, printError } from "../lib/output.js";
import { formatEther } from "viem";
import { formatAddress, isValidAddress, normalizeAddress } from "../lib/wallet.js";

export function statusCmd(program: Command) {
  program
    .command("status <address>")
    .description("Query redemption status for an address (EVM only)")
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
          `Redemption status query only supports vETH (EVM). ${token.id} is on Substrate chains.`, opts.json);
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
        const result = await client.readContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "canWithdrawalAmount", args: [addr],
        });
        const [claimable, , pending] = result as [bigint, bigint, bigint];

        print({
          address: formatAddress(address),
          claimableEth: `${formatEther(claimable)} ETH`,
          pendingAmount: `${formatEther(pending)} ETH`,
          chain: chain.name,
          hint: claimable > 0n
            ? "ETH is ready to claim. Run: slpx claim"
            : "No claimable ETH. Redemption may still be processing.",
        }, opts.json);
      } catch (e) {
        printError("RPC_ERROR", `Failed to query status: ${(e as Error).message}`, opts.json);
      }
    });
}
