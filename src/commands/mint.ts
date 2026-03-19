import type { Command } from "commander";
import { getPublicClient, getWalletClient } from "../lib/client.js";
import { resolveChain, VETH_ADDRESS } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { vethAbi } from "../lib/abi.js";
import { print, printError } from "../lib/output.js";
import { formatEther, parseEther, encodeFunctionData } from "viem";
import { loadWallet, formatAddress } from "../lib/wallet.js";

export function mintCmd(program: Command) {
  program
    .command("mint <amount>")
    .description("Stake ETH to mint vETH (EVM only)")
    .option("--dry-run", "output unsigned tx without sending")
    .action(async (amount: string, cmdOpts: { dryRun?: boolean }) => {
      const opts = program.opts();

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }
      if (!token.evm) {
        return printError("UNSUPPORTED_TOKEN",
          `Mint only supports vETH (EVM). ${token.id} is on Substrate chains.`, opts.json);
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
        const weiAmount = parseEther(amount);

        const paused = await client.readContract({
          address: VETH_ADDRESS, abi: vethAbi, functionName: "paused",
        });
        if (paused) {
          return printError("CONTRACT_PAUSED", "vETH contract is paused. Try again later.", opts.json);
        }

        let expectedVeth: bigint;
        try {
          expectedVeth = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "previewDeposit", args: [weiAmount],
          });
        } catch {
          expectedVeth = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "convertToShares", args: [weiAmount],
          });
        }

        const wallet = loadWallet();

        if (!wallet || cmdOpts.dryRun) {
          const data = encodeFunctionData({ abi: vethAbi, functionName: "depositWithETH" });
          print({
            action: "mint",
            input: `${amount} ETH`,
            expected: `${formatEther(expectedVeth)} vETH`,
            mode: "unsigned",
            unsigned: {
              to: VETH_ADDRESS,
              value: weiAmount.toString(),
              data,
              chainId: chain.chainId,
            },
          }, opts.json);
          return;
        }

        const walletClient = getWalletClient(chain, wallet);
        const txHash = await walletClient.writeContract({
          address: VETH_ADDRESS, abi: vethAbi,
          functionName: "depositWithETH",
          value: weiAmount,
        });

        print({
          action: "mint",
          input: `${amount} ETH`,
          expected: `${formatEther(expectedVeth)} vETH`,
          from: formatAddress(wallet.address),
          txHash,
          explorer: `${chain.explorer}/tx/${txHash}`,
        }, opts.json);
      } catch (e) {
        printError("TX_ERROR", `Mint failed: ${(e as Error).message}`, opts.json);
      }
    });
}
