import type {
  ComplianceCache,
  PayoutRun,
  TreasuryActivity,
  TreasuryOwnerKeypair,
} from "@/types";

const STORAGE_KEYS = {
  selectedWallet: "sipher_selected_wallet",
  payoutRuns: "sipher_runs",
  manualActivities: "sipher_manual_activities",
  utxoWallet: "sipher_utxo_wallet",
  treasuryOwner: "sipher_owner",
  complianceCache: "sipher_compliance_cache",
} as const;

const LEGACY_STORAGE_KEYS: Record<keyof typeof STORAGE_KEYS, string> = {
  selectedWallet: "shadow_treasury_selected_wallet",
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

function getItem(keyName: keyof typeof STORAGE_KEYS) {
  if (!canUseStorage()) return null;

  const key = STORAGE_KEYS[keyName];
  const value = window.localStorage.getItem(key);
  if (value !== null) return value;

  const legacyValue = window.localStorage.getItem(LEGACY_STORAGE_KEYS[keyName]);
  if (legacyValue !== null) {
    window.localStorage.setItem(key, legacyValue);
  }

  return legacyValue;
}

function setItem(keyName: keyof typeof STORAGE_KEYS, value: string | null) {
  if (!canUseStorage()) return;

  const key = STORAGE_KEYS[keyName];

  if (value === null) {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(LEGACY_STORAGE_KEYS[keyName]);
    return;
  }

  window.localStorage.setItem(key, value);
}

export function getSelectedWalletId() {
  return getItem("selectedWallet");
}

export function setSelectedWalletId(walletId: string | null) {
  setItem("selectedWallet", walletId);
}

export function getPayoutRuns(): PayoutRun[] {
  return safeParse<PayoutRun[]>(getItem("payoutRuns"), []);
}

export function setPayoutRuns(runs: PayoutRun[]) {
  setItem("payoutRuns", JSON.stringify(runs));
}

export function getManualActivities(): TreasuryActivity[] {
  return safeParse<TreasuryActivity[]>(getItem("manualActivities"), []);
}

export function setManualActivities(activities: TreasuryActivity[]) {
  setItem("manualActivities", JSON.stringify(activities));
}

export function getStoredUtxoWallet() {
  return getItem("utxoWallet");
}

export function setStoredUtxoWallet(serializedWallet: string | null) {
  setItem("utxoWallet", serializedWallet);
}

export function getTreasuryOwner() {
  return safeParse<TreasuryOwnerKeypair | null>(
    getItem("treasuryOwner"),
    null,
  );
}

export function setTreasuryOwner(owner: TreasuryOwnerKeypair | null) {
  setItem("treasuryOwner", owner ? JSON.stringify(owner) : null);
}

export function getComplianceCache() {
  return safeParse<ComplianceCache | null>(
    getItem("complianceCache"),
    null,
  );
}

export function setComplianceCache(cache: ComplianceCache | null) {
  setItem("complianceCache", cache ? JSON.stringify(cache) : null);
}
