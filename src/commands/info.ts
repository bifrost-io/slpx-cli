import type { Command } from "commander";
import { vethAbi } from "../lib/abi.js";
import { type TokenStats, deriveRate, fetchTokenStats } from "../lib/api.js";
import {
  type ChainConfig,
  VETH_ADDRESS,
  resolveChain,
  validateCustomRpc,
} from "../lib/chains.js";
import { getPublicClient } from "../lib/client.js";
import { print, printError } from "../lib/output.js";
import { type TokenInfo, resolveToken } from "../lib/tokens.js";

export function infoCmd(program: Command) {
  program
    .command("info")
    .description("Show protocol overview for a vToken")
    .action(async () => {
      const opts = program.opts();

      let token: TokenInfo;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }

      let chain: ChainConfig | undefined;
      if (token.evm) {
        try {
          chain = resolveChain(opts);
        } catch (e) {
          return printError("INVALID_CHAIN", (e as Error).message, opts.json);
        }
      }

      try {
        let stats: TokenStats;
        let paused: boolean | undefined;

        if (token.evm && chain) {
          try {
            await validateCustomRpc(chain, opts);
          } catch (e) {
            return printError(
              "RPC_ERROR",
              `Custom RPC unreachable: ${(e as Error).message}`,
              opts.json,
            );
          }
          const client = getPublicClient(chain);
          [stats, paused] = await Promise.all([
            fetchTokenStats(token.id),
            client
              .readContract({
                address: VETH_ADDRESS,
                abi: vethAbi,
                functionName: "paused",
              })
              .then((x) => x as boolean)
              .catch((): undefined => undefined),
          ]);
        } else {
          stats = await fetchTokenStats(token.id);
        }

        const rate = deriveRate(stats);
        const precision = 6;

        const result: Record<string, unknown> = {
          protocol: "Bifrost SLPx",
          inputAmount: "1",
          outputAmount: rate.baseToToken.toFixed(precision),
          inputToken: token.baseAsset,
          outputToken: token.id,
          rate: rate.tokenToBase.toFixed(precision),
          totalApy: `${stats.apy}%`,
          baseApy: `${stats.apyBase}%`,
          rewardApy: `${stats.apyReward}%`,
          tvl: `$${stats.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
          totalStaked: stats.tvm.toFixed(4),
          totalSupply: stats.totalIssuance.toFixed(4),
          holders: stats.holders,
        };

        if (token.evm) {
          result.contract = VETH_ADDRESS;
          result.chains = "ethereum, base, optimism, arbitrum";
          if (typeof paused === "boolean") {
            result.paused = paused;
          }
        }

        print(result, opts.json);
      } catch (e) {
        printError(
          "API_ERROR",
          `Failed to fetch info: ${(e as Error).message}`,
          opts.json,
        );
      }
    });
}
