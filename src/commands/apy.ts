import type { Command } from "commander";
import { fetchTokenStats } from "../lib/api.js";
import { resolveToken } from "../lib/tokens.js";
import { print, printError } from "../lib/output.js";

export function apyCmd(program: Command) {
  program
    .command("apy")
    .description("Query staking APY for a vToken")
    .action(async () => {
      const opts = program.opts();

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }

      try {
        const stats = await fetchTokenStats(token.id);

        print({
          token: token.id,
          totalApy: `${stats.apy}%`,
          baseApy: `${stats.apyBase}%`,
          rewardApy: `${stats.apyReward}%`,
        }, opts.json);
      } catch (e) {
        printError("API_ERROR", `Failed to fetch APY: ${(e as Error).message}`, opts.json);
      }
    });
}
