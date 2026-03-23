import { createPublicClient, createWalletClient, http, fallback, type Chain } from "viem";
import { mainnet, base, optimism, arbitrum } from "viem/chains";
import type { ChainConfig } from "./chains.js";
import type { PrivateKeyAccount } from "viem/accounts";

const viemChains: Record<number, Chain> = {
  1: mainnet,
  8453: base,
  10: optimism,
  42161: arbitrum,
};

function buildTransport(chain: ChainConfig) {
  if (chain.rpc === chain.fallbackRpc) return http(chain.rpc);
  return fallback([http(chain.rpc), http(chain.fallbackRpc)]);
}

export function getPublicClient(chain: ChainConfig) {
  return createPublicClient({
    chain: viemChains[chain.chainId],
    transport: buildTransport(chain),
  });
}

export function getWalletClient(chain: ChainConfig, account: PrivateKeyAccount) {
  return createWalletClient({
    account,
    chain: viemChains[chain.chainId],
    transport: buildTransport(chain),
  });
}
