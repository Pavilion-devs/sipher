export type Asset = "SOL" | "USDC" | "USDT";

export interface PayoutRecipient {
  id: string;
  name: string;
  address: string;
  amount: number;
  asset: Asset;
}

export type PayoutRoute = "withdraw" | "swap";

export interface PayoutRecipientExecution {
  recipientId: string;
  status: "queued" | "quoting" | "processing" | "completed" | "failed";
  route: PayoutRoute;
  updatedAt: number;
  signature?: string;
  quotedInputAmount?: number;
  quotedInputAsset?: Asset;
  quotedOutputAmount?: number;
  quotedOutputAsset?: Asset;
  error?: string;
}

export interface PayoutRun {
  id: string;
  title: string;
  note?: string;
  status: "draft" | "processing" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  recipients: PayoutRecipient[];
  totalUsd: number;
  totalRecipients: number;
  requiresSwap: boolean;
  signatures?: string[];
  execution?: PayoutRecipientExecution[];
  error?: string;
}

export interface TreasuryActivity {
  id: string;
  type: "shield" | "payout" | "swap" | "audit";
  title: string;
  asset: Asset | "MULTI";
  outputAsset?: Asset;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  runningBalance?: number;
  recipient?: string;
  signature: string;
  status: "pending" | "confirmed" | "failed";
  direction: "in" | "out" | "internal";
  createdAt: number;
}

export interface TreasurySnapshot {
  shieldedSol: number;
  shieldedUsdc: number;
  shieldedUsdt: number;
  privateVolumeUsd: number;
  feesPaidUsd: number;
  auditExports: number;
  pendingRuns: number;
}

export interface TreasuryOwnerKeypair {
  privateKey: string;
  publicKey: string;
}

export interface WalletOption {
  id: string;
  name: string;
  installUrl: string;
}

export interface ComplianceCache {
  csv: string;
  transactionCount: number;
  lastSignature?: string;
  generatedAt: number;
  rpcCallsMade?: number;
  afterTimestamp?: number;
  beforeTimestamp?: number;
}

export interface CloakRuntimeConfig {
  rpcUrl: string;
  relayUrl: string;
  programId: string;
  circuitsUrl: string;
  network: string;
}

export interface OperationLog {
  id: string;
  operation: "shield" | "payout" | "history" | "wallet";
  stage: string;
  status: "info" | "success" | "warning" | "error";
  message: string;
  createdAt: number;
  details?: Record<string, string | number | boolean | null>;
}
