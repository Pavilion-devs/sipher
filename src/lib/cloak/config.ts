import {
  CLOAK_PROGRAM_ID,
  DEFAULT_TRANSACTION_CIRCUITS_URL,
  detectNetworkFromRpcUrl,
} from "@cloak.dev/sdk";
import { DEVNET_MOCK_USDC_MINT } from "@cloak.dev/sdk-devnet";
import { PublicKey } from "@solana/web3.js";
import type { Asset, CloakRuntimeConfig, Network } from "@/types";

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

export const DEVNET_RUNTIME: CloakRuntimeConfig = {
  rpcUrl: "https://api.devnet.solana.com",
  relayUrl: "https://api.devnet.cloak.ag",
  programId: "Zc1kHfp4rajSMeASFDwFFgkHRjv7dFQuLheJoQus27h",
  circuitsUrl: DEFAULT_TRANSACTION_CIRCUITS_URL,
  network: "devnet",
};

export function getRuntimeForNetwork(network: Network): CloakRuntimeConfig {
  return network === "devnet" ? DEVNET_RUNTIME : CLOAK_RUNTIME;
}

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

export { DEVNET_MOCK_USDC_MINT };

export function getMintForAsset(asset: Asset, network: Network = "mainnet") {
  if (asset === "SOL") return null;
  if (network === "devnet") {
    // Devnet only supports mock USDC — no USDT
    return asset === "USDC" ? DEVNET_MOCK_USDC_MINT : null;
  }
  return MAINNET_MINTS[asset];
}
