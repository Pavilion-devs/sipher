"use client";

import { Copy, ExternalLink, Eye, Network, Settings2, Shield, Wallet } from "lucide-react";
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
    network,
    switchNetwork,
    viewingKey,
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
          title="Network"
          description="Switch between mainnet (live funds, Jupiter swaps) and devnet (free test funds, Pyth-priced mock USDC)."
          icon={Network}
        >
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => network !== "mainnet" && switchNetwork("mainnet")}
                className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium tracking-tight transition-all ${
                  network === "mainnet"
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                    : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Mainnet
              </button>
              <button
                type="button"
                onClick={() => network !== "devnet" && switchNetwork("devnet")}
                className={`inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium tracking-tight transition-all ${
                  network === "devnet"
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                    : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Devnet
              </button>
            </div>
            {network === "devnet" ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm tracking-tight text-amber-200">
                <p className="font-medium">You are on devnet.</p>
                <p className="mt-1 text-amber-300/70">
                  No real funds. SOL via{" "}
                  <a
                    href="https://faucet.solana.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    faucet.solana.com
                  </a>
                  . Mock USDC via{" "}
                  <a
                    href="https://devnet.cloak.ag/privacy/faucet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    devnet.cloak.ag/privacy/faucet
                  </a>
                  . Swaps use Pyth pricing. USDT is not available on devnet.
                </p>
              </div>
            ) : (
              <p className="text-sm tracking-tight text-zinc-500">
                Live mainnet. Real funds. Jupiter-routed stablecoin swaps. Switch to devnet to
                test without spending real SOL.
              </p>
            )}
          </div>
        </SettingCard>

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
                {network === "devnet" ? "@cloak.dev/sdk-devnet" : "@cloak.dev/sdk"}
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

        <SettingCard
          title="Viewing Key"
          description="Share this key with your accountant or auditor. They can use it to scan your private transaction history without needing your wallet."
          icon={Eye}
        >
          {viewingKey ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Treasury viewing key
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="truncate font-mono text-xs tracking-tight text-white">
                    {viewingKey}
                  </div>
                  <button
                    onClick={() => copyToClipboard(viewingKey)}
                    className="inline-flex shrink-0 min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
                <p className="text-sm tracking-tight text-violet-200">
                  Share this key to grant read-only audit access. It cannot sign transactions or move funds.
                </p>
                <a
                  href="/audit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 inline-flex shrink-0 min-h-10 items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-600/20 px-4 py-2 text-sm tracking-tight text-violet-200 transition-colors hover:bg-violet-600/30 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                >
                  Open Auditor View
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm tracking-tight text-zinc-500">
              Shield treasury funds first to generate your viewing key.
            </p>
          )}
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
