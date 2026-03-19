export interface TokenInfo {
  id: string;
  baseAsset: string;
  evm: boolean;
}

export const VALID_TOKENS: TokenInfo[] = [
  { id: "vETH",   baseAsset: "ETH",   evm: true },
  { id: "vDOT",   baseAsset: "DOT",   evm: false },
  { id: "vKSM",   baseAsset: "KSM",   evm: false },
  { id: "vBNC",   baseAsset: "BNC",   evm: false },
  { id: "vGLMR",  baseAsset: "GLMR",  evm: false },
  { id: "vMOVR",  baseAsset: "MOVR",  evm: false },
  { id: "vFIL",   baseAsset: "FIL",   evm: false },
  { id: "vASTR",  baseAsset: "ASTR",  evm: false },
  { id: "vMANTA", baseAsset: "MANTA", evm: false },
  { id: "vPHA",   baseAsset: "PHA",   evm: false },
];

export function resolveToken(name: string): TokenInfo {
  const lower = name.toLowerCase();
  const found = VALID_TOKENS.find(t => t.id.toLowerCase() === lower);
  if (!found) {
    const valid = VALID_TOKENS.map(t => t.id).join(", ");
    throw new Error(`Unknown token "${name}". Valid: ${valid}`);
  }
  return found;
}
