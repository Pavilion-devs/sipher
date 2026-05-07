"use client";

import "@/lib/polyfills/buffer";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  calculateFeeBigint,
  NATIVE_SOL_MINT,
  UtxoWallet,
  createUtxo,
  createZeroUtxo,
  formatComplianceCsv,
  getNkFromUtxoPrivateKey,
  isRootNotFoundError,
  parseError,
  partialWithdraw,
  scanTransactions,
  setCircuitsPath,
  swapWithChange,
  toComplianceReport,
  transact,
} from "@cloak.dev/sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import type { ComplianceReport, MerkleTree, UtxoKeypair } from "@cloak.dev/sdk";
import type {
  Asset,
  ComplianceCache,
  OperationLog,
  PayoutRecipient,
  PayoutRecipientExecution,
  PayoutRun,
  TreasuryActivity,
  TreasuryOwnerKeypair,
  TreasurySnapshot,
  WalletOption,
} from "@/types";
import { CLOAK_RUNTIME, getMintForAsset } from "@/lib/cloak/config";
import {
  MIN_SHIELD_SOL,
  assetAmountToUnits,
  bigintToDisplayAmount,
  grossUpSolWithdrawal,
  inferUsdValue,
  lamportsToSol,
  solToLamports,
  unitsToAssetAmount,
} from "@/lib/cloak/amounts";
import { getJupiterExactOutQuote } from "@/lib/jupiter/client";
import {
  getComplianceCache,
  getManualActivities,
  getPayoutRuns,
  getSelectedWalletId,
  getStoredUtxoWallet,
  getTreasuryOwner,
  setComplianceCache,
  setManualActivities,
  setPayoutRuns,
  setSelectedWalletId,
  setStoredUtxoWallet,
  setTreasuryOwner,
} from "@/lib/utils/storage";
import {
  getDefaultWalletInstall,
  getInstalledWallets,
  normalizeSignedMessage,
} from "@/lib/solana/injected";

