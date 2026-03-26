import type { Command } from "commander";
import { formatEther, parseEther } from "viem";
import { vethAbi } from "../lib/abi.js";
import { deriveRate, fetchTokenStats } from "../lib/api.js";
import {
  type ChainConfig,
  VETH_ADDRESS,
  resolveChain,
  validateCustomRpc,
} from "../lib/chains.js";
import { getPublicClient } from "../lib/client.js";
import { print, printError } from "../lib/output.js";
import { type TokenInfo, resolveToken } from "../lib/tokens.js";

export function rateCmd(program: Command) {
  program
    .command("rate [amount]")
    .description("Query exchange rate for a vToken")
    .action(async (amount = "1") => {
      const opts = program.opts();

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

      let token: TokenInfo;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }

      if (token.evm) {
        let chain: ChainConfig;
        try {
          chain = resolveChain(opts);
        } catch (e) {
          return printError("INVALID_CHAIN", (e as Error).message, opts.json);
        }
        try {
          await validateCustomRpc(chain, opts);
        } catch (e) {
          return printError(
            "RPC_ERROR",
            `Custom RPC unreachable: ${(e as Error).message}`,
            opts.json,
          );
        }
      }

      try {
        const stats = await fetchTokenStats(token.id);
        const rate = deriveRate(stats);
        const outputAmount = Number.parseFloat(amount) * rate.baseToToken;
        const precision = 6;

        print(
          {
            inputToken: token.baseAsset,
            outputToken: token.id,
            inputAmount: amount,
            outputAmount: outputAmount.toFixed(precision),
            rate: rate.tokenToBase.toFixed(precision),
            source: "api",
          },
          opts.json,
        );
      } catch {
        if (!token.evm) {
          return printError(
            "API_ERROR",
            "API unavailable. On-chain fallback only available for vETH.",
            opts.json,
          );
        }
        try {
          const chain = resolveChain(opts);
          const client = getPublicClient(chain);
          const shares = await client.readContract({
            address: VETH_ADDRESS,
            abi: vethAbi,
            functionName: "convertToShares",
            args: [parseEther(amount)],
          });
          const sharesStr = formatEther(shares);
          const outNum = Number.parseFloat(sharesStr);
          const amtNum = Number.parseFloat(amount);
          const tokenToBase = amtNum / outNum;
          const precision = 6;
          print(
            {
              inputToken: "ETH",
              outputToken: "vETH",
              inputAmount: amount,
              outputAmount: outNum.toFixed(precision),
              rate: tokenToBase.toFixed(precision),
              source: "on-chain",
              chain: chain.name,
            },
            opts.json,
          );
        } catch (e) {
          printError(
            "RPC_ERROR",
            `Failed to query rate: ${(e as Error).message}`,
            opts.json,
          );
        }
      }
    });
}
