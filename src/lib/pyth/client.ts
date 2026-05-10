const PYTH_SOL_USD_FEED =
  "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

export async function getPythSolUsd(): Promise<number> {
  const resp = await fetch(
    `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${PYTH_SOL_USD_FEED}`,
    { cache: "no-store" },
  );
  if (!resp.ok) throw new Error("Pyth SOL/USD price feed unavailable.");
  const feeds = (await resp.json()) as Array<{
    price: { price: string; expo: number };
  }>;
  return Number(feeds[0].price.price) * Math.pow(10, feeds[0].price.expo);
}

// Calculates SOL lamports needed to receive a target amount of mock-USDC
// (6-decimal base units) via Cloak devnet swap. Uses Pyth spot price + 1%
// buffer so the relay's Pyth-priced swap output covers the target.
export async function getPythSwapInputLamports(
  targetUsdcUnits: bigint,
): Promise<bigint> {
  const solUsd = await getPythSolUsd();
  // lamports = usdcUnits * 1000 / solUsd  (SOL=9dec, USDC=6dec: 10^(9-6)=1000)
  const lamports = Math.ceil((Number(targetUsdcUnits) * 1000) / solUsd);
  return BigInt(Math.ceil(lamports * 1.01)); // 1% buffer
}
