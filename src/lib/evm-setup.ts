import { type ChainConfig, resolveChain } from "./chains.js";
import { type TokenInfo, resolveToken } from "./tokens.js";

export type CliError = { code: string; message: string };

type GlobalOpts = { token?: string; chain?: string; rpc?: string };

/** Resolve token and require EVM (vETH). `actionLabel` is the sentence subject, e.g. "Mint" or "On-chain balance query". */
export function resolveEvmToken(
  opts: GlobalOpts,
  actionLabel: string,
): TokenInfo | CliError {
  try {
    const token = resolveToken(opts.token ?? "vETH");
    if (!token.evm) {
      return {
        code: "UNSUPPORTED_TOKEN",
        message: `${actionLabel} only supports vETH (EVM). ${token.id} is on Substrate chains.`,
      };
    }
    return token;
  } catch (e) {
    return { code: "INVALID_TOKEN", message: (e as Error).message };
  }
}

export function resolveChainOrError(opts: GlobalOpts): ChainConfig | CliError {
  try {
    return resolveChain(opts);
  } catch (e) {
    return { code: "INVALID_CHAIN", message: (e as Error).message };
  }
}

/** Returns an error to pass to `printError`, or `null` when the token is EVM (vETH). */
export function evmTokenError(
  opts: GlobalOpts,
  actionLabel: string,
): CliError | null {
  const r = resolveEvmToken(opts, actionLabel);
  return "code" in r ? r : null;
}
