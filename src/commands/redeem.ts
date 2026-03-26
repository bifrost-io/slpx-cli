import type { Command } from "commander";
import { encodeFunctionData, formatEther, parseEther } from "viem";
import { vethAbi } from "../lib/abi.js";
import { VETH_ADDRESS, explorerTxUrl } from "../lib/chains.js";
import { getPublicClient, getWalletClient } from "../lib/client.js";
import { evmTokenError, resolveChainOrError } from "../lib/evm-setup.js";
import { print, printError } from "../lib/output.js";
import { isPositiveAmount } from "../lib/validation.js";
import { readExpectedEthFromRedeem, readVethPaused } from "../lib/veth-read.js";
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

        const tokenErr = evmTokenError(opts, "Redeem");
        if (tokenErr) {
          return printError(tokenErr.code, tokenErr.message, opts.json);
        }

        if (!isPositiveAmount(amount)) {
          return printError(
            "INVALID_AMOUNT",
            "Amount must be a positive number.",
            opts.json,
          );
        }

        const chain = resolveChainOrError(opts);
        if ("code" in chain) {
          return printError(chain.code, chain.message, opts.json);
        }

        try {
          const client = getPublicClient(chain);
          const shares = parseEther(amount);

          const paused = await readVethPaused(client);
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

          const expectedEth = await readExpectedEthFromRedeem(client, shares);

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
              explorer: explorerTxUrl(chain, txHash),
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
