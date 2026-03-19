import type { Command } from "commander";
import { fetchTokenStats, deriveRate } from "../lib/api.js";
import { getPublicClient } from "../lib/client.js";
import { resolveChain, VETH_ADDRESS } from "../lib/chains.js";
import { resolveToken } from "../lib/tokens.js";
import { vethAbi } from "../lib/abi.js";
import { print, printError } from "../lib/output.js";
import { formatEther, parseEther } from "viem";

export function rateCmd(program: Command) {
  program
    .command("rate [amount]")
    .description("Query exchange rate for a vToken")
    .action(async (amount: string = "1") => {
      const opts = program.opts();

      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return printError("INVALID_AMOUNT", "Amount must be a positive number.", opts.json);
      }

      let token;
      try {
        token = resolveToken(opts.token);
      } catch (e) {
        return printError("INVALID_TOKEN", (e as Error).message, opts.json);
      }

      if (token.evm) {
        try { resolveChain(opts); } catch (e) {
          return printError("INVALID_CHAIN", (e as Error).message, opts.json);
        }
      }

      try {
        const stats = await fetchTokenStats(token.id);
        const rate = deriveRate(stats);
        const outputAmount = parseFloat(amount) * rate.baseToToken;

        print({
          input: `${amount} ${token.baseAsset}`,
          output: `${outputAmount.toFixed(6)} ${token.id}`,
          rate: `1 ${token.baseAsset} = ${rate.baseToToken.toFixed(6)} ${token.id}`,
          reverseRate: `1 ${token.id} = ${rate.tokenToBase.toFixed(6)} ${token.baseAsset}`,
          token: token.id,
          source: "api",
        }, opts.json);
      } catch {
        if (!token.evm) {
          return printError("API_ERROR", `API unavailable. On-chain fallback only available for vETH.`, opts.json);
        }
        try {
          const chain = resolveChain(opts);
          const client = getPublicClient(chain);
          const shares = await client.readContract({
            address: VETH_ADDRESS, abi: vethAbi,
            functionName: "convertToShares", args: [parseEther(amount)],
          });
          print({
            input: `${amount} ETH`,
            output: `${formatEther(shares)} vETH`,
            token: "vETH",
            source: "on-chain",
            chain: chain.name,
          }, opts.json);
        } catch (e) {
          printError("RPC_ERROR", `Failed to query rate: ${(e as Error).message}`, opts.json);
        }
      }
    });
}
