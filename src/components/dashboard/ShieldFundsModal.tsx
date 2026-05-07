"use client";

import { useMemo, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Modal } from "./DashboardLayout";
import { useApp } from "@/lib/app/provider";
import { MIN_SHIELD_SOL } from "@/lib/cloak/amounts";
import { formatAmount } from "@/lib/utils/format";

export function ShieldFundsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    shieldFunds,
    isShielding,
    snapshot,
    clearStatus,
    operationLogs,
    clearOperationLogs,
  } = useApp();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const isValid = useMemo(
    () => Number.isFinite(numericAmount) && numericAmount >= MIN_SHIELD_SOL,
    [numericAmount],
  );

  const handleClose = () => {
    setAmount("");
    setError(null);
    clearStatus();
    clearOperationLogs();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;

    try {
      setError(null);
      await shieldFunds(numericAmount);
      handleClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Shield failed.",
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Shield Treasury Funds">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="shield-amount"
              className="block text-sm font-medium text-white"
            >
              Amount in SOL *
            </label>
            <input
              id="shield-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="2.50"
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "shield-error" : "shield-help"}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm tracking-tight text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
            />
            <p id="shield-help" className="text-xs tracking-tight text-zinc-500">
              Minimum shield deposit is {MIN_SHIELD_SOL} SOL. Cloak keeps deposits
              public on entry and private after the funds land in the pool.
            </p>
            {error ? (
              <p id="shield-error" className="text-xs tracking-tight text-red-300">
                {error}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!isValid || isShielding}
            aria-busy={isShielding}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium tracking-tight transition-all ${
              isValid && !isShielding
                ? "bg-violet-600 text-white hover:scale-[1.01] hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-300"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500"
            }`}
          >
            {isShielding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Shielding...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Shield Funds
              </>
            )}
          </button>
        </form>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" />
              <h3 className="text-lg tracking-tight text-white">Treasury Preview</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 py-2">
                <span className="text-sm tracking-tight text-zinc-400">
                  Current shielded balance
                </span>
                <span className="text-sm tracking-tight text-white">
                  {formatAmount(snapshot.shieldedSol, 2)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 py-2">
                <span className="text-sm tracking-tight text-zinc-400">
                  New deposit
                </span>
                <span className="text-sm tracking-tight text-white">
                  {isValid ? `${formatAmount(numericAmount, 2)} SOL` : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm tracking-tight text-zinc-400">
                  Post-shield balance
                </span>
                <span className="text-sm tracking-tight text-white">
                  {isValid
                    ? `${formatAmount(snapshot.shieldedSol + numericAmount, 2)} SOL`
                    : `${formatAmount(snapshot.shieldedSol, 2)} SOL`}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-4">
            <p className="text-xs leading-relaxed tracking-tight text-zinc-500">
              This action uses the real Cloak `transact` deposit path and stores
              the resulting treasury UTXO locally so the payout engine can spend it
              later without rebuilding the shell around mock state.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-sm tracking-tight text-white">Shield Trace</h4>
              <button
                type="button"
                onClick={clearOperationLogs}
                className="min-h-9 rounded-lg border border-white/10 px-3 text-xs tracking-tight text-zinc-300 transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
              >
                Clear
              </button>
            </div>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {operationLogs.length === 0 ? (
                <p className="text-xs leading-relaxed tracking-tight text-zinc-500">
                  Logs will appear here after you start shielding.
                </p>
              ) : null}
              {operationLogs.slice(0, 12).map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-white/5 bg-black/20 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-[11px] uppercase tracking-[0.18em] ${
                        log.status === "error"
                          ? "text-red-300"
                          : log.status === "success"
                            ? "text-emerald-300"
                            : log.status === "warning"
                              ? "text-amber-300"
                              : "text-zinc-400"
                      }`}
                    >
                      {log.stage}
                    </span>
                    <span className="text-[11px] tracking-tight text-zinc-600">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed tracking-tight text-zinc-400">
                    {log.message}
                  </p>
                  {log.details ? (
                    <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-black/30 p-2 text-[10px] leading-relaxed text-zinc-500">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
