"use client";

import "@/lib/polyfills/buffer";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Download,
  Eye,
  Loader2,
  ScanSearch,
} from "lucide-react";
import {
  getNkFromUtxoPrivateKey,
  scanTransactions,
  toComplianceReport,
  setCircuitsPath,
  DEFAULT_TRANSACTION_CIRCUITS_URL,
} from "@cloak.dev/sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { getRuntimeForNetwork } from "@/lib/cloak/config";
import { getStoredNetwork } from "@/lib/utils/storage";
import { downloadCompliancePdf } from "@/lib/utils/pdf";
import { formatAmount, formatDate, getSolanaExplorerUrl, truncateAddress } from "@/lib/utils/format";
import type { Network, TreasuryActivity } from "@/types";

function hexToPrivateKey(hex: string): bigint {
  const clean = hex.trim().replace(/^0x/, "");
  return BigInt("0x" + clean);
}

function isValidHex(value: string) {
  return /^(0x)?[0-9a-fA-F]{32,128}$/.test(value.trim());
}

function mapTxType(txType: string): TreasuryActivity["type"] {
  if (txType === "deposit") return "shield";
  if (txType === "swap") return "swap";
  return "payout";
}

export default function AuditPage() {
  const [network, setNetwork] = useState<Network>("mainnet");

  useEffect(() => {
    setNetwork(getStoredNetwork());
  }, []);
  const [viewingKey, setViewingKey] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activities, setActivities] = useState<TreasuryActivity[] | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleScan = async () => {
    if (!isValidHex(viewingKey)) {
      setErrorMessage("Enter a valid viewing key (64-character hex string).");
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setStatusMessage("Initializing scan...");
    setActivities(null);

    try {
      const runtime = getRuntimeForNetwork(network);
      setCircuitsPath(DEFAULT_TRANSACTION_CIRCUITS_URL);

      const connection = new Connection(runtime.rpcUrl, "confirmed");
      const programId = new PublicKey(runtime.programId);
      const nk = getNkFromUtxoPrivateKey(hexToPrivateKey(viewingKey));

      const result = await scanTransactions({
        connection,
        programId,
        viewingKeyNk: nk,
        onStatus: (s) => setStatusMessage(`Scanning: ${s}`),
        onProgress: (processed, total) =>
          setStatusMessage(`Scanning: ${processed} / ${total} transactions`),
      });

      const report = toComplianceReport(result);

      const mapped: TreasuryActivity[] = report.transactions.map((tx, i) => ({
        id: `scan-${tx.signature || tx.timestamp}-${i}`,
        type: mapTxType(tx.txType),
        title:
          tx.txType === "deposit"
            ? "Treasury funds shielded"
            : tx.txType === "swap"
              ? `Private swap → ${tx.outputSymbol || "token"}`
              : "Private payout settled",
        asset: (tx.symbol?.toUpperCase() as "SOL" | "USDC" | "USDT") || "SOL",
        outputAsset: tx.outputSymbol
          ? ((tx.outputSymbol.toUpperCase() as "SOL" | "USDC" | "USDT") || undefined)
          : undefined,
        grossAmount: Number(tx.amount) / 10 ** (tx.decimals ?? 9),
        feeAmount: Number(tx.fee) / 10 ** (tx.decimals ?? 9),
        netAmount: Number(tx.netAmount) / 10 ** (tx.decimals ?? 9),
        runningBalance: Number(tx.runningBalance) / 10 ** (tx.decimals ?? 9),
        recipient: tx.recipient,
        signature: tx.signature || `scan-${tx.timestamp}-${i}`,
        status: "confirmed",
        direction: tx.txType === "deposit" ? "in" : "out",
        createdAt: tx.timestamp,
      }));

      setActivities(mapped);
      setStatusMessage(
        `Scan complete — ${report.summary.transactionCount} transaction${report.summary.transactionCount === 1 ? "" : "s"} found.`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Scan failed.");
      setStatusMessage(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activities) return;
    setIsExporting(true);
    try {
      await downloadCompliancePdf(activities, { network });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Sipher" width={100} height={28} className="h-8 w-auto rounded-lg" />
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5">
            <Eye className="h-4 w-4 text-violet-300" />
            <span className="text-xs font-medium tracking-tight text-violet-300">
              Auditor Access
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-light tracking-tight text-white">
            Treasury Audit View
          </h1>
          <p className="mt-3 max-w-xl text-base tracking-tight text-zinc-400">
            Enter a viewing key shared by a treasury operator to scan their private
            transaction history. No wallet required — read-only access only.
          </p>
        </div>

        {/* Scan form */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6 backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              {/* Network */}
              <div className="space-y-2">
                <label className="block text-sm font-medium tracking-tight text-white">
                  Network
                </label>
                <div className="flex gap-2">
                  {(["mainnet", "devnet"] as Network[]).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNetwork(n)}
                      className={`inline-flex min-h-9 items-center rounded-xl border px-4 py-2 text-sm font-medium tracking-tight transition-all ${
                        network === n
                          ? n === "devnet"
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                            : "border-violet-500/40 bg-violet-500/15 text-violet-200"
                          : "border-white/10 bg-black/20 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {n.charAt(0).toUpperCase() + n.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewing key input */}
              <div className="space-y-2">
                <label
                  htmlFor="viewing-key"
                  className="block text-sm font-medium tracking-tight text-white"
                >
                  Viewing Key
                </label>
                <input
                  id="viewing-key"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={viewingKey}
                  onChange={(e) => setViewingKey(e.target.value)}
                  placeholder="Paste 64-character hex viewing key..."
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 font-mono text-sm tracking-tight text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                />
                <p className="text-xs tracking-tight text-zinc-500">
                  Obtain this key from Settings → Viewing Key in the treasury operator&apos;s dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void handleScan()}
                disabled={isScanning || !viewingKey.trim()}
                aria-busy={isScanning}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium tracking-tight text-white transition-all hover:scale-[1.02] hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 focus-visible:ring-2 focus-visible:ring-violet-300"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4" />
                    Scan History
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status / error */}
          {(statusMessage || errorMessage) ? (
            <div
              className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm tracking-tight ${
                errorMessage
                  ? "border-red-500/20 bg-red-500/10 text-red-200"
                  : "border-violet-500/20 bg-violet-500/10 text-violet-200"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage || statusMessage}</span>
            </div>
          ) : null}
        </div>

        {/* Results */}
        {activities !== null ? (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl tracking-tight text-white">
                Transaction History
                <span className="ml-3 text-sm font-normal text-zinc-500">
                  {activities.length} transaction{activities.length !== 1 ? "s" : ""}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => void handleExportPdf()}
                disabled={isExporting || activities.length === 0}
                className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-violet-600/90 px-4 py-2 text-sm font-medium tracking-tight text-white transition-all hover:scale-[1.02] hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-violet-300"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export PDF
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 p-8 text-center text-sm tracking-tight text-zinc-500">
                No transactions found for this viewing key on {network}.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-900/50">
                      {["Date", "Type", "Asset", "Gross", "Fee", "Net", "Signature"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.15em] text-zinc-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-white/5 bg-zinc-950/20 transition-colors hover:bg-white/5"
                      >
                        <td className="px-4 py-3 text-zinc-400">
                          {formatDate(a.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {a.direction === "in" ? (
                              <ArrowDownRight className="h-3.5 w-3.5 text-emerald-400" />
                            ) : a.type === "swap" ? (
                              <ArrowRightLeft className="h-3.5 w-3.5 text-violet-400" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 text-amber-400" />
                            )}
                            <span className="capitalize text-white">{a.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {a.asset}
                          {a.outputAsset ? ` → ${a.outputAsset}` : ""}
                        </td>
                        <td className="px-4 py-3 text-white">
                          {formatAmount(a.grossAmount, 4)}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {formatAmount(a.feeAmount, 6)}
                        </td>
                        <td className="px-4 py-3 text-white">
                          {formatAmount(a.netAmount, 4)}
                        </td>
                        <td className="px-4 py-3">
                          {a.signature.startsWith("scan-") ? (
                            <span className="font-mono text-xs text-zinc-500">—</span>
                          ) : (
                            <a
                              href={getSolanaExplorerUrl(a.signature, "tx", network)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-violet-400 underline underline-offset-2 hover:text-violet-300"
                            >
                              {truncateAddress(a.signature, 6, 6)}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
