import type { Command } from "commander";
import { fetchTokenStats, fetchLpPools } from "../lib/api.js";
import { resolveToken } from "../lib/tokens.js";
import { print, printError } from "../lib/output.js";

export function apyCmd(program: Command) {
  program
    .command("apy")
    .description("Query staking APY for a vToken (add --lp for LP pool data)")
    .option("--lp", "also show LP pool yields from DeFiLlama")
    .action(async (cmdOpts: { lp?: boolean }) => {
      const opts = program.opts();

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }

      try {
        const stats = await fetchTokenStats(token.id);

        const result: Record<string, unknown> = {
          token: token.id,
          totalApy: `${stats.apy}%`,
          baseApy: `${stats.apyBase}%`,
          rewardApy: `${stats.apyReward}%`,
        };

        if (cmdOpts.lp) {
          try {
            const pools = await fetchLpPools(token.id);
            result.lpPools = pools.map(p => ({
              symbol: p.symbol,
              project: p.project,
              chain: p.chain,
              lpApy: `${p.apy.toFixed(2)}%`,
              tvl: `$${p.tvl >= 1e6 ? (p.tvl / 1e6).toFixed(1) + "M" : Math.round(p.tvl).toLocaleString()}`,
            }));
          } catch {
            result.lpPools = [];
            result.lpError = "Failed to fetch LP pool data from DeFiLlama";
          }
        }

        print(result, opts.json);
      } catch (e) {
        printError("API_ERROR", `Failed to fetch APY: ${(e as Error).message}`, opts.json);
      }
    });
}