type AppContextValue = {
  isConnected: boolean;
  isConnecting: boolean;
  isShielding: boolean;
  isSubmittingRun: boolean;
  isScanning: boolean;
  publicKey: string | null;
  walletLabel: string | null;
  availableWallets: WalletOption[];
  payoutRuns: PayoutRun[];
  activities: TreasuryActivity[];
  snapshot: TreasurySnapshot;
  runtime: typeof CLOAK_RUNTIME;
  statusMessage: string | null;
  lastError: string | null;
  hasTreasuryOwner: boolean;
  treasuryUtxoCount: number;
  historyCount: number;
  historyGeneratedAt: number | null;
  historyLastSignature: string | null;
  historyRpcCalls: number;
  historyWindow: {
    afterTimestamp?: number;
    beforeTimestamp?: number;
  } | null;
  operationLogs: OperationLog[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  shieldFunds: (amountSol: number) => Promise<void>;
  createPayoutRun: (input: {
    title: string;
    note?: string;
    recipients: PayoutRecipient[];
  }) => Promise<void>;
  rescanHistory: (options?: {
    afterTimestamp?: number;
    beforeTimestamp?: number;
  }) => Promise<void>;
  exportHistoryCsv: (options?: {
    afterTimestamp?: number;
    beforeTimestamp?: number;
  }) => Promise<void>;
  clearHistoryCache: () => void;
  clearOperationLogs: () => void;
  clearStatus: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function ownerToKeypair(owner: TreasuryOwnerKeypair): UtxoKeypair {
  return {
    privateKey: BigInt(owner.privateKey),
    publicKey: BigInt(owner.publicKey),
  };
}

function buildWallet(owner: TreasuryOwnerKeypair | null, serializedWallet: string | null) {
  if (serializedWallet) {
    try {
      return UtxoWallet.deserialize(serializedWallet);
    } catch {
      setStoredUtxoWallet(null);
    }
  }

  if (!owner) return null;

  return new UtxoWallet(getNkFromUtxoPrivateKey(BigInt(owner.privateKey)));
}

function inferKnownAsset(symbol?: string): Asset | undefined {
  const normalized = (symbol || "").toUpperCase();

  if (normalized.includes("USDC")) return "USDC";
  if (normalized.includes("USDT")) return "USDT";
  if (normalized.includes("SOL")) return "SOL";
  return undefined;
}

function inferActivityAsset(symbol?: string) {
  return inferKnownAsset(symbol) || "SOL";
}

function parseComplianceReport(cache: ComplianceCache | null) {
  if (!cache) return null as ComplianceReport | null;

  try {
    return JSON.parse(cache.csv) as ComplianceReport;
  } catch {
    return null as ComplianceReport | null;
  }
}

function isWithinWindow(
  timestamp: number,
  afterTimestamp?: number,
  beforeTimestamp?: number,
) {
  if (typeof afterTimestamp === "number" && timestamp < afterTimestamp) return false;
  if (typeof beforeTimestamp === "number" && timestamp > beforeTimestamp) return false;
  return true;
}

function filterComplianceReport(
  report: ComplianceReport,
  afterTimestamp?: number,
  beforeTimestamp?: number,
) {
  if (
    typeof afterTimestamp !== "number" &&
    typeof beforeTimestamp !== "number"
  ) {
    return report;
  }

  const transactions = report.transactions
    .filter((transaction) =>
      isWithinWindow(transaction.timestamp, afterTimestamp, beforeTimestamp),
    )
    .sort((left, right) => left.timestamp - right.timestamp);

  const summary = transactions.reduce(
    (totals, transaction) => {
      if (transaction.txType === "deposit") {
        totals.totalDeposits += transaction.amount;
      } else {
        totals.totalWithdrawals += transaction.amount;
        totals.totalFees += transaction.fee;
      }

      return totals;
    },
    {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalFees: 0,
    },
  );

  return {
    ...report,
    transactions,
    summary: {
      totalDeposits: summary.totalDeposits,
      totalWithdrawals: summary.totalWithdrawals,
      totalFees: summary.totalFees,
      netChange: summary.totalDeposits - summary.totalWithdrawals,
      transactionCount: transactions.length,
      finalBalance: transactions[transactions.length - 1]?.runningBalance || 0,
    },
    lastSignature:
      [...transactions].sort((left, right) => right.timestamp - left.timestamp)[0]
        ?.signature || report.lastSignature,
  } satisfies ComplianceReport;
}

function mapComplianceReportToActivities(report: ComplianceReport | null) {
  if (!report) return [] as TreasuryActivity[];

  try {
    return report.transactions.map((transaction, index) => {
      const asset = inferActivityAsset(transaction.symbol);
      const outputAsset = inferKnownAsset(transaction.outputSymbol);
      const type =
        transaction.txType === "deposit"
          ? "shield"
          : transaction.txType === "swap"
            ? "swap"
            : "payout";
      const decimals = transaction.decimals ?? 9;

      const grossAmount =
        asset === "SOL"
          ? bigintToDisplayAmount(BigInt(transaction.amount), decimals)
          : bigintToDisplayAmount(BigInt(transaction.amount), decimals);
      const feeAmount =
        asset === "SOL"
          ? bigintToDisplayAmount(BigInt(transaction.fee), decimals)
          : bigintToDisplayAmount(BigInt(transaction.fee), decimals);
      const netAmount =
        asset === "SOL"
          ? bigintToDisplayAmount(BigInt(transaction.netAmount), decimals)
          : bigintToDisplayAmount(BigInt(transaction.netAmount), decimals);

      return {
        id: `scan-${transaction.signature || transaction.timestamp}-${index}`,
        type,
        title:
          type === "shield"
            ? "Treasury funds shielded"
            : type === "swap"
              ? `Private swap routed to ${transaction.outputSymbol || "token"}`
              : "Private payout settled",
        asset,
        outputAsset,
        grossAmount,
        feeAmount,
        netAmount,
        runningBalance: bigintToDisplayAmount(
          BigInt(transaction.runningBalance),
          decimals,
        ),
        recipient: transaction.recipient,
        signature: transaction.signature || `scan-${transaction.timestamp}-${index}`,
        status: "confirmed",
        direction: type === "shield" ? "in" : "out",
        createdAt: transaction.timestamp,
      } satisfies TreasuryActivity;
    });
  } catch {
    return [] as TreasuryActivity[];
  }
}

function mergeActivities(
  scannedActivities: TreasuryActivity[],
  manualActivities: TreasuryActivity[],
) {
  const seenConfirmed = new Set(
    scannedActivities.map((activity) => `${activity.type}:${activity.signature}`),
  );

  const dedupedManual = manualActivities.filter((activity) => {
    if (activity.type === "audit") return true;
    if (activity.status !== "confirmed") return true;
    return !seenConfirmed.has(`${activity.type}:${activity.signature}`);
  });

  return [...dedupedManual, ...scannedActivities].sort(
    (left, right) => right.createdAt - left.createdAt,
  );
}

function buildSnapshot(
  wallet: UtxoWallet | null,
  activities: TreasuryActivity[],
  payoutRuns: PayoutRun[],
) {
  const totalFeesUsd = activities.reduce((sum, activity) => {
    return sum + inferUsdValue(activity.asset, activity.feeAmount);
  }, 0);

  const privateVolumeUsd = activities.reduce((sum, activity) => {
    if (activity.direction !== "out" || activity.status !== "confirmed") return sum;
    return sum + inferUsdValue(activity.asset, activity.netAmount);
  }, 0);

  return {
    shieldedSol: wallet ? lamportsToSol(wallet.getBalance(NATIVE_SOL_MINT)) : 0,
    shieldedUsdc: 0,
    shieldedUsdt: 0,
    privateVolumeUsd,
    feesPaidUsd: totalFeesUsd,
    auditExports: activities.filter((activity) => activity.type === "audit").length,
    pendingRuns: payoutRuns.filter((run) => run.status === "processing").length,
  } satisfies TreasurySnapshot;
}

function updateExecutionState(
  run: PayoutRun,
  recipientId: string,
  patch: Partial<PayoutRecipientExecution>,
) {
  return {
    ...run,
    execution:
      run.execution?.map((step) =>
        step.recipientId === recipientId
          ? {
              ...step,
              ...patch,
              updatedAt: Date.now(),
            }
          : step,
      ) || [],
  } satisfies PayoutRun;
}

function downloadCsvFile(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function maskUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of url.searchParams.keys()) {
      if (/key|token|secret|password/i.test(key)) {
        url.searchParams.set(key, "redacted");
      }
    }
    return url.toString();
  } catch {
    return value.replace(/(api[-_]?key=)[^&\s]+/i, "$1redacted");
  }
}

function getHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}

async function probeUrl(url: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      durationMs: Math.round(performance.now() - startedAt),
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function toFriendlyError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (
    rawMessage.includes("failed to get info about account") &&
    rawMessage.includes("403") &&
    rawMessage.toLowerCase().includes("access forbidden")
  ) {
    return [
      "The current Solana RPC refused to read Cloak's Merkle tree account.",
      "Set NEXT_PUBLIC_SOLANA_RPC_URL to a reliable mainnet RPC provider URL, restart the dev server, then retry shielding.",
    ].join(" ");
  }

  const parsed = parseError(error);
  return parsed.message || rawMessage || "Action failed.";
}

