import type { Command } from "commander";
import { encodeFunctionData, formatEther } from "viem";
import { vethAbi } from "../lib/abi.js";
import { type ChainConfig, VETH_ADDRESS, resolveChain } from "../lib/chains.js";
import { getPublicClient, getWalletClient } from "../lib/client.js";
import { print, printError } from "../lib/output.js";
import { type TokenInfo, resolveToken } from "../lib/tokens.js";
import { formatAddress, resolveSigner } from "../lib/wallet.js";

export function claimCmd(program: Command) {
  program
    .command("claim")
    .description("Claim completed ETH redemptions (EVM only)")
    .option("--dry-run", "output unsigned tx without sending")
    .option(
      "--address <addr>",
      "wallet address (dry-run without environment variable BIFROST_SKILL_PRIVATEKEY)",
    )
    .action(async (cmdOpts: { dryRun?: boolean; address?: string }) => {
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
          `Claim only supports vETH (EVM). ${token.id} is on Substrate chains.`,
          opts.json,
        );
      }

      let chain: ChainConfig;
      try {
        chain = resolveChain(opts);
      } catch (e) {
        return printError("INVALID_CHAIN", (e as Error).message, opts.json);
      }

      try {
        const client = getPublicClient(chain);
        const signer = resolveSigner({
          dryRun: cmdOpts.dryRun,
          address: cmdOpts.address,
        });
        if ("message" in signer) {
          return printError(signer.code, signer.message, opts.json);
        }

        const addr = signer.from;

        const result = await client.readContract({
          address: VETH_ADDRESS,
          abi: vethAbi,
          functionName: "canWithdrawalAmount",
          args: [addr],
        });
        const [claimable] = result as [bigint, bigint, bigint];

        if (claimable === 0n) {
          return printError(
            "NOTHING_TO_CLAIM",
            "No claimable ETH. Redemption may still be processing.",
            opts.json,
          );
        }

        if (signer.dryRun) {
          const data = encodeFunctionData({
            abi: vethAbi,
            functionName: "withdrawCompleteToETH",
          });
          print(
            {
              action: "claim",
              claimableEth: formatEther(claimable),
              mode: "unsigned",
              unsigned: {
                to: VETH_ADDRESS,
                value: "0",
                data,
                chainId: chain.chainId,
              },
            },
            opts.json,
          );
          return;
        }

        const walletClient = getWalletClient(chain, signer.wallet);
        const txHash = await walletClient.writeContract({
          address: VETH_ADDRESS,
          abi: vethAbi,
          functionName: "withdrawCompleteToETH",
        });

        print(
          {
            action: "claim",
            claimedEth: formatEther(claimable),
            from: formatAddress(signer.wallet.address),
            txHash,
            explorer: `${chain.explorer}/tx/${txHash}`,
          },
          opts.json,
        );
      } catch (e) {
        printError(
          "TX_ERROR",
          `Claim failed: ${(e as Error).message}`,
          opts.json,
        );
      }
    });
}
