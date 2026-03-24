const API_URL = "https://api.bifrost.app/api/site";

export interface TokenStats {
  apy: number;
  apyBase: number;
  apyReward: number;
  tvl: number;
  tvm: number;
  totalIssuance: number;
  holders: number;
}

export interface DerivedRate {
  baseToToken: number;
  tokenToBase: number;
}

export async function fetchTokenStats(tokenId: string): Promise<TokenStats> {
  const res = await fetch(API_URL, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  const data = await res.json();
  const raw = data[tokenId];
  if (!raw) throw new Error("Missing token data in API response");
  return {
    apy: Number(raw.apy),
    apyBase: Number(raw.apyBase),
    apyReward: Number(raw.apyReward),
    tvl: Number(raw.tvl),
    tvm: Number(raw.tvm),
    totalIssuance: Number(raw.totalIssuance),
    holders: Number(raw.holders),
  };
}

export function deriveRate(stats: TokenStats): DerivedRate {
  if (stats.tvm <= 0 || stats.totalIssuance <= 0) {
    throw new Error("Invalid rate data: tvm or totalIssuance is zero");
  }
  return {
    baseToToken: stats.totalIssuance / stats.tvm,
    tokenToBase: stats.tvm / stats.totalIssuance,
  };
}

const DEFILLAMA_URL = "https://yields.llama.fi/pools";

interface DefillamaPoolRaw {
  symbol?: string;
  project?: string;
  chain?: string;
  apy?: number;
  tvlUsd?: number;
}

interface DefillamaResponse {
  data?: DefillamaPoolRaw[];
}

export interface LpPool {
  project: string;
  chain: string;
  symbol: string;
  apy: number;
  tvl: number;
}

export async function fetchLpPools(tokenId: string): Promise<LpPool[]> {
  const res = await fetch(DEFILLAMA_URL, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`DeFiLlama API returned ${res.status}`);
  const data = (await res.json()) as DefillamaResponse;
  const pools = data.data ?? [];
  const tokenLower = tokenId.toLowerCase();

  return pools
    .filter((p) => {
      const sym = (p.symbol || "").toLowerCase();
      return sym.includes(tokenLower) && sym.includes("-");
    })
    .map((p) => ({
      project: String(p.project ?? ""),
      chain: String(p.chain ?? ""),
      symbol: String(p.symbol ?? ""),
      apy: Number(p.apy) || 0,
      tvl: Number(p.tvlUsd) || 0,
    }))
    .filter((p: LpPool) => p.tvl > 10000)
    .sort((a: LpPool, b: LpPool) => b.tvl - a.tvl)
    .slice(0, 5);
}
