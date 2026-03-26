import type { Command } from "commander";
import { encodeFunctionData, formatEther, parseEther } from "viem";
import { vethAbi } from "../lib/abi.js";
import { type ChainConfig, VETH_ADDRESS, resolveChain } from "../lib/chains.js";
import { getPublicClient, getWalletClient } from "../lib/client.js";
import { print, printError } from "../lib/output.js";
import { type TokenInfo, resolveToken } from "../lib/tokens.js";
import { formatAddress, resolveSigner } from "../lib/wallet.js";

export function redeemCmd(program: Command) {
  program
    .command("redeem <amount>")
    .description("Redeem vETH to initiate ETH withdrawal (EVM only)")
    .option("--dry-run", "output unsigned tx without sending")
    .option(
      "--address <addr>",
      "wallet address (dry-run without environment variable BIFROST_SKILL_PRIVATEKEY)",
    )
    .action(
      async (
        amount: string,
        cmdOpts: { dryRun?: boolean; address?: string },
      ) => {
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
            `Redeem only supports vETH (EVM). ${token.id} is on Substrate chains.`,
            opts.json,
          );
        }

        if (
          Number.isNaN(Number.parseFloat(amount)) ||
          Number.parseFloat(amount) <= 0
        ) {
          return printError(
            "INVALID_AMOUNT",
            "Amount must be a positive number.",
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
          const shares = parseEther(amount);

          const paused = await client.readContract({
            address: VETH_ADDRESS,
            abi: vethAbi,
            functionName: "paused",
          });
          if (paused) {
            return printError(
              "CONTRACT_PAUSED",
              "vETH contract is paused. Try again later.",
              opts.json,
            );
          }

          const signer = resolveSigner({
            dryRun: cmdOpts.dryRun,
            address: cmdOpts.address,
          });
          if ("message" in signer) {
            return printError(signer.code, signer.message, opts.json);
          }

          const addr = signer.from;

          const balance = await client.readContract({
            address: VETH_ADDRESS,
            abi: vethAbi,
            functionName: "balanceOf",
            args: [addr],
          });
          if (balance < shares) {
            return printError(
              "INSUFFICIENT_BALANCE",
              `Insufficient vETH. Balance: ${formatEther(balance)}, requested: ${amount}.`,
              opts.json,
            );
          }

          let expectedEth: bigint;
          try {
            expectedEth = await client.readContract({
              address: VETH_ADDRESS,
              abi: vethAbi,
              functionName: "previewRedeem",
              args: [shares],
            });
          } catch {
            expectedEth = await client.readContract({
              address: VETH_ADDRESS,
              abi: vethAbi,
              functionName: "convertToAssets",
              args: [shares],
            });
          }

          if (signer.dryRun) {
            const data = encodeFunctionData({
              abi: vethAbi,
              functionName: "redeem",
              args: [shares, addr, addr],
            });
            print(
              {
                action: "redeem",
                inputAmount: amount,
                inputToken: "vETH",
                expectedAmount: formatEther(expectedEth),
                expectedToken: "ETH",
                mode: "unsigned",
                warning:
                  "Redemption is NOT instant. ETH enters a processing queue.",
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
            functionName: "redeem",
            args: [shares, signer.wallet.address, signer.wallet.address],
          });

          print(
            {
              action: "redeem",
              inputAmount: amount,
              inputToken: "vETH",
              expectedAmount: formatEther(expectedEth),
              expectedToken: "ETH",
              warning:
                "Redemption is NOT instant. ETH enters a processing queue.",
              from: formatAddress(signer.wallet.address),
              txHash,
              explorer: `${chain.explorer}/tx/${txHash}`,
            },
            opts.json,
          );
        } catch (e) {
          printError(
            "TX_ERROR",
            `Redeem failed: ${(e as Error).message}`,
            opts.json,
          );
        }
      },
    );
}
