import type { Command } from "commander";
import { getPublicClient, getWalletClient } from "../lib/client.js";
import { resolveChain, VETH_ADDRESS } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { vethAbi } from "../lib/abi.js";
import { print, printError } from "../lib/output.js";
import { formatEther, parseEther, encodeFunctionData } from "viem";
import { loadWallet, formatAddress, isValidAddress, normalizeAddress } from "../lib/wallet.js";

export function redeemCmd(program: Command) {
  program
    .command("redeem <amount>")
    .description("Redeem vETH to initiate ETH withdrawal (EVM only)")
    .option("--dry-run", "output unsigned tx without sending")
    .option("--address <addr>", "wallet address (required in dry-run without key)")
    .action(async (amount: string, cmdOpts: { dryRun?: boolean; address?: string }) => {
      const opts = program.opts();

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }
      if (!token.evm) {
        return printError("UNSUPPORTED_TOKEN",
          `Redeem only supports vETH (EVM). ${token.id} is on Substrate chains.`, opts.json);
      }

      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return printError("INVALID_AMOUNT", "Amount must be a positive number.", opts.json);
      }

      let chain;
      try {
        chain = resolveChain(opts);
      } catch (e) {
        return printError("INVALID_CHAIN", (e as Error).message, opts.json);
      }

      try {
        const client = getPublicClient(chain);
        const shares = parseEther(amount);

        const paused = await client.readContract({
          address: VETH_ADDRESS, abi: vethAbi, functionName: "paused",
        });
        if (paused) {
          return printError("CONTRACT_PAUSED", "vETH contract is paused. Try again later.", opts.json);
        }

        const wallet = loadWallet();
        const userAddr = wallet?.address || cmdOpts.address;

        if (!userAddr) {
          return printError("NO_WALLET", "No wallet found. Provide --address or set up ~/.bifrost/key.", opts.json);
        }
        if (!isValidAddress(userAddr)) {
          return printError("INVALID_ADDRESS", "Invalid Ethereum address.", opts.json);
        }
        const addr = normalizeAddress(userAddr);

        const balance = await client.readContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "balanceOf", args: [addr],
        });
        if (balance < shares) {
          return printError("INSUFFICIENT_BALANCE",
            `Insufficient vETH. Balance: ${formatEther(balance)} vETH, Requested: ${amount} vETH.`, opts.json);
        }

        let expectedEth: bigint;
        try {
          expectedEth = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "previewRedeem", args: [shares],
          });
        } catch {
          expectedEth = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "convertToAssets", args: [shares],
          });
        }

        if (!wallet || cmdOpts.dryRun) {
          const data = encodeFunctionData({
            abi: vethAbi, functionName: "redeem",
            args: [shares, addr, addr],
          });
          print({
            action: "redeem",
            input: `${amount} vETH`,
            expected: `${formatEther(expectedEth)} ETH`,
            mode: "unsigned",
            warning: "Redemption is NOT instant. ETH enters a processing queue.",
            unsigned: {
              to: VETH_ADDRESS, value: "0", data, chainId: chain.chainId,
            },
          }, opts.json);
          return;
        }

        const walletClient = getWalletClient(chain, wallet);
        const txHash = await walletClient.writeContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "redeem",
          args: [shares, wallet.address, wallet.address],
        });

        print({
          action: "redeem",
          input: `${amount} vETH`,
          expected: `${formatEther(expectedEth)} ETH`,
          warning: "Redemption is NOT instant. ETH enters a processing queue.",
          from: formatAddress(wallet.address),
          txHash,
          explorer: `${chain.explorer}/tx/${txHash}`,
        }, opts.json);
      } catch (e) {
        printError("TX_ERROR", `Redeem failed: ${(e as Error).message}`, opts.json);
      }
    });
}
