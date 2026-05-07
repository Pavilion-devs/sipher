/**
 * Formatting utilities
 */

/**
 * Truncate a wallet address for display
 * @param address - Full wallet address
 * @param startChars - Number of characters to show at start
 * @param endChars - Number of characters to show at end
 * @returns Truncated address like "Abc1...xyz9"
 */
export function truncateAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format a number as currency
 * @param amount - Amount to format
 * @param decimals - Number of decimal places
 * @returns Formatted string like "1,234.56"
 */
export function formatAmount(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatAssetAmount(amount: number, asset?: string): string {
  if (asset === "SOL" && amount > 0 && amount < 0.01) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 9,
    }).format(amount);
  }

  if (amount > 0 && amount < 1) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  }

  return formatAmount(amount);
}

/**
 * Format USD currency
 * @param amount - Amount in USD
 * @returns Formatted string like "$1,234.56"
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format timestamp to relative time
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string like "2 min ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

/**
 * Format date for display
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  }
}

/**
 * Validate a Solana wallet address
 * @param address - Address to validate
 * @returns True if valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address) return false;
  // Solana addresses are base58 encoded and 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

export function getSolanaExplorerUrl(
  value: string,
  type: "tx" | "address" = "tx",
  network: string = "mainnet",
): string {
  const normalizedNetwork = network.toLowerCase();
  const cluster =
    normalizedNetwork === "mainnet" || normalizedNetwork === "mainnet-beta"
      ? ""
      : `?cluster=${encodeURIComponent(normalizedNetwork)}`;

  if (type === "address") {
    return `https://explorer.solana.com/address/${value}${cluster}`;
  }

  return `https://explorer.solana.com/tx/${value}${cluster}`;
}
