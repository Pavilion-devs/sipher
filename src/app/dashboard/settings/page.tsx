"use client";

import { Copy, ExternalLink, Settings2, Shield, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useApp } from "@/lib/app/provider";
import { copyToClipboard, truncateAddress } from "@/lib/utils/format";

function SettingCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/20 p-6 backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Icon className="h-5 w-5 text-violet-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg tracking-tight text-white">{title}</h3>
          <p className="mt-1 text-sm tracking-tight text-zinc-400">{description}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    publicKey,
    isConnected,
    walletLabel,
    availableWallets,
    runtime,
    hasTreasuryOwner,
    treasuryUtxoCount,
    historyCount,
  } = useApp();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-white">Settings</h1>
        <p className="mt-1 tracking-tight text-zinc-400">
          Runtime state for the live Cloak integration in this shell.
        </p>
      </div>

      <div className="grid gap-6">
        <SettingCard
          title="Wallet State"
          description="Injected wallet detection with transaction and message signing requirements."
          icon={Wallet}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Connected wallet
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="font-mono text-sm tracking-tight text-white">
                  {publicKey ? truncateAddress(publicKey, 8, 8) : "No wallet connected"}
                </div>
                {publicKey ? (
                  <button
                    onClick={() => copyToClipboard(publicKey)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                ) : null}
              </div>
              <div className="mt-2 text-xs tracking-tight text-zinc-500">
                Status: {isConnected ? `${walletLabel || "Wallet"} connected` : "Disconnected"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Detected wallets
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableWallets.length > 0 ? (
                  availableWallets.map((wallet) => (
                    <span
                      key={wallet.id}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-tight text-white"
                    >
                      {wallet.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm tracking-tight text-zinc-500">
                    No supported injected wallets detected.
                  </span>
                )}
              </div>
            </div>
          </div>
        </SettingCard>

        <SettingCard
          title="Cloak Runtime"
          description="Actual config values the current shell uses for deposits, withdrawals, and scans."
          icon={Shield}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                SDK
              </div>
              <div className="mt-2 text-sm tracking-tight text-white">
                @cloak.dev/sdk
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Network
              </div>
              <div className="mt-2 text-sm capitalize tracking-tight text-white">
                {runtime.network}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Program
              </div>
              <div className="mt-2 break-all text-sm tracking-tight text-white">
                {runtime.programId}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Relay
              </div>
              <div className="mt-2 break-all text-sm tracking-tight text-white">
                {runtime.relayUrl}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 md:col-span-2">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                RPC
              </div>
              <div className="mt-2 break-all text-sm tracking-tight text-white">
                {runtime.rpcUrl}
              </div>
            </div>
          </div>
        </SettingCard>

        <SettingCard
          title="Treasury State"
          description="Local Cloak wallet persistence that powers shielded balance and history scan state."
          icon={Settings2}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Treasury owner
              </div>
              <div className="mt-2 text-sm tracking-tight text-white">
                {hasTreasuryOwner ? "Generated" : "Not created yet"}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Stored UTXOs
              </div>
              <div className="mt-2 text-sm tracking-tight text-white">
                {treasuryUtxoCount}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Scanner history
              </div>
              <div className="mt-2 text-sm tracking-tight text-white">
                {historyCount} decoded txs
              </div>
            </div>
          </div>
        </SettingCard>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="text-sm font-medium tracking-tight text-violet-300">
            Source references
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <a
              href="https://docs.cloak.ag/sdk/utxo-transactions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
            >
              UTXO Transactions
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://docs.cloak.ag/sdk/wallet-integration"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
            >
              Wallet Integration
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://docs.cloak.ag/sdk/error-handling"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
            >
              Error Handling
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://developers.jup.ag/docs/api-reference/swap/v1/quote"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
            >
              Jupiter Quote API
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
