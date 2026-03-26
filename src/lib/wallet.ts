import { getAddress } from "viem";
import { type PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";

export type ResolveSignerError = {
  code: string;
  message: string;
};

export type ResolvedSignerDry = {
  dryRun: true;
  wallet: PrivateKeyAccount | null;
  from: `0x${string}`;
};

export type ResolvedSignerLive = {
  dryRun: false;
  wallet: PrivateKeyAccount;
  from: `0x${string}`;
};

export type ResolvedSigner = ResolvedSignerDry | ResolvedSignerLive;

/** Live txs require a valid private key. Dry-run allows key (preferred) or --address. */
export function resolveSigner(options: {
  dryRun?: boolean;
  address?: string;
}): ResolvedSigner | ResolveSignerError {
  const dryRun = options.dryRun === true;
  const wallet = loadWallet();

  if (!dryRun) {
    if (!wallet) {
      return {
        code: "NO_PRIVATE_KEY",
        message:
          "Environment variable BIFROST_SKILL_PRIVATEKEY is not configured. A private key is required to broadcast transactions.",
      };
    }
    return {
      dryRun: false,
      wallet,
      from: normalizeAddress(wallet.address),
    };
  }

  if (wallet) {
    return {
      dryRun: true,
      wallet,
      from: normalizeAddress(wallet.address),
    };
  }

  const raw = options.address?.trim();
  if (raw) {
    if (!isValidAddress(raw)) {
      return {
        code: "INVALID_ADDRESS",
        message: "Invalid Ethereum address.",
      };
    }
    return {
      dryRun: true,
      wallet: null,
      from: normalizeAddress(raw),
    };
  }

  return {
    code: "NO_PRIVATE_KEY_OR_ADDRESS",
    message:
      "Dry-run requires environment variable BIFROST_SKILL_PRIVATEKEY or --address.",
  };
}

export function loadWallet(): PrivateKeyAccount | null {
  const raw = process.env.BIFROST_SKILL_PRIVATEKEY?.trim();
  if (!raw) return null;

  const key = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) return null;

  return privateKeyToAccount(key as `0x${string}`);
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

export function normalizeAddress(address: string): `0x${string}` {
  return getAddress(address.toLowerCase() as `0x${string}`);
}
