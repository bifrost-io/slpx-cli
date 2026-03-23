export interface ChainConfig {
  name: string;
  chainId: number;
  rpc: string;
  fallbackRpc: string;
  weth: `0x${string}`;
  explorer: string;
}

export const VETH_ADDRESS = "0xc3997ff81f2831929499c4eE4Ee4e0F08F42D4D8" as const;

export const chains: Record<string, ChainConfig> = {
  ethereum: {
    name: "ethereum",
    chainId: 1,
    rpc: "https://ethereum.publicnode.com",
    fallbackRpc: "https://1rpc.io/eth",
    weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    explorer: "https://etherscan.io",
  },
  base: {
    name: "base",
    chainId: 8453,
    rpc: "https://base.publicnode.com",
    fallbackRpc: "https://1rpc.io/base",
    weth: "0x4200000000000000000000000000000000000006",
    explorer: "https://basescan.org",
  },
  optimism: {
    name: "optimism",
    chainId: 10,
    rpc: "https://optimism.publicnode.com",
    fallbackRpc: "https://1rpc.io/op",
    weth: "0x4200000000000000000000000000000000000006",
    explorer: "https://optimistic.etherscan.io",
  },
  arbitrum: {
    name: "arbitrum",
    chainId: 42161,
    rpc: "https://arbitrum-one.publicnode.com",
    fallbackRpc: "https://1rpc.io/arb",
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    explorer: "https://arbiscan.io",
  },
};

function sanitize(input: string): string {
  return input.replace(/[<>&"']/g, "");
}

export async function validateCustomRpc(chain: ChainConfig, opts: { rpc?: string }): Promise<void> {
  if (!opts.rpc && !process.env.BIFROST_RPC_URL) return;
  const res = await fetch(chain.rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`RPC returned HTTP ${res.status}`);
}

export function resolveChain(opts: { chain?: string; rpc?: string }): ChainConfig {
  const name = opts.chain || process.env.BIFROST_CHAIN || "ethereum";
  const config = chains[name];
  if (!config) {
    const valid = Object.keys(chains).join(", ");
    throw new Error(`Unknown chain "${sanitize(name)}". Valid: ${valid}`);
  }
  if (opts.rpc || process.env.BIFROST_RPC_URL) {
    const customRpc = (opts.rpc || process.env.BIFROST_RPC_URL)!;
    return { ...config, rpc: customRpc, fallbackRpc: customRpc };
  }
  return config;
}
