import type { PublicClient } from "viem";
import { vethAbi } from "./abi.js";
import { VETH_ADDRESS } from "./chains.js";

export async function readVethPaused(client: PublicClient): Promise<boolean> {
  return client.readContract({
    address: VETH_ADDRESS,
    abi: vethAbi,
    functionName: "paused",
  });
}

export async function readExpectedSharesFromDeposit(
  client: PublicClient,
  weiAmount: bigint,
): Promise<bigint> {
  try {
    return await client.readContract({
      address: VETH_ADDRESS,
      abi: vethAbi,
      functionName: "previewDeposit",
      args: [weiAmount],
    });
  } catch {
    return await client.readContract({
      address: VETH_ADDRESS,
      abi: vethAbi,
      functionName: "convertToShares",
      args: [weiAmount],
    });
  }
}

export async function readExpectedEthFromRedeem(
  client: PublicClient,
  shares: bigint,
): Promise<bigint> {
  try {
    return await client.readContract({
      address: VETH_ADDRESS,
      abi: vethAbi,
      functionName: "previewRedeem",
      args: [shares],
    });
  } catch {
    return await client.readContract({
      address: VETH_ADDRESS,
      abi: vethAbi,
      functionName: "convertToAssets",
      args: [shares],
    });
  }
}
