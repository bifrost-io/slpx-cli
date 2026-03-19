import type { Command } from "commander";
import { getPublicClient, getWalletClient } from "../lib/client.js";
import { resolveChain, VETH_ADDRESS } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { vethAbi } from "../lib/abi.js";
import { print, printError } from "../lib/output.js";
import { formatEther, encodeFunctionData } from "viem";
import { loadWallet, formatAddress, isValidAddress, normalizeAddress } from "../lib/wallet.js";

export function claimCmd(program: Command) {
  program
    .command("claim")
    .description("Claim completed ETH redemptions (EVM only)")
    .option("--dry-run", "output unsigned tx without sending")
    .option("--address <addr>", "wallet address (for status check in dry-run)")
    .action(async (cmdOpts: { dryRun?: boolean; address?: string }) => {
      const opts = program.opts();

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }
      if (!token.evm) {
        return printError("UNSUPPORTED_TOKEN",
          `Claim only supports vETH (EVM). ${token.id} is on Substrate chains.`, opts.json);
      }

      let chain;
      try {
        chain = resolveChain(opts);
      } catch (e) {
        return printError("INVALID_CHAIN", (e as Error).message, opts.json);
      }

      try {
        const client = getPublicClient(chain);
        const wallet = loadWallet();
        const userAddr = wallet?.address || cmdOpts.address;

        if (!userAddr) {
          return printError("NO_WALLET", "No wallet found. Provide --address or set up ~/.bifrost/key.", opts.json);
        }
        if (!isValidAddress(userAddr)) {
          return printError("INVALID_ADDRESS", "Invalid Ethereum address.", opts.json);
        }
        const addr = normalizeAddress(userAddr);

        const result = await client.readContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "canWithdrawalAmount", args: [addr],
        });
        const [claimable] = result as [bigint, bigint, bigint];

        if (claimable === 0n) {
          return printError("NOTHING_TO_CLAIM",
            "No claimable ETH. Redemption may still be processing.", opts.json);
        }

        if (!wallet || cmdOpts.dryRun) {
          const data = encodeFunctionData({ abi: vethAbi, functionName: "withdrawCompleteToETH" });
          print({
            action: "claim",
            claimable: `${formatEther(claimable)} ETH`,
            mode: "unsigned",
            unsigned: {
              to: VETH_ADDRESS, value: "0", data, chainId: chain.chainId,
            },
          }, opts.json);
          return;
        }

        const walletClient = getWalletClient(chain, wallet);
        const txHash = await walletClient.writeContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "withdrawCompleteToETH",
        });

        print({
          action: "claim",
          claimed: `${formatEther(claimable)} ETH`,
          from: formatAddress(wallet.address),
          txHash,
          explorer: `${chain.explorer}/tx/${txHash}`,
        }, opts.json);
      } catch (e) {
        printError("TX_ERROR", `Claim failed: ${(e as Error).message}`, opts.json);
      }
    });
}
