import { LAMPORTS_PER_SOL, calculateFeeBigint } from "@cloak.dev/sdk";
import type { Asset } from "@/types";

export const SOL_USD_REFERENCE = 93.04;
export const MIN_SHIELD_SOL = 0.01;
export const ASSET_DECIMALS: Record<Asset, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
};

export function solToLamports(value: number) {
  return BigInt(Math.round(value * LAMPORTS_PER_SOL));
}

export function lamportsToSol(value: bigint) {
  return Number(value) / LAMPORTS_PER_SOL;
}

export function assetAmountToUnits(asset: Asset, value: number) {
  const decimals = ASSET_DECIMALS[asset];
  return BigInt(Math.round(value * 10 ** decimals));
}

export function unitsToAssetAmount(asset: Asset, value: bigint) {
  return bigintToDisplayAmount(value, ASSET_DECIMALS[asset]);
}

export function bigintToDisplayAmount(value: bigint, decimals: number) {
  return Number(value) / 10 ** decimals;
}

export function inferUsdValue(asset: Asset | "MULTI", amount: number, solPrice = SOL_USD_REFERENCE) {
  if (asset === "SOL") return amount * solPrice;
  return amount;
}

export function grossUpSolWithdrawal(netLamports: bigint) {
  let gross = netLamports + calculateFeeBigint(netLamports);

  while (gross - calculateFeeBigint(gross) < netLamports) {
    gross += BigInt(1);
  }

  return gross;
}
