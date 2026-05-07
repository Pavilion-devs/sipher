import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_INPUT_MINT = "So11111111111111111111111111111111111111112";
const PRIMARY_QUOTE_URL =
  process.env.JUPITER_QUOTE_API_URL?.trim() || "https://api.jup.ag/swap/v1/quote";
const FALLBACK_QUOTE_URL = "https://lite-api.jup.ag/swap/v1/quote";

async function requestQuote(
  baseUrl: string,
  params: URLSearchParams,
  apiKey?: string,
) {
  const headers: HeadersInit = {};

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return fetch(`${baseUrl}?${params.toString()}`, {
    headers,
    cache: "no-store",
  });
}

export async function GET(request: NextRequest) {
  const inputMint =
    request.nextUrl.searchParams.get("inputMint") || DEFAULT_INPUT_MINT;
  const outputMint = request.nextUrl.searchParams.get("outputMint");
  const amount = request.nextUrl.searchParams.get("amount");
  const swapMode = request.nextUrl.searchParams.get("swapMode") || "ExactOut";
  const slippageBps = request.nextUrl.searchParams.get("slippageBps") || "100";
  const apiKey = process.env.JUPITER_API_KEY?.trim();

  if (!outputMint || !amount) {
    return NextResponse.json(
      { error: "Missing required outputMint or amount query parameter." },
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    swapMode,
    slippageBps,
    restrictIntermediateTokens: "true",
  });

  try {
    let response = await requestQuote(PRIMARY_QUOTE_URL, params, apiKey);

    if (
      !response.ok &&
      (response.status === 401 || response.status === 403) &&
      PRIMARY_QUOTE_URL !== FALLBACK_QUOTE_URL &&
      !apiKey
    ) {
      response = await requestQuote(FALLBACK_QUOTE_URL, params);
    }

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        {
          error:
            body ||
            `Jupiter quote request failed with status ${response.status}.`,
        },
        { status: response.status },
      );
    }

    const quote = await response.json();
    return NextResponse.json({ quote });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Jupiter quote request failed.",
      },
      { status: 500 },
    );
  }
}
