"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { Modal } from "./DashboardLayout";
import { useApp } from "@/lib/app/provider";
import {
  formatAmount,
  formatAssetAmount,
  isValidSolanaAddress,
  truncateAddress,
} from "@/lib/utils/format";
import type { Asset, PayoutRecipient } from "@/types";

type PayoutRecipientForm = Omit<PayoutRecipient, "amount"> & {
  amount: string;
};

const EMPTY_RECIPIENT = () =>
  ({
    id: crypto.randomUUID(),
    name: "",
    address: "",
    amount: "",
    asset: "SOL",
  }) satisfies PayoutRecipientForm;

function parseRecipientAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function toPayoutRecipient(recipient: PayoutRecipientForm): PayoutRecipient {
  return {
    ...recipient,
    amount: parseRecipientAmount(recipient.amount),
  };
}

function isDecimalInput(value: string) {
  return /^\d*(?:\.\d*)?$/.test(value);
}

function routeLabel(asset: Asset) {
  return asset === "SOL" ? "Direct withdraw" : `Cloak swap to ${asset}`;
}

export function CreatePayoutRunModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { createPayoutRun, isSubmittingRun, clearStatus, snapshot, network, solPriceUsd } = useApp();
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<PayoutRecipientForm[]>([
    EMPTY_RECIPIENT(),
  ]);

  const updateRecipient = (
    id: string,
    field: keyof PayoutRecipientForm,
    value: string | Asset,
  ) => {
    setRecipients((prev) =>
      prev.map((recipient) =>
        recipient.id === id ? { ...recipient, [field]: value } : recipient,
      ),
    );
  };

  const addRecipient = () => {
    setRecipients((prev) => [...prev, EMPTY_RECIPIENT()]);
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) =>
      prev.length === 1 ? prev : prev.filter((recipient) => recipient.id !== id),
    );
  };

  const validRecipients = useMemo(
    () =>
      recipients.map(toPayoutRecipient).filter(
        (recipient) =>
          recipient.name.trim() &&
          isValidSolanaAddress(recipient.address) &&
          recipient.amount > 0,
      ),
    [recipients],
  );

  const isValidForm = title.trim().length > 0 && validRecipients.length > 0;

  const totalUsd = useMemo(
    () =>
      recipients.reduce((sum, recipient) => {
        const amount = parseRecipientAmount(recipient.amount);
        const normalized =
          recipient.asset === "SOL" ? amount * solPriceUsd : amount;
        return sum + normalized;
      }, 0),
    [recipients],
  );

  const requiresSwap = recipients.some((recipient) => recipient.asset !== "SOL");

  const handleClose = () => {
    setTitle("");
    setNote("");
    setFormError(null);
    setStep("edit");
    setRecipients([EMPTY_RECIPIENT()]);
    clearStatus();
    onClose();
  };

  const handleSubmit = async () => {
    if (!isValidForm) return;

    try {
      setFormError(null);
      await createPayoutRun({ title, note, recipients: validRecipients });
      handleClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Payout run creation failed.",
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Payout Run">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          {step === "edit" ? (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="payout-run-title"
                  className="block text-sm font-medium text-white"
                >
                  Run Title *
                </label>
                <input
                  id="payout-run-title"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="April contractor run"
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm tracking-tight text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="payout-run-note"
                  className="block text-sm font-medium text-white"
                >
                  Internal Note <span className="text-zinc-500">(optional)</span>
                </label>
                <textarea
                  id="payout-run-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="One contractor payout run from the shielded treasury."
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm tracking-tight text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                />
              </div>

              <fieldset className="space-y-4 rounded-2xl border border-white/10 bg-zinc-950/30 p-5 backdrop-blur-xl">
                <legend className="px-1 text-lg tracking-tight text-white">
                  Recipients
                </legend>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm tracking-tight text-zinc-500">
                    SOL payouts withdraw directly. USDC and USDT payouts fetch a
                    Jupiter quote and execute through Cloak swap settlement.
                  </p>
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                <div className="space-y-4">
                  {recipients.map((recipient, index) => {
                    const hasInvalidAddress =
                      recipient.address.length > 0 &&
                      !isValidSolanaAddress(recipient.address);

                    return (
                      <div
                        key={recipient.id}
                        className="rounded-xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-sm tracking-tight text-white">
                            Recipient {index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRecipient(recipient.id)}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-black/20 px-3 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                            aria-label={`Remove recipient ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <label
                              htmlFor={`${recipient.id}-name`}
                              className="block text-xs uppercase tracking-[0.16em] text-zinc-500"
                            >
                              Recipient name
                            </label>
                            <input
                              id={`${recipient.id}-name`}
                              type="text"
                              autoComplete="off"
                              spellCheck={false}
                              value={recipient.name}
                              onChange={(event) =>
                                updateRecipient(recipient.id, "name", event.target.value)
                              }
                              placeholder="Nadia"
                              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm tracking-tight text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                            />
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor={`${recipient.id}-asset`}
                              className="block text-xs uppercase tracking-[0.16em] text-zinc-500"
                            >
                              Asset
                            </label>
                            <select
                              id={`${recipient.id}-asset`}
                              value={recipient.asset}
                              onChange={(event) =>
                                updateRecipient(
                                  recipient.id,
                                  "asset",
                                  event.target.value as Asset,
                                )
                              }
                              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm tracking-tight text-white focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                            >
                              <option value="SOL">SOL</option>
                              <option value="USDC">
                                {network === "devnet" ? "USDC (mock)" : "USDC"}
                              </option>
                              {network !== "devnet" ? (
                                <option value="USDT">USDT</option>
                              ) : null}
                            </select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label
                              htmlFor={`${recipient.id}-address`}
                              className="block text-xs uppercase tracking-[0.16em] text-zinc-500"
                            >
                              Recipient wallet address
                            </label>
                            <input
                              id={`${recipient.id}-address`}
                              type="text"
                              autoComplete="off"
                              spellCheck={false}
                              value={recipient.address}
                              onChange={(event) =>
                                updateRecipient(
                                  recipient.id,
                                  "address",
                                  event.target.value,
                                )
                              }
                              placeholder="Recipient Solana address"
                              aria-invalid={hasInvalidAddress ? "true" : undefined}
                              aria-describedby={
                                hasInvalidAddress ? `${recipient.id}-error` : undefined
                              }
                              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm tracking-tight text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                            />
                            {hasInvalidAddress ? (
                              <p
                                id={`${recipient.id}-error`}
                                className="text-xs tracking-tight text-red-300"
                              >
                                Enter a valid Solana address for this recipient.
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor={`${recipient.id}-amount`}
                              className="block text-xs uppercase tracking-[0.16em] text-zinc-500"
                            >
                              Amount
                            </label>
                            <input
                              id={`${recipient.id}-amount`}
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              spellCheck={false}
                              value={recipient.amount || ""}
                              onChange={(event) => {
                                const nextValue = event.target.value.replace(",", ".");

                                if (isDecimalInput(nextValue)) {
                                  updateRecipient(
                                    recipient.id,
                                    "amount",
                                    nextValue,
                                  );
                                }
                              }}
                              placeholder="0.001"
                              className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-sm tracking-tight text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/60"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              {formError ? (
                <p className="text-sm tracking-tight text-red-300">{formError}</p>
              ) : null}

              <button
                type="button"
                onClick={() => setStep("review")}
                disabled={!isValidForm}
                className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium tracking-tight transition-all ${
                  isValidForm
                    ? "bg-violet-600 text-white hover:scale-[1.01] hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-300"
                    : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                }`}
              >
                Review Run
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-violet-400" />
                  <h3 className="text-lg tracking-tight text-white">
                    Final Review
                  </h3>
                </div>
                <p className="mt-2 text-sm tracking-tight text-zinc-400">
                  Check routes, recipients, and treasury impact before signing.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 py-2">
                    <span className="text-sm tracking-tight text-zinc-400">
                      Run title
                    </span>
                    <span className="text-sm tracking-tight text-white">
                      {title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 py-2">
                    <span className="text-sm tracking-tight text-zinc-400">
                      Recipients
                    </span>
                    <span className="text-sm tracking-tight text-white">
                      {validRecipients.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 py-2">
                    <span className="text-sm tracking-tight text-zinc-400">
                      Estimated run size
                    </span>
                    <span className="text-sm tracking-tight text-white">
                      ${formatAmount(totalUsd)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm tracking-tight text-zinc-400">
                      Current shielded SOL
                    </span>
                    <span className="text-sm tracking-tight text-white">
                      {formatAmount(snapshot.shieldedSol, 2)} SOL
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {validRecipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
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
                          {routeLabel(recipient.asset)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {requiresSwap ? (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm tracking-tight text-violet-200">
                  Stablecoin recipients will fetch a fresh Jupiter quote during
                  execution. The exact swap input can move slightly before signing.
                </div>
              ) : null}

              {formError ? (
                <p className="text-sm tracking-tight text-red-300">{formError}</p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep("edit")}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-6 py-3 text-sm font-medium tracking-tight text-white transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-violet-300/60"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmittingRun}
                  aria-busy={isSubmittingRun}
                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium tracking-tight transition-all ${
                    !isSubmittingRun
                      ? "bg-violet-600 text-white hover:scale-[1.01] hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-300"
                      : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {isSubmittingRun ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing Run...
                    </>
                  ) : (
                    "Execute Run"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/30 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" />
              <h3 className="text-lg tracking-tight text-white">Run Preview</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 py-2">
                <span className="text-sm tracking-tight text-zinc-400">
                  Total recipients
                </span>
                <span className="text-sm tracking-tight text-white">
                  {validRecipients.length}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 py-2">
                <span className="text-sm tracking-tight text-zinc-400">
                  Estimated run size
                </span>
                <span className="text-sm tracking-tight text-white">
                  ${formatAmount(totalUsd)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 py-2">
                <span className="text-sm tracking-tight text-zinc-400">
                  Stable route required
                </span>
                <span className="text-sm tracking-tight text-white">
                  {requiresSwap ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm tracking-tight text-zinc-400">
                  Current shielded balance
                </span>
                <span className="text-sm tracking-tight text-white">
                  {formatAmount(snapshot.shieldedSol, 2)} SOL
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/20 p-4">
            <p className="text-xs leading-relaxed tracking-tight text-zinc-500">
              This run now has an explicit review step before execution. That keeps
              the high-stakes treasury action aligned with the actual flows:
              direct Cloak withdrawals for SOL, and quote-backed Cloak swaps for
              USDC and USDT.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
