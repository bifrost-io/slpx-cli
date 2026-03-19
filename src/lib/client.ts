import { createPublicClient, createWalletClient, http, type Chain } from "viem";
import { mainnet, base, optimism, arbitrum } from "viem/chains";
import type { ChainConfig } from "./chains.js";
import type { PrivateKeyAccount } from "viem/accounts";

const viemChains: Record<number, Chain> = {
  1: mainnet,
  8453: base,
  10: optimism,
  42161: arbitrum,
};

export function getPublicClient(chain: ChainConfig) {
  return createPublicClient({
    chain: viemChains[chain.chainId],
    transport: http(chain.rpc),
  });
}

export function getPublicClientWithFallback(chain: ChainConfig) {
  return createPublicClient({
    chain: viemChains[chain.chainId],
    transport: http(chain.fallbackRpc),
  });
}

export function getWalletClient(chain: ChainConfig, account: PrivateKeyAccount) {
  return createWalletClient({
    account,
    chain: viemChains[chain.chainId],
    transport: http(chain.rpc),
  });
}
