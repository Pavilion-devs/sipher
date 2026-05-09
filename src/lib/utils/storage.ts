import type {
  ComplianceCache,
  Network,
  PayoutRun,
  TreasuryActivity,
  TreasuryOwnerKeypair,
} from "@/types";

const GLOBAL_KEYS = {
  network: "sipher_network",
  selectedWallet: "sipher_selected_wallet",
} as const;

const NETWORK_KEY_BASES = {
  payoutRuns: "sipher_runs",
  manualActivities: "sipher_manual_activities",
  utxoWallet: "sipher_utxo_wallet",
  treasuryOwner: "sipher_owner",
  complianceCache: "sipher_compliance_cache",
} as const;

const LEGACY_KEY_BASES: Record<keyof typeof NETWORK_KEY_BASES, string> = {
  payoutRuns: "shadow_treasury_runs",
  manualActivities: "shadow_treasury_manual_activities",
  utxoWallet: "shadow_treasury_utxo_wallet",
  treasuryOwner: "shadow_treasury_owner",
  complianceCache: "shadow_treasury_compliance_cache",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getStoredNetworkRaw(): Network {
  if (!canUseStorage()) return "mainnet";
  return (window.localStorage.getItem(GLOBAL_KEYS.network) as Network) || "mainnet";
}

function getNetworkedKey(base: keyof typeof NETWORK_KEY_BASES): string {
  return `${NETWORK_KEY_BASES[base]}_${getStoredNetworkRaw()}`;
}

function getNetworkedItem(base: keyof typeof NETWORK_KEY_BASES): string | null {
  if (!canUseStorage()) return null;
  const key = getNetworkedKey(base);
  const value = window.localStorage.getItem(key);
  if (value !== null) return value;

  // Mainnet only: migrate data from legacy unnamespaced keys on first access
  if (getStoredNetworkRaw() === "mainnet") {
    const unnamedValue = window.localStorage.getItem(NETWORK_KEY_BASES[base]);
    if (unnamedValue !== null) {
      window.localStorage.setItem(key, unnamedValue);
      return unnamedValue;
    }
    const legacyValue = window.localStorage.getItem(LEGACY_KEY_BASES[base]);
    if (legacyValue !== null) {
      window.localStorage.setItem(key, legacyValue);
      return legacyValue;
    }
  }

  return null;
}

function setNetworkedItem(base: keyof typeof NETWORK_KEY_BASES, value: string | null) {
  if (!canUseStorage()) return;
  const key = getNetworkedKey(base);
  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, value);
}

export function getStoredNetwork(): Network {
  return getStoredNetworkRaw();
}

export function setStoredNetwork(network: Network) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(GLOBAL_KEYS.network, network);
}

export function getSelectedWalletId() {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(GLOBAL_KEYS.selectedWallet);
}

export function setSelectedWalletId(walletId: string | null) {
  if (!canUseStorage()) return;
  if (walletId === null) {
    window.localStorage.removeItem(GLOBAL_KEYS.selectedWallet);
    return;
  }
  window.localStorage.setItem(GLOBAL_KEYS.selectedWallet, walletId);
}

export function getPayoutRuns(): PayoutRun[] {
  return safeParse<PayoutRun[]>(getNetworkedItem("payoutRuns"), []);
}

export function setPayoutRuns(runs: PayoutRun[]) {
  setNetworkedItem("payoutRuns", JSON.stringify(runs));
}

export function getManualActivities(): TreasuryActivity[] {
  return safeParse<TreasuryActivity[]>(getNetworkedItem("manualActivities"), []);
}

export function setManualActivities(activities: TreasuryActivity[]) {
  setNetworkedItem("manualActivities", JSON.stringify(activities));
}

export function getStoredUtxoWallet() {
  return getNetworkedItem("utxoWallet");
}

export function setStoredUtxoWallet(serializedWallet: string | null) {
  setNetworkedItem("utxoWallet", serializedWallet);
}

export function getTreasuryOwner() {
  return safeParse<TreasuryOwnerKeypair | null>(getNetworkedItem("treasuryOwner"), null);
}

export function setTreasuryOwner(owner: TreasuryOwnerKeypair | null) {
  setNetworkedItem("treasuryOwner", owner ? JSON.stringify(owner) : null);
}

export function getComplianceCache() {
  return safeParse<ComplianceCache | null>(getNetworkedItem("complianceCache"), null);
}

export function setComplianceCache(cache: ComplianceCache | null) {
  setNetworkedItem("complianceCache", cache ? JSON.stringify(cache) : null);
}
