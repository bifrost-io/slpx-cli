import { existsSync, readFileSync } from "fs";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { getAddress } from "viem";
import { join } from "path";

const KEY_PATH = join(process.env.HOME || "~", ".bifrost", "key");

export function loadWallet(): PrivateKeyAccount | null {
  if (!existsSync(KEY_PATH)) return null;

  const raw = readFileSync(KEY_PATH, "utf-8").trim();
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
