"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  FilterX,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ScanSearch,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useApp } from "@/lib/app/provider";
import { inferUsdValue } from "@/lib/cloak/amounts";
import {
  copyToClipboard,
  formatAmount,
  formatDate,
  formatRelativeTime,
  getSolanaExplorerUrl,
  truncateAddress,
} from "@/lib/utils/format";
import type { TreasuryActivity } from "@/types";

function toDayStart(value: string) {
  return value ? new Date(`${value}T00:00:00.000`).getTime() : undefined;
}

function toDayEnd(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).getTime() : undefined;
}

function describeWindow(startDate: string, endDate: string) {
  if (!startDate && !endDate) return "All time";
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (startDate) return `From ${startDate}`;
  return `Through ${endDate}`;
}

function ActivityRow({
  activity,
  network,
}: {
  activity: TreasuryActivity;
  network: string;
}) {
  const [copied, setCopied] = useState(false);
  const isIncoming = activity.direction === "in";
  const amountDecimals = activity.asset === "SOL" ? 4 : 2;
  const canOpenExplorer = !activity.signature.startsWith("audit");

  const handleCopy = async () => {
    await copyToClipboard(activity.signature);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-zinc-900/20 p-4 transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/35 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div
          className={`mt-1 flex h-11 w-11 items-center justify-center rounded-lg ${
            isIncoming ? "bg-violet-500/10" : "bg-zinc-700/30"
          }`}
        >
          {isIncoming ? (
            <ArrowDownRight className="h-5 w-5 text-violet-400" />
          ) : (
            <ArrowUpRight className="h-5 w-5 text-zinc-300" />
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm tracking-tight text-white">
              {activity.title}
            </span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              {activity.type}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] capitalize tracking-tight ${
                activity.status === "confirmed"
                  ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                  : activity.status === "pending"
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {activity.status}
            </span>
            {activity.outputAsset ? (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.18em] text-zinc-300">
                Output {activity.outputAsset}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-xs tracking-tight text-zinc-500">
            {activity.recipient
              ? `Recipient: ${truncateAddress(activity.recipient, 6, 6)}`
              : "Internal treasury action"}{" "}
            • {formatDate(activity.createdAt)} •{" "}
            {formatRelativeTime(activity.createdAt)}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:items-end">
        <div className="text-right">
          <div className="text-sm tracking-tight text-white">
            Gross {formatAmount(activity.grossAmount, amountDecimals)} {activity.asset}
          </div>
          <div className="text-xs tracking-tight text-zinc-500">
            Fee {formatAmount(activity.feeAmount, amountDecimals)} • Net{" "}
            {formatAmount(activity.netAmount, amountDecimals)}
          </div>
          <div className="mt-1 text-xs tracking-tight text-zinc-500">
            {typeof activity.runningBalance === "number"
              ? `Running balance ${formatAmount(
                  activity.runningBalance,
                  amountDecimals,
                )} ${activity.asset}`
              : "Running balance appears after scanner decoding"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300/60"
            aria-label="Copy transaction signature"
          >
            {copied ? (
              <Check className="h-4 w-4 text-violet-300" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          {canOpenExplorer ? (
            <a
              href={getSolanaExplorerUrl(activity.signature, "tx", network)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300/60"
              aria-label="Open transaction in explorer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-black/10 text-zinc-600"
              aria-label="Explorer link unavailable for internal audit events"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const {
    activities,
    snapshot,
    rescanHistory,
    exportHistoryCsv,
    clearHistoryCache,
    isScanning,
    statusMessage,
    lastError,
    historyCount,
    historyGeneratedAt,
    historyLastSignature,
    historyRpcCalls,
    historyWindow,
    runtime,
  } = useApp();
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(() =>
    historyWindow?.afterTimestamp
      ? new Date(historyWindow.afterTimestamp).toISOString().slice(0, 10)
      : "",
  );
  const [endDate, setEndDate] = useState(() =>
    historyWindow?.beforeTimestamp
      ? new Date(historyWindow.beforeTimestamp).toISOString().slice(0, 10)
      : "",
  );

  const afterTimestamp = useMemo(() => toDayStart(startDate), [startDate]);
  const beforeTimestamp = useMemo(() => toDayEnd(endDate), [endDate]);
  const hasInvalidDateRange =
    typeof afterTimestamp === "number" &&
    typeof beforeTimestamp === "number" &&
    afterTimestamp > beforeTimestamp;

  const windowActivities = useMemo(
    () =>
      activities.filter((activity) => {
        if (typeof afterTimestamp === "number" && activity.createdAt < afterTimestamp) {
          return false;
        }
        if (typeof beforeTimestamp === "number" && activity.createdAt > beforeTimestamp) {
          return false;
        }
        return true;
      }),
    [activities, afterTimestamp, beforeTimestamp],
  );

  const filteredActivities = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    if (!lowered) return windowActivities;

    return windowActivities.filter((activity) =>
      [
        activity.title,
        activity.type,
        activity.signature,
        activity.asset,
        activity.outputAsset || "",
        activity.recipient || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(lowered),
    );
  }, [query, windowActivities]);

  const windowVolumeUsd = useMemo(
    () =>
      windowActivities.reduce((sum, activity) => {
        if (activity.direction !== "out" || activity.status !== "confirmed") return sum;
        return sum + inferUsdValue(activity.asset, activity.netAmount);
      }, 0),
    [windowActivities],
  );

  const windowFeesUsd = useMemo(
    () =>
      windowActivities.reduce(
        (sum, activity) => sum + inferUsdValue(activity.asset, activity.feeAmount),
        0,
      ),
    [windowActivities],
  );

  const latestRunningBalance = useMemo(
    () =>
      windowActivities.find(
        (activity) => typeof activity.runningBalance === "number",
      ),
    [windowActivities],
  );

  const hasFilters = Boolean(query || startDate || endDate);

  const handleRescan = () => {
    if (hasInvalidDateRange) return;
    void rescanHistory({ afterTimestamp, beforeTimestamp });
  };

  const handleClearCacheAndRescan = () => {
    if (hasInvalidDateRange) return;
    clearHistoryCache();
    void rescanHistory({ afterTimestamp, beforeTimestamp });
  };

  const handleExport = () => {
    if (hasInvalidDateRange) return;
    void exportHistoryCsv({ afterTimestamp, beforeTimestamp });
  };

  const clearFilters = () => {
    setQuery("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white">
            History & Audit
          </h1>
          <p className="mt-1 tracking-tight text-zinc-400">
            Scanner-backed Cloak history with exportable compliance data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRescan}
            disabled={isScanning || hasInvalidDateRange}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-2 text-sm tracking-tight text-white transition-colors hover:bg-zinc-900/60 focus-visible:ring-2 focus-visible:ring-violet-300/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            {isScanning ? "Scanning..." : "Rescan"}
          </button>
          <button
            type="button"
            onClick={handleClearCacheAndRescan}
            disabled={isScanning || hasInvalidDateRange}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm tracking-tight text-zinc-200 transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Clear Cache & Rescan
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={hasInvalidDateRange}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600/90 px-4 py-2 text-sm font-medium tracking-tight text-white transition-all hover:scale-[1.02] hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {statusMessage || lastError ? (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 backdrop-blur-xl ${
            lastError
              ? "border-red-500/20 bg-red-500/10 text-red-200"
              : "border-violet-500/20 bg-violet-500/10 text-violet-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm tracking-tight">{lastError || statusMessage}</p>
          </div>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
          <div className="text-sm tracking-tight text-zinc-400">Window Volume</div>
          <div className="mt-2 text-3xl font-light tracking-tight text-white">
            ${formatAmount(windowVolumeUsd)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
          <div className="text-sm tracking-tight text-zinc-400">Window Fees</div>
          <div className="mt-2 text-3xl font-light tracking-tight text-white">
            ${formatAmount(windowFeesUsd)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
          <div className="text-sm tracking-tight text-zinc-400">
            Latest Running Balance
          </div>
          <div className="mt-2 text-3xl font-light tracking-tight text-white">
            {latestRunningBalance
              ? `${formatAmount(
                  latestRunningBalance.runningBalance || 0,
                  latestRunningBalance.asset === "SOL" ? 4 : 2,
                )} ${latestRunningBalance.asset}`
              : "--"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
          <div className="text-sm tracking-tight text-zinc-400">Scanner Hits</div>
          <div className="mt-2 text-3xl font-light tracking-tight text-white">
            {historyCount}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <label className="space-y-2" htmlFor="history-query">
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Search Trail
            </span>
            <div className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4">
              <FileSearch className="h-4 w-4 text-zinc-500" />
              <input
                id="history-query"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by type, asset, signature, or recipient"
                className="w-full bg-transparent text-sm tracking-tight text-white outline-none placeholder:text-zinc-500"
              />
            </div>
          </label>

          <label className="space-y-2" htmlFor="history-start-date">
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Start Date
            </span>
            <input
              id="history-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm tracking-tight text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-300/60"
            />
          </label>

          <label className="space-y-2" htmlFor="history-end-date">
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              End Date
            </span>
            <input
              id="history-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm tracking-tight text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-300/60"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm tracking-tight text-zinc-200 transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FilterX className="h-4 w-4" />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs tracking-tight text-zinc-400">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
            Window: {describeWindow(startDate, endDate)}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            <ScanSearch className="h-3.5 w-3.5 text-zinc-500" />
            Last scan: {historyGeneratedAt ? formatDate(historyGeneratedAt) : "Not scanned"}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            RPC calls: {historyRpcCalls || 0}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            Audit exports: {snapshot.auditExports}
          </div>
          {historyLastSignature ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
              Cursor: {truncateAddress(historyLastSignature, 6, 6)}
            </div>
          ) : null}
        </div>

        {hasInvalidDateRange ? (
          <p className="mt-3 text-sm tracking-tight text-red-300">
            Start date must be before end date.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 p-8">
            <div className="flex flex-col gap-3 text-sm tracking-tight text-zinc-400">
              <p className="text-base text-white">
                {activities.length === 0
                  ? "No history yet."
                  : hasFilters
                    ? "No transactions match the current history window."
                    : "No decoded transactions in this scan window."}
              </p>
              <p>
                {activities.length === 0
                  ? "Shield treasury funds first, then rescan to decode the Cloak trail and unlock compliance exports."
                  : "Adjust the date range, clear your filters, or run a fresh scan to repopulate the audit trail."}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRescan}
                  disabled={isScanning || hasInvalidDateRange}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-2 text-sm tracking-tight text-white transition-colors hover:bg-zinc-900/60 focus-visible:ring-2 focus-visible:ring-violet-300/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isScanning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  {isScanning ? "Scanning..." : "Rescan History"}
                </button>
                {hasFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm tracking-tight text-zinc-200 transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                  >
                    <FilterX className="h-4 w-4" />
                    Clear Filters
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {filteredActivities.map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            network={runtime.network}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}
