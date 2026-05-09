export type JupiterQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: "ExactIn" | "ExactOut";
  slippageBps: number;
  priceImpactPct: string;
};

export async function getJupiterExactOutQuote(input: {
  outputMint: string;
  outputAmount: string;
  slippageBps?: number;
}) {
  const params = new URLSearchParams({
    outputMint: input.outputMint,
    amount: input.outputAmount,
    swapMode: "ExactOut",
    slippageBps: String(input.slippageBps ?? 100),
  });

  const response = await fetch(`/api/jupiter/quote?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | { quote: JupiterQuote }
    | { error: string };

  if (!response.ok || !("quote" in payload)) {
    throw new Error(
      "error" in payload ? payload.error : "Failed to fetch Jupiter quote.",
    );
  }

  return payload.quote;
}
