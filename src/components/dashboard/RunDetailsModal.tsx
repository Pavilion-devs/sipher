"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  ScrollText,
  Shield,
} from "lucide-react";
import { Modal } from "./DashboardLayout";
import type { PayoutRun } from "@/types";
import {
  copyToClipboard,
  formatAmount,
  formatAssetAmount,
  formatDate,
  getSolanaExplorerUrl,
  truncateAddress,
} from "@/lib/utils/format";

function executionBadge(status: string) {
  if (status === "completed") {
    return "border-violet-500/20 bg-violet-500/10 text-violet-300";
  }

  if (status === "failed") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  if (status === "processing" || status === "quoting") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

function routeLabel(route: string, asset: string) {
  return route === "swap" ? `Swap route to ${asset}` : "Direct withdraw";
}

export function RunDetailsModal({
  run,
  network,
  onClose,
}: {
  run: PayoutRun | null;
  network: string;
  onClose: () => void;
}) {
  const [copiedSignature, setCopiedSignature] = useState<string | null>(null);

  const stats = useMemo(() => {
    const execution = run?.execution || [];
    return {
      completed: execution.filter((item) => item.status === "completed").length,
      failed: execution.filter((item) => item.status === "failed").length,
      active: execution.filter(
        (item) => item.status === "processing" || item.status === "quoting",
      ).length,
    };
  }, [run]);

  if (!run) return null;

  const handleCopySignature = async (signature: string) => {
    await copyToClipboard(signature);
    setCopiedSignature(signature);
    window.setTimeout(() => setCopiedSignature(null), 1500);
  };

  return (
    <Modal isOpen={Boolean(run)} onClose={onClose} title={run.title}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] capitalize tracking-tight ${
                  run.status === "completed"
                    ? "border-violet-500/20 bg-violet-500/10 text-violet-300"
                    : run.status === "failed"
                      ? "border-red-500/20 bg-red-500/10 text-red-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                }`}
              >
                {run.status}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] tracking-tight text-zinc-400">
                Created {formatDate(run.createdAt)}
              </span>
              {run.completedAt ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] tracking-tight text-zinc-400">
                  Settled {formatDate(run.completedAt)}
                </span>
              ) : null}
            </div>
            <p className="mt-3 max-w-3xl text-sm tracking-tight text-zinc-400">
              {run.note || "No internal note added for this run."}
            </p>
          </div>
          <div className="grid min-w-[260px] gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Completed
              </div>
              <div className="mt-2 text-2xl font-light tracking-tight text-white">
                {stats.completed}/{run.totalRecipients}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Signatures
              </div>
              <div className="mt-2 text-2xl font-light tracking-tight text-white">
                {run.signatures?.length || 0}
              </div>
            </div>
          </div>
        </div>

        {run.error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm tracking-tight text-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{run.error}</span>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
            <div className="text-sm tracking-tight text-zinc-400">Run Size</div>
            <div className="mt-2 text-3xl font-light tracking-tight text-white">
              ${formatAmount(run.totalUsd)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
            <div className="text-sm tracking-tight text-zinc-400">Recipients</div>
            <div className="mt-2 text-3xl font-light tracking-tight text-white">
              {run.totalRecipients}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
            <div className="text-sm tracking-tight text-zinc-400">Active Steps</div>
            <div className="mt-2 text-3xl font-light tracking-tight text-white">
              {stats.active}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
            <div className="text-sm tracking-tight text-zinc-400">Failed Steps</div>
            <div className="mt-2 text-3xl font-light tracking-tight text-white">
              {stats.failed}
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2 text-sm tracking-tight text-white">
            <Shield className="h-4 w-4 text-violet-300" />
            Recipient Execution
          </div>
          <div className="space-y-3">
            {run.recipients.map((recipient) => {
              const execution = run.execution?.find(
                (step) => step.recipientId === recipient.id,
              );

              return (
                <div
                  key={recipient.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm tracking-tight text-white">
                          {recipient.name}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] capitalize tracking-tight ${executionBadge(
                            execution?.status || "queued",
                          )}`}
                        >
                          {execution?.status || "queued"}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-xs tracking-tight text-zinc-500">
                        {truncateAddress(recipient.address, 8, 8)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <div className="text-right">
                        <div className="text-sm tracking-tight text-white">
                          {formatAssetAmount(recipient.amount, recipient.asset)}{" "}
                          {recipient.asset}
                        </div>
                        <div className="mt-1 text-xs tracking-tight text-zinc-500">
                          {routeLabel(execution?.route || "withdraw", recipient.asset)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs tracking-tight text-zinc-500">
                        {execution?.status === "processing" ||
                        execution?.status === "quoting" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
                        ) : execution?.status === "completed" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {execution?.updatedAt
                            ? `Updated ${formatDate(execution.updatedAt)}`
                            : "Queued for execution"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {execution?.route === "swap" &&
                  execution.quotedInputAmount &&
                  execution.quotedOutputAmount ? (
                    <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs tracking-tight text-violet-200">
                      Quote: ~{formatAmount(execution.quotedInputAmount, 4)}{" "}
                      {execution.quotedInputAsset} for{" "}
                      {formatAmount(execution.quotedOutputAmount, 2)}{" "}
                      {execution.quotedOutputAsset}
                    </div>
                  ) : null}

                  {execution?.error ? (
                    <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs tracking-tight text-red-200">
                      {execution.error}
                    </div>
                  ) : null}

                  {execution?.signature ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-mono text-xs tracking-tight text-zinc-300">
                        {truncateAddress(execution.signature, 10, 10)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void handleCopySignature(execution.signature!)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                        >
                          <Copy className="h-4 w-4" />
                          {copiedSignature === execution.signature
                            ? "Copied"
                            : "Copy"}
                        </button>
                        <a
                          href={getSolanaExplorerUrl(
                            execution.signature,
                            "tx",
                            network,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                        >
                          Explorer
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {run.signatures && run.signatures.length > 0 ? (
          <section className="rounded-2xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 text-sm tracking-tight text-white">
              <ScrollText className="h-4 w-4 text-violet-300" />
              Run Signatures
            </div>
            <div className="space-y-2">
              {run.signatures.map((signature) => (
                <div
                  key={signature}
                  className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-mono text-xs tracking-tight text-zinc-300">
                    {truncateAddress(signature, 10, 10)}
                  </span>
                  <a
                    href={getSolanaExplorerUrl(signature, "tx", network)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                  >
                    Explorer
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
