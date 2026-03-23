import type { Command } from "commander";
import { fetchTokenStats, deriveRate } from "../lib/api.js";
import { getPublicClient } from "../lib/client.js";
import { resolveChain, validateCustomRpc, VETH_ADDRESS } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { vethAbi } from "../lib/abi.js";
import { print, printError } from "../lib/output.js";

export function infoCmd(program: Command) {
  program
    .command("info")
    .description("Show protocol overview for a vToken")
    .action(async () => {
      const opts = program.opts();

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }

      if (token.evm) {
        let chain;
        try { chain = resolveChain(opts); } catch (e) {
          return printError("INVALID_CHAIN", (e as Error).message, opts.json);
        }
        try { await validateCustomRpc(chain, opts); } catch (e) {
          return printError("RPC_ERROR", `Custom RPC unreachable: ${(e as Error).message}`, opts.json);
        }
      }

      try {
        const stats = await fetchTokenStats(token.id);
        const rate = deriveRate(stats);

        const result: Record<string, unknown> = {
          protocol: "Bifrost SLPx",
          token: token.id,
          rate: `1 ${token.baseAsset} = ${rate.baseToToken.toFixed(6)} ${token.id}`,
          reverseRate: `1 ${token.id} = ${rate.tokenToBase.toFixed(6)} ${token.baseAsset}`,
          totalApy: `${stats.apy}%`,
          baseApy: `${stats.apyBase}%`,
          rewardApy: `${stats.apyReward}%`,
          tvl: `$${stats.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
          totalStaked: `${stats.tvm.toFixed(4)} ${token.baseAsset}`,
          totalSupply: `${stats.totalIssuance.toFixed(4)} ${token.id}`,
          holders: stats.holders,
        };

        if (token.evm) {
          result.contract = VETH_ADDRESS;
          result.chains = "ethereum, base, optimism, arbitrum";
          try {
            const chain = resolveChain(opts);
            const client = getPublicClient(chain);
            result.paused = await client.readContract({
              address: VETH_ADDRESS, abi: vethAbi, functionName: "paused",
            }) as boolean;
          } catch { /* best-effort */ }
        }

        print(result, opts.json);
      } catch (e) {
        printError("API_ERROR", `Failed to fetch info: ${(e as Error).message}`, opts.json);
      }
    });
}
