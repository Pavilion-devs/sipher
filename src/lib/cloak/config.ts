import {
  CLOAK_PROGRAM_ID,
  DEFAULT_TRANSACTION_CIRCUITS_URL,
  detectNetworkFromRpcUrl,
} from "@cloak.dev/sdk";
import { PublicKey } from "@solana/web3.js";
import type { Asset, CloakRuntimeConfig } from "@/types";

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
  "https://api.mainnet-beta.solana.com";

export const CLOAK_RUNTIME: CloakRuntimeConfig = {
  rpcUrl,
  relayUrl:
    process.env.NEXT_PUBLIC_CLOAK_RELAY_URL?.trim() || "https://api.cloak.ag",
  programId:
    process.env.NEXT_PUBLIC_CLOAK_PROGRAM_ID?.trim() ||
    CLOAK_PROGRAM_ID.toBase58(),
  circuitsUrl:
    process.env.NEXT_PUBLIC_CLOAK_CIRCUITS_URL?.trim() ||
    DEFAULT_TRANSACTION_CIRCUITS_URL,
  network: detectNetworkFromRpcUrl(rpcUrl),
};

export const MAINNET_MINTS = {
  USDC: new PublicKey(
    process.env.NEXT_PUBLIC_USDC_MINT?.trim() ||
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  ),
  USDT: new PublicKey(
    process.env.NEXT_PUBLIC_USDT_MINT?.trim() ||
      "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  ),
} as const;

export function getMintForAsset(asset: Asset) {
  if (asset === "SOL") return null;
  return MAINNET_MINTS[asset];
}
