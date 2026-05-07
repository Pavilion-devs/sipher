"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import { CreatePayoutRunModal } from "@/components/dashboard/CreatePaymentModal";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RunDetailsModal } from "@/components/dashboard/RunDetailsModal";
import { useApp } from "@/lib/app/provider";
import {
  formatAmount,
  formatAssetAmount,
  formatDate,
  truncateAddress,
} from "@/lib/utils/format";
import type { PayoutRun } from "@/types";

export default function PayoutsPage() {
  const { payoutRuns, isSubmittingRun, statusMessage, lastError, runtime } =
    useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayoutRun | null>(null);

  const completedRuns = useMemo(
    () => payoutRuns.filter((run) => run.status === "completed").length,
    [payoutRuns],
  );

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white">
            Payout Runs
          </h1>
          <p className="mt-1 tracking-tight text-zinc-400">
            Orchestrate private contractor, vendor, and treasury settlement runs.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600/90 px-5 py-3 text-sm font-medium tracking-tight text-white transition-all hover:scale-[1.02] hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-300"
        >
          <Plus className="h-4 w-4" />
          {isSubmittingRun ? "Running..." : "New Payout Run"}
        </button>
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

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-violet-300" />
            <span className="text-sm tracking-tight text-zinc-400">
              Total Runs
            </span>
          </div>
          <div className="mt-3 text-3xl font-light tracking-tight text-white">
            {payoutRuns.length}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-violet-300" />
            <span className="text-sm tracking-tight text-zinc-400">
              Completed Privately
            </span>
          </div>
          <div className="mt-3 text-3xl font-light tracking-tight text-white">
            {completedRuns}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="h-5 w-5 text-violet-300" />
            <span className="text-sm tracking-tight text-zinc-400">
              Mixed-Asset Runs
            </span>
          </div>
          <div className="mt-3 text-3xl font-light tracking-tight text-white">
            {payoutRuns.filter((run) => run.requiresSwap).length}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {payoutRuns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 p-8 text-sm tracking-tight text-zinc-400">
            No payout runs yet. Shield funds first, then create the first run from
            this page.
          </div>
        ) : null}

        {payoutRuns.map((run) => {
          const completed = run.execution?.filter(
            (item) => item.status === "completed",
          ).length;
          const failed = run.execution?.filter(
            (item) => item.status === "failed",
          ).length;
          const active = run.execution?.filter(
            (item) => item.status === "processing" || item.status === "quoting",
          ).length;

          return (
            <section
              key={run.id}
              className="rounded-2xl border border-white/10 bg-zinc-950/20 p-6 backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-zinc-950/30"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl tracking-tight text-white">{run.title}</h2>
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
                    {run.completedAt ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] tracking-tight text-zinc-400">
                        Settled {formatDate(run.completedAt)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 max-w-2xl text-sm tracking-tight text-zinc-400">
                    {run.note}
                  </p>
                  <div className="mt-3 text-xs tracking-tight text-zinc-500">
                    Created {formatDate(run.createdAt)}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:min-w-[220px]">
                  <button
                    onClick={() => setSelectedRun(run)}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {run.error ? (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm tracking-tight text-red-200">
                  {run.error}
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Run Size
                  </div>
                  <div className="mt-2 text-2xl font-light tracking-tight text-white">
                    ${formatAmount(run.totalUsd)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Completed
                  </div>
                  <div className="mt-2 text-2xl font-light tracking-tight text-white">
                    {completed || 0}/{run.totalRecipients}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Active Steps
                  </div>
                  <div className="mt-2 text-2xl font-light tracking-tight text-white">
                    {active || 0}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Failures
                  </div>
                  <div className="mt-2 text-2xl font-light tracking-tight text-white">
                    {failed || 0}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {run.recipients.slice(0, 4).map((recipient) => {
                  const execution = run.execution?.find(
                    (step) => step.recipientId === recipient.id,
                  );

                  return (
                    <div
                      key={recipient.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm tracking-tight text-white">
                            {recipient.name}
                          </div>
                          <div className="mt-1 font-mono text-xs tracking-tight text-zinc-500">
                            {truncateAddress(recipient.address, 8, 8)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm tracking-tight text-white">
                            {formatAssetAmount(recipient.amount, recipient.asset)}{" "}
                            {recipient.asset}
                          </div>
                          <div className="mt-1 text-xs tracking-tight text-zinc-500">
                            {execution?.route === "swap"
                              ? `Swap route to ${recipient.asset}`
                              : "Direct withdraw"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <CreatePayoutRunModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <RunDetailsModal
        run={selectedRun}
        network={runtime.network}
        onClose={() => setSelectedRun(null)}
      />
    </DashboardLayout>
  );
}
