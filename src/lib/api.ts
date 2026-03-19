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
  if (!raw) throw new Error(`Missing ${tokenId} data in API response`);
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
