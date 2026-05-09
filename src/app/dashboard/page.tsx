"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRightLeft,
  ExternalLink,
  Layers3,
  Shield,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ShieldFundsModal } from "@/components/dashboard/ShieldFundsModal";
import { useApp } from "@/lib/app/provider";
import {
  formatAmount,
  formatDate,
  formatRelativeTime,
  getSolanaExplorerUrl,
  truncateAddress,
} from "@/lib/utils/format";

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
}: {
  title: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-950/20 p-6 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-zinc-900/30 hover:shadow-xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(260px 200px at 20% 10%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(420px 320px at 110% 120%, rgba(63,63,70,0.35), transparent 60%)",
        }}
      />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm tracking-tight text-zinc-400">{title}</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <Icon className="h-5 w-5 text-violet-300" />
          </div>
        </div>
        <div className="text-3xl font-light tracking-tight text-white">{value}</div>
        <div className="mt-1 text-sm tracking-tight text-zinc-500">{subValue}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    publicKey,
    snapshot,
    payoutRuns,
    activities,
    statusMessage,
    lastError,
    treasuryUtxoCount,
    runtime,
  } = useApp();
  const [isShieldOpen, setIsShieldOpen] = useState(false);
  const recentActivities = activities.slice(0, 4);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white">
            Treasury Overview
          </h1>
          <p className="mt-1 tracking-tight text-zinc-400">
            Shield capital, execute private payouts, and keep finance export-ready.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => setIsShieldOpen(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-violet-600/90 px-5 py-3 text-sm font-medium tracking-tight text-white transition-all hover:scale-[1.02] hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <Shield className="h-4 w-4" />
            Shield Funds
          </button>
          <div className="rounded-xl border border-white/10 bg-zinc-950/20 px-4 py-3 backdrop-blur-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Connected Wallet
            </div>
            <div className="mt-2 font-mono text-sm tracking-tight text-white">
              {publicKey ? truncateAddress(publicKey, 8, 8) : "No wallet"}
            </div>
          </div>
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
            <p className="text-sm tracking-tight">
              {lastError || statusMessage}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Shielded SOL"
          value={`${formatAmount(snapshot.shieldedSol, 2)} SOL`}
          subValue={`${treasuryUtxoCount} treasury UTXO${treasuryUtxoCount === 1 ? "" : "s"}`}
          icon={Shield}
        />
        <StatCard
          title="Shielded Stablecoins"
          value={`$${formatAmount(snapshot.shieldedUsdc + snapshot.shieldedUsdt)}`}
          subValue="Stable payouts quote through Jupiter"
          icon={Wallet}
        />
        <StatCard
          title="Private Volume"
          value={`$${formatAmount(snapshot.privateVolumeUsd)}`}
          subValue="Confirmed private outflows"
          icon={ArrowRightLeft}
        />
        <StatCard
          title="Audit Exports"
          value={String(snapshot.auditExports)}
          subValue="Finance-visible reports"
          icon={ShieldCheck}
        />
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-white/10 bg-zinc-950/20 p-6 backdrop-blur-xl xl:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl tracking-tight text-white">Recent Activity</h2>
              <p className="mt-1 text-sm tracking-tight text-zinc-500">
                Scanner results merge with local audit events and in-session runs.
              </p>
            </div>
            <Link
              href="/dashboard/history"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
            >
              Full history
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-sm tracking-tight text-zinc-400">
              Shield the first treasury deposit to create a real activity trail.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="text-sm tracking-tight text-white">
                      {activity.title}
                    </div>
                    <div className="mt-1 text-xs tracking-tight text-zinc-500">
                      {activity.type} • {formatDate(activity.createdAt)} •{" "}
                      {formatRelativeTime(activity.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm tracking-tight text-white">
                      Net {formatAmount(activity.netAmount)}{" "}
                      {activity.asset === "MULTI" ? "USD" : activity.asset}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-3 text-xs tracking-tight text-zinc-500">
                      <span>Fee {formatAmount(activity.feeAmount)}</span>
                      {activity.signature.startsWith("audit") ? null : (
                        <a
                          href={getSolanaExplorerUrl(
                            activity.signature,
                            "tx",
                            runtime.network,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-violet-300 transition hover:text-violet-200"
                        >
                          Tx
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/20 p-6 backdrop-blur-xl xl:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl tracking-tight text-white">Payout Queue</h2>
              <p className="mt-1 text-sm tracking-tight text-zinc-500">
                Sequential Cloak withdrawals run behind each payout batch.
              </p>
            </div>
            <Link
              href="/dashboard/payouts"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
            >
              Manage
              <Layers3 className="h-4 w-4" />
            </Link>
          </div>

          {payoutRuns.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-sm tracking-tight text-zinc-400">
              No payout runs yet. Shield funds first, then execute a SOL payout run
              from the payouts screen.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {payoutRuns.slice(0, 3).map((run) => (
                <div
                  key={run.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm tracking-tight text-white">
                        {run.title}
                      </div>
                      <div className="mt-1 text-xs tracking-tight text-zinc-500">
                        {run.totalRecipients} recipients • Created{" "}
                        {formatRelativeTime(run.createdAt)}
                      </div>
                    </div>
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
                  </div>
                  <div className="mt-3 text-sm tracking-tight text-white">
                    ${formatAmount(run.totalUsd)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ShieldFundsModal
        isOpen={isShieldOpen}
        onClose={() => setIsShieldOpen(false)}
      />
    </DashboardLayout>
  );
}