function toDiagnosticError(error: unknown) {
  const friendly = toFriendlyError(error);
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (!rawMessage || rawMessage === friendly) {
    return friendly;
  }

  return `${friendly} Raw: ${rawMessage}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const walletRef = useRef<ReturnType<typeof getInstalledWallets>[number] | null>(
    null,
  );
  const merkleTreeRef = useRef<MerkleTree | null>(null);
  const connection = useMemo(
    () => new Connection(CLOAK_RUNTIME.rpcUrl, "confirmed"),
    [],
  );
  const programId = useMemo(
    () => new PublicKey(CLOAK_RUNTIME.programId),
    [],
  );
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([]);
  const [walletLabel, setWalletLabel] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isShielding, setIsShielding] = useState(false);
  const [isSubmittingRun, setIsSubmittingRun] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [payoutRuns, setLocalPayoutRuns] = useState<PayoutRun[]>(() =>
    getPayoutRuns(),
  );
  const [manualActivities, setLocalManualActivities] = useState<TreasuryActivity[]>(
    () => getManualActivities(),
  );
  const [treasuryOwner, setLocalTreasuryOwner] = useState<TreasuryOwnerKeypair | null>(
    () => getTreasuryOwner(),
  );
  const [serializedWallet, setSerializedWallet] = useState<string | null>(() =>
    getStoredUtxoWallet(),
  );
  const [complianceCache, setLocalComplianceCache] = useState<ComplianceCache | null>(
    () => getComplianceCache(),
  );
  const complianceReport = useMemo(
    () => parseComplianceReport(complianceCache),
    [complianceCache],
  );

  const treasuryWallet = useMemo(
    () => buildWallet(treasuryOwner, serializedWallet),
    [serializedWallet, treasuryOwner],
  );
  const scannedActivities = useMemo(
    () => mapComplianceReportToActivities(complianceReport),
    [complianceReport],
  );
  const activities = useMemo(
    () => mergeActivities(scannedActivities, manualActivities),
    [manualActivities, scannedActivities],
  );
  const snapshot = useMemo(
    () => buildSnapshot(treasuryWallet, activities, payoutRuns),
    [activities, payoutRuns, treasuryWallet],
  );

  useEffect(() => {
    setCircuitsPath(CLOAK_RUNTIME.circuitsUrl);
  }, []);

  useEffect(() => {
    const detectWallets = () => {
      const nextWallets = getInstalledWallets();
      setAvailableWallets(
        nextWallets.map(({ id, name, installUrl }) => ({
          id,
          name,
          installUrl,
        })),
      );

      const savedWalletId = getSelectedWalletId();
      const preferredWallet =
        nextWallets.find((wallet) => wallet.id === savedWalletId) || nextWallets[0];

      if (!preferredWallet) return;

      walletRef.current = preferredWallet;
      setWalletLabel(preferredWallet.name);

      const connectedKey = preferredWallet.provider.publicKey?.toBase58() || null;
      if (connectedKey) {
        setPublicKey(connectedKey);
      }
    };

    detectWallets();
    window.addEventListener("focus", detectWallets);

    return () => window.removeEventListener("focus", detectWallets);
  }, []);

  const persistPayoutRuns = useCallback((nextRuns: PayoutRun[]) => {
    setLocalPayoutRuns(nextRuns);
    setPayoutRuns(nextRuns);
  }, []);

  const persistManualActivities = useCallback(
    (nextActivities: TreasuryActivity[]) => {
      setLocalManualActivities(nextActivities);
      setManualActivities(nextActivities);
    },
    [],
  );

  const persistTreasuryOwner = useCallback((nextOwner: TreasuryOwnerKeypair | null) => {
    setLocalTreasuryOwner(nextOwner);
    setTreasuryOwner(nextOwner);
  }, []);

  const persistWallet = useCallback((wallet: UtxoWallet | null) => {
    const nextSerialized = wallet ? wallet.serialize() : null;
    setSerializedWallet(nextSerialized);
    setStoredUtxoWallet(nextSerialized);
  }, []);

  const persistCompliance = useCallback((nextCache: ComplianceCache | null) => {
    setLocalComplianceCache(nextCache);
    setComplianceCache(nextCache);
  }, []);

  const clearStatus = useCallback(() => {
    setStatusMessage(null);
    setLastError(null);
  }, []);

  const appendOperationLog = useCallback(
    (
      entry: Omit<OperationLog, "id" | "createdAt">,
    ) => {
      const nextEntry = {
        ...entry,
        id: `${entry.operation}-${entry.stage}-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`,
        createdAt: Date.now(),
      } satisfies OperationLog;

      setOperationLogs((current) => [nextEntry, ...current].slice(0, 80));

      const payload = nextEntry.details ? { ...nextEntry.details } : undefined;
      const logMethod = entry.status === "error" ? "error" : "info";
      console[logMethod](
        `[Sipher:${entry.operation}] ${entry.stage}: ${entry.message}`,
        payload || "",
      );
    },
    [],
  );

  const clearOperationLogs = useCallback(() => {
    setOperationLogs([]);
  }, []);

  const clearHistoryCache = useCallback(() => {
    persistCompliance(null);
    setLastError(null);
    setStatusMessage("History cache cleared. Run a fresh scan to rebuild the audit trail.");
  }, [persistCompliance]);

  const ensureTreasuryOwner = useCallback(async () => {
    if (treasuryOwner) {
      return ownerToKeypair(treasuryOwner);
    }

    const { generateUtxoKeypair } = await import("@cloak.dev/sdk");
    const nextOwner = await generateUtxoKeypair();

    const persistedOwner = {
      privateKey: nextOwner.privateKey.toString(),
      publicKey: nextOwner.publicKey.toString(),
    } satisfies TreasuryOwnerKeypair;

    persistTreasuryOwner(persistedOwner);
    persistWallet(new UtxoWallet(getNkFromUtxoPrivateKey(nextOwner.privateKey)));
    return nextOwner;
  }, [persistTreasuryOwner, persistWallet, treasuryOwner]);

  const ensureConnectedWallet = useCallback(() => {
    const activeWallet = walletRef.current;

    if (!activeWallet || !publicKey) {
      throw new Error("Connect a supported wallet to continue.");
    }

    const { provider } = activeWallet;

    if (!provider.signTransaction || !provider.signMessage) {
      throw new Error(
        `${activeWallet.name} must support both transaction signing and message signing for Cloak.`,
      );
    }

    return {
      activeWallet,
      walletPublicKey: new PublicKey(publicKey),
      signTransaction: provider.signTransaction,
      signMessage: async (message: Uint8Array) =>
        normalizeSignedMessage(await provider.signMessage!(message)),
    };
  }, [publicKey]);

  const connect = useCallback(async () => {
    clearStatus();
    setIsConnecting(true);

    try {
      const detectedWallets = getInstalledWallets();
      setAvailableWallets(
        detectedWallets.map(({ id, name, installUrl }) => ({
          id,
          name,
          installUrl,
        })),
      );

      const savedWalletId = getSelectedWalletId();
      const selectedWallet =
        detectedWallets.find((wallet) => wallet.id === savedWalletId) ||
        detectedWallets[0];

      if (!selectedWallet) {
        const installWallet = getDefaultWalletInstall();
        window.open(installWallet.url, "_blank", "noopener,noreferrer");
        throw new Error(
          `No supported Solana wallet found. Install ${installWallet.name} and reload the app.`,
        );
      }

      walletRef.current = selectedWallet;
      setWalletLabel(selectedWallet.name);
      setSelectedWalletId(selectedWallet.id);
      await selectedWallet.provider.connect();

      const nextPublicKey = selectedWallet.provider.publicKey?.toBase58() || null;

      if (!nextPublicKey) {
        throw new Error("Wallet connected, but no public key was returned.");
      }

      setPublicKey(nextPublicKey);
      setStatusMessage(`${selectedWallet.name} connected. Treasury actions are live.`);
    } catch (error) {
      setLastError(toFriendlyError(error));
    } finally {
      setIsConnecting(false);
    }
  }, [clearStatus]);

  const disconnect = useCallback(async () => {
    clearStatus();

    try {
      await walletRef.current?.provider.disconnect?.();
    } finally {
      setPublicKey(null);
      setWalletLabel(walletRef.current?.name || null);
    }
  }, [clearStatus]);

  const rescanHistory = useCallback(async (options?: {
    afterTimestamp?: number;
    beforeTimestamp?: number;
  }) => {
    clearStatus();

    if (!treasuryOwner) {
      setStatusMessage(
        "History scanning becomes available after the treasury shields its first deposit.",
      );
      return;
    }

    const afterTimestamp = options?.afterTimestamp;
    const beforeTimestamp = options?.beforeTimestamp;

    if (
      typeof afterTimestamp === "number" &&
      typeof beforeTimestamp === "number" &&
      afterTimestamp > beforeTimestamp
    ) {
      throw new Error("Start date must be before end date.");
    }

    setIsScanning(true);

    try {
      const nk = getNkFromUtxoPrivateKey(BigInt(treasuryOwner.privateKey));
      const scanResult = await scanTransactions({
        connection,
        programId,
        viewingKeyNk: nk,
        walletPublicKey: publicKey || undefined,
        afterTimestamp,
        beforeTimestamp,
        onStatus: (status) => setStatusMessage(`History: ${status}`),
        onProgress: (processed, total) =>
          setStatusMessage(`History: scanned ${processed}/${total} transactions`),
      });
      const report = toComplianceReport(scanResult);
      const nextCache = {
        csv: JSON.stringify(report),
        transactionCount: report.summary.transactionCount,
        lastSignature: scanResult.lastSignature,
        generatedAt: Date.now(),
        rpcCallsMade: scanResult.rpcCallsMade,
        afterTimestamp,
        beforeTimestamp,
      } satisfies ComplianceCache;

      persistCompliance(nextCache);
      setStatusMessage(
        `History refreshed. ${report.summary.transactionCount} Cloak transactions decoded${
          typeof afterTimestamp === "number" || typeof beforeTimestamp === "number"
            ? " for the selected window"
            : ""
        }.`,
      );
    } catch (error) {
      const friendly = toFriendlyError(error);
      setLastError(friendly);
      throw error;
    } finally {
      setIsScanning(false);
    }
  }, [clearStatus, connection, persistCompliance, programId, publicKey, treasuryOwner]);

  const shieldFunds = useCallback(
    async (amountSol: number) => {
      clearStatus();
      clearOperationLogs();

      if (!Number.isFinite(amountSol) || amountSol < MIN_SHIELD_SOL) {
        throw new Error(`Shield at least ${MIN_SHIELD_SOL} SOL to open the pool.`);
      }

      setIsShielding(true);
      const startedAt = performance.now();
      let lastProofBucket = -1;

      try {
        appendOperationLog({
          operation: "shield",
          stage: "start",
          status: "info",
          message: "Shield flow started.",
          details: {
            amountSol,
            rpcHost: getHost(CLOAK_RUNTIME.rpcUrl),
            relayHost: getHost(CLOAK_RUNTIME.relayUrl),
            circuitsUrl: maskUrl(CLOAK_RUNTIME.circuitsUrl),
            programId: CLOAK_RUNTIME.programId,
          },
        });

        appendOperationLog({
          operation: "shield",
          stage: "runtime-check",
          status:
            typeof globalThis.Buffer?.from(new Uint8Array(8)).readBigInt64LE ===
            "function"
              ? "success"
              : "error",
          message: "Checked browser Buffer compatibility.",
          details: {
            hasReadBigInt64LE:
              typeof globalThis.Buffer?.from(new Uint8Array(8)).readBigInt64LE ===
              "function",
          },
        });

        const [walletState, owner] = await Promise.all([
          Promise.resolve(ensureConnectedWallet()),
          ensureTreasuryOwner(),
        ]);

        appendOperationLog({
          operation: "shield",
          stage: "wallet-ready",
          status: "success",
          message: "Wallet and treasury owner are ready.",
          details: {
            wallet: walletState.activeWallet.name,
            publicKey: walletState.walletPublicKey.toBase58(),
            hasSignTransaction: Boolean(walletState.signTransaction),
            hasSignMessage: Boolean(walletState.signMessage),
          },
        });

        const zkeyUrl = `${CLOAK_RUNTIME.circuitsUrl.replace(
          /\/$/,
          "",
        )}/transaction_final.zkey`;

        appendOperationLog({
          operation: "shield",
          stage: "circuit-probe",
          status: "info",
          message: "Probing transaction proving key before proof generation.",
          details: {
            url: maskUrl(zkeyUrl),
          },
        });

        try {
          const probe = await probeUrl(zkeyUrl);
          appendOperationLog({
            operation: "shield",
            stage: "circuit-probe",
            status: probe.ok ? "success" : "warning",
            message: probe.ok
              ? "Circuit proving key is reachable."
              : "Circuit proving key responded with a non-OK status.",
            details: {
              status: probe.status,
              durationMs: probe.durationMs,
            },
          });
        } catch (probeError) {
          appendOperationLog({
            operation: "shield",
            stage: "circuit-probe",
            status: "error",
            message: "Circuit proving key probe failed before Cloak proof generation.",
            details: {
              error:
                probeError instanceof Error
                  ? probeError.message
                  : String(probeError),
            },
          });
        }

        appendOperationLog({
          operation: "shield",
          stage: "utxo-create",
          status: "info",
          message: "Creating output UTXO for the shielded deposit.",
          details: {
            mint: NATIVE_SOL_MINT.toBase58(),
            lamports: solToLamports(amountSol).toString(),
          },
        });

        const output = await createUtxo(
          solToLamports(amountSol),
          owner,
          NATIVE_SOL_MINT,
        );

        appendOperationLog({
          operation: "shield",
          stage: "transact",
          status: "info",
          message: "Calling Cloak transact deposit path.",
          details: {
            relayUrl: maskUrl(CLOAK_RUNTIME.relayUrl),
            rpcUrl: maskUrl(CLOAK_RUNTIME.rpcUrl),
          },
        });

        const result = await transact(
          {
            inputUtxos: [await createZeroUtxo(NATIVE_SOL_MINT)],
            outputUtxos: [output],
            externalAmount: solToLamports(amountSol),
            depositor: walletState.walletPublicKey,
          },
          {
            connection,
            programId,
            relayUrl: CLOAK_RUNTIME.relayUrl,
            signTransaction: async (transaction) => {
              appendOperationLog({
                operation: "shield",
                stage: "wallet-sign-transaction",
                status: "info",
                message: "Wallet transaction signature requested.",
              });
              const signed = await walletState.signTransaction(transaction);
              appendOperationLog({
                operation: "shield",
                stage: "wallet-sign-transaction",
                status: "success",
                message: "Wallet transaction signature returned.",
              });
              return signed;
            },
            signMessage: async (message) => {
              appendOperationLog({
                operation: "shield",
                stage: "wallet-sign-message",
                status: "info",
                message: "Wallet message signature requested.",
                details: {
                  bytes: message.length,
                },
              });
              const signed = await walletState.signMessage(message);
              appendOperationLog({
                operation: "shield",
                stage: "wallet-sign-message",
                status: "success",
                message: "Wallet message signature returned.",
              });
              return signed;
            },
            depositorPublicKey: walletState.walletPublicKey,
            walletPublicKey: walletState.walletPublicKey,
            onProgress: (status) => {
              setStatusMessage(`Shield: ${status}`);
              appendOperationLog({
                operation: "shield",
                stage: "sdk-progress",
                status: "info",
                message: status,
              });
            },
            onProofProgress: (progress) => {
              setStatusMessage(`Shield proof: ${progress}%`);
              const bucket = Math.floor(progress / 10) * 10;
              if (bucket !== lastProofBucket || progress === 100) {
                lastProofBucket = bucket;
                appendOperationLog({
                  operation: "shield",
                  stage: "proof-progress",
                  status: "info",
                  message: `Proof generation ${progress}%.`,
                  details: {
                    progress,
                  },
                });
              }
            },
          },
        );

        appendOperationLog({
          operation: "shield",
          stage: "transact-success",
          status: "success",
          message: "Cloak shield transaction completed.",
          details: {
            signature: result.signature,
            durationMs: Math.round(performance.now() - startedAt),
            outputUtxos: result.outputUtxos.length,
          },
        });

        const nextWallet =
          treasuryWallet ||
          new UtxoWallet(getNkFromUtxoPrivateKey(owner.privateKey));

        result.outputUtxos.forEach((utxo, index) => {
          const commitmentIndex = result.commitmentIndices[index];
          if (typeof commitmentIndex === "number" && commitmentIndex >= 0) {
            utxo.index = commitmentIndex;
          }

          nextWallet.addUtxo(utxo, utxo.mintAddress);
        });

        merkleTreeRef.current = result.merkleTree || null;
        persistWallet(nextWallet);

        const activity = {
          id: `shield-${result.signature}`,
          type: "shield",
          title: "Treasury funds shielded",
          asset: "SOL",
          grossAmount: amountSol,
          feeAmount: 0,
          netAmount: amountSol,
          signature: result.signature,
          status: "confirmed",
          direction: "in",
          createdAt: Date.now(),
        } satisfies TreasuryActivity;

        persistManualActivities([activity, ...manualActivities]);
        setStatusMessage(`Shielded ${amountSol} SOL into Cloak.`);
      } catch (error) {
        const friendly = toFriendlyError(error);
        appendOperationLog({
          operation: "shield",
          stage: "failed",
          status: "error",
          message: friendly,
          details: {
            durationMs: Math.round(performance.now() - startedAt),
            rawError: error instanceof Error ? error.message : String(error),
          },
        });
        setLastError(friendly);
        throw error;
      } finally {
        setIsShielding(false);
      }
    },
    [
      clearStatus,
      clearOperationLogs,
      connection,
      appendOperationLog,
      ensureConnectedWallet,
      ensureTreasuryOwner,
      manualActivities,
      persistManualActivities,
      persistWallet,
      programId,
      treasuryWallet,
    ],
  );

  const createPayoutRun = useCallback(
    async ({
      title,
      note,
      recipients,
    }: {
      title: string;
      note?: string;
      recipients: PayoutRecipient[];
    }) => {
      clearStatus();
      clearOperationLogs();

      const cleanedRecipients = recipients.filter(
        (recipient) =>
          recipient.name.trim().length > 0 &&
          recipient.address.trim().length > 0 &&
          recipient.amount > 0,
      );

      if (cleanedRecipients.length === 0) {
        throw new Error("Add at least one valid payout recipient.");
      }

      if (!treasuryWallet) {
        throw new Error("Shield treasury funds first so the payout engine has UTXOs to spend.");
      }

      setIsSubmittingRun(true);
      const startedAt = performance.now();

      const now = Date.now();
      const nextRun = {
        id: `run-${now}`,
        title,
        note,
        status: "processing",
        createdAt: now,
        recipients: cleanedRecipients,
        totalUsd: cleanedRecipients.reduce(
          (sum, recipient) => sum + inferUsdValue(recipient.asset, recipient.amount),
          0,
        ),
        totalRecipients: cleanedRecipients.length,
        requiresSwap: cleanedRecipients.some((recipient) => recipient.asset !== "SOL"),
        execution: cleanedRecipients.map((recipient) => ({
          recipientId: recipient.id,
          status: "queued",
          route: recipient.asset === "SOL" ? "withdraw" : "swap",
          updatedAt: now,
        })),
      } satisfies PayoutRun;

      let runsState = [nextRun, ...payoutRuns];
      const commitRun = (transform: (run: PayoutRun) => PayoutRun) => {
        runsState = runsState.map((run) =>
          run.id === nextRun.id ? transform(run) : run,
        );
        persistPayoutRuns(runsState);
      };

      persistPayoutRuns(runsState);

      try {
        appendOperationLog({
          operation: "payout",
          stage: "start",
          status: "info",
          message: "Payout run started.",
          details: {
            title,
            recipients: cleanedRecipients.length,
            rpcHost: getHost(CLOAK_RUNTIME.rpcUrl),
            relayHost: getHost(CLOAK_RUNTIME.relayUrl),
            programId: CLOAK_RUNTIME.programId,
          },
        });

        const walletState = ensureConnectedWallet();
        const workingWallet = buildWallet(treasuryOwner, treasuryWallet.serialize());

        if (!workingWallet) {
          throw new Error("Treasury wallet could not be loaded.");
        }

        appendOperationLog({
          operation: "payout",
          stage: "wallet-ready",
          status: "success",
          message: "Wallet and shielded treasury wallet are ready.",
          details: {
            walletPublicKey: walletState.walletPublicKey.toBase58(),
            treasuryUtxos: workingWallet.getUnspentUtxos(NATIVE_SOL_MINT).length,
          },
        });

        const signatures: string[] = [];
        const newActivities: TreasuryActivity[] = [];
        let cachedTree = merkleTreeRef.current || undefined;

        for (const recipient of cleanedRecipients) {
          const recipientKey = new PublicKey(recipient.address);

          appendOperationLog({
            operation: "payout",
            stage: "recipient-start",
            status: "info",
            message: `Preparing payout for ${recipient.name}.`,
            details: {
              recipient: recipient.address,
              asset: recipient.asset,
              amount: recipient.amount,
            },
          });

          if (recipient.asset === "SOL") {
            const targetNetLamports = solToLamports(recipient.amount);
            const grossLamports = grossUpSolWithdrawal(targetNetLamports);
            const selection = workingWallet.selectInputs(
              grossLamports,
              NATIVE_SOL_MINT,
              "largest",
            );

            appendOperationLog({
              operation: "payout",
              stage: "input-selection",
              status: "success",
              message: "Selected shielded SOL inputs for withdrawal.",
              details: {
                selectedInputs: selection.inputs.length,
                netLamports: targetNetLamports.toString(),
                grossLamports: grossLamports.toString(),
                changeLamports: (selection.total - grossLamports).toString(),
              },
            });

            commitRun((run) =>
              updateExecutionState(run, recipient.id, {
                status: "processing",
              }),
            );

            let payoutResult:
              | Awaited<ReturnType<typeof partialWithdraw>>
              | undefined;

            for (let attempt = 1; attempt <= 3; attempt += 1) {
              try {
                appendOperationLog({
                  operation: "payout",
                  stage: "withdraw-call",
                  status: "info",
                  message: `Calling Cloak partialWithdraw for ${recipient.name}.`,
                  details: {
                    attempt,
                    cachedMerkleTree: Boolean(cachedTree),
                  },
                });

                payoutResult = await partialWithdraw(
                  selection.inputs,
                  recipientKey,
                  grossLamports,
                  {
                    connection,
                    programId,
                    relayUrl: CLOAK_RUNTIME.relayUrl,
                    walletPublicKey: walletState.walletPublicKey,
                    signMessage: async (message) => {
                      appendOperationLog({
                        operation: "payout",
                        stage: "wallet-sign-message",
                        status: "info",
                        message: "Wallet message signature requested for payout.",
                        details: {
                          bytes: message.length,
                        },
                      });
                      const signed = await walletState.signMessage(message);
                      appendOperationLog({
                        operation: "payout",
                        stage: "wallet-sign-message",
                        status: "success",
                        message: "Wallet message signature returned for payout.",
                      });
                      return signed;
                    },
                    cachedMerkleTree: cachedTree,
                    onProgress: (status) => {
                      setStatusMessage(`Payout ${recipient.name}: ${status}`);
                      appendOperationLog({
                        operation: "payout",
                        stage: "sdk-progress",
                        status: "info",
                        message: status,
                      });
                    },
                    onProofProgress: (progress) => {
                      setStatusMessage(
                        `Payout ${recipient.name}: proof ${progress}%`,
                      );
                      appendOperationLog({
                        operation: "payout",
                        stage: "proof-progress",
                        status: "info",
                        message: `Proof generation ${progress}%.`,
                        details: {
                          progress,
                        },
                      });
                    },
                  },
                );
                break;
              } catch (error) {
                appendOperationLog({
                  operation: "payout",
                  stage: "withdraw-failed",
                  status: "error",
                  message: `Cloak partialWithdraw failed for ${recipient.name}.`,
                  details: {
                    attempt,
                    rootNotFound: isRootNotFoundError(error),
                    rawError: error instanceof Error ? error.message : String(error),
                  },
                });

                if (attempt === 3) {
                  commitRun((run) =>
                    updateExecutionState(run, recipient.id, {
                      status: "failed",
                      error: toDiagnosticError(error),
                    }),
                  );
                  throw error;
                }
                if (!isRootNotFoundError(error)) {
                  commitRun((run) =>
                    updateExecutionState(run, recipient.id, {
                      status: "failed",
                      error: toDiagnosticError(error),
                    }),
                  );
                  throw error;
                }
                cachedTree = undefined;
              }
            }

            if (!payoutResult) {
              throw new Error(`Payout to ${recipient.name} did not complete.`);
            }

            selection.inputs.forEach((input) => {
              workingWallet.markSpent(input, input.mintAddress);
            });

            payoutResult.outputUtxos.forEach((utxo, index) => {
              const commitmentIndex = payoutResult.commitmentIndices[index];
              if (typeof commitmentIndex === "number" && commitmentIndex >= 0) {
                utxo.index = commitmentIndex;
              }
              workingWallet.addUtxo(utxo, utxo.mintAddress);
            });

            cachedTree = payoutResult.merkleTree;
            signatures.push(payoutResult.signature);
            appendOperationLog({
              operation: "payout",
              stage: "withdraw-success",
              status: "success",
              message: `Cloak payout completed for ${recipient.name}.`,
              details: {
                signature: payoutResult.signature,
                outputUtxos: payoutResult.outputUtxos.length,
              },
            });
            commitRun((run) =>
              updateExecutionState(run, recipient.id, {
                status: "completed",
                signature: payoutResult.signature,
              }),
            );
            newActivities.push({
              id: `payout-${payoutResult.signature}`,
              type: "payout",
              title: `Private payout to ${recipient.name}`,
              asset: "SOL",
              grossAmount: lamportsToSol(grossLamports),
              feeAmount: lamportsToSol(grossLamports - targetNetLamports),
              netAmount: recipient.amount,
              recipient: recipient.address,
              signature: payoutResult.signature,
              status: "confirmed",
              direction: "out",
              createdAt: Date.now(),
            });
            continue;
          }

          const outputMint = getMintForAsset(recipient.asset);

          if (!outputMint) {
            throw new Error(`Unsupported payout asset ${recipient.asset}.`);
          }

          let swapSettled = false;

          for (let attempt = 1; attempt <= 3; attempt += 1) {
            try {
              commitRun((run) =>
                updateExecutionState(run, recipient.id, {
                  status: "quoting",
                }),
              );
              setStatusMessage(`Payout ${recipient.name}: fetching ${recipient.asset} quote`);

              const targetOutputAmount = assetAmountToUnits(
                recipient.asset,
                recipient.amount,
              );
              const quote = await getJupiterExactOutQuote({
                outputMint: outputMint.toBase58(),
                outputAmount: targetOutputAmount.toString(),
                slippageBps: 100,
              });
              const swapAmount = BigInt(quote.inAmount);
              const minOutputAmount = BigInt(quote.outAmount);
              const selection = workingWallet.selectInputs(
                swapAmount,
                NATIVE_SOL_MINT,
                "largest",
              );
              const recipientAta = getAssociatedTokenAddressSync(
                outputMint,
                recipientKey,
              );
              commitRun((run) =>
                updateExecutionState(run, recipient.id, {
                  status: "processing",
                  quotedInputAmount: lamportsToSol(swapAmount),
                  quotedInputAsset: "SOL",
                  quotedOutputAmount: unitsToAssetAmount(
                    recipient.asset,
                    minOutputAmount,
                  ),
                  quotedOutputAsset: recipient.asset,
                }),
              );
              const swapResult = await swapWithChange(
                selection.inputs,
                swapAmount,
                outputMint,
                recipientAta,
                minOutputAmount,
                {
                  connection,
                  programId,
                  relayUrl: CLOAK_RUNTIME.relayUrl,
                  walletPublicKey: walletState.walletPublicKey,
                  signMessage: walletState.signMessage,
                  cachedMerkleTree: cachedTree,
                  onProgress: (status) =>
                    setStatusMessage(`Swap ${recipient.name}: ${status}`),
                  onProofProgress: (progress) =>
                    setStatusMessage(
                      `Swap ${recipient.name}: proof ${progress}%`,
                    ),
                  swapSlippageBps: 100,
                  swapStatusMaxAttempts: 60,
                  swapStatusDelayMs: 2000,
                },
                recipientKey,
              );

              selection.inputs.forEach((input) => {
                workingWallet.markSpent(input, input.mintAddress);
              });

              swapResult.outputUtxos.forEach((utxo, index) => {
                const commitmentIndex = swapResult.commitmentIndices[index];
                if (typeof commitmentIndex === "number" && commitmentIndex >= 0) {
                  utxo.index = commitmentIndex;
                }
                workingWallet.addUtxo(utxo, utxo.mintAddress);
              });

              cachedTree = swapResult.merkleTree;
              signatures.push(swapResult.signature);
              commitRun((run) =>
                updateExecutionState(run, recipient.id, {
                  status: "completed",
                  signature: swapResult.signature,
                }),
              );
              newActivities.push({
                id: `swap-${swapResult.signature}`,
                type: "swap",
                title: `Private ${recipient.asset} payout to ${recipient.name}`,
                asset: "SOL",
                outputAsset: recipient.asset,
                grossAmount: lamportsToSol(swapAmount),
                feeAmount: lamportsToSol(calculateFeeBigint(swapAmount)),
                netAmount:
                  lamportsToSol(swapAmount) -
                  lamportsToSol(calculateFeeBigint(swapAmount)),
                recipient: recipient.address,
                signature: swapResult.signature,
                status: "confirmed",
                direction: "out",
                createdAt: Date.now(),
              });
              swapSettled = true;
              break;
            } catch (error) {
              if (isRootNotFoundError(error)) {
                cachedTree = undefined;
              }

              if (attempt === 3) {
                commitRun((run) =>
                  updateExecutionState(run, recipient.id, {
                    status: "failed",
                    error: toDiagnosticError(error),
                  }),
                );
                throw error;
              }

              setStatusMessage(
                `Swap ${recipient.name}: retrying with a fresh quote...`,
              );
            }
          }

          if (!swapSettled) {
            throw new Error(`Stablecoin payout to ${recipient.name} did not complete.`);
          }
        }

        merkleTreeRef.current = cachedTree || null;
        persistWallet(workingWallet);
        persistManualActivities([...newActivities, ...manualActivities]);
        commitRun((run) => ({
          ...run,
          status: "completed",
          completedAt: Date.now(),
          signatures,
        }));
        setStatusMessage(
          `Payout run completed. ${cleanedRecipients.length} recipient${
            cleanedRecipients.length > 1 ? "s were" : " was"
          } paid privately.`,
        );
      } catch (error) {
        const friendly = toDiagnosticError(error);
        appendOperationLog({
          operation: "payout",
          stage: "failed",
          status: "error",
          message: friendly,
          details: {
            durationMs: Math.round(performance.now() - startedAt),
            rawError: error instanceof Error ? error.message : String(error),
          },
        });
        setLastError(friendly);
        commitRun((run) => ({
          ...run,
          status: "failed",
          error: friendly,
        }));
        throw error;
      } finally {
        setIsSubmittingRun(false);
      }
    },
    [
      clearStatus,
      clearOperationLogs,
      connection,
      appendOperationLog,
      ensureConnectedWallet,
      manualActivities,
      payoutRuns,
      persistManualActivities,
      persistPayoutRuns,
      persistWallet,
      programId,
      treasuryOwner,
      treasuryWallet,
    ],
  );

  const exportHistoryCsv = useCallback(async (options?: {
    afterTimestamp?: number;
    beforeTimestamp?: number;
  }) => {
    clearStatus();

    const generatedAt = Date.now();
    let csv = "";
    const afterTimestamp = options?.afterTimestamp;
    const beforeTimestamp = options?.beforeTimestamp;

    if (
      typeof afterTimestamp === "number" &&
      typeof beforeTimestamp === "number" &&
      afterTimestamp > beforeTimestamp
    ) {
      throw new Error("Start date must be before end date.");
    }

    if (complianceReport) {
      csv = formatComplianceCsv(
        filterComplianceReport(complianceReport, afterTimestamp, beforeTimestamp),
      );
    } else {
      const rows = [
        [
          "Created At",
          "Type",
          "Asset",
          "Gross",
          "Fee",
          "Net",
          "Status",
          "Signature",
        ],
        ...activities
          .filter((activity) =>
            isWithinWindow(activity.createdAt, afterTimestamp, beforeTimestamp),
          )
          .map((activity) => [
            new Date(activity.createdAt).toISOString(),
            activity.type,
            activity.asset,
            activity.grossAmount.toString(),
            activity.feeAmount.toString(),
            activity.netAmount.toString(),
            activity.status,
            activity.signature,
          ]),
      ];
      csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    }

    downloadCsvFile(csv, `sipher-history-${generatedAt}.csv`);

    const auditActivity = {
      id: `audit-${generatedAt}`,
      type: "audit",
      title:
        typeof afterTimestamp === "number" || typeof beforeTimestamp === "number"
          ? "Windowed compliance history exported"
          : "Compliance history exported",
      asset: "SOL",
      grossAmount: 0,
      feeAmount: 0,
      netAmount: 0,
      signature: `audit-export-${generatedAt}`,
      status: "confirmed",
      direction: "internal",
      createdAt: generatedAt,
    } satisfies TreasuryActivity;

    persistManualActivities([auditActivity, ...manualActivities]);
    setStatusMessage(
      typeof afterTimestamp === "number" || typeof beforeTimestamp === "number"
        ? "Compliance CSV exported for the selected window."
        : "Compliance CSV exported.",
    );
  }, [activities, clearStatus, complianceReport, manualActivities, persistManualActivities]);

  const value: AppContextValue = {
    isConnected: Boolean(publicKey),
    isConnecting,
    isShielding,
    isSubmittingRun,
    isScanning,
    publicKey,
    walletLabel,
    availableWallets,
    payoutRuns,
    activities,
    snapshot,
    runtime: CLOAK_RUNTIME,
    statusMessage,
    lastError,
    hasTreasuryOwner: Boolean(treasuryOwner),
    treasuryUtxoCount: treasuryWallet?.getUnspentUtxos(NATIVE_SOL_MINT).length || 0,
    historyCount: complianceCache?.transactionCount || 0,
    historyGeneratedAt: complianceCache?.generatedAt || null,
    historyLastSignature: complianceCache?.lastSignature || null,
    historyRpcCalls: complianceCache?.rpcCallsMade || 0,
    historyWindow: complianceCache
      ? {
          afterTimestamp: complianceCache.afterTimestamp,
          beforeTimestamp: complianceCache.beforeTimestamp,
        }
      : null,
    operationLogs,
    connect,
    disconnect,
    shieldFunds,
    createPayoutRun,
    rescanHistory,
    exportHistoryCsv,
    clearHistoryCache,
    clearOperationLogs,
    clearStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
}
